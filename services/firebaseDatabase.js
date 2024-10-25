import { db } from "./firebaseConfig";
import {collection, addDoc, getDocs} from "firebase/firestore";

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