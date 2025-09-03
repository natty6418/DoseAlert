import React, {useEffect, useState} from 'react';
import { Modal, View, TouchableOpacity, Text, StatusBar } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { icons } from '../constants';
import PropTypes from 'prop-types';


const CameraModal = ({ isVisible, onClose, onScan }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [isScanning, setIsScanning] = useState(false);
    const facing = 'back';
    
    useEffect(()=>{
        requestPermission();
    },[])
    
    useEffect(() => {
        if (!permission) {
          requestPermission();
        }
    }, [permission]);

    const handleBarcodeScanned = (scanResult) => {
        if (!isScanning) {
            setIsScanning(true);
            onScan(scanResult);
            // Reset scanning state after a delay to prevent multiple scans
            setTimeout(() => setIsScanning(false), 2000);
        }
    };

    const handleCameraReady = () => {
        // Camera is ready for scanning
    };

    if (!permission) {
        return <View />;
    }
      
    if (!permission.granted) {
        return (
            <Modal
                transparent={true}
                animationType="fade"
                visible={isVisible}
                onRequestClose={onClose}
            >
                <View className="flex-1 bg-black/80 justify-center items-center">
                    <View className="bg-white rounded-3xl p-8 mx-6 items-center shadow-2xl">
                        <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-6">
                            <icons.Camera color="#3B82F6" size={40} />
                        </View>
                        <Text className="text-xl font-psemibold text-gray-900 text-center mb-4">
                            Camera Permission Required
                        </Text>
                        <Text className="text-gray-600 text-center mb-8 leading-6">
                            We need access to your camera to scan medication barcodes and help you manage your prescriptions.
                        </Text>
                        <View className="flex-row space-x-4">
                            <TouchableOpacity
                                onPress={onClose}
                                className="px-6 py-3 bg-gray-200 rounded-2xl"
                            >
                                <Text className="text-gray-700 font-pmedium">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={requestPermission}
                                className="px-6 py-3 bg-blue-500 rounded-2xl"
                            >
                                <Text className="text-white font-pmedium">Grant Permission</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <Modal
            transparent={false}
            animationType="slide"
            visible={isVisible}
            onRequestClose={onClose}
            testID='camera-modal'
        >
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <SafeAreaView className="flex-1 bg-black">
                {/* Header */}
                <View className="flex-row items-center justify-between px-6 py-4 bg-black/90">
                    <TouchableOpacity
                        testID="close-button"
                        onPress={onClose}
                        className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
                    >
                        <icons.XCircle color="#FFF" size={24} />
                    </TouchableOpacity>
                    
                    <View className="flex-1 items-center">
                        <Text className="text-white font-psemibold text-lg">Scan Barcode</Text>
                        <Text className="text-gray-300 font-pregular text-sm">
                            Position barcode within the frame
                        </Text>
                    </View>
                    
                    <View className="w-10" />
                </View>

                {/* Camera Container */}
                <View className="flex-1 bg-black">
                    <CameraView
                        testID="camera-view"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                        }}
                        facing={facing}
                        barcodeScannerSettings={{
                            barCodeTypes: ['upc_e', 'upc_a'],
                        }}
                        onBarcodeScanned={handleBarcodeScanned}
                        onCameraReady={handleCameraReady}
                    />
                    
                    {/* Simple Centered Scanning Frame */}
                    <View className="flex-1 items-center justify-center pointer-events-none">
                        {/* Scanning Frame */}
                        <View className="w-80 h-48 border-2 border-white rounded-xl">
                            {/* Corner brackets */}
                            <View className="absolute -top-3 -left-3">
                                <View className="w-8 h-8 border-l-4 border-t-4 border-blue-400 rounded-tl-xl shadow-xl" />
                            </View>
                            <View className="absolute -top-3 -right-3">
                                <View className="w-8 h-8 border-r-4 border-t-4 border-blue-400 rounded-tr-xl shadow-xl" />
                            </View>
                            <View className="absolute -bottom-3 -left-3">
                                <View className="w-8 h-8 border-l-4 border-b-4 border-blue-400 rounded-bl-xl shadow-xl" />
                            </View>
                            <View className="absolute -bottom-3 -right-3">
                                <View className="w-8 h-8 border-r-4 border-b-4 border-blue-400 rounded-br-xl shadow-xl" />
                            </View>
                            
                            {/* Center crosshair for precise alignment */}
                            <View className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <View className="w-12 h-0.5 bg-white/80 shadow-lg" />
                                <View className="w-0.5 h-12 bg-white/80 shadow-lg absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </View>
                            
                            {/* Scanning success indicator */}
                            {isScanning && (
                                <View className="absolute inset-0 bg-green-500/30 rounded-xl border-2 border-green-400 items-center justify-center">
                                    <icons.CheckCircle color="#10B981" size={48} />
                                    <Text className="text-green-400 font-psemibold mt-3 text-lg">Barcode Detected!</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    
                    {/* Scanning instruction - positioned at top */}
                    <View className="absolute top-20 left-0 right-0 pointer-events-none">
                        <View className="bg-black/80 mx-8 px-4 py-3 rounded-2xl">
                            <Text className="text-white font-pmedium text-center">
                                Center barcode within the frame
                            </Text>
                        </View>
                    </View>
                    
                    {/* Bottom Instructions */}
                    <View className="absolute bottom-0 left-0 right-0 px-6 pb-8">
                        <View className="bg-black/80 px-6 py-4 rounded-2xl">
                            <Text className="text-white font-pmedium text-center text-lg mb-2">
                                Scan Medication Barcode
                            </Text>
                            <Text className="text-gray-300 font-pregular text-center text-sm leading-6">
                                Hold steady and ensure the barcode is clearly visible and well-lit
                            </Text>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
};
CameraModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onScan: PropTypes.func.isRequired,
};

export default CameraModal;

