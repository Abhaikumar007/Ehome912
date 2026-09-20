import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../lib/authContext';

export default function TeacherProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/eduhome.png')}
            style={styles.headerLogoImg}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.logoTitle}>EDU HOME</Text>
            <Text style={styles.logoSub}>FACULTY PORTAL</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.switchBtn}
          onPress={() => router.replace('/(student)')}
          activeOpacity={0.8}
        >
          <Ionicons name="swap-horizontal" size={14} color="#0284C7" />
          <Text style={styles.switchBtnText}>Student View</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>RM</Text>
            <View style={styles.adminDotBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#fff" />
            </View>
          </View>

          <Text style={styles.profileName}>Mr. R Madhusudanan</Text>
          <Text style={styles.profileRole}>Super Admin & Head Faculty</Text>
          <Text style={styles.profileId}>Faculty ID: FAC-2024-001</Text>

          <View style={styles.tagsRow}>
            <View style={[styles.tagPill, { backgroundColor: '#F0F9FF' }]}>
              <Text style={[styles.tagText, { color: '#0284C7' }]}>Physics Expert</Text>
            </View>
            <View style={[styles.tagPill, { backgroundColor: '#ECFDF3' }]}>
              <Text style={[styles.tagText, { color: '#10B981' }]}>Chemistry Expert</Text>
            </View>
            <View style={[styles.tagPill, { backgroundColor: '#F5F3FF' }]}>
              <Text style={[styles.tagText, { color: '#8B5CF6' }]}>Class 10 & 12</Text>
            </View>
          </View>
        </View>

        {/* Portal Switcher Banner */}
        <TouchableOpacity
          style={styles.portalSwitchBanner}
          onPress={() => router.replace('/(student)')}
          activeOpacity={0.85}
        >
          <View style={styles.portalSwitchLeft}>
            <View style={styles.switchIconBox}>
              <Ionicons name="school" size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.portalSwitchTitle}>Switch to Student App</Text>
              <Text style={styles.portalSwitchSub}>Preview student lessons, fees & materials</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
        </TouchableOpacity>

        {/* Faculty Settings Menu */}
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Academic Classes', 'Active Batches: Class 10-A, 10-B, Class 11-A, Class 12-JEE.')}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#F0F9FF' }]}>
              <Ionicons name="calendar-outline" size={18} color="#0284C7" />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Teaching Schedule & Batches</Text>
              <Text style={styles.menuSub}>Weekly time table and classroom allocation</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Super Admin Sync', 'Attendance and exam marks are auto-synchronized with the center cloud server.')}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#ECFDF3' }]}>
              <Ionicons name="sync-outline" size={18} color={Colors.green} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Super Admin Database Sync</Text>
              <Text style={styles.menuSub}>Live cloud backup & parent SMS queue</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Faculty PIN', 'Current faculty PIN is 654321.')}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="lock-closed-outline" size={18} color="#8B5CF6" />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Faculty Security PIN</Text>
              <Text style={styles.menuSub}>6-digit security code for portal login</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.7}>
            <View style={[styles.menuIconBox, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="log-out-outline" size={18} color={Colors.red} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={[styles.menuTitle, { color: Colors.red }]}>Sign Out of Faculty Portal</Text>
              <Text style={styles.menuSub}>Return to role login screen</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { paddingHorizontal: 16, paddingTop: 10 },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLogoImg: {
    width: 34,
    height: 34,
    borderRadius: 8,
  },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#0284C7', letterSpacing: 0.5 },
  logoSub: { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },

  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  switchBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#0284C7' },

  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarLarge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  avatarLargeText: { fontSize: 24, fontFamily: 'Inter_700Bold', color: '#fff' },
  adminDotBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileName: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  profileRole: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#0284C7', marginTop: 2 },
  profileId: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },

  tagsRow: { flexDirection: 'row', gap: 6, marginTop: 14 },
  tagPill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  portalSwitchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  portalSwitchLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalSwitchTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  portalSwitchSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 1 },

  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: { flex: 1 },
  menuTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  menuSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  menuDivider: { height: 1, backgroundColor: Colors.borderLight, marginLeft: 62 },
});
