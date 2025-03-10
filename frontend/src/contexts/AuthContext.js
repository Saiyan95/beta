import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { initSocket, disconnectSocket } from '../utils/socket';
import { API_URL } from '../utils/apiConfig';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to log detailed errors
  const logErrorDetails = (error, context) => {
    console.error(`${context} - Error:`, error.message);
    if (error.response) {
      console.error(`${context} - Status:`, error.response.status);
      console.error(`${context} - Response data:`, error.response.data);
    }
    if (error.request) {
      console.error(`${context} - No response received, request data:`, error.request);
    }
  };

  useEffect(() => {
    // Check if user is logged in on page load
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // Set default authorization header for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Initialize socket connection with auth token
      initializeSocket(token);
    }
    
    setLoading(false);
  }, []);

  // Initialize socket with authentication token
  const initializeSocket = (token) => {
    try {
      initSocket(token);
    } catch (error) {
      console.error('Socket initialization error:', error);
    }
  };

  // Register a new user
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Registering with data:', {...userData, password: '[HIDDEN]'});
      console.log('API URL being used:', API_URL);
      
      // Validate required fields before sending to the server
      const requiredFields = ['username', 'email', 'password', 'firstName', 'lastName'];
      const missingFields = requiredFields.filter(field => !userData[field]);
      
      if (missingFields.length > 0) {
        const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Updated endpoint to match backend expectations
      const response = await axios.post(
        `${API_URL}/auth/register`,
        userData
      );

      console.log('Registration response:', response.data);
      
      // Handle response based on structure
      const { user, token } = response.data;
      
      // Store auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set default header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Update state
      setUser(user);
      
      // Initialize socket with the new token
      initializeSocket(token);
      
      return user;
    } catch (error) {
      logErrorDetails(error, 'Registration');
      setError(error.response?.data?.message || error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (identifier, password, role) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Attempting login with identifier: ${identifier}`);
      
      // Use correct login API endpoint
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: identifier, // Send as email to maintain backend compatibility
        password
      });

      const { user, token } = response.data;
      
      // Verify role matches if role parameter was provided
      if (role && user.role !== role) {
        throw new Error(`Unauthorized: ${role} access only`);
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set default header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      
      // Initialize socket with the new token
      initializeSocket(token);
      
      return user;
    } catch (error) {
      logErrorDetails(error, 'Login');
      setError(error.response?.data?.message || error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Remove auth header
    delete axios.defaults.headers.common['Authorization'];
    
    setUser(null);
    
    // Close socket connection
    disconnectSocket();
  };

  // Provide auth context values
  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
