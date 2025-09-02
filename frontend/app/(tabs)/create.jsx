import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingSpinner from '../../components/Loading';
import AddMedicationPlanModal from '../../components/AddMedicationModal';
import SearchBar from '../../components/SearchBar';
import { icons } from '../../constants';
import CameraModal from '../../components/CameraModal';
import MedicationCardModal from '../../components/MedicationCard';
import MedicationItem from '../../components/MedicationItem';
import { fetchDrugLabelInfo, fetchDrugSideEffects } from '../../services/externalDrugAPI';
import EditMedicationPlanModal from '../../components/EditMedicationModal';
import ErrorModal from '../../components/ErrorModal';
import { useFocusEffect } from 'expo-router';

const CreateScreen = () => {
  const [addMedicationModalVisible, setAddMedicationModalVisible] = useState(false);
  const [editMedicationModalVisible, setEditMedicationModalVisible] = useState(false);
  const [medicationCardModalVisible, setMedicationCardModalVisible] = useState(false);
  const [isScanned, setIsScanned] = useState(false);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [scannedMedication, setScannedMedication] = useState(null);
  
  // Use AppContext for medication management
  const { 
    medications, 
    addMedication, 
    updateMedication, 
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

  const handleSavePlan = (newPlan) => {
    // Use AppContext to add medication
    const medicationData = {
      ...newPlan,
      medicationSpecification: newPlan.medicationSpecification,
      dosage: newPlan.dosage,
      frequency: newPlan.frequency,
      startDate: newPlan.startDate,
      endDate: newPlan.endDate,
      reminder: newPlan.reminder,
    };
    addMedication(medicationData);
    setAddMedicationModalVisible(false);
  };

  const handleEditPlan = (editedPlan) => {
    // Use AppContext to update medication
    updateMedication(editedPlan.id, editedPlan);
    setEditMedicationModalVisible(false);
  };
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
      setScannedMedication({
        ...extractDrugLabelData(label),
        sideEffects: extractSideEffectTerms(sideEffects),
      });
      setAddMedicationModalVisible(true);
    } catch (error) {
      showError("Failed to fetch drug label information. Try again or add manually instead.");
      console.log(error);
    } finally {
      hideLoading();
    }
  };

  const handleDeletePlan = (medicationId) => {
    // Use AppContext to remove medication
    removeMedication(medicationId);
    setEditMedicationModalVisible(false);
  }

  const filteredPlans = medications.filter(plan =>
    plan.medicationSpecification?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView className="bg-black-100 h-full">
      <View className="flex-1 px-4">
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <FlatList
          data={filteredPlans}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={({ item, index }) => (
            <MedicationItem 
              key={item.id || index}
              item={item}
              onPress={() => {
                // console.log("item", item.reminder);
                setSelectedMedication(item);
                setMedicationCardModalVisible(true);
              }}
            />
          )}
        />
        <View className="absolute bottom-2 left-4 w-full">
          <View className="flex flex-row gap-4 justify-between mx-auto bg-secondary-200 rounded-full px-4">
            <TouchableOpacity
              onPress={() => setAddMedicationModalVisible(true)}
              className="items-center  p-4 rounded-full"
            >
              <icons.PlusCircle color="#FFF" size={48} />
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
              <icons.Camera color="#FFF" size={48} />
              <Text className="text-white text-xs font-pregular">scan</Text>
            </TouchableOpacity>
          </View>
        </View>
        {
          selectedMedication && (
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
              onEdit={() =>{
                  setMedicationCardModalVisible(false)
                  setEditMedicationModalVisible(true)
                }}
            />
          )
        }

        <AddMedicationPlanModal
          visible={addMedicationModalVisible}
          onClose={() => setAddMedicationModalVisible(false)}
          onSave={handleSavePlan}
          medicationData={scannedMedication}
          testID={"add-medication-modal"}
        />
        <EditMedicationPlanModal
          visible={editMedicationModalVisible}
          onClose={() => setEditMedicationModalVisible(false)}
          onSave={handleEditPlan}
          medicationData={selectedMedication}
          onDeleteMedication={handleDeletePlan}
        />
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
        {error && <ErrorModal visible={Boolean(error)} message={error} onClose={clearError} />}
        
      </View>
    </SafeAreaView>
  );
};

export default CreateScreen;
