import React from 'react';
import { View, ActivityIndicator } from 'react-native';

const LoadingSpinner = ({ size = 'large', color = '#A3E635' }) => {
    return (
        <View className="flex-1 justify-center items-center bg-gray-900">
            <ActivityIndicator size={size} color={color} />
        </View>
    );
};

export default LoadingSpinner;
