import { db } from "./firebaseConfig";
import {collection, addDoc, Timestamp, doc, getDoc, getDocs, setDoc, query, where } from "firebase/firestore";
import { addDays, isBefore } from 'date-fns';


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
export const addNewMedication = async ({ userId, dosage, startDate, endDate, frequency, medicationSpecification, reminder }) => {
    try {
        // Generate reminder date-times between startDate and endDate as Firebase Timestamps
         // Provided reminder times as an array of time strings
        const reminderTimes = reminder.reminders.map(r=>({ time: Timestamp.fromDate(r.time), id: r.id}));
        const docRef = await addDoc(collection(db, 'medications'), {
            userId: `users/${userId}`, // Reference to the user's path
            dosage,
            startDate: Timestamp.fromDate(new Date(startDate)), // Convert startDate to Firebase Timestamp
            endDate: Timestamp.fromDate(new Date(endDate)), // Convert endDate to Firebase Timestamp
            frequency,
            medicationSpecification: {
                name: medicationSpecification.name,
                directions: medicationSpecification.directions || '',
                sideEffects: medicationSpecification.sideEffects || [], // Optional field with default empty string
                warnings: medicationSpecification.warnings || '', // Optional field with default empty string
            },
            reminder: {
                enabled: reminder.enabled,
                reminderTimes, // Array of generated reminder Timestamps
            },
        });
        console.log("Document written with ID: ", docRef.id);
        return docRef.id;
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