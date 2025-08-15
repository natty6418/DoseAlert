// MedicationHandler.js
// Handles medication CRUD logic using Django backend API

const BASE_URL = 'http://localhost:8000/api';

function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// Create a new medication
export async function addMedication(token, medication) {
  const res = await fetch(`${BASE_URL}/meds/`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(medication),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  return res.json();
}

// Get all medications for authenticated user
export async function getMedications(token) {
  const res = await fetch(`${BASE_URL}/meds/`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  return res.json();
}

// Get a specific medication
export async function getMedication(token, medicationId) {
  const res = await fetch(`${BASE_URL}/meds/${medicationId}/`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  return res.json();
}
// Update a medication
export async function updateMedication(token, medicationId, updates) {
  const res = await fetch(`${BASE_URL}/meds/${medicationId}/`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  return res.json();
}

// Delete a medication
export async function deleteMedication(token, medicationId) {
  const res = await fetch(`${BASE_URL}/meds/${medicationId}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  return true;
}



