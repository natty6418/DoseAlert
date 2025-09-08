import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useApp } from '../../../contexts/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingSpinner from '../../../components/ui/Loading';
import SearchBar from '../../../components/ui/SearchBar';
import { icons } from '../../../constants';
import CameraModal from '../../../components/modals/CameraModal';
import MedicationCardModal from '../../../components/medication/MedicationCard';
import SelectableMedicationItem from '../../../components/medication/SelectableMedicationItem';
import { fetchDrugLabelInfo, fetchDrugSideEffects } from '../../../services/externalDrugAPI';

import ErrorModal from '../../../components/modals/ErrorModal';
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import ScreenHeader from '../../../components/ui/ScreenHeader';

const CreateScreen = () => {
 
  const [medicationCardModalVisible, setMedicationCardModalVisible] = useState(false);
  const [isScanned, setIsScanned] = useState(false);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedication, setSelectedMedication] = useState(null);
  
  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMedicationIds, setSelectedMedicationIds] = useState(new Set());
  
  // Use AppContext for medication management
  const { 
    medications, 
    
    removeMedication,
    isLoading,
    error,
    showError,
    clearError,
    showLoading,
    hideLoading
  } = useApp();

  useFocusEffect(() => {
    // No need to manually manage medication state - AppContext handles it
  });
  
  useEffect(() => {
    // Medications are automatically managed by AppContext
  }, [medications]);

  const extractSideEffectTerms = (sideEffectsData) => {
    const terms = sideEffectsData.map(effect => effect.term);
    return terms.length > 10 ? terms.slice(0, 10) : terms;
  };
  const extractDrugLabelData = (labelData) => {
    const extractedData = {};
  
    if (labelData.openfda && labelData.openfda.brand_name) {
      extractedData.name = labelData.openfda.brand_name[0];
    }
  
    if (labelData.purpose) {
      extractedData.purpose = labelData.purpose[0];
    }
  
    if (labelData.warnings) {
      extractedData.warnings = labelData.warnings[0];
    }
  
    if (labelData.openfda && labelData.openfda.package_ndc) {
      extractedData.package_ndc = labelData.openfda.package_ndc[0];
    }
  
    if (labelData.dosage_and_administration) {
      extractedData.directions = labelData.dosage_and_administration[0];
    } 
  
    return extractedData;
  };

  const handleUPCScan = async (data) => {
    setIsScanned(true);
    setCameraModalVisible(false);
    showLoading();
    try{
      const upc = data.data;
      // console.log("upc", upc);
      const label = await fetchDrugLabelInfo(upc);
      if (!label) {
        showError('No drug label information found for the provided UPC.');
        return;
      }
      const sideEffects = await fetchDrugSideEffects(label.openfda.package_ndc[0]);
      // console.log("label", label);
      // if (!sideEffects) {
      // //  showError('No side effects information found for the provided NDC.');
      //   return;
      // }
      const medicationData = {
        ...extractDrugLabelData(label),
        sideEffects: extractSideEffectTerms(sideEffects),
      };
      
      // Navigate directly to add medication page with scanned data
      router.push({
        pathname: '/(tabs)/(medication)/add',
        params: { 
          medicationData: JSON.stringify(medicationData),
          returnPath: '/(tabs)/(medication)/create'
        }
      });
    } catch (error) {
      showError("Failed to fetch drug label information. Try again or add manually instead.");
      console.log(error);
    } finally {
      hideLoading();
    }
  };


  const filteredPlans = medications.filter(plan =>
    plan.medicationSpecification?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Selection mode functions
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedMedicationIds(new Set());
  };

  const toggleMedicationSelection = (medicationId) => {
    const newSelected = new Set(selectedMedicationIds);
    if (newSelected.has(medicationId)) {
      newSelected.delete(medicationId);
    } else {
      newSelected.add(medicationId);
    }
    setSelectedMedicationIds(newSelected);
  };

  const selectAllMedications = () => {
    const allIds = new Set(filteredPlans.map(med => med.id));
    setSelectedMedicationIds(allIds);
  };

  const deselectAllMedications = () => {
    setSelectedMedicationIds(new Set());
  };

  const handleBulkDelete = () => {
    const selectedCount = selectedMedicationIds.size;
    if (selectedCount === 0) {
      showError('No medications selected');
      return;
    }

    const message = selectedCount === 1 
      ? 'Are you sure you want to delete this medication?' 
      : `Are you sure you want to delete ${selectedCount} medications?`;

    Alert.alert(
      'Delete Medications',
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              showLoading();
              
              // Delete all selected medications
              const deletePromises = Array.from(selectedMedicationIds).map(id => 
                removeMedication(id)
              );
              
              await Promise.all(deletePromises);
              
              // Reset selection mode
              setSelectedMedicationIds(new Set());
              setIsSelectionMode(false);
              
              hideLoading();
              showError(`Successfully deleted ${selectedCount} medication${selectedCount > 1 ? 's' : ''}`);
            } catch (error) {
              hideLoading();
              showError('Failed to delete some medications. Please try again.');
              console.error('Error during bulk delete:', error);
            }
          },
        },
      ]
    );
  };

  const handleLongPress = (medicationId) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedMedicationIds(new Set([medicationId]));
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScreenHeader 
        title="My Medications"
        subtitle={`${medications.length} medication${medications.length !== 1 ? 's' : ''} in your plan`}
        rightAction={isSelectionMode ? {
          icon: <Text className="text-gray-300 font-psemibold">Cancel</Text>,
          onPress: toggleSelectionMode
        } : null}
      />

      {/* Search Section */}
      <View className="px-6 mb-4">
        <SearchBar 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm}
          placeholder="Search your medications..."
        />
      </View>

      {/* Content Section */}
      <View className="flex-1 px-6">
        {filteredPlans.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <View className="bg-secondary-100 rounded-full p-6 mb-4">
              <icons.PlusCircle color="#fff" size={64} />
            </View>
            <Text className="text-white text-xl font-psemibold mb-2">No medications yet</Text>
            <Text className="text-gray-300 text-center font-pregular mb-8 px-8">
              {searchTerm 
                ? `No medications found matching "${searchTerm}"`
                : "Start by adding your first medication or scan a prescription bottle"
              }
            </Text>
            {!searchTerm && (
              <View className="flex-row gap-4">
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/(medication)/add')}
                  className="bg-secondary-200 px-6 py-3 rounded-xl flex-row items-center"
                >
                  <icons.PlusCircle color="#FFF" size={20} />
                  <Text className="text-white font-psemibold ml-2">Add Medication</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setCameraModalVisible(true);
                    setIsScanned(false);
                  }}
                  className="bg-gray-700 px-6 py-3 rounded-xl flex-row items-center border border-secondary-200"
                >
                  <icons.Camera color="#c0ee77" size={20} />
                  <Text className="text-secondary font-psemibold ml-2">Scan Bottle</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredPlans}
            keyExtractor={(item, index) => item.id || index.toString()}
            renderItem={({ item, index }) => (
              <View className="mb-3">
                <SelectableMedicationItem 
                  key={item.id || index}
                  item={item}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedMedicationIds.has(item.id)}
                  onSelect={toggleMedicationSelection}
                  onLongPress={() => handleLongPress(item.id)}
                  onPress={() => {
                    if (!isSelectionMode) {
                      setSelectedMedication(item);
                      setMedicationCardModalVisible(true);
                    }
                  }}
                />
              </View>
            )}
            showsVerticalScrollIndicator={false}
            className="pb-24"
          />
        )}
      </View>

      {/* Floating Action Buttons - Only show when there are medications and not in selection mode */}
      {filteredPlans.length > 0 && !isSelectionMode && (
        <View className="absolute bottom-6 right-6">
          <View className="items-end gap-1">
            {/* Scan Button */}
            <TouchableOpacity
              onPress={() => {
                setCameraModalVisible(true);
                setIsScanned(false);
              }}
              className="bg-gray-700 shadow-lg rounded-full p-4 border border-secondary-200"
            >
              <icons.Camera color="#c0ee77" size={24} />
            </TouchableOpacity>
            
            {/* Add Button */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/(medication)/add')}
              className="bg-secondary-200 shadow-lg rounded-full p-4"
            >
              <icons.PlusCircle color="#FFF" size={28} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Selection Mode Controls - Fixed at bottom */}
      {isSelectionMode && (
        <View className="absolute bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-6 py-4 pb-8">
          {/* Top row: Select All / Deselect All and Selected count */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={selectedMedicationIds.size === filteredPlans.length ? deselectAllMedications : selectAllMedications}
                className="flex-row items-center"
              >
                <icons.CheckSquare 
                  color={selectedMedicationIds.size === filteredPlans.length ? "#c0ee77" : "#6B7280"} 
                  size={20} 
                />
                <Text className="text-gray-300 font-pregular ml-2">
                  {selectedMedicationIds.size === filteredPlans.length ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <Text className="text-secondary font-pregular">
              {selectedMedicationIds.size} of {filteredPlans.length} selected
            </Text>
          </View>
          
          {/* Bottom row: Delete button */}
          {selectedMedicationIds.size > 0 && (
            <TouchableOpacity
              onPress={handleBulkDelete}
              className="bg-red-500 px-4 py-3 rounded-lg flex-row items-center justify-center"
            >
              <icons.Trash color="#FFF" size={16} />
              <Text className="text-white font-psemibold ml-2">
                Delete {selectedMedicationIds.size} medication{selectedMedicationIds.size > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Modals */}
      {selectedMedication && (
        <MedicationCardModal
          visible={medicationCardModalVisible}
          onClose={() => setMedicationCardModalVisible(false)}
          dosage={selectedMedication.dosage}
          startDate={selectedMedication.start_date}
          endDate={selectedMedication.end_date}
          frequency={selectedMedication.frequency}
          medicationSpecification={selectedMedication.medicationSpecification}
          reminder={selectedMedication.reminder}
          medicationId={selectedMedication.id}
          isActive={selectedMedication.isActive}
          medicationData={selectedMedication}
        />
      )}

      <CameraModal
        isVisible={cameraModalVisible}
        onClose={() => setCameraModalVisible(false)}
        onScan={(data) => {
          if (isScanned) return;
          setIsScanned(true);
          showLoading();
          handleUPCScan(data);
        }}
      />

      {error && (
        <ErrorModal 
          visible={Boolean(error)} 
          message={error} 
          onClose={clearError} 
        />
      )}
    </SafeAreaView>
  );
};

export default CreateScreen;
