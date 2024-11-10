import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFirebaseContext } from '../../contexts/FirebaseContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingSpinner from '../../components/Loading';
import { getMedications } from '../../services/firebaseDatabase';
import AddMedicationPlanModal from '../../components/AddMedicationModal';
import SearchBar from '../../components/SearchBar';
import { icons } from '../../constants';
import CameraModal from '../../components/CameraModal';





const CreateScreen = () => {
  const [addMedicationModalVisible, setAddMedicationModalVisible] = useState(false);
  const [isScanned, setIsScanned] = useState(false);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [medicationPlans, setMedicationPlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const context = useFirebaseContext();


  
  useEffect(() => {
    try {
      const fetchMedicationPlans = async () => {
        const plans = await getMedications(context.user.uid);
        setMedicationPlans(plans);
      };
      fetchMedicationPlans();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSavePlan = (newPlan) => {
    setMedicationPlans([...medicationPlans, newPlan]);
    setAddMedicationModalVisible(false);
  };

  const filteredPlans = medicationPlans.filter(plan =>
    plan.medicationSpecification.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView className="bg-black-100 h-full pt-2">
      <View className="flex-1 px-4">
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <FlatList
          data={filteredPlans}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View className="p-4 bg-gray-800 mt-2 rounded-lg shadow-lg border border-lime-500">
              <Text className="text-lime-400 text-xl font-semibold">{item.medicationSpecification.name}</Text>
              <Text className="text-gray-300">Dosage: {item.dosage}</Text>
              <Text className="text-gray-300">Frequency: {item.frequency}</Text>
              <Text className="text-gray-300">Start Date: {item.startDate?.toDateString()}</Text>
              <Text className="text-gray-300">End Date: {item.endDate?.toDateString()}</Text>
            </View>
          )}
        />
        <View className="absolute bottom-2 left-4 w-full">
          <View className="flex flex-row gap-4 justify-between mx-auto bg-secondary-200 rounded-full px-4">
            <TouchableOpacity
              onPress={() => setAddMedicationModalVisible(true)}
              className="items-center  p-4 rounded-full"
            >
              <icons.PlusCircle color="#FFF" size={48} style={{ width: 48, height: 48 }}/>
              <Text className="text-white text-xs font-pregular">Add</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>{ 
                setCameraModalVisible(true);
                setIsScanned(false);
              }
              }
              className="items-center  p-4 rounded-2xl"
            >
              <icons.Camera color="#FFF" size={48} style={{ width: 48, height: 48 }}/>
              <Text className="text-white text-xs font-pregular">scan</Text>
            </TouchableOpacity>
          </View>
        </View>

        <AddMedicationPlanModal
          visible={addMedicationModalVisible}
          onClose={() => setAddMedicationModalVisible(false)}
          onSave={handleSavePlan}
        />
        <CameraModal
          isVisible={cameraModalVisible}
          onClose={() => setCameraModalVisible(false)}
          onScan={(data) => {
            if (isScanned) return;
            Alert.alert('Scanned', data.data); 
            setCameraModalVisible(false);
            setIsScanned(true);
          }}
        />
      </View>
    </SafeAreaView>
  );
};

export default CreateScreen;
