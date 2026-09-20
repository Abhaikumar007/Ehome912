import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Modal, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { teacherData } from '../../constants/mockData';
import { DataService } from '../../lib/dataService';
import { EDUSYNC_STUDENTS } from '../../lib/studentsRoster';

interface StudentRoster {
  id: string;
  no: string;
  name: string;
  roll: string;
  overall: string;
  online: boolean;
  attendance: 'P' | 'A';
  note?: string;
}

const INITIAL_CLASSES = [
  { id: 'c1', label: 'Class 10-A (Physics)', batch: 'Batch A • Optics & Lenses', studentsCount: 42 },
  { id: 'c2', label: 'Class 10-B (Chemistry)', batch: 'Batch B • Chemical Reactions', studentsCount: 38 },
  { id: 'c3', label: 'Class 11-A (Maths)', batch: 'Batch A • Quadratic Calculus', studentsCount: 35 },
];

// Map class label to EDUSYNC class name for filtering
const CLASS_MAP: Record<string, string> = {
  'c1': 'Class 10',
  'c2': 'Class 10',
  'c3': 'Class 11',
};

export default function FacultyAttendanceScreen() {
  const router = useRouter();
  const [selectedClassId, setSelectedClassId] = useState('c1');
  const [searchQuery, setSearchQuery] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [students, setStudents] = useState<StudentRoster[]>(teacherData.students as StudentRoster[]);
  const [dateOffset, setDateOffset] = useState(0);
  const [classModalVisible, setClassModalVisible] = useState(false);

  // Load students from shared EDUSYNC roster when class changes
  useEffect(() => {
    const classPrefix = CLASS_MAP[selectedClassId] || 'Class 10';
    const rosterStudents = EDUSYNC_STUDENTS
      .filter((s) => s.class.startsWith(classPrefix))
      .map((s, idx) => ({
        id: s.rollNo,
        no: String(idx + 1).padStart(2, '0'),
        name: s.name,
        roll: s.rollNo,
        overall: '—',
        online: true,
        attendance: 'P' as 'P' | 'A',
      }));
    // Fall back to teacherData if no matching EDUSYNC students
    setStudents(rosterStudents.length > 0 ? rosterStudents : (teacherData.students as StudentRoster[]));
    setSubmitted(false);
  }, [selectedClassId]);

  // Format date display
  const getDateLabel = () => {
    const d = new Date();
    d.setDate(d.getDate() + dateOffset);
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const currentClass = INITIAL_CLASSES.find((c) => c.id === selectedClassId) || INITIAL_CLASSES[0];

  // Filter students by search
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Recalculate summary metrics
  const presentCount = students.filter((s) => s.attendance === 'P').length;
  const absentCount = students.filter((s) => s.attendance === 'A').length;
  const totalCount = students.length;

  const toggleAttendance = (id: string, status: 'P' | 'A') => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, attendance: status } : s))
    );
    setSubmitted(false);
  };

  const markAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, attendance: 'P' })));
    setSubmitted(false);
  };

  const clearAll = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, attendance: 'A' })));
    setSubmitted(false);
  };

  const handleSaveSubmit = async () => {
    const dateLabel = getDateLabel();
    const subject = currentClass.label.replace(/.*\((.*)\)/, '$1') || 'General';
    setSubmitted(true);
    // Save to DataService so it syncs to each student's portal
    try {
      await DataService.saveBatchAttendance(
        students.map((s) => ({ rollNo: s.roll, name: s.name, status: s.attendance })),
        dateLabel,
        subject,
        currentClass.label
      );
    } catch {
      // Offline fallback — still mark submitted
    }
    Alert.alert(
      'Attendance Submitted Successfully',
      `Class: ${currentClass.label}\nDate: ${dateLabel}\nPresent: ${presentCount} | Absent: ${absentCount}\n\nAttendance has been saved and will reflect in each student's portal.`,
      [{ text: 'OK' }]
    );
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
            style={styles.batchSelector}
            onPress={() => setClassModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.batchSelectorText} numberOfLines={1}>
              {currentClass.label.split(' ')[0]} {currentClass.label.split(' ')[1]}
            </Text>
            <Ionicons name="chevron-down" size={13} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => Alert.alert('Faculty Notifications', 'No urgent administrative circulars at this moment.')}
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
        {/* Faculty Greeting & Date Navigation */}
        <View style={styles.greetingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingSmall}>Good Afternoon,</Text>
            <Text style={styles.teacherName}>Mr. R Madhusudanan</Text>
            <Text style={styles.teacherSub}>Super Admin • Physics & Chemistry</Text>
          </View>

          <View style={styles.dateNavPill}>
            <TouchableOpacity onPress={() => setDateOffset(dateOffset - 1)} style={styles.dateArrow}>
              <Ionicons name="chevron-back" size={14} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.dateNavText}>{getDateLabel()}</Text>
            <TouchableOpacity onPress={() => setDateOffset(dateOffset + 1)} style={styles.dateArrow}>
              <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Class Selection Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classesScroll}>
          {INITIAL_CLASSES.map((c) => {
            const isActive = c.id === selectedClassId;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.classChip, isActive && styles.classChipActive]}
                onPress={() => {
                  setSelectedClassId(c.id);
                  setSubmitted(false);
                }}
                activeOpacity={0.8}
              >
                {isActive && <View style={styles.activeChipDot} />}
                <Text style={[styles.classChipText, isActive && styles.classChipTextActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Attendance Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryHeaderLeft}>
              <View style={styles.summaryIconBox}>
                <Ionicons name="clipboard" size={16} color="#fff" />
              </View>
              <View>
                <Text style={styles.summaryTitle}>Attendance Summary</Text>
                <Text style={styles.summarySub}>{currentClass.batch}</Text>
              </View>
            </View>

            <View style={[styles.readyBadge, submitted && styles.submittedBadge]}>
              <View style={[styles.readyDot, submitted && { backgroundColor: Colors.green }]} />
              <Text style={[styles.readyText, submitted && { color: Colors.green }]}>
                {submitted ? 'Submitted' : 'Ready to Submit'}
              </Text>
            </View>
          </View>

          {/* 3 Metric Cards */}
          <View style={styles.metricGrid}>
            <View style={[styles.metricBox, { backgroundColor: '#F8FAFC' }]}>
              <Text style={styles.metricLabel}>TOTAL</Text>
              <Text style={[styles.metricValue, { color: Colors.textPrimary }]}>{totalCount}</Text>
            </View>
            <View style={[styles.metricBox, { backgroundColor: '#ECFDF3' }]}>
              <Text style={[styles.metricLabel, { color: Colors.green }]}>PRESENT</Text>
              <Text style={[styles.metricValue, { color: Colors.green }]}>
                {presentCount < 10 ? `0${presentCount}` : presentCount}
              </Text>
            </View>
            <View style={[styles.metricBox, { backgroundColor: '#FEF3F2' }]}>
              <Text style={[styles.metricLabel, { color: Colors.red }]}>ABSENT</Text>
              <Text style={[styles.metricValue, { color: Colors.red }]}>
                {absentCount < 10 ? `0${absentCount}` : absentCount}
              </Text>
            </View>
          </View>
        </View>

        {/* Search & Quick Controls */}
        <View style={styles.searchBarRow}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search" size={16} color={Colors.textMuted} style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search student or roll no..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.allPresentBtn} onPress={markAllPresent} activeOpacity={0.8}>
            <Text style={styles.allPresentText}>All Present</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearBtn} onPress={clearAll} activeOpacity={0.8}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Students Roster */}
        <View style={styles.rosterContainer}>
          {filteredStudents.map((item) => {
            const isPresent = item.attendance === 'P';
            return (
              <View key={item.id} style={styles.studentCard}>
                {/* Roll Index */}
                <View style={[styles.noCircle, isPresent ? styles.noCirclePresent : styles.noCircleAbsent]}>
                  <Text style={[styles.noText, isPresent ? styles.noTextPresent : styles.noTextAbsent]}>
                    {item.no}
                  </Text>
                </View>

                {/* Info */}
                <View style={styles.studentInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.studentName}>{item.name}</Text>
                    {item.online && <View style={styles.onlineDot} />}
                    {!isPresent && (
                      <View style={styles.absentBadge}>
                        <Text style={styles.absentBadgeText}>Absent</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.studentSub}>
                    {item.roll} • {item.note ? item.note : `${item.overall} Overall`}
                  </Text>
                </View>

                {/* P / A Action Switcher */}
                <View style={styles.paToggleWrap}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, isPresent && styles.togglePresentActive]}
                    onPress={() => toggleAttendance(item.id, 'P')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.toggleBtnText, isPresent && styles.togglePresentTextActive]}>
                      P
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.toggleBtn, !isPresent && styles.toggleAbsentActive]}
                    onPress={() => toggleAttendance(item.id, 'A')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.toggleBtnText, !isPresent && styles.toggleAbsentTextActive]}>
                      A
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Bottom Submit Button */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSaveSubmit} activeOpacity={0.85}>
          <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.submitBtnText}>Save & Submit Attendance</Text>
        </TouchableOpacity>

        <View style={styles.syncFooter}>
          <View style={styles.syncDot} />
          <Text style={styles.syncText}>Auto-syncing to Super Admin Portal</Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Class Selector Modal */}
      <Modal visible={classModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setClassModalVisible(false)}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Assigned Batch</Text>
            {INITIAL_CLASSES.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.modalItem, c.id === selectedClassId && styles.modalItemActive]}
                onPress={() => {
                  setSelectedClassId(c.id);
                  setClassModalVisible(false);
                }}
              >
                <View>
                  <Text style={[styles.modalItemTitle, c.id === selectedClassId && styles.modalItemTitleActive]}>
                    {c.label}
                  </Text>
                  <Text style={styles.modalItemSub}>{c.batch}</Text>
                </View>
                {c.id === selectedClassId && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { paddingHorizontal: 16, paddingTop: 6 },

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
  batchSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  batchSelectorText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#0284C7' },
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

  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 12,
  },
  greetingSmall: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  teacherName: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  teacherSub: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.textMuted, marginTop: 2 },

  dateNavPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  dateArrow: { padding: 2 },
  dateNavText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },

  classesScroll: { marginBottom: 14 },
  classChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  classChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  activeChipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  classChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  classChipTextActive: { color: '#fff' },

  summaryCard: {
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
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  summaryHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  summarySub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 1 },

  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  submittedBadge: { backgroundColor: '#ECFDF3' },
  readyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D97706' },
  readyText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#B45309' },

  metricGrid: { flexDirection: 'row', gap: 8 },
  metricBox: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, marginBottom: 2 },
  metricValue: { fontSize: 24, fontFamily: 'Inter_700Bold' },

  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textPrimary },
  allPresentBtn: {
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  allPresentText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#0284C7' },
  clearBtn: { paddingHorizontal: 6, paddingVertical: 8 },
  clearBtnText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textMuted },

  rosterContainer: { gap: 8, marginBottom: 18 },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  noCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  noCirclePresent: { backgroundColor: '#F0F9FF' },
  noCircleAbsent: { backgroundColor: '#FEF2F2' },
  noText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  noTextPresent: { color: '#0284C7' },
  noTextAbsent: { color: Colors.red },

  studentInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  studentName: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.green },
  absentBadge: { backgroundColor: '#FEE2E2', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  absentBadgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: Colors.red },
  studentSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },

  paToggleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textMuted },
  togglePresentActive: { backgroundColor: '#10B981' },
  togglePresentTextActive: { color: '#fff' },
  toggleAbsentActive: { backgroundColor: '#EF4444' },
  toggleAbsentTextActive: { color: '#fff' },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    borderRadius: 14,
    height: 50,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },

  syncFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  syncDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.green },
  syncText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 12 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalItemActive: { backgroundColor: '#F0F9FF', borderRadius: 8, paddingHorizontal: 8 },
  modalItemTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  modalItemTitleActive: { color: '#0284C7' },
  modalItemSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
});
