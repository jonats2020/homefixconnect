const supabase = require('../config/supabase');
const { isValidUUID } = require('../utils/helpers');

/**
 * Create a new bid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createBid = async (req, res) => {
  try {
    const { jobId, amount, proposal, estimatedDays } = req.body;
    const contractorId = req.user.userId;
    
    // Validate input
    if (!jobId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!isValidUUID(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID format' });
    }
    
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    
    if (req.user.role !== 'contractor') {
      return res.status(403).json({ error: 'Only contractors can place bids' });
    }
    
    // Check if job exists and is open
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (jobError || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (job.status !== 'open') {
      return res.status(400).json({ error: 'Can only bid on jobs with open status' });
    }
    
    if (job.customer_id === contractorId) {
      return res.status(400).json({ error: 'Cannot bid on your own job' });
    }
    
    // Check if contractor has already placed a bid
    const { data: existingBids, error: bidError } = await supabase
      .from('bids')
      .select('*')
      .eq('job_id', jobId)
      .eq('contractor_id', contractorId);
    
    if (bidError) {
      console.error('Check existing bids error:', bidError);
      return res.status(500).json({ error: 'Error checking existing bids' });
    }
    
    if (existingBids && existingBids.length > 0) {
      return res.status(400).json({ 
        error: 'You have already placed a bid on this job. Update your existing bid instead.' 
      });
    }
    
    // Create bid in database
    const { data: bid, error } = await supabase
      .from('bids')
      .insert({
        job_id: jobId,
        contractor_id: contractorId,
        amount: parseFloat(amount),
        proposal: proposal || null,
        estimated_days: estimatedDays ? parseInt(estimatedDays) : null,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Create bid error:', error);
      return res.status(400).json({ error: 'Failed to create bid' });
    }
    
    return res.status(201).json({
      message: 'Bid placed successfully',
      bid
    });

  } catch (error) {
    console.error('Create bid error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all bids for a job
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBidsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    if (!isValidUUID(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID format' });
    }
    
    // Check if job exists
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (jobError || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Check if user is authorized to view the bids
    const isJobOwner = job.customer_id === req.user.userId;
    
    // Get bids with contractor information
    const { data: bids, error } = await supabase
      .from('bids')
      .select(`
        *,
        contractor:contractor_id(id, full_name, email, profile_image)
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Get bids for job error:', error);
      return res.status(400).json({ error: 'Failed to fetch bids' });
    }
    
    // If the user is not the job owner, only return their own bid with full details
    if (!isJobOwner) {
      const filteredBids = bids.map(bid => {
        if (bid.contractor_id === req.user.userId) {
          return bid;
        } else {
          // Return limited information for other bids
          return {
            id: bid.id,
            job_id: bid.job_id,
            contractor: bid.contractor,
            status: bid.status,
            created_at: bid.created_at,
            // Hide sensitive bid details
            amount: null,
            proposal: null,
            estimated_days: null
          };
        }
      });
      
      return res.status(200).json({ bids: filteredBids });
    }
    
    return res.status(200).json({ bids });

  } catch (error) {
    console.error('Get bids for job error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all bids by the current contractor
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMyBids = async (req, res) => {
  try {
    const contractorId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;
    
    if (req.user.role !== 'contractor') {
      return res.status(403).json({ error: 'Only contractors can access their bids' });
    }
    
    // Calculate pagination values
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Build query
    let query = supabase
      .from('bids')
      .select(`
        *,
        job:job_id(id, title, description, budget, status, customer_id, 
        customer:customer_id(id, full_name, profile_image))
      `, { count: 'exact' })
      .eq('contractor_id', contractorId)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    // Execute query
    const { data: bids, error, count } = await query;
    
    if (error) {
      console.error('Get my bids error:', error);
      return res.status(400).json({ error: 'Failed to fetch bids' });
    }
    
    return res.status(200).json({
      bids,
      pagination: {
        totalCount: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get my bids error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update a bid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateBid = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, proposal, estimatedDays } = req.body;
    const contractorId = req.user.userId;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid bid ID format' });
    }
    
    // Check if bid exists and belongs to the user
    const { data: existingBid, error: fetchError } = await supabase
      .from('bids')
      .select('*, job:job_id(status)')
      .eq('id', id)
      .single();
    
    if (fetchError || !existingBid) {
      return res.status(404).json({ error: 'Bid not found' });
    }
    
    // Check permissions
    if (existingBid.contractor_id !== contractorId) {
      return res.status(403).json({ error: 'You do not have permission to update this bid' });
    }
    
    // Check if bid can be updated (only pending bids for open jobs)
    if (existingBid.status !== 'pending') {
      return res.status(400).json({ error: 'Can only update pending bids' });
    }
    
    if (existingBid.job.status !== 'open') {
      return res.status(400).json({ error: 'Can only update bids for open jobs' });
    }
    
    // Prepare update data
    const updateData = {};
    if (amount) updateData.amount = parseFloat(amount);
    if (proposal !== undefined) updateData.proposal = proposal;
    if (estimatedDays !== undefined) updateData.estimated_days = estimatedDays ? parseInt(estimatedDays) : null;
    
    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();
    
    // Update bid
    const { data: updatedBid, error: updateError } = await supabase
      .from('bids')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Update bid error:', updateError);
      return res.status(400).json({ error: 'Failed to update bid' });
    }
    
    return res.status(200).json({
      message: 'Bid updated successfully',
      bid: updatedBid
    });

  } catch (error) {
    console.error('Update bid error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete a bid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteBid = async (req, res) => {
  try {
    const { id } = req.params;
    const contractorId = req.user.userId;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid bid ID format' });
    }
    
    // Check if bid exists and belongs to the user
    const { data: existingBid, error: fetchError } = await supabase
      .from('bids')
      .select('*, job:job_id(status)')
      .eq('id', id)
      .single();
    
    if (fetchError || !existingBid) {
      return res.status(404).json({ error: 'Bid not found' });
    }
    
    // Check permissions
    if (existingBid.contractor_id !== contractorId) {
      return res.status(403).json({ error: 'You do not have permission to delete this bid' });
    }
    
    // Check if bid can be deleted (only pending bids for open jobs)
    if (existingBid.status !== 'pending') {
      return res.status(400).json({ error: 'Can only delete pending bids' });
    }
    
    if (existingBid.job.status !== 'open') {
      return res.status(400).json({ error: 'Can only delete bids for open jobs' });
    }
    
    // Delete bid
    const { error: deleteError } = await supabase
      .from('bids')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Delete bid error:', deleteError);
      return res.status(400).json({ error: 'Failed to delete bid' });
    }
    
    return res.status(200).json({
      message: 'Bid deleted successfully'
    });

  } catch (error) {
    console.error('Delete bid error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createBid,
  getBidsForJob,
  getMyBids,
  updateBid,
  deleteBid
};
