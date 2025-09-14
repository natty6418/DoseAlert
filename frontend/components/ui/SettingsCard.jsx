import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';

const SettingsCard = ({ 
  title, 
  description, 
  icon, 
  IconComponent,
  onPress, 
  badge = null,
  highlight = false,
  disabled = false,
  rightElement = null 
}) => {
  return (
    <TouchableOpacity
      className={`
        ${highlight 
          ? 'bg-secondary-200/20 border border-secondary-200' 
          : 'bg-[#232533]'
        } 
        ${disabled ? 'opacity-50' : ''}
        p-4 rounded-xl mb-3 flex-row items-center
      `}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View className="mr-4">
        {IconComponent ? (
          <IconComponent size={24} color={highlight ? "#c0ee77" : "#9CA3AF"} />
        ) : icon ? (
          <Image 
            source={icon} 
            className="w-6 h-6" 
            tintColor={highlight ? "#c0ee77" : "#9CA3AF"}
          />
        ) : null}
      </View>

      {/* Content */}
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className={`
            font-pmedium text-base 
            ${highlight ? 'text-secondary-200' : 'text-white'}
          `}>
            {title}
          </Text>
          {badge && (
            <View className="ml-2 bg-red-500 rounded-full px-2 py-1">
              <Text className="text-white text-xs font-psemibold">{badge}</Text>
            </View>
          )}
        </View>
        {description && (
          <Text className="text-[#CDCDE0] text-sm mt-1">{description}</Text>
        )}
      </View>

      {/* Right Element */}
      {rightElement && (
        <View className="ml-2">
          {rightElement}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default SettingsCard;
