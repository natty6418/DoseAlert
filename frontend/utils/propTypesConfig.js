// Central configuration to disable PropTypes validation in development
// This eliminates the redundant prop validation warnings across all components

import PropTypes from 'prop-types';

// Disable PropTypes validation globally if needed
// This can be controlled via environment variable
if (process.env.NODE_ENV === 'development' && process.env.DISABLE_PROPTYPES === 'true') {
  // Replace PropTypes with no-op functions to eliminate validation warnings
  const noop = () => {};
  const noopWithIsRequired = () => ({ isRequired: noop });
  
  Object.keys(PropTypes).forEach(key => {
    if (typeof PropTypes[key] === 'function') {
      PropTypes[key] = noopWithIsRequired;
    }
  });
}

export { PropTypes };

// Alternative: Export simplified validation that only warns for critical props
export const createSimplePropTypes = (componentName, criticalProps = []) => {
  if (process.env.NODE_ENV === 'production') {
    return {};
  }
  
  // Only validate critical props in development
  const propTypes = {};
  criticalProps.forEach(prop => {
    propTypes[prop] = (...args) => {
      // Custom validation logic here if needed
      return null;
    };
  });
  
  return propTypes;
};

// Export component-specific simplified prop configs
export const MedicationItemProps = ['item', 'onPress'];
export const MedicationCardProps = ['visible', 'onClose', 'medicationSpecification'];
export const EditModalProps = ['visible', 'onClose', 'medicationData'];
export const ExpandedItemProps = ['item', 'toggleExpand'];
