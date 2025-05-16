const supabase = require('../config/supabase');
const { isValidUUID } = require('../utils/helpers');

/**
 * Get public profile of a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!isValidUUID(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    // Get user profile
    const { data: user, error } = await supabase
      .from('users')
      .select('id, full_name, role, profile_image, created_at')
      .eq('id', userId)
      .single();
    
    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get ratings stats
    const { data: ratings, error: ratingsError } = await supabase
      .from('ratings')
      .select('rating')
      .eq('to_user_id', userId);
    
    if (ratingsError) {
      console.error('Get ratings error:', ratingsError);
      // Not critical, continue with default values
    }
    
    // Calculate average rating
    let averageRating = 0;
    let totalRatings = 0;
    
    if (ratings && ratings.length > 0) {
      totalRatings = ratings.length;
      averageRating = ratings.reduce((sum, item) => sum + item.rating, 0) / totalRatings;
    }
    
    // For contractors, get completed jobs count
    let completedJobsCount = 0;
    
    if (user.role === 'contractor') {
      const { count, error: jobsError } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('contractor_id', userId)
        .eq('status', 'completed');
      
      if (!jobsError) {
        completedJobsCount = count || 0;
      }
    }
    
    // For customers, get posted jobs count
    let postedJobsCount = 0;
    
    if (user.role === 'customer') {
      const { count, error: jobsError } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', userId);
      
      if (!jobsError) {
        postedJobsCount = count || 0;
      }
    }
    
    return res.status(200).json({
      user: {
        id: user.id,
        fullName: user.full_name,
        role: user.role,
        profileImage: user.profile_image,
        createdAt: user.created_at,
        completedJobsCount: user.role === 'contractor' ? completedJobsCount : undefined,
        postedJobsCount: user.role === 'customer' ? postedJobsCount : undefined,
        ratings: {
          average: Math.round(averageRating * 10) / 10,
          total: totalRatings
        }
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update current user's profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, address, profileImage } = req.body;
    const userId = req.user.userId;
    
    // Prepare update data
    const updateData = {};
    if (fullName) updateData.full_name = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (profileImage !== undefined) updateData.profile_image = profileImage;
    
    // Update user profile
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Update profile error:', error);
      return res.status(400).json({ error: 'Failed to update profile' });
    }
    
    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.full_name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        address: updatedUser.address,
        profileImage: updatedUser.profile_image
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Search for contractors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const searchContractors = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;
    
    // Calculate pagination values
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Start query builder
    let dbQuery = supabase
      .from('users')
      .select('id, full_name, profile_image, created_at', { count: 'exact' })
      .eq('role', 'contractor')
      .order('full_name', { ascending: true })
      .range(from, to);
    
    if (query) {
      dbQuery = dbQuery.ilike('full_name', `%${query}%`);
    }
    
    // Execute query
    const { data: contractors, error, count } = await dbQuery;
    
    if (error) {
      console.error('Search contractors error:', error);
      return res.status(400).json({ error: 'Failed to search contractors' });
    }
    
    // Get ratings for each contractor
    const contractorIds = contractors.map(c => c.id);
    let contractorRatings = {};
    
    if (contractorIds.length > 0) {
      const { data: ratings, error: ratingsError } = await supabase
        .from('ratings')
        .select('to_user_id, rating')
        .in('to_user_id', contractorIds);
      
      if (!ratingsError && ratings) {
        // Group ratings by contractor ID
        contractorRatings = ratings.reduce((acc, rating) => {
          if (!acc[rating.to_user_id]) {
            acc[rating.to_user_id] = { sum: 0, count: 0 };
          }
          acc[rating.to_user_id].sum += rating.rating;
          acc[rating.to_user_id].count += 1;
          return acc;
        }, {});
      }
    }
    
    // Add rating information to contractors
    const enrichedContractors = contractors.map(contractor => {
      const rating = contractorRatings[contractor.id];
      const averageRating = rating ? Math.round((rating.sum / rating.count) * 10) / 10 : 0;
      const totalRatings = rating ? rating.count : 0;
      
      return {
        id: contractor.id,
        fullName: contractor.full_name,
        profileImage: contractor.profile_image,
        createdAt: contractor.created_at,
        ratings: {
          average: averageRating,
          total: totalRatings
        }
      };
    });
    
    return res.status(200).json({
      contractors: enrichedContractors,
      pagination: {
        totalCount: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Search contractors error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  searchContractors
};
