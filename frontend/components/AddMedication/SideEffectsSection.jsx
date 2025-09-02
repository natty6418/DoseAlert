import React from 'react';
import { View, Text, TextInput } from 'react-native';
import PropTypes from 'prop-types';
import SideEffectChecklist from '../SideEffectChecklist';
import { icons } from '../../constants';

const SideEffectsSection = ({ 
    sideEffects, 
    newSideEffect, 
    onSideEffectsChange, 
    onNewSideEffectChange, 
    onAddSideEffect 
}) => {
    return (
        <View className="bg-gray-800 border border-gray-700 rounded-2xl p-5 mb-4">
            <View className="flex-row items-center mb-4">
                <View className="bg-orange-500/20 p-2 rounded-xl mr-3">
                    <icons.ExclamationTriangle size={18} color="#f97316" />
                </View>
                <Text className="text-white font-psemibold text-lg">Side Effects</Text>
            </View>
            
            <SideEffectChecklist sideEffects={sideEffects} setSideEffects={onSideEffectsChange}/>
            
            <View className='flex flex-row items-center mt-4 bg-gray-700 rounded-xl p-3 border border-gray-600'>
                <View className="bg-orange-500/20 p-1.5 rounded-lg mr-3">
                    <icons.PlusCircle color="#f97316" size={16} />
                </View>
                <TextInput
                    value={newSideEffect}
                    onChangeText={onNewSideEffectChange}
                    className="flex-1 text-white font-pregular"
                    placeholder='Add custom side effect...'
                    placeholderTextColor='#9CA3AF'
                    onSubmitEditing={onAddSideEffect}
                />
            </View>
        </View>
    );
};

SideEffectsSection.propTypes = {
    sideEffects: PropTypes.arrayOf(PropTypes.shape({
        term: PropTypes.string.isRequired,
        checked: PropTypes.bool.isRequired,
    })).isRequired,
    newSideEffect: PropTypes.string.isRequired,
    onSideEffectsChange: PropTypes.func.isRequired,
    onNewSideEffectChange: PropTypes.func.isRequired,
    onAddSideEffect: PropTypes.func.isRequired,
};

export default SideEffectsSection;
