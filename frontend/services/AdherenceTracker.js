// AdherenceTracker.js
// Handles medication adherence tracking logic using Django backend API

const BASE_URL = 'http://localhost:8000/api';

// Helper to get auth headers
function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// Record adherence response for a medication reminder
export async function recordAdherence(token, reminderId, status, actualTime, notes) {
  const res = await fetch(`${BASE_URL}/adherence/respond/`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      reminder_id: reminderId,
      status,
      actual_time: actualTime,
      notes,
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  return res.json();
}

// Get all adherence records for authenticated user
export async function getAdherenceRecords(token) {
  const res = await fetch(`${BASE_URL}/adherence/records/`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  return res.json();
}

// Get pending adherence records
export async function getPendingAdherenceRecords(token) {
  const res = await fetch(`${BASE_URL}/adherence/records/pending/`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  return res.json();
}

// Get overdue adherence records (over 1 hour late)
export async function getOverdueAdherenceRecords(token) {
  const res = await fetch(`${BASE_URL}/adherence/records/overdue/`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  return res.json();
}

// Get adherence summary for authenticated user
export async function getAdherenceSummary(token) {
  const res = await fetch(`${BASE_URL}/adherence/summary/`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  return res.json();
}

// Get adherence streaks for authenticated user
export async function getAdherenceStreaks(token) {
  const res = await fetch(`${BASE_URL}/adherence/streaks/`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  return res.json();
}

// Get comprehensive adherence report with detailed analytics
export async function getAdherenceReport(token, days = 30) {
  const res = await fetch(`${BASE_URL}/adherence/report/?days=${days}`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  return res.json();
}

// Create adherence record
export async function createAdherenceRecord(token, recordData) {
  const res = await fetch(`${BASE_URL}/adherence/records/`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(recordData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  return res.json();
}