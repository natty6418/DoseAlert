import React from 'react';
import { View, Text, Image } from 'react-native';

import { icons } from '../constants';

// export default function MedicationItem({ name, time }) {
//   return (
//     <View className="flex-row items-center justify-between bg-gray-700 p-4 rounded-lg m-2">
//       <View className="flex-row items-center">
//       <Image
//       source={icons.pill}
//       resizeMode="contain"
//       tintColor="#CDCDE0"
//       className="w-6 h-6"
//     />
//         <Text className="text-white text-lg ml-2">{name}</Text>
//       </View>
//       <Text className="text-gray-400">{time}</Text>
//     </View>
//   );
// }
// export default function MedicationItem({ name, time }) {
//   return (
//     <View className="flex-row items-center justify-between bg-gray-700 p-4 rounded-lg m-2 shadow-lg border border-gray-600">
//       <View className="flex-row items-center">
//         <Image
//           source={icons.pill}
//           resizeMode="contain"
//           tintColor="#CDCDE0"
//           className="w-8 h-8"
//         />
//         <Text className="text-white text-lg ml-3 font-semibold">{name}</Text>
//       </View>
//       <Text className="text-gray-400 text-base font-medium">{time}</Text>
//     </View>
//   );
// }
export default function MedicationItem({ name, time }) {
  return (
    <View className="flex-row items-center justify-between bg-black-200 p-4 rounded-lg m-2 shadow-lg border border-gray-700">
      <View className="flex-row items-center">
        <Image
          source={icons.pill}
          resizeMode="contain"
          tintColor="#91D62A" // Lime color for the icon
          className="w-8 h-8"
        />
        <Text className="text-white text-lg ml-3 font-semibold">{name}</Text>
      </View>
      <Text className="text-gray-300 text-base font-medium">{time}</Text>
    </View>
  );
}