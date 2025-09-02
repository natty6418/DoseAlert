import React from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import PropTypes from 'prop-types';
import { icons } from '../../constants';

const ReminderSection = ({
    reminderEnabled,
    reminderTimes,
    reminderDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    showTimePicker,
    onToggleReminder,
    onRemoveReminderTime,
    onReminderDaysChange = () => {},
    onShowTimePicker,
    onTimePickerChange
}) => {
    const daysOfWeek = [
        { key: 'Sun', label: 'Sun' },
        { key: 'Mon', label: 'Mon' },
        { key: 'Tue', label: 'Tue' },
        { key: 'Wed', label: 'Wed' },
        { key: 'Thu', label: 'Thu' },
        { key: 'Fri', label: 'Fri' },
        { key: 'Sat', label: 'Sat' }
    ];

    const toggleDay = (day) => {
        if (reminderDays.includes(day)) {
            // Remove the day
            const newDays = reminderDays.filter(d => d !== day);
            onReminderDaysChange(newDays);
        } else {
            // Add the day
            onReminderDaysChange([...reminderDays, day]);
        }
    };
    return (
        <View className="bg-gray-800 border border-gray-700 rounded-2xl p-5 mb-4">
            <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                    <View className="bg-yellow-500/20 p-2 rounded-xl mr-3">
                        <icons.Bell size={18} color="#eab308" />
                    </View>
                    <Text className="text-white font-psemibold text-lg">Reminders</Text>
                </View>
                <Switch
                    value={reminderEnabled}
                    onValueChange={onToggleReminder}
                    trackColor={{ false: '#374151', true: '#eab308' }}
                    thumbColor={reminderEnabled ? '#ffffff' : '#9ca3af'}
                    testID="enable-reminders-switch"
                />
            </View>

            {reminderEnabled && (
                <View className="mt-2">
                    {/* Days of Week Selection */}
                    <Text className="text-gray-300 font-pmedium mb-3">Reminder Days</Text>
                    <View className="flex-row flex-wrap gap-2 mb-4">
                        {daysOfWeek.map(({ key, label }) => (
                            <TouchableOpacity
                                key={key}
                                onPress={() => toggleDay(key)}
                                className={`px-3 py-2 rounded-lg border ${
                                    reminderDays.includes(key)
                                        ? 'bg-yellow-500 border-yellow-400'
                                        : 'bg-gray-700 border-gray-600'
                                }`}
                            >
                                <Text className={`font-pmedium ${
                                    reminderDays.includes(key) ? 'text-gray-900' : 'text-gray-300'
                                }`}>
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Reminder Times */}
                    <Text className="text-gray-300 font-pmedium mb-3">Reminder Times</Text>
                    {reminderTimes.length > 0 && (
                        <View className="mb-3">
                            {reminderTimes.map((time, index) => (
                                <View
                                    key={index}
                                    className="bg-gray-700 py-3 px-4 rounded-xl mb-2 flex-row justify-between items-center border border-gray-600"
                                >
                                    <View className="flex-row items-center">
                                        <View className="bg-yellow-500/20 p-1.5 rounded-lg mr-3">
                                            <icons.Clock size={16} color="#eab308" />
                                        </View>
                                        <Text className="text-white font-pmedium text-base">
                                            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => onRemoveReminderTime(index)}
                                        className="w-8 h-8 bg-red-500/20 rounded-full items-center justify-center border border-red-500"
                                    >
                                        <icons.XMark color="#ef4444" size={16} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={onShowTimePicker}
                        className="bg-yellow-500 py-3 px-4 rounded-xl flex-row items-center justify-center"
                        testID={"add-reminder-button"}
                    >
                        <icons.PlusCircle color="#1f2937" size={24} />
                        <Text className="text-gray-900 font-psemibold ml-2">Add Reminder Time</Text>
                    </TouchableOpacity>
                </View>
            )}

            {showTimePicker && (
                <DateTimePicker
                    mode="time"
                    is24Hour={false}
                    display="default"
                    value={new Date()}
                    onChange={onTimePickerChange}
                    textColor="#00000"
                    accentColor="#00000"
                    testID="date-time-picker"
                />
            )}
        </View>
    );
};

ReminderSection.propTypes = {
    reminderEnabled: PropTypes.bool.isRequired,
    reminderTimes: PropTypes.arrayOf(PropTypes.instanceOf(Date)).isRequired,
    reminderDays: PropTypes.arrayOf(PropTypes.string),
    showTimePicker: PropTypes.bool.isRequired,
    onToggleReminder: PropTypes.func.isRequired,
    onRemoveReminderTime: PropTypes.func.isRequired,
    onReminderDaysChange: PropTypes.func,
    onShowTimePicker: PropTypes.func.isRequired,
    onTimePickerChange: PropTypes.func.isRequired,
};

export default ReminderSection;
