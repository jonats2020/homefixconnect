const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { validateEmail, validatePassword } = require('../utils/helpers');

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const register = async (req, res) => {
  try {
    const { email, password, fullName, role, phone, address } = req.body;

    // Validate input
    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters with letters and numbers' });
    }

    if (role !== 'customer' && role !== 'contractor') {
      return res.status(400).json({ error: 'Role must be either customer or contractor' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Register user using Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Insert user profile data after successful auth registration
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email,
          full_name: fullName,
          role,
          phone: phone || null,
          address: address || null,
          profile_image: null,
        }
      ])
      .select()
      .single();

    if (userError) {
      // If user profile creation fails, log the error
      console.error('User profile creation failed:', userError);
      
      // Attempt to delete the auth user to maintain consistency
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return res.status(500).json({ error: 'Failed to create user profile' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: userData.id, email: userData.email, role: userData.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name,
        role: userData.role,
        phone: userData.phone,
        address: userData.address,
        profileImage: userData.profile_image,
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Login user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.error('Email and password are required');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Authenticate user with Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      console.error('Invalid credentials');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user profile data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError || !userData) {
      console.error('User profile not found');
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: userData.id, email: userData.email, role: userData.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name,
        role: userData.role,
        phone: userData.phone,
        address: userData.address,
        profileImage: userData.profile_image,
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get current user data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      user: {
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name,
        role: userData.role,
        phone: userData.phone,
        address: userData.address,
        profileImage: userData.profile_image,
        createdAt: userData.created_at,
      }
    });

  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Logout user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logout = async (req, res) => {
  try {
    // For JWT tokens, the client should simply stop using the token
    // Here we just confirm the logout was successful
    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Reset password request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (userError || !existingUser) {
      // For security reasons, still return success even if user doesn't exist
      return res.status(200).json({ message: 'Password reset email sent if account exists' });
    }

    // Send password reset email via Supabase Auth
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.PASSWORD_RESET_REDIRECT_URL,
    });

    if (resetError) {
      console.error('Password reset error:', resetError);
      return res.status(500).json({ error: 'Failed to send password reset email' });
    }

    return res.status(200).json({ message: 'Password reset email sent if account exists' });

  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  logout,
  requestPasswordReset
};
