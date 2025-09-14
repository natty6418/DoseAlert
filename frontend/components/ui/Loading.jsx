import React from 'react';
import { View, ActivityIndicator } from 'react-native';

const LoadingSpinner = ({ size = 'large', color = '#6366F1' }) => {
    return (
        <View className="flex-1 justify-center items-center bg-black-100">
            <ActivityIndicator size={size} color={color} />
        </View>
    );
};

export default LoadingSpinner;
