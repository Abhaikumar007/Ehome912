import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { attendanceData as defaultAtt } from '../../constants/mockData';
import { DataService } from '../../lib/dataService';
import { useAuth } from '../../lib/authContext';

type AttStatus = 'present' | 'absent';

const subjectIconMap: Record<string, string> = {
  Physics:     'flash-outline',
  Mathematics: 'calculator-outline',
  Chemistry:   'flask-outline',
  Biology:     'leaf-outline',
};

const TEACHER_OPINIONS = [
  {
    id: '1',
    teacher: 'Mr. Abhai Kumar',
    role: 'Super Admin & Physics',
    subject: 'Physics',
    avatar: 'RM',
    color: '#0284C7',
    bg: '#F0F9FF',
    attendanceScore: 'Pending',
    remark: 'Welcome to EduHome! Attend lectures punctually and participate actively in problem-solving sessions.',
  },
  {
    id: '2',
    teacher: 'Dr. Sunita Rao',
    role: 'Senior Faculty',
    subject: 'Chemistry',
    avatar: 'SR',
    color: '#10B981',
    bg: '#ECFDF3',
    attendanceScore: 'Pending',
    remark: 'Regular attendance and continuous lab session participation will ensure strong mastery of concepts.',
  },
  {
    id: '3',
    teacher: 'Prof. K V Nair',
    role: 'HOD Mathematics',
    subject: 'Mathematics',
    avatar: 'KN',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    attendanceScore: 'Pending',
    remark: 'Daily attendance logs and evaluation records will appear here as regular sessions commence.',
  },
];

export default function AttendanceScreen() {
  const router = useRouter();
  const { student } = useAuth();
  const [dateOffset, setDateOffset] = useState(0);
  const [attendance, setAttendance] = useState(defaultAtt);
  const [refreshing, setRefreshing] = useState(false);
  const [opinionIndex, setOpinionIndex] = useState(0);

  const rollNo = student?.rollNo || '';

  const loadData = async () => {
    if (!rollNo) return;
    try {
      const res = await DataService.getAttendance(rollNo);
      if (res) setAttendance(res);
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

  const base = new Date();
  base.setDate(base.getDate() + dateOffset);
  const dateLabel = base.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  // Dynamic day-based attendance calculation
  const getDayAttendance = (offset: number) => {
    const targetD = new Date();
    targetD.setDate(targetD.getDate() + offset);
    const targetIso = `${targetD.getFullYear()}-${String(targetD.getMonth() + 1).padStart(2, '0')}-${String(targetD.getDate()).padStart(2, '0')}`;
    const targetDateLabel = targetD.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    // 1. Gather all candidates from todaySubjects and history
    const allCandidates = [
      ...(attendance.todaySubjects || []).map((s: any) => ({
        ...s,
        time: s.time || 'Class Session',
      })),
      ...(attendance.history || []).map((h: any) => ({
        id: h.classId || `hist-${Math.random().toString(36).slice(2, 6)}`,
        classId: h.classId || '',
        subject: h.subjects || h.subject,
        time: h.time || 'Class Session',
        sessionType: h.sessionType || 'Regular Class',
        status: (h.status === 'full' || h.score === '1/1') ? 'present' : 'absent',
        date: h.date,
      })),
    ];

    // Filter sessions matching target date
    const matchedSessions = allCandidates.filter((s: any) => {
      if (offset === 0 && !s.date) return true;
      if (s.date && (s.date === targetDateLabel || s.date.includes(targetIso))) return true;
      return false;
    });

    // Deduplicate by classId or subject+time
    const seen = new Set<string>();
    const sessionList: any[] = [];
    matchedSessions.forEach((s: any) => {
      const key = s.classId || `${(s.subject || '').toLowerCase()}_${(s.time || '').toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        sessionList.push(s);
      }
    });

    const listToUse = sessionList.length > 0 ? sessionList : (offset === 0 ? (attendance.todaySubjects || []) : []);
    const presentCnt = listToUse.filter((s: any) => s.status === 'present').length;
    const totalCnt = listToUse.length;
    const pct = totalCnt > 0 ? Math.round((presentCnt / totalCnt) * 100) : 0;

    return {
      subjects: listToUse,
      sessionCount: totalCnt > 0 ? `${presentCnt} of ${totalCnt} Sessions Attended (${pct}%)` : (offset === 0 ? 'No sessions recorded yet today' : 'No sessions recorded for this date'),
      statusSummary: totalCnt > 0 ? `${presentCnt} Present, ${totalCnt - presentCnt} Absent` : (offset === 0 ? 'Attendance pending' : 'No Records'),
      isHoliday: targetD.getDay() === 0,
    };
  };

  const dayAtt = getDayAttendance(dateOffset);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Image
            source={require('../../assets/eduhome.png')}
            style={{ width: 32, height: 32, borderRadius: 6 }}
            resizeMode="contain"
          />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={Colors.primary} />
            <Text style={styles.backText}>Dashboard</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.batchBadge}>
          <View style={styles.batchDot} />
          <Text style={styles.batchText}>{student?.batch || 'Batch A1'}</Text>
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
        <Text style={styles.pageTitle}>Attendance</Text>
        <Text style={styles.pageSub}>Daily subject attendance record</Text>

        {/* Date Navigator */}
        <View style={styles.dateNav}>
          <TouchableOpacity
            onPress={() => setDateOffset(dateOffset - 1)}
            style={styles.navArrow}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={18} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.dateCenterWrap}>
            <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
            <Text style={styles.dateLabelText} numberOfLines={1}>{dateLabel}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setDateOffset(dateOffset + 1)}
            style={styles.navArrow}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {dateOffset !== 0 ? (
          <TouchableOpacity
            style={styles.resetTodayBtn}
            onPress={() => setDateOffset(0)}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={12} color={Colors.primary} />
            <Text style={styles.resetTodayText}>Jump to Today's Attendance</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.sessionCount}>{dayAtt.sessionCount}</Text>

        {/* Subjects for selected date */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {dateOffset === 0 ? "Today's Subjects" : dateOffset === -1 ? "Yesterday's Subjects" : "Subjects Recorded"}
          </Text>
          <Text style={styles.sectionSub}>{dayAtt.statusSummary}</Text>
        </View>

        {dayAtt.subjects.length > 0 ? (
          dayAtt.subjects.map((sub: any, idx: number) => (
            <View key={sub.id || `att-sub-${sub.subject || 'item'}-${idx}`} style={styles.subjectCard}>
              <View style={[styles.subjectIcon, {
                backgroundColor: sub.status === 'present' ? Colors.primaryLight : Colors.redLight,
              }]}>
                <Ionicons
                  name={subjectIconMap[sub.subject] as any ?? 'book-outline'}
                  size={18}
                  color={sub.status === 'present' ? Colors.primary : Colors.red}
                />
              </View>
              <View style={styles.subjectInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={styles.subjectName}>{sub.subject}</Text>
                  {sub.sessionType && (
                    <View style={{
                      backgroundColor: sub.sessionType === 'Test Paper' ? '#FEF2F2' : sub.sessionType === 'Question Bank' ? '#F5F3FF' : '#F0F9FF',
                      paddingHorizontal: 6,
                      paddingVertical: 1,
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: sub.sessionType === 'Test Paper' ? '#FECACA' : sub.sessionType === 'Question Bank' ? '#DDD6FE' : '#BAE6FD',
                    }}>
                      <Text style={{
                        fontSize: 10,
                        fontFamily: 'Inter_600SemiBold',
                        color: sub.sessionType === 'Test Paper' ? '#DC2626' : sub.sessionType === 'Question Bank' ? '#7C3AED' : '#0284C7',
                      }}>
                        {sub.sessionType}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.subjectTime}>{sub.time || 'Class Session'}</Text>
              </View>
              <View style={[styles.statusBadge, {
                backgroundColor: sub.status === 'present' ? Colors.greenLight : Colors.redLight,
              }]}>
                <Ionicons
                  name={sub.status === 'present' ? 'checkmark-circle' : 'close-circle-outline'}
                  size={14}
                  color={sub.status === 'present' ? Colors.green : Colors.red}
                />
                <Text style={[styles.statusText, { color: sub.status === 'present' ? Colors.green : Colors.red }]}>
                  {sub.status === 'present' ? 'Present' : 'Absent'}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noClassBox}>
            <Ionicons name={dayAtt.isHoliday ? "sunny-outline" : "calendar-outline"} size={26} color={Colors.textMuted} />
            <Text style={styles.noClassTitle}>
              {dayAtt.isHoliday ? "Sunday Holiday" : "No sessions held on this date"}
            </Text>
            <Text style={styles.noClassDesc}>
              {dayAtt.isHoliday ? "Take rest and prepare for upcoming classes." : "Use navigation arrows to view past days."}
            </Text>
          </View>
        )}

        {/* Teacher's Opinion Carousel */}
        <View style={styles.opinionSection}>
          <View style={styles.opinionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="chatbubbles" size={16} color={Colors.primary} />
              <Text style={styles.opinionTitle}>Teacher's Opinion & Summary</Text>
            </View>
            <View style={styles.carouselNav}>
              <TouchableOpacity
                onPress={() => setOpinionIndex((prev) => (prev > 0 ? prev - 1 : TEACHER_OPINIONS.length - 1))}
                style={styles.carouselNavBtn}
              >
                <Ionicons name="chevron-back" size={14} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setOpinionIndex((prev) => (prev < TEACHER_OPINIONS.length - 1 ? prev + 1 : 0))}
                style={styles.carouselNavBtn}
              >
                <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Carousel Slide */}
          <View style={styles.opinionCard}>
            <View style={styles.opinionTopRow}>
              <View style={[styles.teacherAvatar, { backgroundColor: TEACHER_OPINIONS[opinionIndex].bg }]}>
                <Text style={[styles.teacherAvatarText, { color: TEACHER_OPINIONS[opinionIndex].color }]}>
                  {TEACHER_OPINIONS[opinionIndex].avatar}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.teacherName}>{TEACHER_OPINIONS[opinionIndex].teacher}</Text>
                <Text style={styles.teacherSubject}>{TEACHER_OPINIONS[opinionIndex].subject} • {TEACHER_OPINIONS[opinionIndex].role}</Text>
              </View>
              <View style={[styles.attScorePill, { backgroundColor: TEACHER_OPINIONS[opinionIndex].bg }]}>
                <Text style={[styles.attScoreText, { color: TEACHER_OPINIONS[opinionIndex].color }]}>
                  {TEACHER_OPINIONS[opinionIndex].attendanceScore}
                </Text>
              </View>
            </View>
            <Text style={styles.opinionQuote}>
              "{TEACHER_OPINIONS[opinionIndex].remark}"
            </Text>

            {/* Indicator Dots */}
            <View style={styles.dotsRow}>
              {TEACHER_OPINIONS.map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setOpinionIndex(idx)}
                  style={[styles.dot, opinionIndex === idx && styles.dotActive]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Recent History */}
        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>Recent Daily History</Text>
          <TouchableOpacity><Text style={styles.pastRecords}>Past Records</Text></TouchableOpacity>
        </View>

        {attendance.history.length > 0 ? (
          attendance.history.map((h, i) => (
            <View key={i} style={[styles.historyRow, i < attendance.history.length - 1 && styles.historyBorder]}>
              <View style={styles.historyLeft}>
                <Text style={styles.historyDate}>{h.date}</Text>
                <Text style={styles.historySubjects}>{h.subjects}</Text>
              </View>
              <View style={[styles.historyBadge, { backgroundColor: h.status === 'full' ? Colors.greenLight : Colors.redLight }]}>
                <Ionicons
                  name={h.status === 'full' ? 'checkmark' : 'close'}
                  size={12}
                  color={h.status === 'full' ? Colors.green : Colors.red}
                />
                <Text style={[styles.historyScore, { color: h.status === 'full' ? Colors.green : Colors.red }]}>
                  {h.score} Present
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyHistoryBox}>
            <Ionicons name="calendar-outline" size={24} color={Colors.textMuted} />
            <Text style={styles.emptyHistoryTitle}>No Attendance Records Yet</Text>
            <Text style={styles.emptyHistorySub}>
              Attendance tracking has not started yet. Once teachers mark attendance during sessions, daily records will appear here.
            </Text>
          </View>
        )}

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
  batchBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primaryLight, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  batchDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.primary },
  batchText: { fontSize: 12, color: Colors.primary, fontFamily: 'Inter_600SemiBold' },

  pageTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  pageSub: { fontSize: 13, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', marginBottom: 16, marginTop: 2 },

  dateNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.cardBg, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 6,
  },
  navArrow: { padding: 4 },
  dateCenterWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' },
  dateLabelText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  resetTodayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 8,
  },
  resetTodayText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  sessionCount: { fontSize: 12, color: Colors.primary, fontFamily: 'Inter_600SemiBold', textAlign: 'center', marginBottom: 20 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  sectionSub: { fontSize: 12, color: Colors.textSecondary, fontFamily: 'Inter_400Regular' },
  pastRecords: { fontSize: 12, color: Colors.primary, fontFamily: 'Inter_500Medium' },

  subjectCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.cardBg, borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  subjectIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  subjectInfo: { flex: 1 },
  subjectName: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  subjectTime: { fontSize: 12, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  historyRow: { paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  historyLeft: { flex: 1 },
  historyDate: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  historySubjects: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', marginTop: 2 },
  historyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  historyScore: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  noClassBox: {
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  noClassTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  noClassDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },

  // Teacher's Opinion Carousel Styles
  opinionSection: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  opinionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  opinionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  carouselNav: {
    flexDirection: 'row',
    gap: 4,
  },
  carouselNavBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opinionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  opinionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  teacherAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherAvatarText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  teacherName: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  teacherSubject: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 1,
  },
  attScorePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  attScoreText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  opinionQuote: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    width: 14,
    backgroundColor: Colors.primary,
  },
  emptyHistoryBox: {
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyHistoryTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  emptyHistorySub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
