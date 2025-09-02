import AuthProvider from './AuthContext';
import AppProvider from './AppContext';
import PropTypes from 'prop-types';

const Providers = ({children}) => {
    return (
        <AuthProvider>
            <AppProvider>
                {children}
            </AppProvider>
        </AuthProvider>
    );
};

Providers.propTypes = {
    children: PropTypes.node.isRequired,
};

export default Providers;