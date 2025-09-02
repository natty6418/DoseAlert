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
        <View className="bg-primary rounded-2xl p-4 mb-4">
            <Text className="text-secondary font-pmedium text-lg mb-3">Side Effects</Text>
            <SideEffectChecklist sideEffects={sideEffects} setSideEffects={onSideEffectsChange}/>
            <View className='flex flex-row items-center mt-3 bg-primary rounded-xl p-3 border border-gray-600'>
                <icons.PlusCircle color="#c0ee77" size={20} />
                <TextInput
                    value={newSideEffect}
                    onChangeText={onNewSideEffectChange}
                    className="ml-3 flex-1 text-white font-pregular"
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
