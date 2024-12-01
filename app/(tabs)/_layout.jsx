import {Image, View, Text } from 'react-native'
import { Tabs } from 'expo-router'
import icons from '../../constants/icons'
import { StatusBar } from 'expo-status-bar'

const TabIcon = ({icon, color, name, focused}) =>{
  return (
    <View className="flex items-center justify-center gap-2">
      <Image
        source={icon}
        resizeMode="contain"
        tintColor={color}
        className="w-6 h-6"
      />
      <Text
        className={`${focused ? "font-psemibold" : "font-pregular"} text-xs`}
        style={{ color: color }}
      >
        {name}
      </Text>
    </View>
  )
}

const TabsLayout = () => {
  return (
    <>
      
    <Tabs
    screenOptions={{
      tabBarActiveTintColor: "#c0ee77",
      tabBarInactiveTintColor: "#CDCDE0",
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: "#161622",
        borderTopWidth: 1,
        borderTopColor: "#232533",
        height: 84,
      },
    }}
  >
    <Tabs.Screen
      name="home"
      options={{
        title: "Home",
        headerShown: false,
        tabBarIcon: ({ color, focused }) => (
          <TabIcon
            icon={icons.home}
            color={color}
            name="Home"
            focused={focused}
          />
        ),
      }}
    />
    

    <Tabs.Screen
      name="create"
      options={{
        title: "Repository",
        headerShown: false,
        tabBarIcon: ({ color, focused }) => (
          <TabIcon
            icon={icons.medication}
            color={color}
            name="Repository"
            focused={focused}
          />
        ),
      }}
    />
    
  </Tabs>
  <StatusBar
        backgroundColor='#161622'
        style='light'
    />
    </>
  )
}

export default TabsLayout