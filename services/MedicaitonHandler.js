import { db } from "./firebaseConfig";
import {collection, Timestamp, doc, getDoc, getDocs, setDoc, query, where, updateDoc, deleteDoc } from "firebase/firestore";
import { scheduleReminders, cancelReminders } from "./Scheduler";

const validateMedication = ({name, dosage, startDate, endDate, frequency, reminderEnabled, reminderTimes}) => {
    if (!name || !dosage.amount || !dosage.unit || !startDate || !endDate || !frequency) {
        return { error: 'Please fill out all required fields.' };
    }
    if (name.length < 3) {
        return { error: 'Medication name must be at least 3 characters long.' };
    }
    if (dosage.amount <= 0) {
        return { error: 'Dosage amount must be greater than 0.' };
    }
    if (dosage.unit.length < 1) {
        return { error: 'Please select a dosage unit.' };
    }
    if(isNaN(parseInt(dosage.amount))){
        return { error: 'Dosage amount must be a number.' };
    }
    if (endDate < startDate) {
        return { error: 'End date must be after start date.' };
    }
    if (reminderEnabled && reminderTimes.length === 0) {
        return { error: 'Please select at least one reminder time.' };
    }
    return null;
};

export const addNewMedication = async ({
  userId,
  dosage,
  startDate,
  endDate,
  frequency,
  name,
  directions,
  sideEffects,
  reminderEnabled,
  reminderTimes,
  purpose,
  warning,
}) => {
  try {
    const errors = validateMedication({
      name,
      dosage,
      startDate,
      endDate,
      frequency,
      reminderEnabled,
      reminderTimes,
    });
    if (errors) {
      return {
        data: null,
        error: errors.error,
      };
    }

    // Generate a new document reference with an auto-generated ID
    const medicationDocRef = doc(collection(db, 'medications'));
    const medicationId = medicationDocRef.id;

    let reminders = [];
    if (reminderEnabled && reminderTimes.length > 0) {
      // Use the medicationId in scheduleReminders
      reminders = await scheduleReminders(
        reminderTimes,
        `Time to take your ${name}!`,
        medicationId
      );
    }

    const reminderTimeStamps = reminders.map((r) => ({
      ...r,
      time: Timestamp.fromDate(r.time),
    }));
    console.log('reminderTimeStamps', reminderTimeStamps);

    const data = {
      userId: `users/${userId}`, // Reference to the user's path
      dosage,
      startDate: Timestamp.fromDate(new Date(startDate)), // Convert startDate to Firebase Timestamp
      endDate: Timestamp.fromDate(new Date(endDate)), // Convert endDate to Firebase Timestamp
      frequency,
      medicationSpecification: {
        name,
        directions,
        sideEffects, // Optional field with default empty string
        warning, // Optional field with default empty string
      },
      reminder: {
        enabled: reminderEnabled,
        reminderTimes: reminderTimeStamps, // Array of generated reminder Timestamps
        notificationIds: reminders.map((reminder) => reminder.id), // Store notification IDs
      },
      purpose,
    };

    // Use setDoc to add the medication data to Firestore at the generated document reference
    await setDoc(medicationDocRef, data);
    console.log('Medication added successfully:', medicationId);
    return {
      data: {
        ...data,
        id: medicationId,
        startDate,
        endDate,
        reminder: {
          ...data.reminder,
          reminderTimes: reminders,
        },
      },
      error: null,
    };
  } catch (e) {
    throw new Error(e.message);
  }
};


export const getMedications = async (userId) => {
    try {
        // Create a reference to the 'medications' collection
        const medicationsRef = collection(db, 'medications');
        
        // Create a query to get only the medications that belong to the specified user
        const q = query(medicationsRef, where('userId', '==', `users/${userId}`));
        
        // Execute the query and get the documents
        const querySnapshot = await getDocs(q);
        let medications = [];

        // Parse the documents into a structured array
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            medications.push({
                id: doc.id,
                ...data,
                startDate: data.startDate.toDate(), // Convert Firebase Timestamp to JavaScript Date
                endDate: data.endDate.toDate(), // Convert Firebase Timestamp to JavaScript Date
                reminder: {
                    ...data.reminder,
                    reminderTimes: data.reminder.reminderTimes.map(r => ({...r, time: r.time.toDate()})), // Convert Timestamps to Dates
                },
            });
        });

        return medications; // Return the list of medications
    } catch (e) {
        throw new Error('Error fetching medications: ' + e.message);
    }
};

export const editMedication = async (med, newMed) => {
    try {
        // Validate the updatedFields input before proceeding
        const errors = validateMedication({...newMed});
        if (errors) {
            return {
                data: null,
                error: errors.error,
            }
        }

        // Reference to the specific medication document
        const medicationDocRef = doc(db, 'medications', med.id);
        
        // Check if the medication document exists
        const medicationDoc = await getDoc(medicationDocRef);
        if (!medicationDoc.exists()) {
            throw new Error("Medication not found");
        }

        cancelReminders(med.reminder.reminderTimes);

        let reminders = [];
        if (newMed.reminderEnabled && (newMed.reminderTimes.length > 0)) {
            reminders = await scheduleReminders(newMed.reminderTimes, `Time to take your ${newMed.name}!`, med.id);
        }
        const reminderTimeStamps = reminders.map(r=>({...r, time: Timestamp.fromDate(r.time)}));
        // Update the document with the new data
        const data =  {
            userId: `users/${newMed.userId}`, // Reference to the user's path
            dosage: newMed.dosage,
            startDate: Timestamp.fromDate(new Date(newMed.startDate)), // Convert startDate to Firebase Timestamp
            endDate: Timestamp.fromDate(new Date(newMed.endDate)), // Convert endDate to Firebase Timestamp
            frequency: newMed.frequency,
            medicationSpecification: {
                name: newMed.name,
                directions: newMed.directions,
                sideEffects:newMed.sideEffects, // Optional field with default empty string
                warning: newMed.warning, // Optional field with default empty string
            },
            reminder: {
                enabled: newMed.reminderEnabled,
                reminderTimes: reminderTimeStamps, // Array of generated reminder Timestamps
            },
            purpose: newMed.purpose,
        };
        await updateDoc(medicationDocRef,data);
        
        console.log("Medication updated successfully:", med.id);
        return {data: {...data, id: med.id, startDate: new Date(newMed.startDate), endDate: new Date(newMed.endDate), reminder: {...data.reminder, reminderTimes: reminders}}, error: null};
    } catch (e) {
        throw new Error("Error updating medication: " + e.message);
    }
};

export const deleteMedication = async (medicationId) => {
    try {
        const medicationDocRef = doc(db, 'medications', medicationId);
        
        const medicationDoc = await getDoc(medicationDocRef);
        if (!medicationDoc.exists()) {
            throw new Error("Medication not found");
        }

        await deleteDoc(medicationDocRef);
        
        console.log("Medication deleted successfully:", medicationId);
        return medicationId;
    } catch (e) {
        throw new Error("Error deleting medication: " + e.message);
    }
};

