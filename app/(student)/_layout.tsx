import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors } from '../../constants/colors';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, label, focused }: { name: IconName; label: string; focused: boolean }) {
  return (
    <View style={tabStyles.wrap}>
      <Ionicons name={name} size={20} color={focused ? Colors.primary : Colors.tabInactive} />
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]} numberOfLines={1}>{label}</Text>
      {focused && <View style={tabStyles.dot} />}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 4, gap: 1, width: 60 },
  label: { fontSize: 9, fontFamily: 'Inter_500Medium', color: Colors.tabInactive, textAlign: 'center' },
  labelActive: { color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary, marginTop: 1 },
});

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 80 : 60,
          paddingBottom: Platform.OS === 'ios' ? 18 : 4,
          paddingTop: 2,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="materials"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'book' : 'book-outline'} label="Materials" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'bar-chart' : 'bar-chart-outline'} label="Progress" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="fees"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'wallet' : 'wallet-outline'} label="Fees" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} label="Profile" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen name="attendance" options={{ href: null }} />
      <Tabs.Screen name="study-materials" options={{ href: null }} />
      <Tabs.Screen name="practical-classes" options={{ href: null }} />
      <Tabs.Screen name="mock-tests" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
