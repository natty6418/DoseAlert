import { db, auth } from "../services/firebaseConfig";

import {
    collection,
    addDoc,
    Timestamp,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    setDoc,
    query,
    where,
} from 'firebase/firestore';

import { scheduleReminders } from "../services/registerNotification";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateEmail, updatePassword } from "firebase/auth";

import {
    createNewUser, getUser, addNewMedication, getMedications,recordAdherence,getAdherenceData, setEmergencyContact , editMedication, deleteMedication, createNewAccount, logIn, updateUserProfile

} from "../services/firebaseDatabase";
jest.mock('../services/firebaseConfig', () => ({
    db: jest.fn(),
    auth:  {
        currentUser: { uid: "mockUserId" },
    },
}));
jest.mock("firebase/firestore", () => ({
    collection: jest.fn(),
    addDoc: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    setDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    Timestamp: {
        fromDate: jest.fn((date) => date),
    },
}));

jest.mock("../services/registerNotification", () => ({
    scheduleReminders: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    updateEmail: jest.fn(),
    updatePassword: jest.fn(),
}));


describe("createNewUser", () => {
    it("should create a new user document", async () => {
        const mockUser = { uid: "123", firstName: "John", lastName: "Doe", email: "john@example.com" };
        doc.mockReturnValueOnce(`users/${mockUser.uid}`);
        const result = await createNewUser(mockUser);
        expect(setDoc).toHaveBeenCalledWith(`users/${mockUser.uid}`, {
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
            email: mockUser.email,
        });
        expect(result).toBe(mockUser.uid);
    });

    it("should throw an error if setDoc fails", async () => {
        setDoc.mockRejectedValueOnce(new Error("Failed to create user"));
        await expect(createNewUser({ uid: "123", firstName: "John", lastName: "Doe", email: "john@example.com" }))
            .rejects.toThrow("Failed to create user");
    });
});

describe("getUser", () => {
    it("should return user data when user exists", async () => {
        const mockUserDoc = { exists: () => true, id: "123", data: () => ({ firstName: "John", lastName: "Doe" }) };
        doc.mockReturnValueOnce(`users/123`);
        getDoc.mockResolvedValueOnce(mockUserDoc);

        const result = await getUser("123");
        expect(getDoc).toHaveBeenCalledWith(`users/123`);
        expect(result).toEqual({ id: "123", firstName: "John", lastName: "Doe" });
    });

    it("should throw an error when user does not exist", async () => {
        getDoc.mockResolvedValueOnce({ exists: () => false });
        await expect(getUser("123")).rejects.toThrow("No user found with the specified UID.");
    });
});

describe("addNewMedication", () => {
    beforeEach(() => {
        collection.mockImplementation((db, collectionName) => {
            if (collectionName === 'medications') {
                return { id: 'medicationsCollection' };
            } else if (collectionName === 'users') {
                return { id: 'usersCollection' };
            }
            return null;
        });
    });
    it("should add a new medication and return doc ID if valid", async () => {
        const mockMedication = {
            userId: "123",
            dosage: { amount: 10, unit: "mg" },
            startDate: "2024-01-01",
            endDate: "2024-02-01",
            frequency: "daily",
            name: "Med1",
            reminderEnabled: true,
            reminderTimes: ["08:00"]
        };

        const mockReminders = [{ time: new Date("2024-01-01T08:00:00"), id: "reminder1" }];
        scheduleReminders.mockResolvedValueOnce(mockReminders);
        setDoc.mockResolvedValueOnce({ id: "med1" });
        doc.mockReturnValueOnce({ id: "med1" });

        const result = await addNewMedication(mockMedication);
        expect(setDoc).toHaveBeenCalledWith({ id: 'med1' },{
            userId: `users/123`,
            dosage: { amount: 10, unit: 'mg' },
            startDate: Timestamp.fromDate(new Date('2024-01-01')),
            endDate: Timestamp.fromDate(new Date('2024-02-01')),
            frequency: 'daily',
            medicationSpecification: {
                name: 'Med1',
                directions: undefined,
                sideEffects: undefined,
                warning: undefined,
            },
            reminder: {
                enabled: true,
                reminderTimes: [
                    { id: 'reminder1', time: new Date('2024-01-01T04:00:00.000Z') }
                ],
                notificationIds: ['reminder1']
            },
            purpose: undefined,
        });
        expect(result).toEqual({ data: {
            userId: `users/123`,
            id: 'med1',
            dosage: { amount: 10, unit: 'mg' },
            startDate: "2024-01-01",
            endDate: "2024-02-01",
            frequency: 'daily',
            medicationSpecification: {
                name: 'Med1',
                directions: undefined,
                sideEffects: undefined,
                warning: undefined,
            },
            reminder: {
                enabled: true,
                reminderTimes: [{
                    "id": "reminder1",
                    "time": new Date("2024-01-01T04:00:00.000Z"),
                }],
                notificationIds: ['reminder1']
            },
            purpose: undefined,
        }, error: null });
    });

    it("should return error if validation fails", async () => {
        const invalidMedication = { userId: "123", dosage: { amount: 0, unit: "" } };
        const result = await addNewMedication(invalidMedication);
        expect(result.error).toBe("Please fill out all required fields.");
    });
});

describe("getMedications", () => {
    beforeEach(() => {
        collection.mockImplementation((db, collectionName) => {
            if (collectionName === 'medications') {
                return { id: 'medicationsCollection' };
            } else if (collectionName === 'users') {
                return { id: 'usersCollection' };
            }
            return null;
        });
        where.mockReturnValue({ field: 'userId', operator: '==', value: 'users/123' });
        query.mockReturnValue('mockedQuery');
    });
    it("should return list of medications for the user", async () => {
        const mockQuerySnapshot = {
            forEach: (callback) => callback({ id: "med1", data: () => ({ startDate: {toDate: () =>new Date()}, endDate: {toDate: () =>new Date()}, reminder: { reminderTimes: [] } }) }),
        };
        getDocs.mockResolvedValueOnce(mockQuerySnapshot);

        const result = await getMedications("123");
        expect(getDocs).toHaveBeenCalledWith('mockedQuery');
        expect(result).toEqual([{ id: "med1", startDate: expect.any(Date), endDate: expect.any(Date), reminder: { reminderTimes: [] } }]);
    });
});

describe("editMedication", () => {
    beforeEach(() => {
        collection.mockImplementation((db, collectionName) => {
            if (collectionName === 'medications') {
                return { id: 'medicationsCollection' };
            } else if (collectionName === 'users') {
                return { id: 'usersCollection' };
            }
            return null;
        });
        // where.mockReturnValue({ field: 'userId', operator: '==', value: 'users/123' });
        // query.mockReturnValue('mockedQuery');
    });
    it("should update medication if valid", async () => {
        const mockMedicationData = { 
            userId: "123",
            name: "Med1", 
            dosage: { amount: 10, unit: "mg" }, 
            startDate: "2024-01-01", 
            endDate: "2024-02-01", 
            frequency: "daily", 
            reminderEnabled: true, 
            reminderTimes: ["08:00"],
            purpose: '',
            warning: '',
            sideEffects: [],
            directions: '',
         };
        
        doc.mockReturnValueOnce(`medications/med1`);
        getDoc.mockResolvedValueOnce({ exists: () => true });
        scheduleReminders.mockResolvedValueOnce([{ time: new Date(), id: "reminder1" }]);

        const result = await editMedication("med1", mockMedicationData);
        expect(updateDoc).toHaveBeenCalledWith(`medications/med1`, {
            userId: `users/123`,
            dosage: { amount: 10, unit: 'mg' },
            startDate: expect.any(Date),
            endDate: expect.any(Date),
            frequency: 'daily',
            medicationSpecification: {
                name: 'Med1',
                directions: '',
                sideEffects: [],
                warning: '',
            },
            reminder: {
                enabled: true,
                reminderTimes: [
                    { id: 'reminder1', time: expect.any(Date) }
                ],
            },
            purpose: '',
        });
        expect(result).toStrictEqual({
            data: {
                userId: `users/123`,
                id: 'med1',
                dosage: { amount: 10, unit: 'mg' },
                startDate: expect.any(Date),
                endDate: expect.any(Date),
                frequency: 'daily',
                medicationSpecification: {
                    name: 'Med1',
                    directions: '',
                    sideEffects: [],
                    warning: '',
                },
                reminder: {
                    enabled: true,
                    reminderTimes: [{
                        "id": "reminder1",
                        "time": expect.any(Date),
                    }],
                },
                purpose: '',
            },
            error: null
        });
    });

    it("should return error if validation fails", async () => {
        const invalidData = { dosage: { amount: 0, unit: "" } };
        const result = await editMedication("med1", invalidData);
        expect(result.error).toBe("Please fill out all required fields.");
    });
});

describe("deleteMedication", () => {
    it("should delete medication if exists", async () => {
        getDoc.mockResolvedValueOnce({ exists: () => true });
        deleteDoc.mockResolvedValueOnce();
        doc.mockReturnValueOnce(`medications/med1`);

        const result = await deleteMedication("med1");
        expect(deleteDoc).toHaveBeenCalledWith(`medications/med1`);
        expect(result).toBe("med1");
    });

    it("should throw error if medication does not exist", async () => {
        getDoc.mockResolvedValueOnce({ exists: () => false });
        await expect(deleteMedication("med1")).rejects.toThrow("Medication not found");
    });
});

describe("createNewAccount", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should create a new account and add user to Firestore", async () => {
        createUserWithEmailAndPassword.mockResolvedValueOnce({
            user: { uid: "123", email: "john.doe@example.com" },
        });
        doc.mockReturnValueOnce("users/123");
        setDoc.mockResolvedValueOnce();

        const result = await createNewAccount("john.doe@example.com", "password123", "John", "Doe");
        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith({"currentUser": {"uid": "mockUserId"}}, "john.doe@example.com", "password123");
        expect(setDoc).toHaveBeenCalledWith("users/123", {
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
        });
        expect(result).toBe("123");
    });

    test("should throw an error if email format is invalid", async () => {
        await expect(createNewAccount("invalid-email", "password123", "John", "Doe"))
            .rejects.toThrow("Invalid email format");
    });

    test("should throw an error if password is too short", async () => {
        await expect(createNewAccount("john.doe@example.com", "12345", "John", "Doe"))
            .rejects.toThrow("Password must be at least 8 characters long");
    });

    test("should throw an error if required fields are missing", async () => {
        await expect(createNewAccount("", "password123", "John", "Doe"))
            .rejects.toThrow("Please fill out all required fields.");
    });

    test("should throw an error if createUserWithEmailAndPassword fails", async () => {
        createUserWithEmailAndPassword.mockRejectedValueOnce(new Error("Failed to create user"));
        await expect(createNewAccount("john.doe@example.com", "password123", "John", "Doe"))
            .rejects.toThrow("Failed to create user");
    });
});

describe("logIn", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should log in successfully with valid credentials", async () => {
        // Mock a successful response from signInWithEmailAndPassword
        signInWithEmailAndPassword.mockResolvedValueOnce({
            user: { uid: "123" },
        });

        const result = await logIn("john.doe@example.com", "password123");

        // Check if the Firebase auth method was called correctly
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith({"currentUser": {"uid": "mockUserId"}}, "john.doe@example.com", "password123");

        // Check the result
        expect(result).toBe("123");
    });

    test("should throw an error if email format is invalid", async () => {
        await expect(logIn("invalid-email", "password123"))
            .rejects.toThrow("Invalid email format");
    });

    test("should throw an error if password is too short", async () => {
        await expect(logIn("john.doe@example.com", "12345"))
            .rejects.toThrow("Password must be at least 8 characters long");
    });

    test("should throw an error if login fails", async () => {
        signInWithEmailAndPassword.mockRejectedValueOnce(new Error("Login failed"));
        await expect(logIn("john.doe@example.com", "password123"))
            .rejects.toThrow("Invalid email or password");
    });
    it("should throw an error if doc fails to generate a reference", async () => {
        doc.mockImplementationOnce(() => {
            throw new Error("Failed to generate document reference");
        });
        await expect(createNewUser({ uid: "123", firstName: "John", lastName: "Doe", email: "john@example.com" }))
            .rejects.toThrow("Failed to generate document reference");
    });
    it("should throw an error if getDoc fails", async () => {
        getDoc.mockRejectedValueOnce(new Error("Network error"));
        await expect(getUser("123")).rejects.toThrow("Error fetching user: Network error");
    });
    it("should throw an error if scheduleReminders fails", async () => {
        scheduleReminders.mockRejectedValueOnce(new Error("Failed to schedule reminders"));
        const validMedication = {
            userId: "123",
            dosage: { amount: 10, unit: "mg" },
            startDate: "2024-01-01",
            endDate: "2024-02-01",
            frequency: "daily",
            name: "Med1",
            reminderEnabled: true,
            reminderTimes: ["08:00"],
        };
        doc.mockReturnValueOnce({ id: "med1" });
        await expect(addNewMedication(validMedication)).rejects.toThrow("Failed to schedule reminders");
    });

    it("should return detailed error messages for invalid medication input", async () => {
        const invalidMedication = {
            userId: "123",
            dosage: { amount: 10, unit: "mg" },
            startDate: "2024-01-01",
            endDate: "2023-12-31", // Invalid: endDate before startDate
            frequency: "daily",
            name: "Med",
            reminderEnabled: true,
            reminderTimes: [],
        };
        const result = await addNewMedication(invalidMedication);
        expect(result.error).toBe("End date must be after start date.");
    });
    it("should return an empty array if no medications exist", async () => {
        const mockQuerySnapshot = {
            forEach: jest.fn(), // No documents to iterate over
        };
        getDocs.mockResolvedValueOnce(mockQuerySnapshot);
        const result = await getMedications("123");
        expect(result).toEqual([]);
    });
    it("should throw an error if Firestore query fails", async () => {
        getDocs.mockRejectedValueOnce(new Error("Query failed"));
        await expect(getMedications("123")).rejects.toThrow("Error fetching medications: Query failed");
    });
    it("should update medication without reminders if reminderEnabled is false", async () => {
        const validMedication = {
            userId: "123",
            dosage: { amount: 10, unit: "mg" },
            startDate: "2024-01-01",
            endDate: "2024-02-01",
            frequency: "daily",
            name: "Med1",
            reminderEnabled: false,
            reminderTimes: [],
        };
        doc.mockReturnValueOnce("medications/med1");
        getDoc.mockResolvedValueOnce({ exists: () => true });
    
        const result = await editMedication("med1", validMedication);
        expect(updateDoc).toHaveBeenCalledWith("medications/med1", {
            userId: `users/123`,
            dosage: { amount: 10, unit: "mg" },
            startDate: expect.any(Date),
            endDate: expect.any(Date),
            frequency: "daily",
            medicationSpecification: {
                name: "Med1",
                directions: undefined,
                sideEffects: undefined,
                warning: undefined,
            },
            reminder: { enabled: false, reminderTimes: [] },
            purpose: undefined,
        });
        expect(result.error).toBeNull();
    });
    it("should throw an error if deleteDoc fails", async () => {
        getDoc.mockResolvedValueOnce({ exists: () => true }); // Simulate medication exists
        deleteDoc.mockRejectedValueOnce(new Error("Network error during deletion"));
        await expect(deleteMedication("med1")).rejects.toThrow("Error deleting medication: Network error during deletion");
    });
    it("should throw an error if uid is not provided", async () => {
        await expect(updateUserProfile({ newEmail: "test@example.com" }))
            .rejects.toThrow("User ID is required to update the profile.");
    });
    
    it("should update Firestore fields when first name or last name is provided", async () => {
        const mockUid = "mockUserId";
        const mockDocRef = "mockDocRef";
    
        doc.mockReturnValueOnce(mockDocRef);
        updateDoc.mockResolvedValueOnce();
    
        await updateUserProfile({ uid: mockUid, newFirstName: "John", newLastName: "Doe" });
    
        expect(doc).toHaveBeenCalledWith(expect.any(Function), "users", mockUid);
        expect(updateDoc).toHaveBeenCalledWith(mockDocRef, { firstName: "John", lastName: "Doe" });
    });
    
    it("should update the user email in Firebase Auth when newEmail is provided", async () => {
        const mockNewEmail = "newemail@example.com";
    
        updateEmail.mockResolvedValueOnce();
        
    
        await updateUserProfile({ uid: "mockUserId", newEmail: mockNewEmail });
    
        expect(updateEmail).toHaveBeenCalledWith(expect.any(Object), mockNewEmail);
    });
    it("should update the user password in Firebase Auth when newPassword is provided", async () => {
        const mockNewPassword = "newpassword123";
    
        updatePassword.mockResolvedValueOnce();
    
        await updateUserProfile({ uid: "mockUserId", newPassword: mockNewPassword });
    
        expect(updatePassword).toHaveBeenCalledWith(expect.any(Object), mockNewPassword);
    });
    it("should throw an error if no authenticated user is found for updating email", async () => {
        const mockAuth = require('../services/firebaseConfig').auth;
        mockAuth.currentUser = null;
    
        await expect(updateUserProfile({ uid: "mockUserId", newEmail: "newemail@example.com" }))
            .rejects.toThrow("No authenticated user found to update email.");
    });
    
    it("should throw an error if no authenticated user is found for updating password", async () => {
        const mockAuth = require('../services/firebaseConfig').auth;
        mockAuth.currentUser = null;
    
        await expect(updateUserProfile({ uid: "mockUserId", newPassword: "newpassword123" }))
            .rejects.toThrow("No authenticated user found to update password.");
    });

    it("should propagate errors from updateDoc", async () => {
        updateDoc.mockRejectedValueOnce(new Error("Firestore error"));
    
        await expect(updateUserProfile({
            uid: "mockUserId",
            newFirstName: "John",
        })).rejects.toThrow("Firestore error");
    });

    it("should throw an error if required fields are missing", async () => {
        await expect(setEmergencyContact(null, null))
          .rejects.toThrow("All emergency contact fields (name, email, relationship) are required.");
      
        await expect(
          setEmergencyContact("uid", { name: "John", email: "john@example.com" }) // Missing `relationship`
        ).rejects.toThrow("All emergency contact fields (name, email, relationship) are required.");
      });
      it("should update Firestore with emergency contact information successfully", async () => {
        const mockUid = "mockUserId";
        const mockContact = { name: "John Doe", email: "john@example.com", relationship: "Friend" };
        const mockDocRef = "mockDocRef";
      
        doc.mockReturnValueOnce(mockDocRef);
        updateDoc.mockResolvedValueOnce();
      
        const result = await setEmergencyContact(mockUid, mockContact);
      
        expect(doc).toHaveBeenCalledWith(expect.any(Function), "users", mockUid);
        expect(updateDoc).toHaveBeenCalledWith(mockDocRef, { emergencyContact: mockContact });
        expect(result).toEqual({ success: true, message: "Emergency contact updated successfully." });
      });
      it("should throw an error if Firestore update fails", async () => {
        const mockUid = "mockUserId";
        const mockContact = { name: "John Doe", email: "john@example.com", relationship: "Friend" };
      
        doc.mockReturnValueOnce("mockDocRef");
        updateDoc.mockRejectedValueOnce(new Error("Firestore error"));
      
        await expect(setEmergencyContact(mockUid, mockContact))
          .rejects.toThrow("Failed to update emergency contact.");
      });
      it("should create a new adherence record if none exists", async () => {
        const mockDocRef = "mockDocRef";
        doc.mockReturnValueOnce(mockDocRef);
        getDoc.mockResolvedValueOnce({ exists: () => false });
      
        await recordAdherence("medicationId", true);
      
        expect(setDoc).toHaveBeenCalledWith(mockDocRef, {
          taken: 1,
          missed: 0,
          prevMiss: false,
          consecutiveMisses: 0,
        });
      });
      it("should update adherence record when medication is taken", async () => {
        const mockDocRef = "mockDocRef";
        const mockData = { taken: 5, missed: 3, prevMiss: true, consecutiveMisses: 2 };
        doc.mockReturnValueOnce(mockDocRef);
        getDoc.mockResolvedValueOnce({ exists: () => true, data: () => mockData });
      
        await recordAdherence("medicationId", true);
      
        expect(updateDoc).toHaveBeenCalledWith(mockDocRef, {
          taken: 6, // Incremented
          prevMiss: false,
          consecutiveMisses: 0,
        });
      });
      it("should update adherence record when medication is missed", async () => {
        const mockDocRef = "mockDocRef";
        const mockData = { taken: 5, missed: 3, prevMiss: true, consecutiveMisses: 2 };
        doc.mockReturnValueOnce(mockDocRef);
        getDoc.mockResolvedValueOnce({ exists: () => true, data: () => mockData });
      
        await recordAdherence("medicationId", false);
      
        expect(updateDoc).toHaveBeenCalledWith(mockDocRef, {
          missed: 4, // Incremented
          prevMiss: true,
          consecutiveMisses: 3, // Incremented because prevMiss was true
        });
      });
      it("should throw an error if Firestore operation fails", async () => {
        getDoc.mockRejectedValueOnce(new Error("Firestore error"));
      
        await expect(recordAdherence("medicationId", true))
          .rejects.toThrow("Error recording adherence: Firestore error");
      });
      it("should fetch adherence data for all provided medication IDs", async () => {
        const mockDocRef = "mockDocRef";
        const mockAdherence = { taken: 5, missed: 2, prevMiss: false, consecutiveMisses: 0 };
      
        doc.mockReturnValue(mockDocRef);
        getDoc.mockResolvedValue({ exists: () => true, data: () => mockAdherence });
      
        const result = await getAdherenceData(["med1", "med2"]);
      
        expect(result).toEqual({
          med1: mockAdherence,
          med2: mockAdherence,
        });
        expect(getDoc).toHaveBeenCalledTimes(2);
      });
      it("should return default adherence data for medications without adherence records", async () => {
        const mockDocRef = "mockDocRef";
        const mockAdherence = { taken: 5, missed: 2, prevMiss: false, consecutiveMisses: 0 };
      
        doc.mockReturnValue(mockDocRef);
        getDoc
          .mockResolvedValueOnce({ exists: () => true, data: () => mockAdherence })
          .mockResolvedValueOnce({ exists: () => false });
      
        const result = await getAdherenceData(["med1", "med2"]);
      
        expect(result).toEqual({
          med1: mockAdherence,
          med2: { taken: 0, missed: 0, prevMiss: false, consecutiveMisses: 0 },
        });
      });
      it("should return default adherence data for medications without adherence records", async () => {
        const mockDocRef = "mockDocRef";
        const mockAdherence = { taken: 5, missed: 2, prevMiss: false, consecutiveMisses: 0 };
      
        doc.mockReturnValue(mockDocRef);
        getDoc
          .mockResolvedValueOnce({ exists: () => true, data: () => mockAdherence })
          .mockResolvedValueOnce({ exists: () => false });
      
        const result = await getAdherenceData(["med1", "med2"]);
      
        expect(result).toEqual({
          med1: mockAdherence,
          med2: { taken: 0, missed: 0, prevMiss: false, consecutiveMisses: 0 },
        });
      });
         
    
    
});