import AuthProvider from './AuthContext';
import AppProvider from './AppContext';
import PropTypes from 'prop-types';

const Providers = ({children}) => {
    return (
        <AppProvider>
            <AuthProvider>
                {children}
            </AuthProvider>
        </AppProvider>
    );
};

Providers.propTypes = {
    children: PropTypes.node.isRequired,
};

export default Providers;