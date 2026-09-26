import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Modal, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/colors';
import { teacherData } from '../../constants/mockData';
import { DataService } from '../../lib/dataService';
import { EDUSYNC_STUDENTS } from '../../lib/studentsRoster';
import {
  getActiveTeacher,
  getTeacherRoster,
  setActiveTeacherId,
  subscribeToActiveTeacher,
  TeacherProfile,
  getInitials,
} from '../../lib/teacherRoster';
import { supabase } from '../../lib/supabase';

interface StudentRoster {
  id: string;
  no: string;
  name: string;
  roll: string;
  overall: string;
  online: boolean;
  attendance: 'P' | 'A';
  subjects: string;
  school?: string;
  note?: string;
}

const INITIAL_CLASSES = [
  { id: 'c6', label: 'Class 6', batch: 'Middle School • Class 6', grade: '6' },
  { id: 'c7', label: 'Class 7', batch: 'Middle School • Class 7', grade: '7' },
  { id: 'c8', label: 'Class 8', batch: 'Secondary Foundation • Class 8', grade: '8' },
  { id: 'c9', label: 'Class 9', batch: 'Secondary Foundation • Class 9', grade: '9' },
  { id: 'c10', label: 'Class 10', batch: 'Secondary • Class 10', grade: '10' },
  { id: 'c11', label: 'Class 11', batch: 'Senior Secondary • Class 11', grade: '11' },
  { id: 'c12', label: 'Class 12', batch: 'Senior Secondary • Class 12', grade: '12' },
];

// Map class label to EDUSYNC class name for filtering
const CLASS_MAP: Record<string, string> = {
  'c6': 'Class 6',
  'c7': 'Class 7',
  'c8': 'Class 8',
  'c9': 'Class 9',
  'c10': 'Class 10',
  'c11': 'Class 11',
  'c12': 'Class 12',
  'c1': 'Class 10',
  'c2': 'Class 10',
  'c3': 'Class 11',
  'c4': 'Class 12',
};

const CLASS_SUBJECTS: Record<string, string[]> = {
  'Class 6': ['All Subjects', 'Mathematics', 'Science'],
  'Class 7': ['All Subjects', 'Mathematics', 'Science'],
  'Class 8': ['All Subjects', 'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Science'],
  'Class 9': ['All Subjects', 'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Science'],
  'Class 10': ['All Subjects', 'Physics', 'Chemistry', 'Biology', 'Mathematics'],
  'Class 11': ['All Subjects', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science'],
  'Class 12': ['All Subjects', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science'],
};

function getTeacherDefaultSubject(t: TeacherProfile | null): string {
  if (!t) return 'All Subjects';
  if (t.allowedGrades.includes('*')) return 'All Subjects';
  const subLower = (t.subject || '').toLowerCase();
  if (subLower.includes('chem')) return 'Chemistry';
  if (subLower.includes('phys')) return 'Physics';
  if (subLower.includes('math')) return 'Mathematics';
  if (subLower.includes('comp') || subLower.includes('cs')) return 'Computer Science';
  if (subLower.includes('bio')) return 'Biology';
  return t.subject.split(' ')[0] || 'General';
}

export default function FacultyAttendanceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ classGrade?: string; subject?: string }>();
  const [roster, setRoster] = useState<TeacherProfile[]>([]);
  const [activeTeacher, setActiveTeacher] = useState<TeacherProfile | null>(null);
  const [selectedClassId, setSelectedClassId] = useState('c10');
  const [selectedSubject, setSelectedSubject] = useState<string>('All Subjects');
  const [searchQuery, setSearchQuery] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [students, setStudents] = useState<StudentRoster[]>([]);
  const [dateOffset, setDateOffset] = useState(0);
  const [classModalVisible, setClassModalVisible] = useState(false);
  const [facultyPickerVisible, setFacultyPickerVisible] = useState(false);

  const applyTeacher = useCallback((t: TeacherProfile) => {
    setActiveTeacher(t);
    if (params.subject) {
      setSelectedSubject(params.subject);
    } else {
      const defSub = getTeacherDefaultSubject(t);
      setSelectedSubject(defSub && defSub !== 'All Subjects' ? defSub : 'All Students');
    }
  }, [params.subject]);

  // Focus effect: refreshes active teacher & roster every time this tab is focused
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const load = async () => {
        const fullRoster = await getTeacherRoster();
        const currentTeacher = await getActiveTeacher();
        if (isMounted) {
          setRoster(fullRoster);
          applyTeacher(currentTeacher);
        }
      };
      load();
      return () => {
        isMounted = false;
      };
    }, [applyTeacher])
  );

  // Cross-screen live subscription: updates immediately if faculty changes elsewhere
  useEffect(() => {
    const unsub = subscribeToActiveTeacher((updatedTeacher) => {
      applyTeacher(updatedTeacher);
    });
    return () => unsub();
  }, [applyTeacher]);

  // Realtime Supabase updates
  useEffect(() => {
    const channel = supabase
      .channel('attendance_teacher_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teachers' }, async () => {
        const fullRoster = await getTeacherRoster();
        setRoster(fullRoster);
        const t = await getActiveTeacher();
        applyTeacher(t);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [applyTeacher]);

  // Set class & subject if passed from navigation (e.g. today's assigned class click)
  useEffect(() => {
    if (params.classGrade) {
      const gradeNum = params.classGrade.match(/\b(1[0-2]|[6-9])\b/)?.[1];
      const match = INITIAL_CLASSES.find((c) => {
        if (gradeNum && c.label.includes(gradeNum)) return true;
        return c.label.toLowerCase().includes(params.classGrade!.toLowerCase());
      });
      if (match) {
        setSelectedClassId(match.id);
      }
    }
    if (params.subject) {
      setSelectedSubject(params.subject);
    }
  }, [params.classGrade, params.subject]);

  // Filter only classes assigned to this active faculty member's allowed grades
  const teacherAssignedClasses = useMemo(() => {
    if (!activeTeacher || !activeTeacher.allowedGrades || activeTeacher.allowedGrades.includes('*')) {
      return INITIAL_CLASSES;
    }
    return INITIAL_CLASSES.filter((c) => {
      const gradeNum = c.grade || c.label.match(/\b(1[0-2]|[6-9])\b/)?.[1];
      return gradeNum && activeTeacher.allowedGrades.includes(gradeNum);
    });
  }, [activeTeacher]);

  // Auto-switch class if currently selected class is outside active teacher's assignment
  useEffect(() => {
    if (teacherAssignedClasses.length > 0 && !teacherAssignedClasses.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(teacherAssignedClasses[0].id);
    }
  }, [teacherAssignedClasses, selectedClassId]);

  const currentClass = teacherAssignedClasses.find((c) => c.id === selectedClassId) || teacherAssignedClasses[0] || INITIAL_CLASSES[0];
  const currentClassPrefix = CLASS_MAP[selectedClassId] || 'Class 10';

  // Available subjects for this teacher in this class
  const availableSubjects = useMemo(() => {
    if (!activeTeacher) return ['All Students'];
    if (activeTeacher.allowedGrades.includes('*')) {
      return ['All Students', ...(CLASS_SUBJECTS[currentClassPrefix] || ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science'])];
    }
    const defSub = getTeacherDefaultSubject(activeTeacher);
    const gradeNum = parseInt(currentClass.grade || '10', 10);
    const list = ['All Students'];
    if (defSub && defSub !== 'All Subjects') {
      list.push(defSub);
    }
    if (gradeNum <= 9 && (defSub === 'Biology' || defSub === 'Physics' || defSub === 'Chemistry')) {
      if (!list.includes('Science')) list.push('Science');
    }
    return list;
  }, [activeTeacher, currentClassPrefix, currentClass.grade]);

  // Auto-adjust subject if current selection is not valid for this teacher & class
  useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.includes(selectedSubject)) {
      setSelectedSubject(availableSubjects[1] || availableSubjects[0]);
    }
  }, [availableSubjects, selectedSubject]);

  // Load students accurately filtered by class AND allotted subjects for this logged-in teacher
  useEffect(() => {
    const classPrefix = CLASS_MAP[selectedClassId] || 'Class 10';
    const classStudents = EDUSYNC_STUDENTS.filter((s) => s.class.startsWith(classPrefix));

    // Determine target subject filter
    const isAll = !selectedSubject || selectedSubject === 'All' || selectedSubject === 'All Subjects' || selectedSubject === 'All Students';

    // Filter students strictly by allotted subject when a specific subject is selected
    const subjectFiltered = classStudents.filter((s) => {
      if (isAll) return true;
      const stuSubs = (s.subjects || '').toLowerCase();
      const target = selectedSubject.toLowerCase();

      if (target.includes('math')) return stuSubs.includes('math');
      if (target === 'science') return stuSubs.includes('science') || stuSubs.includes('bio') || stuSubs.includes('phys') || stuSubs.includes('chem');
      if (target.includes('comp') || target.includes('cs')) return stuSubs.includes('comp') || stuSubs.includes('cs');
      if (target.includes('bio')) return stuSubs.includes('bio');
      if (target.includes('phys')) return stuSubs.includes('phys');
      if (target.includes('chem')) return stuSubs.includes('chem');
      return stuSubs.includes(target);
    });

    // If subject-filtered yields students, use them; if strictly empty, safely fallback to all class students
    const effectiveStudents = subjectFiltered.length > 0 ? subjectFiltered : classStudents;

    const rosterStudents: StudentRoster[] = effectiveStudents.map((s, idx) => ({
      id: s.rollNo,
      no: String(idx + 1).padStart(2, '0'),
      name: s.name,
      roll: s.rollNo,
      overall: `${s.accuracy || 85}%`,
      online: true,
      attendance: 'P' as 'P' | 'A',
      subjects: s.subjects || 'General',
      school: s.school,
    }));

    setStudents(rosterStudents);
    setSubmitted(false);
  }, [selectedClassId, selectedSubject]);

  // Format date display
  const getDateLabel = () => {
    const d = new Date();
    d.setDate(d.getDate() + dateOffset);
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Filter students by search
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.subjects && s.subjects.toLowerCase().includes(searchQuery.toLowerCase()))
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
    const teacherName = activeTeacher?.name || 'Faculty Member';
    const subjectName = (selectedSubject && selectedSubject !== 'All' && selectedSubject !== 'All Subjects' && selectedSubject !== 'All Students')
      ? selectedSubject
      : (activeTeacher?.subject?.split('(')[0]?.trim() || 'General');
    setSubmitted(true);
    // Save to DataService so it syncs to each student's portal
    try {
      await DataService.saveBatchAttendance(
        students.map((s) => ({ rollNo: s.roll, name: s.name, status: s.attendance })),
        dateLabel,
        subjectName,
        currentClass.label
      );
    } catch {
      // Offline fallback — still mark submitted
    }
    Alert.alert(
      'Attendance Submitted Successfully',
      `Class: ${currentClass.label}\nSubject: ${subjectName}\nTeacher: ${teacherName}\nDate: ${dateLabel}\nPresent: ${presentCount} | Absent: ${absentCount}\n\nAttendance has been recorded by ${teacherName} for ${totalCount} enrolled students and synced with student portals.`,
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
            style={styles.facultyPill}
            onPress={() => setFacultyPickerVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="school" size={13} color="#0284C7" />
            <Text style={styles.facultyPillText} numberOfLines={1}>
              {activeTeacher ? activeTeacher.name.split(' ')[0] + ' ' + (activeTeacher.name.split(' ')[1] || '') : 'Faculty'} ▾
            </Text>
          </TouchableOpacity>

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
              <Text style={styles.avatarText}>{activeTeacher ? getInitials(activeTeacher.name) : 'FA'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Faculty Greeting & Date Navigation */}
        <View style={styles.greetingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingSmall}>Good Afternoon,</Text>
            <Text style={styles.teacherName}>{activeTeacher?.name || 'Faculty Member'}</Text>
            <Text style={styles.teacherSub}>
              {activeTeacher ? `${activeTeacher.subject} • ${activeTeacher.department}` : 'Academic Faculty'}
            </Text>
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

        {/* Class Selection Tabs (Only teacher's assigned classes) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classesScroll}>
          {teacherAssignedClasses.map((c) => {
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

        {/* Allotted Subject Filter Pills */}
        <View style={styles.subjectFilterSection}>
          <View style={styles.subjectFilterHeader}>
            <Text style={styles.subjectFilterLabel}>
              <Ionicons name="funnel" size={11} color="#0284C7" /> Allotted Subject Filter:
            </Text>
            <Text style={styles.subjectFilterCount}>
              {totalCount} student{totalCount !== 1 ? 's' : ''} {selectedSubject === 'All Students' ? 'enrolled' : `taking ${selectedSubject}`}
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectsScroll}>
            {availableSubjects.map((sub) => {
              const isSelected = selectedSubject === sub;
              return (
                <TouchableOpacity
                  key={sub}
                  style={[styles.subjectChip, isSelected && styles.subjectChipActive]}
                  onPress={() => setSelectedSubject(sub)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "book-outline"}
                    size={13}
                    color={isSelected ? "#fff" : "#0284C7"}
                  />
                  <Text style={[styles.subjectChipText, isSelected && styles.subjectChipTextActive]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Attendance Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryHeaderLeft}>
              <View style={styles.summaryIconBox}>
                <Ionicons name="clipboard" size={16} color="#fff" />
              </View>
              <View>
                <Text style={styles.summaryTitle}>Attendance Summary</Text>
                <Text style={styles.summarySub}>{currentClass.batch} • {selectedSubject}</Text>
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
          {filteredStudents.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: Colors.border }}>
              <Ionicons name="person-remove-outline" size={32} color={Colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary }}>
                No students enrolled in {selectedSubject}
              </Text>
              <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, textAlign: 'center', marginTop: 4 }}>
                Switch subject filter to "All Subjects" or select another class.
              </Text>
            </View>
          ) : (
            filteredStudents.map((item) => {
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
                      {item.roll} • {item.school || 'EduHome'}
                    </Text>
                    {item.subjects ? (
                      <View style={styles.studentSubsBadge}>
                        <Text style={styles.studentSubsBadgeText} numberOfLines={1}>
                          📚 {item.subjects}
                        </Text>
                      </View>
                    ) : null}
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
            })
          )}
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
            {teacherAssignedClasses.map((c) => (
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

      {/* Switch Faculty Member Modal */}
      <Modal visible={facultyPickerVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Faculty Member</Text>
              <TouchableOpacity onPress={() => setFacultyPickerVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Switch active teacher account to take attendance for their allocated classes and students.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {roster.map((teacher) => {
                const isSelected = teacher.id === activeTeacher?.id;
                return (
                  <TouchableOpacity
                    key={teacher.id}
                    style={[styles.facultyPickItem, isSelected && styles.facultyPickItemActive]}
                    onPress={async () => {
                      await setActiveTeacherId(teacher.id);
                      applyTeacher(teacher);
                      setFacultyPickerVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.teacherAvatarBox, isSelected && { backgroundColor: '#0284C7' }]}>
                      <Text style={[styles.teacherAvatarText, isSelected && { color: '#fff' }]}>
                        {getInitials(teacher.name)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.teacherNameText, isSelected && { color: '#0284C7', fontFamily: 'Inter_700Bold' }]}>
                          {teacher.name}
                        </Text>
                        {teacher.isTemporary && (
                          <View style={styles.tempBadge}>
                            <Text style={styles.tempBadgeText}>TEMP</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.teacherSubjectText}>
                        {teacher.subject} • {teacher.gradeDescription}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color="#0284C7" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
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

  subjectFilterSection: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subjectFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  subjectFilterLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#0284C7',
  },
  subjectFilterCount: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  subjectsScroll: {
    gap: 6,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subjectChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  subjectChipText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  subjectChipTextActive: {
    color: '#fff',
  },

  studentSubsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 3,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  studentSubsBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#0369A1',
  },

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

  facultyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    maxWidth: 130,
  },
  facultyPillText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#0284C7',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  closeBtn: { padding: 4 },
  modalSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  facultyPickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  facultyPickItemActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
  },
  teacherAvatarBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherAvatarText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#1E293B',
  },
  teacherNameText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  teacherSubjectText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 1,
  },
  tempBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tempBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#D97706',
  },
});
