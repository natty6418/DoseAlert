import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { useFirebaseContext } from '../../contexts/FirebaseContext';
import { getAdherenceData } from '../../services/AdherenceTracker';
import LoadingSpinner from '../../components/Loading';
import MedicationReportItem from '../../components/MedicationReportItem';
import ResponseModal from '../../components/ResponseModal';
import { ProgressChart } from 'react-native-chart-kit';



const Report = () => {
  const [isLoading, setIsLoading] = useState(true);
const [medications, setMedications] = useState([]);
const [adherenceData, setAdherenceData] = useState({});
const [responseModalVisible, setResponseModalVisible] = useState(false);
const context = useFirebaseContext();

console.log(context.medications);
const chartConfig = {
  backgroundGradientFrom: '#1f2937',
  backgroundGradientTo: '#1f2937',
  color: (opacity = 1) => `rgba(50, 205, 50, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
};


// Function to fetch and filter medications
const filterAndSetMedications = () => {
  if (context.medications) {
    const filteredMedications = context.medications.filter(
      (med) => new Date(med.endDate) > new Date()
    );
    setMedications(filteredMedications);
  }
};

useEffect(() => {
  filterAndSetMedications();
}, [context.medications]);



useEffect(() => {
  const fetchMedicationsAdherence = async () => {
    try {
      const filteredMedications = context.medications.filter(
        (med) => new Date(med.endDate) >= new Date()
      );
      const adherenceData = await getAdherenceData(
        filteredMedications.map((med) => med.id)
      );
      setAdherenceData(adherenceData);
      setMedications(filteredMedications); // Ensure consistent state
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (context.medications) {
    fetchMedicationsAdherence();
  }
}, [context.medications]);

useEffect(() => {
  if (context.adherenceResponseId) {
    setResponseModalVisible(true);
  }
}, [context.adherenceResponseId]);

const selectedMedication = medications.find(
  (med) => med.id === context.adherenceResponseId
);

const calculateAdherencePercentage = (taken, missed) => {
  const total = taken + missed;
  return total > 0 ? Math.round((taken / total) * 100) : 0;
};

const totalTaken = Object.values(adherenceData).reduce(
  (sum, data) => sum + (data.taken || 0),
  0
);
const totalMissed = Object.values(adherenceData).reduce(
  (sum, data) => sum + (data.missed || 0),
  0
);
const overallAdherencePercentage =
  calculateAdherencePercentage(totalTaken, totalMissed) / 100;

if (isLoading) {
  return <LoadingSpinner />;
}


  return (
    <SafeAreaView className="bg-black-100 h-full pt-12">
      <View className="flex-1">
        <ScrollView>
          <View className="px-4 mt-4">
           
            <View className="bg-gray-800 p-4 mb-6 rounded-lg border border-lime-500 shadow-lg">
              <Text className="text-lime-400 text-xl font-semibold mb-4 text-center">
                Overall Adherence
              </Text>
              <View className="flex items-center relative">
              <ProgressChart
              data={{ data: [overallAdherencePercentage] }}
              width={Dimensions.get('window').width - 64}
              height={200}
              strokeWidth={16}
              radius={80}
              chartConfig={chartConfig}
              hideLegend={true}
            />
            <Text
                className="text-lime-400 text-2xl font-semibold absolute top-[42%]"
                >
                  {Math.round(overallAdherencePercentage * 100)}%
                </Text>
              </View>
            </View>
            {medications.length > 0 ? (
              medications.map((med, index) => {
                const adherence = adherenceData[med.id] || {};
                const adherencePercentage = calculateAdherencePercentage(adherence.taken || 0, adherence.missed || 0);

                return (
                  <View key={index} className="bg-gray-800 p-4 mb-4 rounded-lg border border-lime-500 shadow-lg">
                    <MedicationReportItem
                      medication={med}
                      taken={adherence.taken}
                      missed={adherence.missed}
                    />
                    <View className="mt-2">
                      <Text className="text-lime-400 text-lg">
                        Consecutive Misses: <Text className="font-semibold">{adherence.consecutiveMisses || 0}</Text>
                      </Text>
                      <Text className="text-lime-400 text-lg">
                        Adherence Percentage: <Text className="font-semibold">{adherencePercentage}%</Text>
                      </Text>
                      {adherence.prevMiss ? (
                        <Text className="text-red-400 text-lg font-semibold mt-1">Previous dose missed</Text>
                      ) : (
                        <Text className="text-green-400 text-lg font-semibold mt-1">All doses taken as scheduled</Text>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <Text className="text-gray-500 text-center mt-4">No active medications found.</Text>
            )}
          </View>
        </ScrollView>
      </View>
      {selectedMedication && (
        <ResponseModal
          id={context.adherenceResponseId}
          name={selectedMedication?.medicationSpecification?.name}
          visible={responseModalVisible}
          onClose={() => {
            setResponseModalVisible(false);
            context.setAdherenceResponseId(null);
          }}
          setAdherenceData={setAdherenceData}
          adherenceData={adherenceData}
        />
      )}
    </SafeAreaView>
  );
};

export default Report;
