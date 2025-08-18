// MedicationHandler.js
// Handles medication CRUD logic using Django backend API

const BASE_URL = 'http://localhost:8000/api';

// Transform app medication data to API format
function transformToApiFormat(medicationData) {
  return {
    name: medicationData.medicationSpecification?.name || medicationData.name,
    directions: medicationData.medicationSpecification?.directions || medicationData.directions,
    side_effects: Array.isArray(medicationData.medicationSpecification?.sideEffects) 
      ? medicationData.medicationSpecification.sideEffects.join(', ') 
      : medicationData.medicationSpecification?.sideEffects || medicationData.sideEffects,
    purpose: medicationData.medicationSpecification?.purpose || medicationData.purpose,
    warnings: medicationData.medicationSpecification?.warnings || medicationData.warnings,
    dosage_amount: parseFloat(medicationData.dosage?.amount || 0),
    dosage_unit: medicationData.dosage?.unit || 'mg',
    notes: medicationData.notes || '',
    start_date: medicationData.startDate ? new Date(medicationData.startDate).toISOString().split('T')[0] : null,
    end_date: medicationData.endDate ? new Date(medicationData.endDate).toISOString().split('T')[0] : null,
    frequency: medicationData.frequency || 'Daily',
  };
}

// Transform API medication data to app format
function transformFromApiFormat(apiData) {
  return {
    id: apiData.id,
    medicationSpecification: {
      name: apiData.name,
      directions: apiData.directions,
      sideEffects: apiData.side_effects ? apiData.side_effects.split(', ') : [],
      purpose: apiData.purpose,
      warnings: apiData.warnings,
    },
    dosage: {
      amount: apiData.dosage_amount?.toString() || '0',
      unit: apiData.dosage_unit || 'mg',
    },
    startDate: apiData.start_date ? new Date(apiData.start_date) : null,
    endDate: apiData.end_date ? new Date(apiData.end_date) : null,
    frequency: apiData.frequency,
    notes: apiData.notes,
    isActive: true, // App-specific field
    reminder: { // App-specific structure
      enabled: false, // Will be set based on schedules
      times: [],
    },
    createdAt: apiData.created_at ? new Date(apiData.created_at) : new Date(),
  };
}

// Create a new medication
export async function addMedication(makeAuthenticatedRequest, medicationData) {
  const apiData = transformToApiFormat(medicationData);
  
  const res = await makeAuthenticatedRequest(`${BASE_URL}/meds/`, {
    method: 'POST',
    body: JSON.stringify(apiData),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  
  const responseData = await res.json();
  return transformFromApiFormat(responseData);
}

// Get all medications for authenticated user
export async function getMedications(makeAuthenticatedRequest) {
  const res = await makeAuthenticatedRequest(`${BASE_URL}/meds/`);
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  
  const medications = await res.json();
  return medications.map(transformFromApiFormat);
}

// Get a specific medication
export async function getMedication(makeAuthenticatedRequest, medicationId) {
  const res = await makeAuthenticatedRequest(`${BASE_URL}/meds/${medicationId}/`);
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  
  const responseData = await res.json();
  return transformFromApiFormat(responseData);
}

// Update a medication
export async function updateMedication(makeAuthenticatedRequest, medicationId, updates) {
  const apiData = transformToApiFormat(updates);
  
  const res = await makeAuthenticatedRequest(`${BASE_URL}/meds/${medicationId}/`, {
    method: 'PATCH',
    body: JSON.stringify(apiData),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  
  const responseData = await res.json();
  return transformFromApiFormat(responseData);
}

// Delete a medication
export async function deleteMedication(makeAuthenticatedRequest, medicationId) {
  const res = await makeAuthenticatedRequest(`${BASE_URL}/meds/${medicationId}/`, {
    method: 'DELETE',
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  
  return true;
}

// Legacy function for backward compatibility
export async function addNewMedication(medicationData) {
  // This function should be updated to use the new pattern
  // For now, it returns a compatible structure
  return {
    data: {
      id: Date.now().toString(),
      medicationSpecification: {
        name: medicationData.name,
        directions: medicationData.directions,
        sideEffects: medicationData.sideEffects || [],
        purpose: medicationData.purpose,
        warnings: medicationData.warning,
      },
      dosage: medicationData.dosage,
      startDate: medicationData.startDate,
      endDate: medicationData.endDate,
      frequency: medicationData.frequency,
      reminder: {
        enabled: medicationData.reminderEnabled,
        times: medicationData.reminderTimes || [],
      },
      isActive: true,
    },
    error: null,
  };
}

// ===== SCHEDULE MANAGEMENT =====

// Transform app schedule data to API format
function transformScheduleToApiFormat(scheduleData, medicationId) {
  return {
    medication: medicationId,
    time_of_day: scheduleData.time || '08:00:00',
    days_of_week: scheduleData.days || 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
    timezone: scheduleData.timezone || 'UTC',
    active: scheduleData.active !== false,
  };
}

// Transform API schedule data to app format
function transformScheduleFromApiFormat(apiData) {
  return {
    id: apiData.id,
    medicationId: apiData.medication.id || apiData.medication,
    time: apiData.time_of_day,
    days: apiData.days_of_week,
    timezone: apiData.timezone,
    active: apiData.active,
    isEffectivelyActive: apiData.is_effectively_active,
    medication: apiData.medication,
    createdAt: apiData.created_at ? new Date(apiData.created_at) : new Date(),
  };
}

// Create a new schedule
export async function addSchedule(makeAuthenticatedRequest, medicationId, scheduleData) {
  const apiData = transformScheduleToApiFormat(scheduleData, medicationId);
  
  const res = await makeAuthenticatedRequest(`${BASE_URL}/schedules/`, {
    method: 'POST',
    body: JSON.stringify(apiData),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  
  const responseData = await res.json();
  return transformScheduleFromApiFormat(responseData);
}

// Get all schedules for authenticated user
export async function getSchedules(makeAuthenticatedRequest) {
  const res = await makeAuthenticatedRequest(`${BASE_URL}/schedules/`);
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  
  const schedules = await res.json();
  return schedules.map(transformScheduleFromApiFormat);
}

// Update a schedule
export async function updateSchedule(makeAuthenticatedRequest, scheduleId, updates) {
  const apiData = transformScheduleToApiFormat(updates, updates.medicationId);
  
  const res = await makeAuthenticatedRequest(`${BASE_URL}/schedules/${scheduleId}/`, {
    method: 'PATCH',
    body: JSON.stringify(apiData),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  
  const responseData = await res.json();
  return transformScheduleFromApiFormat(responseData);
}

// Delete a schedule
export async function deleteSchedule(makeAuthenticatedRequest, scheduleId) {
  const res = await makeAuthenticatedRequest(`${BASE_URL}/schedules/${scheduleId}/`, {
    method: 'DELETE',
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  
  return true;
}



