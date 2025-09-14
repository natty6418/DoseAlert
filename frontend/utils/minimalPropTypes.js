/**
 * Minimal PropTypes setup for medication components
 * Only validates the most critical props to avoid redundant warnings
 */

import PropTypes from 'prop-types';

// Simple prop type definitions that only check existence, not deep structure
export const minimalPropTypes = {
  // Basic types
  item: PropTypes.object,
  visible: PropTypes.bool,
  onPress: PropTypes.func,
  onClose: PropTypes.func,
  onEdit: PropTypes.func,
  onSave: PropTypes.func,
  onDeleteMedication: PropTypes.func,
  toggleExpand: PropTypes.func,
  onToggleReminder: PropTypes.func,
  onUpdateReminderTimes: PropTypes.func,
  
  // Medication-related
  medicationData: PropTypes.object,
  medicationSpecification: PropTypes.object,
  dosage: PropTypes.object,
  reminder: PropTypes.object,
  
  // Simple values
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  frequency: PropTypes.string,
  isActive: PropTypes.bool,
};

/**
 * Applies minimal PropTypes to a component
 * Usage: applyMinimalPropTypes(Component, ['item', 'onPress'])
 */
export const applyMinimalPropTypes = (Component, propNames = []) => {
  const propTypes = {};
  
  propNames.forEach(propName => {
    if (minimalPropTypes[propName]) {
      propTypes[propName] = minimalPropTypes[propName];
    }
  });
  
  Component.propTypes = propTypes;
  return Component;
};

export default applyMinimalPropTypes;
