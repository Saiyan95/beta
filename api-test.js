// Command-line tool to test the Beta Tech Support API
const https = require('https');
const http = require('http');
const readline = require('readline');

const API_URL = 'http://localhost:5002/api';
let token = null;

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to make HTTP requests
function makeRequest(url, method, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const lib = isHttps ? https : http;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = lib.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve(parsedData);
        } catch (error) {
          resolve(responseData);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test functions
async function testRegister() {
  console.log('\n=== Testing Client Registration ===');
  
  const email = `test-${Date.now()}@example.com`;
  const data = {
    username: 'Test User',
    email,
    password: 'password123',
    role: 'client',
    companyName: 'Test Company',
    department: 'IT',
    phoneNumber: '+201234567890'
  };
  
  try {
    const response = await makeRequest(`${API_URL}/auth/client/signup`, 'POST', data);
    console.log('Response:', JSON.stringify(response, null, 2));
    
    if (response.token) {
      token = response.token;
      console.log('Token received and stored for subsequent requests');
    }
    
    return email;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

async function testLogin(email = 'test@example.com') {
  console.log('\n=== Testing Client Login ===');
  
  const data = {
    email,
    password: 'password123'
  };
  
  try {
    const response = await makeRequest(`${API_URL}/auth/client/login`, 'POST', data);
    console.log('Response:', JSON.stringify(response, null, 2));
    
    if (response.token) {
      token = response.token;
      console.log('Token received and stored for subsequent requests');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testProfile() {
  console.log('\n=== Testing Get Profile ===');
  
  if (!token) {
    console.log('No token available. Please login first.');
    return;
  }
  
  try {
    const response = await makeRequest(`${API_URL}/auth/profile`, 'GET');
    console.log('Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testCreateTicket() {
  console.log('\n=== Testing Create Ticket ===');
  
  if (!token) {
    console.log('No token available. Please login first.');
    return null;
  }
  
  const data = {
    category: 'software',
    productName: 'Test Product',
    productType: 'application',
    serialNumber: `SN-${Date.now()}`,
    warrantyStatus: true,
    warrantyExpiry: '2025-12-31',
    priority: 'medium',
    description: 'This is a test ticket created via API'
  };
  
  try {
    const response = await makeRequest(`${API_URL}/tickets`, 'POST', data);
    console.log('Response:', JSON.stringify(response, null, 2));
    
    if (response._id) {
      return response._id;
    }
    return null;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

async function testGetTickets() {
  console.log('\n=== Testing Get Tickets ===');
  
  if (!token) {
    console.log('No token available. Please login first.');
    return;
  }
  
  try {
    const response = await makeRequest(`${API_URL}/tickets`, 'GET');
    console.log('Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testGetTechnicians() {
  console.log('\n=== Testing Get Technicians ===');
  
  if (!token) {
    console.log('No token available. Please login first.');
    return;
  }
  
  try {
    const response = await makeRequest(`${API_URL}/users/technicians`, 'GET');
    console.log('Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Main menu
function showMenu() {
  console.log('\n=== Beta Tech Support API Tester ===');
  console.log('1. Register a new client');
  console.log('2. Login as client');
  console.log('3. Get profile');
  console.log('4. Create a ticket');
  console.log('5. Get all tickets');
  console.log('6. Get all technicians');
  console.log('7. Run all tests');
  console.log('0. Exit');
  
  rl.question('\nSelect an option: ', async (answer) => {
    switch (answer) {
      case '1':
        await testRegister();
        break;
      case '2':
        await testLogin();
        break;
      case '3':
        await testProfile();
        break;
      case '4':
        await testCreateTicket();
        break;
      case '5':
        await testGetTickets();
        break;
      case '6':
        await testGetTechnicians();
        break;
      case '7':
        const email = await testRegister();
        await testLogin(email);
        await testProfile();
        await testCreateTicket();
        await testGetTickets();
        await testGetTechnicians();
        break;
      case '0':
        console.log('Exiting...');
        rl.close();
        return;
      default:
        console.log('Invalid option');
    }
    
    showMenu();
  });
}

// Start the application
console.log('Starting Beta Tech Support API Tester...');
console.log(`API URL: ${API_URL}`);
showMenu();
