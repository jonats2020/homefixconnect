import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Create auth context
const AuthContext = createContext();

const API_URL = 'http://localhost:8000';

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from AsyncStorage
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load auth from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  // Register a new user
  const register = async (
    email,
    password,
    fullName,
    role,
    phone = null,
    address = null
  ) => {
    try {
      console.log(`${API_URL}/api/auth/register`);
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        fullName,
        role,
        phone,
        address,
      });

      const { token: newToken, user: newUser } = response.data;

      // Save to AsyncStorage
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      // Update state
      setToken(newToken);
      setUser(newUser);

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          'Registration failed. Please try again.',
      };
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      const { token: newToken, user: newUser } = response.data;

      // Save to AsyncStorage
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      // Update state
      setToken(newToken);
      setUser(newUser);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          'Login failed. Please check your credentials.',
      };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      // Call logout API if needed
      if (token) {
        try {
          await axios.post(
            `${API_URL}/api/auth/logout`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } catch (error) {
          console.error('API logout error:', error);
          // Continue with local logout even if API call fails
        }
      }

      // Clear AsyncStorage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');

      // Update state
      setToken(null);
      setUser(null);

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: error.message || 'Failed to logout. Please try again.',
      };
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!token;
  };

  // Update user profile locally after API update
  const updateUserProfile = async (updatedUser) => {
    try {
      const mergedUser = { ...user, ...updatedUser };
      await AsyncStorage.setItem('user', JSON.stringify(mergedUser));
      setUser(mergedUser);
      return { success: true };
    } catch (error) {
      console.error('Update user profile error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update profile locally.',
      };
    }
  };

  // Provide auth context
  const value = {
    user,
    token,
    isLoading,
    register,
    login,
    logout,
    isAuthenticated,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};