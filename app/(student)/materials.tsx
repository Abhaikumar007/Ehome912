import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../lib/authContext';

const pipelineFeatures = [
  {
    id: 'notes',
    icon: 'document-text-outline',
    iconColor: '#2563EB',
    iconBg: '#EFF6FF',
    title: 'Curated Notes & Formula Sheets',
    desc: 'Comprehensive chapter summaries, formula reference guides, and key derivation sheets prepared by faculty.',
    tag: 'Board & Entrance',
  },
  {
    id: 'pyq',
    icon: 'clipboard-outline',
    iconColor: '#059669',
    iconBg: '#ECFDF5',
    title: 'Previous Years’ Questions (PYQ)',
    desc: 'Solved past question papers with step-by-step solutions, marking breakdowns, and tips.',
    tag: 'Question Bank',
  },
  {
    id: 'practical',
    icon: 'flask-outline',
    iconColor: '#D97706',
    iconBg: '#FFFBEB',
    title: 'Practical Lab Demonstrations',
    desc: 'Virtual experiment walk-throughs, apparatus guides, and observation manuals.',
    tag: 'Lab Modules',
  },
  {
    id: 'mock',
    icon: 'timer-outline',
    iconColor: '#7C3AED',
    iconBg: '#F5F3FF',
    title: 'Chapter Tests & Practice Sets',
    desc: 'Interactive test modules and chapter practice questions for self-assessment.',
    tag: 'Self Evaluation',
  },
];

export default function MaterialsScreen() {
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
        <Text style={styles.pageTitle}>Study Materials</Text>
        <Text style={styles.pageSub}>Curated syllabus notes, question banks, and learning resources.</Text>

        {/* Feature Temporarily Locked Hero Card */}
        <View style={styles.lockedHeroCard}>
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={14} color="#D97706" />
            <Text style={styles.lockBadgeText}>Temporarily Locked</Text>
          </View>

          <View style={styles.lockIconCircle}>
            <Ionicons name="book" size={32} color={Colors.primary} />
            <View style={styles.lockMiniBadge}>
              <Ionicons name="lock-closed" size={14} color="#fff" />
            </View>
          </View>

          <Text style={styles.lockedHeading}>Materials Coming Soon</Text>
          <Text style={styles.lockedSub}>
            Course materials, handwritten revision notes, formula sheets, and practical lab modules for{' '}
            <Text style={{ fontFamily: 'Inter_700Bold', color: Colors.primary }}>{student?.class || 'your enrolled classes'}</Text>{' '}
            are currently being curated and vetted by our faculty team. This section will unlock soon!
          </Text>

          <View style={styles.pillRow}>
            <View style={styles.statusPill}>
              <Ionicons name="sparkles" size={12} color={Colors.primary} />
              <Text style={styles.statusPillText}>Faculty Vetted</Text>
            </View>
            <View style={styles.statusPill}>
              <Ionicons name="shield-checkmark-outline" size={12} color={Colors.green} />
              <Text style={styles.statusPillText}>Full Curriculum</Text>
            </View>
            <View style={styles.statusPill}>
              <Ionicons name="time-outline" size={12} color={Colors.orange} />
              <Text style={styles.statusPillText}>In Preparation</Text>
            </View>
          </View>
        </View>

        {/* What's Coming Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>What Will Be Available</Text>
          <Text style={styles.sectionHeaderSub}>Upcoming Features</Text>
        </View>

        {pipelineFeatures.map((item) => (
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
                <Text style={styles.lockedFootText}>Unlocks with next academic update</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Inspiration Banner */}
        <View style={styles.inspirationBanner}>
          <View style={styles.mountainWrap}>
            <View style={styles.mountain1} />
            <View style={styles.mountain2} />
            <View style={styles.flag}>
              <Ionicons name="flag" size={14} color={Colors.red} />
            </View>
          </View>
          <Text style={styles.inspiText}>Discipline today,{'\n'}Results tomorrow.</Text>
          <Text style={styles.inspiSubText}>Smaller{'\n'}Steps{'\n'}Bigger You!</Text>
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
    backgroundColor: '#FAF5FF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    shadowColor: '#7C3AED',
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
    backgroundColor: '#EDE9FE',
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
    borderColor: '#FAF5FF',
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

  // Inspiration Banner
  inspirationBanner: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    overflow: 'hidden',
    minHeight: 110,
  },
  mountainWrap: { position: 'absolute', right: 60, bottom: 0 },
  mountain1: {
    width: 0, height: 0,
    borderLeftWidth: 40, borderRightWidth: 40, borderBottomWidth: 70,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#3B82F6',
  },
  mountain2: {
    position: 'absolute', left: -20, bottom: 0,
    width: 0, height: 0,
    borderLeftWidth: 30, borderRightWidth: 30, borderBottomWidth: 55,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#1D4ED8',
  },
  flag: { position: 'absolute', top: -14, left: 26 },
  inspiText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff', lineHeight: 22, flex: 1 },
  inspiSubText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#93C5FD', textAlign: 'right' },
});
