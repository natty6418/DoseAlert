import React from 'react';
import { View, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const AuthDebug = () => {
    const { user, accessToken, refreshToken, loading, isGuest, isAuthenticated, hasUserMadeChoice, isLoggedIn } = useAuth();

    return (
        <View className="bg-gray-800 p-4 m-4 rounded-lg">
            <Text className="text-white font-bold mb-2">Auth Debug Info:</Text>
            <Text className="text-gray-300">Loading: {loading ? 'true' : 'false'}</Text>
            <Text className="text-gray-300">Is Guest: {isGuest ? 'true' : 'false'}</Text>
            <Text className="text-gray-300">Has Access Token: {accessToken ? 'true' : 'false'}</Text>
            <Text className="text-gray-300">Has Refresh Token: {refreshToken ? 'true' : 'false'}</Text>
            <Text className="text-gray-300">Has User: {user ? 'true' : 'false'}</Text>
            <Text className="text-gray-300">Is Authenticated: {isAuthenticated() ? 'true' : 'false'}</Text>
            <Text className="text-gray-300">Has User Made Choice: {hasUserMadeChoice() ? 'true' : 'false'}</Text>
            <Text className="text-gray-300">Is Logged In: {isLoggedIn() ? 'true' : 'false'}</Text>
            {user && <Text className="text-gray-300">User Email: {user.email}</Text>}
        </View>
    );
};

export default AuthDebug;
