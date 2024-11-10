import React, {useEffect, useState, useRef} from 'react';
import { Modal, View, TouchableOpacity, Text, Button } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { icons } from '../constants';


const CameraModal = ({ isVisible, onClose, onScan }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState('back');
  const camera = useRef(null);
    useEffect(()=>{
        requestPermission();

    },[])
    useEffect(() => {
        if (!permission) {
          requestPermission();
        }
      }, [permission]);

      if (!permission) {
        return <View />;
      }
      
      if (!permission.granted) {
        return (
          <View>
            <Text>We need your permission to show the camera</Text>
            <Button onPress={requestPermission} title="Grant permission" />
          </View>
        );
      }
  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={isVisible}
      onRequestClose={onClose}
    >
      <SafeAreaView className=" h-full bg-black-200 justify-center items-center">
        <View className="flex flex-col w-[90%] rounded-lg overflow-hidden shadow-2xl p-4">
          <View className="flex h-[65vh] rounded-lg overflow-hidden">
            <CameraView
            ref={camera}

              className="h-full flex-1"
              facing={facing}
              barcodeScannerSettings={{
                barCodeTypes: ['upc_e', 'upc_a'],
              }}
              onBarcodeScanned={onScan}
            style={
                {
                  flex: 1
                }
            }
            />
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="w-14 items-center mt-4 mx-auto p-2 bg-red-400 rounded-full"
          >
            <icons.XCircle color="#FFF" size={24} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default CameraModal;
