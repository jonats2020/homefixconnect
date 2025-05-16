const supabase = require('../config/supabase');
const { isValidUUID } = require('../utils/helpers');

/**
 * Create a rating for a completed job
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createRating = async (req, res) => {
  try {
    const { jobId, toUserId, rating, comment } = req.body;
    const fromUserId = req.user.userId;
    
    // Validate input
    if (!jobId || !toUserId || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!isValidUUID(jobId) || !isValidUUID(toUserId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    if (toUserId === fromUserId) {
      return res.status(400).json({ error: 'Cannot rate yourself' });
    }
    
    if (isNaN(parseInt(rating)) || parseInt(rating) < 1 || parseInt(rating) > 5) {
      return res.status(400).json({ error: 'Rating must be a number between 1 and 5' });
    }
    
    // Check if job exists and is completed
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (jobError || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Can only rate completed jobs' });
    }
    
    // Check if user is part of the job
    const isCustomer = job.customer_id === fromUserId;
    const isContractor = job.contractor_id === fromUserId;
    
    if (!isCustomer && !isContractor) {
      return res.status(403).json({ error: 'Only parties involved in the job can leave ratings' });
    }
    
    // Verify that the user being rated is the other party in the job
    const validToUserId = isCustomer ? job.contractor_id : job.customer_id;
    
    if (toUserId !== validToUserId) {
      return res.status(400).json({ error: 'Can only rate the other party involved in the job' });
    }
    
    // Check if rating already exists
    const { data: existingRating, error: ratingError } = await supabase
      .from('ratings')
      .select('*')
      .eq('job_id', jobId)
      .eq('from_user_id', fromUserId)
      .eq('to_user_id', toUserId)
      .single();
    
    if (existingRating) {
      return res.status(400).json({ error: 'You have already rated this user for this job' });
    }
    
    // Create the rating
    const { data: newRating, error } = await supabase
      .from('ratings')
      .insert({
        job_id: jobId,
        from_user_id: fromUserId,
        to_user_id: toUserId,
        rating: parseInt(rating),
        comment: comment || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Create rating error:', error);
      return res.status(400).json({ error: 'Failed to create rating' });
    }
    
    return res.status(201).json({
      message: 'Rating submitted successfully',
      rating: newRating
    });

  } catch (error) {
    console.error('Create rating error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get ratings for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    if (!isValidUUID(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    // Calculate pagination values
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get ratings for the user
    const { data: ratings, error, count } = await supabase
      .from('ratings')
      .select(`
        *,
        from_user:from_user_id(id, full_name, profile_image),
        job:job_id(id, title)
      `, { count: 'exact' })
      .eq('to_user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error('Get user ratings error:', error);
      return res.status(400).json({ error: 'Failed to fetch ratings' });
    }
    
    // Get average rating
    const { data: avgRating, error: avgError } = await supabase
      .from('ratings')
      .select('rating')
      .eq('to_user_id', userId);
    
    if (avgError) {
      console.error('Get average rating error:', avgError);
      // Not critical, continue
    }
    
    let averageRating = 0;
    let totalRatings = 0;
    
    if (avgRating && avgRating.length > 0) {
      totalRatings = avgRating.length;
      averageRating = avgRating.reduce((sum, item) => sum + item.rating, 0) / totalRatings;
    }
    
    return res.status(200).json({
      ratings,
      stats: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings
      },
      pagination: {
        totalCount: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get user ratings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get ratings for a job
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getJobRatings = async (req, res) => {
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
    
    // Get ratings for the job
    const { data: ratings, error } = await supabase
      .from('ratings')
      .select(`
        *,
        from_user:from_user_id(id, full_name, profile_image),
        to_user:to_user_id(id, full_name, profile_image)
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Get job ratings error:', error);
      return res.status(400).json({ error: 'Failed to fetch ratings' });
    }
    
    return res.status(200).json({
      ratings
    });

  } catch (error) {
    console.error('Get job ratings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createRating,
  getUserRatings,
  getJobRatings
};
