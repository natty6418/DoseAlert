import {createContext, useContext, useEffect, useState} from "react";
import { auth } from "../services/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { getUser } from "../services/firebaseDatabase";

const FirebaseContext = createContext();

export const useFirebaseContext = () => useContext(FirebaseContext);

const FirebaseProvider = ({children}) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const onAuthStateChangedHandler = (user) => {
        if(user){
            getUser(user.uid).then((userData)=>{
                setUser({...userData, id: user.uid});
            }
            );
            setIsLoggedIn(true);
            
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
        <FirebaseContext.Provider value={{isLoggedIn, user, loading, setIsLoggedIn, setUser}}>
            {children}
        </FirebaseContext.Provider>
    );
};

export default FirebaseProvider;