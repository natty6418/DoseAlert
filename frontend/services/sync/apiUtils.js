// apiUtils.js
// API helper functions for sync operations

import { getStoredAccessToken } from '../UserHandler.js';
import { apiClient } from '../apiConfig.js';

// API helper function with authentication
export const makeAuthenticatedAPIRequest = async (endpoint, options = {}) => {
  try {
    console.log('API Response for:', endpoint);
    const response = await apiClient.request({
      url: endpoint,
      ...options,
    });
    
    console.log('API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    
    // Handle different error scenarios
    if (error.response) {
      const data = error.response.data;
      throw new Error(data?.detail || data?.message || 'API request failed');
    } else if (error.request) {
      throw new Error('Network error - please check your connection');
    } else {
      throw new Error(error.message || 'API request failed');
    }
  }
};

// Check if batch sync is available by testing one endpoint
export async function isBatchSyncAvailable() {
  try {
    const accessToken = await getStoredAccessToken();
    if (!accessToken) return false;

    const response = await apiClient.options('/meds/sync/');
    return response.status === 200;
  } catch (error) {
    console.warn('Batch sync availability check failed:', error.message);
    return false;
  }
}
