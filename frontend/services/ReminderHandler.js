// ReminderHandler.js
// Handles reminder-related API calls using Django backend API

const BASE_URL = 'http://localhost:8000/api';

function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// Get all reminders for authenticated user
export async function getReminders(token) {
  const res = await fetch(`${BASE_URL}/reminders/`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  return res.json();
}

// Get a specific reminder
export async function getReminder(token, reminderId) {
  const res = await fetch(`${BASE_URL}/reminders/${reminderId}/`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  return res.json();
}
