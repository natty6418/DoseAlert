// apiUtils.js
// API helper functions for sync operations

import { getStoredAccessToken } from '../UserHandler.js';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// API helper function with authentication
export const makeAuthenticatedAPIRequest = async (endpoint, options = {}) => {
  const accessToken = await getStoredAccessToken();
  if (!accessToken) throw new Error('No access token available');

  // Ensure we don't double up on /api if BACKEND_URL already includes it
  const baseUrl = BACKEND_URL.endsWith('/api') ? BACKEND_URL : `${BACKEND_URL}/api`;
  const url = `${baseUrl}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  const responseText = await response.text();
  console.log('API Response:', responseText);

  // Try to parse the response text as JSON
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    // If parsing fails, and the response was not 'ok', the text itself might be the error message
    if (!response.ok) {
      throw new Error(responseText || 'API request failed with non-JSON response.');
    }
    // If the response was 'ok' but the body is not JSON, this is an unexpected state.
    // We can either throw an error or return the raw text.
    // Let's throw an error because the app seems to expect JSON.
    throw new Error('Failed to parse successful API response as JSON.');
  }

  if (!response.ok) {
    // Use the parsed JSON to get error details
    throw new Error(data.detail || data.message || 'API request failed');
  }

  return data;
};

// Check if batch sync is available by testing one endpoint
export async function isBatchSyncAvailable() {
  try {
    const accessToken = await getStoredAccessToken();
    if (!accessToken) return false;

    const baseUrl = BACKEND_URL.endsWith('/api') ? BACKEND_URL : `${BACKEND_URL}/api`;
    const response = await fetch(`${baseUrl}/meds/sync/`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    return response.ok;
  } catch (error) {
    console.warn('Batch sync availability check failed:', error.message);
    return false;
  }
}
