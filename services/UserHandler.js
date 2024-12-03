import { db, auth } from "./firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateEmail, updatePassword } from "firebase/auth";

const validateLogin = (email, password)=>{
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error("Invalid email format");
    }
    const passwordLength = 8;
    if (password.length < passwordLength) {
        throw new Error(`Password must be at least ${passwordLength} characters long`);
    }
}

export const logIn = async (email, password) => {
    validateLogin(email, password);
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        return user.uid;
    } catch (e) {
        throw new Error("Invalid email or password");
    }
};

const validateSignUp = (email, password, firstName, lastName) => {
    if (!firstName || !lastName || !email || !password) {
        throw new Error("Please fill out all required fields.");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error("Invalid email format");
    }
    const passwordLength = 8;
    if (password.length < passwordLength) {
        throw new Error(`Password must be at least ${passwordLength} characters long`);
    }
    const firstNameLength = 2;
    if (firstName.length < firstNameLength) {
        throw new Error(`First name must be at least ${firstNameLength} characters long`);
    }
    const lastNameLength = 2;
    if (lastName.length < lastNameLength) {
        throw new Error(`Last name must be at least ${lastNameLength} characters long`);
    }
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
       return uid;
    } catch(e){
        throw new Error(e.message);
    }
};

export const createNewAccount = async (email, password, firstName, lastName) => {
    validateSignUp(email, password, firstName, lastName);
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

export const logOut = async () => {
    try {
        await signOut(auth);
        console.log("User signed out successfully.");
    } catch (e) {
        throw new Error("Error signing out: " + e.message);
    }
};