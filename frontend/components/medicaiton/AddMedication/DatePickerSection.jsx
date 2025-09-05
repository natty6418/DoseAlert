import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import PropTypes from 'prop-types';
import { icons } from '../../constants';

const DatePickerSection = ({
    startDate,
    endDate,
    showStartDatePicker,
    showEndDatePicker,
    onStartDatePress,
    onEndDatePress,
    onStartDateChange,
    onEndDateChange
}) => {
    return (
        <View className="bg-gray-800 border border-gray-700 rounded-2xl p-5 mb-4">
            <View className="flex-row items-center mb-4">
                <View className="bg-green-500/20 p-2 rounded-xl mr-3">
                    <icons.Calendar size={18} color="#10b981" />
                </View>
                <Text className="text-white font-psemibold text-lg">Treatment Period</Text>
            </View>
            
            <View className="space-y-4">
                <View>
                    <View className={'flex flex-row mb-2'}>
                        <Text className="text-gray-300 font-pmedium">Start Date</Text>
                        <Text className="text-red-400 font-pmedium ml-1">*</Text>
                    </View>
                    <TouchableOpacity 
                        testID='start-date-field' 
                        onPress={onStartDatePress} 
                        className="w-full h-14 px-4 bg-gray-700 rounded-xl border border-gray-600 focus:border-green-500 flex flex-row items-center"
                    >
                        <Text className="flex-1 text-white font-pmedium text-base">
                            {startDate?.toDateString() || 'Select start date'}
                        </Text>
                        <View className="bg-green-500/20 p-2 rounded-lg">
                            <icons.Calendar size={16} color="#10b981" />
                        </View>
                    </TouchableOpacity>
                </View>

                <View>
                    <View className={'flex flex-row mb-2'}>
                        <Text className="text-gray-300 font-pmedium">End Date</Text>
                        <Text className="text-red-400 font-pmedium ml-1">*</Text>
                    </View>
                    <TouchableOpacity 
                        testID='end-date-field' 
                        onPress={onEndDatePress} 
                        className="w-full h-14 px-4 bg-gray-700 rounded-xl border border-gray-600 focus:border-green-500 flex flex-row items-center"
                    >
                        <Text className="flex-1 text-white font-pmedium text-base">
                            {endDate?.toDateString() || 'Select end date'}
                        </Text>
                        <View className="bg-green-500/20 p-2 rounded-lg">
                            <icons.Calendar size={16} color="#10b981" />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {showStartDatePicker && (
                <DateTimePicker
                    value={startDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={onStartDateChange}
                    minimumDate={new Date()}
                    maximumDate={new Date(new Date().setMonth(new Date().getMonth() + 1))}
                    testID='start-date-picker'
                />
            )}
            {showEndDatePicker && (
                <DateTimePicker
                    value={endDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={onEndDateChange}
                    minimumDate={startDate || new Date()}
                    maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
                    testID='end-date-picker'
                />
            )}
        </View>
    );
};

DatePickerSection.propTypes = {
    startDate: PropTypes.instanceOf(Date),
    endDate: PropTypes.instanceOf(Date),
    showStartDatePicker: PropTypes.bool.isRequired,
    showEndDatePicker: PropTypes.bool.isRequired,
    onStartDatePress: PropTypes.func.isRequired,
    onEndDatePress: PropTypes.func.isRequired,
    onStartDateChange: PropTypes.func.isRequired,
    onEndDateChange: PropTypes.func.isRequired,
};

export default DatePickerSection;
