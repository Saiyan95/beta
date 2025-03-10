// Script to test registration functionality
const axios = require('axios');

// Constants
const API_URL = 'http://localhost:5002/api';

// Test user data
const testUser = {
  username: 'testuser_' + Date.now(),
  email: `testuser_${Date.now()}@example.com`,
  password: 'password123',
  firstName: 'Test',
  lastName: 'User',
  companyName: 'Test Company',
  department: 'IT',
  phoneNumber: '123-456-7890'
};

// Duplicate user for testing error handling
const duplicateUser = {
  ...testUser,
  username: testUser.username + '_dup',
  email: testUser.email
};

// Test duplicate username
const duplicateUsername = {
  ...testUser,
  username: testUser.username,
  email: 'different_' + testUser.email
};

async function runTests() {
  console.log('Starting registration tests...');
  console.log('--------------------------------------');
  
  // Test 1: Register a new user
  console.log('Test 1: Register a new user');
  try {
    const response = await axios.post(`${API_URL}/auth/register`, testUser);
    console.log('✅ Success! User registered:', {
      username: response.data.user.username,
      email: response.data.user.email,
      role: response.data.user.role
    });
  } catch (error) {
    console.error('❌ Registration failed:', error.response?.data?.message || error.message);
  }
  console.log('--------------------------------------');
  
  // Test 2: Try to register with duplicate email
  console.log('Test 2: Try to register with duplicate email');
  try {
    await axios.post(`${API_URL}/auth/register`, duplicateUser);
    console.log('❌ Test failed: Should not allow duplicate email');
  } catch (error) {
    if (error.response?.data?.message === 'User already exists') {
      console.log('✅ Success! Correctly rejected duplicate email with proper error message');
    } else {
      console.error('❌ Test failed: Wrong error message:', error.response?.data?.message);
    }
  }
  console.log('--------------------------------------');
  
  // Test 3: Try to register with duplicate username
  console.log('Test 3: Try to register with duplicate username');
  try {
    await axios.post(`${API_URL}/auth/register`, duplicateUsername);
    console.log('❌ Test failed: Should not allow duplicate username');
  } catch (error) {
    if (error.response?.data?.message === 'Username already exists') {
      console.log('✅ Success! Correctly rejected duplicate username with proper error message');
    } else {
      console.error('❌ Test failed: Wrong error message:', error.response?.data?.message);
    }
  }
  console.log('--------------------------------------');
  
  console.log('Registration tests completed!');
}

// Run the tests
runTests();
