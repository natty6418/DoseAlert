import { Picker } from '@react-native-picker/picker';
import {View, Text} from 'react-native';

const PickerComponent = ({title, value, handleValueChange, options, otherStyles, ...props}) => {
    return (
            <View className={`space-y-2 ${otherStyles}`}>
            <Text className="text-base text-gray-100 font-pmedium">{title}</Text>
            <View className="w-full h-16 bg-black-100 rounded-2xl border-2 border-black-200 ">
                <Picker
                    selectedValue={value}
                    onValueChange={handleValueChange}
                    dropdownIconColor="#FFFFFF" 
                    style={{
                    fontFamily: 'Poppins-SemiBold',
                    color: '#FFFFFF',
                    
                    }}
                    {...props}
                >
                    {Object.entries(options).map(([label, value]) =>(
                        <Picker.Item 
                        label={label} 
                        value={value} 
                        key={value} 
                        style={{
                            backgroundColor: '#1E1E1E',
                            fontFamily: 'Poppins-SemiBold',
                            color: '#FFFFFF',
                            
                        }}
                        />
                    ))}
                </Picker>
            </View>
            </View>
    )
};

export default PickerComponent;