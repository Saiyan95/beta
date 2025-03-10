// Simple test script to verify API connectivity
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5002/api';

async function testApiConnection() {
  console.log('Testing API connection...');
  console.log('API URL:', API_URL);
  console.log('----------------------------------------');

  try {
    const response = await axios.get(`${API_URL}/health-check`);
    console.log('✅ API Connection Successful!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ API Connection Failed!');
    if (error.response) {
      console.error('Response Error:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('Request Error: No response received');
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

// Run the test
testApiConnection();
