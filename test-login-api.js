#!/usr/bin/env node
/**
 * Test script to verify login API response format
 * This helps debug the 204 No Content issue
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000/api/v1';

async function testLoginAPI() {
  console.log('\n=== TESTING LOGIN API ===\n');
  console.log(`API URL: ${API_URL}/auth/login\n`);

  try {
    // Test with default admin credentials (adjust as needed)
    const credentials = {
      username: 'admin',
      password: 'admin123', // Update with actual test credentials
    };

    console.log('Sending login request with credentials:', {
      username: credentials.username,
      password: '******',
    });

    const response = await axios.post(`${API_URL}/auth/login`, credentials, {
      headers: {
        'Content-Type': 'application/json',
      },
      validateStatus: () => true, // Don't throw on any status
    });

    console.log('\n--- RESPONSE DETAILS ---');
    console.log('Status Code:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', response.headers);
    console.log('\n--- RESPONSE DATA ---');
    console.log('Data:', JSON.stringify(response.data, null, 2));
    console.log('Data Type:', typeof response.data);
    console.log('Data Keys:', response.data ? Object.keys(response.data) : 'null/undefined');

    // Check for expected properties
    console.log('\n--- PROPERTY CHECK ---');
    if (response.data) {
      console.log('Has "access_token":', 'access_token' in response.data);
      console.log('Has "refresh_token":', 'refresh_token' in response.data);
      console.log('Has "user":', 'user' in response.data);
      console.log('Has "status" (Result wrapper):', 'status' in response.data);

      if ('status' in response.data) {
        console.log('\n--- RESULT WRAPPER DETECTED ---');
        console.log('Result.status:', response.data.status);
        console.log('Result.message:', response.data.message);
        console.log('Result.data:', JSON.stringify(response.data.data, null, 2));
      }
    }

    // Check if it's 204 No Content
    if (response.status === 204) {
      console.log('\n⚠️  WARNING: Received 204 No Content - This is the problem!');
      console.log('The response body should contain tokens, but 204 means no content.');
    } else if (response.status === 200) {
      console.log('\n✅ Received 200 OK - Expected status code');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }

  console.log('\n=== END TEST ===\n');
}

testLoginAPI();
