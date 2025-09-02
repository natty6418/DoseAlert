import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { getAdherenceReport, getAdherenceSummary } from '../../services/AdherenceTracker';
import LoadingSpinner from '../../components/Loading';
import MedicationReportItem from '../../components/MedicationReportItem';
import { ProgressChart } from 'react-native-chart-kit';



const Report = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [medications, setMedications] = useState([]);
  const [adherenceReport, setAdherenceReport] = useState(null);
  const [adherenceSummary, setAdherenceSummary] = useState(null);
  
  // Use AppContext and AuthContext
  const { medications: appMedications } = useApp();
  const { makeAuthenticatedRequest } = useAuth();

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
  if (appMedications) {
    const filteredMedications = appMedications.filter(
      (med) => new Date(med.end_date || med.endDate) > new Date()
    );
    setMedications(filteredMedications);
  }
};

useEffect(() => {
  filterAndSetMedications();
}, [appMedications]);



useEffect(() => {
  const fetchAdherenceData = async () => {
    try {
      setIsLoading(true);
      
      // Get adherence summary and report using the new API
      const [summaryResponse, reportResponse] = await Promise.all([
        makeAuthenticatedRequest(getAdherenceSummary),
        makeAuthenticatedRequest(getAdherenceReport, 30) // Get last 30 days
      ]);
      
      setAdherenceSummary(summaryResponse);
      setAdherenceReport(reportResponse);
      
    } catch (error) {
      console.error('Error fetching adherence data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (appMedications && appMedications.length > 0) {
    fetchAdherenceData();
  } else {
    setIsLoading(false);
  }
}, [appMedications, makeAuthenticatedRequest]);

// For now, remove the adherence response modal functionality
// since it's not clear how it integrates with the new API
useEffect(() => {
  // This functionality needs to be reimplemented with the new API
  // if (context.adherenceResponseId) {
  //   setResponseModalVisible(true);
  // }
}, []);

// For now, remove the selectedMedication logic since it depends on the old context
// const selectedMedication = medications.find(
//   (med) => med.id === context.adherenceResponseId
// );

// Calculate overall adherence from the new API data
const overallAdherencePercentage = adherenceSummary ? 
  (adherenceSummary.adherence_rate / 100) : 0;

if (isLoading) {
  return <LoadingSpinner />;
}


  return (
    <SafeAreaView className="bg-black-100 h-full pt-12">
      <View className="flex-1">
        <ScrollView>
          <View className="px-4 mt-4">
           
            <View className="bg-gray-800 p-4 mb-6 rounded-lg border border-secondary-200 shadow-lg">
              <Text className="text-secondary text-xl font-semibold mb-4 text-center">
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
                className="text-secondary text-2xl font-semibold absolute top-[42%]"
                >
                  {Math.round(overallAdherencePercentage * 100)}%
                </Text>
              </View>
            </View>
            {medications.length > 0 ? (
              medications.map((med, index) => {
                // Find adherence data for this medication from the report
                const medAdherence = adherenceReport?.medication_breakdown?.find(
                  (breakdown) => breakdown.medication_id === med.id
                ) || {};
                
                const adherencePercentage = Math.round(medAdherence.adherence_rate || 0);

                return (
                  <View key={index} className="bg-gray-800 p-4 mb-4 rounded-lg border border-secondary-200 shadow-lg">
                    <MedicationReportItem
                      medication={{
                        ...med,
                        // Ensure compatibility with MedicationReportItem component
                        medicationSpecification: {
                          name: med.name || med.medicationSpecification?.name
                        }
                      }}
                      taken={medAdherence.taken || 0}
                      missed={medAdherence.missed || 0}
                    />
                    <View className="mt-2">
                      <Text className="text-secondary text-lg">
                        Current Taken Streak: <Text className="font-semibold">{medAdherence.current_taken_streak || 0}</Text>
                      </Text>
                      <Text className="text-secondary text-lg">
                        Longest Taken Streak: <Text className="font-semibold">{medAdherence.longest_taken_streak || 0}</Text>
                      </Text>
                      <Text className="text-secondary text-lg">
                        Adherence Percentage: <Text className="font-semibold">{adherencePercentage}%</Text>
                      </Text>
                      {medAdherence.current_missed_streak > 0 ? (
                        <Text className="text-red-400 text-lg font-semibold mt-1">
                          Current missed streak: {medAdherence.current_missed_streak}
                        </Text>
                      ) : (
                        <Text className="text-accent text-lg font-semibold mt-1">On track with medication</Text>
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
      {/* Removed ResponseModal since it needs to be reimplemented with new API */}
    </SafeAreaView>
  );
};

export default Report;
