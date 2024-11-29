import { db } from "../services/firebaseConfig";

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
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

import {
    createNewUser, getUser, addNewMedication, getMedications, editMedication, deleteMedication, createNewAccount, logIn

} from "../services/firebaseDatabase";
jest.mock('../services/firebaseConfig', () => ({
    db: jest.fn(),
    auth: jest.fn().mockReturnValue({}),
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
        addDoc.mockResolvedValueOnce({ id: "med1" });

        const result = await addNewMedication(mockMedication);
        expect(addDoc).toHaveBeenCalledWith({ id: 'medicationsCollection' },{
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
            },
            purpose: undefined,
        });
        expect(result).toEqual({ data: "med1", error: null });
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
        expect(result).toBe("med1");
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
        // Mock a successful response from createUserWithEmailAndPassword
        createUserWithEmailAndPassword.mockResolvedValueOnce({
            user: { uid: "123", email: "john.doe@example.com" },
        });
        doc.mockReturnValueOnce("users/123");
        // Mock a successful response from setDoc
        setDoc.mockResolvedValueOnce();

        const result = await createNewAccount("john.doe@example.com", "password123", "John", "Doe");

        // Check if the Firebase auth method was called correctly
        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(expect.any(Function), "john.doe@example.com", "password123");

        // Check if setDoc was called to add user data to Firestore
        expect(setDoc).toHaveBeenCalledWith("users/123", {
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
        });

        // Check the result
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
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.any(Function), "john.doe@example.com", "password123");

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
});