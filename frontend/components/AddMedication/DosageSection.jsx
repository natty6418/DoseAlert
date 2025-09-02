import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';
import FormField from '../FormField';

const DosageSection = ({ dosage, onDosageChange }) => {
    return (
        <View className="bg-primary rounded-2xl p-4 mb-4">
            <Text className="text-secondary font-pmedium text-lg mb-3">Dosage Information</Text>
            <View className={'flex-row gap-3'}>
                <FormField
                    title="Amount"
                    value={dosage.amount}
                    handleChangeText={(e) => onDosageChange({ ...dosage, amount: e })}
                    otherStyles="flex-1"
                    keyboardType="default"
                    placeholder="200"
                    required={true}
                    maxLength={5}
                />
                <FormField
                    title="Unit"
                    value={dosage.unit}
                    handleChangeText={(e) => onDosageChange({ ...dosage, unit: e })}
                    otherStyles="flex-1"
                    keyboardType="default"
                    placeholder="mg"
                    maxLength={8}
                />
            </View>
        </View>
    );
};

DosageSection.propTypes = {
    dosage: PropTypes.shape({
        amount: PropTypes.string.isRequired,
        unit: PropTypes.string.isRequired,
    }).isRequired,
    onDosageChange: PropTypes.func.isRequired,
};

export default DosageSection;
