import React, { createContext, useContext } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { API_URL } from '../utils/config';

// Create context
const APIContext = createContext();

// Custom hook to use the API context
export const useAPI = () => {
  return useContext(APIContext);
};

// Provider component
export const APIProvider = ({ children }) => {
  const { token } = useAuth();

  // Configure axios instance with auth header
  const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  });

  // Jobs API
  const jobsAPI = {
    // Get all jobs with optional filtering
    getJobs: async (filters = {}) => {
      try {
        const response = await apiClient.get('/api/jobs', { params: filters });
        return { success: true, data: response.data };
      } catch (error) {
        return handleError(error);
      }
    },
    
    // Get jobs for current user
    getMyJobs: async (filters = {}) => {
      try {
        const response = await apiClient.get('/api/jobs/my', { params: filters });
        return { success: true, data: response.data };
      } catch (error) {
        return handleError(error);
      }
    },
    
    // Get a specific job by ID
    getJobById: async (jobId) => {
      try {
        const response = await apiClient.get(`/api/jobs/${jobId}`);
        return { success: true, data: response.data };
      } catch (error) {
        return handleError(error);
      }
    },
    
    // Create a new job
    createJob: async (jobData) => {
      try {
        const response = await apiClient.post('/api/jobs', jobData);
        return { success: true, data: response.data };
      } catch (error) {
        return handleError(error);
      }
    },
    
    // Update a job
    updateJob: async (jobId, jobData) => {
      try {
        const response = await apiClient.put(`/api/jobs/${jobId}`, jobData);
        return { success: true, data: response.data };
      } catch (error) {
        return handleError(error);
      }
    },
    
    // Delete a job
    deleteJob: async (jobId) => {
      try {
        const response = await apiClient.delete(`/api/jobs/${jobId}`);
        return { success: true, data: response.data };
      } catch (error) {
        return handleError(error);
      }
    },
    
    // Assign a contractor to a job
    assignContractor: async (jobId, bidId) => {
      try {
        const response = await apiClient.post('/api/jobs/assign', { jobId, bidId });
        return { success: true, data: response.data };
      } catch (error) {
        return handleError(error);
      }
    }
  };

  // Bids API
  const bidsAPI = {
    // Create a bid
    createBid: async (bidData) => {
      try {
        const response = await apiClient.post('/api/bids', bidData);
        return { success: true, data: response.data };
      } catch (error) {
        return handleError(error);
      }
    },
    
    // Get bids for a job
    getBidsForJob: async (jobId) => {
      try {
        const response = await apiClient.get(`/api/bids/job/${jobId}`);
        return { success: true, data: response.data };
      } catch (error) {
        return handleError(error);
      }
    },
    
    // Get my bids (for contractors)
    getMyBids: async (filters = {}) => {
      try {
        const response = await apiClient.get('/api/bids/my', { params: filters });
        return { success: true, data: response.data };
      } catch (error) {
        return handleError(error);
      }
    },
    
    // Update a bid
    updateBid: async (bidId, bidData) => {
      try {
        const response = await apiClient.put(`/api/bids/${bidId}`, bidData);
        return { success: true, data: response.data };
      } catch (error) {
        return handleError(error);
      }
    },
    
    // Delete a bid
    deleteBid: async (bidId) => {
      try {
        const response = await apiClient.delete(`/api/bids/${bidId}`);
        return { success: true, data: response.data };
      } catch (error) {
        return handleError(error);
      }
    }
  };

  // Chat API
  const chatAPI = {
    // Get or create a conversation
    getOrCreateConversation: async (otherUserId) => {
      try {
        const response = await apiClient.post('/api/chats/conversation', { otherUserId });
        return { success: true, data: response.data };
      } catch (error) {
        return handleError(error);
      }
    },
    
    // Get all conversations
    getConversations: async () => {
      try {
        const response = await apiClient.get('/api/chats/conversations');
        return { success: true, data: response.data };
      } catch (error) {
        return handleError(error);
      }
    },
    
    // Send a message
    sendMessage: async (messageData) => {
      try {
        const response = await apiClient.post('/api/chats/message', messageData);
        return { success: true, data: response.data };
      } catch (error) {
        return handleError(error);
      }
    },
    
    // Get messages for a conversation
    getMessages: async (conversationId, page = 1) => {
      try {
        const response = await apiClient.get(`/api/chats/messages/${conversationId}`, {
          params: { page }
        });
        return { success: true, data: response.data };
      } catch (error) {
        return handleError(error);
      }
    },
    
    // Get unread message count
    getUnreadCount: async () => {
      try {
        const response = await apiClient.get('/api/chats/unread');
        return { success: true, data: response.data };
      } catch (error) {
        return handleError(error);
      }
    }
  };

  // User API
  const userAPI = {
    // Get a user's public profile
    getUserProfile: async (userId) => {
      try {
        const response = await apiClient.get(`/api/users/${userId}`);
        return { success: true, data: response.data };
      } catch (error) {
        return handleError(error);
      }
    },
    
    // Search for contractors
    searchContractors: async (query = '', page = 1) => {
      try {
        const response = await apiClient.get('/api/users/search/contractors', {
          params: { query, page }
        });
        return { success: true, data: response.data };
      } catch (error) {
        return handleError(error);
      }
    }
  };

  // Ratings API
  const ratingsAPI = {
    // Create a rating
    createRating: async (ratingData) => {
      try {
        const response = await apiClient.post('/api/ratings', ratingData);
        return { success: true, data: response.data };
      } catch (error) {
        return handleError(error);
      }
    },
    
    // Get ratings for a user
    getUserRatings: async (userId, page = 1) => {
      try {
        const response = await apiClient.get(`/api/ratings/user/${userId}`, {
          params: { page }
        });
        return { success: true, data: response.data };
      } catch (error) {
        return handleError(error);
      }
    },
    
    // Get ratings for a job
    getJobRatings: async (jobId) => {
      try {
        const response = await apiClient.get(`/api/ratings/job/${jobId}`);
        return { success: true, data: response.data };
      } catch (error) {
        return handleError(error);
      }
    }
  };

  // Handle API errors
  const handleError = (error) => {
    const errorMessage = error.response?.data?.error || 'An error occurred';
    return { success: false, message: errorMessage };
  };

  // Value provided to consumers
  const value = {
    jobs: jobsAPI,
    bids: bidsAPI,
    chat: chatAPI,
    users: userAPI,
    ratings: ratingsAPI
  };

  return (
    <APIContext.Provider value={value}>
      {children}
    </APIContext.Provider>
  );
};