// Test file to verify the new medication schema
import { medications } from './schema.js';

// Example medication data that matches your sample structure
const sampleMedication = {
  id: 1,
  name: "Medication Name",
  directions: "Take with food",
  side_effects: ["May cause drowsiness"],
  purpose: "Pain relief",
  warnings: "Do not exceed recommended dose",
  dosage_amount: "10.00",
  dosage_unit: "mg",
  notes: "User notes",
  start_date: "2025-01-01",
  end_date: "2025-12-31",
  frequency: "Once daily"
};

// This shows the structure that will be used for database operations
console.log('Sample medication structure:', sampleMedication);
console.log('Schema fields:', Object.keys(medications));

// Note: side_effects array will be stored as JSON string in the database
// When inserting: JSON.stringify(["May cause drowsiness"])
// When retrieving: JSON.parse(side_effects_string)
