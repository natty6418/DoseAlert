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