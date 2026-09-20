import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { progressData as defaultProgress, studentData } from '../../constants/mockData';
import { DataService } from '../../lib/dataService';
import { useAuth } from '../../lib/authContext';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;

// Simple Donut Chart component
function DonutChart({ pct, size = 100 }: { pct: number; size?: number }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  return (
    <Svg width={size} height={size}>
      <G rotation="-90" origin={`${size / 2},${size / 2}`}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={Colors.redLight} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={Colors.green} strokeWidth={stroke} fill="none"
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}

const subjectFilters = ['Overall', 'Maths', 'Physics', 'Chemistry'] as const;
type SubjectFilter = typeof subjectFilters[number];

const SUBJECT_PROGRESS: Record<SubjectFilter, {
  testsAttended: number;
  highestScore: number;
  topPercent: number;
  totalStudents: number;
  improvement: number;
  chartLabels: string[];
  yourScores: number[];
  avgScores: number[];
  accuracy: number;
  incorrect: number;
  gainMarks: number;
  subjectName: string;
  commonMistakes: { rank: number; text: string; count: number }[];
  practice: { attended: number; completed: number; pending: number; highest: number };
}> = {
  Overall: {
    testsAttended: 18,
    highestScore: 96,
    topPercent: 8,
    totalStudents: 1200,
    improvement: 16,
    chartLabels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'],
    yourScores:  [48,   62,   68,   72,   78,   82,   88,   92],
    avgScores:   [50,   50,   52,   55,   58,   60,   62,   65],
    accuracy: 86,
    incorrect: 14,
    gainMarks: 44,
    subjectName: 'Overall',
    commonMistakes: [
      { rank: 1, text: 'Sign errors in algebraic equations', count: 24 },
      { rank: 2, text: 'Unit conversion mistakes in numericals', count: 18 },
      { rank: 3, text: 'Diagram-based reasoning questions', count: 15 },
      { rank: 4, text: 'Formula recall under time pressure', count: 12 },
    ],
    practice: { attended: 18, completed: 14, pending: 4, highest: 96 },
  },
  Maths: {
    testsAttended: 7,
    highestScore: 98,
    topPercent: 5,
    totalStudents: 1200,
    improvement: 24,
    chartLabels: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7'],
    yourScores:  [54,   68,   76,   82,   88,   92,   98],
    avgScores:   [52,   55,   58,   60,   63,   65,   68],
    accuracy: 91,
    incorrect: 9,
    gainMarks: 44,
    subjectName: 'Mathematics',
    commonMistakes: [
      { rank: 1, text: 'Definite integrals boundary sign errors', count: 14 },
      { rank: 2, text: 'Matrix inverse simplification steps', count: 9 },
      { rank: 3, text: 'Trigonometric half-angle formula recall', count: 6 },
    ],
    practice: { attended: 7, completed: 6, pending: 1, highest: 98 },
  },
  Physics: {
    testsAttended: 6,
    highestScore: 92,
    topPercent: 10,
    totalStudents: 1200,
    improvement: 18,
    chartLabels: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
    yourScores:  [50,   62,   70,   78,   85,   92],
    avgScores:   [54,   56,   58,   62,   64,   66],
    accuracy: 83,
    incorrect: 17,
    gainMarks: 42,
    subjectName: 'Physics',
    commonMistakes: [
      { rank: 1, text: 'Free-body diagram vector resolution', count: 12 },
      { rank: 2, text: 'SI vs CGS unit conversion in thermodynamics', count: 10 },
      { rank: 3, text: 'Convex vs concave lens sign convention', count: 7 },
    ],
    practice: { attended: 6, completed: 5, pending: 1, highest: 92 },
  },
  Chemistry: {
    testsAttended: 5,
    highestScore: 95,
    topPercent: 6,
    totalStudents: 1200,
    improvement: 20,
    chartLabels: ['C1', 'C2', 'C3', 'C4', 'C5'],
    yourScores:  [55,   66,   78,   88,   95],
    avgScores:   [58,   60,   63,   67,   70],
    accuracy: 88,
    incorrect: 12,
    gainMarks: 40,
    subjectName: 'Chemistry',
    commonMistakes: [
      { rank: 1, text: 'Organic reaction mechanism electron arrows', count: 11 },
      { rank: 2, text: 'Balancing redox half-equations in acidic medium', count: 8 },
      { rank: 3, text: 'IUPAC naming of coordination complexes', count: 5 },
    ],
    practice: { attended: 5, completed: 4, pending: 1, highest: 95 },
  },
};

export default function ProgressScreen() {
  const router = useRouter();
  const { student } = useAuth();
  const [activeFilter, setActiveFilter] = useState<SubjectFilter>('Overall');
  const [remoteProgress, setRemoteProgress] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const rollNo = student?.rollNo || '2024-JEE-0842';

  const loadData = async () => {
    try {
      const res = await DataService.getProgress(rollNo);
      if (res) setRemoteProgress(res);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
  }, [rollNo]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch {}
    setRefreshing(false);
  };

  // Select data according to active subject filter
  const currentData = {
    ...SUBJECT_PROGRESS[activeFilter],
    ...(activeFilter === 'Overall' && remoteProgress ? remoteProgress : {}),
  };

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
          <TouchableOpacity style={styles.classPill}>
            <Text style={styles.classPillText}>{student?.class || 'Class 12'}</Text>
            <Ionicons name="chevron-down" size={13} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(student)/profile')}>
            {student?.photoUrl ? (
              <Image source={{ uri: student.photoUrl }} style={{ width: 34, height: 34, borderRadius: 17 }} />
            ) : (
              <View style={styles.avatar}><Text style={styles.avatarText}>{student?.avatar || 'AS'}</Text></View>
            )}
          </TouchableOpacity>
        </View>
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
        <Text style={styles.pageTitle}>My Study Progress</Text>
        <Text style={styles.pageSub}>Track your journey. Every effort counts!</Text>

        {/* Subject Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {subjectFilters.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { flex: 1 }]}>
            <Ionicons name="checkbox-outline" size={20} color={Colors.primary} />
            <Text style={styles.statValue}>{currentData.testsAttended}</Text>
            <Text style={styles.statLabel}>Tests Attended</Text>
          </View>
          <View style={[styles.statCard, { flex: 1 }]}>
            <Ionicons name="trophy" size={20} color={Colors.amber} />
            <Text style={styles.statValue}>{currentData.highestScore}<Text style={styles.statSub}>/100</Text></Text>
            <Text style={styles.statLabel}>Highest Score</Text>
            <View style={styles.excellentBadge}>
              <Text style={styles.excellentText}>Excellent!</Text>
            </View>
          </View>
        </View>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { flex: 1 }]}>
            <Ionicons name="people-outline" size={20} color={Colors.purple} />
            <Text style={styles.statValue}>Top {currentData.topPercent}%</Text>
            <Text style={styles.statLabel}>Among {currentData.totalStudents.toLocaleString()} students</Text>
            <View style={styles.aheadBadge}><Text style={styles.aheadText}>You're ahead!</Text></View>
          </View>
          <View style={[styles.statCard, { flex: 1 }]}>
            <Ionicons name="trending-up" size={20} color={Colors.green} />
            <Text style={styles.statValue}>+{currentData.improvement}%</Text>
            <Text style={styles.statLabel}>Overall Improvement</Text>
            <View style={styles.greatBadge}><Text style={styles.greatText}>Great Progress!</Text></View>
          </View>
        </View>

        {/* Line Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.cardIconBox}>
              <Ionicons name="bar-chart" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.chartTitle}>{activeFilter === 'Overall' ? 'Your Marks Progress' : `${activeFilter} Progress Curve`}</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#CBD5E1' }]} />
              <Text style={styles.legendText}>Average Student Score</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>Your Score</Text>
            </View>
          </View>
          <LineChart
            data={{
              labels: currentData.chartLabels,
              datasets: [
                { data: currentData.avgScores, color: () => '#CBD5E1', strokeWidth: 2 },
                { data: currentData.yourScores, color: () => Colors.primary, strokeWidth: 2.5 },
              ],
            }}
            width={CHART_WIDTH}
            height={180}
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: () => Colors.primary,
              labelColor: () => Colors.textMuted,
              style: { borderRadius: 12 },
              propsForDots: { r: '4', strokeWidth: '2', stroke: Colors.primary },
              propsForBackgroundLines: { stroke: Colors.borderLight },
            }}
            bezier
            style={{ borderRadius: 12, marginLeft: -8 }}
            withInnerLines
            withOuterLines={false}
          />
          <View style={styles.chartBanner}>
            <Text style={styles.chartBannerEmoji}>🎉</Text>
            <Text style={styles.chartBannerText}>
              You've improved by <Text style={{ color: Colors.primary, fontFamily: 'Inter_700Bold' }}>+{currentData.gainMarks} marks</Text> in {currentData.subjectName}!{'\n'}
              <Text style={styles.chartBannerSub}>Keep this momentum up for term exams.</Text>
            </Text>
          </View>
        </View>

        {/* Accuracy Donut */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.cardIconBox, { backgroundColor: Colors.greenLight }]}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.green} />
              </View>
              <Text style={styles.chartTitle}>{activeFilter === 'Overall' ? 'Accuracy & Mistakes' : `${activeFilter} Accuracy & Mistakes`}</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View Details &gt;</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.donutWrap}>
            <DonutChart pct={currentData.accuracy} size={110} />
            <View style={styles.donutCenter}>
              <Text style={styles.donutPct}>{currentData.accuracy}%</Text>
              <Text style={styles.donutLabel}>Accuracy</Text>
            </View>
          </View>

          <View style={styles.accuracyRow}>
            <View style={styles.accuracyItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.green }]} />
              <Text style={styles.accuracyText}>Correct:&nbsp;</Text>
              <Text style={[styles.accuracyText, { fontFamily: 'Inter_700Bold' }]}>{currentData.accuracy}%</Text>
            </View>
            <View style={styles.accuracyItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.red }]} />
              <Text style={styles.accuracyText}>Incorrect:&nbsp;</Text>
              <Text style={[styles.accuracyText, { fontFamily: 'Inter_700Bold' }]}>{currentData.incorrect}%</Text>
            </View>
          </View>

          <Text style={styles.mistakesTitle}>⚠️ Most Common Mistakes ({activeFilter})</Text>
          {currentData.commonMistakes.map((m: any) => (
            <View key={m.rank} style={styles.mistakeRow}>
              <View style={styles.mistakeRank}><Text style={styles.mistakeRankText}>{m.rank}</Text></View>
              <Text style={styles.mistakeText}>{m.text}</Text>
              <Text style={styles.mistakeCount}>{m.count} times</Text>
            </View>
          ))}
        </View>

        {/* Practice & Tests */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.cardIconBox, { backgroundColor: Colors.purpleLight }]}>
                <Ionicons name="clipboard-outline" size={16} color={Colors.purple} />
              </View>
              <Text style={styles.chartTitle}>Practice & Tests</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All &gt;</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.practiceGrid}>
            {[
              { icon: 'calendar-outline', value: currentData.practice.attended, label: 'Attended', color: Colors.primary },
              { icon: 'checkmark-done-circle-outline', value: currentData.practice.completed, label: 'Completed', color: Colors.green },
              { icon: 'time-outline', value: currentData.practice.pending, label: 'Pending', color: Colors.amber },
              { icon: 'trophy-outline', value: currentData.practice.highest, label: 'Highest', color: Colors.orange },
            ].map((item) => (
              <View key={item.label} style={styles.practiceItem}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
                <Text style={styles.practiceValue}>{item.value}</Text>
                <Text style={styles.practiceLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Daily Inspiration */}
        <View style={styles.inspirationCard}>
          <Text style={styles.inspiLabel}>DAILY INSPIRATION</Text>
          <Text style={styles.inspiQuote}>"Progress isn't luck. It's consistency."</Text>
          <View style={styles.inspiTagWrap}>
            <Text style={styles.inspiTag}>Small Steps = Big Results!</Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.background },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { width: 34, height: 34, borderRadius: 8, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 0.5 },
  headerSub: { fontSize: 9, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  classPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.cardBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.border },
  classPillText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, color: '#fff', fontFamily: 'Inter_700Bold' },

  pageTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginTop: 8 },
  pageSub: { fontSize: 13, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', marginBottom: 16, marginTop: 2 },

  filterScroll: { marginBottom: 16 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  filterTextActive: { color: '#fff', fontFamily: 'Inter_700Bold' },

  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    backgroundColor: Colors.cardBg, borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  statValue: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginTop: 6 },
  statSub: { fontSize: 14, color: Colors.textSecondary },
  statLabel: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', marginTop: 2 },
  excellentBadge: { marginTop: 4, alignSelf: 'flex-start', backgroundColor: Colors.amberLight, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  excellentText: { fontSize: 10, color: Colors.amber, fontFamily: 'Inter_600SemiBold' },
  aheadBadge: { marginTop: 4, alignSelf: 'flex-start', backgroundColor: Colors.primaryLight, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  aheadText: { fontSize: 10, color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
  greatBadge: { marginTop: 4, alignSelf: 'flex-start', backgroundColor: Colors.greenLight, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  greatText: { fontSize: 10, color: Colors.green, fontFamily: 'Inter_600SemiBold' },

  chartCard: {
    backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16,
    marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  chartTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 8, justifyContent: 'flex-end' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'Inter_400Regular' },

  chartBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primaryLight, borderRadius: 10, padding: 10, marginTop: 10,
  },
  chartBannerEmoji: { fontSize: 20 },
  chartBannerText: { flex: 1, fontSize: 12, color: Colors.textPrimary, fontFamily: 'Inter_500Medium', lineHeight: 18 },
  chartBannerSub: { color: Colors.textSecondary, fontFamily: 'Inter_400Regular' },

  card: {
    backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  viewAll: { fontSize: 12, color: Colors.primary, fontFamily: 'Inter_500Medium' },

  donutWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  donutCenter: { position: 'absolute', alignItems: 'center' },
  donutPct: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  donutLabel: { fontSize: 10, color: Colors.textSecondary, fontFamily: 'Inter_400Regular' },
  accuracyRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 14 },
  accuracyItem: { flexDirection: 'row', alignItems: 'center' },
  accuracyText: { fontSize: 12, color: Colors.textSecondary, fontFamily: 'Inter_400Regular' },

  mistakesTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 8 },
  mistakeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  mistakeRank: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.redLight, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  mistakeRankText: { fontSize: 11, color: Colors.red, fontFamily: 'Inter_700Bold' },
  mistakeText: { flex: 1, fontSize: 12, color: Colors.textPrimary, fontFamily: 'Inter_400Regular' },
  mistakeCount: { fontSize: 12, color: Colors.red, fontFamily: 'Inter_600SemiBold' },

  practiceGrid: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 4 },
  practiceItem: { alignItems: 'center', gap: 4 },
  practiceValue: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  practiceLabel: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'Inter_400Regular' },

  inspirationCard: {
    backgroundColor: Colors.primary, borderRadius: 16, padding: 20, marginBottom: 4,
  },
  inspiLabel: { fontSize: 10, color: '#93C5FD', fontFamily: 'Inter_700Bold', letterSpacing: 1, marginBottom: 6 },
  inspiQuote: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff', lineHeight: 22, marginBottom: 10 },
  inspiTagWrap: { backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  inspiTag: { fontSize: 11, color: '#fff', fontFamily: 'Inter_500Medium' },
});
