import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';

const ErrorModal = ({ visible, errorMessage, onClose }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose} // Allows closing on back button press on Android
    >
      <View className="flex-1 justify-center items-center">
        <View className="bg-white rounded-lg shadow-lg p-6 w-4/5 max-w-md">
          <Text className="text-lg font-bold text-red-600 mb-4">Error</Text>
          <Text className="text-gray-800 text-base mb-6">{errorMessage}</Text>

          <TouchableOpacity
            onPress={onClose}
            className="bg-red-500 rounded-lg py-2 px-4 mt-4"
          >
            <Text className="text-white text-center font-semibold">OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ErrorModal;
