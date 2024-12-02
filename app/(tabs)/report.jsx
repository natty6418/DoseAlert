import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { useFirebaseContext } from '../../contexts/FirebaseContext';
import { getMedications } from '../../services/firebaseDatabase';
import LoadingSpinner from '../../components/Loading';
import MedicationReportItem from '../../components/MedicationReportItem'; // You'll need to create this component

const Report = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [medications, setMedications] = useState([]);
  const context = useFirebaseContext();

  useEffect(() => {
    const fetchMedications = async () => {
      try {
        const meds = await getMedications(context.user.id);
        setMedications(meds);
      } catch (error) {
        console.error('Error fetching medications:', error);
        // Consider adding error handling (e.g., display an error message)
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedications();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView className="bg-black-100 h-full py-4">
      <View className="flex-1">
        <ScrollView>
          <View className="px-4 mt-4">
            <Text className="text-white text-2xl font-semibold mb-4">
              Medication Report
            </Text>
            {medications.length > 0 ? (
              medications.map((med, index) => (
                <MedicationReportItem key={index} medication={med} />
              ))
            ) : (
              <Text className="text-gray-500 text-center mt-4">
                No medications found.
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Report;