import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../lib/authContext';
import { DataService } from '../../lib/dataService';
import { supabase } from '../../lib/supabase';

const defaultNotifs = [
  {
    id: '1',
    icon: 'megaphone',
    iconBg: Colors.redLight,
    iconColor: Colors.red,
    title: 'Parent-Teacher Meeting on 20th Sep',
    body: 'All students must inform their parents. Timing: 10 AM – 1 PM at the main hall.',
    time: '2 hours ago',
    unread: true,
  },
  {
    id: '2',
    icon: 'calendar',
    iconBg: Colors.primaryLight,
    iconColor: Colors.primary,
    title: 'Weekly Test #9 – This Saturday',
    body: 'Syllabus: Physics Ch-10, Chemistry Ch-1, Maths Ch-4. Duration: 2 hours.',
    time: '5 hours ago',
    unread: true,
  },
  {
    id: '3',
    icon: 'wallet',
    iconBg: Colors.amberLight,
    iconColor: Colors.amber,
    title: 'Fee Reminder: ₹4,000 due on 15 Sep',
    body: 'Please pay your tuition fee before the due date to avoid late charges.',
    time: '1 day ago',
    unread: false,
  },
  {
    id: '4',
    icon: 'trophy',
    iconBg: Colors.greenLight,
    iconColor: Colors.green,
    title: '🎉 Congratulations! Top 8% this month',
    body: 'Your performance in Test #8 was outstanding. Keep pushing, Arjun!',
    time: '2 days ago',
    unread: false,
  },
  {
    id: '5',
    icon: 'document-text',
    iconBg: Colors.purpleLight,
    iconColor: Colors.purple,
    title: 'New Study Material: Light – Reflection',
    body: 'Physics Chapter 10 notes with handwritten annotations have been uploaded.',
    time: '3 days ago',
    unread: false,
  },
  {
    id: '6',
    icon: 'time',
    iconBg: Colors.orangeLight,
    iconColor: Colors.orange,
    title: 'Schedule Change: Chemistry moved to 6 PM',
    body: 'Wednesday Chemistry class has been rescheduled from 5 PM to 6 PM this week.',
    time: '4 days ago',
    unread: false,
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const { student } = useAuth();
  const [items, setItems] = useState(defaultNotifs);
  const [refreshing, setRefreshing] = useState(false);

  const rollNo = student?.rollNo || '';
  const studentClass = student?.class;
  const studentSyllabus = student?.syllabus;

  const loadData = async () => {
    if (!rollNo) return;
    try {
      const res = await DataService.getNotifications(rollNo, studentClass, studentSyllabus);
      if (res && res.length > 0) {
        setItems(res.map((r: any) => ({
          id: r.id,
          icon: r.type === 'fee' ? 'wallet' : r.type === 'schedule' ? 'calendar' : r.type === 'material' ? 'document-text' : 'megaphone',
          iconBg: r.type === 'fee' ? Colors.amberLight : r.type === 'schedule' ? Colors.primaryLight : Colors.redLight,
          iconColor: r.type === 'fee' ? Colors.amber : r.type === 'schedule' ? Colors.primary : Colors.red,
          title: r.title,
          body: r.desc,
          time: r.time,
          unread: r.unread,
        })));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadData();

    // Instant realtime synchronization when timetable or notification is published
    const sub = supabase
      .channel(`notifs_rt_${rollNo || 'anon'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [rollNo, studentClass, studentSyllabus]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch {}
    setRefreshing(false);
  };

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
    await DataService.markAllNotificationsRead(rollNo);
  };

  const handleItemPress = async (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unread: false } : item))
    );
    await DataService.markNotificationRead(id);
  };

  const unreadCount = items.filter((n) => n.unread).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Image
            source={require('../../assets/eduhome.png')}
            style={{ width: 30, height: 30, borderRadius: 6 }}
            resizeMode="contain"
          />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={Colors.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={styles.markRead}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount} new</Text>
            </View>
          )}
        </View>
        <Text style={styles.pageSub}>Stay updated with announcements, reminders & alerts.</Text>

        {items.map((notif, i) => (
          <TouchableOpacity
            key={notif.id}
            style={[styles.notifCard, notif.unread && styles.notifCardUnread]}
            activeOpacity={0.8}
            onPress={() => handleItemPress(notif.id)}
          >
            <View style={[styles.notifIcon, { backgroundColor: notif.iconBg }]}>
              <Ionicons name={notif.icon as any} size={18} color={notif.iconColor} />
            </View>
            <View style={styles.notifContent}>
              <View style={styles.notifHeader}>
                <Text style={[styles.notifTitle, notif.unread && styles.notifTitleUnread]} numberOfLines={1}>
                  {notif.title}
                </Text>
                {notif.unread && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.notifBody} numberOfLines={2}>{notif.body}</Text>
              <Text style={styles.notifTime}>{notif.time}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 14, color: Colors.primary, fontFamily: 'Inter_500Medium' },
  markRead: { fontSize: 12, color: Colors.primary, fontFamily: 'Inter_600SemiBold' },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  pageTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  unreadBadge: { backgroundColor: Colors.redLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  unreadText: { fontSize: 11, color: Colors.red, fontFamily: 'Inter_700Bold' },
  pageSub: { fontSize: 13, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', marginBottom: 16, marginTop: 2 },

  notifCard: {
    flexDirection: 'row', gap: 12,
    backgroundColor: Colors.cardBg, borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  notifCardUnread: { borderLeftWidth: 3, borderLeftColor: Colors.primary, backgroundColor: '#F8FAFF' },
  notifIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  notifTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, flex: 1 },
  notifTitleUnread: { fontFamily: 'Inter_700Bold' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  notifBody: { fontSize: 12, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', lineHeight: 17, marginBottom: 4 },
  notifTime: { fontSize: 10, color: Colors.textMuted, fontFamily: 'Inter_400Regular' },
});
