import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';
import FormField from '../FormField';

const AdditionalInfoSection = ({ purpose, directions, warning, onPurposeChange, onDirectionsChange, onWarningChange }) => {
    return (
        <View className="bg-primary rounded-2xl p-4 mb-4">
            <Text className="text-secondary font-pmedium text-lg mb-3">Additional Information</Text>
            <FormField
                title="Purpose"
                value={purpose}
                handleChangeText={onPurposeChange}
                otherStyles=""
                keyboardType="default"
                placeholder="What is this medication for?"
                maxLength={255}
            />
            <FormField
                title="Directions"
                value={directions}
                handleChangeText={onDirectionsChange}
                otherStyles="mt-3"
                keyboardType="default"
                placeholder="How should this be taken?"
                multiline={true}
                maxLength={255}
            />
            <FormField
                title="Warning"
                value={warning}
                handleChangeText={onWarningChange}
                otherStyles="mt-3"
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
