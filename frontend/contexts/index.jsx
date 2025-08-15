import FirebaseProvider from './FirebaseContext';
import AuthProvider from './AuthContext';
import PropTypes from 'prop-types';

const Providers = ({children}) => {
    return (
        <AuthProvider>
            <FirebaseProvider>
                {children}
            </FirebaseProvider>
        </AuthProvider>
    );
};

Providers.propTypes = {
    children: PropTypes.node.isRequired,
};

export default Providers;