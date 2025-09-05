import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";

import { icons } from "../../constants";

const FormField = ({
  title,
  value,
  placeholder,
  handleChangeText,
  otherStyles,
  multiline=false,
  required=false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className={`space-y-2 ${otherStyles}`}>
    <View className={'flex flex-row'}>
      <Text className="text-base text-gray-100 font-pmedium">{title}</Text>
      {required && <Text className="text-red-500 text-base font-pmedium">*</Text>}
    </View>

      <View 
      className={`w-full ${
        multiline ? 'h-32' : 'h-16'
      } px-4 bg-primary rounded-2xl border-2 border-black-200 focus:border-secondary flex flex-row`}
      >
        <TextInput
        className={`flex-1 text-white  text-base ${
          multiline ? 'pt-2 font-pthin' : 'font-psemibold'
        }`}
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#7B7B8B"
          onChangeText={handleChangeText}
          secureTextEntry={title === "Password" && !showPassword}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...props}
        />

        {title === "Password" && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Image
              source={!showPassword ? icons.eye : icons.eyeHide}
              className="w-6 h-6"
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default FormField;