import React, { createContext, useContext } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

// Create API context
const APIContext = createContext();

// Hook to use the API context
export const useAPI = () => useContext(APIContext);

// API Provider component
export const APIProvider = ({ children }) => {
  const { token } = useAuth();

  // Configure axios instance with authentication
  const api = axios.create({
    baseURL: 'http://localhost:8000', //process.env.EXPO_PUBLIC_API_URL
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add token to requests if available
  api.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Jobs API functions
  const jobs = {
    // Get all jobs with optional filtering
    getJobs: async (filters = {}) => {
      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value);
          }
        });

        const response = await api.get(`/api/jobs?${params.toString()}`);
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Get jobs error:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to fetch jobs',
        };
      }
    },

    // Get jobs for the current user
    getMyJobs: async () => {
      try {
        const response = await api.get(`/api/jobs/my`);
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Get my jobs error:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to fetch your jobs',
        };
      }
    },

    // Get a specific job by ID
    getJobById: async (jobId) => {
      try {
        const response = await api.get(`/api/jobs/${jobId}`);
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Get job error:', error);
        return {
          success: false,
          message:
            error.response?.data?.message || 'Failed to fetch job details',
        };
      }
    },

    // Create a new job
    createJob: async (jobData) => {
      try {
        const response = await api.post('/api/jobs', jobData);
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Create job error:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to create job',
        };
      }
    },

    // Update a job
    updateJob: async (jobId, jobData) => {
      try {
        const response = await api.put(`/api/jobs/${jobId}`, jobData);
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Update job error:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update job',
        };
      }
    },

    // Delete a job
    deleteJob: async (jobId) => {
      try {
        const response = await api.delete(`/api/jobs/${jobId}`);
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Delete job error:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to delete job',
        };
      }
    },

    // Assign a contractor to a job
    assignContractor: async (jobId, bidId) => {
      try {
        const response = await api.post('/api/jobs/assign', { jobId, bidId });
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Assign contractor error:', error);
        return {
          success: false,
          message:
            error.response?.data?.message || 'Failed to assign contractor',
        };
      }
    },
  };

  // Bids API functions
  const bids = {
    // Create a bid
    createBid: async (bidData) => {
      try {
        const response = await api.post('/api/bids', bidData);
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Create bid error:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to place bid',
        };
      }
    },

    // Get bids for a job
    getBidsForJob: async (jobId) => {
      try {
        const response = await api.get(`/api/bids/job/${jobId}`);
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Get job bids error:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to fetch bids',
        };
      }
    },

    // Get current contractor's bids
    getMyBids: async () => {
      try {
        const response = await api.get('/api/bids/my');
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Get my bids error:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to fetch your bids',
        };
      }
    },

    // Update a bid
    updateBid: async (bidId, bidData) => {
      try {
        const response = await api.put(`/api/bids/${bidId}`, bidData);
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Update bid error:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update bid',
        };
      }
    },

    // Delete a bid
    deleteBid: async (bidId) => {
      try {
        const response = await api.delete(`/api/bids/${bidId}`);
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Delete bid error:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to delete bid',
        };
      }
    },
  };

  // Chat API functions
  const chat = {
    // Get or create a conversation
    getOrCreateConversation: async (customerId, userId) => {
      try {
        const response = await api.post(`/api/chats/conversation`, {
          otherUserId: customerId,
          currentUserId: userId,
        });
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Get conversation error:', error);
        return {
          success: false,
          message:
            error.response?.data?.message || 'Failed to create conversation',
        };
      }
    },

    // Get all conversations
    getConversations: async () => {
      try {
        const response = await api.get('/api/chats/conversations');
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Get conversations error:', error);
        return {
          success: false,
          message:
            error.response?.data?.message || 'Failed to fetch conversations',
        };
      }
    },

    // Get messages for a conversation
    getMessages: async (conversationId) => {
      try {
        const response = await api.get(`/api/chats/messages/${conversationId}`);
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Get messages error:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to fetch messages',
        };
      }
    },

    // Send a message
    sendMessage: async (conversationId, receiverId, content, jobId = null) => {
      try {
        const messageData = {
          conversationId,
          receiverId,
          content,
          jobId,
        };

        const response = await api.post('/api/chats/message', messageData);
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Send message error:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to send message',
        };
      }
    },

    // Get unread message count
    getUnreadCount: async () => {
      try {
        const response = await api.get('/api/chats/unread');
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Get unread count error:', error);
        return {
          success: false,
          message:
            error.response?.data?.message || 'Failed to fetch unread count',
        };
      }
    },
  };

  // User API functions
  const users = {
    // Get user profile by ID
    getUserProfile: async (userId) => {
      try {
        const response = await api.get(`/api/users/${userId}`);
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Get user profile error:', error);
        return {
          success: false,
          message:
            error.response?.data?.message || 'Failed to fetch user profile',
        };
      }
    },

    // Update current user's profile
    updateProfile: async (profileData) => {
      try {
        const response = await api.put('/api/users/profile', profileData);
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Update profile error:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update profile',
        };
      }
    },

    // Search for contractors
    searchContractors: async (query) => {
      try {
        const response = await api.get(
          `/api/users/search/contractors?q=${query}`
        );
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Search contractors error:', error);
        return {
          success: false,
          message:
            error.response?.data?.message || 'Failed to search contractors',
        };
      }
    },
  };

  // Ratings API functions
  const ratings = {
    // Create a rating
    createRating: async (ratingData) => {
      try {
        const response = await api.post('/api/ratings', ratingData);
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Create rating error:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to submit rating',
        };
      }
    },

    // Get ratings for a user
    getUserRatings: async (userId) => {
      try {
        const response = await api.get(`/api/ratings/user/${userId}`);
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Get user ratings error:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to fetch ratings',
        };
      }
    },

    // Get ratings for a job
    getJobRatings: async (jobId) => {
      try {
        const response = await api.get(`/api/ratings/job/${jobId}`);
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Get job ratings error:', error);
        return {
          success: false,
          message:
            error.response?.data?.message || 'Failed to fetch job ratings',
        };
      }
    },
  };

  // Expose all API functions
  const value = {
    jobs,
    bids,
    chat,
    users,
    ratings,
  };

  return <APIContext.Provider value={value}>{children}</APIContext.Provider>;
};
