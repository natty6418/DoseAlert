import FirebaseProvider from './FirebaseContext';

const Providers = ({children}) => {
    return (
        <FirebaseProvider>
            {children}
        </FirebaseProvider>
    );
};

export default Providers;