// AnalyticsHandler.js
// Handles analytics-related API calls using Django backend API

const BASE_URL = 'http://localhost:8000/api';

function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// Get analytics summary
export async function getAnalyticsSummary(token) {
  const res = await fetch(`${BASE_URL}/analytics/summary/`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  return res.json();
}
