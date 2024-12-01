import React from 'react';
import { View, Text, Modal, Image, ScrollView, FlatList, TouchableOpacity } from 'react-native';
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
}) => {
   
    // Filter unique reminder times
    const uniqueReminderTimes = [...new Set(reminder.reminderTimes.map(rt => rt.time?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })))];
    // const uniqueReminderTimes = [...reminder.reminderTimes];
    const checkedSideEffects = medicationSpecification.sideEffects.filter((sideEffect) => sideEffect.checked);
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center bg-black-70">
                <View className="bg-black-200 m-16 rounded-lg shadow-lg p-6 w-11/12 max-h-3/4">
                    <ScrollView>
                        {/* Header Section with Medication Name */}
                        <View className='flex flex-row justify-between'>
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
                            <TouchableOpacity
                                className="flex-row items-center rounded-full bg-blue-800 p-2"
                                onPress={onEdit}
                                testID='edit-medication-button'
                            >
                                <icons.Pencil size={25} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Dosage and Frequency */}
                        <View className="flex-row items-center my-2">

                            <Text className="text-white ml-2">
                                <Text className="font-medium">Dosage:</Text> {dosage.amount} {dosage.unit}
                            </Text>
                        </View>
                        <View className="flex-row items-center my-2">
                            <icons.Calendar size={20} color="#65a30d" />
                            <Text className="text-white ml-2">
                                <Text className="font-medium">Frequency:</Text> {frequency}
                            </Text>
                        </View>

                        {/* Start and End Dates */}
                        <View className="flex-row justify-between mt-3">
                            <View className="flex-row items-center">

                                <Text className="text-white ml-2">
                                    Start Date: {startDate.toLocaleDateString()}
                                </Text>
                            </View>
                            <View className="flex-row items-center">

                                <Text className="text-white ml-2">
                                    End Date: {endDate.toLocaleDateString()}
                                </Text>
                            </View>
                        </View>

                        {/* Directions, Side Effects, and Warnings */}
                        <View className="border-t border-gray-300 mt-4 pt-4">
                            <LongTextComponent
                                Icon={icons.ClipboardDocument}
                                title="Directions"
                                content={medicationSpecification.directions}
                            />



                            {medicationSpecification.warning && (
                                    <LongTextComponent
                                        Icon={icons.ExclamationTriangle}
                                        title="Warnings"
                                        content={medicationSpecification.warning}
                                    />
                            )}
                        </View>

                        {/* Reminder Section */}
                        {reminder.enabled && uniqueReminderTimes.length > 0 && (
                            <View className="border-t border-gray-300 mt-4 pt-4">
                                <View className="flex flex-row items-center gap-1">
                                    <icons.Bell size={25} color="#65a30d" />
                                    <Text className="text-white font-medium flex-row items-center">
                                        Reminder:
                                    </Text>
                                </View>

                                <View className="ml-6 mt-2">
                                    {uniqueReminderTimes.map((time, index) => (
                                        <Text key={index} className="text-sm text-white">- {time}</Text>
                                    ))}
                                </View>
                            </View>
                        )}
                        {/*sideEffects*/}
                        {checkedSideEffects.length > 0 &&
                            <View className={"bg-black-200 rounded-lg mt-3"}>
                                <Text className="text-base text-gray-100 font-pmedium mb-2">Side Effects Checklist</Text>

                                <FlatList
                                    data={checkedSideEffects}
                                    scrollEnabled={false}
                                    keyExtractor={(item, index) => index.toString()}
                                    renderItem={({ item, index }) => (
                                        <View className="flex-row items-center">

                                            <View testID='checked'><icons.CheckCircle color="#A3E635" size={24} /></View>
                                            <Text className="ml-2 text-white font-pregular">{item.term}</Text>

                                        </View>
                                    )}
                                />

                            </View>
                        }


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
