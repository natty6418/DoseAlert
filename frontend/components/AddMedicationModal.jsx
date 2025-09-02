import React from 'react';
import { Modal, View, TouchableOpacity, Text } from 'react-native';
import { router } from 'expo-router';
import PropTypes from 'prop-types';
import { icons } from '../constants';

const AddMedicationModal = ({ visible, onClose, medicationData }) => {
    const handleOpenPage = () => {
        onClose();
        router.push({
            pathname: '/add-medication',
            params: { 
                medicationData: JSON.stringify(medicationData || {}),
                returnPath: router.canGoBack() ? 'back' : '/(tabs)/home'
            }
        });
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
            testID='add-medication-modal'
        >
            <View className="flex-1 bg-black/80 justify-center items-center">
                <View className="bg-black-100 rounded-3xl p-6 mx-4 w-[90%]">
                    <View className="flex-row justify-between items-center mb-4">
                        <TouchableOpacity
                            onPress={onClose}
                            className="w-8 h-8 bg-gray-600 rounded-full items-center justify-center"
                        >
                            <icons.XMark color="#ffffff" size={16} />
                        </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity
                        onPress={handleOpenPage}
                        className="bg-secondary p-4 rounded-2xl items-center"
                    >
                        <icons.PlusCircle color="#000000" size={48} />
                        <Text className="text-black text-xl font-psemibold mt-2">Add New Medication</Text>
                        <Text className="text-black/70 text-base font-pmedium mt-1">Create a detailed medication plan</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

AddMedicationModal.propTypes = {
    visible: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    medicationData: PropTypes.shape({
        name: PropTypes.string,
        directions: PropTypes.string,
        purpose: PropTypes.string,
        warnings: PropTypes.string,
        sideEffects: PropTypes.arrayOf(PropTypes.string),
    }),
};

export default AddMedicationModal;
