import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, StatusBar, TouchableWithoutFeedback } from 'react-native';
import LottieView from 'lottie-react-native';
import { useRouter } from 'expo-router';
import { DataService } from '../lib/dataService';
import { AppStorage } from '../lib/storage';
import { hasTeacherSession } from '../lib/teacherRoster';
import { getAuthSession } from '../lib/securityAuth';

const { width } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();
  const animationRef = useRef<LottieView>(null);
  const [targetRoute, setTargetRoute] = useState<string>('/login');
  const [sessionResolved, setSessionResolved] = useState(false);
  const navigatedRef = useRef(false);

  useEffect(() => {
    async function resolveTarget() {
      try {
        const studentSession = await getAuthSession('student');
        const hasSession = await DataService.hasSavedSession();
        if (studentSession && hasSession) {
          setTargetRoute('/(student)');
          setSessionResolved(true);
          return;
        }

        const isTeacherAuth = await hasTeacherSession();
        if (isTeacherAuth) {
          setTargetRoute('/(teacher)');
          setSessionResolved(true);
          return;
        }
      } catch {}
      setTargetRoute('/login');
      setSessionResolved(true);
    }
    resolveTarget();
  }, []);

  const navigateToApp = () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    router.replace(targetRoute as any);
  };

  // Safe timeout in case animation finish event is delayed
  useEffect(() => {
    if (!sessionResolved) return;
    const maxTimer = setTimeout(() => {
      navigateToApp();
    }, 4500);

    return () => clearTimeout(maxTimer);
  }, [sessionResolved, targetRoute]);

  // Allow tapping screen to skip immediately once session is resolved
  const handlePress = () => {
    if (sessionResolved) {
      navigateToApp();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" translucent />
        <LottieView
          ref={animationRef}
          source={require('../assets/splash.json')}
          autoPlay
          loop={false}
          speed={1.15}
          onAnimationFinish={navigateToApp}
          style={styles.animation}
          resizeMode="contain"
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: Math.min(width * 0.92, 420),
    height: Math.min(width * 0.92, 420),
  },
});
