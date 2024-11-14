import { db } from "./firebaseConfig";
import {collection, addDoc, Timestamp, doc, getDoc, getDocs, setDoc, query, where, updateDoc, deleteDoc } from "firebase/firestore";
import { scheduleReminders } from "./registerNotification";

const checkForErrors = ({name, dosage, startDate, endDate, frequency, reminderEnabled, reminderTimes}) => {
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

export const createNewUser = async ({uid, firstName, lastName, email}) => {
    try{
        const userDocRef = doc(db, 'users', uid); // Correct document reference
        await setDoc(userDocRef, {
            firstName,
            lastName,
            email,
        });
        console.log('User document created with UID:', uid);
       
    } catch(e){
        throw new Error(e.message);
    }
};
export const getUser = async (uid) => {
    try {
        // Create a reference to the specific user document using uid
        const userDocRef = doc(db, 'users', uid);
        
        // Get the document
        const userDoc = await getDoc(userDocRef);
        
        // Check if the document exists
        if (!userDoc.exists()) {
            throw new Error('No user found with the specified UID.');
        }

        // Extract and return the user data
        const userData = {
            id: userDoc.id,
            ...userDoc.data(),
        };

        console.log('User found with ID: ', userData.id);
        return userData;
    } catch (e) {
        throw new Error('Error fetching user: ' + e.message);
    }
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
    warning }) => {
    try {
        const errors = checkForErrors({name, dosage, startDate, endDate, frequency, reminderEnabled, reminderTimes});
        if (errors) {
            return {
                data: null,
                error: errors.error,
            }
        }
        let reminders = [];
            if (reminderEnabled && reminderTimes.length > 0) {
                reminders = await scheduleReminders(reminderTimes, `Time to take your ${name}!`);
        }
        const reminderTimeStamps = reminders.map(r=>({ time: Timestamp.fromDate(r.time), id: r.id}));
        console.log(reminderTimeStamps);
        const docRef = await addDoc(collection(db, 'medications'), {
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
            },
            purpose,
        });
        console.log("Document written with ID: ", docRef.id);
        return {data: docRef.id, error: null};
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
                    reminderTimes: data.reminder.reminderTimes.map(r => ({time: r.time.toDate(), id: r.id})), // Convert Timestamps to Dates
                },
            });
        });

        return medications; // Return the list of medications
    } catch (e) {
        throw new Error('Error fetching medications: ' + e.message);
    }
};

export const editMedication = async (medicationId, newData) => {
    try {
        // Validate the updatedFields input before proceeding
        const errors = checkForErrors({...newData});
        if (errors) {
            return {
                data: null,
                error: errors.error,
            }
        }

        // Reference to the specific medication document
        const medicationDocRef = doc(db, 'medications', medicationId);
        
        // Check if the medication document exists
        const medicationDoc = await getDoc(medicationDocRef);
        if (!medicationDoc.exists()) {
            throw new Error("Medication not found");
        }

        let reminders = [];
        if (newData.reminderEnabled && (newData.reminderTimes.length > 0)) {
            console.log("newData", newData.reminderTimes.length);
            reminders = await scheduleReminders(newData.reminderTimes, `Time to take your ${newData.name}!`);
        }
        const reminderTimeStamps = reminders.map(r=>({ time: Timestamp.fromDate(r.time), id: r.id}));
        // Update the document with the new data
        await updateDoc(medicationDocRef, {
            userId: `users/${newData.userId}`, // Reference to the user's path
            dosage: newData.dosage,
            startDate: Timestamp.fromDate(new Date(newData.startDate)), // Convert startDate to Firebase Timestamp
            endDate: Timestamp.fromDate(new Date(newData.endDate)), // Convert endDate to Firebase Timestamp
            frequency: newData.frequency,
            medicationSpecification: {
                name: newData.name,
                directions: newData.directions,
                sideEffects:newData.sideEffects, // Optional field with default empty string
                warning: newData.warning, // Optional field with default empty string
            },
            reminder: {
                enabled: newData.reminderEnabled,
                reminderTimes: reminderTimeStamps, // Array of generated reminder Timestamps
            },
            purpose: newData.purpose,
        });
        
        console.log("Medication updated successfully:", medicationId);
        return medicationId;
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

        // await deleteDoc(medicationDocRef);
        
        console.log("Medication deleted successfully:", medicationId);
        return medicationId;
    } catch (e) {
        throw new Error("Error deleting medication: " + e.message);
    }
};