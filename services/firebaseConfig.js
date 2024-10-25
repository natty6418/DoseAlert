// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore";
import {initializeAuth, getReactNativePersistence, getAuth} from "firebase/auth"
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCtNUaAwJAdDK9_Skzahm-q4BldXL3AboQ",
  authDomain: "dosealert-46718.firebaseapp.com",
  projectId: "dosealert-46718",
  storageBucket: "dosealert-46718.appspot.com",
  messagingSenderId: "128650969914",
  appId: "1:128650969914:web:fd2c2971451aa9ecdc8603",
  measurementId: "G-4EXM44RFRZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
const db = getFirestore(app);
const auth = getAuth(app);

export {db, auth, app};