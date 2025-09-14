import React from 'react';
import { View, Text, Modal, Image, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { icons } from '../../constants';
import LongTextComponent from '../ui/LongTextComponent';

const MedicationCardModal = ({
    visible,
    onClose,
    dosage,
    startDate,
    endDate,
    frequency,
    medicationSpecification,
    reminder,
    isActive,
    medicationData, // Complete medication object for navigation
}) => {
   
    // Filter unique reminder times - safely handle undefined reminderTimes
    console.log("Reminders ", reminder);
    
    // Handle different reminder data structures
    let uniqueReminderTimes = [];
    
    if (reminder?.times && Array.isArray(reminder.times)) {
        // If reminder.times is an array of Date objects (from transformFromDbFormat)
        uniqueReminderTimes = reminder.times.map(time => {
            if (time instanceof Date) {
                return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            // If it's an object with time property
            if (time?.time instanceof Date) {
                return time.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            // If it's already a string
            if (typeof time === 'string') {
                return time;
            }
            return null;
        }).filter(Boolean);
    } else if (reminder?.reminderTimes && Array.isArray(reminder.reminderTimes)) {
        // Legacy structure support
        uniqueReminderTimes = reminder.reminderTimes.map(rt => {
            if (rt?.time instanceof Date) {
                return rt.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            return null;
        }).filter(Boolean);
    }
    
    // Remove duplicates
    uniqueReminderTimes = [...new Set(uniqueReminderTimes)];
    
    const checkedSideEffects = medicationSpecification.sideEffects?.filter((sideEffect) => sideEffect.checked) || [];
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/70 justify-center items-center">
                <View className="bg-gray-900 mx-4 my-8 rounded-3xl border border-gray-700 flex-1 max-h-5/6">
                    <ScrollView 
                        showsVerticalScrollIndicator={false} 
                        className="flex-1 p-6"
                    >
                        {/* Header Section with Medication Name */}
                        <View className="flex-row items-center justify-between mb-6">
                            <View className="flex-row items-center flex-1">
                                <View className="bg-secondary-200 p-3 rounded-2xl mr-4">
                                    <Image
                                        source={icons.pill}
                                        resizeMode="contain"
                                        tintColor="#1f2937"
                                        className="w-6 h-6"
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xl font-bold text-white mb-1">
                                        {medicationSpecification.name}
                                    </Text>
                                    <View className={`px-3 py-1 rounded-full self-start ${
                                        isActive ? 'bg-green-500/20' : 'bg-gray-500/20'
                                    }`}>
                                        <Text className={`text-xs font-medium ${
                                            isActive ? 'text-green-400' : 'text-gray-400'
                                        }`}>
                                            {isActive ? 'Active' : 'Inactive'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            {isActive && (
                                <TouchableOpacity
                                    className="bg-blue-600 p-3 rounded-2xl shadow-lg active:opacity-80"
                                    onPress={() => {
                                        // Close the modal first
                                        onClose();
                                        
                                        // Navigate to edit page with medication data
                                        const editData = medicationData || {
                                            medicationSpecification,
                                            dosage,
                                            start_date: startDate,
                                            end_date: endDate,
                                            frequency,
                                            reminder,
                                            isActive,
                                        };
                                        
                                        // Convert Date objects in reminder.times to time strings to avoid timezone issues
                                        if (editData.reminder && editData.reminder.times) {
                                            editData.reminder.times = editData.reminder.times.map(time => {
                                                if (time instanceof Date) {
                                                    // Convert to HH:MM:SS format to avoid timezone conversion
                                                    return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:00`;
                                                }
                                                return time;
                                            });
                                        }
                                        
                                        router.push({
                                            pathname: '/(tabs)/(medication)/edit',
                                            params: {
                                                medicationData: JSON.stringify(editData)
                                            }
                                        });
                                    }}
                                    testID='edit-medication-button'
                                >
                                    <icons.Pencil size={20} color="#fff" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Medication Details Card */}
                        <View className="bg-gray-800 rounded-2xl p-5 mb-4 border border-gray-700">
                            <Text className="text-secondary text-lg font-semibold mb-4">Medication Details</Text>
                            
                            {/* Dosage and Frequency */}
                            <View className="space-y-3">
                                <View className="flex-row items-center">
                                    <View className="bg-blue-500/20 p-2 rounded-xl mr-3">
                                        <icons.Beaker size={18} color="#3b82f6" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-sm">Dosage</Text>
                                        <Text className="text-white font-medium">
                                            {dosage?.amount && dosage?.unit ? `${dosage.amount} ${dosage.unit}` : 'Not specified'}
                                        </Text>
                                    </View>
                                </View>
                                
                                <View className="flex-row items-center">
                                    <View className="bg-purple-500/20 p-2 rounded-xl mr-3">
                                        <icons.Calendar size={18} color="#8b5cf6" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-sm">Frequency</Text>
                                        <Text className="text-white font-medium">{frequency}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Duration Card */}
                        <View className="bg-gray-800 rounded-2xl p-5 mb-4 border border-gray-700">
                            <Text className="text-secondary text-lg font-semibold mb-4">Treatment Duration</Text>
                            <View className="flex-row justify-between">
                                <View className="flex-1 mr-2">
                                    <View className="flex-row items-center mb-2">
                                        <View className="bg-green-500/20 p-1.5 rounded-lg mr-2">
                                            <icons.PlayCircle size={16} color="#10b981" />
                                        </View>
                                        <Text className="text-gray-400 text-sm">Start Date</Text>
                                    </View>
                                    <Text className="text-white font-medium">
                                        {startDate ? new Date(startDate).toLocaleDateString() : 'Not set'}
                                    </Text>
                                </View>
                                
                                <View className="flex-1 ml-2">
                                    <View className="flex-row items-center mb-2">
                                        <View className="bg-red-500/20 p-1.5 rounded-lg mr-2">
                                            <icons.StopCircle size={16} color="#ef4444" />
                                        </View>
                                        <Text className="text-gray-400 text-sm">End Date</Text>
                                    </View>
                                    <Text className="text-white font-medium">
                                        {endDate ? new Date(endDate).toLocaleDateString() : 'Not set'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Instructions and Warnings Card */}
                        <View className="bg-gray-800 rounded-2xl p-5 mb-4 border border-gray-700">
                            <Text className="text-secondary text-lg font-semibold mb-4">Instructions & Safety</Text>
                            
                            <LongTextComponent
                                Icon={icons.ClipboardDocument}
                                title="Directions"
                                content={medicationSpecification.directions}
                            />

                            {medicationSpecification.warning && (
                                <View className="mt-4">
                                    <LongTextComponent
                                        Icon={icons.ExclamationTriangle}
                                        title="Warnings"
                                        content={medicationSpecification.warning}
                                    />
                                </View>
                            )}
                        </View>

                        {/* Reminder Section */}
                        {(reminder || reminder?.enabled || uniqueReminderTimes.length > 0) && (
                            <View className="bg-gray-800 rounded-2xl p-5 mb-4 border border-gray-700">
                                <View className="flex-row items-center mb-4">
                                    <View className="bg-yellow-500/20 p-2 rounded-xl mr-3">
                                        <icons.Bell size={18} color="#eab308" />
                                    </View>
                                    <Text className="text-secondary text-lg font-semibold">
                                        Reminder Schedule {reminder?.enabled ? '(Enabled)' : '(Disabled)'}
                                    </Text>
                                </View>

                                {uniqueReminderTimes.length > 0 ? (
                                    <View className="space-y-2">
                                        {uniqueReminderTimes.map((time, index) => (
                                            <View key={index} className="flex-row items-center bg-gray-700/50 p-3 rounded-xl">
                                                <View className="bg-accent/20 p-1.5 rounded-lg mr-3">
                                                    <icons.Clock size={16} color="#c0ee77" />
                                                </View>
                                                <Text className="text-white font-medium">{time}</Text>
                                            </View>
                                        ))}
                                    </View>
                                ) : (
                                    <View className="bg-gray-700/50 p-3 rounded-xl">
                                        <Text className="text-gray-400 text-center">
                                            {reminder?.enabled ? 'No reminder times set' : 'Reminders are disabled'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                        {/* Side Effects Section */}
                        {checkedSideEffects.length > 0 && (
                            <View className="bg-gray-800 rounded-2xl p-5 mb-4 border border-gray-700">
                                <View className="flex-row items-center mb-4">
                                    <View className="bg-orange-500/20 p-2 rounded-xl mr-3">
                                        <icons.ExclamationTriangle size={18} color="#f97316" />
                                    </View>
                                    <Text className="text-secondary text-lg font-semibold">
                                        Monitored Side Effects
                                    </Text>
                                </View>

                                <View className="space-y-2">
                                    {checkedSideEffects.map((item, index) => (
                                        <View key={index} className="flex-row items-center bg-gray-700/50 p-3 rounded-xl">
                                            <View className="bg-green-500/20 p-1.5 rounded-lg mr-3">
                                                <icons.CheckCircle size={16} color="#10b981" />
                                            </View>
                                            <Text className="text-white font-medium flex-1">{item.term}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}


                    </ScrollView>
                    
                    {/* Close Button */}
                    <View className="p-6 pt-4 border-t border-gray-700">
                        <TouchableOpacity
                            className="bg-red-600 rounded-2xl p-4 active:opacity-80"
                            onPress={onClose}
                        >
                            <Text className="text-white text-center font-bold text-lg">
                                Close
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default MedicationCardModal;
