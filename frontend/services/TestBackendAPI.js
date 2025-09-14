// TestBackendAPI.js
// Quick script to test what your backend API returns

import { getStoredAccessToken } from './UserHandler.js';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function testBackendEndpoints() {
  try {
    const accessToken = await getStoredAccessToken();
    if (!accessToken) {
      console.error('No access token found');
      return;
    }

    const baseUrl = BACKEND_URL.endsWith('/api') ? BACKEND_URL : `${BACKEND_URL}/api`;
    
    const endpoints = ['/meds/', '/schedules/', '/adherence/records/'];
    
    for (const endpoint of endpoints) {
      console.log(`\n=== Testing ${endpoint} ===`);
      
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error(`Error ${response.status}: ${response.statusText}`);
          continue;
        }
        
        const data = await response.json();
        console.log(`Returned ${Array.isArray(data) ? data.length : 1} items:`);
        
        if (Array.isArray(data)) {
          data.forEach((item, index) => {
            const userId = item.user || item.user_id || item.userId || 'NO_USER_FIELD';
            console.log(`  ${index + 1}. ID: ${item.id}, User: ${userId}, Name: ${item.name || 'N/A'}`);
          });
        } else {
          const userId = data.user || data.user_id || data.userId || 'NO_USER_FIELD';
          console.log(`  Single item - ID: ${data.id}, User: ${userId}`);
        }
        
      } catch (error) {
        console.error(`Failed to test ${endpoint}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Error testing backend endpoints:', error);
  }
}

// Call this function to test your backend
export async function runBackendTest() {
  console.log('🔍 Testing backend API endpoints...');
  await testBackendEndpoints();
}
