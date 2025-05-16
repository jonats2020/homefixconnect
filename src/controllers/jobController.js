const supabase = require('../config/supabase');
const { isValidUUID } = require('../utils/helpers');

/**
 * Create a new job
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createJob = async (req, res) => {
  try {
    const { title, description, category, location, budget, images } = req.body;
    const customerId = req.user.userId;
    
    // Validate input
    if (!title || !description || !category || !budget) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Only customers can post jobs' });
    }

    // Create job in database
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        title,
        description,
        customer_id: customerId,
        category,
        location: location || null,
        budget: parseFloat(budget),
        status: 'open',
        images: images || null
      })
      .select()
      .single();

    if (error) {
      console.error('Create job error:', error);
      return res.status(400).json({ error: 'Failed to create job' });
    }

    return res.status(201).json({
      message: 'Job created successfully',
      job
    });

  } catch (error) {
    console.error('Create job error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all jobs with optional filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getJobs = async (req, res) => {
  try {
    const { category, status, location, minBudget, maxBudget, customerId, page = 1, limit = 10 } = req.query;
    
    // Calculate pagination values
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Start query builder
    let query = supabase
      .from('jobs')
      .select(`
        *,
        customer:customer_id(id, full_name, email, profile_image),
        contractor:contractor_id(id, full_name, email, profile_image),
        bids:bids(count)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    
    // Apply filters if provided
    if (category) {
      query = query.eq('category', category);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (location) {
      query = query.ilike('location', `%${location}%`);
    }
    
    if (minBudget) {
      query = query.gte('budget', parseFloat(minBudget));
    }
    
    if (maxBudget) {
      query = query.lte('budget', parseFloat(maxBudget));
    }
    
    if (customerId && isValidUUID(customerId)) {
      query = query.eq('customer_id', customerId);
    }
    
    // Execute query
    const { data: jobs, error, count } = await query;
    
    if (error) {
      console.error('Get jobs error:', error);
      return res.status(400).json({ error: 'Failed to fetch jobs' });
    }
    
    // Format the response with pagination metadata
    return res.status(200).json({
      jobs,
      pagination: {
        totalCount: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get jobs error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get a specific job by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid job ID format' });
    }
    
    // Get job with related data
    const { data: job, error } = await supabase
      .from('jobs')
      .select(`
        *,
        customer:customer_id(id, full_name, email, profile_image),
        contractor:contractor_id(id, full_name, email, profile_image),
        bids(*, contractor:contractor_id(id, full_name, email, profile_image))
      `)
      .eq('id', id)
      .single();
    
    if (error || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Check if user is the customer or contractor for this job
    const isCustomer = job.customer_id === req.user.userId;
    const isContractor = job.contractor_id === req.user.userId;
    
    // If user is not the customer, remove contractor bid details if they're a contractor
    if (!isCustomer && req.user.role === 'contractor' && !isContractor) {
      // Filter out other contractors' bid details
      job.bids = job.bids.map(bid => {
        if (bid.contractor_id !== req.user.userId) {
          return {
            id: bid.id,
            job_id: bid.job_id,
            contractor: bid.contractor,
            status: bid.status,
            created_at: bid.created_at,
            // Remove sensitive bid details
            amount: null,
            proposal: null,
            estimated_days: null
          };
        }
        return bid;
      });
    }
    
    return res.status(200).json({ job });

  } catch (error) {
    console.error('Get job by ID error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update a job
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, location, budget, status, images } = req.body;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid job ID format' });
    }
    
    // Check if job exists and belongs to the user
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Check permissions: only job owner (customer) can update their jobs
    if (existingJob.customer_id !== req.user.userId) {
      return res.status(403).json({ error: 'You do not have permission to update this job' });
    }
    
    // Validate status transition
    if (status && status !== existingJob.status) {
      const validTransitions = {
        'open': ['cancelled', 'in_progress'],
        'in_progress': ['completed', 'cancelled'],
        'completed': [], // Cannot change from completed
        'cancelled': [] // Cannot change from cancelled
      };
      
      if (!validTransitions[existingJob.status].includes(status)) {
        return res.status(400).json({ 
          error: `Cannot change job status from '${existingJob.status}' to '${status}'` 
        });
      }
      
      // If transitioning to in_progress, ensure a contractor is assigned
      if (status === 'in_progress' && !existingJob.contractor_id) {
        return res.status(400).json({ error: 'Cannot start job without an assigned contractor' });
      }
    }
    
    // Prepare update data
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (location !== undefined) updateData.location = location;
    if (budget) updateData.budget = parseFloat(budget);
    if (status) updateData.status = status;
    if (images) updateData.images = images;
    
    // Only allow updating certain fields if job is still open
    if (existingJob.status !== 'open' && (title || description || category || budget || location)) {
      return res.status(400).json({ 
        error: 'Can only update job details when the job is in open status' 
      });
    }
    
    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();
    
    // Update job
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Update job error:', updateError);
      return res.status(400).json({ error: 'Failed to update job' });
    }
    
    return res.status(200).json({
      message: 'Job updated successfully',
      job: updatedJob
    });

  } catch (error) {
    console.error('Update job error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete a job
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid job ID format' });
    }
    
    // Check if job exists and belongs to the user
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Check permissions: only job owner (customer) can delete their jobs
    if (existingJob.customer_id !== req.user.userId) {
      return res.status(403).json({ error: 'You do not have permission to delete this job' });
    }
    
    // Only allow deletion if job is open and has no bids
    if (existingJob.status !== 'open') {
      return res.status(400).json({ error: 'Can only delete jobs that are in open status' });
    }
    
    // Check if there are any bids on the job
    const { count: bidCount, error: bidCountError } = await supabase
      .from('bids')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', id);
    
    if (bidCountError) {
      console.error('Error checking bids:', bidCountError);
      return res.status(500).json({ error: 'Failed to check if job has bids' });
    }
    
    if (bidCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete job with existing bids. Consider cancelling it instead.' 
      });
    }
    
    // Delete job
    const { error: deleteError } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Delete job error:', deleteError);
      return res.status(400).json({ error: 'Failed to delete job' });
    }
    
    return res.status(200).json({
      message: 'Job deleted successfully'
    });

  } catch (error) {
    console.error('Delete job error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Assign a contractor to a job
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const assignContractor = async (req, res) => {
  try {
    const { jobId, bidId } = req.body;
    
    if (!isValidUUID(jobId) || !isValidUUID(bidId)) {
      return res.status(400).json({ error: 'Invalid job ID or bid ID format' });
    }
    
    // Check if job exists and belongs to the user
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (jobError || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Verify user is the customer for this job
    if (job.customer_id !== req.user.userId) {
      return res.status(403).json({ error: 'Only the job owner can assign a contractor' });
    }
    
    // Verify job is in the correct status
    if (job.status !== 'open') {
      return res.status(400).json({ error: 'Can only assign contractor to jobs in open status' });
    }
    
    // Check if the bid exists and is for the correct job
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .select('*')
      .eq('id', bidId)
      .eq('job_id', jobId)
      .single();
    
    if (bidError || !bid) {
      return res.status(404).json({ error: 'Bid not found for this job' });
    }
    
    // Start a transaction to update both the job and the bid status
    // (Supabase doesn't directly support transactions, so we'll do our best to make this atomic)
    
    // Update the job with the contractor
    const { data: updatedJob, error: updateJobError } = await supabase
      .from('jobs')
      .update({
        contractor_id: bid.contractor_id,
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select()
      .single();
    
    if (updateJobError) {
      console.error('Update job error:', updateJobError);
      return res.status(400).json({ error: 'Failed to assign contractor to the job' });
    }
    
    // Update the winning bid status
    const { error: updateBidError } = await supabase
      .from('bids')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', bidId);
    
    if (updateBidError) {
      console.error('Update bid error:', updateBidError);
      
      // Try to roll back the job update if bid update fails
      await supabase
        .from('jobs')
        .update({
          contractor_id: null,
          status: 'open',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
      
      return res.status(400).json({ error: 'Failed to update bid status' });
    }
    
    // Update other bids for this job to rejected
    const { error: rejectBidsError } = await supabase
      .from('bids')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('job_id', jobId)
      .neq('id', bidId);
    
    if (rejectBidsError) {
      console.error('Reject other bids error:', rejectBidsError);
      // Not critical, so continue without rolling back
    }
    
    return res.status(200).json({
      message: 'Contractor assigned successfully',
      job: updatedJob
    });

  } catch (error) {
    console.error('Assign contractor error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get jobs for the current user (customer's jobs or contractor's assigned jobs)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMyJobs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const { status, page = 1, limit = 10 } = req.query;
    
    // Calculate pagination values
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    let query = supabase
      .from('jobs')
      .select(`
        *,
        customer:customer_id(id, full_name, email, profile_image),
        contractor:contractor_id(id, full_name, email, profile_image),
        bids:bids(count)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (role === 'customer') {
      query = query.eq('customer_id', userId);
    } else if (role === 'contractor') {
      query = query.eq('contractor_id', userId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: jobs, error, count } = await query;
    
    if (error) {
      console.error('Get my jobs error:', error);
      return res.status(400).json({ error: 'Failed to fetch jobs' });
    }
    
    return res.status(200).json({
      jobs,
      pagination: {
        totalCount: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get my jobs error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  assignContractor,
  getMyJobs
};
