/**
 * API Configuration
 * 
 * This file centralizes API URL configuration for the application.
 * It ensures consistent API endpoints across components.
 */

// Force port 5002 to ensure correct backend connection
const API_BASE_URL = 'http://localhost:5002';

// Log API configuration on startup
console.log('API Configuration (FORCED PORT 5002):', {
  API_BASE_URL,
  ENV_API_URL: process.env.REACT_APP_API_URL
});

export const API_URL = `${API_BASE_URL}/api`;

// Socket.io connection URL (same as API base URL)
export const SOCKET_URL = API_BASE_URL;

// Export endpoints for reuse throughout application
export const AUTH_ENDPOINTS = {
  LOGIN: `${API_URL}/auth/login`,
  REGISTER: `${API_URL}/auth/register`,
  LOGOUT: `${API_URL}/auth/logout`,
};

export const TECHNICAL_ENDPOINTS = {
  GET_STATS: `${API_URL}/technical/stats`,
  GET_TICKETS: `${API_URL}/technical/tickets`,
  UPDATE_STATUS: (id) => `${API_URL}/technical/tickets/${id}/status`,
};

export const TICKET_ENDPOINTS = {
  GET_ALL: `${API_URL}/tickets`,
  CREATE: `${API_URL}/tickets`,
  GET_BY_ID: (id) => `${API_URL}/tickets/${id}`,
  UPDATE: (id) => `${API_URL}/tickets/${id}`,
  DELETE: (id) => `${API_URL}/tickets/${id}`,
  ASSIGN: (id) => `${API_URL}/tickets/${id}/assign`,
  COMMENT: (id) => `${API_URL}/tickets/${id}/comments`,
};

export const USER_ENDPOINTS = {
  GET_ALL: `${API_URL}/users`,
  GET_TECHNICIANS: `${API_URL}/users/technicians`,
  GET_BY_ID: (id) => `${API_URL}/users/${id}`,
  UPDATE: (id) => `${API_URL}/users/${id}`,
  DELETE: (id) => `${API_URL}/users/${id}`,
};

export const ADMIN_ENDPOINTS = {
  DASHBOARD_STATS: `${API_URL}/admin/dashboard-stats`,
};

export default {
  API_URL,
  SOCKET_URL,
  AUTH_ENDPOINTS,
  TECHNICAL_ENDPOINTS,
  TICKET_ENDPOINTS,
  USER_ENDPOINTS,
  ADMIN_ENDPOINTS
};
