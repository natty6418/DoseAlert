import React from 'react';
import { View, Text  } from 'react-native';

const UserProfileCard = ({ user, isGuest = false }) => {
  if (isGuest) {
    return (
      <View className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-6 mb-6">
        <View className="flex-row items-center">
          <View className="w-16 h-16 bg-gray-600 rounded-full items-center justify-center mr-4">
            <Text className="text-white text-2xl font-pbold">G</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-xl font-psemibold">Guest User</Text>
            <Text className="text-blue-300 text-sm mt-1">
              Create an account to sync your data
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const getInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || 'U';
  };

  return (
    <View className="bg-[#232533] rounded-xl p-6 mb-6">
      <View className="flex-row items-center">
        <View className="w-16 h-16 bg-secondary-200 rounded-full items-center justify-center mr-4">
          <Text className="text-primary text-xl font-pbold">
            {getInitials(user?.first_name || user?.firstName, user?.last_name || user?.lastName)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-white text-xl font-psemibold">
            {user?.first_name || user?.firstName} {user?.last_name || user?.lastName}
          </Text>
          <Text className="text-[#CDCDE0] text-sm mt-1">{user?.email}</Text>
          <Text className="text-green-400 text-xs mt-1">✓ Account Verified</Text>
        </View>
      </View>
    </View>
  );
};

export default UserProfileCard;
