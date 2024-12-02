import {createContext, useContext, useEffect, useState} from "react";
import { auth } from "../services/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

const FirebaseContext = createContext();

export const useFirebaseContext = () => useContext(FirebaseContext);

const FibaseProvider = ({children}) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [adherenceResponseId, setAdherenceResponseId] = useState(null);

    const onAuthStateChangedHandler = (user) => {
        if(user){
            setIsLoggedIn(true);
            setUser(user);
        } else {
            setIsLoggedIn(false);
            setUser(null);
        }
        setLoading(false);
    }

    useEffect(()=>{
        const unsubscribe = onAuthStateChanged(auth, onAuthStateChangedHandler);
        return unsubscribe;
    },[]);

    return (
        <FirebaseContext.Provider value={{isLoggedIn, user, loading, setIsLoggedIn, setUser, adherenceResponseId, setAdherenceResponseId}}>
            {children}
        </FirebaseContext.Provider>
    );
};

export default FibaseProvider;