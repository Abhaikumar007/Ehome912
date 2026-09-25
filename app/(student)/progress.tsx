import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../lib/authContext';

const upcomingAnalytics = [
  {
    id: 'trends',
    icon: 'trending-up-outline',
    iconColor: '#2563EB',
    iconBg: '#EFF6FF',
    title: 'Chapter & Subject Score Trends',
    desc: 'Interactive score curves tracking your growth across weekly tests and term examinations.',
    tag: 'Score Trajectory',
  },
  {
    id: 'accuracy',
    icon: 'locate-outline',
    iconColor: '#059669',
    iconBg: '#ECFDF5',
    title: 'Accuracy & Error Diagnostics',
    desc: 'Deep-dive into negative marking, common conceptual mistakes, and high-frequency error patterns.',
    tag: 'Mistake Analysis',
  },
  {
    id: 'benchmarks',
    icon: 'trophy-outline',
    iconColor: '#D97706',
    iconBg: '#FFFBEB',
    title: 'Batch Percentiles & Benchmarks',
    desc: 'Evaluate your performance relative to batch averages and state-level entrance benchmarks.',
    tag: 'Rank & Percentile',
  },
  {
    id: 'practice',
    icon: 'checkmark-done-circle-outline',
    iconColor: '#7C3AED',
    iconBg: '#F5F3FF',
    title: 'Continuous Evaluation Log',
    desc: 'Detailed record of every mock test attended, accuracy rating, and faculty comments.',
    tag: 'Performance Log',
  },
];

export default function ProgressScreen() {
  const router = useRouter();
  const { student } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/eduhome.png')}
            style={{ width: 34, height: 34, borderRadius: 8 }}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerTitle}>EDU HOME</Text>
            <Text style={styles.headerSub}>YOUR SECOND HOME</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.classPill}>
            <Text style={styles.classPillText}>{student?.class || 'All Classes'}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(student)/notifications' as any)}>
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(student)/profile')}>
            {student?.photoUrl ? (
              <Image source={{ uri: student.photoUrl }} style={{ width: 34, height: 34, borderRadius: 17 }} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{student?.avatar || 'ST'}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Academic Progress</Text>
        <Text style={styles.pageSub}>Performance analytics, chapter mastery, and evaluation reports.</Text>

        {/* Feature Temporarily Locked Hero Card */}
        <View style={styles.lockedHeroCard}>
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={14} color="#D97706" />
            <Text style={styles.lockBadgeText}>Temporarily Locked</Text>
          </View>

          <View style={styles.lockIconCircle}>
            <Ionicons name="bar-chart" size={32} color={Colors.primary} />
            <View style={styles.lockMiniBadge}>
              <Ionicons name="lock-closed" size={14} color="#fff" />
            </View>
          </View>

          <Text style={styles.lockedHeading}>Progress Tracking Coming Soon</Text>
          <Text style={styles.lockedSub}>
            Student performance analytics, score curves, and chapter diagnostics for{' '}
            <Text style={{ fontFamily: 'Inter_700Bold', color: Colors.primary }}>{student?.class || 'your curriculum'}</Text>{' '}
            are temporarily locked until the initial scheduled tests and evaluations are conducted.
          </Text>

          <View style={styles.pillRow}>
            <View style={styles.statusPill}>
              <Ionicons name="analytics-outline" size={12} color={Colors.primary} />
              <Text style={styles.statusPillText}>Performance AI</Text>
            </View>
            <View style={styles.statusPill}>
              <Ionicons name="speedometer-outline" size={12} color={Colors.green} />
              <Text style={styles.statusPillText}>Accuracy Metrics</Text>
            </View>
            <View style={styles.statusPill}>
              <Ionicons name="hourglass-outline" size={12} color={Colors.orange} />
              <Text style={styles.statusPillText}>Unlocks Post-Test</Text>
            </View>
          </View>
        </View>

        {/* What Will Be Available */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Analytics In Development</Text>
          <Text style={styles.sectionHeaderSub}>Upcoming Features</Text>
        </View>

        {upcomingAnalytics.map((item) => (
          <View key={item.id} style={styles.previewCard}>
            <View style={[styles.previewIconBox, { backgroundColor: item.iconBg }]}>
              <Ionicons name={item.icon as any} size={22} color={item.iconColor} />
            </View>
            <View style={styles.previewContent}>
              <View style={styles.previewTitleRow}>
                <Text style={styles.previewTitle}>{item.title}</Text>
                <View style={styles.previewTag}>
                  <Text style={styles.previewTagText}>{item.tag}</Text>
                </View>
              </View>
              <Text style={styles.previewDesc}>{item.desc}</Text>
              <View style={styles.lockedFootRow}>
                <Ionicons name="lock-closed-outline" size={12} color={Colors.textMuted} />
                <Text style={styles.lockedFootText}>Calibrating for next test series</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Motivation Card */}
        <View style={styles.motivationCard}>
          <View style={styles.motIconBox}>
            <Ionicons name="bulb-outline" size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.motTitle}>Stay Consistent</Text>
            <Text style={styles.motSub}>
              Attend daily lectures and complete assigned exercises. Your hard work will reflect in the upcoming evaluation reports!
            </Text>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.background,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 0.5 },
  headerSub: { fontSize: 9, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, letterSpacing: 0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  classPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.cardBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.border,
  },
  classPillText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, color: '#fff', fontFamily: 'Inter_700Bold' },

  pageTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginTop: 8 },
  pageSub: { fontSize: 13, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', marginBottom: 16, marginTop: 2 },

  // Locked Hero Card
  lockedHeroCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 14,
  },
  lockBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lockIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  lockMiniBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#D97706',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#EFF6FF',
  },
  lockedHeading: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  lockedSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusPillText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  sectionHeaderSub: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Colors.textMuted,
  },

  // Preview Cards
  previewCard: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
  },
  previewIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContent: {
    flex: 1,
  },
  previewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  previewTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    flex: 1,
  },
  previewTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  previewTagText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  previewDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 6,
  },
  lockedFootRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockedFootText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Colors.textMuted,
  },

  // Motivation Card
  motivationCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  motIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  motTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  motSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});
