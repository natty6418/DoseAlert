import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';
import FormField from '../FormField';
import { icons } from '../../../constants';

const AdditionalInfoSection = ({ purpose, directions, warning, onPurposeChange, onDirectionsChange, onWarningChange }) => {
    return (
        <View className="bg-gray-800 border border-gray-700 rounded-2xl p-5 mb-4">
            <View className="flex-row items-center mb-4">
                <View className="bg-purple-500/20 p-2 rounded-xl mr-3">
                    <icons.ClipboardDocument size={18} color="#8b5cf6" />
                </View>
                <Text className="text-white font-psemibold text-lg">Additional Information</Text>
            </View>
            
            <FormField
                title="Purpose"
                value={purpose}
                handleChangeText={onPurposeChange}
                otherStyles="mb-3"
                keyboardType="default"
                placeholder="What is this medication for?"
                maxLength={255}
            />
            <FormField
                title="Directions"
                value={directions}
                handleChangeText={onDirectionsChange}
                otherStyles="mb-3"
                keyboardType="default"
                placeholder="How should this be taken?"
                multiline={true}
                maxLength={255}
            />
            <FormField
                title="Warning"
                value={warning}
                handleChangeText={onWarningChange}
                otherStyles=""
                keyboardType="default"
                placeholder="Important warnings or precautions"
                multiline={true}
                maxLength={255}
            />
        </View>
    );
};

AdditionalInfoSection.propTypes = {
    purpose: PropTypes.string.isRequired,
    directions: PropTypes.string.isRequired,
    warning: PropTypes.string.isRequired,
    onPurposeChange: PropTypes.func.isRequired,
    onDirectionsChange: PropTypes.func.isRequired,
    onWarningChange: PropTypes.func.isRequired,
};

export default AdditionalInfoSection;
