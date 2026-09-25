import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Modal, Image, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { DataService, AcademicAlert } from '../../lib/dataService';
import { EDUSYNC_STUDENTS } from '../../lib/studentsRoster';
import DatePickerModal from '../../components/DatePickerModal';

interface TestStudent {
  id: string;
  name: string;
  roll: string;
  marks: number;
  grade: string;
  color: string;
}

export type FacultySubject = 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology' | 'Computer Science';

interface ExamItem {
  id: string;
  title: string;
  subject: FacultySubject;
  classTag: string;
  dateStr: string;
  timeStr: string;
  roomStr: string;
  maxMarks: number;
  syllabus: string[];
  isEvaluated: boolean;
  students: TestStudent[];
}

const AUTHORIZED_CLASSES = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10-A', 'Class 10-B', 'Class 11-A', 'Class 12-JEE'];
const SUBJECTS: FacultySubject[] = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science'];

export default function TeacherTestsScreen() {
  const router = useRouter();
  const [tests, setTests] = useState<ExamItem[]>([]);
  const [selectedClass, setSelectedClass] = useState('Class 10-A');
  const [activeTestId, setActiveTestId] = useState<string>('');

  // Load persisted tests from DataService
  useEffect(() => {
    const loadTests = async () => {
      const data = await DataService.getTests();
      if (data && data.length > 0) {
        setTests(data);
        const match = data.find((t: ExamItem) => t.classTag === selectedClass) || data[0];
        if (match) setActiveTestId(match.id);
      }
    };
    loadTests();
  }, []);

  // Update active test on class selection
  useEffect(() => {
    if (tests.length > 0) {
      const match = tests.find((t) => t.classTag === selectedClass);
      if (match) {
        setActiveTestId(match.id);
      }
    }
  }, [selectedClass]);

  // Edit marks modal state
  const [selectedStudent, setSelectedStudent] = useState<TestStudent | null>(null);
  const [editMarksInput, setEditMarksInput] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);

  // New test modal state
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState<FacultySubject>('Physics');
  const [newClass, setNewClass] = useState('Class 10-A');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('04:30 PM - 06:00 PM');
  const [newRoom, setNewRoom] = useState('Room 204');
  const [newMaxMarks, setNewMaxMarks] = useState('100');
  const [newSyllabus, setNewSyllabus] = useState('');
  const [publishAsAlert, setPublishAsAlert] = useState(true);
  const [showUntilDate, setShowUntilDate] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'examDate' | 'expiryDate'>('examDate');

  // Active test
  const activeTest = tests.find((t) => t.id === activeTestId) || tests[0];

  const avgMarks = activeTest?.students.length
    ? Math.round(activeTest.students.reduce((acc, s) => acc + s.marks, 0) / activeTest.students.length)
    : 0;
  const highestMarks = activeTest?.students.length
    ? Math.max(...activeTest.students.map((s) => s.marks))
    : 0;

  const openEditMarks = (s: TestStudent) => {
    setSelectedStudent(s);
    setEditMarksInput(s.marks.toString());
    setEditModalVisible(true);
  };

  const handleSaveMarks = async () => {
    if (!selectedStudent || !activeTest) return;
    const val = parseInt(editMarksInput, 10);
    const max = activeTest.maxMarks || 100;
    if (isNaN(val) || val < 0 || val > max) {
      Alert.alert('Invalid Marks', `Please enter a valid number between 0 and ${max}.`);
      return;
    }

    const pct = (val / max) * 100;
    const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : 'C';
    const color = pct >= 85 ? '#10B981' : pct >= 75 ? '#0284C7' : '#F59E0B';

    setTests((prev) =>
      prev.map((t) => {
        if (t.id === activeTest.id) {
          const updatedStudents = t.students.map((s) =>
            s.id === selectedStudent.id ? { ...s, marks: val, grade, color } : s
          );
          return { ...t, students: updatedStudents, isEvaluated: true };
        }
        return t;
      })
    );

    // Sync marks to student's progress report & notifications
    await DataService.updateTestMarks(
      activeTest.id,
      selectedStudent.id,
      selectedStudent.roll,
      val,
      max,
      grade,
      color
    );

    setEditModalVisible(false);
    Alert.alert('Marks Saved & Synced', `Updated marks for ${selectedStudent.name} (${val}/${max}) and synced to student report!`);
  };

  // Publish Active Test as Academic Alert to Student Dashboard
  const handlePublishAlert = async (testItem: ExamItem) => {
    const alertData: AcademicAlert = {
      id: 'alert-' + testItem.id,
      type: 'test_paper',
      badge: 'TEST PAPER ALERT',
      title: testItem.title,
      shortDesc: testItem.syllabus.slice(0, 2).join(' • '),
      date: testItem.dateStr,
      time: testItem.timeStr,
      room: testItem.roomStr,
      syllabus: testItem.syllabus,
      maxMarks: testItem.maxMarks,
      instructions: [
        'Reporting time is strictly 15 minutes before test commencement.',
        'Bring geometry box and scientific calculator if required.',
        'Syllabus verified by Super Admin Mr. R Madhusudanan.',
      ],
      updatedBy: 'Mr. R Madhusudanan (Super Admin)',
      updatedAt: 'Just now',
      expiryDate: showUntilDate || undefined,
    };

    await DataService.saveAcademicAlert(alertData);
    Alert.alert(
      'Alert Published!',
      `"${testItem.title}" has been broadcast to all ${testItem.classTag} students! It will now appear on their home screen alert banner with timings and syllabus.`
    );
  };

  const handleCreateTest = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Missing Field', 'Please enter a test title.');
      return;
    }

    const syllabusArray = newSyllabus
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const maxVal = parseInt(newMaxMarks, 10) || 100;

    const newTestObj: ExamItem = {
      id: 'test-' + Date.now(),
      title: newTitle.trim(),
      subject: newSubject,
      classTag: newClass,
      dateStr: newDate.trim() || 'Upcoming Session',
      timeStr: newTime.trim() || '04:30 PM - 06:00 PM',
      roomStr: newRoom.trim() || 'Room 204',
      maxMarks: maxVal,
      syllabus: syllabusArray.length > 0 ? syllabusArray : ['General Syllabus Revision'],
      isEvaluated: false,
      students: EDUSYNC_STUDENTS.slice(0, 8).map((s, idx) => ({
        id: `stu-${idx}-${Date.now()}`,
        name: s.name,
        roll: s.rollNo,
        marks: 0,
        grade: 'Pending',
        color: '#94A3B8',
      })),
    };

    setTests([newTestObj, ...tests]);
    setActiveTestId(newTestObj.id);
    setSelectedClass(newClass);

    // Save test paper in DataService so students can see it in Mock Tests & Alerts
    await DataService.saveTest(newTestObj);

    if (publishAsAlert) {
      await handlePublishAlert(newTestObj);
    }

    setCreateModalVisible(false);
    setNewTitle('');
    Alert.alert('Success', `New test "${newTestObj.title}" assigned to ${newClass} successfully.`);
  };

  // Filter tests matching selected class
  const classTests = tests.filter((t) => t.classTag === selectedClass);

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
          style={styles.newTestBtn}
          onPress={() => setCreateModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="calendar" size={14} color="#fff" />
          <Text style={styles.newTestBtnText}>Schedule Test</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Super Admin Authorization Banner */}
        <View style={styles.adminAuthCard}>
          <View style={styles.adminAvatarBox}>
            <Text style={styles.adminAvatarText}>RM</Text>
          </View>
          <View style={styles.adminAuthInfo}>
            <View style={styles.adminBadgeRow}>
              <Text style={styles.adminAuthTitle}>Mr. R Madhusudanan</Text>
              <View style={[styles.superBadge, { backgroundColor: '#0284C7' }]}>
                <Ionicons name="school" size={10} color="#fff" />
                <Text style={styles.superBadgeText}>FACULTY</Text>
              </View>
            </View>
            <Text style={styles.adminAuthSub}>
              Subjects, classes & student rosters assigned by Main Admin • Auto-sync active
            </Text>
          </View>
        </View>

        {/* Prominent Schedule New Test Action Banner */}
        <TouchableOpacity
          style={styles.prominentScheduleBtn}
          onPress={() => setCreateModalVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.scheduleIconCircle}>
            <Ionicons name="add" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.prominentScheduleTitle}>+ Schedule New Test</Text>
            <Text style={styles.prominentScheduleSub}>
              Select assigned class & subject, configure syllabus and broadcast alert
            </Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={22} color="#0284C7" />
        </TouchableOpacity>

        {/* Class Selection Chips */}
        <Text style={styles.sectionLabel}>ASSIGNED CLASSES (SYNCED FROM MAIN ADMIN)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {AUTHORIZED_CLASSES.map((cls) => {
            const isSelected = selectedClass === cls;
            return (
              <TouchableOpacity
                key={cls}
                style={[styles.classChip, isSelected && styles.classChipActive]}
                onPress={() => {
                  setSelectedClass(cls);
                  const firstInClass = tests.find((t) => t.classTag === cls);
                  if (firstInClass) setActiveTestId(firstInClass.id);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.classChipText, isSelected && styles.classChipTextActive]}>
                  {cls}
                </Text>
                {isSelected && <Ionicons name="checkmark-circle" size={13} color="#0284C7" style={{ marginLeft: 4 }} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Test Selection Horizontal Carousel / Pills */}
        <View style={styles.testSelectRow}>
          <Text style={styles.sectionLabel}>TEST PAPERS ({classTests.length})</Text>
          <TouchableOpacity
            style={styles.schedulePillBtn}
            onPress={() => setCreateModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={15} color="#0284C7" />
            <Text style={styles.schedulePillText}>+ Schedule Test</Text>
          </TouchableOpacity>
        </View>

        {classTests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No tests scheduled for {selectedClass} yet.</Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => {
                setNewClass(selectedClass);
                setCreateModalVisible(true);
              }}
            >
              <Text style={styles.emptyAddText}>+ Schedule Test for {selectedClass}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.testTabsScroll}>
            {classTests.map((t) => {
              const isActive = t.id === activeTest.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.testTab, isActive && styles.testTabActive]}
                  onPress={() => setActiveTestId(t.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.testTabSubject, isActive && styles.testTabSubjectActive]}>
                    {t.subject}
                  </Text>
                  <Text style={[styles.testTabTitle, isActive && styles.testTabTitleActive]} numberOfLines={1}>
                    {t.title.split(':')[0]}
                  </Text>
                  <Text style={[styles.testTabDate, isActive && styles.testTabDateActive]}>
                    {t.dateStr.split(',')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Active Test Card Details */}
        {activeTest && (
          <View style={styles.testCard}>
            <View style={styles.testCardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.testTag}>{activeTest.classTag} • {activeTest.subject}</Text>
                <Text style={styles.testTitle}>{activeTest.title}</Text>
                <Text style={styles.testDate}>
                  📅 {activeTest.dateStr} • ⏰ {activeTest.timeStr} • 📍 {activeTest.roomStr}
                </Text>
                <Text style={styles.testMax}>Maximum Marks: {activeTest.maxMarks}</Text>
              </View>
              <View style={[styles.evalPill, { backgroundColor: activeTest.isEvaluated ? '#ECFDF3' : '#FFFBEB' }]}>
                <Text style={[styles.evalText, { color: activeTest.isEvaluated ? Colors.green : '#D97706' }]}>
                  {activeTest.isEvaluated ? 'Evaluated ✓' : 'Pending'}
                </Text>
              </View>
            </View>

            {/* Test Metrics */}
            <View style={styles.metricGrid}>
              <View style={[styles.metricBox, { backgroundColor: '#F0F9FF' }]}>
                <Text style={styles.metricLabel}>BATCH AVG</Text>
                <Text style={[styles.metricVal, { color: '#0284C7' }]}>{avgMarks}/{activeTest.maxMarks}</Text>
              </View>
              <View style={[styles.metricBox, { backgroundColor: '#ECFDF3' }]}>
                <Text style={styles.metricLabel}>HIGHEST</Text>
                <Text style={[styles.metricVal, { color: Colors.green }]}>{highestMarks}/{activeTest.maxMarks}</Text>
              </View>
              <View style={[styles.metricBox, { backgroundColor: '#FEF3F2' }]}>
                <Text style={styles.metricLabel}>SUBMITTED</Text>
                <Text style={[styles.metricVal, { color: Colors.red }]}>
                  {activeTest.students.length}/{activeTest.students.length}
                </Text>
              </View>
            </View>

            {/* Broadcast to Student Dashboard Alert Button */}
            <TouchableOpacity
              style={styles.broadcastAlertBtn}
              onPress={() => handlePublishAlert(activeTest)}
              activeOpacity={0.85}
            >
              <Ionicons name="megaphone" size={16} color="#0284C7" />
              <View style={{ flex: 1 }}>
                <Text style={styles.broadcastBtnTitle}>Broadcast to Student Alert Banner</Text>
                <Text style={styles.broadcastBtnSub}>Update timings, room & syllabus on student home screen</Text>
              </View>
              <Ionicons name="cloud-upload-outline" size={18} color="#0284C7" />
            </TouchableOpacity>
          </View>
        )}

        {/* Student Marks List */}
        {activeTest && (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Student Marks Evaluation</Text>
                <Text style={styles.sectionHint}>Tap any student row to modify or enter marks</Text>
              </View>
              <View style={styles.studentsCountBadge}>
                <Text style={styles.studentsCountText}>{activeTest.students.length} Students</Text>
              </View>
            </View>

            {activeTest.students.map((item, i) => (
              <TouchableOpacity
                key={item.id}
                style={styles.markCard}
                onPress={() => openEditMarks(item)}
                activeOpacity={0.8}
              >
                <View style={styles.rankBox}>
                  <Text style={styles.rankText}>#{i + 1}</Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{item.name}</Text>
                  <Text style={styles.studentRoll}>{item.roll}</Text>
                </View>
                <View style={styles.scoreWrap}>
                  <Text style={[styles.scoreValue, { color: item.color }]}>{item.marks}</Text>
                  <Text style={styles.scoreTotal}>/{activeTest.maxMarks}</Text>
                  <View style={[styles.gradeBadge, { backgroundColor: item.color + '15' }]}>
                    <Text style={[styles.gradeText, { color: item.color }]}>{item.grade}</Text>
                  </View>
                </View>
                <Ionicons name="pencil" size={14} color={Colors.textMuted} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: 36 }} />
      </ScrollView>

      {/* Edit Marks Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Update Test Marks</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalStudentName}>{selectedStudent?.name}</Text>
            <Text style={styles.modalStudentRoll}>{selectedStudent?.roll}</Text>

            <Text style={styles.inputLabel}>
              Marks Scored (Out of {activeTest?.maxMarks || 100})
            </Text>
            <TextInput
              style={styles.marksInput}
              keyboardType="numeric"
              value={editMarksInput}
              onChangeText={setEditMarksInput}
              maxLength={3}
              placeholder="0"
            />

            <TouchableOpacity style={styles.saveMarksBtn} onPress={handleSaveMarks} activeOpacity={0.85}>
              <Text style={styles.saveMarksBtnText}>Save Marks</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create New Test Modal */}
      <Modal visible={createModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.createModalBox}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Schedule New Test</Text>
                <Text style={styles.createModalSub}>Authorized by Super Admin Mr. R Madhusudanan</Text>
              </View>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Class Selector */}
            <Text style={styles.formLabel}>Target Class</Text>
            <View style={styles.selectorRow}>
              {AUTHORIZED_CLASSES.map((cls) => (
                <TouchableOpacity
                  key={cls}
                  style={[styles.smallChip, newClass === cls && styles.smallChipActive]}
                  onPress={() => setNewClass(cls)}
                >
                  <Text style={[styles.smallChipText, newClass === cls && styles.smallChipTextActive]}>
                    {cls}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Subject Selector */}
            <Text style={styles.formLabel}>Subject</Text>
            <View style={styles.selectorRow}>
              {SUBJECTS.map((sub) => (
                <TouchableOpacity
                  key={sub}
                  style={[styles.smallChip, newSubject === sub && styles.smallChipActive]}
                  onPress={() => setNewSubject(sub)}
                >
                  <Text style={[styles.smallChipText, newSubject === sub && styles.smallChipTextActive]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Title Input */}
            <Text style={styles.formLabel}>Test Title</Text>
            <TextInput
              style={styles.textInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="e.g. Test 10: Thermodynamics & Heat"
              placeholderTextColor={Colors.textMuted}
            />

            {/* Date & Time with Interactive DatePicker & Time Chips */}
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>Exam Date</Text>
                <TouchableOpacity
                  style={styles.datePickerBtn}
                  onPress={() => {
                    setDatePickerTarget('examDate');
                    setDatePickerVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar" size={16} color="#0284C7" />
                  <Text style={[styles.datePickerText, !newDate && styles.placeholderText]}>
                    {newDate || 'Select Exam Date'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>Time</Text>
                <TextInput
                  style={styles.textInput}
                  value={newTime}
                  onChangeText={setNewTime}
                  placeholder="04:30 PM - 06:00 PM"
                />
              </View>
            </View>

            {/* Quick Time Selection Chips */}
            <View style={styles.quickTimeRow}>
              {['04:30 PM - 06:00 PM', '06:00 PM - 07:30 PM', '09:30 AM - 12:30 PM', '02:00 PM - 05:00 PM'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.quickTimeChip, newTime === t && styles.quickTimeChipActive]}
                  onPress={() => setNewTime(t)}
                >
                  <Text style={[styles.quickTimeChipText, newTime === t && styles.quickTimeChipTextActive]}>
                    {t.split(' - ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Room & Max Marks */}
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>Room / Hall</Text>
                <TextInput
                  style={styles.textInput}
                  value={newRoom}
                  onChangeText={setNewRoom}
                  placeholder="Room 204"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>Max Marks</Text>
                <TextInput
                  style={styles.textInput}
                  value={newMaxMarks}
                  onChangeText={setNewMaxMarks}
                  keyboardType="numeric"
                  placeholder="100"
                />
              </View>
            </View>

            {/* Syllabus */}
            <Text style={styles.formLabel}>Syllabus Chapters (One per line)</Text>
            <TextInput
              style={[styles.textInput, { height: 75, textAlignVertical: 'top' }]}
              value={newSyllabus}
              onChangeText={setNewSyllabus}
              multiline
              numberOfLines={3}
              placeholder="e.g. Ch 9: Reflection of Light"
              placeholderTextColor={Colors.textMuted}
            />

            {/* Publish Toggle + Show Until Date */}
            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.switchLabel}>Broadcast as Student Alert</Text>
                <Text style={styles.switchSub}>Instantly push to student home screen alert banner</Text>
              </View>
              <Switch
                value={publishAsAlert}
                onValueChange={setPublishAsAlert}
                trackColor={{ false: '#CBD5E1', true: '#BAE6FD' }}
                thumbColor={publishAsAlert ? '#0284C7' : '#f4f3f4'}
              />
            </View>

            {publishAsAlert && (
              <View>
                <Text style={styles.formLabel}>Hide Alert After (Date) — Optional</Text>
                <TouchableOpacity
                  style={styles.datePickerBtn}
                  onPress={() => {
                    setDatePickerTarget('expiryDate');
                    setDatePickerVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={16} color="#0284C7" />
                  <Text style={[styles.datePickerText, !showUntilDate && styles.placeholderText]}>
                    {showUntilDate || 'Select Expiry Date (YYYY-MM-DD)'}
                  </Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 10, color: Colors.textMuted, fontFamily: 'Inter_400Regular', marginTop: 3, marginBottom: 6 }}>
                  Alert will automatically disappear from student home screen after this date.
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.submitTestBtn} onPress={handleCreateTest} activeOpacity={0.85}>
              <Ionicons name="add-circle" size={18} color="#fff" />
              <Text style={styles.submitTestBtnText}>Schedule & Save Test</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* DatePicker Modal for Exam and Expiry Dates */}
      <DatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        title={datePickerTarget === 'examDate' ? 'Select Exam Date' : 'Select Alert Expiry Date'}
        initialDate={new Date()}
        onSelectDate={(displayDate, isoDate) => {
          if (datePickerTarget === 'examDate') {
            setNewDate(displayDate);
            if (!showUntilDate) {
              setShowUntilDate(isoDate);
            }
          } else {
            setShowUntilDate(isoDate);
          }
        }}
      />
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
  logoTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#0284C7', letterSpacing: 0.5 },
  logoSub: { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },

  newTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  newTestBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#fff' },

  adminAuthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 10,
  },
  adminAvatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminAvatarText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  adminAuthInfo: { flex: 1 },
  adminBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adminAuthTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  superBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#0284C7',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  superBadgeText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_700Bold' },
  adminAuthSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },

  prominentScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#0284C7',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 12,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  scheduleIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prominentScheduleTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#0284C7',
    marginBottom: 2,
  },
  prominentScheduleSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 15,
  },

  sectionLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.textMuted, letterSpacing: 0.8, marginBottom: 8 },
  chipsScroll: { marginBottom: 14 },
  classChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  classChipActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
  },
  classChipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  classChipTextActive: { color: '#0284C7' },

  testSelectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  schedulePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  schedulePillText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#0284C7',
  },
  scheduleLink: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#0284C7' },
  testTabsScroll: { marginBottom: 14 },
  testTab: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    minWidth: 100,
  },
  testTabActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  testTabSubject: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: Colors.textMuted },
  testTabSubjectActive: { color: 'rgba(255,255,255,0.85)' },
  testTabTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginVertical: 2 },
  testTabTitleActive: { color: '#fff' },
  testTabDate: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  testTabDateActive: { color: 'rgba(255,255,255,0.8)' },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginTop: 8, marginBottom: 12 },
  emptyAddBtn: { backgroundColor: '#F0F9FF', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  emptyAddText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#0284C7' },

  testCard: {
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
  testCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  testTag: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#0284C7' },
  testTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginVertical: 3 },
  testDate: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginBottom: 2 },
  testMax: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  evalPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  evalText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  metricGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  metricBox: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  metricLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  metricVal: { fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 2 },

  broadcastAlertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  broadcastBtnTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#0284C7' },
  broadcastBtnSub: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 1 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  sectionHint: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  studentsCountBadge: { backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  studentsCountText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },

  markCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rankBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: Colors.textSecondary },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  studentRoll: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 1 },

  scoreWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  scoreValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  scoreTotal: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  gradeBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 },
  gradeText: { fontSize: 11, fontFamily: 'Inter_700Bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  createModalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginVertical: 40, maxWidth: 580, width: '100%', alignSelf: 'center' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  createModalSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  modalStudentName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#0284C7' },
  modalStudentRoll: { fontSize: 12, color: Colors.textSecondary, marginBottom: 14 },
  inputLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 6 },
  marksInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  saveMarksBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveMarksBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },

  formLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 6, marginTop: 8 },
  selectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  smallChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  smallChipActive: { backgroundColor: '#F0F9FF', borderColor: '#0284C7' },
  smallChipText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  smallChipTextActive: { color: '#0284C7' },

  twoCol: { flexDirection: 'row', gap: 10 },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  switchLabel: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  switchSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  submitTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    borderRadius: 12,
    height: 48,
    marginTop: 6,
  },
  submitTestBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },

  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 12,
    height: 42,
  },
  datePickerText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#0284C7',
    flex: 1,
  },
  placeholderText: {
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  quickTimeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
  },
  quickTimeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickTimeChipActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
  },
  quickTimeChipText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  quickTimeChipTextActive: {
    color: '#0284C7',
  },
});
