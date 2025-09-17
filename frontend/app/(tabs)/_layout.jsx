import { Image, View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import icons from '../../constants/icons';

const TabIcon = ({ icon, color, size }) => {

  return (
    <View className="flex items-center justify-center">
      <Image
        source={icon}
        resizeMode="contain"
        tintColor={color}
        style={{ width: size, height: size }}
      />
    </View>
  );
};

const TabsLayout = () => {
  return (
    <Tabs
      initialRouteName='home'
      screenOptions={{
        tabBarActiveTintColor: "#c0ee77",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 13,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        tabBarStyle: {
          backgroundColor: "#0F0F23",
          borderTopWidth: 1,
          borderTopColor: "#1E1B3A",
          height: 92,
        },
      }}
    >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            headerShown: false,
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon
                icon={icons.home}
                color={color}
                size={size}
              />
            ),
          }}
        />

        

        {/* Updated "Report" Tab */}
        
        
        <Tabs.Screen
        name="medication"
        options={{
          title: "Repository",
          headerShown: false,
          tabBarLabel: 'Repository',
          tabBarIcon: ({ color, size, focused }) => (
            <icons.Pill size={size} color={color} />
          ),
        }}
        />
        
        <Tabs.Screen
          name="report" 
          options={{
            title: "Report", 
            headerShown: false,
            tabBarLabel: 'Analytics',
            tabBarIcon: ({ color, size, focused }) => (
              <icons.Newspaper size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            headerShown: false,
            tabBarLabel: 'Settings',
            tabBarIcon: ({ color, size, focused }) => (
              <icons.Cog size={size} color={color} />
            ),
          }}
        />
    
  </Tabs>
  );
};

export default TabsLayout;
