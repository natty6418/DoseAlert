import { db, auth } from "./firebaseConfig";
import {collection, addDoc, Timestamp, doc, getDoc, getDocs, setDoc, query, where, updateDoc, deleteDoc } from "firebase/firestore";
import { scheduleReminders } from "./registerNotification";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateEmail, updatePassword } from "firebase/auth";

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

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isValidPassword = (password) => {
    return password.length >= 8;
};

export const logIn = async (email, password) => {
    if (!isValidEmail(email)) {
        throw new Error("Invalid email format");
    }

    if (!isValidPassword(password)) {
        throw new Error("Password must be at least 8 characters long");
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        return user.uid;
    } catch (e) {
        throw new Error("Invalid email or password");
    }
};

export const createNewAccount = async (email, password, firstName, lastName) => {
    if (!firstName || !lastName || !email || !password) {
        throw new Error("Please fill out all required fields.");
    }
    if (!isValidEmail(email)) {
        throw new Error("Invalid email format");
    }
    if (!isValidPassword(password)) {
        throw new Error("Password must be at least 8 characters long");
    }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await createNewUser({
            uid: user.uid,
            firstName,
            lastName,
            email,
        });
        return user.uid;
    } catch (e) {
        throw new Error(e.message);
    }
}

export const createNewUser = async ({uid, firstName, lastName, email}) => {
    try{
        const userDocRef = doc(db, 'users', uid); // Correct document reference
        await setDoc(userDocRef, {
            firstName,
            lastName,
            email,
        });
        console.log('User document created with UID:', uid);
       return uid;
    } catch(e){
        throw new Error(e.message);
    }
};

export const updateUserProfile = async ({ uid, newEmail, newPassword, newFirstName, newLastName }) => {
    if (!uid) {
        throw new Error("User ID is required to update the profile.");
    }

    try {
        // Update Firestore fields if provided
        if (newFirstName || newLastName) {
            const userDocRef = doc(db, "users", uid);
            const updatedData = {};
            if (newFirstName) updatedData.firstName = newFirstName;
            if (newLastName) updatedData.lastName = newLastName;
            
            await updateDoc(userDocRef, updatedData);
            console.log("User profile updated in Firestore.");
        }

        // Update Email if provided
        if (newEmail) {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error("No authenticated user found to update email.");
            }
            await updateEmail(currentUser, newEmail);
            console.log("User email updated in Firebase Authentication.");
        }

        // Update Password if provided
        if (newPassword) {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error("No authenticated user found to update password.");
            }
            await updatePassword(currentUser, newPassword);
            console.log("User password updated in Firebase Authentication.");
        }

        return { success: true, message: "User profile updated successfully." };

    } catch (e) {
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
export const setEmergencyContact = async (uid, emergencyContact) => {
    if (!uid || !emergencyContact || !emergencyContact.name || !emergencyContact.email || !emergencyContact.relationship) {
      throw new Error("All emergency contact fields (name, email, relationship) are required.");
    }
  
    try {
      const userDocRef = doc(db, "users", uid); // Reference to the user's document
      await updateDoc(userDocRef, { emergencyContact });
      console.log("Emergency contact updated successfully for user:", uid);
      return { success: true, message: "Emergency contact updated successfully." };
    } catch (error) {
      console.error("Error setting emergency contact:", error);
      throw new Error("Failed to update emergency contact.");
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
  warning,
}) => {
  try {
    const errors = checkForErrors({
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
            reminders = await scheduleReminders(newData.reminderTimes, `Time to take your ${newData.name}!`, medicationId);
        }
        const reminderTimeStamps = reminders.map(r=>({...r, time: Timestamp.fromDate(r.time)}));
        // Update the document with the new data
        const data =  {
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
        };
        await updateDoc(medicationDocRef,data);
        
        console.log("Medication updated successfully:", medicationId);
        return {data: {...data, id: medicationId, startDate: new Date(newData.startDate), endDate: new Date(newData.endDate), reminder: {...data.reminder, reminderTimes: reminders}}, error: null};
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

export const recordAdherence = async (medicationId, adherence) =>{
    try{
        const adherenceDocRef = doc(db, 'adherenceData', medicationId);
        const adherenceDoc = await getDoc(adherenceDocRef);
        if(!adherenceDoc.exists()){
            await setDoc(adherenceDocRef, {
                taken: adherence ? 1 : 0,
                missed: adherence ? 0 : 1,
                prevMiss: !adherence,
                consecutiveMisses: adherence ? 0 : 1,
            });
            return;
        } 
        const data = adherenceDoc.data();
        if(adherence){
            await updateDoc(adherenceDocRef, {taken: data.taken + 1, prevMiss: false, consecutiveMisses: 0});
        } else{
            await updateDoc(adherenceDocRef, {missed: data.missed + 1, prevMiss: true, consecutiveMisses: data.prevMiss ? data.consecutiveMisses + 1 : 1});
        }
    } catch(e){
        throw new Error("Error recording adherence: " + e.message);
    }
}

export const getAdherenceData = async (medIds) => {
    try{
        const adherenceData = {};
        for(const id of medIds){
            const adherenceDocRef = doc(db, 'adherenceData', id);
            const adherenceDoc = await getDoc(adherenceDocRef);
            if(!adherenceDoc.exists()){
                adherenceData[id] = {taken: 0, missed: 0, prevMiss: false, consecutiveMisses: 0};
            } else{
                const data = adherenceDoc.data();
                adherenceData[id] = {taken: data.taken, missed: data.missed, prevMiss: data.prevMiss, consecutiveMisses: data.consecutiveMisses};
            }
        }
        return adherenceData;
        
    }catch (e) {
        throw new Error("Error fetching adherence data: " + e.message);
    }
};