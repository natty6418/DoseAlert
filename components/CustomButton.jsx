import {Text } from 'react-native'
import React from 'react'
import { TouchableOpacity } from 'react-native'


const CustomButton = ({title, handlePress, containerStyles, textStyles, isLoading}) => {
  return (
    <TouchableOpacity 
    onPress={handlePress}
    activeOpacity={0.7}
    className={`bg-secondary-200  rounded-xl min-h-[62px] justify-center items-center p-2 ${containerStyles} ${isLoading ? 'opacity-50':''}`}>
      <Text
      className={`text-primary font-pbold text-lg ${textStyles}`}
      >{title}</Text>
    </TouchableOpacity>
  )
}

export default CustomButton