import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import PropTypes from 'prop-types';

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
        <View className="bg-primary rounded-2xl p-4 mb-4">
            <Text className="text-secondary font-pmedium text-lg mb-3">Treatment Period</Text>
            <View className="space-y-3">
                <View>
                    <View className={'flex flex-row mb-2'}>
                        <Text className="text-base text-gray-100 font-pmedium">Start Date</Text>
                        <Text className="text-secondary-200 text-base font-pmedium ml-1">*</Text>
                    </View>
                    <TouchableOpacity 
                        testID='start-date-field' 
                        onPress={onStartDatePress} 
                        className="w-full h-14 px-4 bg-primary rounded-xl border border-gray-600 focus:border-secondary flex flex-row items-center"
                    >
                        <Text className="flex-1 text-white font-pmedium text-base">{startDate?.toDateString()}</Text>
                        <View className="w-6 h-6 bg-secondary rounded-full items-center justify-center">
                            <Text className="text-black text-xs font-pbold">📅</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View>
                    <View className={'flex flex-row mb-2'}>
                        <Text className="text-base text-gray-100 font-pmedium">End Date</Text>
                        <Text className="text-secondary-200 text-base font-pmedium ml-1">*</Text>
                    </View>
                    <TouchableOpacity 
                        testID='end-date-field' 
                        onPress={onEndDatePress} 
                        className="w-full h-14 px-4 bg-primary rounded-xl border border-gray-600 focus:border-secondary flex flex-row items-center"
                    >
                        <Text className="flex-1 text-white font-pmedium text-base">{endDate?.toDateString()}</Text>
                        <View className="w-6 h-6 bg-secondary rounded-full items-center justify-center">
                            <Text className="text-black text-xs font-pbold">📅</Text>
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
