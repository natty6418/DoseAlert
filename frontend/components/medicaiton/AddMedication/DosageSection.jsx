import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';
import FormField from '../FormField';

const DosageSection = ({ dosage, onDosageChange, error }) => {
    return (
        <View className="bg-gray-800 border border-gray-700 rounded-2xl p-5 mb-4">
            <View className="flex-row items-center mb-4">
                <View className="bg-blue-500/20 p-2 rounded-xl mr-3">
                    <View className="w-5 h-5 bg-blue-500 rounded-full" />
                </View>
                <Text className="text-white font-psemibold text-lg">Dosage Information</Text>
            </View>
            
            <View className={'flex-row gap-3'}>
                <FormField
                    title="Amount"
                    value={dosage.amount}
                    handleChangeText={(e) => onDosageChange({ ...dosage, amount: e })}
                    otherStyles="flex-1"
                    keyboardType="numeric"
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
            
            {error && (
                <Text className="text-red-400 text-sm mt-2">{error}</Text>
            )}
        </View>
    );
};

DosageSection.propTypes = {
    dosage: PropTypes.shape({
        amount: PropTypes.string.isRequired,
        unit: PropTypes.string.isRequired,
    }).isRequired,
    onDosageChange: PropTypes.func.isRequired,
    error: PropTypes.string,
};

export default DosageSection;
