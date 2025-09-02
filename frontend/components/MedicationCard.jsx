import React from 'react';
import { View, Text, Modal, Image, ScrollView, TouchableOpacity } from 'react-native';
import { icons } from '../constants';
import LongTextComponent from './LongTextComponent';

const MedicationCardModal = ({
    visible,
    onClose,
    dosage,
    startDate,
    endDate,
    frequency,
    medicationSpecification,
    reminder,
    onEdit,
    isActive,
}) => {
   
    // Filter unique reminder times - safely handle undefined reminderTimes
    console.log("Reminders ", reminder);
    const uniqueReminderTimes = [...new Set((reminder?.reminderTimes || []).map(rt => rt.time?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })))];
    // const uniqueReminderTimes = [...reminder.reminderTimes];
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
                                    onPress={onEdit}
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
                        {reminder.enabled && uniqueReminderTimes.length > 0 && (
                            <View className="bg-gray-800 rounded-2xl p-5 mb-4 border border-gray-700">
                                <View className="flex-row items-center mb-4">
                                    <View className="bg-yellow-500/20 p-2 rounded-xl mr-3">
                                        <icons.Bell size={18} color="#eab308" />
                                    </View>
                                    <Text className="text-secondary text-lg font-semibold">
                                        Reminder Schedule
                                    </Text>
                                </View>

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
