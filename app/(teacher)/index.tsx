import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Modal, TextInput, Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/colors';
import { DataService, compareClassTimes, resolveClassTargetSyllabus } from '../../lib/dataService';
import { EDUSYNC_STUDENTS } from '../../lib/studentsRoster';
import { supabase } from '../../lib/supabase';
import {
  TEACHER_ROSTER,
  TeacherProfile,
  getActiveTeacher,
  setActiveTeacherId,
  subscribeToActiveTeacher,
  getTeacherRoster,
  isTeacherAssignedToClass,
  isStudentEnrolledInSubject,
} from '../../lib/teacherRoster';

export interface TeacherSessionInfo {
  type: 'Regular' | 'QuestionBank' | 'TP';
  label: 'Regular Class' | 'Question Bank' | 'Test Paper';
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  border: string;
  color: string;
}

export function getTeacherSessionType(cls: any): TeacherSessionInfo {
  const normStatus = (cls?.status || '').toLowerCase();
  const normTime = (cls?.time || '').toLowerCase();
  const normSub = (cls?.subject || '').toLowerCase();
  const rawType = (cls?.session_type || cls?.sessionType || cls?.type || cls?.class_type || '').toLowerCase();
  const normTopic = (cls?.topic || '').toLowerCase();
  const normRoom = (cls?.room || '').toLowerCase();

  // 1. Test Paper / TP Session (Check first so explicit TP/Test Paper overrides take precedence)
  if (
    rawType === 'tp' ||
    rawType === 'test paper' ||
    rawType.includes('test') ||
    rawType.includes('tp') ||
    normStatus.split(':').includes('tp') ||
    normStatus.split(':').includes('test') ||
    normStatus.includes(':tp') ||
    normStatus.includes(':test') ||
    normStatus.includes('test_paper') ||
    normStatus.includes('testpaper') ||
    normTime.includes('• tp') ||
    normTime.includes('test paper') ||
    normTime.includes('tp session') ||
    normSub.includes('(tp)') ||
    normSub.includes('[tp]') ||
    normTopic.includes('test paper') ||
    normTopic.includes('(tp)') ||
    normRoom.includes('test paper')
  ) {
    return {
      type: 'TP',
      label: 'Test Paper',
      icon: 'document-text-outline',
      bg: '#FEF2F2',
      border: '#FECACA',
      color: '#DC2626',
    };
  }

  // 2. Question Bank
  if (
    rawType === 'questionbank' ||
    rawType === 'question bank' ||
    rawType.includes('question') ||
    rawType.includes('qb') ||
    normStatus.split(':').includes('questionbank') ||
    normStatus.split(':').includes('qb') ||
    normStatus.includes(':qb') ||
    normStatus.includes(':questionbank') ||
    normStatus.includes('question_bank') ||
    normTime.includes('• qb') ||
    normTime.includes('question bank') ||
    normTime.includes('questionbank') ||
    normSub.includes('(qb)') ||
    normSub.includes('[qb]') ||
    normTopic.includes('question bank') ||
    normTopic.includes('(qb)') ||
    normRoom.includes('question bank')
  ) {
    return {
      type: 'QuestionBank',
      label: 'Question Bank',
      icon: 'library-outline',
      bg: '#F5F3FF',
      border: '#DDD6FE',
      color: '#7C3AED',
    };
  }

  // 3. Regular Class (default)
  return {
    type: 'Regular',
    label: 'Regular Class',
    icon: 'school-outline',
    bg: '#F0F9FF',
    border: '#BAE6FD',
    color: '#0284C7',
  };
}

function formatUpdatedSession(
  currentClass: any,
  newType: 'Regular' | 'QuestionBank' | 'TP',
  teacher: TeacherProfile,
  newSyllabus?: 'Both' | 'State Syllabus' | 'CBSE'
) {
  const typeTag = newType === 'TP' ? 'Test Paper' : newType === 'QuestionBank' ? 'Question Bank' : 'Regular Class';

  const rawTime = currentClass.time || '';
  const timeTokens = rawTime.split('•').map((s: string) => s.trim()).filter(Boolean);
  const baseSlot = timeTokens[0] || '';

  const effectiveSyllabus = newSyllabus || resolveClassTargetSyllabus(currentClass);

  const teacherName = teacher?.name || '';
  const facultyToken = timeTokens.find((tok: string) => {
    const l = tok.toLowerCase();
    if (l === 'test paper' || l === 'tp' || l === 'question bank' || l === 'qb' || l === 'regular' || l === 'cbse' || l === 'state' || l === 'state syllabus') return false;
    return (
      l.includes('mr.') ||
      l.includes('ms.') ||
      l.includes('mrs.') ||
      l.includes('dr.') ||
      (teacherName && l.includes(teacherName.toLowerCase()))
    );
  }) || (teacherName ? teacherName : undefined);

  const newTimeParts: string[] = [baseSlot];
  if (effectiveSyllabus === 'CBSE') {
    newTimeParts.push('CBSE');
  } else if (effectiveSyllabus === 'State Syllabus') {
    newTimeParts.push('State Syllabus');
  }

  if (newType !== 'Regular') {
    newTimeParts.push(typeTag);
  }
  if (facultyToken) {
    newTimeParts.push(facultyToken);
  }
  const newTime = newTimeParts.join(' • ');

  const rawStatus = currentClass.status || 'upcoming';
  const statusParts = rawStatus.split(':').map((s: string) => s.trim()).filter(Boolean);
  const facId = statusParts.find((p: string) => p.startsWith('fac-')) || teacher?.id || 'fac-math';

  const sylPart = effectiveSyllabus === 'CBSE' ? 'CBSE' : effectiveSyllabus === 'State Syllabus' ? 'State' : '';
  const typePart = newType === 'Regular' ? '' : newType;

  const newStatus = ['upcoming', sylPart, typePart, facId].filter(Boolean).join(':');

  return { newTime, newStatus, typeTag, effectiveSyllabus };
}

export default function TeacherHomeScreen() {
  const router = useRouter();
  const [activeTeacher, setActiveTeacher] = useState<TeacherProfile>(TEACHER_ROSTER[0]);
  const [roster, setRoster] = useState<TeacherProfile[]>(TEACHER_ROSTER);
  const [facultyPickerVisible, setFacultyPickerVisible] = useState(false);
  const [adminClasses, setAdminClasses] = useState<any[]>(() => {
    return DataService.getCachedAdminTimetableClasses() || [];
  });
  const [loadingClasses, setLoadingClasses] = useState<boolean>(() => {
    const initial = DataService.getCachedAdminTimetableClasses();
    return !initial || initial.length === 0;
  });
  const [refreshing, setRefreshing] = useState(false);
  const [liveStudents, setLiveStudents] = useState<typeof EDUSYNC_STUDENTS>(EDUSYNC_STUDENTS);

  // Safety fallback: guarantee loadingClasses never stays true indefinitely
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingClasses(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // After 7 PM (19:00), default to tomorrow's schedule automatically when admin schedules next day classes
  const initialOffset = React.useMemo(() => (new Date().getHours() >= 19 ? 1 : 0), []);
  const [dateOffset, setDateOffset] = useState(initialOffset);

  const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcementClasses, setAnnouncementClasses] = useState<string[]>(['All Assigned']);
  const [rosterClassFilter, setRosterClassFilter] = useState('All');
  const [rosterSubjectFilter, setRosterSubjectFilter] = useState('All');

  // Session Format Switching workflow (Regular Class / Question Bank / Test Paper)
  const [sessionTypeModalVisible, setSessionTypeModalVisible] = useState(false);
  const [selectedClassForSessionType, setSelectedClassForSessionType] = useState<any>(null);
  const [editSessionSyllabus, setEditSessionSyllabus] = useState<'Both' | 'State Syllabus' | 'CBSE'>('Both');

  // Schedule New Class Session modal state
  const [scheduleClassModalVisible, setScheduleClassModalVisible] = useState(false);
  const [schedClassGrade, setSchedClassGrade] = useState('Class 10');
  const [schedSyllabus, setSchedSyllabus] = useState<'Both' | 'State Syllabus' | 'CBSE'>('Both');
  const [schedSubject, setSchedSubject] = useState('');
  const [schedStartTime, setSchedStartTime] = useState('04:00 PM');
  const [schedEndTime, setSchedEndTime] = useState('05:30 PM');
  const [schedSessionType, setSchedSessionType] = useState('Regular Class');
  const [isSavingSchedClass, setIsSavingSchedClass] = useState(false);

  // Teacher Opinions per Student workflow
  const [opinionModalVisible, setOpinionModalVisible] = useState(false);
  const [selectedStudentForOpinion, setSelectedStudentForOpinion] = useState<any>(null);
  const [opinionSubject, setOpinionSubject] = useState<string>('Mathematics');
  const [opinionRemark, setOpinionRemark] = useState('');
  const [opinionRating, setOpinionRating] = useState('Outstanding');
  const [pendingOpinions, setPendingOpinions] = useState<any[]>([]);

  const [announcements, setAnnouncements] = useState<any[]>([]);

  const loadActiveFaculty = async () => {
    const list = await getTeacherRoster();
    setRoster([...list]);
    const teacher = await getActiveTeacher();
    setActiveTeacher({ ...teacher });
  };

  const loadTimetable = async () => {
    // Only show loading placeholder if no classes are loaded in state
    if (adminClasses.length === 0) {
      setLoadingClasses(true);
    }
    try {
      const cls = await DataService.getAdminTimetableClasses();
      if (cls && Array.isArray(cls)) {
        setAdminClasses(cls);
      }
    } catch (e) {
      console.warn('Error fetching timetable classes:', e);
    } finally {
      setLoadingClasses(false);
    }
  };

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
      } else {
        setAnnouncements([]);
      }
    } catch {
      setAnnouncements([]);
    }
  };

  const loadPendingOpinions = async () => {
    try {
      const list = await DataService.getPendingTeacherOpinions();
      setPendingOpinions(list || []);
    } catch {}
  };

  const fetchLiveStudents = useCallback(async () => {
    try {
      const [{ data, error }, { data: attData }] = await Promise.all([
        supabase.from('students').select('*').order('created_at', { ascending: true }),
        supabase.from('attendance_records').select('roll_no, today_subjects'),
      ]);

      if (!error && Array.isArray(data) && data.length > 0) {
        const attMap = new Map<string, string[]>();
        if (Array.isArray(attData)) {
          attData.forEach((a: any) => {
            if (!a.roll_no || !Array.isArray(a.today_subjects) || a.today_subjects.length === 0) return;
            const subjects: string[] = [];
            let hasObjectEntries = false;
            a.today_subjects.forEach((entry: any) => {
              if (typeof entry === 'string' && entry.trim()) {
                subjects.push(entry.trim());
              } else if (entry && typeof entry === 'object') {
                hasObjectEntries = true;
              }
            });
            if (subjects.length > 0 && !hasObjectEntries) {
              attMap.set(a.roll_no.toUpperCase(), Array.from(new Set(subjects)));
            }
          });
        }

        const supabaseMap = new Map<string, any>();
        data.forEach((d: any) => {
          supabaseMap.set((d.roll_no || '').toUpperCase(), d);
        });

        const merged = EDUSYNC_STUDENTS.map((s) => {
          const remote = supabaseMap.get(s.rollNo.toUpperCase());
          const attSubjects = attMap.get(s.rollNo.toUpperCase());
          if (!remote) {
            if (attSubjects && attSubjects.length > 0) {
              return { ...s, subjects: attSubjects.join(', ') };
            }
            return s;
          }
          return {
            ...s,
            name: remote.name || s.name,
            class: remote.class_name || s.class,
            batch: remote.batch || remote.class_name || s.batch,
            phone: remote.phone || s.phone,
            school: remote.school || s.school,
            subjects: (attSubjects && attSubjects.length > 0)
              ? attSubjects.join(', ')
              : (remote.subjects
                  ? (Array.isArray(remote.subjects) ? remote.subjects.join(', ') : remote.subjects)
                  : s.subjects),
            accuracy: remote.accuracy ?? s.accuracy,
            streak: remote.streak ?? s.streak,
            testsCompleted: remote.tests_completed ?? s.testsCompleted,
            topPercent: remote.top_percent ?? s.topPercent,
            pin: remote.pin || s.pin,
          };
        });

        data.forEach((d: any) => {
          const roll = (d.roll_no || '').toUpperCase();
          const exists = EDUSYNC_STUDENTS.some((s) => s.rollNo.toUpperCase() === roll);
          if (!exists) {
            const attSubjects = attMap.get(roll);
            merged.push({
              rollNo: d.roll_no || '',
              pin: d.pin || '1234',
              name: d.name || '',
              class: d.class_name || 'Class 10',
              batch: d.batch || d.class_name || 'Class 10',
              avatar: (d.name || 'ST').slice(0, 2).toUpperCase(),
              phone: d.phone || '',
              school: d.school || 'EduHome',
              streak: d.streak ?? 0,
              accuracy: d.accuracy ?? 0,
              testsCompleted: d.tests_completed ?? 0,
              topPercent: d.top_percent ?? 0,
              recentScore: `${d.accuracy ?? 0}%`,
              avatarColor: '#0284C7',
              monthlyFee: 0,
              currentDue: 0,
              dueDate: '',
              daysLeft: 0,
              joiningDate: '',
              joiningDateIso: '',
              monthsPaidOnTime: 0,
              subjects: (attSubjects && attSubjects.length > 0)
                ? attSubjects.join(', ')
                : (d.subjects
                    ? (Array.isArray(d.subjects) ? d.subjects.join(', ') : d.subjects)
                    : 'General'),
            } as any);
          }
        });

        setLiveStudents(merged as any);
      }
    } catch (e) {
      console.warn('[TeacherHomeScreen] Could not fetch live students:', e);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadActiveFaculty(),
        loadTimetable(),
        loadAnnouncements(),
        loadPendingOpinions(),
        fetchLiveStudents(),
      ]);
    } catch (e) {
      console.warn('[TeacherHomeScreen] Refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [fetchLiveStudents]);

  useFocusEffect(
    useCallback(() => {
      loadActiveFaculty();
      loadTimetable();
      loadAnnouncements();
      loadPendingOpinions();
      fetchLiveStudents();
    }, [fetchLiveStudents])
  );

  useEffect(() => {
    loadActiveFaculty();
    loadAnnouncements();
    loadPendingOpinions();
    loadTimetable();
    fetchLiveStudents();

    const unsub = subscribeToActiveTeacher((updated) => {
      setActiveTeacher({ ...updated });
    });

    // Supabase Realtime: updates instantly when admin broadcasts from PC or edits classes
    const classChannel = supabase
      .channel('teacher_classes_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, () => {
        console.log('[Realtime] Classes timetable updated from Supabase!');
        loadTimetable();
      })
      .subscribe();

    const channel = supabase
      .channel('teacher_announcements_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        console.log('[Realtime] Teacher announcements updated from Supabase!');
        loadAnnouncements();
      })
      .subscribe();

    const teacherChannel = supabase
      .channel('teacher_faculty_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teachers' }, () => {
        console.log('[Realtime] Faculty updated from cloud in teacher home!');
        loadActiveFaculty();
      })
      .subscribe();

    const studentChannel = supabase
      .channel('teacher_students_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        console.log('[Realtime] Students updated from cloud in teacher home!');
        fetchLiveStudents();
      })
      .subscribe();

    return () => {
      unsub();
      supabase.removeChannel(classChannel);
      supabase.removeChannel(channel);
      supabase.removeChannel(teacherChannel);
      supabase.removeChannel(studentChannel);
    };
  }, [fetchLiveStudents]);

  const getInitials = (name: string) => {
    return name
      .replace(/Dr\.|Mr\.|Mrs\.|Ms\./g, '')
      .trim()
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Target date calculation for day toggle & 7 PM auto-switch to tomorrow
  const targetDateInfo = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dateOffset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return {
      iso: `${y}-${m}-${day}`,
      label: d.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }),
      fullDate: d.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      isTomorrow: dateOffset === 1,
      isToday: dateOffset === 0,
      isSunday: d.getDay() === 0,
    };
  }, [dateOffset]);

  // Filter admin timetable for this active teacher's subject & grades, matching target date (today or tomorrow)
  const assignedClasses = React.useMemo(() => {
    const seen = new Set<string>();
    const result: any[] = [];
    const reversed = [...adminClasses].reverse();
    for (const c of reversed) {
      if (c.published === false) continue;
      // Date guard: match target date (or today fallback if no class_date provided)
      const matchesDate = c.class_date ? (c.class_date === targetDateInfo.iso) : (dateOffset === 0);
      if (!matchesDate) continue;
      if (!isTeacherAssignedToClass(activeTeacher, c)) continue;

      const normSubject = (c.subject || '').trim().toLowerCase();
      const normGrade = (c.class_grade || c.roll_no || '').trim().toLowerCase();
      const normTime = (c.time || '').trim().toLowerCase();
      const key = `${normGrade}_${normSubject}_${normTime}_${targetDateInfo.iso}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(c);
      }
    }
    return result.sort((a, b) => compareClassTimes(a.time, b.time));
  }, [adminClasses, activeTeacher, targetDateInfo.iso, dateOffset]);
  const assignedTodayClasses = assignedClasses;

  const getTeacherOpinionSubjects = (teacher: TeacherProfile): string[] => {
    if (!teacher) return ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];
    if (
      teacher.allowedGrades?.includes('*') ||
      (teacher.subject || '').toLowerCase().includes('head') ||
      (teacher.department || '').toLowerCase().includes('administration')
    ) {
      return ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];
    }
    const list: string[] = [];
    const s = (teacher.subject || '').toLowerCase();
    if (s.includes('math')) list.push('Mathematics');
    if (s.includes('phys')) list.push('Physics');
    if (s.includes('chem')) list.push('Chemistry');
    if (s.includes('bio')) list.push('Biology');
    if (s.includes('comp') || /\bcs\b/i.test(s)) list.push('Computer Science');
    return list.length > 0 ? list : [teacher.subject.split('(')[0].trim() || 'General'];
  };

  const isStudentMatchingSubject = (stu: any, subjectFilter: string) => {
    return isStudentEnrolledInSubject(stu?.subjects, subjectFilter);
  };

  const teacherAssignedGrades = React.useMemo(() => {
    if (!activeTeacher || !activeTeacher.allowedGrades || activeTeacher.allowedGrades.includes('*')) {
      return ['All Classes', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
    }
    const grades = activeTeacher.allowedGrades.map((g) => `Class ${g}`);
    return ['All Assigned', ...grades];
  }, [activeTeacher]);

  const handlePostAnnouncement = async () => {
    if (!announcementTitle.trim()) {
      Alert.alert('Error', 'Please enter an announcement title.');
      return;
    }

    const classesStr = announcementClasses.includes('All Classes') || announcementClasses.includes('All Assigned')
      ? (activeTeacher.allowedGrades?.includes('*') ? 'All Classes' : activeTeacher.allowedGrades.map((g) => `Class ${g}`).join(', '))
      : announcementClasses.join(', ');

    try {
      await DataService.addAnnouncement({
        title: announcementTitle.trim(),
        desc: announcementMsg.trim() || 'No additional details provided.',
        author: `${activeTeacher.name} (${activeTeacher.subject})`,
        targetClasses: classesStr,
        tag: 'Faculty Broadcast',
        important: true,
        pendingApproval: true,
      });

      setAnnouncementTitle('');
      setAnnouncementMsg('');
      setAnnouncementClasses(['All Assigned']);
      setAnnouncementModalVisible(false);

      Alert.alert(
        'Submitted for Admin Approval ✓',
        `Your announcement for ${classesStr} has been submitted. It is now awaiting approval by the Admin in Master Hub before broadcasting to student devices.`
      );
    } catch {
      Alert.alert('Error', 'Failed to submit announcement.');
    }
  };

  const handleOpenScheduleClass = () => {
    setSchedSubject(activeTeacher.subject || 'Physics');
    setSchedClassGrade(activeTeacher.allowedGrades?.[0] && activeTeacher.allowedGrades[0] !== '*' ? `Class ${activeTeacher.allowedGrades[0]}` : 'Class 10');
    setSchedSyllabus('Both');
    setSchedSessionType('Regular Class');
    setSchedStartTime('04:00 PM');
    setSchedEndTime('05:30 PM');
    setScheduleClassModalVisible(true);
  };

  const handleSaveScheduledClass = async () => {
    if (!schedClassGrade || !schedSubject || !schedStartTime || !schedEndTime) {
      Alert.alert('Missing Details', 'Please fill in Class, Subject, Start Time and End Time.');
      return;
    }
    setIsSavingSchedClass(true);
    try {
      const targetDate = targetDateInfo.iso;
      await DataService.scheduleTeacherClassSession({
        classGrade: schedClassGrade,
        subject: schedSubject,
        classDate: targetDate,
        startTime: schedStartTime,
        endTime: schedEndTime,
        sessionType: schedSessionType,
        targetSyllabus: schedSyllabus,
        facultyId: activeTeacher.id,
        facultyName: activeTeacher.name,
      });

      setScheduleClassModalVisible(false);
      Alert.alert(
        'Session Scheduled ✓',
        `${schedClassGrade} (${schedSyllabus}) ${schedSubject} has been successfully scheduled for ${targetDateInfo.label}.`
      );
      loadTimetable();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to schedule session. Please try again.');
    } finally {
      setIsSavingSchedClass(false);
    }
  };

  const handleUpdateSessionType = async (newType: 'Regular' | 'QuestionBank' | 'TP') => {
    if (!selectedClassForSessionType) return;
    const targetClass = selectedClassForSessionType;
    setSessionTypeModalVisible(false);

    const { newTime, newStatus, typeTag } = formatUpdatedSession(targetClass, newType, activeTeacher, editSessionSyllabus);

    // Optimistically update adminClasses state immediately
    setAdminClasses((prev) =>
      prev.map((cls) => {
        if (cls.id === targetClass.id) {
          return {
            ...cls,
            status: newStatus,
            time: newTime,
            session_type: typeTag,
          };
        }
        return cls;
      })
    );

    // Sync to Supabase classes table
    try {
      const { error } = await supabase
        .from('classes')
        .update({
          status: newStatus,
          time: newTime,
        })
        .eq('id', targetClass.id);

      if (error) {
        console.warn('[TeacherHomeScreen] Error updating session type in Supabase:', error);
      } else {
        console.log('[TeacherHomeScreen] Updated session format to:', typeTag);
      }
    } catch (err) {
      console.warn('[TeacherHomeScreen] Failed to sync session format:', err);
    }
  };

  const handleOpenOpinionModal = (student: any) => {
    setSelectedStudentForOpinion(student);
    setOpinionRemark('');
    setOpinionRating('Outstanding');
    const teacherSubs = getTeacherOpinionSubjects(activeTeacher);
    setOpinionSubject(teacherSubs[0] || 'Mathematics');
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
        teacher: activeTeacher.name || 'Faculty Member',
        subject: opinionSubject,
        remark: `[${opinionRating}] ${opinionRemark.trim()}`,
      });
      setOpinionModalVisible(false);
      await loadPendingOpinions();
      Alert.alert(
        'Submitted for Main Admin Review ✓',
        `Your remark for ${selectedStudentForOpinion.name} in ${opinionSubject} has been routed to Main Admin (Mr. Abhai Kumar). Once approved, it will automatically appear in the student's carousel!`
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
            style={styles.facultyPill}
            onPress={() => setFacultyPickerVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="school" size={13} color="#0284C7" />
            <Text style={styles.facultyPillText}>{activeTeacher.subject.split(' ')[0]} ▾</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={onRefresh}
            disabled={refreshing}
            activeOpacity={0.7}
            accessibilityLabel="Refresh faculty dashboard"
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#0284C7" />
            ) : (
              <Ionicons name="refresh" size={16} color="#0284C7" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => Alert.alert('Faculty Notifications', 'All class notes and attendance are synchronized with admin timetable.')}
          >
            <Ionicons name="notifications" size={20} color={Colors.primary} />
            <View style={styles.bellDot} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(teacher)/profile')}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitials(activeTeacher.name)}</Text>
            </View>
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
        {/* Welcome Banner */}
        <View style={styles.welcomeCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingSmall}>Welcome back,</Text>
            <Text style={styles.teacherName}>{activeTeacher.name}</Text>
            <Text style={styles.roleBadgeText}>{activeTeacher.subject} • {activeTeacher.gradeDescription}</Text>
            <Text style={styles.dateText}>📅 {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</Text>
          </View>
          <TouchableOpacity
            style={styles.adminBadge}
            onPress={() => setFacultyPickerVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="school" size={20} color="#0284C7" />
            <Text style={styles.adminBadgeTitle}>Staff ID</Text>
            <Text style={styles.adminBadgeSub}>{activeTeacher.id.replace('fac-', '').toUpperCase()}</Text>
          </TouchableOpacity>
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

                {/* Teaching Schedule Header with Day Toggle & Schedule Class */}
        <View style={styles.scheduleHeaderContainer}>
          <View style={styles.scheduleTopRow}>
            <View style={{ flex: 1, paddingRight: 6 }}>
              <Text style={styles.sectionTitle} numberOfLines={1}>
                {dateOffset === 1
                  ? "Tomorrow's Classes"
                  : "Today's Classes"}
              </Text>
              <View style={styles.scheduleSubRow}>
                <Text style={styles.scheduleSubDate}>
                  {targetDateInfo.label} • {assignedClasses.length > 0 ? `${assignedClasses.length} Session${assignedClasses.length > 1 ? 's' : ''}` : 'None'}
                </Text>
                {new Date().getHours() >= 19 && dateOffset === 1 && (
                  <View style={styles.autoTomorrowBadge}>
                    <Ionicons name="moon" size={9} color="#1D4ED8" />
                    <Text style={styles.autoTomorrowBadgeText}>7 PM+ Auto</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Day Toggle Switch */}
            <View style={styles.daySwitchContainer}>
              <TouchableOpacity
                style={[styles.daySwitchBtn, dateOffset === 0 && styles.daySwitchBtnActive]}
                onPress={() => setDateOffset(0)}
                activeOpacity={0.8}
              >
                <Text style={[styles.daySwitchBtnText, dateOffset === 0 && styles.daySwitchBtnTextActive]}>
                  Today
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.daySwitchBtn, dateOffset === 1 && styles.daySwitchBtnActive]}
                onPress={() => setDateOffset(1)}
                activeOpacity={0.8}
              >
                <Text style={[styles.daySwitchBtnText, dateOffset === 1 && styles.daySwitchBtnTextActive]}>
                  Tomorrow
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Schedule Class Action Bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 8 }}>
            <TouchableOpacity
              style={styles.scheduleClassBtn}
              onPress={handleOpenScheduleClass}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={15} color="#ffffff" />
              <Text style={styles.scheduleClassBtnText}>Schedule Class</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loadingClasses && assignedClasses.length === 0 ? (
          <View style={styles.emptySessionBox}>
            <ActivityIndicator size="small" color="#0284C7" />
            <Text style={styles.emptySessionSub}>
              Loading {dateOffset === 1 ? "tomorrow's" : "today's"} assigned sessions...
            </Text>
          </View>
        ) : assignedClasses.length === 0 ? (
          <View style={styles.emptySessionBox}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name={targetDateInfo.isSunday ? 'sunny-outline' : 'calendar-outline'}
                size={24}
                color="#94A3B8"
              />
            </View>
            <Text style={styles.emptySessionTitle}>
              {targetDateInfo.isSunday
                ? 'Sunday — Tuition Holiday'
                : dateOffset === 1
                ? 'No sessions scheduled for tomorrow'
                : 'No sessions scheduled today'}
            </Text>
            <Text style={styles.emptySessionSub}>
              None / No classes currently assigned for {activeTeacher.name} ({activeTeacher.subject}) in {dateOffset === 1 ? "tomorrow's" : "today's"} admin timetable.
            </Text>
            {dateOffset === 1 && (
              <TouchableOpacity
                style={styles.switchDateHintBtn}
                onPress={() => setDateOffset(0)}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={13} color="#0284C7" />
                <Text style={styles.switchDateHintText}>View Today's Classes</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          assignedClasses.map((c) => {
            const classTitle = c.class_grade || c.roll_no || 'Assigned Class';
            const subjectTitle = c.subject || activeTeacher.subject;
            const sessionInfo = getTeacherSessionType(c);
            return (
              <TouchableOpacity
                key={c.id}
                style={styles.classCard}
                activeOpacity={0.88}
                onPress={() =>
                  router.push({
                    pathname: '/(teacher)/attendance',
                    params: {
                      classGrade: classTitle,
                      subject: subjectTitle,
                      classId: c.id || '',
                      timeSlot: (c.time || '').split('•')[0].trim(),
                      sessionType: sessionInfo.label,
                      classDate: c.class_date || targetDateInfo.iso,
                      dateOffset: String(dateOffset),
                    },
                  })
                }
              >
                <View style={[styles.classColorBar, { backgroundColor: sessionInfo.color }]} />
                <View style={styles.classCardBody}>
                  <View style={styles.classCardTop}>
                    <View style={styles.classBadgeWrap}>
                      <Text style={[styles.classBadgeName, { color: sessionInfo.color }]}>{classTitle}</Text>
                      <Text style={styles.subjectDot}>•</Text>
                      <Text style={styles.subjectText}>{subjectTitle}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.sessionTypePill,
                        { backgroundColor: sessionInfo.bg, borderColor: sessionInfo.border },
                      ]}
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedClassForSessionType(c);
                        setSessionTypeModalVisible(true);
                      }}
                    >
                      <Ionicons name={sessionInfo.icon} size={11} color={sessionInfo.color} />
                      <Text style={[styles.sessionTypeText, { color: sessionInfo.color }]}>
                        {sessionInfo.label}
                      </Text>
                      <Ionicons name="chevron-down" size={10} color={sessionInfo.color} style={{ marginLeft: 1, opacity: 0.8 }} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.topicText}>
                    {c.topic || (
                      sessionInfo.type === 'TP'
                        ? `${subjectTitle} Test Paper Session`
                        : sessionInfo.type === 'QuestionBank'
                        ? `${subjectTitle} Question Bank Discussion`
                        : `${subjectTitle} Scheduled Session`
                    )}
                  </Text>

                  <View style={styles.classCardFooter}>
                    <View style={styles.timeWrap}>
                      <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
                      <Text style={styles.timeText}>
                        {(c.time || (dateOffset === 1 ? 'Tomorrow' : 'Today')).split('•')[0].trim()}
                      </Text>
                      {dateOffset === 1 && (
                        <View style={styles.tomorrowCardTag}>
                          <Text style={styles.tomorrowCardTagText}>Tomorrow</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.markAttendanceLink}>
                      <Text style={styles.markAttendanceLinkText}>Attendance &gt;</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

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
              <Text style={styles.viewRosterText}>Take Attendance &gt;</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.batchEmptyBox}>
            <Ionicons name="clipboard-outline" size={24} color="#94A3B8" />
            <Text style={styles.batchEmptyTitle}>No sessions recorded yet</Text>
            <Text style={styles.batchEmptySub}>
              Batch attendance percentages will update live once attendance registers are submitted for today's batches.
            </Text>
          </View>
        </View>

        {/* Student Academic Opinions & Faculty Remarks Workflow */}
        {(() => {
          // Strictly filter students assigned to this active teacher's subject & grades
          const teacherAllottedStudents = liveStudents.filter((stu) => {
            // Grade check
            if (activeTeacher?.allowedGrades && !activeTeacher.allowedGrades.includes('*')) {
              const gradeNum = (stu.class || '').match(/\b(1[0-2]|[6-9])\b/)?.[1];
              if (gradeNum && !activeTeacher.allowedGrades.includes(gradeNum)) {
                return false;
              }
            }
            // Subject check: Student MUST be taking the subject this faculty teaches
            return isStudentMatchingSubject(stu, activeTeacher.subject);
          });

          // Secondary class filter
          const filteredRosterStudents = teacherAllottedStudents.filter((stu) => {
            if (rosterClassFilter !== 'All' && !(stu.class || '').toLowerCase().includes(rosterClassFilter.toLowerCase())) {
              return false;
            }
            return true;
          });

          return (
            <>
              <View style={[styles.sectionHeader, { marginTop: 16 }]}>
                <View>
                  <Text style={styles.sectionTitle}>Student Roster & Faculty Remarks</Text>
                  <Text style={styles.sectionSubHint}>
                    {filteredRosterStudents.length} Students Allotted to {activeTeacher.name} ({activeTeacher.subject}) {rosterClassFilter !== 'All' ? `• ${rosterClassFilter}` : ''}
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

              {filteredRosterStudents.length === 0 ? (
                <View style={{ padding: 20, backgroundColor: '#fff', borderRadius: 14, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: Colors.borderLight }}>
                  <Ionicons name="people-outline" size={28} color="#94A3B8" style={{ marginBottom: 6 }} />
                  <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary }}>
                    No students allotted for {activeTeacher.subject}
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2, textAlign: 'center' }}>
                    Only students with {activeTeacher.subject} in their cloud subject allotment appear in this faculty list.
                  </Text>
                </View>
              ) : (
                filteredRosterStudents.map((stu, idx) => {
                  const avatarText = stu.avatar || (stu.name ? stu.name.trim().slice(0, 2).toUpperCase() : 'ST');
                  return (
                    <View key={stu.rollNo ? `${stu.rollNo}_${idx}` : `stu-${idx}`} style={styles.studentCard}>
                      <View style={[styles.studentAvatarBox, { backgroundColor: stu.avatarColor || '#0284C7' }]}>
                        <Text style={styles.studentAvatarText}>{avatarText}</Text>
                      </View>
                      <View style={styles.studentInfoWrap}>
                        <View style={styles.studentNameRow}>
                          <Text style={styles.studentNameText}>{stu.name || 'Student'}</Text>
                          <View style={styles.syncBadge}>
                            <Ionicons name="sync-circle" size={11} color="#0284C7" />
                            <Text style={styles.syncBadgeText}>Main Admin Synced</Text>
                          </View>
                        </View>
                        <Text style={styles.studentClassText}>
                          {stu.class || 'Class 12'} • Roll No: {stu.rollNo || '-'}
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
                          <Text style={styles.scoreVal}>{stu.recentScore || '90%'}</Text>
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
                  );
                })
              )}
            </>
          );
        })()}

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
              Monitored by Mr. Abhai Kumar. Once approved, the opinion is automatically pushed to the student's dashboard carousel.
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

        {announcements.length === 0 ? (
          <View style={{ padding: 22, backgroundColor: '#fff', borderRadius: 14, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: Colors.borderLight }}>
            <Ionicons name="notifications-outline" size={28} color="#94A3B8" style={{ marginBottom: 6 }} />
            <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary }}>
              No Active Broadcasts
            </Text>
            <Text style={{ fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 3, textAlign: 'center' }}>
              Factual broadcast announcements from the Admin portal or faculty broadcasts will appear here live.
            </Text>
          </View>
        ) : (
          announcements.map((a) => (
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
          ))
        )}

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
              Select the classes you teach. Announcements require Admin approval in Master Hub before reaching student dashboards.
            </Text>

            {/* Target Classes Selector */}
            <Text style={styles.inputLabel}>Target Class(es) Allotted to You</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {teacherAssignedGrades.map((cls) => {
                const isSelected = announcementClasses.includes(cls);
                return (
                  <TouchableOpacity
                    key={cls}
                    style={[
                      styles.opinionSubChip,
                      isSelected && styles.opinionSubChipActive,
                      { marginRight: 8, paddingHorizontal: 12, paddingVertical: 6 },
                    ]}
                    onPress={() => {
                      if (cls === 'All Classes' || cls === 'All Assigned') {
                        setAnnouncementClasses([cls]);
                      } else {
                        const filtered = announcementClasses.filter((c) => c !== 'All Classes' && c !== 'All Assigned');
                        if (isSelected) {
                          const next = filtered.filter((c) => c !== cls);
                          setAnnouncementClasses(next.length > 0 ? next : [teacherAssignedGrades[0]]);
                        } else {
                          setAnnouncementClasses([...filtered, cls]);
                        }
                      }
                    }}
                  >
                    <Text style={[styles.opinionSubChipText, isSelected && styles.opinionSubChipTextActive]}>
                      {cls}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.inputLabel}>Announcement Title</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Extra Revision Class & Doubts Clearing"
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

            <View style={[styles.opinionDisclaimerBox, { marginBottom: 16 }]}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#0284C7" />
              <Text style={styles.opinionDisclaimerText}>
                Submitted announcements are queued for Master Hub Admin approval to ensure quality before live push.
              </Text>
            </View>

            <TouchableOpacity style={styles.publishBtn} onPress={handlePostAnnouncement} activeOpacity={0.85}>
              <Ionicons name="paper-plane" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.publishBtnText}>Submit for Admin Approval</Text>
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

            <Text style={styles.inputLabel}>Select Subject (Assigned to {activeTeacher.name})</Text>
            <View style={styles.opinionSubjectRow}>
              {getTeacherOpinionSubjects(activeTeacher).map((sub) => (
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
                Remarks are monitored and verified by Main Admin (Mr. Abhai Kumar) before being delivered to the student dashboard.
              </Text>
            </View>

            <TouchableOpacity style={styles.publishBtn} onPress={handleSubmitOpinion} activeOpacity={0.85}>
              <Ionicons name="paper-plane" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.publishBtnText}>Submit for Admin Approval</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Switch Faculty Member Modal */}
      <Modal visible={facultyPickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Faculty Member</Text>
              <TouchableOpacity onPress={() => setFacultyPickerVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Switch active teacher account to view assigned schedule and batches.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {roster.map((teacher) => {
                const isSelected = teacher.id === activeTeacher.id;
                return (
                  <TouchableOpacity
                    key={teacher.id}
                    style={[styles.facultyPickItem, isSelected && styles.facultyPickItemActive]}
                    onPress={async () => {
                      await setActiveTeacherId(teacher.id);
                      setActiveTeacher({ ...teacher });
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

      {/* Select Session Format Modal */}
      <Modal visible={sessionTypeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Session Format</Text>
                {selectedClassForSessionType && (
                  <Text style={styles.modalSub}>
                    {selectedClassForSessionType.class_grade || selectedClassForSessionType.roll_no} • {selectedClassForSessionType.subject || activeTeacher.subject} ({(selectedClassForSessionType.time || '').split('•')[0].trim()})
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setSessionTypeModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 10 }}>
              {[
                {
                  type: 'Regular' as const,
                  title: 'Regular Class',
                  desc: 'Standard curriculum lecture, theory & concept explanation',
                  icon: 'school-outline' as const,
                  color: '#0284C7',
                  bg: '#F0F9FF',
                  border: '#BAE6FD',
                },
                {
                  type: 'QuestionBank' as const,
                  title: 'Question Bank',
                  desc: 'PYQ problem solving, exemplar drills & doubt clearing',
                  icon: 'library-outline' as const,
                  color: '#7C3AED',
                  bg: '#F5F3FF',
                  border: '#DDD6FE',
                },
                {
                  type: 'TP' as const,
                  title: 'Test Paper',
                  desc: 'Timed evaluation, unit test, mock or chapter paper',
                  icon: 'document-text-outline' as const,
                  color: '#DC2626',
                  bg: '#FEF2F2',
                  border: '#FECACA',
                },
              ].map((opt) => {
                const isSelected = selectedClassForSessionType
                  ? getTeacherSessionType(selectedClassForSessionType).type === opt.type
                  : false;

                return (
                  <TouchableOpacity
                    key={opt.type}
                    style={[
                      styles.sessionTypeOption,
                      isSelected && [styles.sessionTypeOptionActive, { borderColor: opt.color, backgroundColor: opt.bg }],
                    ]}
                    onPress={() => handleUpdateSessionType(opt.type)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.sessionTypeIconBox, { backgroundColor: isSelected ? opt.color : opt.bg }]}>
                      <Ionicons name={opt.icon} size={20} color={isSelected ? '#fff' : opt.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sessionTypeOptionTitle, isSelected && { color: opt.color }]}>
                        {opt.title}
                      </Text>
                      <Text style={styles.sessionTypeOptionDesc}>{opt.desc}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={opt.color} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.opinionDisclaimerBox, { marginTop: 12, marginBottom: 4 }]}>
              <Ionicons name="sync-outline" size={14} color="#0284C7" />
              <Text style={styles.opinionDisclaimerText}>
                Selecting a format updates the timetable live across all faculty and student portals.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
      {/* Schedule Class Session Modal */}
      <Modal visible={scheduleClassModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '90%' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Schedule Class Session</Text>
                <Text style={styles.modalSub}>
                  {activeTeacher.name} • {activeTeacher.subject}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setScheduleClassModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 10 }}>
              {/* Target Class */}
              <Text style={styles.modalFieldLabel}>Target Class</Text>
              <View style={styles.chipRow}>
                {['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map((cls) => (
                  <TouchableOpacity
                    key={cls}
                    style={[styles.modalSelectChip, schedClassGrade === cls && styles.modalSelectChipActive]}
                    onPress={() => setSchedClassGrade(cls)}
                  >
                    <Text style={[styles.modalSelectChipText, schedClassGrade === cls && styles.modalSelectChipTextActive]}>
                      {cls}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Target Syllabus */}
              <Text style={styles.modalFieldLabel}>Target Syllabus</Text>
              <View style={styles.chipRow}>
                {(['Both', 'State Syllabus', 'CBSE'] as const).map((syl) => (
                  <TouchableOpacity
                    key={syl}
                    style={[styles.modalSelectChip, schedSyllabus === syl && styles.modalSelectChipActive]}
                    onPress={() => setSchedSyllabus(syl)}
                  >
                    <Text style={[styles.modalSelectChipText, schedSyllabus === syl && styles.modalSelectChipTextActive]}>
                      {syl === 'Both' ? 'Both (State & CBSE)' : syl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Session Format */}
              <Text style={styles.modalFieldLabel}>Session Format</Text>
              <View style={styles.chipRow}>
                {['Regular Class', 'Question Bank', 'Test Paper'].map((fmt) => (
                  <TouchableOpacity
                    key={fmt}
                    style={[styles.modalSelectChip, schedSessionType === fmt && styles.modalSelectChipActive]}
                    onPress={() => setSchedSessionType(fmt)}
                  >
                    <Text style={[styles.modalSelectChipText, schedSessionType === fmt && styles.modalSelectChipTextActive]}>
                      {fmt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Subject */}
              <Text style={styles.modalFieldLabel}>Subject</Text>
              <TextInput
                style={styles.modalInput}
                value={schedSubject}
                onChangeText={setSchedSubject}
                placeholder="e.g. Mathematics"
                placeholderTextColor={Colors.textMuted}
              />

              {/* Time Slots */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalFieldLabel}>Start Time</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={schedStartTime}
                    onChangeText={setSchedStartTime}
                    placeholder="e.g. 04:00 PM"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalFieldLabel}>End Time</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={schedEndTime}
                    onChangeText={setSchedEndTime}
                    placeholder="e.g. 05:30 PM"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>

              <View style={[styles.opinionDisclaimerBox, { marginTop: 12, marginBottom: 12 }]}>
                <Ionicons name="information-circle-outline" size={15} color="#0284C7" />
                <Text style={styles.opinionDisclaimerText}>
                  Scheduled for {targetDateInfo.label}. Students enrolled in {schedSyllabus === 'Both' ? 'State or CBSE syllabus' : schedSyllabus} will see this in their timetable.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, isSavingSchedClass && { opacity: 0.7 }]}
                onPress={handleSaveScheduledClass}
                disabled={isSavingSchedClass}
                activeOpacity={0.8}
              >
                {isSavingSchedClass ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Confirm & Schedule Session</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
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
  facultyPill: {
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
  facultyPillText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#0284C7' },
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

  scheduleHeaderContainer: {
    marginBottom: 12,
  },
  scheduleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  scheduleSubDate: {
    fontSize: 11.5,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  autoTomorrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  autoTomorrowBadgeText: {
    fontSize: 9.5,
    fontFamily: 'Inter_700Bold',
    color: '#1D4ED8',
  },
  daySwitchContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexShrink: 0,
    marginLeft: 4,
  },
  daySwitchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  daySwitchBtnActive: {
    backgroundColor: '#0284C7',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  daySwitchBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#64748B',
  },
  daySwitchBtnTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  tomorrowCardTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginLeft: 4,
  },
  tomorrowCardTagText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#1D4ED8',
  },
  switchDateHintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  switchDateHintText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#0284C7',
  },

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
  sessionTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sessionTypeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.1,
  },
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
  sessionTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 8,
    gap: 12,
    backgroundColor: '#fff',
  },
  sessionTypeOptionActive: {
    borderWidth: 1.5,
  },
  sessionTypeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionTypeOptionTitle: {
    fontSize: 13.5,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  sessionTypeOptionDesc: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  topicText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 8 },
  classCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
  },
  timeText: { fontSize: 11.5, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  markAttendanceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  markAttendanceLinkText: { fontSize: 11.5, fontFamily: 'Inter_700Bold', color: '#0284C7' },

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
    marginBottom: 10,
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

  batchEmptyBox: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  batchEmptyTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    marginTop: 6,
    marginBottom: 4,
  },
  batchEmptySub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
  },

  emptySessionBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptySessionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptySessionSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },

  facultyPickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
  },
  facultyPickItemActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  teacherAvatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherAvatarText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#475569',
  },
  teacherNameText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  teacherSubjectText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tempBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  tempBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#D97706',
  },

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
  scheduleClassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  scheduleClassBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  syllabusBadgePill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    marginLeft: 4,
  },
  cbseBadgePill: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  stateBadgePill: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  bothBadgePill: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  syllabusBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
  },
  cbseBadgeText: {
    color: '#0369A1',
  },
  stateBadgeText: {
    color: '#15803D',
  },
  bothBadgeText: {
    color: '#64748B',
  },
  modalFieldLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  modalSelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: '#F8FAFC',
  },
  modalSelectChipActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  modalSelectChipText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  modalSelectChipTextActive: {
    color: '#0284C7',
    fontFamily: 'Inter_600SemiBold',
  },
  modalSubmitBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});