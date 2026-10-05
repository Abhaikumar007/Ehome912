import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, ActivityIndicator, RefreshControl, Image, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Redirect, useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../lib/authContext';
import { DataService, compareClassTimes, resolveSessionType, resolveClassTargetSyllabus } from '../../lib/dataService';
import { todaysClasses as defaultClasses, attendanceData as defaultAtt, feesData as defaultFees } from '../../constants/mockData';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

function StatusBadge({ status, isFuture }: { status?: string; isFuture?: boolean }) {
  if (isFuture) {
    return (
      <View style={[badgeStyles.wrap, { backgroundColor: '#F1F5F9' }]}>
        <Ionicons name="time-outline" size={11} color={Colors.textSecondary} />
        <Text style={[badgeStyles.text, { color: Colors.textSecondary }]}>Upcoming</Text>
      </View>
    );
  }
  const norm = (status || '').toLowerCase().trim();
  if (norm === 'present' || norm === 'p') {
    return (
      <View style={[badgeStyles.wrap, { backgroundColor: Colors.greenLight }]}>
        <Ionicons name="checkmark-circle" size={12} color={Colors.green} />
        <Text style={[badgeStyles.text, { color: Colors.green }]}>Present</Text>
      </View>
    );
  }
  if (norm === 'absent' || norm === 'a') {
    return (
      <View style={[badgeStyles.wrap, { backgroundColor: Colors.redLight }]}>
        <Ionicons name="close-circle-outline" size={12} color={Colors.red} />
        <Text style={[badgeStyles.text, { color: Colors.red }]}>Absent</Text>
      </View>
    );
  }
  if (norm === 'upcoming') {
    return (
      <View style={[badgeStyles.wrap, { backgroundColor: '#F1F5F9' }]}>
        <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
        <Text style={[badgeStyles.text, { color: Colors.textMuted }]}>Upcoming</Text>
      </View>
    );
  }
  return <Text style={{ color: Colors.textMuted, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>—</Text>;
}
const badgeStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 3.5, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3.5 },
  text: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});

function parseClassTime(timeStr?: string): { start: string; end: string } {
  if (!timeStr || timeStr === 'TBD') return { start: 'TBD', end: '' };
  const clean = timeStr.split('•')[0].trim();
  const parts = clean.split(/\s*[-–—]\s*|\s+to\s+/i).map(s => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { start: parts[0], end: parts[1] };
  }
  return { start: clean, end: '' };
}

function getSubjectEmoji(subject?: string): string {
  if (!subject) return '📖';
  const s = subject.toLowerCase().trim();
  if (s.includes('physic')) return '⚛️';
  if (s.includes('chem')) return '🧪';
  if (s.includes('math')) return '📐';
  if (s.includes('bio')) return '🧬';
  if (s.includes('computer') || s.includes('cs') || s.includes('coding') || s.includes('python')) return '💻';
  if (s.includes('english')) return '📚';
  if (s.includes('malayalam')) return '📜';
  if (s.includes('hindi')) return '✍️';
  if (s.includes('social') || s.includes('history') || s.includes('geography') || s.includes('civics')) return '🌍';
  if (s.includes('arabic')) return '🌙';
  if (s.includes('sanskrit')) return '🕉️';
  if (s.includes('account') || s.includes('commerce') || s.includes('business')) return '📊';
  if (s.includes('economic')) return '📈';
  return '📖';
}

interface SessionTypeInfo {
  label: 'Regular Class' | 'Test Paper' | 'Question Bank';
  bg: string;
  border: string;
  color: string;
}

function getClassSessionInfo(cls: any, academicAlert?: any): SessionTypeInfo {
  const resolved: string = resolveSessionType(cls);

  if (resolved === 'TP' || resolved === 'Test Paper') {
    return {
      label: 'Test Paper',
      bg: '#FEF2F2',
      border: '#FECACA',
      color: '#DC2626',
    };
  }

  if (resolved === 'Question Bank') {
    return {
      label: 'Question Bank',
      bg: '#F5F3FF',
      border: '#DDD6FE',
      color: '#7C3AED',
    };
  }

  // Regular Class (default)
  return {
    label: 'Regular Class',
    bg: '#F0F9FF',
    border: '#BAE6FD',
    color: '#0284C7',
  };
}

const HOME_TEACHER_OPINIONS = [
  {
    teacher: 'Mr. Abhai Kumar',
    subject: 'Physics (Senior Faculty)',
    remark: 'Welcome to EduHome! Academic sessions and daily attendance will commence as per your schedule.',
  },
  {
    teacher: 'Dr. Sunita Rao',
    subject: 'Chemistry',
    remark: 'Lab experiments, concept clarifications, and chapter discussions will begin soon. Stay focused!',
  },
  {
    teacher: 'Prof. K V Nair',
    subject: 'Mathematics',
    remark: 'Daily attendance and continuous evaluation will be updated here as regular sessions begin.',
  },
];

/**
 * Dynamic Greeting based on local time:
 * - Morning: “Good Morning” — 5:00 AM to 11:59 AM
 * - Afternoon: “Good Afternoon” — 12:00 PM to 4:59 PM
 * - Evening: “Good Evening” — 5:00 PM to 4:59 AM
 */
function getDynamicGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return 'Good Morning';
  }
  if (hour >= 12 && hour < 17) {
    return 'Good Afternoon';
  }
  return 'Good Evening';
}

export default function DashboardScreen() {
  const router = useRouter();
  const { student, loading: authLoading, refresh: refreshAuth } = useAuth();
  // After 7 PM, default to tomorrow's schedule automatically
  const initialOffset = React.useMemo(() => new Date().getHours() >= 19 ? 1 : 0, []);
  const [dateOffset, setDateOffset] = useState(initialOffset);
  const [classes, setClasses] = useState(defaultClasses);
  const [announcementsList, setAnnouncementsList] = useState<any[]>([]);
  const [attSummary, setAttSummary] = useState(defaultAtt);
  const [feesSummary, setFeesSummary] = useState(defaultFees);
  const [academicAlert, setAcademicAlert] = useState<any>(null);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [communityModalVisible, setCommunityModalVisible] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [teacherOpinions, setTeacherOpinions] = useState<any[]>(HOME_TEACHER_OPINIONS);
  const [publishedDates, setPublishedDates] = useState<string[]>([]);
  const [teacherOpinionIndex, setTeacherOpinionIndex] = useState(0);
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState<string>(getDynamicGreeting());

  // Automatically recalculate dynamic greeting when student opens or switches to Home tab
  useFocusEffect(
    React.useCallback(() => {
      setGreeting(getDynamicGreeting());
    }, [])
  );

  const rollNo = student?.rollNo || '';

  const loadData = async () => {
    setGreeting(getDynamicGreeting());
    try {
      const [cls, anns, att, fees, alert, opinions, notifs, pubDates] = await Promise.all([
        DataService.getClasses(rollNo, student?.class, student?.syllabus),
        DataService.getAnnouncements(false, student?.class),
        DataService.getAttendance(rollNo),
        DataService.getFees(rollNo),
        DataService.getAcademicAlert(student?.class, student?.syllabus),
        DataService.getStudentTeacherOpinions(rollNo),
        DataService.getNotifications(rollNo),
        DataService.getPublishedTimetableDates(),
      ]);
      if (cls) setClasses(cls);
      if (pubDates) setPublishedDates(pubDates);
      setAnnouncementsList(anns || []);
      if (att) setAttSummary(att);
      if (fees) setFeesSummary(fees);
      setAcademicAlert(alert || null);
      if (opinions) setTeacherOpinions(opinions);
      if (notifs) {
        setHasUnreadNotifs(notifs.some((n: any) => n.unread));
      }
    } catch (err) {
      console.log('Dashboard background load notice (normal view preserved):', err);
    }
  };

  useEffect(() => {
    loadData();

    // Supabase Realtime listener: instant updates when admin/faculty submits attendance, announcements, classes or student profile updates
    const channel = supabase
      .channel('student_dashboard_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, (payload) => {
        console.log('[Realtime] Announcement change detected:', payload);
        DataService.getAnnouncements(true, student?.class).then((anns) => {
          setAnnouncementsList(anns || []);
        });
        DataService.getAcademicAlert(student?.class, student?.syllabus).then((alt) => {
          setAcademicAlert(alt || null);
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records', filter: `roll_no=eq.${rollNo}` }, () => {
        DataService.getAttendance(rollNo).then((att) => {
          if (att) setAttSummary(att);
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, () => {
        console.log('[Realtime] Classes change detected in Supabase');
        DataService.getClasses(rollNo, student?.class, student?.syllabus).then((cls) => {
          if (cls) setClasses(cls);
        });
        DataService.getPublishedTimetableDates().then((dates) => {
          if (dates) setPublishedDates(dates);
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students', filter: `roll_no=eq.${rollNo}` }, () => {
        console.log('[Realtime] Student record updated in Supabase, refreshing session');
        refreshAuth();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fees_records', filter: `roll_no=eq.${rollNo}` }, () => {
        DataService.getFees(rollNo).then((f) => {
          if (f) setFeesSummary(f);
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `roll_no=eq.${rollNo}` }, () => {
        console.log('[Realtime] Notifications / Teacher opinions change detected in Supabase');
        DataService.getStudentTeacherOpinions(rollNo).then((ops) => {
          setTeacherOpinions(ops || []);
        });
        DataService.getNotifications(rollNo).then((notifs) => {
          if (notifs) setHasUnreadNotifs(notifs.some((n: any) => n.unread));
        });
      })
      .on('broadcast', { event: 'opinion_deleted' }, (event) => {
        if (!event?.payload || event.payload.rollNo === rollNo) {
          console.log('[Realtime] Opinion deleted broadcast received:', event.payload);
          DataService.getStudentTeacherOpinions(rollNo).then((ops) => {
            setTeacherOpinions(ops || []);
          });
        }
      })
      .on('broadcast', { event: 'student_updated' }, (event) => {
        if (!event?.payload || event.payload.rollNo === rollNo) {
          console.log('[Realtime] Student profile/syllabus broadcast received:', event.payload);
          refreshAuth();
        }
      })
      .on('broadcast', { event: 'fee_approved' }, (event) => {
        if (!event?.payload || event.payload.rollNo === rollNo) {
          DataService.getFees(rollNo).then((f) => {
            if (f) setFeesSummary(f);
          });
        }
      })
      .on('broadcast', { event: 'fee_rejected' }, (event) => {
        if (!event?.payload || event.payload.rollNo === rollNo) {
          DataService.getFees(rollNo).then((f) => {
            if (f) setFeesSummary(f);
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rollNo, student?.class, student?.syllabus]);

  // Keep dynamic greeting accurate if screen remains open over time boundary
  useEffect(() => {
    setGreeting(getDynamicGreeting());
    const interval = setInterval(() => {
      setGreeting(getDynamicGreeting());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setGreeting(getDynamicGreeting());
    try {
      await Promise.all([
        loadData(),
        refreshAuth(),
        DataService.getAnnouncements(true, student?.class),
        DataService.getAcademicAlert(student?.class, student?.syllabus),
      ]);
    } catch (e) {
      console.warn('[DashboardScreen] Refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  };

  // Only show announcements that target this student's specific class or all classes
  const visibleAnnouncements = useMemo(() => {
    if (!student?.class) return announcementsList;
    return announcementsList.filter((a) => DataService.isTargetedToClass(a, student.class));
  }, [announcementsList, student?.class]);

  const today = new Date();
  today.setDate(today.getDate() + dateOffset);
  const dateLabel = today.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const currentDateIso = `${year}-${month}-${day}`;

  // Dynamic day-based classes and attendance history
  const getDayClasses = (offset: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + offset);
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getDate()).padStart(2, '0');
    const targetIso = `${y}-${m}-${d}`;

    const seen = new Set<string>();
    const reversed = [...classes].reverse();
    const result: any[] = [];
    for (const cls of reversed) {
      if (cls.published === false) continue;
      // Filter strictly by student syllabus
      const targetSyllabus = resolveClassTargetSyllabus(cls);
      const studentSyllabus = student?.syllabus || 'State Syllabus';
      if (targetSyllabus !== 'Both') {
        if (studentSyllabus === 'CBSE' && targetSyllabus !== 'CBSE') continue;
        if (studentSyllabus === 'State Syllabus' && targetSyllabus !== 'State Syllabus') continue;
      }
      const matchesDate = cls.class_date ? (cls.class_date === targetIso) : (offset === 0);
      if (!matchesDate) continue;
      const normSubject = (cls.subject || '').trim().toLowerCase();
      const normTime = (cls.time || '').trim().toLowerCase();
      // Deduplicate by slot time so multiple sessions of the same subject (e.g. Regular + Question Bank or Test Paper) are preserved
      const key = cls.id ? String(cls.id) : `${normSubject}_${normTime}_${targetIso}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(cls);
      }
    }
    return result.sort((a, b) => compareClassTimes(a.time, b.time));
  };

  const displayedClasses = getDayClasses(dateOffset);
  const targetDateForOffset = new Date();
  targetDateForOffset.setDate(targetDateForOffset.getDate() + dateOffset);
  const targetIsoYear = targetDateForOffset.getFullYear();
  const targetIsoMonth = String(targetDateForOffset.getMonth() + 1).padStart(2, '0');
  const targetIsoDay = String(targetDateForOffset.getDate()).padStart(2, '0');
  const targetDateIsoStr = `${targetIsoYear}-${targetIsoMonth}-${targetIsoDay}`;

  const isSunday = targetDateForOffset.getDay() === 0;
  const isFuture = dateOffset > 0;
  const isTimetablePublished = publishedDates.includes(targetDateIsoStr);

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!student) {
    return <Redirect href="/login" />;
  }

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
            <Text style={styles.classPillText}>{student?.class || 'Class 12'}</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={onRefresh}
            disabled={refreshing}
            activeOpacity={0.7}
            accessibilityLabel="Refresh student dashboard"
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="refresh" size={17} color={Colors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/(student)/notifications' as any)}>
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
            {hasUnreadNotifs && <View style={styles.notifDot} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(student)/profile')}>
            {student?.photoUrl ? (
              <Image source={{ uri: student.photoUrl }} style={{ width: 34, height: 34, borderRadius: 17 }} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{student?.avatar || (student?.name ? student.name.slice(0, 2).toUpperCase() : 'ST')}</Text>
              </View>
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
        {/* Greeting */}
        <View style={styles.greetRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetSmall}>{greeting},</Text>
            <Text style={styles.greetName}>{student?.name || 'Student'}</Text>
            <Text style={styles.greetMotivation}>Keep going, every step counts!</Text>
          </View>
          <View style={styles.characterBox}>
            {student?.accuracy && student?.streak ? (
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.improvementNumber}>+{student.streak}%</Text>
                <Text style={styles.improvementLabel}>Streak</Text>
              </View>
            ) : (
              <Text style={styles.characterText}>You{'\n'}Can Do It!</Text>
            )}
          </View>
        </View>

        {/* Top Broadcast Notice Banner from Super Admin */}
        {visibleAnnouncements && visibleAnnouncements.length > 0 && (
          <TouchableOpacity
            style={[
              styles.broadcastBanner,
              visibleAnnouncements[0].important ? styles.broadcastBannerUrgent : styles.broadcastBannerNormal,
            ]}
            onPress={() => {
              setSelectedAnnouncement(visibleAnnouncements[0]);
              setCommunityModalVisible(true);
            }}
            activeOpacity={0.88}
          >
            <View style={styles.broadcastBannerLeft}>
              <View style={[styles.broadcastIconWrap, { backgroundColor: visibleAnnouncements[0].iconBg || '#FEF3F2' }]}>
                <Ionicons name={(visibleAnnouncements[0].icon as any) || 'megaphone'} size={18} color={visibleAnnouncements[0].iconColor || '#F04438'} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.broadcastBadgeRow}>
                  <Text style={[styles.broadcastBadgeText, { color: visibleAnnouncements[0].important ? '#DC2626' : '#2563EB' }]}>
                    {visibleAnnouncements[0].important ? 'URGENT NOTICE' : 'BROADCAST ANNOUNCEMENT'}
                  </Text>
                  <Text style={styles.broadcastTimeText}>{visibleAnnouncements[0].time || 'Recently'}</Text>
                </View>
                <Text style={styles.broadcastTitleText} numberOfLines={1}>
                  {visibleAnnouncements[0].title}
                </Text>
                <Text style={styles.broadcastDescText} numberOfLines={2}>
                  {visibleAnnouncements[0].desc}
                </Text>
              </View>
            </View>
            <View style={styles.broadcastActionRight}>
              <Text style={[styles.broadcastViewText, { color: visibleAnnouncements[0].important ? '#DC2626' : '#2563EB' }]}>View</Text>
              <Ionicons name="chevron-forward" size={14} color={visibleAnnouncements[0].important ? '#DC2626' : '#2563EB'} />
            </View>
          </TouchableOpacity>
        )}

        {/* Classes & Attendance for Date */}
        <View style={styles.card}>
          {/* Day Mode Switcher & Date Navigation */}
          <View style={styles.timetableHeader}>
            <View style={styles.dayToggleRow}>
              {/* Today Tab */}
              <TouchableOpacity
                style={[
                  styles.dayTabPill,
                  dateOffset === 0 && styles.dayTabActiveToday,
                ]}
                onPress={() => setDateOffset(0)}
                activeOpacity={0.75}
              >
                <View style={[styles.dayTabDot, { backgroundColor: dateOffset === 0 ? '#10B981' : Colors.textMuted }]} />
                <Text style={[styles.dayTabText, dateOffset === 0 && styles.dayTabTextActiveToday]}>
                  Today
                </Text>
              </TouchableOpacity>

              {/* Tomorrow Tab */}
              <TouchableOpacity
                style={[
                  styles.dayTabPill,
                  dateOffset === 1 && styles.dayTabActiveTomorrow,
                ]}
                onPress={() => setDateOffset(1)}
                activeOpacity={0.75}
              >
                <Text style={{ fontSize: 12, marginRight: 2 }}>🌅</Text>
                <Text style={[styles.dayTabText, dateOffset === 1 && styles.dayTabTextActiveTomorrow]}>
                  Tomorrow
                </Text>
              </TouchableOpacity>
            </View>

            {/* Date Stepper Controls */}
            <View style={styles.dateStepper}>
              <TouchableOpacity
                onPress={() => setDateOffset(dateOffset - 1)}
                style={styles.dateNavBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="chevron-back" size={13} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.dateStepperText} numberOfLines={1}>{dateLabel}</Text>
              <TouchableOpacity
                onPress={() => setDateOffset(dateOffset + 1)}
                style={styles.dateNavBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="chevron-forward" size={13} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Prominent Day Indicator Banner */}
          <View style={[
            styles.dayIndicatorBanner,
            dateOffset === 0 ? styles.dayIndicatorBannerToday :
            dateOffset === 1 ? styles.dayIndicatorBannerTomorrow :
            styles.dayIndicatorBannerOther,
          ]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <Text style={styles.dayIndicatorEmoji}>
                {dateOffset === 0 ? '🟢' : dateOffset === 1 ? '🌅' : '📅'}
              </Text>
              <Text style={[
                styles.dayIndicatorTitle,
                dateOffset === 0 && { color: '#065F46' },
                dateOffset === 1 && { color: '#3730A3' },
              ]} numberOfLines={1}>
                {dateOffset === 0 ? "TODAY'S CLASSES" : dateOffset === 1 ? "TOMORROW'S CLASSES" : dateOffset === -1 ? "YESTERDAY'S CLASSES" : "CLASSES SCHEDULE"}
              </Text>
            </View>
            {isTimetablePublished && displayedClasses.length === 0 ? (
              <View style={styles.publishedHeaderBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#059669" />
                <Text style={styles.publishedHeaderBadgeText}>Timetable Published</Text>
              </View>
            ) : (
              <Text style={[
                styles.dayIndicatorDateSub,
                dateOffset === 0 && { color: '#047857' },
                dateOffset === 1 && { color: '#4338CA' },
              ]}>
                {dateOffset === 0 ? 'Active Today' : dateOffset === 1 ? 'Next Day Schedule' : dateLabel}
              </Text>
            )}
          </View>

          {/* 1-Day Advance Notice for Tomorrow's Exam */}
          {dateOffset === 0 && (() => {
            const tomorrowClasses = getDayClasses(1);
            const testSlot = tomorrowClasses.find((c: any) => getClassSessionInfo(c, academicAlert).label === 'Test Paper');
            const alertDateStr = (academicAlert?.date || '').toLowerCase();
            const hasAlertTomorrow = alertDateStr.includes('oct 2') || alertDateStr.includes('tomorrow');
            const examSub = testSlot?.subject || (hasAlertTomorrow ? (academicAlert?.title || 'Exam') : null);
            if (!examSub) return null;
            return (
              <TouchableOpacity
                style={styles.tomorrowAdvanceNoticeCard}
                onPress={() => setDateOffset(1)}
                activeOpacity={0.85}
              >
                <View style={styles.advanceNoticeIconBox}>
                  <Ionicons name="notifications" size={14} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.advanceNoticeTitle} numberOfLines={1}>
                    Upcoming Exam Tomorrow: {examSub}
                  </Text>
                  <Text style={styles.advanceNoticeSub}>
                    Scheduled 1 day in advance • Tap to view tomorrow's timetable
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#DC2626" />
              </TouchableOpacity>
            );
          })()}

          {displayedClasses.length > 0 ? (
            displayedClasses.map((cls, i) => {
              const subAtt = (() => {
                const normSub = (cls?.subject || '').trim().toLowerCase();
                const clsTimeSlot = (cls?.time || '').split('•')[0].trim().toLowerCase();
                const clsId = String(cls?.id || '');

                // Look in both todaySubjects and history
                const candidates = [
                  ...(attSummary?.todaySubjects || []),
                  ...(attSummary?.history || []).map((h: any) => ({
                    ...h,
                    subject: h.subjects || h.subject,
                    status: (h.status === 'full' || h.score === '1/1') ? 'present' : (h.status === 'absent' || h.score === '0/1') ? 'absent' : h.status,
                  })),
                ];

                // 1. Direct classId match
                if (clsId) {
                  const byId = candidates.find((s: any) => s.classId && String(s.classId) === clsId);
                  if (byId) return byId;
                }

                // 2. Filter candidate records matching this subject
                const subCandidates = candidates.filter((s: any) => {
                  const sSub = (s.subject || s.subjects || s.name || '').trim().toLowerCase();
                  return sSub === normSub || sSub.includes(normSub) || normSub.includes(sSub);
                });

                if (subCandidates.length === 0) return null;

                // 3. Match by time slot
                if (clsTimeSlot) {
                  const byTime = subCandidates.find((s: any) => {
                    const sTime = (s.time || s.timeSlot || '').split('•')[0].trim().toLowerCase();
                    if (!sTime || sTime === 'class session') return false;
                    return sTime === clsTimeSlot || clsTimeSlot.includes(sTime) || sTime.includes(clsTimeSlot);
                  });
                  if (byTime) return byTime;
                }

                // 4. Match by session type
                const clsSessType = getClassSessionInfo(cls, academicAlert).label.toLowerCase();
                const byType = subCandidates.find((s: any) => {
                  const sType = (s.sessionType || '').toLowerCase();
                  return sType && (sType === clsSessType || clsSessType.includes(sType) || sType.includes(clsSessType));
                });
                if (byType) return byType;

                // 5. If only 1 subject candidate and no conflicting time
                if (subCandidates.length === 1 && (!subCandidates[0].time || subCandidates[0].time === 'Class Session')) {
                  return subCandidates[0];
                }

                return null;
              })();
              const effectiveStatus = (subAtt?.status || cls.status || 'upcoming');

              // Determine if this is the current/active class slot based on time
              const isActive = (() => {
                if (dateOffset !== 0) return false;
                const nowH = new Date().getHours();
                const nowM = new Date().getMinutes();
                const timeStr = (cls.time || '').split('–')[0].split('-')[0].trim();
                const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
                if (!match) return i === 0; // first slot if unparseable
                let h = parseInt(match[1]); const min = parseInt(match[2]);
                if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12;
                if (match[3].toUpperCase() === 'AM' && h === 12) h = 0;
                const diffMin = (nowH * 60 + nowM) - (h * 60 + min);
                return diffMin >= 0 && diffMin < 90;
              })();
              const accentColors = ['#0284C7', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
              const accent = accentColors[i % accentColors.length];
              const parsedTime = parseClassTime(cls.time);
              const sessionInfo = getClassSessionInfo(cls, academicAlert);

              return (
                <View
                  key={cls.id || `${cls.subject}_${i}`}
                  style={[
                    styles.classRow,
                    i < displayedClasses.length - 1 && styles.classRowBorder,
                    isActive && styles.classRowActive,
                  ]}
                >
                  {/* Left accent bar */}
                  <View style={[styles.classAccentBar, { backgroundColor: accent }]} />
                  <View style={styles.classRowInner}>
                    {/* 1. Left-aligned Time Column */}
                    <View style={[styles.classTimeCol, isActive && { backgroundColor: accent + '14', borderColor: accent + '45' }]}>
                      <View style={styles.classTimeStartRow}>
                        <Ionicons name="time-outline" size={10} color={isActive ? accent : Colors.textSecondary} />
                        <Text style={[styles.classTimeStart, isActive && { color: accent, fontFamily: 'Inter_700Bold' }]} numberOfLines={1}>
                          {parsedTime.start}
                        </Text>
                        {isActive && <View style={[styles.liveDot, { backgroundColor: accent }]} />}
                      </View>
                      {parsedTime.end ? (
                        <Text style={[styles.classTimeEnd, isActive && { color: accent }]} numberOfLines={1}>
                          {parsedTime.end}
                        </Text>
                      ) : null}
                      {/* Session Type (Regular Class / Test Paper / Question Bank) */}
                      <View style={[styles.sessionTypePill, { backgroundColor: sessionInfo.bg, borderColor: sessionInfo.border }]}>
                        <Text style={[styles.sessionTypeText, { color: sessionInfo.color }]} numberOfLines={1}>
                          {sessionInfo.label}
                        </Text>
                      </View>
                    </View>

                    {/* 2. Center-aligned Subject Column with Emoji */}
                    <View style={styles.classSubjectCenter}>
                      <View style={styles.classSubjectCenterRow}>
                        <Text style={styles.classSubjectEmoji}>{getSubjectEmoji(cls.subject)}</Text>
                        <Text
                          style={[styles.classSubject, isActive && { color: accent }]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {cls.subject}
                        </Text>
                      </View>
                    </View>

                    {/* 3. Right-aligned Status Badge */}
                    <View style={styles.classStatusRight}>
                      <StatusBadge status={effectiveStatus} isFuture={dateOffset > 0} />
                    </View>
                  </View>
                </View>
              );
            })
          ) : isTimetablePublished && !isSunday ? (
            /* Scenario 1: Timetable Published but No Session for this Student / Class */
            <View style={styles.noSessionPublishedBox}>
              <View style={styles.publishedStatusPill}>
                <Ionicons name="checkmark-circle" size={15} color="#059669" />
                <Text style={styles.publishedStatusPillText}>Timetable Published</Text>
              </View>

              <View style={styles.noSessionIconCircle}>
                <Ionicons name="school-outline" size={28} color="#0284C7" />
              </View>

              <Text style={styles.noSessionMainTitle}>
                {dateOffset === 1
                  ? "No Session Tomorrow"
                  : dateOffset === 0
                  ? "No Session Today"
                  : "No Session Scheduled"}
              </Text>

              <Text style={styles.noSessionSubText}>
                {dateOffset === 1
                  ? `Tomorrow's timetable has been published, and there are no classes scheduled for ${student?.class ? (String(student.class).toLowerCase().includes('class') ? student.class : `Class ${student.class}`) : 'your class'}.`
                  : `Today's timetable has been published, and there are no sessions scheduled for your class.`}
              </Text>

              <View style={styles.noSessionStudyBox}>
                <Ionicons name="book-outline" size={16} color="#4338CA" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.noSessionStudyTitle}>Self-Study & Revision Time</Text>
                  <Text style={styles.noSessionStudyText}>
                    Take advantage of this session-free day to review your chapter notes, complete pending assignments, and practice mock test questions.
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noClassWrap}>
              <Ionicons name={isSunday ? "sunny-outline" : "calendar-outline"} size={28} color={Colors.textMuted} />
              <Text style={styles.noClassText}>
                {isSunday
                  ? "Sunday — Tuition Holiday"
                  : dateOffset === 1
                  ? "No classes scheduled for tomorrow yet."
                  : dateOffset === 0
                  ? "No classes scheduled for today."
                  : isFuture
                  ? "No classes published for this day yet."
                  : "No class records for this date."}
              </Text>
              <Text style={styles.noClassSub}>
                {isSunday ? "Recharge & revise for the week ahead!" : "Check back later or contact your faculty."}
              </Text>
            </View>
          )}
        </View>

        {/* Fees Section: Hide if paid. Only show if within 5 days of due date or overdue */}
        {feesSummary.status === 'pending_verification' ? (
          <TouchableOpacity
            style={styles.feesPendingBanner}
            onPress={() => router.push('/(student)/fees')}
            activeOpacity={0.85}
          >
            <View style={styles.feesPendingLeft}>
              <View style={styles.pendingDot} />
              <Ionicons name="time-outline" size={18} color="#D97706" />
              <View>
                <Text style={styles.feesPendingTitle}>
                  ₹{(feesSummary.monthlyFee || feesSummary.actualDue || feesSummary.currentDue || 4000).toLocaleString('en-IN')} Payment Verification Pending
                </Text>
                <Text style={styles.feesPendingSub}>Superadmin is reviewing your UPI transaction</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#D97706" />
          </TouchableOpacity>
        ) : !feesSummary.isPaid && feesSummary.daysLeft <= 5 ? (
          <TouchableOpacity
            style={styles.feesBanner}
            onPress={() => router.push('/(student)/fees')}
            activeOpacity={0.9}
          >
            <View style={styles.feesLeft}>
              <View style={styles.feesDot} />
              <Ionicons name="wallet-outline" size={20} color={Colors.red} />
              <View style={{ flex: 1 }}>
                <Text style={styles.feesAmount}>₹{(feesSummary.monthlyFee || feesSummary.actualDue || feesSummary.currentDue || 0).toLocaleString('en-IN')} is due</Text>
                <Text style={styles.feesDue} numberOfLines={2}>
                  Due on {feesSummary.dueDate}{' '}•{' '}
                  {feesSummary.daysLeft <= 0
                    ? (feesSummary.daysLeft === 0 ? 'Due Today!' : `Overdue by ${Math.abs(feesSummary.daysLeft)}d`)
                    : `${feesSummary.daysLeft} days left`}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.payNowBtn} onPress={() => router.push('/(student)/fees')}>
              <Text style={styles.payNowText}>Pay Now</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        ) : null}

        {/* Academic / Test Paper Alert Banner (Above Overall Attendance) */}
        {academicAlert && DataService.isTargetedToClass(academicAlert, student?.class) && (
          <TouchableOpacity
            style={styles.testAlertCard}
            onPress={() => setAlertModalVisible(true)}
            activeOpacity={0.88}
          >
            <View style={styles.testAlertTopRow}>
              <View style={styles.testAlertBadge}>
                <Ionicons name="notifications" size={12} color="#1D4ED8" />
                <Text style={styles.testAlertBadgeText}>TEST PAPER ALERT</Text>
              </View>
              <Text style={styles.testAlertDate}>{academicAlert.date}</Text>
            </View>

            <Text style={styles.testAlertTitle} numberOfLines={2}>
              {academicAlert.title}
            </Text>

            <View style={styles.testAlertActionRow}>
              <View style={styles.testAlertActionLeft}>
                <Ionicons name="information-circle-outline" size={14} color="#2563EB" />
                <Text style={styles.testAlertActionHint}>Tap to view venue & syllabus details</Text>
              </View>
              <View style={styles.viewSyllabusPill}>
                <Text style={styles.viewSyllabusPillText}>View Details</Text>
                <Ionicons name="arrow-forward" size={12} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/(student)/attendance' as any)}
          activeOpacity={0.9}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardIconBox}>
                <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.cardTitle}>Overall Attendance</Text>
                <Text style={styles.attSub}>
                  {attSummary.total > 0
                    ? `${attSummary.attended} of ${attSummary.total} classes attended this term`
                    : 'No attendance records yet'}
                </Text>
              </View>
            </View>
            <View style={attSummary.total > 0 ? styles.attBadge : styles.attBadgeBlank}>
              {attSummary.total > 0 && <View style={styles.attDot} />}
              <Text style={attSummary.total > 0 ? styles.attBadgeText : styles.attBadgeTextBlank}>
                {attSummary.total > 0 ? `${attSummary.overall}% On Track` : '—'}
              </Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${attSummary.total > 0 ? attSummary.overall : 0}%` }]} />
          </View>
          <View style={styles.viewLogsRow}>
            <Text style={styles.viewLogsText}>View Logs →</Text>
          </View>
        </TouchableOpacity>

        {/* Teacher's Remarks Under Overall Attendance */}
        {teacherOpinions && teacherOpinions.length > 0 && (
        <View style={styles.opinionMiniSection}>
          <View style={styles.opinionMiniHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="chatbubbles-outline" size={14} color={Colors.primary} />
              <Text style={styles.opinionMiniTitle}>Teacher's Summary</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <TouchableOpacity
                onPress={() => setTeacherOpinionIndex((prev) => (prev > 0 ? prev - 1 : teacherOpinions.length - 1))}
                style={styles.miniNavBtn}
              >
                <Ionicons name="chevron-back" size={12} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTeacherOpinionIndex((prev) => (prev < teacherOpinions.length - 1 ? prev + 1 : 0))}
                style={styles.miniNavBtn}
              >
                <Ionicons name="chevron-forward" size={12} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.opinionMiniCard}>
            <Text style={styles.opinionMiniTeacher}>
              {teacherOpinions[teacherOpinionIndex % teacherOpinions.length]?.teacher} ({teacherOpinions[teacherOpinionIndex % teacherOpinions.length]?.subject})
            </Text>
            <Text style={styles.opinionMiniQuote} numberOfLines={2}>
              "{teacherOpinions[teacherOpinionIndex % teacherOpinions.length]?.remark}"
            </Text>
          </View>
        </View>
        )}

        {/* Community Announcements: Showing ONLY the first 3 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.cardIconBox, { backgroundColor: Colors.amberLight }]}>
                <Ionicons name="megaphone" size={16} color={Colors.amber} />
              </View>
              <Text style={styles.cardTitle}>Community</Text>
            </View>
            {visibleAnnouncements.length > 0 && (
              <TouchableOpacity onPress={() => setCommunityModalVisible(true)}>
                <Text style={styles.viewAllText}>View All ({visibleAnnouncements.length}) →</Text>
              </TouchableOpacity>
            )}
          </View>

          {visibleAnnouncements.length > 0 ? (
            visibleAnnouncements.slice(0, 3).map((ann, i) => (
              <TouchableOpacity
                key={ann.id}
                style={[styles.annRow, i < Math.min(visibleAnnouncements.length, 3) - 1 && styles.annRowBorder]}
                onPress={() => {
                  setSelectedAnnouncement(ann);
                  setCommunityModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.annIcon, { backgroundColor: ann.iconBg }]}>
                  <Ionicons name={ann.icon as any} size={16} color={ann.iconColor} />
                </View>
                <View style={styles.annContent}>
                  <View style={styles.annTitleRow}>
                    <Text style={styles.annTitle} numberOfLines={1}>{ann.title}</Text>
                    {ann.important && (
                      <View style={styles.importantBadge}>
                        <Text style={styles.importantText}>Important</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.annDesc} numberOfLines={2}>{ann.desc}</Text>
                  <Text style={styles.annTime}>{ann.time} • Tap to view full</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyAnnBox}>
              <Ionicons name="notifications-outline" size={22} color={Colors.textMuted} />
              <Text style={styles.emptyAnnTitle}>No Active Announcements</Text>
              <Text style={styles.emptyAnnSub}>There are no community broadcasts posted right now.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Academic Alert / Syllabus Detail Modal */}
      <Modal
        visible={alertModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAlertModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.cardIconBox, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="newspaper" size={18} color="#2563EB" />
                </View>
                <Text style={styles.modalTitle}>Academic Test Paper Alert</Text>
              </View>
              <TouchableOpacity onPress={() => setAlertModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {academicAlert && (
                <>
                  <Text style={styles.modalTestTitle}>{academicAlert.title}</Text>
                  <Text style={styles.modalTestDesc}>{academicAlert.shortDesc}</Text>

                  <View style={styles.modalMetaGrid}>
                    <View style={styles.modalMetaCard}>
                      <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
                      <Text style={styles.modalMetaLabel}>Exam Date</Text>
                      <Text style={styles.modalMetaVal}>{academicAlert.date}</Text>
                    </View>
                    <View style={styles.modalMetaCard}>
                      <Ionicons name="location-outline" size={14} color="#10B981" />
                      <Text style={styles.modalMetaLabel}>Venue & Room</Text>
                      <Text style={styles.modalMetaVal}>{academicAlert.room}</Text>
                      <Text style={styles.modalMetaSubVal}>Max: {academicAlert.maxMarks} Marks</Text>
                    </View>
                  </View>

                  <Text style={styles.modalSectionTitle}>📚 Prescribed Test Syllabus</Text>
                  {academicAlert.syllabus?.map((s: string, idx: number) => (
                    <View key={idx} style={styles.syllabusRow}>
                      <Ionicons name="checkmark-circle" size={14} color={Colors.primary} style={{ marginTop: 2 }} />
                      <Text style={styles.syllabusText}>{s}</Text>
                    </View>
                  ))}

                  <Text style={[styles.modalSectionTitle, { marginTop: 14 }]}>⚠️ Student Instructions</Text>
                  {academicAlert.instructions
                    ?.filter((ins: string) => !ins.toLowerCase().includes('calculator'))
                    .map((ins: string, idx: number) => (
                    <View key={idx} style={styles.syllabusRow}>
                      <Ionicons name="alert-circle-outline" size={14} color="#D97706" style={{ marginTop: 2 }} />
                      <Text style={styles.syllabusText}>{ins}</Text>
                    </View>
                  ))}

                  <View style={styles.modalPublisherBox}>
                    <Ionicons name="shield-checkmark" size={14} color="#166534" />
                    <Text style={styles.modalPublisherText}>
                      Published by {academicAlert.updatedBy} • {academicAlert.updatedAt}
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Full Community Announcements Modal */}
      <Modal
        visible={communityModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCommunityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '85%' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.cardIconBox, { backgroundColor: Colors.amberLight }]}>
                  <Ionicons name="megaphone" size={18} color={Colors.amber} />
                </View>
                <Text style={styles.modalTitle}>Community Broadcasts</Text>
              </View>
              <TouchableOpacity onPress={() => setCommunityModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {visibleAnnouncements.length > 0 ? (
                visibleAnnouncements.map((ann) => (
                  <View key={ann.id} style={styles.fullAnnCard}>
                    <View style={styles.fullAnnTop}>
                      <View style={[styles.annIcon, { backgroundColor: ann.iconBg }]}>
                        <Ionicons name={ann.icon as any} size={16} color={ann.iconColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fullAnnTitle}>{ann.title}</Text>
                        <Text style={styles.fullAnnTime}>{ann.time} • Faculty Broadcast</Text>
                      </View>
                      {ann.important && (
                        <View style={styles.importantBadge}>
                          <Text style={styles.importantText}>Important</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.fullAnnDesc}>{ann.desc}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyAnnBox}>
                  <Ionicons name="notifications-outline" size={24} color={Colors.textMuted} />
                  <Text style={styles.emptyAnnTitle}>No Broadcasts Available</Text>
                  <Text style={styles.emptyAnnSub}>There are currently no active announcements or notifications from the faculty.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.background,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: {
    width: 34, height: 34, borderRadius: 8, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 0.5 },
  headerSub: { fontSize: 9, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, letterSpacing: 0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  classPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.cardBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.border,
  },
  classPillText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBtn: { position: 'relative' },
  notifDot: {
    position: 'absolute', top: 1, right: 1,
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.red,
    borderWidth: 1, borderColor: Colors.background,
  },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 12, color: '#fff', fontFamily: 'Inter_700Bold' },

  greetRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 16, marginTop: 4,
  },
  greetSmall: { fontSize: 14, color: Colors.textSecondary, fontFamily: 'Inter_400Regular' },
  greetName: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  greetMotivation: { fontSize: 12, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', marginTop: 2 },
  characterBox: {
    width: 90, height: 80, borderRadius: 12,
    backgroundColor: '#EBF3FF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  characterText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primary, textAlign: 'center' },

  card: {
    backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16,
    marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, marginRight: 6 },
  cardIconBox: {
    width: 28, height: 28, borderRadius: 7,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, flexShrink: 1 },
  dateNavWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
  todayResetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  todayResetText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 2,
  },
  dateNavBtn: { padding: 2 },
  dateText: { fontSize: 11, color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },

  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    marginVertical: 2,
    overflow: 'hidden',
  },
  classRowActive: {
    backgroundColor: '#F0F9FF',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  classAccentBar: {
    width: 3.5,
    height: 52,
    borderRadius: 2,
    marginRight: 8,
  },
  classRowInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // 1. Left Time Column
  classTimeCol: {
    width: 86,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 4.5,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  classTimeStartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: '100%',
  },
  classTimeStart: {
    fontSize: 10.5,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  classTimeEnd: {
    fontSize: 9.5,
    fontFamily: 'Inter_500Medium',
    color: Colors.textMuted,
    marginTop: 1,
    textAlign: 'center',
    width: '100%',
  },
  sessionTypePill: {
    marginTop: 3.5,
    paddingHorizontal: 3,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionTypeText: {
    fontSize: 8.5,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 2,
  },
  // 2. Center Subject Column
  classSubjectCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  classSubjectCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    maxWidth: '100%',
  },
  classSubjectEmoji: {
    fontSize: 15,
  },
  classSubject: {
    fontSize: 13.5,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    flexShrink: 1,
    textAlign: 'center',
  },
  // 3. Right Status Column
  classStatusRight: {
    minWidth: 72,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  classRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  classFaculty: { fontSize: 10, color: Colors.textMuted, fontFamily: 'Inter_400Regular', marginTop: 1 },

  // Timetable Day Switcher & Indicator Styles
  timetableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 6,
  },
  dayToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayTabActiveToday: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  dayTabActiveTomorrow: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  dayTabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dayTabText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  dayTabTextActiveToday: {
    color: '#065F46',
    fontFamily: 'Inter_700Bold',
  },
  dayTabTextActiveTomorrow: {
    color: '#3730A3',
    fontFamily: 'Inter_700Bold',
  },
  dateStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 2,
  },
  dateStepperText: {
    fontSize: 10,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  dayIndicatorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  dayIndicatorBannerToday: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  dayIndicatorBannerTomorrow: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  dayIndicatorBannerOther: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  dayIndicatorEmoji: {
    fontSize: 13,
  },
  dayIndicatorTitle: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.3,
  },
  dayIndicatorDateSub: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  tomorrowAdvanceNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  advanceNoticeIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  advanceNoticeTitle: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#991B1B',
  },
  advanceNoticeSub: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: '#B91C1C',
    marginTop: 1,
  },

  // Scenario 1: Timetable Published but No Session Tomorrow
  publishedHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  publishedHeaderBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#065F46',
  },
  noSessionPublishedBox: {
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  publishedStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6EE7B7',
    marginBottom: 12,
  },
  publishedStatusPillText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#065F46',
  },
  noSessionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  noSessionMainTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: '#1E293B',
    marginBottom: 6,
    textAlign: 'center',
  },
  noSessionSubText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
    maxWidth: 320,
  },
  noSessionStudyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    width: '100%',
  },
  noSessionStudyTitle: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#3730A3',
    marginBottom: 2,
  },
  noSessionStudyText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#4338CA',
    lineHeight: 16,
  },

  noClassWrap: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  noClassText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  noClassSub: { fontSize: 12, color: Colors.textMuted, fontFamily: 'Inter_400Regular' },

  feesBanner: {
    backgroundColor: '#FFF3F3', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12, borderWidth: 1, borderColor: '#FECDCA',
  },
  feesLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 },
  feesDot: {
    position: 'absolute', top: -4, left: -4,
    width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.red,
  },
  feesAmount: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.red },
  feesDue: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'Inter_400Regular' },
  payNowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.red, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  payNowText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },

  feesPendingBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  feesPendingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 },
  pendingDot: {
    position: 'absolute', top: -3, left: -3,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#D97706',
  },
  feesPendingTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#92400E' },
  feesPendingSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#B45309', marginTop: 1 },

  attSub: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', marginTop: 1 },
  attBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.greenLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  attDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.green },
  attBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.green },
  attBadgeBlank: {
    backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
  },
  attBadgeTextBlank: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textMuted },

  progressBarBg: {
    height: 8, borderRadius: 4, backgroundColor: Colors.borderLight, marginTop: 4, marginBottom: 8,
  },
  progressBarFill: {
    height: 8, borderRadius: 4, backgroundColor: Colors.primary,
  },
  viewLogsRow: { alignItems: 'flex-end' },
  viewLogsText: { fontSize: 12, color: Colors.primary, fontFamily: 'Inter_500Medium' },
  viewAllText: { fontSize: 12, color: Colors.primary, fontFamily: 'Inter_500Medium' },

  // Community Announcements
  annRow: { flexDirection: 'row', paddingVertical: 10, gap: 10 },
  annRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  annIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  annContent: { flex: 1 },
  annTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  annTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, flex: 1 },
  importantBadge: { backgroundColor: Colors.redLight, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  importantText: { fontSize: 9, color: Colors.red, fontFamily: 'Inter_700Bold' },
  annDesc: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', lineHeight: 16, marginBottom: 3 },
  annTime: { fontSize: 10, color: Colors.textMuted, fontFamily: 'Inter_400Regular' },
  emptyAnnBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  emptyAnnTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginTop: 8 },
  emptyAnnSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, textAlign: 'center', marginTop: 4 },

  // Improvement Badge
  improvementNumber: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.green,
    lineHeight: 18,
  },
  improvementLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.green,
  },

  // Academic Test Paper Alert Banner
  testAlertCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  testAlertTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  testAlertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  testAlertBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  testAlertDate: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#2563EB',
  },
  testAlertTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#1E3A8A',
    marginBottom: 10,
    lineHeight: 20,
  },
  testAlertActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#BFDBFE',
    gap: 8,
  },
  testAlertActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  testAlertActionHint: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#3B82F6',
    flexShrink: 1,
  },
  viewSyllabusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  viewSyllabusPillText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },

  // Teacher's Opinion Mini Section under Attendance
  opinionMiniSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginTop: -4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  opinionMiniHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  opinionMiniTitle: {
    fontSize: 11.5,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  miniNavBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  opinionMiniCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  opinionMiniTeacher: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    marginBottom: 2,
  },
  opinionMiniQuote: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 15,
    fontStyle: 'italic',
  },

  // Modals Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalTestTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  modalTestDesc: {
    fontSize: 12.5,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  modalMetaGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  modalMetaCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalMetaLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: Colors.textMuted,
    marginTop: 2,
  },
  modalMetaVal: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  modalMetaSubVal: {
    fontSize: 10.5,
    fontFamily: 'Inter_500Medium',
    color: Colors.primary,
    marginTop: 1,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  syllabusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  syllabusText: {
    fontSize: 11.5,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  modalPublisherBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    padding: 8,
    marginTop: 14,
  },
  modalPublisherText: {
    fontSize: 10.5,
    fontFamily: 'Inter_600SemiBold',
    color: '#15803D',
    flex: 1,
  },

  // Full Announcement Card
  fullAnnCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fullAnnTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  fullAnnTitle: {
    fontSize: 13.5,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  fullAnnTime: {
    fontSize: 10.5,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    marginTop: 1,
  },
  fullAnnDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 17,
  },

  // Broadcast Notice Banner
  broadcastBanner: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  broadcastBannerNormal: {
    backgroundColor: '#F0F7FF',
    borderColor: '#BFDBFE',
  },
  broadcastBannerUrgent: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  broadcastBannerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 10,
  },
  broadcastIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  broadcastBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  broadcastBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  broadcastTimeText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  broadcastTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  broadcastDescText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  broadcastActionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },
  broadcastViewText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
