import { Alert, AppState, Platform } from 'react-native';
import * as Updates from 'expo-updates';

let isChecking = false;

/**
 * Checks EAS for any published Over-The-Air updates.
 * If available, downloads the bundle and prompts the user to restart now.
 */
export async function checkAndApplyUpdates(manual = false) {
  // Only active in production builds on physical devices
  if (__DEV__ || Platform.OS === 'web' || !Updates.isEnabled) {
    if (manual) {
      Alert.alert('App Update', 'Auto-updates are only active in installed production builds.');
    }
    return;
  }

  if (isChecking) return;
  isChecking = true;

  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      Alert.alert(
        'New Update Ready 🎉',
        'A new update for EduHome has been downloaded. Restart the app now to apply the latest features?',
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Restart Now',
            onPress: async () => {
              try {
                await Updates.reloadAsync();
              } catch (e) {
                console.warn('[Updates] reloadAsync error:', e);
              }
            },
          },
        ]
      );
    } else if (manual) {
      Alert.alert('Up to Date', 'You are already using the latest version of EduHome.');
    }
  } catch (error) {
    console.log('[Updates] Check error:', error);
    if (manual) {
      Alert.alert('Update Check', 'Could not check for updates. Please check your internet connection.');
    }
  } finally {
    isChecking = false;
  }
}

/**
 * Initializes automatic background update checks:
 * 1. Checks on app launch (after splash screen hides)
 * 2. Checks whenever the app resumes from background (AppState -> 'active')
 */
export function initAutoUpdater() {
  if (__DEV__ || Platform.OS === 'web' || !Updates.isEnabled) {
    return () => {};
  }

  // 1. Initial check shortly after launch
  const initialTimer = setTimeout(() => {
    checkAndApplyUpdates();
  }, 2500);

  // 2. Check every time the user brings the app back to the foreground
  const appStateSub = AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active') {
      checkAndApplyUpdates();
    }
  });

  return () => {
    clearTimeout(initialTimer);
    appStateSub.remove();
  };
}

