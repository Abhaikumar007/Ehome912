import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, ActivityIndicator, RefreshControl, Image, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../lib/authContext';
import { DataService } from '../../lib/dataService';
import { studentData as defaultStudent, todaysClasses as defaultClasses, attendanceData as defaultAtt, feesData as defaultFees } from '../../constants/mockData';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

function StatusBadge({ status }: { status?: string }) {
  const norm = (status || '').toLowerCase().trim();
  if (norm === 'present' || norm === 'p') {
    return (
      <View style={[badgeStyles.wrap, { backgroundColor: Colors.greenLight }]}>
        <Ionicons name="checkmark-circle" size={13} color={Colors.green} />
        <Text style={[badgeStyles.text, { color: Colors.green }]}>Present</Text>
      </View>
    );
  }
  if (norm === 'absent' || norm === 'a') {
    return (
      <View style={[badgeStyles.wrap, { backgroundColor: Colors.redLight }]}>
        <Ionicons name="close-circle-outline" size={13} color={Colors.red} />
        <Text style={[badgeStyles.text, { color: Colors.red }]}>Absent</Text>
      </View>
    );
  }
  return <Text style={{ color: Colors.textMuted, fontSize: 16 }}>—</Text>;
}
const badgeStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  text: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});

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

export default function DashboardScreen() {
  const router = useRouter();
  const { student, refresh: refreshAuth } = useAuth();
  const [dateOffset, setDateOffset] = useState(0);
  const [classes, setClasses] = useState(defaultClasses);
  const [announcementsList, setAnnouncementsList] = useState<any[]>([]);
  const [attSummary, setAttSummary] = useState(defaultAtt);
  const [feesSummary, setFeesSummary] = useState(defaultFees);
  const [academicAlert, setAcademicAlert] = useState<any>(null);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [communityModalVisible, setCommunityModalVisible] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [teacherOpinions, setTeacherOpinions] = useState<any[]>(HOME_TEACHER_OPINIONS);
  const [teacherOpinionIndex, setTeacherOpinionIndex] = useState(0);
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const rollNo = student?.rollNo || defaultStudent.rollNo;

  const loadData = async () => {
    try {
      const [cls, anns, att, fees, alert, opinions, notifs] = await Promise.all([
        DataService.getClasses(rollNo, student?.class),
        DataService.getAnnouncements(),
        DataService.getAttendance(rollNo),
        DataService.getFees(rollNo),
        DataService.getAcademicAlert(),
        DataService.getStudentTeacherOpinions(rollNo),
        DataService.getNotifications(rollNo),
      ]);
      if (cls) setClasses(cls);
      setAnnouncementsList(anns || []);
      if (att) setAttSummary(att);
      if (fees) setFeesSummary(fees);
      setAcademicAlert(alert || null);
      if (opinions && opinions.length > 0) setTeacherOpinions(opinions);
      if (notifs) {
        setHasUnreadNotifs(notifs.some((n: any) => n.unread));
      }
    } catch (err) {
      console.log('Dashboard background load notice (normal view preserved):', err);
    }
  };

  useEffect(() => {
    loadData();

    // Supabase Realtime listener: instant updates when admin/faculty submits attendance, announcements or alerts
    const channel = supabase
      .channel('student_dashboard_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, (payload) => {
        console.log('[Realtime] Announcement change detected:', payload);
        DataService.getAnnouncements(true).then((anns) => {
          setAnnouncementsList(anns || []);
        });
        DataService.getAcademicAlert().then((alt) => {
          setAcademicAlert(alt || null);
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records', filter: `roll_no=eq.${rollNo}` }, () => {
        DataService.getAttendance(rollNo).then((att) => {
          if (att) setAttSummary(att);
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, () => {
        DataService.getClasses(rollNo, student?.class).then((cls) => {
          if (cls) setClasses(cls);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rollNo, student?.class]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadData(),
        refreshAuth(),
        DataService.getAnnouncements(true),
        DataService.syncCurrentStudentFromSupabase(rollNo),
      ]);
    } catch (e) {
      console.warn('[DashboardScreen] Refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const today = new Date();
  today.setDate(today.getDate() + dateOffset);
  const dateLabel = today.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const currentDateIso = `${year}-${month}-${day}`;

  // Dynamic day-based classes and attendance history
  const getDayClasses = (offset: number) => {
    const seen = new Set<string>();
    const reversed = [...classes].reverse();
    const result: any[] = [];
    for (const cls of reversed) {
      if (cls.published === false) continue;
      const matchesDate = cls.class_date ? (cls.class_date === currentDateIso) : (offset === 0);
      if (!matchesDate) continue;
      const normSubject = (cls.subject || '').trim().toLowerCase();
      const normDate = (cls.class_date || currentDateIso).trim();
      const key = `${normSubject}_${normDate}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(cls);
      }
    }
    return result.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  };

  const displayedClasses = getDayClasses(dateOffset);
  const isSunday = today.getDay() === 0;
  const isFuture = dateOffset > 0;

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
                <Text style={styles.avatarText}>{student?.avatar || defaultStudent.avatar}</Text>
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
            <Text style={styles.greetSmall}>Good Afternoon,</Text>
            <Text style={styles.greetName}>{student?.name || defaultStudent.name}</Text>
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
        {announcementsList && announcementsList.length > 0 && (
          <TouchableOpacity
            style={[
              styles.broadcastBanner,
              announcementsList[0].important ? styles.broadcastBannerUrgent : styles.broadcastBannerNormal,
            ]}
            onPress={() => {
              setSelectedAnnouncement(announcementsList[0]);
              setCommunityModalVisible(true);
            }}
            activeOpacity={0.88}
          >
            <View style={styles.broadcastBannerLeft}>
              <View style={[styles.broadcastIconWrap, { backgroundColor: announcementsList[0].iconBg || '#FEF3F2' }]}>
                <Ionicons name={(announcementsList[0].icon as any) || 'megaphone'} size={18} color={announcementsList[0].iconColor || '#F04438'} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.broadcastBadgeRow}>
                  <Text style={[styles.broadcastBadgeText, { color: announcementsList[0].important ? '#DC2626' : '#2563EB' }]}>
                    {announcementsList[0].important ? 'URGENT NOTICE' : 'BROADCAST ANNOUNCEMENT'}
                  </Text>
                  <Text style={styles.broadcastTimeText}>{announcementsList[0].time || 'Recently'}</Text>
                </View>
                <Text style={styles.broadcastTitleText} numberOfLines={1}>
                  {announcementsList[0].title}
                </Text>
                <Text style={styles.broadcastDescText} numberOfLines={2}>
                  {announcementsList[0].desc}
                </Text>
              </View>
            </View>
            <View style={styles.broadcastActionRight}>
              <Text style={[styles.broadcastViewText, { color: announcementsList[0].important ? '#DC2626' : '#2563EB' }]}>View</Text>
              <Ionicons name="chevron-forward" size={14} color={announcementsList[0].important ? '#DC2626' : '#2563EB'} />
            </View>
          </TouchableOpacity>
        )}

        {/* Classes & Attendance for Date */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardIconBox}>
                <Ionicons name="calendar" size={15} color={Colors.primary} />
              </View>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {dateOffset === 0 ? "Today's Classes" : dateOffset === -1 ? "Yesterday's Classes" : "Class Schedule"}
              </Text>
            </View>

            <View style={styles.dateNavWrap}>
              {dateOffset !== 0 && (
                <TouchableOpacity
                  style={styles.todayResetPill}
                  onPress={() => setDateOffset(0)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="refresh" size={10} color={Colors.primary} />
                  <Text style={styles.todayResetText}>Today</Text>
                </TouchableOpacity>
              )}
              <View style={styles.dateNav}>
                <TouchableOpacity
                  onPress={() => setDateOffset(dateOffset - 1)}
                  style={styles.dateNavBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="chevron-back" size={15} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.dateText} numberOfLines={1}>{dateLabel}</Text>
                <TouchableOpacity
                  onPress={() => setDateOffset(dateOffset + 1)}
                  style={styles.dateNavBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="chevron-forward" size={15} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          {displayedClasses.length > 0 ? (
            displayedClasses.map((cls, i) => {
              const subAtt = attSummary?.todaySubjects?.find(
                (s: any) => s.subject && cls.subject && s.subject.trim().toLowerCase() === cls.subject.trim().toLowerCase()
              );
              const effectiveStatus = subAtt?.status || cls.status || 'upcoming';
              return (
                <View key={cls.id || `${cls.subject}_${i}`} style={[styles.classRow, i < displayedClasses.length - 1 && styles.classRowBorder]}>
                  <Text style={styles.classTime}>{cls.time}</Text>
                  <Text style={styles.classSubject}>{cls.subject}</Text>
                  <StatusBadge status={effectiveStatus} />
                </View>
              );
            })
          ) : (
            <View style={styles.noClassWrap}>
              <Ionicons name={isSunday ? "sunny-outline" : "calendar-outline"} size={28} color={Colors.textMuted} />
              <Text style={styles.noClassText}>
                {isSunday
                  ? "Sunday — Tuition Holiday"
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
        {academicAlert && (
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
                <Text style={styles.testAlertActionHint}>Tap to view timings, venue & syllabus</Text>
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

        {/* Community Announcements: Showing ONLY the first 3 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.cardIconBox, { backgroundColor: Colors.amberLight }]}>
                <Ionicons name="megaphone" size={16} color={Colors.amber} />
              </View>
              <Text style={styles.cardTitle}>Community</Text>
            </View>
            {announcementsList.length > 0 && (
              <TouchableOpacity onPress={() => setCommunityModalVisible(true)}>
                <Text style={styles.viewAllText}>View All ({announcementsList.length}) →</Text>
              </TouchableOpacity>
            )}
          </View>

          {announcementsList.length > 0 ? (
            announcementsList.slice(0, 3).map((ann, i) => (
              <TouchableOpacity
                key={ann.id}
                style={[styles.annRow, i < Math.min(announcementsList.length, 3) - 1 && styles.annRowBorder]}
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
                      <Text style={styles.modalMetaLabel}>Date & Time</Text>
                      <Text style={styles.modalMetaVal}>{academicAlert.date}</Text>
                      <Text style={styles.modalMetaSubVal}>{academicAlert.time}</Text>
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
                  {academicAlert.instructions?.map((ins: string, idx: number) => (
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
              {announcementsList.length > 0 ? (
                announcementsList.map((ann) => (
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
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 11,
  },
  classRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  classTime: { width: 130, fontSize: 12, color: Colors.textSecondary, fontFamily: 'Inter_400Regular' },
  classSubject: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },

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
