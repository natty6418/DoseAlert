import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView,
  TouchableOpacity,
  Alert 
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getAdherenceRecords, recordAdherence } from '../../services/AdherenceTracker';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../../components/ui/Loading';
import { CheckCircle, Clock, Pill, ArrowLeft, Calendar } from 'lucide-react-native';

const MissedMedications = () => {
  const { user } = useAuth();
  const { medications } = useApp();
  const [missedRecords, setMissedRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState(new Set());

  useEffect(() => {
    fetchMissedMedications();
  }, [user]);

  const fetchMissedMedications = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const records = await getAdherenceRecords(user.id);
      
      // Filter for missed records from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const missed = records.filter(record => 
        record.status === 'missed' && 
        new Date(record.scheduledTime) >= sevenDaysAgo
      );
      
      setMissedRecords(missed);
    } catch (error) {
      console.error('Error fetching missed medications:', error);
      Alert.alert('Error', 'Failed to load missed medications.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsTaken = async (record) => {
    if (updatingIds.has(record.id)) return;

    try {
      setUpdatingIds(prev => new Set([...prev, record.id]));

      // Update the record status to 'taken'
      await recordAdherence(
        user.id,
        record.medicationId,
        'taken',
        record.scheduledTime,
        new Date().toISOString(), // Mark as taken now
        'Updated from missed medications list',
        record.reminderId
      );

      // Remove from missed list
      setMissedRecords(prev => prev.filter(r => r.id !== record.id));
      
      Alert.alert(
        'Updated!',
        'Medication marked as taken.',
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error updating medication status:', error);
      Alert.alert('Error', 'Failed to update medication status.');
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(record.id);
        return newSet;
      });
    }
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateStr;
    if (date.toDateString() === today.toDateString()) {
      dateStr = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateStr = 'Yesterday';
    } else {
      dateStr = date.toLocaleDateString([], { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }

    const timeStr = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    return { dateStr, timeStr };
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView className="bg-black-100 h-full pt-12">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mr-4 p-2"
          >
            <ArrowLeft size={24} color="#c0ee77" />
          </TouchableOpacity>
          <Text className="text-secondary text-2xl font-bold flex-1">
            Missed Medications
          </Text>
        </View>

        <ScrollView className="flex-1 px-4">
          {missedRecords.length === 0 ? (
            <View className="flex-1 justify-center items-center py-20">
              <View className="bg-green-900/20 p-6 rounded-full mb-4">
                <CheckCircle size={48} color="#10B981" />
              </View>
              <Text className="text-green-400 text-xl font-semibold mb-2 text-center">
                Great job!
              </Text>
              <Text className="text-gray-400 text-center text-lg">
                No missed medications in the last 7 days
              </Text>
            </View>
          ) : (
            <>
              <Text className="text-gray-400 text-sm mb-4">
                Last 7 days • {missedRecords.length} missed dose{missedRecords.length !== 1 ? 's' : ''}
              </Text>

              {missedRecords.map((record) => {
                const medication = medications?.find(med => med.id === record.medicationId);
                const medicationName = record.medicationName || 
                  medication?.name || 
                  medication?.medicationSpecification?.name || 
                  'Unknown Medication';
                
                const dosage = medication?.dosageAmount && medication?.dosageUnit 
                  ? `${medication.dosageAmount} ${medication.dosageUnit}`
                  : medication?.dosage?.amount && medication?.dosage?.unit 
                    ? `${medication.dosage.amount} ${medication.dosage.unit}`
                    : '';

                const { dateStr, timeStr } = formatDateTime(record.scheduledTime);
                const isUpdating = updatingIds.has(record.id);

                return (
                  <View
                    key={record.id}
                    className="bg-gray-800 p-4 mb-3 rounded-lg border border-red-500/30"
                  >
                    <View className="flex-row items-start">
                      <View className="bg-red-900/30 p-2 rounded-full mr-4">
                        <Pill size={20} color="#EF4444" />
                      </View>

                      <View className="flex-1">
                        <Text className="text-white text-lg font-semibold mb-1">
                          {medicationName}
                        </Text>
                        {dosage && (
                          <Text className="text-gray-300 text-sm mb-2">
                            {dosage}
                          </Text>
                        )}
                        
                        <View className="flex-row items-center mb-3">
                          <Calendar size={14} color="#9CA3AF" />
                          <Text className="text-gray-400 text-sm ml-2 mr-4">
                            {dateStr}
                          </Text>
                          <Clock size={14} color="#9CA3AF" />
                          <Text className="text-gray-400 text-sm ml-2">
                            {timeStr}
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => handleMarkAsTaken(record)}
                          disabled={isUpdating}
                          className={`flex-row items-center justify-center py-3 px-4 rounded-lg ${
                            isUpdating 
                              ? 'bg-gray-600' 
                              : 'bg-green-600 active:bg-green-700'
                          }`}
                        >
                          <CheckCircle size={20} color="white" />
                          <Text className="text-white font-semibold ml-2">
                            {isUpdating ? 'Updating...' : 'Actually, I took this'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default MissedMedications;
