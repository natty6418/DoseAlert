import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const LongTextComponent = ({Icon, title, content }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const maxLength = 100; // Character limit for truncation

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };
    return (
        <View className="mb-2">
            <View className="flex flex-row items-center gap-1">
                <Icon size={20} color="#65a30d" />
                <Text className="text-white font-medium flex-row items-center">
                   {title}:
                </Text>
            </View>
            <Text className="text-white ml-4 mt-1">
                {isExpanded || content.length <= maxLength
                    ? content
                    : `${content.substring(0, maxLength)}...`}
            </Text>
            {content.length > maxLength && (
                <TouchableOpacity onPress={toggleExpanded}>
                    <Text className="text-green-400 ml-6 ">
                        {isExpanded ? 'See less' : 'See more'}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default LongTextComponent;
