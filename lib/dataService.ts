import { supabase } from './supabase';
import { AppStorage } from './storage';
import {
  studentData as mockStudent,
  attendanceData as mockAttendance,
  feesData as mockFees,
  studyMaterials as mockMaterials,
} from '../constants/mockData';
import { EDUSYNC_STUDENTS, EDUSYNC_FEES } from './studentsRoster';

const CURRENT_STUDENT_KEY = 'eduhome_current_student';
const CACHE_PREFIX = 'eduhome_cache_';

// 2.5s network timeout to guarantee ultra-fast response & offline fallback
function withTimeout<T>(promise: PromiseLike<T>, ms = 2500): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Network timeout')), ms);
    promise.then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

// In-memory instant cache for zero-delay screen rendering
const memoryCache: Record<string, any> = {};

async function getCached<T>(key: string): Promise<T | null> {
  if (memoryCache[key]) return memoryCache[key];
  try {
    const val = await AppStorage.getItem(CACHE_PREFIX + key);
    if (val) {
      const parsed = JSON.parse(val);
      memoryCache[key] = parsed;
      return parsed;
    }
  } catch {}
  return null;
}

async function setCached(key: string, data: any) {
  memoryCache[key] = data;
  try {
    await AppStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
  } catch {}
}

export interface StudentProfile {
  id?: string;
  rollNo: string;
  name: string;
  class: string;
  batch: string;
  avatar: string;
  photoUrl?: string;
  phone?: string;
  email?: string;
  goals?: string;
  streak: number;
  accuracy: number;
  testsCompleted: number;
  topPercent: number;
}

export interface AcademicAlert {
  id: string;
  type?: 'test_paper' | 'top_scorer' | 'special_notice';
  badge: string;
  title: string;
  shortDesc?: string;
  date: string;
  time: string;
  room: string;
  maxMarks: number;
  negativeMarking?: string;
  syllabus: string[];
  instructions?: string[];
  updatedBy: string;
  updatedAt?: string;
  expiryDate?: string; // ISO date string; hide alert after this date
  classTag?: string;
}

/**
 * Checks whether an announcement, notice, or test alert is targeted to a specific student class.
 * - If no studentClass is specified, or studentClass is 'All', returns true.
 * - If the notice is explicitly for "All", "All Classes", or "All Students", returns true.
 * - If the notice targets one or more specific classes (e.g. "[Class 10]", "Class 11", "[Exam Alert - Class 12]"),
 *   it returns true ONLY if the student's class matches one of the targeted classes.
 * - If no specific class is mentioned anywhere in the title, description, or tag, it's general (returns true).
 */
export function isTargetedToClass(
  item: {
    title?: string;
    desc?: string;
    description?: string;
    shortDesc?: string;
    target?: string;
    classTag?: string;
    class_grade?: string;
    class_tag?: string;
  } | null | undefined,
  studentClass?: string
): boolean {
  if (!item) return false;
  if (!studentClass || studentClass === 'All' || studentClass === 'All Classes') {
    return true;
  }

  // Extract student's grade number (e.g. "Class 11" -> "11", "Class 10" -> "10", "12" -> "12")
  const studentMatch = studentClass.match(/\b(?:class|grade)?\s*(\d{1,2})\b/i);
  const studentGrade = studentMatch ? studentMatch[1] : null;

  // 1. Direct field match if available
  const itemClassDirect = item.classTag || item.class_grade || item.class_tag || item.target;
  if (itemClassDirect) {
    const directTrim = itemClassDirect.trim();
    if (/^all\b/i.test(directTrim) || /all\s+classes/i.test(directTrim) || /all\s+students/i.test(directTrim)) {
      return true;
    }
    const directMatch = directTrim.match(/\b(?:class|grade)?\s*(\d{1,2})\b/i);
    if (directMatch && studentGrade) {
      return directMatch[1] === studentGrade;
    }
  }

  // 2. Check title and description for explicit target indicators
  const title = item.title || '';
  const desc = item.desc || item.description || item.shortDesc || '';
  const fullText = `${title} ${desc}`;

  // If marked for All Classes / All Students
  if (
    /\[\s*all\s*(?:classes|students)?\s*\]/i.test(title) ||
    /\b(?:all\s+classes|all\s+students)\b/i.test(title)
  ) {
    return true;
  }

  // Look for bracketed or prefixed class markers e.g. [Class 10], [Exam Alert - Class 10], [PENDING APPROVAL - Class 10]
  const classMatches = [...fullText.matchAll(/\b(?:class|grade)\s*(\d{1,2})\b/gi)];

  if (classMatches.length === 0) {
    // General announcement not tied to any specific class
    return true;
  }

  // One or more classes are explicitly targeted
  const targetedGrades = classMatches.map((m) => m[1]);
  if (studentGrade) {
    return targetedGrades.includes(studentGrade);
  }

  // Fallback: substring matching
  return classMatches.some((m) => studentClass.toLowerCase().includes(m[0].toLowerCase()));
}

export function parseTimeToMinutes(timeStr?: string): number {
  if (!timeStr || timeStr.trim().toUpperCase() === 'TBD') return 99999;
  const clean = timeStr.split('•')[0].trim();
  const startPart = clean.split(/\s*[-–—]\s*|\s+to\s+/i)[0]?.trim() || clean;
  const match12 = startPart.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const mins = parseInt(match12[2] || '0', 10);
    const ampm = match12[3].toUpperCase();
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return hours * 60 + mins;
  }
  const match24 = startPart.match(/(\d{1,2}):(\d{2})/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const mins = parseInt(match24[2], 10);
    return hours * 60 + mins;
  }
  return 99999;
}

export function compareClassTimes(aTime?: string, bTime?: string): number {
  const minA = parseTimeToMinutes(aTime);
  const minB = parseTimeToMinutes(bTime);
  if (minA !== minB) return minA - minB;
  return (aTime || '').localeCompare(bTime || '');
}

const FEE_MONTH_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const FEE_MONTH_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export interface FeeMonthInfo {
  monthIndex: number;
  year: number;
  short: string;
  long: string;
  full: string;
}

function makeFeeMonth(monthIndex: number, year: number): FeeMonthInfo {
  return {
    monthIndex,
    year,
    short: FEE_MONTH_SHORT[monthIndex],
    long: FEE_MONTH_LONG[monthIndex],
    full: `${FEE_MONTH_LONG[monthIndex]} ${year}`,
  };
}

// Which (year*12+month) key does a stored payment entry belong to?
function feePaymentKey(p: any, fallbackYear: number): number | null {
  let mi = -1;
  let yr = fallbackYear;
  if (p?.fullMonth) {
    const [mName, y] = String(p.fullMonth).split(' ');
    mi = FEE_MONTH_LONG.findIndex((m) => m.toLowerCase() === (mName || '').toLowerCase());
    if (y && !isNaN(Number(y))) yr = Number(y);
  }
  if (mi < 0 && p?.month) {
    mi = FEE_MONTH_SHORT.indexOf(String(p.month).slice(0, 3).toUpperCase());
  }
  return mi >= 0 ? yr * 12 + mi : null;
}

/**
 * Decide which month a fee payment belongs to.
 * Walks from the student's first month (joining month, or January of the current
 * year) up to the current month and returns the OLDEST month with no approved
 * payment. If everything up to the current month is paid, returns the NEXT
 * month (advance payment).
 */
export function getFeeTargetMonth(
  payments: any[] | undefined,
  joiningIso?: string,
  now: Date = new Date()
): { target: FeeMonthInfo; isAdvance: boolean; unpaidCount: number } {
  const curKey = now.getFullYear() * 12 + now.getMonth();
  const paid = new Set<number>();
  (payments || [])
    .filter((p) => p && p.status !== 'pending_verification')
    .forEach((p) => {
      const k = feePaymentKey(p, now.getFullYear());
      if (k !== null) paid.add(k);
    });

  let startKey = now.getFullYear() * 12; // January of this year
  if (joiningIso) {
    const jd = new Date(joiningIso);
    if (!isNaN(jd.getTime()) && jd.getFullYear() === now.getFullYear()) {
      startKey = jd.getFullYear() * 12 + jd.getMonth();
    }
  }

  let firstUnpaid: number | null = null;
  let unpaidCount = 0;
  for (let k = startKey; k <= curKey; k++) {
    if (!paid.has(k)) {
      unpaidCount++;
      if (firstUnpaid === null) firstUnpaid = k;
    }
  }
  const isAdvance = firstUnpaid === null;
  let targetKey = firstUnpaid ?? curKey + 1;
  if (isAdvance) {
    while (paid.has(targetKey)) targetKey++;
  }
  return {
    target: makeFeeMonth(targetKey % 12, Math.floor(targetKey / 12)),
    isAdvance,
    unpaidCount,
  };
}

export function resolveSessionType(c: any): 'Regular Class' | 'Test Paper' | 'Question Bank' {
  const normStatus = (c?.status || '').toLowerCase();
  const normTime = (c?.time || '').toLowerCase();
  const normSub = (c?.subject || '').toLowerCase();
  const rawType = (c?.session_type || c?.sessionType || c?.type || c?.class_type || '').toLowerCase();

  // 1. Check Test Paper / TP (Check first so explicit TP/Test Paper overrides take precedence)
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
    normTime.includes('test paper') ||
    normTime.includes('• tp') ||
    normTime.includes('tp session') ||
    normSub.includes('(tp)') ||
    normSub.includes('[tp]')
  ) {
    return 'Test Paper';
  }

  // 2. Check Question Bank
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
    normTime.includes('question bank') ||
    normTime.includes('• qb') ||
    normSub.includes('(qb)') ||
    normSub.includes('[qb]')
  ) {
    return 'Question Bank';
  }

  return 'Regular Class';
}

export interface SessionAttendanceMeta {
  classId?: string;
  timeSlot?: string;
  sessionType?: string;
  classDate?: string;
}

export const DataService = {
  // Store session locally
  async saveCurrentStudent(student: StudentProfile) {
    try {
      await AppStorage.setItem(CURRENT_STUDENT_KEY, JSON.stringify(student));
    } catch (e) {
      console.warn('Failed to save student session', e);
    }
  },

  async getCurrentStudent(): Promise<StudentProfile | null> {
    try {
      const stored = await AppStorage.getItem(CURRENT_STUDENT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.rollNo) return parsed;
      }
    } catch (e) {
      console.warn('Failed to read student session', e);
    }
    return null;
  },

  async hasSavedSession(): Promise<boolean> {
    try {
      const stored = await AppStorage.getItem(CURRENT_STUDENT_KEY);
      if (!stored) return false;
      const parsed = JSON.parse(stored);
      return !!(parsed && parsed.rollNo);
    } catch {
      return false;
    }
  },

  async clearCurrentStudent() {
    try {
      await AppStorage.removeItem(CURRENT_STUDENT_KEY);
    } catch (e) {
      console.warn('Failed to clear student session', e);
    }
  },

  // Synchronize student session with latest Supabase record on refresh
  async syncCurrentStudentFromSupabase(rollNo?: string): Promise<StudentProfile | null> {
    const current = await this.getCurrentStudent();
    const targetRoll = rollNo || current?.rollNo;
    if (!targetRoll) return current;

    try {
      const { data, error } = await withTimeout(
        supabase.from('students').select('*').eq('roll_no', targetRoll).single(),
        3000
      ) as any;

      if (!error && data) {
        const updated: StudentProfile = {
          rollNo: data.roll_no || targetRoll,
          name: data.name || current?.name || targetRoll,
          class: data.class_name || current?.class || 'Class 10',
          batch: data.batch || data.class_name || current?.batch || 'Batch A',
          phone: data.phone || current?.phone || '9876543210',
          avatar: data.avatar || current?.avatar || 'ST',
          photoUrl: data.photo_url || current?.photoUrl || undefined,
          streak: data.streak ?? current?.streak ?? 0,
          accuracy: data.accuracy ?? current?.accuracy ?? 0,
          testsCompleted: data.tests_completed ?? current?.testsCompleted ?? 0,
          topPercent: data.top_percent ?? current?.topPercent ?? 0,
          goals: data.class_name || current?.goals || '',
        };
        await this.saveCurrentStudent(updated);
        return updated;
      }
    } catch (e) {
      console.warn('[DataService] syncCurrentStudentFromSupabase notice:', e);
    }
    return current;
  },

  // Student Login
  async loginStudent(rollNo: string, pin: string): Promise<{ success: boolean; student?: StudentProfile; error?: string }> {
    const trimmedRoll = rollNo.trim();
    const trimmedPin = pin.trim();

    // If blank, auto-sign in as demo Arjun S smoothly
    if (!trimmedRoll && !trimmedPin) {
      const student: StudentProfile = {
        rollNo: mockStudent.rollNo,
        name: mockStudent.name,
        class: mockStudent.class,
        batch: mockStudent.batch,
        avatar: mockStudent.avatar,
        streak: mockStudent.streak,
        accuracy: mockStudent.accuracy,
        testsCompleted: mockStudent.testsCompleted,
        topPercent: mockStudent.topPercent,
        phone: '9876543210',
        email: 'arjun.sharma@eduhome.ac.in',
        goals: 'JEE Advanced 2027 (Top 1000)',
      };
      await this.saveCurrentStudent(student);
      return { success: true, student };
    }

    try {
      const queryPromise = supabase
        .from('students')
        .select('*')
        .eq('roll_no', trimmedRoll)
        .eq('pin', trimmedPin)
        .single();

      const { data, error } = await withTimeout(queryPromise, 3000) as any;

      if (data && !error) {
        const student: StudentProfile = {
          id: data.id,
          rollNo: data.roll_no,
          name: data.name,
          class: data.class_name,
          batch: data.batch,
          avatar: data.avatar || 'ST',
          photoUrl: data.photo_url || undefined,
          phone: data.phone || '9876543210',
          email: data.email || `${data.roll_no.toLowerCase()}@eduhome.ac.in`,
          goals: data.goals || data.class_name || '',
          streak: data.streak ?? 0,
          accuracy: data.accuracy ?? 0,
          testsCompleted: data.tests_completed ?? 0,
          topPercent: data.top_percent ?? 0,
        };
        await this.saveCurrentStudent(student);
        return { success: true, student };
      }
    } catch (err) {
      console.log('Supabase login query notice (using offline demo fallback if matching):', err);
    }

    // Graceful offline fallback: Check Arjun demo student
    if (
      (trimmedRoll.toUpperCase() === '2024-JEE-0842' || trimmedRoll.toUpperCase() === 'ARJUN' || trimmedRoll === '') &&
      (trimmedPin === '1234' || trimmedPin === '')
    ) {
      const student: StudentProfile = {
        rollNo: mockStudent.rollNo,
        name: mockStudent.name,
        class: mockStudent.class,
        batch: mockStudent.batch,
        avatar: mockStudent.avatar,
        streak: mockStudent.streak,
        accuracy: mockStudent.accuracy,
        testsCompleted: mockStudent.testsCompleted,
        topPercent: mockStudent.topPercent,
        phone: '9876543210',
        email: 'arjun.sharma@eduhome.ac.in',
        goals: mockStudent.class,
      };
      await this.saveCurrentStudent(student);
      return { success: true, student };
    }

    // Graceful offline fallback: Check all 49 EduHome 2026 Batch students
    const matchedEduStudent = EDUSYNC_STUDENTS.find(
      (s) => s.rollNo.toUpperCase() === trimmedRoll.toUpperCase()
    );
    if (matchedEduStudent && (trimmedPin === matchedEduStudent.pin || trimmedPin === '1234')) {
      const student: StudentProfile = {
        rollNo: matchedEduStudent.rollNo,
        name: matchedEduStudent.name,
        class: matchedEduStudent.class,
        batch: matchedEduStudent.batch,
        avatar: matchedEduStudent.avatar,
        streak: matchedEduStudent.streak || 0,
        accuracy: matchedEduStudent.accuracy || 0,
        testsCompleted: matchedEduStudent.testsCompleted || 0,
        topPercent: matchedEduStudent.topPercent || 0,
        phone: matchedEduStudent.phone,
        email: `${matchedEduStudent.name.toLowerCase().replace(/\s+/g, '.')}@eduhome.ac.in`,
        goals: matchedEduStudent.class,
      };
      await this.saveCurrentStudent(student);
      return { success: true, student };
    }

    return { success: false, error: 'Invalid Roll Number or PIN. Example: EDU-2026-001 / PIN 1234' };
  },

  // Update Student Profile & Security
  async updateStudentProfile(
    rollNo: string,
    updates: Partial<StudentProfile>,
    newPin?: string,
    currentPin?: string
  ): Promise<{ success: boolean; student?: StudentProfile; error?: string }> {
    const current = (await this.getCurrentStudent()) || {
      rollNo,
      name: updates.name || rollNo,
      class: 'Class 10',
      batch: 'Batch A',
      avatar: 'ST',
      streak: 0,
      accuracy: 0,
      testsCompleted: 0,
      topPercent: 0,
    };

    // Verify current PIN if user wants to change PIN
    if (newPin) {
      if (!currentPin) {
        return { success: false, error: 'Current PIN is required to change security PIN' };
      }
      try {
        const checkQuery = supabase
          .from('students')
          .select('pin')
          .eq('roll_no', rollNo)
          .single();
        const { data } = await withTimeout(checkQuery, 2500) as any;
        if (data && data.pin !== currentPin.trim()) {
          return { success: false, error: 'Current security PIN is incorrect' };
        }
      } catch {
        // In demo fallback, default PIN is 1234
        if (currentPin.trim() !== '1234') {
          return { success: false, error: 'Current security PIN is incorrect (default is 1234)' };
        }
      }
    }

    const mergedStudent: StudentProfile = {
      ...current,
      ...updates,
    };

    // Save to local session & cache immediately
    await this.saveCurrentStudent(mergedStudent);

    // Save to Supabase in background
    try {
      const payload: Record<string, any> = {
        name: mergedStudent.name,
        avatar: mergedStudent.avatar,
        phone: mergedStudent.phone,
      };
      if (mergedStudent.photoUrl) payload.photo_url = mergedStudent.photoUrl;
      if (newPin) payload.pin = newPin.trim();

      await withTimeout(
        supabase.from('students').update(payload).eq('roll_no', rollNo),
        3000
      );
    } catch (e) {
      console.log('Saved to local storage, background sync error:', e);
    }

    return { success: true, student: mergedStudent };
  },

  // Fetch Classes with Cache & 2.5s Timeout
  async getClasses(rollNo: string, studentClass?: string) {
    const cacheKey = `classes_${rollNo}`;
    const cached = await getCached<any[]>(cacheKey);

    try {
      const cleanClass = (studentClass || '').replace(/[^0-9]/g, '');
      const gradeStr = cleanClass ? `Class ${cleanClass}` : (studentClass || 'Class 12');

      // Unified single query matching both student roll number and student class grade
      const query = supabase
        .from('classes')
        .select('*')
        .or(`roll_no.eq.${rollNo},roll_no.eq.${gradeStr},class_grade.eq.${gradeStr},class_grade.eq.${studentClass || gradeStr}`)
        .order('created_at', { ascending: true });

      const { data, error } = await withTimeout(query, 2500) as any;

      if (!error && Array.isArray(data)) {
        // Deduplicate so each subject on a given date appears EXACTLY ONCE (latest schedule takes precedence)
        const seen = new Set<string>();
        const deduplicated: any[] = [];
        const reversed = [...data].reverse();
        for (const c of reversed) {
          const normSubject = (c.subject || '').trim().toLowerCase();
          const normDate = (c.class_date || '').trim();
          const normTime = (c.time || '').trim().toLowerCase();
          const key = `${normSubject}_${normDate}_${normTime}`;
          if (!seen.has(key)) {
            seen.add(key);
            deduplicated.push(c);
          }
        }

        // Sort chronologically by actual time
        deduplicated.sort((a, b) => compareClassTimes(a.time, b.time));

        const mapped = deduplicated.map((c: any) => ({
          id: c.id,
          time: c.time,
          subject: c.subject,
          status: c.status || 'upcoming',
          published: c.published !== false,
          class_date: c.class_date,
          class_grade: c.class_grade,
          session_type: resolveSessionType(c),
        }));
        await setCached(cacheKey, mapped);
        return mapped;
      }
    } catch (e) {
      // Timeout or offline fallback
    }

    if (cached && Array.isArray(cached)) {
      const isOldFakeMock = cached.some((c) => c.id === '1' && c.time === '5:00 PM – 6:00 PM');
      if (!isOldFakeMock) {
        const seen = new Set<string>();
        const list = [...cached].reverse().filter((c: any) => {
          const normSubject = (c.subject || '').trim().toLowerCase();
          const normDate = (c.class_date || '').trim();
          const normTime = (c.time || '').trim().toLowerCase();
          const key = `${normSubject}_${normDate}_${normTime}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        return list.sort((a, b) => compareClassTimes(a.time, b.time));
      }
    }

    return [];
  },

  // Fetch Announcements — Network-First with Cache Fallback (Optionally filtered by student class)
  async getAnnouncements(forceRefresh = false, studentClass?: string) {
    const classSuffix = studentClass ? `_${studentClass.replace(/\s+/g, '_').toLowerCase()}` : '';
    const cacheKey = `eduhome_announcements${classSuffix}`;
    const cached = await getCached<any[]>(cacheKey);

    // 1. Try Supabase Network-First so announcements from Admin Web App appear immediately
    try {
      const query = supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = (await withTimeout(query, 3000)) as any;
      if (!error) {
        if (data && data.length > 0) {
          const approvedOnly = data.filter(
            (a: any) => !a.title?.includes('[PENDING APPROVAL') && a.time_label !== 'Pending Approval'
          );
          const mapped = approvedOnly.map((a: any) => ({
            id: a.id,
            icon: a.icon || 'megaphone',
            iconBg: a.icon_bg || '#FEF3F2',
            iconColor: a.icon_color || '#F04438',
            title: a.title,
            desc: a.description,
            time: a.time_label || 'Recently',
            important: a.important || false,
            tag: a.tag || (a.important ? 'Urgent Alert' : 'Notice'),
            author: a.author || 'EduHome Administration',
            createdAt: a.created_at,
          }));

          // Filter by student class if specified
          const filtered = studentClass
            ? mapped.filter((a: any) => isTargetedToClass(a, studentClass))
            : mapped;

          await setCached(cacheKey, filtered);
          return filtered;
        } else {
          // Genuinely 0 announcements in DB (admin deleted or cleared them)
          await setCached(cacheKey, []);
          return [];
        }
      }
    } catch (e) {
      console.warn('Network fetch for announcements failed, falling back to cache', e);
    }

    // 2. Offline fallback ONLY if network error occurred
    if (cached) {
      return studentClass ? cached.filter((a: any) => isTargetedToClass(a, studentClass)) : cached;
    }
    return [];
  },

  // Fetch Attendance with Cache & 2.5s Timeout
  async getAttendance(rollNo: string) {
    const cacheKey = `attendance_${rollNo}`;
    const cached = await getCached<any>(cacheKey);

    try {
      const query = supabase
        .from('attendance_records')
        .select('*')
        .eq('roll_no', rollNo)
        .single();

      const { data, error } = await withTimeout(query, 2500) as any;
      if (data && !error) {
        const mapped = {
          overall: data.overall,
          attended: data.attended,
          total: data.total,
          todaySubjects: data.today_subjects || [],
          history: data.history || [],
        };
        await setCached(cacheKey, mapped);
        return mapped;
      }
    } catch (e) {
      // Timeout or offline
    }

    return cached || mockAttendance;
  },

  // Dynamic Days Calculation Helper based on student's joining date or day of the month
  calculateDueInfo(joiningDateOrDay?: string | number) {
    const now = new Date();
    let dueDay = 25;
    if (typeof joiningDateOrDay === 'number') {
      dueDay = joiningDateOrDay;
    } else if (typeof joiningDateOrDay === 'string') {
      // Support formats like '15 Sep 2026', '2026-06-12', '12', etc.
      const match = joiningDateOrDay.match(/^(\d{1,2})/);
      if (match) {
        dueDay = parseInt(match[1], 10);
      } else {
        const parsed = new Date(joiningDateOrDay);
        if (!isNaN(parsed.getDate())) {
          dueDay = parsed.getDate();
        }
      }
    }
    // Cap due day between 1 and 28 for safe monthly recurrence
    dueDay = Math.max(1, Math.min(28, dueDay));
    const target = new Date(now.getFullYear(), now.getMonth(), dueDay, 23, 59, 59);
    const diffTime = target.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const monthName = target.toLocaleDateString('en-US', { month: 'short' });
    const dueDate = `${dueDay} ${monthName} ${now.getFullYear()}`;
    return {
      dueDay,
      daysLeft,
      dueDate,
      isOverdue: daysLeft < 0,
      isDueToday: daysLeft === 0,
    };
  },

  // Fetch Fees with Cache & 2.5s Timeout
  async getFees(rollNo: string) {
    const cacheKey = `fees_${rollNo}`;
    const cached = await getCached<any>(cacheKey);

    const studentFeeInfo = (EDUSYNC_FEES as any)[rollNo] || {
      monthlyFee: 4000,
      currentDue: 4000,
      dueDate: '25 Sep 2026',
      joiningDate: '25 Sep 2024',
      daysLeft: 5,
      monthsPaidOnTime: 2,
      subjects: 'Physics, Chemistry, Maths',
    };

    // Calculate dynamic due date and days left based on student's joining date
    const dueInfo = this.calculateDueInfo(studentFeeInfo.joiningDate || studentFeeInfo.dueDate || 25);

    try {
      const query = supabase
        .from('fees_records')
        .select('*')
        .eq('roll_no', rollNo)
        .single();

      const { data, error } = await withTimeout(query, 2500) as any;
      if (data && !error) {
        const studentDueInfo = this.calculateDueInfo(data.joining_date || data.due_date || studentFeeInfo.joiningDate || 25);
        const payments = Array.isArray(data.recent_payments) ? data.recent_payments : [];
        const approvedPayments = payments.filter((p: any) => p.status !== 'pending_verification');
        const hasPendingVerification = payments.some((p: any) => p.status === 'pending_verification');

        // Month-by-month: which months have an approved payment?
        const feeNow = new Date();
        const { target, isAdvance, unpaidCount } = getFeeTargetMonth(
          approvedPayments,
          studentFeeInfo.joiningDateIso,
          feeNow
        );
        const pendingItem = payments.find((p: any) => p.status === 'pending_verification');
        // Everything up to the current month is paid -> cleared (unless an advance payment is in review)
        const isPaid = isAdvance && !hasPendingVerification && approvedPayments.length > 0;
        const computedStatus = hasPendingVerification ? 'pending_verification' : (isPaid ? 'paid' : 'due');

        // Most recent month that has been paid (by calendar order, not array order)
        let clearedMonthName = 'October';
        let bestKey = -1;
        approvedPayments.forEach((p: any) => {
          const k = feePaymentKey(p, feeNow.getFullYear());
          if (k !== null && k > bestKey) {
            bestKey = k;
            clearedMonthName = FEE_MONTH_LONG[k % 12];
          }
        });

        // Due date of the month being paid = joining day of that month
        const dueDay = Number((studentFeeInfo.joiningDateIso || '').slice(8)) || 25;
        const targetDueObj = new Date(target.year, target.monthIndex, dueDay);
        const targetDueStr = `${String(dueDay).padStart(2, '0')} ${target.long} ${target.year}`;
        const todayMid = new Date(feeNow.getFullYear(), feeNow.getMonth(), feeNow.getDate());
        const targetDaysLeft = Math.round((targetDueObj.getTime() - todayMid.getTime()) / 86400000);

        const computedDue = isPaid ? 0 : (unpaidCount > 0 ? unpaidCount * studentFeeInfo.monthlyFee : studentFeeInfo.monthlyFee);

        const mapped = {
          monthlyFee: studentFeeInfo.monthlyFee,
          currentDue: computedDue,
          actualDue: computedDue,
          dueDate: isPaid ? 'All Cleared' : targetDueStr,
          joiningDate: data.joining_date || studentFeeInfo.joiningDate || studentDueInfo.dueDate,
          daysLeft: isPaid ? 0 : targetDaysLeft,
          isPaid,
          status: computedStatus as 'due' | 'pending_verification' | 'paid',
          clearedMonth: clearedMonthName,
          payingMonth: pendingItem?.fullMonth || target.full,
          nextMonthLabel: target.long,
          overdueMonths: unpaidCount,
          isAdvancePayment: isAdvance,
          subjects: studentFeeInfo.subjects,
          upiId: 'devitintu12345@oksbi',
          payeeName: 'EduHome Tuition Center',
          loyaltyMonths: data.loyalty_months || mockFees.loyaltyMonths,
          monthsPaidOnTime: data.months_paid_on_time ?? (isPaid ? 10 : 8),
          recentPayments: (() => {
            const seen = new Set<number>();
            return [...approvedPayments]
              .map((p: any, i: number) => ({ p, i, k: feePaymentKey(p, feeNow.getFullYear()) ?? -1 }))
              .sort((a, b) => (b.k - a.k) || (a.i - b.i))
              .filter(({ k }) => {
                if (k < 0) return true;
                if (seen.has(k)) return false;
                seen.add(k);
                return true;
              })
              .map(({ p }) => p);
          })(),
        };
        await setCached(cacheKey, mapped);
        return mapped;
      }
    } catch (e) {
      // Timeout or offline
    }

    if (cached) {
      const isPaid = Boolean(cached.isPaid && cached.recentPayments && cached.recentPayments.length > 0);
      return {
        ...cached,
        monthlyFee: cached.monthlyFee || studentFeeInfo.monthlyFee,
        subjects: cached.subjects || studentFeeInfo.subjects,
        joiningDate: cached.joiningDate || studentFeeInfo.joiningDate,
        currentDue: isPaid ? 0 : (cached.monthlyFee || studentFeeInfo.monthlyFee),
        actualDue: isPaid ? 0 : (cached.monthlyFee || studentFeeInfo.monthlyFee),
        daysLeft: isPaid ? 0 : dueInfo.daysLeft,
        dueDate: dueInfo.dueDate,
        isPaid,
        status: isPaid ? 'paid' : (cached.status === 'pending_verification' ? 'pending_verification' : 'due'),
        monthsPaidOnTime: isPaid ? (cached.monthsPaidOnTime ?? studentFeeInfo.monthsPaidOnTime) : 0,
        recentPayments: Array.isArray(cached.recentPayments) ? cached.recentPayments.filter((p: any) => p.status !== 'pending_verification') : [],
      };
    }

    const initial = {
      ...mockFees,
      monthlyFee: studentFeeInfo.monthlyFee,
      currentDue: studentFeeInfo.monthlyFee,
      actualDue: studentFeeInfo.monthlyFee,
      subjects: studentFeeInfo.subjects,
      joiningDate: studentFeeInfo.joiningDate,
      school: studentFeeInfo.school,
      daysLeft: studentFeeInfo.daysLeft !== undefined ? studentFeeInfo.daysLeft : dueInfo.daysLeft,
      dueDate: studentFeeInfo.dueDate || dueInfo.dueDate,
      monthsPaidOnTime: studentFeeInfo.monthsPaidOnTime,
    };
    await setCached(cacheKey, initial);
    return initial;
  },

  // Student submits UPI payment for verification (with screenshot proof)
  async submitFeePayment(rollNo: string, utr?: string, screenshot?: string | null) {
    const cacheKey = `fees_${rollNo}`;
    const current = (await getCached<any>(cacheKey)) || mockFees;
    const studentFeeInfo = (EDUSYNC_FEES as any)[rollNo];
    const studentName = studentFeeInfo?.name || (current as any).studentName || (rollNo === '2024-JEE-0842' ? 'Arjun S' : rollNo);
    const studentClass = studentFeeInfo?.class || (current as any).class || '';
    const feeDueAmount = current.monthlyFee || current.actualDue || studentFeeInfo?.monthlyFee || 4000;
    const utrVal = utr?.trim() || (screenshot ? `PROOF-${Date.now().toString().slice(-6)}` : `UPI-${Date.now().toString().slice(-6)}`);

    // Compute current month/year dynamically
    const now = new Date();
    const monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const curMonthShort = monthNames[now.getMonth()];
    const curMonthFull = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const updated = {
      ...current,
      status: 'pending_verification' as const,
      utr: utrVal,
      screenshot: screenshot || null,
      submittedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    await setCached(cacheKey, updated);

    // Save pending verification to admin queue
    const adminKey = 'admin_pending_fees';
    const pendingList = (await getCached<any[]>(adminKey)) || [];
    const existsIndex = pendingList.findIndex((p) => p.rollNo === rollNo);
    const pendingItem = {
      rollNo,
      studentName,
      studentClass,
      amount: feeDueAmount,
      upiId: 'devitintu12345@oksbi',
      utr: updated.utr,
      screenshot: screenshot || null,
      submittedAt: updated.submittedAt,
    };
    if (existsIndex >= 0) {
      pendingList[existsIndex] = pendingItem;
    } else {
      pendingList.push(pendingItem);
    }
    await setCached(adminKey, pendingList);

    const pendingPaymentItem = {
      month: curMonthShort,
      fullMonth: curMonthFull,
      amount: feeDueAmount,
      utr: utrVal,
      screenshot: screenshot || null,
      submittedAt: now.toISOString(),
      status: 'pending_verification',
      studentName,
      studentClass,
      rollNo,
    };

    try {
      const { data: record } = await supabase.from('fees_records').select('*').eq('roll_no', rollNo).maybeSingle();
      const existingPayments = Array.isArray(record?.recent_payments) ? record.recent_payments : [];
      // Month this proof is for = oldest month still unpaid (or next month if fully paid up)
      const { target } = getFeeTargetMonth(existingPayments, studentFeeInfo?.joiningDateIso, now);
      pendingPaymentItem.month = target.short;
      pendingPaymentItem.fullMonth = target.full;
      const updatedPayments = [pendingPaymentItem, ...existingPayments.filter((p: any) => p.status !== 'pending_verification')];
      
      const upsertPayload = {
        roll_no: rollNo,
        current_due: record?.current_due ?? feeDueAmount,
        due_date: record?.due_date || studentFeeInfo?.dueDate || '25 Oct 2026',
        days_left: record?.days_left ?? studentFeeInfo?.daysLeft ?? -5,
        months_paid_on_time: record?.months_paid_on_time ?? studentFeeInfo?.monthsPaidOnTime ?? 2,
        recent_payments: updatedPayments,
        updated_at: now.toISOString(),
      };
      const { error: upsertErr } = await supabase.from('fees_records').upsert(upsertPayload, { onConflict: 'roll_no' });
      if (upsertErr) {
        console.error('Supabase fee upsert error:', upsertErr);
      }
    } catch (err) {
      console.log('Error updating fee proof in Supabase:', err);
    }

    return updated;
  },


  // Admin approves student fee payment
  async approveFeePayment(rollNo: string) {
    const cacheKey = `fees_${rollNo}`;
    const current = (await getCached<any>(cacheKey)) || mockFees;
    const now = new Date();
    const paidOnStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const studentFeeInfo = (EDUSYNC_FEES as any)[rollNo];
    const approvedAmount = current.monthlyFee || current.actualDue || studentFeeInfo?.monthlyFee || 4000;

    const monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    // Month being approved = the month on the student's pending proof (fallback: oldest unpaid month)
    let payMonthShort = monthNames[now.getMonth()];
    let payMonthFull = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    let remoteRecord: any = null;
    try {
      const { data: rec } = await supabase.from('fees_records').select('*').eq('roll_no', rollNo).maybeSingle();
      remoteRecord = rec;
      const recPayments = Array.isArray(rec?.recent_payments) ? rec.recent_payments : [];
      const pend = recPayments.find((p: any) => p.status === 'pending_verification');
      if (pend?.month && pend?.fullMonth) {
        payMonthShort = pend.month;
        payMonthFull = pend.fullMonth;
      } else {
        const t = getFeeTargetMonth(recPayments, studentFeeInfo?.joiningDateIso, now).target;
        payMonthShort = t.short;
        payMonthFull = t.full;
      }
    } catch {}

    const newPayment = {
      month: payMonthShort,
      fullMonth: payMonthFull,
      paidOn: paidOnStr,
      amount: approvedAmount,
      onTime: true,
      status: 'Verified by Center Admin',
      receiptNo: `REC-${now.getFullYear()}-${payMonthShort}-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    // Is the student fully paid up (through the current month) after this approval?
    const priorPayments = Array.isArray(remoteRecord?.recent_payments)
      ? remoteRecord.recent_payments.filter((p: any) => p.status !== 'pending_verification')
      : (current.recentPayments || []).filter((p: any) => p.status !== 'pending_verification');
    const afterPayments = [newPayment, ...priorPayments];
    const after = getFeeTargetMonth(afterPayments, studentFeeInfo?.joiningDateIso, now);
    const fullyPaid = after.isAdvance;
    const monthlyAmt = current.monthlyFee || approvedAmount;

    const updated = {
      ...current,
      currentDue: fullyPaid ? 0 : monthlyAmt,
      isPaid: fullyPaid,
      status: (fullyPaid ? 'paid' : 'due') as 'paid' | 'due',
      screenshot: null,
      daysLeft: fullyPaid ? 0 : current.daysLeft,
      monthsPaidOnTime: (current.monthsPaidOnTime || 2) + 1,
      recentPayments: afterPayments,
      verifiedAt: paidOnStr,
      verifiedBy: 'Center Admin',
    };
    await setCached(cacheKey, updated);

    // Remove from local admin pending list
    try {
      const adminKey = 'admin_pending_fees';
      const pendingList = (await getCached<any[]>(adminKey)) || [];
      const filtered = pendingList.filter((p) => p.rollNo !== rollNo);
      await setCached(adminKey, filtered);
    } catch {}

    try {
      await supabase
        .from('fees_records')
        .update({
          current_due: fullyPaid ? 0 : monthlyAmt,
          recent_payments: afterPayments,
          updated_at: new Date().toISOString(),
        })
        .eq('roll_no', rollNo);

      // Broadcast approval event so the student app's realtime channel picks it up instantly
      await supabase.channel('fee_realtime_broadcast').send({
        type: 'broadcast',
        event: 'fee_approved',
        payload: { rollNo, approvedAt: new Date().toISOString() },
      });
    } catch {}

    return updated;
  },


  // Super Admin marks fee paid via cash directly from student roster or admin app
  async markFeeAsPaidCash(rollNo: string, amount: number, verifiedBy: string = 'Mr. Abhai Kumar (Super Admin)') {
    const cacheKey = `fees_${rollNo}`;
    const current = (await getCached<any>(cacheKey)) || mockFees;
    const now = new Date();
    const paidOnStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const cashTarget = getFeeTargetMonth(
      current.recentPayments,
      (EDUSYNC_FEES as any)[rollNo]?.joiningDateIso,
      now
    ).target;
    const curMonth = cashTarget.short;
    const curFullMonth = cashTarget.full;

    const newPayment = {
      month: curMonth,
      fullMonth: curFullMonth,
      paidOn: paidOnStr,
      amount: amount || current.monthlyFee || 4000,
      onTime: true,
      status: 'Cash Payment - Verified by Super Admin',
      receiptNo: `REC-${now.getFullYear()}-${curMonth}-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    const updated = {
      ...current,
      currentDue: 0,
      isPaid: true,
      status: 'paid' as const,
      daysLeft: 0,
      monthsPaidOnTime: (current.monthsPaidOnTime || 0) + 1,
      recentPayments: [newPayment, ...(current.recentPayments || [])],
      verifiedAt: paidOnStr,
      verifiedBy,
    };

    await setCached(cacheKey, updated);

    // Remove from admin pending queue if any
    const adminKey = 'admin_pending_fees';
    const pendingList = (await getCached<any[]>(adminKey)) || [];
    const filtered = pendingList.filter((p) => p.rollNo !== rollNo);
    await setCached(adminKey, filtered);

    try {
      await supabase
        .from('fees_records')
        .update({
          status: 'paid',
          current_due: 0,
          updated_at: new Date().toISOString(),
          recent_payments: updated.recentPayments,
        })
        .eq('roll_no', rollNo);
    } catch {}

    return updated;
  },

  // Reset fee back to due (for demo / testing reset)
  async resetFeePayment(rollNo: string) {
    const cacheKey = `fees_${rollNo}`;
    const studentFeeInfo = (EDUSYNC_FEES as any)[rollNo] || {
      monthlyFee: 4000,
      currentDue: 4000,
      dueDate: '15 Sep 2026',
      daysLeft: -5,
      joiningDate: '15 Jan 2026',
      monthsPaidOnTime: 2,
      subjects: 'Physics, Chemistry, Maths',
    };
    const dueInfo = this.calculateDueInfo(studentFeeInfo.joiningDate || studentFeeInfo.dueDate || 25);
    const reset = {
      ...mockFees,
      monthlyFee: studentFeeInfo.monthlyFee,
      actualDue: studentFeeInfo.monthlyFee,
      subjects: studentFeeInfo.subjects,
      joiningDate: studentFeeInfo.joiningDate,
      school: studentFeeInfo.school,
      currentDue: studentFeeInfo.monthlyFee,
      isPaid: false,
      status: 'due' as const,
      daysLeft: studentFeeInfo.daysLeft !== undefined ? studentFeeInfo.daysLeft : dueInfo.daysLeft,
      dueDate: studentFeeInfo.dueDate || dueInfo.dueDate,
      monthsPaidOnTime: studentFeeInfo.monthsPaidOnTime,
    };
    await setCached(cacheKey, reset);
    try {
      await supabase
        .from('fees_records')
        .update({ status: 'due', current_due: studentFeeInfo.monthlyFee })
        .eq('roll_no', rollNo);
    } catch {}
    return reset;
  },

  // Get list of pending fee approvals for Superadmin
  async getPendingFeeApprovals() {
    const adminKey = 'admin_pending_fees';
    return (await getCached<any[]>(adminKey)) || [];
  },

  // Fetch Progress with Cache & 2.5s Timeout (Default is strictly NONE: 0 tests attended, empty chart)
  async getProgress(rollNo: string) {
    const cacheKey = `progress_${rollNo}`;
    const cached = await getCached<any>(cacheKey);

    const defaultNone = {
      testsAttended: 0,
      highestScore: 0,
      topPercent: 0,
      totalStudents: 0,
      improvement: 0,
      chartLabels: [] as string[],
      yourScores: [] as number[],
      avgScores: [] as number[],
      accuracy: 0,
      incorrect: 0,
      gainMarks: 0,
      commonMistakes: [] as { rank: number; text: string; count: number }[],
      practice: { attended: 0, completed: 0, pending: 0, highest: 0 },
    };

    if (cached) {
      // Purge legacy mock if it had the old 14 tests attended or hardcoded high score 92
      if (cached.testsAttended === 14 && cached.highestScore === 92) {
        await setCached(cacheKey, defaultNone);
        return defaultNone;
      }
      return {
        ...defaultNone,
        ...cached,
        chartLabels: cached.chartLabels || [],
        yourScores: cached.yourScores || [],
        avgScores: cached.avgScores || [],
      };
    }

    try {
      const query = supabase
        .from('progress_records')
        .select('*')
        .eq('roll_no', rollNo)
        .single();

      const { data, error } = await withTimeout(query, 2500) as any;
      if (data && !error) {
        const yourScores = Array.isArray(data.your_scores) ? data.your_scores : [];
        const mapped = {
          testsAttended: data.tests_attended ?? yourScores.length ?? 0,
          highestScore: data.highest_score ?? (yourScores.length > 0 ? Math.max(...yourScores) : 0),
          topPercent: data.top_percent ?? 0,
          totalStudents: data.total_students ?? 0,
          improvement: data.improvement ?? 0,
          chartLabels: Array.isArray(data.chart_labels) ? data.chart_labels : [],
          yourScores: yourScores,
          avgScores: Array.isArray(data.avg_scores) ? data.avg_scores : [],
          accuracy: data.accuracy ?? 0,
          incorrect: data.incorrect ?? 0,
          gainMarks: data.gain_marks ?? 0,
          commonMistakes: data.common_mistakes || [],
          practice: data.practice || { attended: 0, completed: 0, pending: 0, highest: 0 },
        };
        await setCached(cacheKey, mapped);
        return mapped;
      }
    } catch (e) {
      // Timeout or offline
    }

    return defaultNone;
  },

  // Fetch Study Materials with Cache & 2.5s Timeout
  async getStudyMaterials() {
    const cacheKey = 'materials';
    const cached = await getCached<any[]>(cacheKey);

    try {
      const query = supabase
        .from('study_materials')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await withTimeout(query, 2500) as any;
      if (data && data.length > 0 && !error) {
        const mapped = data.map((m: any) => ({
          id: m.id,
          subject: m.subject,
          chapter: m.chapter,
          title: m.title,
          desc: m.description,
          tag: m.tag,
          tagColor: m.tag_color || '#EBF3FF',
          pages: m.pages,
          size: m.size,
          icon: m.icon || 'document-text-outline',
          iconBg: m.icon_bg || '#EBF3FF',
          iconColor: m.icon_color || '#1A56DB',
          fileUrl: m.file_url,
        }));
        await setCached(cacheKey, mapped);
        return mapped;
      }
    } catch (e) {
      // Timeout or offline
    }

    return cached || mockMaterials;
  },

  // Fetch Notifications with Cache & 2.5s Timeout
  async getNotifications(rollNo: string) {
    const cacheKey = `notifs_${rollNo}`;
    const cached = await getCached<any[]>(cacheKey);

    try {
      const query = supabase
        .from('notifications')
        .select('*')
        .eq('roll_no', rollNo)
        .order('created_at', { ascending: false });

      const { data, error } = await withTimeout(query, 2500) as any;
      if (data && data.length > 0 && !error) {
        const mapped = data.map((n: any) => ({
          id: n.id,
          title: n.title,
          desc: n.message,
          time: n.time_label,
          unread: !n.is_read,
          type: n.type,
        }));
        await setCached(cacheKey, mapped);
        return mapped;
      }
    } catch (e) {
      // Timeout or offline
    }

    return cached || [
      { id: '1', title: 'Class Timetable Updated', desc: 'Tomorrow Physics class rescheduled to 5:30 PM.', time: '10m ago', unread: true, type: 'schedule' },
      { id: '2', title: 'Fee Reminder', desc: 'Monthly tuition fee test of ₹1 due on 25 Sep 2026.', time: '1h ago', unread: true, type: 'fee' },
      { id: '3', title: 'Test Result Published', desc: 'Weekly Test #8 results are out. You scored 92/100!', time: '1d ago', unread: false, type: 'result' },
      { id: '4', title: 'New Study Material', desc: 'Notes for Chemistry Chapter 1 uploaded by Mr. Abhai Kumar.', time: '2d ago', unread: false, type: 'material' },
    ];
  },

  // Academic / Test Paper Alert (Shown on Student Home above Attendance - Optionally filtered by student class)
  async getAcademicAlert(studentClass?: string) {
    const classSuffix = studentClass ? `_${studentClass.replace(/\s+/g, '_').toLowerCase()}` : '';
    const key = `academic_alert_active${classSuffix}`;

    // 1. First, check dedicated academic_alerts table (guaranteed test papers from admin & faculty)
    try {
      const { data: acData, error: acErr } = (await withTimeout(
        supabase
          .from('academic_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
        2500
      )) as any;

      if (acData && acData.length > 0 && !acErr) {
        const now = new Date();
        const validItem = acData.find((top: any) => {
          // Check stop/expiry date
          if (top.expiry_date || top.stop_date) {
            const expDate = new Date(top.expiry_date || top.stop_date);
            expDate.setHours(23, 59, 59, 999);
            if (!isNaN(expDate.getTime()) && now > expDate) {
              return false;
            }
          }
          // Check show from date (day to be shown to students)
          if (top.show_from_date) {
            const showDate = new Date(top.show_from_date);
            showDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (!isNaN(showDate.getTime()) && today < showDate) {
              return false;
            }
          }
          if (studentClass && !isTargetedToClass(top, studentClass)) {
            return false;
          }
          return true;
        });

        if (validItem) {
          const alertObj = {
            id: validItem.id,
            type: 'test_paper',
            title: validItem.title,
            shortDesc: validItem.short_desc || (Array.isArray(validItem.syllabus) ? validItem.syllabus.join(' • ') : validItem.syllabus) || 'Test Paper Alert',
            date: validItem.date || 'Upcoming Test',
            time: validItem.time || '',
            room: validItem.room || 'Exam Hall',
            maxMarks: validItem.max_marks || 100,
            syllabus: Array.isArray(validItem.syllabus) ? validItem.syllabus : (validItem.syllabus ? [validItem.syllabus] : ['Full Chapters Revision']),
            instructions: validItem.instructions || [
              'Arrive 15 minutes before the exam starts.',
              'Carry blue/black ballpoint pens.',
              'Bring geometry box if required.',
            ],
            updatedBy: validItem.updated_by || 'Faculty / Admin',
            expiryDate: validItem.expiry_date || validItem.stop_date,
            showFromDate: validItem.show_from_date,
            classTag: validItem.class_tag || validItem.classTag,
          };
          await setCached(key, alertObj);
          return alertObj;
        }
      }
    } catch (e) {}

    // 2. Fetch latest active exam alert from announcements table ONLY if strictly a test paper or exam alert
    // NEVER match generic announcements or holidays with icon: 'calendar'
    try {
      const { data, error } = (await withTimeout(
        supabase
          .from('announcements')
          .select('*')
          .or('title.ilike.%[Exam Alert]%,title.ilike.%[Test Alert]%,title.ilike.%[Test Paper]%,description.ilike.%Exam Date%')
          .order('created_at', { ascending: false })
          .limit(10),
        2500
      )) as any;

      if (!error) {
        if (data && data.length > 0) {
          // Filter out any holiday or generic notice
          const validTestAnnouncements = data.filter((item: any) => {
            const t = (item.title || '').toLowerCase();
            const d = (item.description || '').toLowerCase();
            // Exclude holidays, attendance, schedule or no class notices
            if (t.includes('holiday') || d.includes('holiday') || t.includes('no class') || d.includes('no class')) {
              return false;
            }
            if (t.includes('[pending approval') || item.time_label === 'Pending Approval') {
              return false;
            }
            const isTest = t.includes('[exam alert') || t.includes('[test alert') || t.includes('[test paper') || d.includes('exam date:');
            if (!isTest) return false;

            // Class-targeted check: do NOT show tests for other classes
            if (studentClass && !isTargetedToClass(item, studentClass)) {
              return false;
            }
            return true;
          });

          if (validTestAnnouncements.length > 0) {
            const top = validTestAnnouncements[0];
            const desc = top.description || '';
            const now = new Date();

            // Check if alert has stopped / expired
            let isExpired = false;
            const expiryMatch = desc.match(/(?:Valid Until|Stop Date|Expiry)\s*:\s*([^\n|]+)/i);
            if (expiryMatch) {
              const expDate = new Date(expiryMatch[1].trim());
              expDate.setHours(23, 59, 59, 999);
              if (!isNaN(expDate.getTime()) && now > expDate) {
                isExpired = true;
              }
            }

            // Check if day to be shown to students has arrived
            let notYetVisible = false;
            const showMatch = desc.match(/(?:Show From|Start Date)\s*:\s*([^\n|]+)/i);
            if (showMatch) {
              const showDate = new Date(showMatch[1].trim());
              showDate.setHours(0, 0, 0, 0);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              if (!isNaN(showDate.getTime()) && today < showDate) {
                notYetVisible = true;
              }
            }

            if (!isExpired && !notYetVisible) {
              const dateMatch = desc.match(/Exam Date:\s*([^\n|]+)/i);
              const syllabusMatch = desc.match(/Syllabus:\s*([^\n]+)/i);
              const venueMatch = desc.match(/(?:Venue|Room)\s*:\s*([^\n|]+)/i);
              const marksMatch = desc.match(/(?:Max|Total)\s*Marks\s*:\s*([^\n|]+)/i);
              const alertObj = {
                id: top.id,
                type: 'test_paper',
                title: top.title.replace(/^\[(Exam Alert|Test Alert|Test Paper)[^\]]*\]\s*/i, ''),
                shortDesc: desc,
                date: dateMatch ? dateMatch[1].trim() : (top.time_label || 'Upcoming Exam'),
                time: '',
                room: venueMatch ? venueMatch[1].trim() : 'Exam Hall',
                maxMarks: marksMatch ? parseInt(marksMatch[1].trim(), 10) || 100 : 100,
                syllabus: syllabusMatch ? syllabusMatch[1].split(',').map((s: string) => s.trim()) : ['Full Chapters'],
                instructions: [
                  'Arrive 15 minutes before the exam starts.',
                  'Carry blue/black ballpoint pens.',
                ],
                updatedBy: 'Examination Controller',
                expiryDate: expiryMatch ? expiryMatch[1].trim() : undefined,
                showFromDate: showMatch ? showMatch[1].trim() : undefined,
                classTag: top.title?.match(/\[Class\s*(\d{1,2})\]/i)?.[0] || undefined,
              };
              await setCached(key, alertObj);
              return alertObj;
            }
          }
        }
        // If DB returned successfully and no active alerts exist for this class, CLEAR cache & return null!
        await setCached(key, null);
        return null;
      }
    } catch (e) {
      // only if network request threw an exception (offline)
    }

    const cached = await getCached<any>(key);
    if (!cached) return null;

    // Discard any cached holiday or no-class notice that was incorrectly stored as a test paper alert
    const cachedTitle = (cached.title || '').toLowerCase();
    const cachedDesc = (cached.shortDesc || '').toLowerCase();
    if (
      cachedTitle.includes('holiday') ||
      cachedDesc.includes('holiday') ||
      cachedTitle.includes('no class') ||
      cachedDesc.includes('no class')
    ) {
      await setCached(key, null);
      return null;
    }

    // Verify targeted class on cached item
    if (studentClass && !isTargetedToClass(cached, studentClass)) {
      return null;
    }

    // If alert has expiryDate and it has passed, auto-remove it
    if (cached.expiryDate) {
      const expiry = new Date(cached.expiryDate);
      const now = new Date();
      if (now > expiry) {
        await setCached(key, null);
        return null;
      }
    }

    // Also check by date string (e.g. 'Monday, 22 Sep 2026')
    if (cached.date) {
      try {
        const alertDate = new Date(cached.date);
        const now = new Date();
        if (!isNaN(alertDate.getTime()) && alertDate < now) {
          const diffMs = now.getTime() - alertDate.getTime();
          if (diffMs > 24 * 60 * 60 * 1000) {
            await setCached(key, null);
            return null;
          }
        }
      } catch {}
    }

    return cached;
  },

  isTargetedToClass(item: any, studentClass?: string): boolean {
    return isTargetedToClass(item, studentClass);
  },

  async saveAcademicAlert(alert: any) {
    const classSuffix = alert.classTag ? `_${alert.classTag.replace(/\s+/g, '_').toLowerCase()}` : '';
    const key = `academic_alert_active${classSuffix}`;
    await setCached(key, alert);
    await setCached('academic_alert_active', alert);

    // Push to Supabase announcements and academic_alerts
    try {
      const classPrefix = alert.classTag && !alert.title?.includes(alert.classTag) ? `[${alert.classTag}] ` : '';
      await supabase.from('announcements').insert({
        title: `[Test Alert] ${classPrefix}${alert.title}`,
        description: `Exam Date: ${alert.date} | Time: ${alert.time} | Room: ${alert.room}\nSyllabus: ${Array.isArray(alert.syllabus) ? alert.syllabus.join(' • ') : alert.syllabus}`,
        icon: 'calendar',
        icon_bg: '#EBF3FF',
        icon_color: '#1A56DB',
        time_label: 'Just now',
        important: true,
      });
    } catch {}
    try {
      await supabase.from('academic_alerts').upsert({
        id: alert.id,
        type: alert.type,
        title: alert.title,
        short_desc: alert.shortDesc,
        date: alert.date,
        time: alert.time,
        room: alert.room,
        max_marks: alert.maxMarks,
        syllabus: alert.syllabus,
        instructions: alert.instructions,
        updated_by: alert.updatedBy,
        expiry_date: alert.expiryDate,
        class_tag: alert.classTag,
        is_active: true,
      });
    } catch {}
    return alert;
  },

  async clearAcademicAlert() {
    const key = 'academic_alert_active';
    await setCached(key, null);
    try {
      await supabase.from('academic_alerts').update({ is_active: false }).eq('is_active', true);
    } catch {}
  },

  // Save attendance record for a student (called from faculty portal) -> syncs to student view & Supabase
  async saveAttendance(
    rollNo: string,
    date: string,
    subject: string,
    classLabel: string,
    status: 'P' | 'A',
    meta?: SessionAttendanceMeta
  ) {
    const cacheKey = `attendance_${rollNo}`;
    const existing = (await getCached<any>(cacheKey)) || { overall: 0, attended: 0, total: 0, history: [], todaySubjects: [] };

    const timeSlotStr = meta?.timeSlot || 'Class Session';
    const classIdStr = meta?.classId || '';
    const sessionTypeStr = meta?.sessionType || 'Regular Class';

    // Format entry
    const historyEntry = {
      date,
      subjects: subject,
      time: timeSlotStr,
      classId: classIdStr,
      sessionType: sessionTypeStr,
      score: status === 'P' ? '1/1' : '0/1',
      status: status === 'P' ? 'full' : 'absent',
      class: classLabel,
    };

    // Filter duplicate session entry: only replace if matching the exact same session slot (classId or date+subject+timeSlot)
    const isSameHistorySession = (h: any) => {
      if (h.date !== date) return false;
      if (classIdStr && h.classId) {
        return h.classId === classIdStr;
      }
      const sameSub = (h.subjects || h.subject || '').trim().toLowerCase() === subject.trim().toLowerCase();
      if (!sameSub) return false;
      if (timeSlotStr !== 'Class Session' && h.time && h.time !== 'Class Session') {
        return h.time.trim().toLowerCase() === timeSlotStr.trim().toLowerCase();
      }
      return timeSlotStr === 'Class Session' || !h.time || h.time === 'Class Session';
    };

    const prevHistory = (existing.history || []).filter((h: any) => !isSameHistorySession(h));
    const history = [historyEntry, ...prevHistory].slice(0, 60);
    const attended = history.filter((h: any) => h.status === 'full').length;
    const total = history.length;
    const overall = total > 0 ? Math.round((attended / total) * 100) : 0;

    // Update today's subjects / active day sessions
    const isSameTodaySession = (s: any) => {
      if (classIdStr && s.classId) {
        return s.classId === classIdStr;
      }
      const sameSub = (s.subject || '').trim().toLowerCase() === subject.trim().toLowerCase();
      if (!sameSub) return false;
      if (timeSlotStr !== 'Class Session' && s.time && s.time !== 'Class Session') {
        return s.time.trim().toLowerCase() === timeSlotStr.trim().toLowerCase();
      }
      return timeSlotStr === 'Class Session' || !s.time || s.time === 'Class Session';
    };

    const prevTodaySubjects = (existing.todaySubjects || []).filter((s: any) => !isSameTodaySession(s));
    const todaySubjects = [
      {
        id: classIdStr || `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        classId: classIdStr,
        subject,
        time: timeSlotStr,
        sessionType: sessionTypeStr,
        status: status === 'P' ? 'present' : 'absent',
        date,
      },
      ...prevTodaySubjects,
    ];

    const updated = { ...existing, overall, attended, total, history, todaySubjects };
    await setCached(cacheKey, updated);

    // 1. Sync to Supabase attendance_records matching table columns
    try {
      await supabase.from('attendance_records').upsert({
        roll_no: rollNo,
        overall,
        attended,
        total,
        today_subjects: todaySubjects,
        history,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'roll_no' });
    } catch (e) {
      console.warn('[Attendance Sync] Error saving to Supabase attendance_records:', e);
    }

    return updated;
  },

  // Batch save attendance for a full class (from faculty submit)
  async saveBatchAttendance(
    students: { rollNo: string; name: string; status: 'P' | 'A' }[],
    date: string,
    subject: string,
    classLabel: string,
    meta?: SessionAttendanceMeta
  ) {
    for (const stu of students) {
      await this.saveAttendance(stu.rollNo, date, subject, classLabel, stu.status, meta);
    }
  },

  // ─── TESTS & EXAM PAPERS MANAGEMENT ──────────────────────────────────────────

  // Fetch all teacher tests (persisted in cache & synchronized)
  async getTests(classTag?: string): Promise<any[]> {
    const key = 'teacher_tests';
    const cached = await getCached<any[]>(key);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      // Purge any test items referencing Madhusudanan
      const valid = cached.filter((t) => !JSON.stringify(t).includes('Madhusudanan'));
      if (valid.length !== cached.length) {
        await setCached(key, valid);
      }
      if (classTag) {
        return valid.filter((t) => t.classTag === classTag);
      }
      return valid;
    }
    // Return empty when no test papers exist (no mock data)
    return [];
  },

  async clearAllTests(): Promise<void> {
    await setCached('teacher_tests', []);
    await setCached('academic_alert_active', null);
  },

  async deleteTest(testId: string, testItem?: any): Promise<any[]> {
    const key = 'teacher_tests';
    const all = (await getCached<any[]>(key)) || [];
    const testTitle = testItem?.title || '';
    const updated = all.filter((t) => t.id !== testId && (!testTitle || t.title !== testTitle));
    await setCached(key, updated);

    // 1. Clear alert banner if it was published
    try {
      const alertKey = 'academic_alert_active';
      const activeAlert = await getCached<any>(alertKey);
      if (
        activeAlert &&
        (activeAlert.id === 'alert-' + testId ||
          activeAlert.id === testId ||
          (testTitle && activeAlert.title === testTitle))
      ) {
        await setCached(alertKey, null);
      }
    } catch {}

    // 2. Delete from Supabase announcements table
    try {
      if (testTitle) {
        await supabase
          .from('announcements')
          .delete()
          .or(`title.ilike.%${testTitle}%,description.ilike.%${testTitle}%`);
      }
      if (testId && !testId.startsWith('test-')) {
        await supabase.from('announcements').delete().eq('id', testId);
      }
    } catch (e) {
      console.warn('Supabase announcements delete error:', e);
    }

    // 3. Delete from Supabase academic_alerts table
    try {
      if (testTitle) {
        await supabase.from('academic_alerts').delete().ilike('title', `%${testTitle}%`);
      }
      if (testId) {
        await supabase.from('academic_alerts').delete().or(`id.eq.${testId},id.eq.alert-${testId}`);
      }
    } catch (e) {
      console.warn('Supabase academic_alerts delete error:', e);
    }

    // 4. Delete from Supabase classes table if test was added to timetable
    try {
      if (testTitle) {
        await supabase.from('classes').delete().or(`time.ilike.%${testTitle}%,status.ilike.%${testTitle}%`);
      }
    } catch (e) {
      console.warn('Supabase classes delete error:', e);
    }

    return updated;
  },

  // Synchronous in-memory access for zero-delay schedule rendering
  getCachedAdminTimetableClasses(): any[] {
    const key = 'admin_timetable_classes';
    if (memoryCache[key] && Array.isArray(memoryCache[key])) {
      return memoryCache[key];
    }
    return [];
  },

  // Fetch all scheduled classes from Supabase admin timetable (with offline cache fallback & fast 2000ms timeout)
  async getAdminTimetableClasses(): Promise<any[]> {
    const key = 'admin_timetable_classes';
    const cached = await getCached<any[]>(key);
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('classes')
          .select('*')
          .order('created_at', { ascending: true }),
        2000
      ) as any;

      if (!error && Array.isArray(data) && data.length > 0) {
        await setCached(key, data);
        return data;
      }
    } catch (e) {
      console.warn('Error fetching timetable from Supabase:', e);
    }
    return cached && Array.isArray(cached) ? cached : [];
  },

  // Fetch teacher uploaded study materials (synced with Supabase & cache)
  async getTeacherMaterials(subject?: string): Promise<any[]> {
    const key = 'teacher_study_materials';
    try {
      const { data, error } = await supabase
        .from('study_materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped = data.map((d: any) => ({
          id: d.id,
          subject: d.subject,
          chapter: d.chapter,
          title: d.title,
          fileName: d.description?.replace('Published ', '') || d.title,
          fileUri: d.file_url || '',
          desc: d.description || '',
          tag: d.tag || "Teacher's Uploaded Notes",
          tagColor: d.tag_color || '#EBF3FF',
          size: d.size || '1.5 MB',
          icon: d.icon || 'document-text-outline',
          iconBg: d.icon_bg || '#EBF3FF',
          iconColor: d.icon_color || '#0284C7',
          uploadedAt: d.created_at ? new Date(d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Published',
        }));
        await setCached(key, mapped);
        if (subject && subject !== 'All') {
          return mapped.filter((m) => m.subject?.toLowerCase() === subject.toLowerCase());
        }
        return mapped;
      }
    } catch (e) {
      console.warn('Error fetching materials from Supabase:', e);
    }

    const cached = await getCached<any[]>(key);
    if (cached && Array.isArray(cached)) {
      if (subject && subject !== 'All') {
        return cached.filter((m) => m.subject?.toLowerCase() === subject.toLowerCase());
      }
      return cached;
    }
    return [];
  },

  async saveTeacherMaterial(material: any): Promise<any[]> {
    const key = 'teacher_study_materials';
    const existing = (await getCached<any[]>(key)) || [];
    const updated = [material, ...existing];
    await setCached(key, updated);

    // Also persist to Supabase study_materials
    try {
      await supabase.from('study_materials').insert({
        subject: material.subject,
        chapter: material.chapter,
        title: material.title,
        description: material.desc || `Published ${material.fileName || material.title}`,
        tag: material.tag || "Teacher's Uploaded Notes",
        tag_color: material.tagColor || '#EBF3FF',
        size: material.size || '1.5 MB',
        icon: material.icon || 'document-text-outline',
        icon_bg: material.iconBg || '#EBF3FF',
        icon_color: material.iconColor || '#0284C7',
        file_url: material.fileUri || null,
      });
    } catch (e) {
      console.warn('Supabase study_materials insert warning:', e);
    }

    return updated;
  },

  async deleteTeacherMaterial(materialId: string): Promise<any[]> {
    const key = 'teacher_study_materials';
    const existing = (await getCached<any[]>(key)) || [];
    const updated = existing.filter((m) => m.id !== materialId);
    await setCached(key, updated);

    // Delete from Supabase study_materials
    try {
      await supabase.from('study_materials').delete().eq('id', materialId);
    } catch (e) {
      console.warn('Supabase study_materials delete warning:', e);
    }

    return updated;
  },

  // Save new test or update existing test paper
  async saveTest(testItem: any, broadcastAlert: boolean = false) {
    const key = 'teacher_tests';
    const all = (await getCached<any[]>(key)) || [];
    const idx = all.findIndex((t) => t.id === testItem.id);
    let updated: any[];
    if (idx >= 0) {
      updated = [...all];
      updated[idx] = testItem;
    } else {
      updated = [testItem, ...all];
    }
    await setCached(key, updated);

    // Broadcast test alert to student home dashboard only when approved/instructed
    if (broadcastAlert) {
      try {
        await this.saveAcademicAlert({
          id: 'alert-' + testItem.id,
          type: 'test_paper',
          badge: 'TEST PAPER ALERT',
          title: testItem.title,
          shortDesc: Array.isArray(testItem.syllabus) ? testItem.syllabus.slice(0, 2).join(' • ') : testItem.syllabus,
          date: testItem.dateStr,
          time: testItem.timeStr,
          room: testItem.roomStr,
          syllabus: testItem.syllabus,
          maxMarks: testItem.maxMarks,
          instructions: [
            'Reporting time is strictly 15 minutes before test commencement.',
            'Bring geometry box and scientific calculator if required.',
            'Syllabus verified by Super Admin Mr. Abhai Kumar.',
          ],
          updatedBy: 'Mr. Abhai Kumar (Super Admin)',
          updatedAt: 'Just now',
        });
      } catch {}
    }

    return updated;
  },

  // Update a student's marks on a test & sync to student's progress and notifications
  async updateTestMarks(testId: string, studentId: string, rollNo: string, marks: number, maxMarks: number, grade: string, color: string) {
    const key = 'teacher_tests';
    const all = (await getCached<any[]>(key)) || [];
    let updatedTestTitle = '';

    const updatedTests = all.map((t) => {
      if (t.id === testId) {
        updatedTestTitle = t.title;
        const updatedStudents = (t.students || []).map((s: any) =>
          s.id === studentId || s.roll === rollNo ? { ...s, marks, grade, color } : s
        );
        return { ...t, students: updatedStudents, isEvaluated: true };
      }
      return t;
    });

    await setCached(key, updatedTests);

    // Sync student progress
    if (rollNo) {
      const progressKey = `progress_${rollNo}`;
      const existingProg = (await getCached<any>(progressKey)) || {
        testsAttended: 0,
        highestScore: 0,
        topPercent: 0,
        totalStudents: 120,
        improvement: 0,
        chartLabels: [],
        yourScores: [],
        avgScores: [],
        accuracy: 0,
        incorrect: 0,
        gainMarks: 0,
      };

      const yourScores = [...(existingProg.yourScores || []), marks];
      const chartLabels = [...(existingProg.chartLabels || []), `T${yourScores.length}`];
      const avgScores = [...(existingProg.avgScores || []), Math.round(maxMarks * 0.65)];
      const highestScore = Math.max(existingProg.highestScore || 0, marks);
      const testsAttended = (existingProg.testsAttended || 0) + 1;
      const accuracy = Math.round((marks / maxMarks) * 100);

      const updatedProg = {
        ...existingProg,
        testsAttended,
        highestScore,
        accuracy,
        yourScores,
        chartLabels,
        avgScores,
        improvement: Math.min(25, (existingProg.improvement || 0) + 4),
        gainMarks: marks,
      };

      await setCached(progressKey, updatedProg);

      // Add test result notification for student
      try {
        const notifsKey = `notifs_${rollNo}`;
        const notifs = (await getCached<any[]>(notifsKey)) || [];
        notifs.unshift({
          id: `notif-${Date.now()}`,
          title: 'Test Result Published',
          desc: `Your marks for ${updatedTestTitle || 'Test'}: ${marks}/${maxMarks} (${grade}). Verified by Super Admin.`,
          time: 'Just now',
          unread: true,
          type: 'result',
        });
        await setCached(notifsKey, notifs);
      } catch {}
    }

    return updatedTests;
  },

  // Student fetches assigned tests & evaluation scores
  async getStudentTests(rollNo: string, classGrade?: string) {
    const allTests = await this.getTests();
    return allTests.map((t) => {
      const studentEntry = (t.students || []).find((s: any) => s.roll === rollNo || s.name === 'Arjun S');
      return {
        ...t,
        studentMarks: studentEntry ? studentEntry.marks : null,
        studentGrade: studentEntry ? studentEntry.grade : null,
        studentColor: studentEntry ? studentEntry.color : null,
        isStudentEvaluated: studentEntry && studentEntry.marks > 0,
      };
    });
  },

  // Mark single notification read
  async markNotificationRead(id: string) {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    } catch (e) {
      // ignore
    }
  },

  // Mark all notifications read for student
  async markAllNotificationsRead(rollNo: string) {
    const cacheKey = `notifs_${rollNo}`;
    const cached = await getCached<any[]>(cacheKey);
    if (cached) {
      const updated = cached.map((n) => ({ ...n, unread: false }));
      await setCached(cacheKey, updated);
    }
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('roll_no', rollNo);
    } catch (e) {
      // ignore
    }
  },



  async addAnnouncement(ann: {
    title: string;
    desc: string;
    tag?: string;
    author?: string;
    important?: boolean;
    targetClasses?: string;
    pendingApproval?: boolean;
  }) {
    const isPending = ann.pendingApproval ?? true;
    const classPrefix = ann.targetClasses && ann.targetClasses !== 'All' ? `[${ann.targetClasses}] ` : '';
    const dbTitle = isPending ? `[PENDING APPROVAL - ${ann.targetClasses || 'All Classes'}] ${ann.title}` : `${classPrefix}${ann.title}`;
    const authorLine = ann.author ? `\n\nSubmitted by: ${ann.author}` : '';

    try {
      await supabase.from('announcements').insert({
        title: dbTitle,
        description: (ann.desc || '') + authorLine,
        icon: 'megaphone',
        icon_bg: '#EBF3FF',
        icon_color: '#1A56DB',
        time_label: isPending ? 'Pending Approval' : 'Just now',
        important: ann.important || false,
      });

      if (isPending) {
        // Also notify admin in notifications table
        await supabase.from('notifications').insert({
          roll_no: 'ADMIN',
          title: `Faculty Announcement for Approval: ${ann.title}`,
          message: `Submitted by ${ann.author || 'Faculty'} for ${ann.targetClasses || 'All Classes'}.`,
          time_label: 'Just now',
          type: 'approval_request',
        });
      }
    } catch (e) {
      console.warn('Error inserting announcement to Supabase:', e);
    }

    if (!isPending) {
      const key = 'eduhome_announcements';
      const existing = await this.getAnnouncements();
      const newAnn = {
        id: 'ann-' + Date.now(),
        title: `${classPrefix}${ann.title}`,
        desc: ann.desc,
        icon: 'megaphone',
        iconBg: '#EBF3FF',
        iconColor: '#1A56DB',
        time: 'Just now',
        important: ann.important || false,
        tag: ann.tag || 'Faculty Broadcast',
        author: ann.author || 'Faculty Member',
      };
      const updated = [newAnn, ...existing];
      await setCached(key, updated);
      return updated;
    }

    return [];
  },

  // Student Teacher Opinions (Monitored & Approved by Main Admin)
  async getStudentTeacherOpinions(rollNo: string = '2024-JEE-0842') {
    const key = `teacher_opinions_${rollNo}`;
    const cached = await getCached<any[]>(key);
    if (cached && cached.length > 0) return cached;

    const defaultOpinions = [
      {
        id: 'to-1',
        rollNo,
        studentName: 'Arjun S',
        teacher: 'Mr. Abhai Kumar',
        role: 'Super Admin & Physics Head',
        subject: 'Physics',
        remark: 'Arjun is showing remarkable consistency in Optics and Wave theory. Needs slight attention on numerical step derivations.',
        status: 'approved',
        submittedAt: '12 Sep 2026',
        approvedBy: 'Mr. Abhai Kumar (Main Admin)',
      },
      {
        id: 'to-2',
        rollNo,
        studentName: 'Arjun S',
        teacher: 'Dr. Sunita Rao',
        role: 'Faculty Member',
        subject: 'Chemistry',
        remark: 'Good progress in chemical kinetics and balancing complex equations. Keep practicing previous years’ board papers.',
        status: 'approved',
        submittedAt: '14 Sep 2026',
        approvedBy: 'Mr. Abhai Kumar (Main Admin)',
      },
      {
        id: 'to-3',
        rollNo,
        studentName: 'Arjun S',
        teacher: 'Prof. K V Nair',
        role: 'Faculty Member',
        subject: 'Mathematics',
        remark: 'Attended 100% of calculus & integration classes this term. Solid conceptual foundation for entrance examinations.',
        status: 'approved',
        submittedAt: '16 Sep 2026',
        approvedBy: 'Mr. Abhai Kumar (Main Admin)',
      },
    ];

    await setCached(key, defaultOpinions);
    return defaultOpinions;
  },

  async addTeacherOpinion(opinion: {
    rollNo: string;
    studentName: string;
    teacher: string;
    subject: string;
    remark: string;
  }) {
    const pendingKey = 'pending_teacher_opinions';
    const existing = (await getCached<any[]>(pendingKey)) || [];
    const newOpinion = {
      id: 'top-' + Date.now(),
      ...opinion,
      status: 'pending_review',
      submittedAt: 'Just now',
    };
    const updatedPending = [newOpinion, ...existing];
    await setCached(pendingKey, updatedPending);
    return newOpinion;
  },

  async getPendingTeacherOpinions() {
    const pendingKey = 'pending_teacher_opinions';
    const pending = await getCached<any[]>(pendingKey);
    return pending || [];
  },

  async approveTeacherOpinion(opinionId: string) {
    const pendingKey = 'pending_teacher_opinions';
    const pending = (await getCached<any[]>(pendingKey)) || [];
    const target = pending.find((o) => o.id === opinionId);
    if (!target) return null;

    // Remove from pending
    const remaining = pending.filter((o) => o.id !== opinionId);
    await setCached(pendingKey, remaining);

    // Add to student approved opinions
    const studentOpinionsKey = `teacher_opinions_${target.rollNo}`;
    const studentOpinions = (await this.getStudentTeacherOpinions(target.rollNo)) || [];
    const approvedItem = {
      ...target,
      status: 'approved',
      approvedBy: 'Mr. Abhai Kumar (Main Admin)',
      approvedAt: 'Just now',
    };
    const updatedStudentOpinions = [approvedItem, ...studentOpinions];
    await setCached(studentOpinionsKey, updatedStudentOpinions);

    return approvedItem;
  },

  // Full Historical Payment Records (For "View All" in Fees)
  async getFullPaymentHistory(rollNo: string = '2024-JEE-0842') {
    try {
      const { data, error } = await supabase
        .from('fees_records')
        .select('recent_payments')
        .eq('roll_no', rollNo)
        .maybeSingle();

      if (data && Array.isArray(data.recent_payments)) {
        // Return only admin-approved/verified payments
        return data.recent_payments.filter((p: any) => p.status !== 'pending_verification');
      }
    } catch (e) {
      console.warn('Error fetching payment history:', e);
    }
    return [];
  },

  // Invalidate Academic Alert & Announcements Cache
  async clearAcademicAlertCache() {
    await setCached('academic_alert_active', null);
    await setCached('eduhome_announcements', []);
  },
};

