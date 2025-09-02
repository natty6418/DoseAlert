import React from 'react';
import PropTypes from 'prop-types';
import { 
  MedicationItemPropType, 
  OnPressPropType,
  OnClosePropType,
  OnEditPropType,
  OnToggleReminderPropType,
  OnUpdateReminderTimesPropType,
  ToggleExpandPropType,
  ModalVisiblePropType,
  DosagePropType,
  MedicationSpecificationPropType,
  ReminderPropType
} from '../types/PropTypes';

/**
 * Higher-Order Component that adds PropTypes validation to medication-related components
 */
export const withMedicationPropTypes = (Component, propConfig = {}) => {
  const WrappedComponent = (props) => <Component {...props} />;
  
  // Build propTypes based on configuration
  const propTypes = {};
  
  if (propConfig.item) {
    propTypes.item = MedicationItemPropType.isRequired;
  }
  
  if (propConfig.onPress) {
    propTypes.onPress = OnPressPropType;
  }
  
  if (propConfig.visible) {
    propTypes.visible = ModalVisiblePropType;
  }
  
  if (propConfig.onClose) {
    propTypes.onClose = OnClosePropType;
  }
  
  if (propConfig.onEdit) {
    propTypes.onEdit = OnEditPropType;
  }
  
  if (propConfig.toggleExpand) {
    propTypes.toggleExpand = ToggleExpandPropType;
  }
  
  if (propConfig.onToggleReminder) {
    propTypes.onToggleReminder = OnToggleReminderPropType;
  }
  
  if (propConfig.onUpdateReminderTimes) {
    propTypes.onUpdateReminderTimes = OnUpdateReminderTimesPropType;
  }
  
  if (propConfig.dosage) {
    propTypes.dosage = DosagePropType;
  }
  
  if (propConfig.medicationSpecification) {
    propTypes.medicationSpecification = MedicationSpecificationPropType.isRequired;
  }
  
  if (propConfig.reminder) {
    propTypes.reminder = ReminderPropType;
  }
  
  if (propConfig.dates) {
    propTypes.startDate = PropTypes.string;
    propTypes.endDate = PropTypes.string;
  }
  
  if (propConfig.frequency) {
    propTypes.frequency = PropTypes.string;
  }
  
  if (propConfig.isActive) {
    propTypes.isActive = PropTypes.bool;
  }

  if (propConfig.medicationData) {
    propTypes.medicationData = MedicationItemPropType;
  }

  // Special handling for EditMedicationModal
  if (propConfig.editModal) {
    propTypes.visible = ModalVisiblePropType;
    propTypes.onClose = OnClosePropType;
    propTypes.onSave = PropTypes.func.isRequired;
    propTypes.onDeleteMedication = PropTypes.func.isRequired;
    propTypes.medicationData = MedicationItemPropType;
  }
  
  WrappedComponent.propTypes = propTypes;
  WrappedComponent.displayName = `withMedicationPropTypes(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default withMedicationPropTypes;
