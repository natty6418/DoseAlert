import { db } from "./firebaseConfig";
import {collection, addDoc, Timestamp} from "firebase/firestore";
import { addDays, isBefore } from 'date-fns';


export const createNewUser = async ({firstName, lastName, email}) => {
    try{
        const docRef = await addDoc(collection(db, "users"), {
            firstName,
            lastName,
            email,
        });
        console.log("Document written with ID: ", docRef.id);
        return docRef.id;
    } catch(e){
        throw new Error(e.message);
    }
};

export const addNewMedication = async ({ userId, dosage, startDate, endDate, frequency, medicationSpecification, reminder }) => {
    try {
        // Generate reminder date-times between startDate and endDate as Firebase Timestamps
        const generateReminderDates = (start, end, times) => {
            let reminderDates = [];
            let currentDate = new Date(start);
            
            // Iterate over each day from startDate to endDate
            while (isBefore(currentDate, new Date(end)) || currentDate.toDateString() === new Date(end).toDateString()) {
                // Add reminder times to the current date
                times.forEach(time => {
                    // Parse the reminder time (e.g., "08:00 AM") and create a full date-time
                    const [hours, minutes] = time.split(':');
                    const ampm = time.includes('AM') ? 'AM' : 'PM';
                    let dateTime = new Date(currentDate);
                    dateTime.setHours(ampm === 'AM' ? parseInt(hours) : parseInt(hours) + 12);
                    dateTime.setMinutes(parseInt(minutes));
                    dateTime.setSeconds(0);
                    dateTime.setMilliseconds(0);

                    // Convert to Firebase Timestamp
                    reminderDates.push(Timestamp.fromDate(dateTime));
                });

                // Move to the next day
                currentDate = addDays(currentDate, 1);
            }

            return reminderDates;
        };

        const reminderTimes = reminder.reminderTimes || []; // Provided reminder times as an array of time strings
        const generatedReminderDates = generateReminderDates(startDate, endDate, reminderTimes);

        const docRef = await addDoc(collection(db, 'medications'), {
            user: `users/${userId}`, // Reference to the user's path
            dosage,
            startDate: Timestamp.fromDate(new Date(startDate)), // Convert startDate to Firebase Timestamp
            endDate: Timestamp.fromDate(new Date(endDate)), // Convert endDate to Firebase Timestamp
            frequency,
            medicationSpecification: {
                name: medicationSpecification.name,
                directions: medicationSpecification.directions || '',
                sideEffects: medicationSpecification.sideEffects || '', // Optional field with default empty string
                warnings: medicationSpecification.warnings || '', // Optional field with default empty string
            },
            reminder: {
                enabled: reminder.enabled,
                reminderTimes: generatedReminderDates, // Array of generated reminder Timestamps
            },
        });
        console.log("Document written with ID: ", docRef.id);
        return docRef.id;
    } catch (e) {
        throw new Error(e.message);
    }
};