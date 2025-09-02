import PropTypes from 'prop-types';

// Reusable prop type definitions for medication-related components

export const MedicationSpecificationPropType = PropTypes.shape({
  name: PropTypes.string.isRequired,
  directions: PropTypes.string,
  sideEffects: PropTypes.array,
  purpose: PropTypes.string,
  warnings: PropTypes.string,
});

export const DosagePropType = PropTypes.shape({
  amount: PropTypes.string,
  unit: PropTypes.string,
});

export const ReminderPropType = PropTypes.shape({
  enabled: PropTypes.bool,
  times: PropTypes.array,
  reminderTimes: PropTypes.array,
});

export const MedicationItemPropType = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  name: PropTypes.string,
  medicationSpecification: MedicationSpecificationPropType.isRequired,
  dosage: DosagePropType,
  dosage_amount: PropTypes.string,
  dosage_unit: PropTypes.string,
  start_date: PropTypes.string,
  end_date: PropTypes.string,
  frequency: PropTypes.string,
  reminder: ReminderPropType,
  isActive: PropTypes.bool,
  directions: PropTypes.string,
  side_effects: PropTypes.array,
  purpose: PropTypes.string,
  warnings: PropTypes.string,
  notes: PropTypes.string,
  createdAt: PropTypes.instanceOf(Date),
});

// Common function prop types
export const OnPressPropType = PropTypes.func.isRequired;
export const OnClosePropType = PropTypes.func.isRequired;
export const OnEditPropType = PropTypes.func;
export const OnToggleReminderPropType = PropTypes.func;
export const OnUpdateReminderTimesPropType = PropTypes.func;
export const ToggleExpandPropType = PropTypes.func;

// Modal prop types
export const ModalVisiblePropType = PropTypes.bool.isRequired;
