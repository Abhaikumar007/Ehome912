import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../lib/authContext';
import { DataService } from '../../lib/dataService';

type FilterType = 'All' | 'Upcoming' | 'Evaluated';

export default function MockTestsScreen() {
  const router = useRouter();
  const { student } = useAuth();
  const [filter, setFilter] = useState<FilterType>('All');
  const [tests, setTests] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const rollNo = student?.rollNo || '';

  const loadTests = async () => {
    if (!rollNo) return;
    try {
      const data = await DataService.getStudentTests(rollNo, student?.class);
      if (data) {
        setTests(data);
      }
    } catch (e) {
      console.log('Error loading student tests:', e);
    }
  };

  useEffect(() => {
    loadTests();
  }, [rollNo]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTests();
    setRefreshing(false);
  };

  const filteredTests = tests.filter((t) => {
    const isEvaluated = t.isStudentEvaluated || t.isEvaluated;
    if (filter === 'Upcoming') return !isEvaluated;
    if (filter === 'Evaluated') return isEvaluated;
    return true;
  });

  const evaluatedCount = tests.filter((t) => t.isStudentEvaluated || t.isEvaluated).length;
  const upcomingCount = tests.filter((t) => !(t.isStudentEvaluated || t.isEvaluated)).length;

  const getSubjectColor = (sub: string) => {
    switch (sub?.toLowerCase()) {
      case 'physics': return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' };
      case 'chemistry': return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
      case 'mathematics':
      case 'maths': return { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' };
      default: return { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/eduhome.png')}
            style={{ width: 34, height: 34, borderRadius: 8 }}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerTitle}>EDU HOME</Text>
            <Text style={styles.headerSub}>EXAM PORTAL</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={22} color={Colors.textSecondary} />
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
        {/* Title & Subtitle */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Mock Tests & Exams</Text>
          <Text style={styles.pageSub}>
            Teacher-curated tests, board mock exams & evaluated answer sheets.
          </Text>
        </View>

        {/* Metrics Overview */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
            <Text style={styles.statVal}>{tests.length}</Text>
            <Text style={styles.statLbl}>Total Assigned</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-done-circle-outline" size={20} color={Colors.green} />
            <Text style={styles.statVal}>{evaluatedCount}</Text>
            <Text style={styles.statLbl}>Evaluated</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={20} color={Colors.amber} />
            <Text style={styles.statVal}>{upcomingCount}</Text>
            <Text style={styles.statLbl}>Upcoming</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {(['All', 'Upcoming', 'Evaluated'] as FilterType[]).map((tab) => {
            const isActive = filter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setFilter(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {tab}
                </Text>
                <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>
                    {tab === 'All' ? tests.length : tab === 'Upcoming' ? upcomingCount : evaluatedCount}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Test Cards List */}
        {filteredTests.length > 0 ? (
          filteredTests.map((test) => {
            const isEval = test.isStudentEvaluated || test.isEvaluated;
            const subColors = getSubjectColor(test.subject);
            const isExpanded = expandedId === test.id;

            return (
              <View key={test.id} style={styles.testCard}>
                {/* Header Row */}
                <View style={styles.cardTopRow}>
                  <View style={styles.badgeGroup}>
                    <View style={[styles.subBadge, { backgroundColor: subColors.bg, borderColor: subColors.border }]}>
                      <Text style={[styles.subBadgeText, { color: subColors.text }]}>{test.subject}</Text>
                    </View>
                    <View style={styles.classBadge}>
                      <Text style={styles.classBadgeText}>{test.classTag}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusTag, isEval ? styles.statusTagGreen : styles.statusTagBlue]}>
                    <Ionicons
                      name={isEval ? "checkmark-circle" : "time"}
                      size={12}
                      color={isEval ? Colors.green : Colors.primary}
                    />
                    <Text style={[styles.statusTagText, { color: isEval ? Colors.green : Colors.primary }]}>
                      {isEval ? 'Evaluated' : 'Upcoming'}
                    </Text>
                  </View>
                </View>

                {/* Test Title */}
                <Text style={styles.testTitle}>{test.title}</Text>

                {/* Schedule Details Grid */}
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.detailText}>{test.dateStr}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.detailText}>{test.timeStr}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.detailText}>{test.roomStr}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="ribbon-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.detailText}>Max: {test.maxMarks} M</Text>
                  </View>
                </View>

                {/* Evaluated Marks Score Card */}
                {isEval && test.studentMarks !== null && test.studentMarks !== undefined && (
                  <View style={styles.evalScoreBox}>
                    <View style={styles.evalScoreLeft}>
                      <Text style={styles.evalScoreLbl}>YOUR SCORE</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                        <Text style={styles.evalScoreValue}>{test.studentMarks}</Text>
                        <Text style={styles.evalScoreTotal}>/ {test.maxMarks}</Text>
                      </View>
                    </View>
                    <View style={styles.evalScoreRight}>
                      <View style={[styles.gradePill, { backgroundColor: test.studentColor || Colors.green }]}>
                        <Text style={styles.gradeText}>{test.studentGrade || 'A'}</Text>
                      </View>
                      <Text style={styles.evalPct}>
                        {Math.round((test.studentMarks / test.maxMarks) * 100)}%
                      </Text>
                    </View>
                  </View>
                )}

                {/* Upcoming Test Notice */}
                {!isEval && (
                  <View style={styles.upcomingNotice}>
                    <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
                    <Text style={styles.upcomingNoticeText}>
                      Reporting time is strictly 15 minutes before commencement.
                    </Text>
                  </View>
                )}

                {/* Syllabus Section */}
                <TouchableOpacity
                  style={styles.syllabusToggle}
                  onPress={() => setExpandedId(isExpanded ? null : test.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.syllabusToggleText}>
                    {isExpanded ? 'Hide Syllabus Chapters' : 'View Syllabus Chapters'}
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={Colors.primary}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.syllabusList}>
                    {Array.isArray(test.syllabus) ? (
                      test.syllabus.map((line: string, idx: number) => (
                        <View key={idx} style={styles.syllabusItem}>
                          <View style={styles.syllabusBullet} />
                          <Text style={styles.syllabusText}>{line}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.syllabusText}>{test.syllabus}</Text>
                    )}
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Tests Found</Text>
            <Text style={styles.emptyDesc}>
              {filter === 'Evaluated'
                ? 'No tests have been graded yet. Complete upcoming tests to see results!'
                : 'No tests currently scheduled for this filter. Check back soon!'}
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 16, paddingTop: 6 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  headerSub: { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: Colors.primary, letterSpacing: 1.5 },
  backBtn: { padding: 6, borderRadius: 20, backgroundColor: Colors.borderLight },

  titleSection: { marginTop: 14, marginBottom: 14 },
  pageTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  pageSub: { fontSize: 13, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 2,
  },
  statVal: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginTop: 4 },
  statLbl: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.textMuted },

  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  filterPillTextActive: { color: '#fff', fontFamily: 'Inter_600SemiBold' },
  filterBadge: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textMuted },
  filterBadgeTextActive: { color: '#fff' },

  testCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  subBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  classBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  classBadgeText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#64748B' },

  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTagGreen: { backgroundColor: Colors.greenLight },
  statusTagBlue: { backgroundColor: Colors.primaryLight },
  statusTagText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  testTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 10 },

  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },

  evalScoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 10,
  },
  evalScoreLeft: { gap: 2 },
  evalScoreLbl: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.green, letterSpacing: 1 },
  evalScoreValue: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.green },
  evalScoreTotal: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  evalScoreRight: { alignItems: 'flex-end', gap: 2 },
  gradePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gradeText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  evalPct: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.green },

  upcomingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  upcomingNoticeText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.primary, flex: 1 },

  syllabusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  syllabusToggleText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primary },

  syllabusList: { marginTop: 8, paddingLeft: 4, gap: 6 },
  syllabusItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  syllabusBullet: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.primary, marginTop: 6 },
  syllabusText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, flex: 1 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  emptyDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 32 },
});
