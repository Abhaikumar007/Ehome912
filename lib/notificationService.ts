import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { AppStorage } from './storage';

// Safely resolve Notifications module (Expo SDK 53+ disallows importing expo-notifications in Expo Go on Android)
let Notifications: any = null;

try {
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  if (!(isExpoGo && Platform.OS === 'android') && Platform.OS !== 'web') {
    Notifications = require('expo-notifications');
    if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
          priority: Notifications.AndroidNotificationPriority?.HIGH ?? 4,
        }),
      });
    }
  }
} catch (loadErr: any) {
  console.log('[NotificationService] Expo Go notice: Remote notifications require a standalone APK build');
}

/**
 * Register current device for Push Notifications and sync token with Supabase
 */
export async function registerForPushNotifications(rollNo: string, studentClass?: string): Promise<string | null> {
  if (!rollNo || Platform.OS === 'web') return null;

  // In Expo Go on Android, remote push notifications are disabled by Expo SDK 53+.
  // Notifications will automatically work when running the standalone APK build.
  if (!Notifications) {
    console.log('[NotificationService] Remote push tokens require standalone APK (bypassed in Expo Go)');
    return null;
  }

  try {
    // Physical device check (Push notifications do not work on Android Emulators)
    if (!Device.isDevice) {
      console.log('[NotificationService] Running on simulator/emulator — push notifications require physical device');
      return null;
    }

    // 1. Check existing permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // 2. Request permission if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[NotificationService] Push notification permission not granted by user');
      return null;
    }

    // 3. Android High-Priority Notification Channel setup
    if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'EduHome Alerts',
        description: 'Instant announcements, fee reminders, and exam alerts',
        importance: Notifications.AndroidImportance?.MAX ?? 5,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1A56DB',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
      });
    }

    // 4. Resolve Expo Project ID
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId ||
      'fae6a023-af4d-4944-bd4a-2106289d533a';

    const tokenResult = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenResult?.data;

    if (!token) {
      console.warn('[NotificationService] Could not retrieve Expo push token');
      return null;
    }

    // 5. Store / update token in Supabase
    const cleanClass = studentClass ? String(studentClass).replace(/[^0-9]/g, '') : '10';

    const { error } = await supabase.from('push_tokens').upsert(
      {
        roll_no: rollNo.toUpperCase().trim(),
        class: cleanClass || '10',
        push_token: token,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'push_token' }
    );

    if (error) {
      console.warn('[NotificationService] Supabase token upsert note:', error.message);
    } else {
      console.log('[NotificationService] Successfully registered push token in Supabase:', token);
    }

    return token;
  } catch (err: any) {
    console.warn('[NotificationService] Registration note:', err?.message || err);
    return null;
  }
}

/**
 * Automatically check student fee due status and trigger a local reminder
 * if due date is within 5 days (runs automatically when student opens / uses the app).
 */
export async function checkAndTriggerFeeReminder(rollNo: string): Promise<boolean> {
  if (!rollNo || Platform.OS === 'web' || !Notifications) return false;

  try {
    // 1. Fetch current fee record from Supabase
    const { data: record, error } = await supabase
      .from('fees_records')
      .select('current_due, due_date, days_left')
      .eq('roll_no', rollNo.toUpperCase().trim())
      .maybeSingle();

    if (error || !record) return false;

    const dueAmount = Number(record.current_due) || 0;
    const daysLeft = Number(record.days_left);
    const isUnpaid = dueAmount > 0;

    // Only alert if unpaid and due within 5 days (or overdue)
    if (!isUnpaid || isNaN(daysLeft) || daysLeft > 5) {
      return false;
    }

    // 2. Prevent spam: alert at most once per calendar day
    const todayStr = new Date().toISOString().split('T')[0];
    const storageKey = `fee_reminder_notified_${rollNo.toUpperCase().trim()}`;
    const lastNotified = await AppStorage.getItem(storageKey);
    if (lastNotified === todayStr) {
      return false;
    }

    // 3. Format message
    const dueDateStr = record.due_date || 'this month';
    const timingStr =
      daysLeft < 0
        ? `(${Math.abs(daysLeft)} days overdue)`
        : daysLeft === 0
        ? `(Due today!)`
        : `(${daysLeft} days remaining)`;

    // 4. Trigger high-priority local notification
    if (Notifications.scheduleNotificationAsync) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Tuition Fee Due Reminder',
          body: `Your tuition fee of ₹${dueAmount.toLocaleString('en-IN')} is due on ${dueDateStr} ${timingStr}. Please pay via UPI in the app to avoid late fees.`,
          sound: 'default',
          channelId: 'default',
          priority: Notifications.AndroidNotificationPriority?.HIGH ?? 4,
          data: { screen: 'fees' },
        },
        trigger: null,
      });

      await AppStorage.setItem(storageKey, todayStr);
      console.log('[NotificationService] Automatically triggered 5-day fee due reminder for:', rollNo);
      return true;
    }

    return false;
  } catch (err: any) {
    console.warn('[NotificationService] Fee reminder note:', err?.message || err);
    return false;
  }
}

