import { db, auth } from "./firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";


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
