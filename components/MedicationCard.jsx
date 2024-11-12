import React from 'react';
import { View, Text, Modal, Image, ScrollView, TouchableOpacity } from 'react-native';
import { icons } from '../constants';

const MedicationCardModal = ({
    visible,
    onClose,
    dosage,
    startDate,
    endDate,
    frequency,
    medicationSpecification,
    reminder
}) => {
    // Filter unique reminder times
    const uniqueReminderTimes = [...new Set(reminder.reminderTimes.map(time => time.toLocaleTimeString()))];
    // const uniqueReminderTimes = [...reminder.reminderTimes];
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center bg-black-70">
                <View className="bg-white rounded-lg shadow-lg p-6 w-11/12 max-h-3/4">
                    <ScrollView>
                        {/* Header Section with Medication Name */}
                        <View className="flex-row items-center mb-4">
                        <Image
          source={icons.pill}
          resizeMode="contain"
          tintColor="#91D62A" // Lime color for the icon
          className="w-8 h-8 mr-2"
        />
                            <Text className="text-lg font-semibold text-lime-600 ml-2">
                                {medicationSpecification.name}
                            </Text>
                        </View>

                        {/* Dosage and Frequency */}
                        <View className="flex-row items-center my-2">
                            
                            <Text className="text-gray-700 ml-2">
                                <Text className="font-medium">Dosage:</Text> {dosage}
                            </Text>
                        </View>
                        <View className="flex-row items-center my-2">
                            <icons.Calendar size={20} color="#6B7280" />
                            <Text className="text-gray-700 ml-2">
                                <Text className="font-medium">Frequency:</Text> {frequency}
                            </Text>
                        </View>

                        {/* Start and End Dates */}
                        <View className="flex-row justify-between mt-3">
                            <View className="flex-row items-center">
                                
                                <Text className="text-gray-500 ml-2">
                                    Start Date: {startDate.toLocaleDateString()}
                                </Text>
                            </View>
                            <View className="flex-row items-center">
                                
                                <Text className="text-gray-500 ml-2">
                                    End Date: {endDate.toLocaleDateString()}
                                </Text>
                            </View>
                        </View>

                        {/* Directions, Side Effects, and Warnings */}
                        <View className="border-t border-gray-300 mt-4 pt-4">
                            <View className="flex flex-row items-center gap-1">
                        <icons.ClipboardDocument size={20} color="#4B5563" /> 
                        <Text className="text-gray-800 font-medium flex-row items-center">
                            Directions:
                        </Text>
                        </View>
                            <Text className="text-gray-700 ml-6 mt-1">
                                {medicationSpecification.directions || 'No directions provided'}
                            </Text>

                            {medicationSpecification.sideEffects && (
                                <>
                                    <Text className="text-gray-800 font-medium mt-3 flex-row items-center">
                                        <icons.ShieldExclamation size={20} color="#DC2626" /> Side Effects:
                                    </Text>
                                    <Text className="text-gray-700 ml-6 mt-1">
                                        {medicationSpecification.sideEffects}
                                    </Text>
                                </>
                            )}

                            {medicationSpecification.warnings && (
                                <>
                                    <Text className="text-gray-800 font-medium mt-3 flex-row items-center">
                                        <icons.ExclamationTriangle size={20} color="#DC2626" /> Warnings:
                                    </Text>
                                    <Text className="text-gray-700 ml-6 mt-1">
                                        {medicationSpecification.warnings}
                                    </Text>
                                </>
                            )}
                        </View>

                        {/* Reminder Section */}
                        <View className="border-t border-gray-300 mt-4 pt-4">
                        <View className="flex flex-row items-center gap-1">
                        <icons.Bell size={25} color="#4B5563" /> 
                        <Text className="text-gray-800 font-medium flex-row items-center">
                            Reminder:
                        </Text>
                        </View>
                            {reminder.enabled && uniqueReminderTimes.length > 0 && (
                                <View className="ml-6 mt-2">
                                    {uniqueReminderTimes.map((time, index) => (
                                        <Text key={index} className="text-sm text-gray-500">
                                            - {time}
                                        </Text>
                                    ))}
                                </View>
                            )}
                        </View>
                    </ScrollView>
                    <TouchableOpacity
                        className="bg-red-500 rounded-lg p-2 mt-4"
                        onPress={onClose}
                    >
                        <Text className="text-white text-center font-bold">
                            Close
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default MedicationCardModal;
