import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { DataService } from '../lib/dataService';
import { AppStorage } from '../lib/storage';
import { Colors } from '../constants/colors';

export default function Index() {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      try {
        const hasSession = await DataService.hasSavedSession();
        if (hasSession) {
          setTarget('/(student)');
          return;
        }
        const activeFaculty = await AppStorage.getItem('eduhome_active_faculty_id');
        if (activeFaculty) {
          setTarget('/(teacher)');
          return;
        }
      } catch {}
      setTarget('/login');
    }
    check();
  }, []);

  if (!target) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <Redirect href={target as any} />;
}
