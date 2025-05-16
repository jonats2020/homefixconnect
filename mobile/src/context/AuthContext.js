import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import axios from 'axios';
import { API_URL } from '../utils/config';

// Create context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored token on app start
  useEffect(() => {
    const loadStoredToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Set default auth header for axios
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (error) {
        console.error('Failed to load auth data', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredToken();
  }, []);

  // Register user
  const register = async (email, password, fullName, role, phone = '', address = '') => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        fullName,
        role,
        phone,
        address
      });

      const { token: newToken, user: userData } = response.data;
      
      // Store token and user data
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      // Update state
      setToken(newToken);
      setUser(userData);
      
      // Set default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      return { success: false, message };
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });

      const { token: newToken, user: userData } = response.data;
      
      // Store token and user data
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      // Update state
      setToken(newToken);
      setUser(userData);
      
      // Set default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      return { success: false, message };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      // Clear stored data
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      // Reset state
      setToken(null);
      setUser(null);
      
      // Clear auth header
      delete axios.defaults.headers.common['Authorization'];
      
      return { success: true };
    } catch (error) {
      console.error('Logout error', error);
      return { success: false, message: 'Failed to logout' };
    }
  };

  // Get current user from server
  const refreshUser = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`);
      const userData = response.data.user;
      
      // Update stored user data
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      // Update state
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to refresh user data', error);
      
      // If token is invalid, logout
      if (error.response?.status === 401) {
        logout();
      }
      
      return { success: false };
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const response = await axios.put(`${API_URL}/api/users/profile`, userData);
      
      const updatedUser = response.data.user;
      
      // Update stored user data
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update state
      setUser(updatedUser);
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update profile';
      return { success: false, message };
    }
  };

  // Value provided to consumers
  const value = {
    user,
    token,
    isLoading,
    register,
    login,
    logout,
    refreshUser,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};