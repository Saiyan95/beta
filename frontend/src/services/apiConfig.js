// API Configuration - DEPRECATED
// This file is deprecated. Please use the centralized configuration in ../utils/apiConfig.js

import { API_URL as CENTRAL_API_URL, SOCKET_URL as CENTRAL_SOCKET_URL } from '../utils/apiConfig';

// Re-export for backward compatibility
const API_URL = CENTRAL_API_URL;
const SOCKET_URL = CENTRAL_SOCKET_URL;

export { API_URL, SOCKET_URL };
