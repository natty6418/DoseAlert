// apiConfig.js
// Common configuration and utilities for Django backend API

export const BASE_URL = 'http://localhost:8000/api';

export function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export function getHeaders() {
  return {
    'Content-Type': 'application/json',
  };
}

// Helper function to handle API responses
export async function handleApiResponse(response) {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(JSON.stringify(error));
  }
  return response.json();
}

// Helper function to make authenticated GET requests
export async function apiGet(endpoint, token) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiResponse(response);
}

// Helper function to make authenticated POST requests
export async function apiPost(endpoint, token, data) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiResponse(response);
}

// Helper function to make authenticated PATCH requests
export async function apiPatch(endpoint, token, data) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiResponse(response);
}

// Helper function to make authenticated DELETE requests
export async function apiDelete(endpoint, token) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(JSON.stringify(error));
  }
  return true;
}
