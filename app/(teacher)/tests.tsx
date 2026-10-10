import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Modal, Image, Switch, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/colors';
import { DataService, AcademicAlert } from '../../lib/dataService';
import { EDUSYNC_STUDENTS } from '../../lib/studentsRoster';
import { getActiveTeacher, hasTeacherSession, subscribeToActiveTeacher, TeacherProfile, getInitials, isStudentEnrolledInSubject } from '../../lib/teacherRoster';
import { supabase } from '../../lib/supabase';
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
  targetSyllabus?: 'Both' | 'State Syllabus' | 'CBSE';
  dateStr: string;
  timeStr: string;
  roomStr: string;
  maxMarks: number;
  syllabus: string[];
  isEvaluated: boolean;
  students: TestStudent[];
  author?: string;
  approvalStatus?: 'pending_approval' | 'approved' | 'rejected';
  rejectionReason?: string;
}

const AUTHORIZED_CLASSES = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
const SUBJECTS: FacultySubject[] = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science'];

export function getEnrolledStudentsForClassAndSubject(classGrade: string, subject: string): TestStudent[] {
  const gradeMatch = classGrade.match(/\b(1[0-2]|[6-9])\b/)?.[1];
  return EDUSYNC_STUDENTS
    .filter((stu) => {
      // 1. Grade match
      if (gradeMatch && !stu.class.includes(gradeMatch)) {
        return false;
      }
      // 2. Allotted subject match
      return isStudentEnrolledInSubject(stu.subjects, subject);
    })
    .map((s, idx) => ({
      id: `stu-${s.rollNo}`,
      name: s.name,
      roll: s.rollNo,
      marks: 0,
      grade: 'Pending',
      color: '#94A3B8',
    }));
}

export default function TeacherTestsScreen() {
  const router = useRouter();
  const [activeTeacher, setActiveTeacher] = useState<TeacherProfile | null>(null);
  const [tests, setTests] = useState<ExamItem[]>([]);
  const [selectedClass, setSelectedClass] = useState('Class 10-A');
  const [activeTestId, setActiveTestId] = useState<string>('');
  const [newSubject, setNewSubject] = useState<FacultySubject>('Physics');

  const getTeacherAssignedSubjects = React.useCallback((teacher: TeacherProfile | null): FacultySubject[] => {
    if (!teacher) return SUBJECTS;
    if (
      teacher.allowedGrades?.includes('*') ||
      (teacher.subject || '').toLowerCase().includes('head') ||
      (teacher.subject || '').toLowerCase().includes('admin') ||
      (teacher.department || '').toLowerCase().includes('admin')
    ) {
      return SUBJECTS;
    }
    const tSub = (teacher.subject || '').toLowerCase();
    const list: FacultySubject[] = [];
    if (tSub.includes('comp') || /\bcs\b/i.test(tSub)) list.push('Computer Science');
    if (tSub.includes('math')) list.push('Mathematics');
    if (tSub.includes('phys')) list.push('Physics');
    if (tSub.includes('chem')) list.push('Chemistry');
    if (tSub.includes('bio')) list.push('Biology');
    return list.length > 0 ? list : SUBJECTS;
  }, []);

  const applyTeacher = React.useCallback((t: TeacherProfile) => {
    setActiveTeacher(t);
    const assigned = getTeacherAssignedSubjects(t);
    if (assigned.length > 0) {
      setNewSubject(assigned[0]);
    }
  }, [getTeacherAssignedSubjects]);

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      const load = async () => {
        const isAuth = await hasTeacherSession();
        if (!isMounted) return;
        if (!isAuth) {
          router.replace('/login');
          return;
        }
        const t = await getActiveTeacher();
        if (isMounted && t) {
          applyTeacher(t);
        }
      };
      load();
      return () => {
        isMounted = false;
      };
    }, [applyTeacher, router])
  );

  useEffect(() => {
    const unsub = subscribeToActiveTeacher((updatedTeacher) => {
      applyTeacher(updatedTeacher);
    });
    return () => unsub();
  }, [applyTeacher]);

  // Realtime Supabase updates
  useEffect(() => {
    const channel = supabase
      .channel('tests_teacher_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teachers' }, async () => {
        const t = await getActiveTeacher();
        applyTeacher(t);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [applyTeacher]);

  // Filter only classes assigned to this active faculty
  const teacherClasses = React.useMemo(() => {
    if (!activeTeacher || !activeTeacher.allowedGrades || activeTeacher.allowedGrades.includes('*')) {
      return AUTHORIZED_CLASSES;
    }
    return AUTHORIZED_CLASSES.filter((cls) => {
      const gradeNum = cls.match(/\b(1[0-2]|[6-9])\b/)?.[1];
      return gradeNum && activeTeacher.allowedGrades.includes(gradeNum);
    });
  }, [activeTeacher]);

  useEffect(() => {
    if (teacherClasses.length > 0 && !teacherClasses.includes(selectedClass)) {
      setSelectedClass(teacherClasses[0]);
    }
  }, [teacherClasses]);

  // Load persisted tests from DataService & synchronize status with Supabase
  useEffect(() => {
    let isMounted = true;
    const syncWithSupabase = async (currentTests: ExamItem[]) => {
      try {
        const { data: remoteAnns } = await supabase
          .from('announcements')
          .select('*')
          .or('title.ilike.%[PENDING APPROVAL]%,title.ilike.%[REJECTED]%,title.ilike.%[Test Alert]%,title.ilike.%[Exam Alert]%')
          .order('created_at', { ascending: false });

        if (!remoteAnns || remoteAnns.length === 0 || !isMounted) return;

        let modified = false;
        const updatedList = currentTests.map((test) => {
          const cleanTestTitle = test.title.replace(/^\[[^\]]+\]\s*/, '').trim().toLowerCase();
          const match = remoteAnns.find((ann: any) => {
            const rawTitle = (ann.title || '').toLowerCase();
            return rawTitle.includes(cleanTestTitle);
          });

          if (!match) return test;

          let status: 'pending_approval' | 'approved' | 'rejected' = 'approved';
          const matchTitle = match.title || '';
          if (matchTitle.includes('[REJECTED]') || match.time_label === 'Rejected') {
            status = 'rejected';
          } else if (matchTitle.includes('[PENDING APPROVAL]') || match.time_label === 'Pending Approval') {
            status = 'pending_approval';
          } else {
            status = 'approved';
          }

          const desc = match.description || '';
          const examDateM = desc.match(/(?:Exam\s*Date|Date)\s*:\s*([^\n\r|]+)/i);
          const timeM = desc.match(/Time:\s*([^\n\r|]+)/i);
          const roomM = desc.match(/(?:Venue|Room):\s*([^\n\r|]+)/i);
          const marksM = desc.match(/(?:Max|Total)\s*Marks:\s*([^\n\r|]+)/i);

          const updatedDateStr = examDateM ? examDateM[1].trim() : test.dateStr;
          const updatedTimeStr = timeM ? timeM[1].trim() : (status === 'approved' && test.timeStr.includes('TBD') ? '11:30 AM - 12:00 PM' : test.timeStr);
          const updatedRoomStr = roomM ? roomM[1].trim() : (status === 'approved' && test.roomStr.includes('TBD') ? 'Exam Hall 1' : test.roomStr);
          const updatedMaxMarks = marksM ? parseInt(marksM[1].trim(), 10) || test.maxMarks : test.maxMarks;

          if (
            test.approvalStatus !== status ||
            test.dateStr !== updatedDateStr ||
            test.timeStr !== updatedTimeStr ||
            test.roomStr !== updatedRoomStr ||
            test.maxMarks !== updatedMaxMarks
          ) {
            modified = true;
            return {
              ...test,
              approvalStatus: status,
              dateStr: updatedDateStr,
              timeStr: updatedTimeStr,
              roomStr: updatedRoomStr,
              maxMarks: updatedMaxMarks,
              rejectionReason: status === 'rejected' ? desc : undefined,
            };
          }
          return test;
        });

        if (modified && isMounted) {
          setTests(updatedList);
          await DataService.setCachedTests(updatedList);
        }
      } catch (err) {
        console.warn('[TeacherTests] Supabase sync error:', err);
      }
    };

    const loadTests = async () => {
      const data = await DataService.getTests();
      if (data && data.length > 0 && isMounted) {
        setTests(data);
        const match = data.find((t: ExamItem) => t.classTag === selectedClass) || data[0];
        if (match) setActiveTestId(match.id);
        await syncWithSupabase(data);
      }
    };
    loadTests();

    // Listen to realtime exam events (approve, reject, edit, delete)
    const channel = supabase
      .channel('teacher_exam_approval_realtime')
      .on('broadcast', { event: 'announcement_rejected' }, (payload: any) => {
        const title = (payload?.payload?.title || '').toLowerCase();
        setTests((prev) =>
          prev.map((t) => {
            if (t.title.toLowerCase().includes(title) || title.includes(t.title.toLowerCase())) {
              return { ...t, approvalStatus: 'rejected' };
            }
            return t;
          })
        );
      })
      .on('broadcast', { event: 'exam_deleted' }, (payload: any) => {
        const title = (payload?.payload?.title || '').toLowerCase();
        setTests((prev) => prev.filter((t) => !t.title.toLowerCase().includes(title) && !title.includes(t.title.toLowerCase())));
      })
      .on('broadcast', { event: 'announcement_deleted' }, (payload: any) => {
        const title = (payload?.payload?.title || '').toLowerCase();
        setTests((prev) => prev.filter((t) => !t.title.toLowerCase().includes(title) && !title.includes(t.title.toLowerCase())));
      })
      .on('broadcast', { event: 'exam_updated' }, (payload: any) => {
        const p = payload?.payload;
        if (!p) return;
        setTests((prev) =>
          prev.map((t) => {
            const cleanT = t.title.toLowerCase();
            const targetT = (p.cleanTitle || p.title || '').toLowerCase();
            if (cleanT.includes(targetT) || targetT.includes(cleanT)) {
              return {
                ...t,
                approvalStatus: 'approved',
                title: p.cleanTitle || t.title,
                dateStr: p.examDate || t.dateStr,
                timeStr: p.timeSlot || t.timeStr,
                roomStr: p.venue || t.roomStr,
                maxMarks: parseInt(p.maxMarks, 10) || t.maxMarks,
              };
            }
            return t;
          })
        );
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
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
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newClass, setNewClass] = useState('Class 10-A');
  const [newDate, setNewDate] = useState('');
  const [newMaxMarks, setNewMaxMarks] = useState('100');
  const [newSyllabus, setNewSyllabus] = useState('');
  const [targetSyllabus, setTargetSyllabus] = useState<'Both' | 'State Syllabus' | 'CBSE'>('Both');
  const [publishAsAlert, setPublishAsAlert] = useState(true);
  const [showUntilDate, setShowUntilDate] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'examDate' | 'expiryDate'>('examDate');

  const openScheduleModal = (targetClass?: string) => {
    setTargetSyllabus('Both');
    const assigned = getTeacherAssignedSubjects(activeTeacher);
    if (assigned.length > 0) {
      setNewSubject(assigned[0]);
    }
    if (targetClass) {
      setNewClass(targetClass);
    } else if (teacherClasses.length > 0 && !teacherClasses.includes(newClass)) {
      setNewClass(teacherClasses[0]);
    }
    setCreateModalVisible(true);
  };

  // Filter tests strictly belonging to this active teacher's subject domain
  const teacherTests = React.useMemo(() => {
    if (!activeTeacher?.subject) return tests;
    const tSub = activeTeacher.subject.toLowerCase();
    return tests.filter((t) => {
      const itemSub = (t.subject || '').toLowerCase();
      if (tSub.includes('comp') || /\bcs\b/i.test(tSub)) return itemSub.includes('comp') || /\bcs\b/i.test(itemSub);
      if (tSub.includes('chem')) return itemSub.includes('chem');
      if (tSub.includes('phys')) return itemSub.includes('phys');
      if (tSub.includes('math')) return itemSub.includes('math');
      if (tSub.includes('bio')) return itemSub.includes('bio');
      return itemSub.includes(tSub);
    });
  }, [tests, activeTeacher]);

  const classTests = React.useMemo(() => {
    return teacherTests.filter((t) => {
      if (!t.classTag) return false;
      if (t.classTag === selectedClass) return true;
      const selNum = selectedClass.match(/\b(1[0-2]|[6-9])\b/)?.[1];
      const tagNum = t.classTag.match(/\b(1[0-2]|[6-9])\b/)?.[1];
      return Boolean(selNum && tagNum && selNum === tagNum);
    });
  }, [teacherTests, selectedClass]);

  const activeTest = React.useMemo(() => {
    return classTests.find((t) => t.id === activeTestId) || classTests[0] || null;
  }, [classTests, activeTestId]);

  // Subject teacher of this discipline or Super Admin can delete test
  const canDeleteTest = React.useMemo(() => {
    if (!activeTest || !activeTeacher) return false;
    // Super Admin / Academic Head can delete
    if (
      activeTeacher.allowedGrades?.includes('*') ||
      (activeTeacher.subject || '').toLowerCase().includes('head') ||
      (activeTeacher.department || '').toLowerCase().includes('admin')
    ) {
      return true;
    }
    // Check subject domain match
    const tSub = (activeTeacher.subject || '').toLowerCase();
    const itemSub = (activeTest.subject || '').toLowerCase();
    const isSubjectMatch =
      (tSub.includes('comp') || /\bcs\b/i.test(tSub)) ? (itemSub.includes('comp') || /\bcs\b/i.test(itemSub)) :
      tSub.includes('chem') ? itemSub.includes('chem') :
      tSub.includes('phys') ? itemSub.includes('phys') :
      tSub.includes('math') ? itemSub.includes('math') :
      tSub.includes('bio') ? itemSub.includes('bio') :
      itemSub.includes(tSub);

    return isSubjectMatch;
  }, [activeTest, activeTeacher]);

  // Ensure evaluation roster strictly contains REAL students enrolled in this class & subject
  const evaluatedStudents = React.useMemo(() => {
    if (!activeTest) return [];
    const genuineRoster = getEnrolledStudentsForClassAndSubject(activeTest.classTag, activeTest.subject);

    return genuineRoster.map((genuine) => {
      const existing = (activeTest.students || []).find(
        (s) => s.roll === genuine.roll || s.id === genuine.id || s.name.toLowerCase() === genuine.name.toLowerCase()
      );
      if (existing && typeof existing.marks === 'number' && existing.marks > 0) {
        return {
          ...genuine,
          marks: existing.marks,
          grade: existing.grade || (existing.marks >= 90 ? 'A+' : existing.marks >= 80 ? 'A' : 'B'),
          color: existing.color || (existing.marks >= 80 ? '#10B981' : '#0284C7'),
        };
      }
      return genuine;
    });
  }, [activeTest]);

  const avgMarks = evaluatedStudents.length
    ? Math.round(evaluatedStudents.reduce((acc, s) => acc + s.marks, 0) / evaluatedStudents.length)
    : 0;
  const highestMarks = evaluatedStudents.length
    ? Math.max(...evaluatedStudents.map((s) => s.marks))
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

    const updatedStudentsList = evaluatedStudents.map((s) =>
      s.id === selectedStudent.id || s.roll === selectedStudent.roll ? { ...s, marks: val, grade, color } : s
    );

    setTests((prev) =>
      prev.map((t) => {
        if (t.id === activeTest.id) {
          return { ...t, students: updatedStudentsList, isEvaluated: true };
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

  const handleDeleteTest = (testItem: ExamItem) => {
    if (!canDeleteTest) {
      Alert.alert(
        'Permission Denied',
        `You are logged in as ${activeTeacher?.name} (${activeTeacher?.subject}). Only the subject teacher who created this test or the Super Admin can delete it.`
      );
      return;
    }
    Alert.alert(
      'Delete Test Paper',
      `Are you sure you want to delete "${testItem.title}"? This will permanently remove the test paper and all evaluation records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Optimistically update React state immediately
            setTests((prev) => prev.filter((t) => t.id !== testItem.id && (!testItem.title || t.title !== testItem.title)));
            if (activeTestId === testItem.id) {
              setActiveTestId('');
            }
            try {
              const updated = await DataService.deleteTest(testItem.id, testItem);
              if (updated && Array.isArray(updated)) {
                setTests(updated);
              }
              Alert.alert('Test Deleted ✓', `"${testItem.title}" has been deleted.`);
            } catch (e) {
              console.warn('[TeacherTests] Delete test warning:', e);
              Alert.alert('Test Deleted ✓', `"${testItem.title}" has been deleted.`);
            }
          },
        },
      ]
    );
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
        'Bring geometry box if required.',
        `Syllabus verified by Academic Head ${activeTeacher?.name || 'Faculty'}.`,
      ],
      updatedBy: `${activeTeacher?.name || 'Faculty'} (${testItem.subject})`,
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
    if (isSubmittingTest) return;

    if (!newTitle.trim()) {
      Alert.alert('Missing Field', 'Please enter a test title.');
      return;
    }

    if (!newDate.trim()) {
      Alert.alert('Date Required', 'Please select the exam date before submitting.');
      return;
    }

    setIsSubmittingTest(true);
    try {
      const syllabusArray = newSyllabus
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const maxVal = parseInt(newMaxMarks, 10) || 100;
      const genuineStudents = getEnrolledStudentsForClassAndSubject(newClass, newSubject);

      const sylPrefix = targetSyllabus !== 'Both' ? `[${targetSyllabus}] ` : '';
      const newTestObj: ExamItem = {
        id: 'test-' + Date.now(),
        title: newTitle.trim(),
        subject: newSubject,
        classTag: newClass,
        targetSyllabus: targetSyllabus,
        dateStr: newDate.trim() || 'Upcoming Session',
        timeStr: 'TBD (Admin will confirm)',
        roomStr: 'TBD (Admin will assign)',
        maxMarks: maxVal,
        syllabus: syllabusArray.length > 0 ? syllabusArray : ['General Syllabus Revision'],
        isEvaluated: false,
        students: genuineStudents,
        author: activeTeacher?.name || 'Faculty Member',
        approvalStatus: 'pending_approval',
      };

      // 1. Save locally so faculty sees their draft test paper in the portal
      setTests((prev) => [newTestObj, ...prev]);
      setActiveTestId(newTestObj.id);
      setSelectedClass(newClass);
      await DataService.saveTest(newTestObj, false);

      // 2. Submit request to Supabase announcements for admin review & approval
      try {
        const insAnnPromise = supabase.from('announcements').insert({
          title: `[${newClass}] ${sylPrefix}[PENDING APPROVAL] ${newTitle.trim()} (${newSubject})`,
          description: `Target Syllabus: ${targetSyllabus}\nExam Date: ${newDate.trim()}\nSubject: ${newSubject}\nMax Marks: ${maxVal}\nSyllabus: ${newTestObj.syllabus.join(', ')}\nSubmitted by: ${activeTeacher?.name || 'Faculty Member'}`,
          icon: 'calendar',
          icon_bg: '#EBF3FF',
          icon_color: '#1A56DB',
          time_label: 'Pending Approval',
          important: true,
        });

        // 2500ms safety timeout so slow/offline networks never freeze the loading spinner
        await Promise.race([
          insAnnPromise,
          new Promise((resolve) => setTimeout(resolve, 2500)),
        ]);
      } catch (err) {
        console.warn('Supabase approval submission notice:', err);
      }

      // 3. Close modal and reset fields
      setCreateModalVisible(false);
      setNewTitle('');
      setNewSyllabus('');
      setNewDate('');
      setShowUntilDate('');

      // 4. Confirmation dialog for the faculty
      Alert.alert(
        'Submitted for Admin Approval ✓',
        `Your test request "${newTestObj.title}" for ${newClass} (${newSubject}) has been submitted to the admin.\n\nOnce approved by the admin, it will be scheduled and broadcast to students.`
      );
    } catch (e: any) {
      console.error('Submission error:', e);
      Alert.alert('Error', e?.message || 'Failed to submit test. Please try again.');
    } finally {
      setIsSubmittingTest(false);
    }
  };

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
          onPress={() => openScheduleModal()}
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
            <Text style={styles.adminAvatarText}>{activeTeacher ? getInitials(activeTeacher.name) : 'AK'}</Text>
          </View>
          <View style={styles.adminAuthInfo}>
            <View style={styles.adminBadgeRow}>
              <Text style={styles.adminAuthTitle}>{activeTeacher?.name || 'Faculty Member'}</Text>
              <View style={[styles.superBadge, { backgroundColor: '#0284C7' }]}>
                <Ionicons name="school" size={10} color="#fff" />
                <Text style={styles.superBadgeText}>FACULTY</Text>
              </View>
            </View>
            <Text style={styles.adminAuthSub}>
              {activeTeacher ? `${activeTeacher.subject} • ${activeTeacher.department}` : 'Academic Head & Super Admin • Auto-sync active'}
            </Text>
          </View>
        </View>

        {/* Prominent Schedule New Test Action Banner */}
        <TouchableOpacity
          style={styles.prominentScheduleBtn}
          onPress={() => openScheduleModal()}
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
          {teacherClasses.map((cls) => {
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
            onPress={() => openScheduleModal()}
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
              onPress={() => openScheduleModal(selectedClass)}
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
                    {t.approvalStatus === 'rejected' ? '❌ ' : t.approvalStatus === 'pending_approval' ? '⏳ ' : '✅ '}{t.title.split(':')[0]}
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
                {activeTest.approvalStatus === 'rejected' && (
                  <View style={{ marginTop: 8, padding: 8, backgroundColor: '#FEF2F2', borderRadius: 8, borderWidth: 1, borderColor: '#FCA5A5' }}>
                    <Text style={{ fontSize: 12, color: '#B91C1C', fontWeight: '600' }}>
                      ⚠️ Rejected by Admin: This exam submission was rejected and is NOT visible to students. You may reschedule or delete this test.
                    </Text>
                  </View>
                )}
                {activeTest.approvalStatus === 'pending_approval' && (
                  <View style={{ marginTop: 8, padding: 8, backgroundColor: '#FFFBEB', borderRadius: 8, borderWidth: 1, borderColor: '#FCD34D' }}>
                    <Text style={{ fontSize: 12, color: '#B45309', fontWeight: '600' }}>
                      ⏳ Submitted for Approval: Admin review pending. This exam will automatically become visible to students once approved.
                    </Text>
                  </View>
                )}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                {/* Approval Status Badge */}
                {activeTest.approvalStatus === 'rejected' ? (
                  <View style={[styles.evalPill, { backgroundColor: '#FEE2E2', borderColor: '#FECACA', borderWidth: 1 }]}>
                    <Text style={[styles.evalText, { color: '#DC2626', fontWeight: '700' }]}>
                      ❌ Rejected by Admin
                    </Text>
                  </View>
                ) : activeTest.approvalStatus === 'pending_approval' ? (
                  <View style={[styles.evalPill, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A', borderWidth: 1 }]}>
                    <Text style={[styles.evalText, { color: '#D97706', fontWeight: '700' }]}>
                      ⏳ Awaiting Approval
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.evalPill, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', borderWidth: 1 }]}>
                    <Text style={[styles.evalText, { color: '#059669', fontWeight: '700' }]}>
                      ✅ Approved & Live
                    </Text>
                  </View>
                )}
                <View style={[styles.evalPill, { backgroundColor: activeTest.isEvaluated ? '#ECFDF3' : '#F1F5F9' }]}>
                  <Text style={[styles.evalText, { color: activeTest.isEvaluated ? Colors.green : '#64748B' }]}>
                    {activeTest.isEvaluated ? 'Evaluated ✓' : 'Pending Evaluation'}
                  </Text>
                </View>
                {canDeleteTest && (
                  <TouchableOpacity
                    style={styles.deleteTestBtn}
                    onPress={() => handleDeleteTest(activeTest)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={13} color="#EF4444" />
                    <Text style={styles.deleteTestBtnText}>Delete Test</Text>
                  </TouchableOpacity>
                )}
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
                  {evaluatedStudents.length}/{evaluatedStudents.length}
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
                <Text style={styles.sectionHint}>
                  {evaluatedStudents.length} Enrolled Student{evaluatedStudents.length !== 1 ? 's' : ''} in {activeTest.classTag} • {activeTest.subject}
                </Text>
              </View>
              <View style={styles.studentsCountBadge}>
                <Text style={styles.studentsCountText}>{evaluatedStudents.length} Students</Text>
              </View>
            </View>

            {evaluatedStudents.length === 0 ? (
              <View style={{ padding: 20, backgroundColor: '#fff', borderRadius: 14, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: Colors.borderLight }}>
                <Ionicons name="people-outline" size={24} color="#94A3B8" style={{ marginBottom: 6 }} />
                <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary }}>
                  No students enrolled in {activeTest.subject} for {activeTest.classTag}
                </Text>
                <Text style={{ fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 }}>
                  Only students with {activeTest.subject} in their cloud subject allotment can be evaluated.
                </Text>
              </View>
            ) : (
              evaluatedStudents.map((item, i) => (
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
              ))
            )}
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
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.createModalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.modalTitle}>Schedule New Test</Text>
                <Text style={styles.createModalSub}>
                  {activeTeacher?.name || 'Faculty Member'} • {activeTeacher?.subject || 'Faculty'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setCreateModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Form Body */}
            <ScrollView
              style={styles.createModalScroll}
              contentContainerStyle={styles.createModalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              {/* Class Selector */}
              <Text style={styles.formLabel}>Target Class</Text>
              <View style={styles.selectorRow}>
                {teacherClasses.map((cls) => (
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

              {/* Target Syllabus Selector */}
              <Text style={styles.formLabel}>Target Syllabus</Text>
              <View style={styles.selectorRow}>
                {(['Both', 'State Syllabus', 'CBSE'] as const).map((syl) => (
                  <TouchableOpacity
                    key={syl}
                    style={[styles.smallChip, targetSyllabus === syl && styles.smallChipActive]}
                    onPress={() => setTargetSyllabus(syl)}
                  >
                    <Text style={[styles.smallChipText, targetSyllabus === syl && styles.smallChipTextActive]}>
                      {syl === 'Both' ? 'Both (State & CBSE)' : syl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Subject Selector */}
              <Text style={styles.formLabel}>Subject (Assigned to {activeTeacher?.name || 'Faculty'})</Text>
              <View style={styles.selectorRow}>
                {getTeacherAssignedSubjects(activeTeacher).map((sub) => (
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
                placeholder="e.g. Unit Test 1: Chapter Evaluation"
                placeholderTextColor={Colors.textMuted}
              />

              {/* Date Only (no Time or Room) */}
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

              {/* Max Marks only */}
              <Text style={styles.formLabel}>Maximum Marks</Text>
              <TextInput
                style={styles.textInput}
                value={newMaxMarks}
                onChangeText={setNewMaxMarks}
                keyboardType="numeric"
                placeholder="100"
              />

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

              {/* Broadcast toggle + info note */}
              <View style={[styles.switchRow, { marginTop: 6, marginBottom: 8 }]}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.switchLabel}>Notify Students on Approval</Text>
                  <Text style={styles.switchSub}>Push to student home screen once admin approves</Text>
                </View>
                <Switch
                  value={publishAsAlert}
                  onValueChange={setPublishAsAlert}
                  trackColor={{ false: '#CBD5E1', true: '#BAE6FD' }}
                  thumbColor={publishAsAlert ? '#0284C7' : '#f4f3f4'}
                />
              </View>

              {/* Admin approval note */}
              <View style={styles.approvalNoteBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Ionicons name="information-circle" size={15} color="#0284C7" />
                  <Text style={{ fontSize: 12, fontFamily: 'Inter_700Bold', color: '#0284C7' }}>
                    Admin Approval Required
                  </Text>
                </View>
                <Text style={{ fontSize: 11, fontFamily: 'Inter_400Regular', color: '#0369A1', lineHeight: 16 }}>
                  Your request will be sent to the admin for review. The admin can edit the test details (time, venue, etc.) before approving. Students will be notified only after admin approval.
                </Text>
              </View>
            </ScrollView>

            {/* Pinned Bottom Submit Button Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.submitTestBtn, isSubmittingTest && { opacity: 0.7 }]}
                onPress={handleCreateTest}
                disabled={isSubmittingTest}
                activeOpacity={0.85}
              >
                {isSubmittingTest ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#fff" />
                    <Text style={styles.submitTestBtnText}>Submit for Admin Approval</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  deleteTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  deleteTestBtnText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#EF4444',
  },

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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  createModalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  createModalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginVertical: 40, maxWidth: 580, width: '100%', alignSelf: 'center' },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalCloseBtn: {
    padding: 4,
    borderRadius: 8,
  },
  createModalScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  createModalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  approvalNoteBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#fff',
  },
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
    borderRadius: 14,
    height: 48,
    width: '100%',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
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
