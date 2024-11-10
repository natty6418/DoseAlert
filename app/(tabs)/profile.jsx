import React, { useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useEffect } from 'react';
import { Button, Text, TouchableOpacity, View } from 'react-native';
import icons from '../../constants/icons';
import { Image } from 'react-native';

const Profile = () => {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [product, setProduct] = useState(null);
  const [isScanned, setIsScanned] = useState(false); // State to track scanning
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

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  async function capturePhoto() {
    try {
      const options = { quality: 0.5, base64: true };
      const photo = await camera.current.takePictureAsync(options);
      setCapturedPhoto(photo.uri);
    } catch (error) {
      console.log(error);
    }
  }

  if (capturedPhoto) {
    return (
      <SafeAreaView className="flex-1 bg-primary">
        <View className="flex flex-col p-4 h-full justify-center">
          <Image
            source={{ uri: capturedPhoto }}
            className="h-[65vh] w-full rounded-lg object-contain"
          />
          <TouchableOpacity
            onPress={() => { setCapturedPhoto(null); setIsScanned(false); }} // Reset state
            activeOpacity={0.7}
            className={`bg-secondary rounded-xl min-h-[55px] w-1/2 mx-auto mt-4 justify-center items-center p-2`}
          >
            <Text className={`text-primary font-psemibold text-lg`}>Retake</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (product) {
    return (
      <SafeAreaView className="flex-1 bg-primary">
        <View className="flex flex-col p-4 h-full justify-center text-center">
          {product.product && <Text className="text-lg font-bold text-white mx-auto">{product.product.title}</Text>}
          {product.product  && <Text className="text-lg font-bold text-white mx-auto">{product.product.description}</Text>}
          {product.product?.images.length !== 0 && <Image source={{ uri: product.product.images[0] }} className="h-[65vh] w-full rounded-lg object-contain" />}
          {!product.product && <Text className="text-lg font-bold text-red-700 mx-auto">Not Found</Text>}
          
          <TouchableOpacity
            onPress={() => { setProduct(null); setIsScanned(false); }} // Reset scanned state
            activeOpacity={0.7}
            className={`bg-secondary rounded-xl min-h-[55px] w-1/2 mx-auto mt-4 justify-center items-center p-2`}
          >
            <Text className={`text-primary font-psemibold text-lg`}>Retake</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  async function handleBarcodeScanned(data) {
    if (!isScanned && data.data) {  // Only scan if not already scanned
      setIsScanned(true);  // Prevent further scans
      console.log(data.data);

      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_PRODUCT_CATALOGUE_API_URL}?query=${data.data}`, {
          headers: {
            'Content-Type': 'application/json',
            'x-rapidapi-key': process.env.EXPO_PUBLIC_PRODUCT_CATALOGUE_API_KEY,
            'x-rapidapi-host': process.env.EXPO_PUBLIC_PRODUCT_CATALOGUE_API_HOST,
          },
        });

        if (!response.ok) {
          console.log('Product not found');
        }

        const responseBody = await response.text();
        console.log('Raw response:', responseBody);
        const jsonStart = responseBody.indexOf('{');
        const jsonString = responseBody.substring(jsonStart);

        setProduct(JSON.parse(jsonString));
      } catch (error) {
        console.log('Error fetching product:', error);
      }
    }
  }

  return (
    <CameraView
            ref={camera}
            className="h-full flex-1"
            facing={facing}
            barcodeScannerSettings={{
              barCodeTypes: ['upc_e', 'upc_a'],
            }}
            onBarcodeScanned={handleBarcodeScanned}
            style={
              {
                flex: 1
              }
            }
          />
  );
};

export default Profile;
