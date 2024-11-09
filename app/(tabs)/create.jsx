import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Button } from 'react-native';
import { useFirebaseContext } from '../../contexts/FirebaseContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingSpinner from '../../components/Loading';
import { getMedications } from '../../services/firebaseDatabase';
import AddMedicationPlanModal from '../../components/AddMedicationModal';
import SearchBar from '../../components/SearchBar';
import { icons } from '../../constants';






const CreateScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
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
    setModalVisible(false);
  };

  const filteredPlans = medicationPlans.filter(plan =>
    plan.medicationSpecification.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView className="bg-black-100 h-full py-4">
      <View className="flex-1 p-4">
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

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="absolute bottom-6 left-1/2  bg-lime-500 p-4 rounded-full shadow-lg"
        >
          <icons.PlusCircle color="#FFF" size={48} style={{ width: 48, height: 48 }}/>
        </TouchableOpacity>

        <AddMedicationPlanModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSave={handleSavePlan}
        />
      </View>
    </SafeAreaView>
  );
};

export default CreateScreen;
