// Simple script to test the Beta Tech Support API
const fetch = require('node-fetch');

const API_URL = 'http://localhost:5002/api';

// Test functions
async function testSignup() {
  try {
    const response = await fetch(`${API_URL}/auth/client/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Test User',
        role: 'client'
      })
    });
    
    const data = await response.json();
    console.log('Signup response:', data);
    return data.token;
  } catch (error) {
    console.error('Signup error:', error);
    return null;
  }
}

async function testLogin() {
  try {
    const response = await fetch(`${API_URL}/auth/client/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const data = await response.json();
    console.log('Login response:', data);
    return data.token;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

async function testProfile(token) {
  if (!token) {
    console.log('No token provided for profile test');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    console.log('Profile response:', data);
  } catch (error) {
    console.error('Profile error:', error);
  }
}

async function testCreateTicket(token) {
  if (!token) {
    console.log('No token provided for ticket creation test');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category: 'software',
        productName: 'Test Product',
        productType: 'application',
        serialNumber: 'SN12345',
        warrantyStatus: true,
        warrantyExpiry: '2025-12-31',
        priority: 'medium',
        description: 'This is a test ticket created via API'
      })
    });
    
    const data = await response.json();
    console.log('Create ticket response:', data);
    return data.ticket?._id;
  } catch (error) {
    console.error('Create ticket error:', error);
    return null;
  }
}

async function testGetTickets(token) {
  if (!token) {
    console.log('No token provided for get tickets test');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/tickets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    console.log('Get tickets response:', data);
  } catch (error) {
    console.error('Get tickets error:', error);
  }
}

// Run tests
async function runTests() {
  console.log('Starting API tests...');
  
  // Test authentication
  const signupToken = await testSignup();
  const loginToken = await testLogin() || signupToken;
  
  if (loginToken) {
    await testProfile(loginToken);
    
    // Test tickets
    const ticketId = await testCreateTicket(loginToken);
    await testGetTickets(loginToken);
    
    console.log('All tests completed!');
  } else {
    console.log('Tests failed: Could not obtain authentication token');
  }
}

runTests();
