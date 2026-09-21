import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Modal, TextInput, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { DataService } from '../../lib/dataService';
import { EDUSYNC_STUDENTS } from '../../lib/studentsRoster';
import { supabase } from '../../lib/supabase';

const TODAY_CLASSES = [
  {
    id: 'tc1',
    time: '5:00 PM – 6:00 PM',
    subject: 'Physics',
    class: 'Class 10-A',
    topic: 'Optics – Spherical Mirrors & Ray Diagrams',
    room: 'Room 2A',
    status: 'Upcoming',
    color: '#0284C7',
    bg: '#F0F9FF',
  },
  {
    id: 'tc2',
    time: '6:00 PM – 7:00 PM',
    subject: 'Chemistry',
    class: 'Class 10-B',
    topic: 'Chemical Reactions – Balancing & Precipitates',
    room: 'Room 1B',
    status: 'Upcoming',
    color: '#10B981',
    bg: '#ECFDF3',
  },
  {
    id: 'tc3',
    time: '7:00 PM – 8:00 PM',
    subject: 'Physics',
    class: 'Class 11-A',
    topic: 'Laws of Motion – Friction & Inclined Planes',
    room: 'Room 3C',
    status: 'Scheduled',
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
];

const ASSIGNED_STUDENTS = [
  {
    rollNo: '2024-JEE-0842',
    name: 'Arjun S',
    class: 'Class 12',
    batch: 'JEE Target (Batch A)',
    school: 'EduHome Campus',
    joiningDate: '15 Jan 2026',
    dueDate: '15 Sep 2026',
    daysLeft: -5,
    recentScore: '92%',
    avatarColor: '#0284C7',
    avatar: 'AS',
    monthlyFee: 4000,
    subjects: 'Physics, Chemistry, Maths',
  },
  ...EDUSYNC_STUDENTS,
];

export default function TeacherHomeScreen() {
  const router = useRouter();
  const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [rosterClassFilter, setRosterClassFilter] = useState('All');

  // Teacher Opinions per Student workflow
  const [opinionModalVisible, setOpinionModalVisible] = useState(false);
  const [selectedStudentForOpinion, setSelectedStudentForOpinion] = useState<any>(null);
  const [opinionSubject, setOpinionSubject] = useState<'Physics' | 'Chemistry' | 'Mathematics'>('Physics');
  const [opinionRemark, setOpinionRemark] = useState('');
  const [opinionRating, setOpinionRating] = useState('Outstanding');
  const [pendingOpinions, setPendingOpinions] = useState<any[]>([]);

  const [announcements, setAnnouncements] = useState<any[]>([
    {
      id: 'a1',
      title: 'Parent-Teacher Meeting on 20th Sep',
      desc: 'All faculty members must keep monthly attendance registers and marks ready. Timings: 10:00 AM - 1:00 PM.',
      time: '2 hours ago',
      badge: 'Admin Notice',
    },
    {
      id: 'a2',
      title: 'Class 10 Physics Optics Test Scheduled',
      desc: 'Test 9 syllabus announced. Please ensure ray diagram practice worksheets are distributed today.',
      time: 'Yesterday',
      badge: 'Academic',
    },
  ]);

  const loadAnnouncements = async () => {
    try {
      const list = await DataService.getAnnouncements();
      if (list && list.length > 0) {
        setAnnouncements(
          list.map((a: any) => ({
            id: a.id,
            title: a.title,
            desc: a.desc || a.description || '',
            time: a.time || 'Recent',
            badge: a.tag || 'Broadcast',
          }))
        );
      }
    } catch {}
  };

  const loadPendingOpinions = async () => {
    try {
      const list = await DataService.getPendingTeacherOpinions();
      setPendingOpinions(list || []);
    } catch {}
  };

  useEffect(() => {
    loadAnnouncements();
    loadPendingOpinions();

    // Supabase Realtime: updates instantly when admin broadcasts from PC
    const channel = supabase
      .channel('teacher_announcements_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        console.log('[Realtime] Teacher announcements updated from Supabase!');
        loadAnnouncements();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handlePostAnnouncement = async () => {
    if (!announcementTitle.trim()) {
      Alert.alert('Error', 'Please enter an announcement title.');
      return;
    }
    try {
      const updated = await DataService.addAnnouncement({
        title: announcementTitle.trim(),
        desc: announcementMsg.trim() || 'No additional details provided.',
        author: 'Mr. R Madhusudanan (Senior Faculty • Physics & Chemistry)',
        tag: 'Faculty Broadcast',
        important: true,
      });
      if (updated) {
        setAnnouncements(
          updated.map((a: any) => ({
            id: a.id,
            title: a.title,
            desc: a.desc || a.description || '',
            time: a.time || 'Just now',
            badge: a.tag || 'Faculty Broadcast',
          }))
        );
      }
      setAnnouncementTitle('');
      setAnnouncementMsg('');
      setAnnouncementModalVisible(false);
      Alert.alert(
        'Broadcast Published ✓',
        'Announcement has been synchronized and dispatched to all Student Dashboards and Community Feeds.'
      );
    } catch {
      Alert.alert('Error', 'Failed to post announcement.');
    }
  };

  const handleOpenOpinionModal = (student: any) => {
    setSelectedStudentForOpinion(student);
    setOpinionRemark('');
    setOpinionRating('Outstanding');
    setOpinionModalVisible(true);
  };

  const handleSubmitOpinion = async () => {
    if (!opinionRemark.trim() || !selectedStudentForOpinion) {
      Alert.alert('Remark Required', 'Please enter your academic opinion or remark for this student.');
      return;
    }
    try {
      await DataService.addTeacherOpinion({
        rollNo: selectedStudentForOpinion.rollNo,
        studentName: selectedStudentForOpinion.name,
        teacher: 'Faculty Member',
        subject: opinionSubject,
        remark: `[${opinionRating}] ${opinionRemark.trim()}`,
      });
      setOpinionModalVisible(false);
      await loadPendingOpinions();
      Alert.alert(
        'Submitted for Main Admin Review ✓',
        `Your remark for ${selectedStudentForOpinion.name} has been routed to Main Admin (Mr. R Madhusudanan). Once approved, it will automatically appear in the student's carousel!`
      );
    } catch {
      Alert.alert('Error', 'Failed to submit opinion.');
    }
  };

  const handleApproveOpinion = async (opId: string, studentName: string) => {
    try {
      await DataService.approveTeacherOpinion(opId);
      await loadPendingOpinions();
      Alert.alert(
        'Opinion Approved & Published ✓',
        `Main Admin approval granted! Remark for ${studentName} has been synchronized directly to the student dashboard carousel.`
      );
    } catch {
      Alert.alert('Error', 'Failed to approve opinion.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/eduhome.png')}
            style={{ width: 34, height: 34, borderRadius: 8 }}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.logoTitle}>EDU HOME</Text>
            <Text style={styles.logoSub}>FACULTY PORTAL</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.switchPill}
            onPress={() => router.replace('/(student)')}
            activeOpacity={0.8}
          >
            <Ionicons name="swap-horizontal" size={13} color={Colors.primary} />
            <Text style={styles.switchPillText}>Student View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => Alert.alert('Faculty Notifications', 'All class notes and attendance are synchronized.')}
          >
            <Ionicons name="notifications" size={20} color={Colors.primary} />
            <View style={styles.bellDot} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(teacher)/profile')}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>RM</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Welcome Banner */}
        <View style={styles.welcomeCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingSmall}>Welcome back,</Text>
            <Text style={styles.teacherName}>Mr. R Madhusudanan</Text>
            <Text style={styles.roleBadgeText}>Senior Faculty • Physics & Chemistry</Text>
            <Text style={styles.dateText}>📅 Tue, 9 Sep 2026</Text>
          </View>
          <View style={styles.adminBadge}>
            <Ionicons name="school" size={20} color="#0284C7" />
            <Text style={styles.adminBadgeTitle}>Staff ID</Text>
            <Text style={styles.adminBadgeSub}>FAC-042</Text>
          </View>
        </View>

        {/* Quick Launch Cards */}
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}
            onPress={() => router.push('/(teacher)/attendance')}
            activeOpacity={0.85}
          >
            <View style={[styles.quickIconBox, { backgroundColor: '#0284C7' }]}>
              <Ionicons name="clipboard" size={20} color="#fff" />
            </View>
            <Text style={styles.quickCardTitle}>Take Attendance</Text>
            <Text style={styles.quickCardSub}>Class 10-A • 38/42 Marked</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: '#ECFDF3', borderColor: '#A7F3D0' }]}
            onPress={() => router.push('/(teacher)/materials')}
            activeOpacity={0.85}
          >
            <View style={[styles.quickIconBox, { backgroundColor: '#10B981' }]}>
              <Ionicons name="cloud-upload" size={20} color="#fff" />
            </View>
            <Text style={styles.quickCardTitle}>Upload Notes</Text>
            <Text style={styles.quickCardSub}>Formulas & PYQ PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}
            onPress={() => router.push('/(teacher)/tests')}
            activeOpacity={0.85}
          >
            <View style={[styles.quickIconBox, { backgroundColor: '#8B5CF6' }]}>
              <Ionicons name="stats-chart" size={20} color="#fff" />
            </View>
            <Text style={styles.quickCardTitle}>Enter Marks</Text>
            <Text style={styles.quickCardSub}>Test 8 Evaluation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}
            onPress={() => setAnnouncementModalVisible(true)}
            activeOpacity={0.85}
          >
            <View style={[styles.quickIconBox, { backgroundColor: '#F59E0B' }]}>
              <Ionicons name="megaphone" size={20} color="#fff" />
            </View>
            <Text style={styles.quickCardTitle}>Announcement</Text>
            <Text style={styles.quickCardSub}>Broadcast to Students</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Teaching Schedule */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Assigned Classes</Text>
          <Text style={styles.sectionCount}>3 Sessions</Text>
        </View>

        {TODAY_CLASSES.map((c) => (
          <View key={c.id} style={styles.classCard}>
            <View style={[styles.classColorBar, { backgroundColor: c.color }]} />
            <View style={styles.classCardBody}>
              <View style={styles.classCardTop}>
                <View style={styles.classBadgeWrap}>
                  <Text style={[styles.classBadgeName, { color: c.color }]}>{c.class}</Text>
                  <Text style={styles.subjectDot}>•</Text>
                  <Text style={styles.subjectText}>{c.subject}</Text>
                </View>
                <View style={styles.roomPill}>
                  <Ionicons name="location-outline" size={11} color={Colors.textSecondary} />
                  <Text style={styles.roomText}>{c.room}</Text>
                </View>
              </View>

              <Text style={styles.topicText}>{c.topic}</Text>

              <View style={styles.classCardFooter}>
                <View style={styles.timeWrap}>
                  <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
                  <Text style={styles.timeText}>{c.time}</Text>
                </View>
                <TouchableOpacity
                  style={styles.markAttendanceLink}
                  onPress={() => router.push('/(teacher)/attendance')}
                >
                  <Text style={styles.markAttendanceLinkText}>Attendance &gt;</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {/* Batch Attendance Summary Card */}
        <View style={styles.batchSummaryCard}>
          <View style={styles.batchSummaryHeader}>
            <View style={styles.summaryIconBox}>
              <Ionicons name="analytics" size={16} color="#0284C7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.batchSummaryTitle}>Batch Attendance Health</Text>
              <Text style={styles.batchSummarySub}>Live tracking across active sections</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(teacher)/attendance')}>
              <Text style={styles.viewRosterText}>Full Roster &gt;</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressLabelWrap}>
              <Text style={styles.progressLabel}>Class 10-A (Physics)</Text>
              <Text style={styles.progressPct}>38/42 (90.5%)</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '90.5%', backgroundColor: '#10B981' }]} />
            </View>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressLabelWrap}>
              <Text style={styles.progressLabel}>Class 10-B (Chemistry)</Text>
              <Text style={styles.progressPct}>35/38 (92.1%)</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '92.1%', backgroundColor: '#0284C7' }]} />
            </View>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressLabelWrap}>
              <Text style={styles.progressLabel}>Class 11-A (Maths)</Text>
              <Text style={styles.progressPct}>31/35 (88.6%)</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '88.6%', backgroundColor: '#8B5CF6' }]} />
            </View>
          </View>
        </View>

        {/* Student Academic Opinions & Faculty Remarks Workflow */}
        <View style={[styles.sectionHeader, { marginTop: 16 }]}>
          <View>
            <Text style={styles.sectionTitle}>Student Roster & Faculty Remarks</Text>
            <Text style={styles.sectionSubHint}>
              {ASSIGNED_STUDENTS.length} Students Assigned by Main Admin • Synced with Portals
            </Text>
          </View>
        </View>

        {/* Class Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {['All', 'Class 12', 'Class 11', 'Class 10', 'Class 9', 'Class 8', 'Class 7', 'Class 6'].map((cls) => {
            const isSelected = rosterClassFilter === cls;
            return (
              <TouchableOpacity
                key={cls}
                style={[
                  styles.opinionSubChip,
                  isSelected && styles.opinionSubChipActive,
                  { marginRight: 8, paddingHorizontal: 12, paddingVertical: 6 },
                ]}
                onPress={() => setRosterClassFilter(cls)}
              >
                <Text style={[styles.opinionSubChipText, isSelected && styles.opinionSubChipTextActive]}>
                  {cls}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {ASSIGNED_STUDENTS.filter((stu) => {
          if (rosterClassFilter === 'All') return true;
          return stu.class.toLowerCase().includes(rosterClassFilter.toLowerCase());
        }).map((stu) => (
          <View key={stu.rollNo} style={styles.studentCard}>
            <View style={[styles.studentAvatarBox, { backgroundColor: stu.avatarColor || '#0284C7' }]}>
              <Text style={styles.studentAvatarText}>{stu.avatar || stu.name.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.studentInfoWrap}>
              <View style={styles.studentNameRow}>
                <Text style={styles.studentNameText}>{stu.name}</Text>
                <View style={styles.syncBadge}>
                  <Ionicons name="sync-circle" size={11} color="#0284C7" />
                  <Text style={styles.syncBadgeText}>Main Admin Synced</Text>
                </View>
              </View>
              <Text style={styles.studentClassText}>
                {stu.class} • Roll No: {stu.rollNo}
              </Text>
              <Text style={styles.studentMetaSubText} numberOfLines={1}>
                Batch: {(stu as any).batch || 'Regular'} • Joined: {(stu as any).joiningDate || '15 Jan 2026'}
              </Text>
              {(stu as any).subjects && (
                <Text style={styles.studentSubjectsText} numberOfLines={1}>
                  📚 {(stu as any).subjects}
                </Text>
              )}
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Recent Evaluation: </Text>
                <Text style={styles.scoreVal}>{stu.recentScore}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.addOpinionBtn}
              onPress={() => handleOpenOpinionModal(stu)}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbox-ellipses-outline" size={14} color="#0284C7" />
              <Text style={styles.addOpinionBtnText}>+ Opinion</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Main Admin Opinion Monitoring & Review Queue */}
        {pendingOpinions.length > 0 && (
          <View style={styles.opinionReviewCard}>
            <View style={styles.opinionReviewHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="shield-checkmark" size={18} color="#0284C7" />
                <Text style={styles.opinionReviewTitle}>Main Admin Opinion Review Queue</Text>
              </View>
              <View style={styles.pendingOpBadge}>
                <Text style={styles.pendingOpBadgeText}>{pendingOpinions.length} Awaiting Approval</Text>
              </View>
            </View>
            <Text style={styles.opinionReviewSub}>
              Monitored by Mr. R Madhusudanan. Once approved, the opinion is automatically pushed to the student's dashboard carousel.
            </Text>

            {pendingOpinions.map((op: any) => (
              <View key={op.id} style={styles.pendingOpItem}>
                <View style={styles.pendingOpTop}>
                  <Text style={styles.pendingOpStudent}>{op.studentName} ({op.rollNo})</Text>
                  <View style={styles.pendingOpSubjectBadge}>
                    <Text style={styles.pendingOpSubjectText}>{op.subject}</Text>
                  </View>
                </View>
                <Text style={styles.pendingOpRemark}>"{op.remark}"</Text>
                <TouchableOpacity
                  style={styles.approveOpBtn}
                  onPress={() => handleApproveOpinion(op.id, op.studentName)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="paper-plane" size={14} color="#fff" />
                  <Text style={styles.approveOpBtnText}>Approve & Send to Student</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Announcements Noticeboard */}
        <View style={[styles.sectionHeader, { marginTop: 14 }]}>
          <Text style={styles.sectionTitle}>Faculty Noticeboard</Text>
          <TouchableOpacity onPress={() => setAnnouncementModalVisible(true)}>
            <Text style={styles.newNoticeBtn}>+ Broadcast</Text>
          </TouchableOpacity>
        </View>

        {announcements.map((a) => (
          <View key={a.id} style={styles.noticeCard}>
            <View style={styles.noticeTopRow}>
              <View style={styles.noticeBadge}>
                <Text style={styles.noticeBadgeText}>{a.badge}</Text>
              </View>
              <Text style={styles.noticeTime}>{a.time}</Text>
            </View>
            <Text style={styles.noticeTitle}>{a.title}</Text>
            <Text style={styles.noticeDesc}>{a.desc}</Text>
          </View>
        ))}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Broadcast Announcement Modal */}
      <Modal visible={announcementModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Broadcast Announcement</Text>
              <TouchableOpacity onPress={() => setAnnouncementModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              This announcement will instantly appear on the Student Home page community board and parent feeds.
            </Text>

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Extra Physics Revision Class"
              placeholderTextColor={Colors.textMuted}
              value={announcementTitle}
              onChangeText={setAnnouncementTitle}
            />

            <Text style={styles.inputLabel}>Message / Description</Text>
            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Provide details about timings, venue or requirements..."
              placeholderTextColor={Colors.textMuted}
              value={announcementMsg}
              onChangeText={setAnnouncementMsg}
              multiline
            />

            <TouchableOpacity style={styles.publishBtn} onPress={handlePostAnnouncement} activeOpacity={0.85}>
              <Ionicons name="send" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.publishBtnText}>Publish Announcement</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Teacher Opinion Modal */}
      <Modal visible={opinionModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Add Student Opinion</Text>
              <TouchableOpacity onPress={() => setOpinionModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedStudentForOpinion && (
              <View style={styles.opinionTargetStudentBox}>
                <Text style={styles.opinionTargetName}>{selectedStudentForOpinion.name}</Text>
                <Text style={styles.opinionTargetSub}>
                  {selectedStudentForOpinion.class} • {selectedStudentForOpinion.rollNo}
                </Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Select Subject</Text>
            <View style={styles.opinionSubjectRow}>
              {(['Physics', 'Chemistry', 'Mathematics'] as const).map((sub) => (
                <TouchableOpacity
                  key={sub}
                  style={[styles.opinionSubChip, opinionSubject === sub && styles.opinionSubChipActive]}
                  onPress={() => setOpinionSubject(sub)}
                >
                  <Text style={[styles.opinionSubChipText, opinionSubject === sub && styles.opinionSubChipTextActive]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Performance Impression</Text>
            <View style={styles.opinionSubjectRow}>
              {['Outstanding', 'Consistently Good', 'Needs Improvement'].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[styles.opinionSubChip, opinionRating === rating && styles.opinionSubChipActive]}
                  onPress={() => setOpinionRating(rating)}
                >
                  <Text style={[styles.opinionSubChipText, opinionRating === rating && styles.opinionSubChipTextActive]}>
                    {rating}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Academic Remark & Advice</Text>
            <TextInput
              style={[styles.modalInput, { height: 90, textAlignVertical: 'top' }]}
              placeholder="e.g. Demonstrates exceptional clarity in mechanics; should practice speed in calculus numerical problems..."
              placeholderTextColor={Colors.textMuted}
              value={opinionRemark}
              onChangeText={setOpinionRemark}
              multiline
            />

            <View style={styles.opinionDisclaimerBox}>
              <Ionicons name="information-circle-outline" size={14} color="#0284C7" />
              <Text style={styles.opinionDisclaimerText}>
                Remarks are monitored and verified by Main Admin (Mr. R Madhusudanan) before being delivered to the student dashboard.
              </Text>
            </View>

            <TouchableOpacity style={styles.publishBtn} onPress={handleSubmitOpinion} activeOpacity={0.85}>
              <Ionicons name="paper-plane" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.publishBtnText}>Submit for Admin Approval</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  switchPillText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#0284C7' },
  bellBtn: { position: 'relative', padding: 4 },
  bellDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.red,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' },

  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  greetingSmall: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  teacherName: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginVertical: 2 },
  roleBadgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#0284C7' },
  dateText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 4 },
  adminBadge: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  adminBadgeTitle: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, marginTop: 2 },
  adminBadgeSub: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#0284C7' },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  quickCard: {
    width: '48%',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  quickIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickCardTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  quickCardSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  sectionCount: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  newNoticeBtn: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#0284C7' },

  classCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  classColorBar: { width: 5 },
  classCardBody: { flex: 1, padding: 12 },
  classCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  classBadgeWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  classBadgeName: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  subjectDot: { fontSize: 12, color: Colors.textMuted },
  subjectText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  roomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roomText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  topicText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 8 },
  classCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  markAttendanceLink: { paddingHorizontal: 4, paddingVertical: 2 },
  markAttendanceLinkText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#0284C7' },

  batchSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  batchSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  summaryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchSummaryTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  batchSummarySub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  viewRosterText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#0284C7' },

  progressRow: { marginBottom: 10 },
  progressLabelWrap: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  progressPct: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  progressBarBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  noticeCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noticeTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  noticeBadge: {
    backgroundColor: '#F0F9FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  noticeBadgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#0284C7' },
  noticeTime: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  noticeTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  noticeDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 18 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  closeBtn: { padding: 4 },
  modalSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginBottom: 14 },
  inputLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 6 },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    borderRadius: 12,
    height: 48,
    marginTop: 8,
  },
  publishBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },

  // Fee Approval Queue Styles
  approvalSection: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    padding: 14,
    marginBottom: 16,
  },
  approvalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  approvalTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#92400E',
  },
  pendingCountBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pendingCountText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#B45309',
  },
  approvalSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#78350F',
    lineHeight: 16,
    marginBottom: 10,
  },
  pendingFeeItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  feeItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  feeStudentIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feeStudentIconText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#B45309',
  },
  feeStudentName: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  feeUpiText: {
    fontSize: 10.5,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  feeAmountBadge: {
    backgroundColor: '#ECFDF3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  feeAmountText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#059669',
  },
  feeItemActions: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  approveBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    paddingVertical: 8,
  },
  approveBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  feeStatusSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  feeStatusSummaryText: {
    fontSize: 11.5,
    fontFamily: 'Inter_500Medium',
    color: '#166534',
    flex: 1,
  },

  // Confidential Banner
  confidentialAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  confidentialAlertText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#92400E',
    flex: 1,
    lineHeight: 15,
  },

  sectionSubHint: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Student Opinion Roster Styles
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  studentAvatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  studentInfoWrap: { flex: 1 },
  studentNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  studentNameText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F0F9FF',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  syncBadgeText: { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: '#0284C7' },
  studentClassText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  studentMetaSubText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  studentSubjectsText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: '#0369A1',
    marginTop: 2,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  scoreLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  scoreVal: { fontSize: 10.5, fontFamily: 'Inter_700Bold', color: '#10B981' },
  addOpinionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addOpinionBtnText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#0284C7',
  },

  // Main Admin Review Queue
  opinionReviewCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    padding: 14,
    marginBottom: 14,
    marginTop: 4,
  },
  opinionReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  opinionReviewTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#0369A1',
  },
  pendingOpBadge: {
    backgroundColor: '#E0F2FE',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pendingOpBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#0284C7',
  },
  opinionReviewSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginBottom: 10,
    lineHeight: 15,
  },
  pendingOpItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  pendingOpTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pendingOpStudent: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  pendingOpSubjectBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pendingOpSubjectText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  pendingOpRemark: {
    fontSize: 11.5,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 16,
  },
  approveOpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    borderRadius: 8,
    paddingVertical: 6,
  },
  approveOpBtnText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },

  // Add Opinion Modal Elements
  opinionTargetStudentBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  opinionTargetName: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#0284C7',
  },
  opinionTargetSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  opinionSubjectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  opinionSubChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  opinionSubChipActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
  },
  opinionSubChipText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  opinionSubChipTextActive: {
    color: '#0284C7',
  },
  opinionDisclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  opinionDisclaimerText: {
    fontSize: 10.5,
    fontFamily: 'Inter_400Regular',
    color: '#0369A1',
    flex: 1,
    lineHeight: 14,
  },
});

