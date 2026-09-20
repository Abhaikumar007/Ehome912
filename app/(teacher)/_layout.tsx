import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors } from '../../constants/colors';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, label, focused, badge }: { name: IconName; label: string; focused: boolean; badge?: boolean }) {
  return (
    <View style={tabStyles.wrap}>
      <View style={tabStyles.iconWrap}>
        <Ionicons name={name} size={20} color={focused ? Colors.primary : Colors.tabInactive} />
        {badge && <View style={tabStyles.badgeDot} />}
      </View>
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
      {focused && <View style={tabStyles.dot} />}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 4, gap: 1, width: 62 },
  iconWrap: { position: 'relative' },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.red,
  },
  label: { fontSize: 9, fontFamily: 'Inter_500Medium', color: Colors.tabInactive, textAlign: 'center' },
  labelActive: { color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary, marginTop: 1 },
});

export default function TeacherLayout() {
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
        name="attendance"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'clipboard' : 'clipboard-outline'} label="Attendance" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tests"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'bar-chart' : 'bar-chart-outline'} label="Tests" focused={focused} badge={true} />
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
    </Tabs>
  );
}
