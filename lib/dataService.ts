import { supabase } from './supabase';
import * as SecureStore from 'expo-secure-store';
import {
  studentData as mockStudent,
  todaysClasses as mockClasses,
  attendanceData as mockAttendance,
  feesData as mockFees,
  progressData as mockProgress,
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
    const val = await SecureStore.getItemAsync(CACHE_PREFIX + key);
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
    await SecureStore.setItemAsync(CACHE_PREFIX + key, JSON.stringify(data));
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
}

export const DataService = {
  // Store session locally
  async saveCurrentStudent(student: StudentProfile) {
    try {
      await SecureStore.setItemAsync(CURRENT_STUDENT_KEY, JSON.stringify(student));
    } catch (e) {
      console.warn('Failed to save student session', e);
    }
  },

  async getCurrentStudent(): Promise<StudentProfile> {
    try {
      const stored = await SecureStore.getItemAsync(CURRENT_STUDENT_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to read student session', e);
    }
    return {
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
  },

  async hasSavedSession(): Promise<boolean> {
    try {
      const stored = await SecureStore.getItemAsync(CURRENT_STUDENT_KEY);
      return !!stored;
    } catch {
      return false;
    }
  },

  async clearCurrentStudent() {
    try {
      await SecureStore.deleteItemAsync(CURRENT_STUDENT_KEY);
    } catch (e) {
      console.warn('Failed to clear student session', e);
    }
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
    const current = await this.getCurrentStudent();

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
          const key = `${normSubject}_${normDate}`;
          if (!seen.has(key)) {
            seen.add(key);
            deduplicated.push(c);
          }
        }

        // Sort chronologically
        deduplicated.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

        const mapped = deduplicated.map((c: any) => ({
          id: c.id,
          time: c.time,
          subject: c.subject,
          status: c.status || 'upcoming',
          published: c.published !== false,
          class_date: c.class_date,
          class_grade: c.class_grade,
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
          const key = `${normSubject}_${normDate}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        return list.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      }
    }

    return [];
  },

  // Fetch Announcements — Network-First with Cache Fallback
  async getAnnouncements(forceRefresh = false) {
    const cacheKey = 'eduhome_announcements';
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
          const mapped = data.map((a: any) => ({
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
          await setCached(cacheKey, mapped);
          return mapped;
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
    if (cached) return cached;
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

        // Only paid if current_due is 0 AND at least one payment was verified/approved by admin
        const isPaid = Number(data.current_due) === 0 && approvedPayments.length > 0;
        const computedStatus = isPaid ? 'paid' : (hasPendingVerification ? 'pending_verification' : 'due');

        const mapped = {
          monthlyFee: studentFeeInfo.monthlyFee,
          currentDue: isPaid ? 0 : studentFeeInfo.monthlyFee,
          actualDue: isPaid ? 0 : studentFeeInfo.monthlyFee,
          dueDate: data.due_date || studentDueInfo.dueDate,
          joiningDate: data.joining_date || studentFeeInfo.joiningDate || studentDueInfo.dueDate,
          daysLeft: isPaid ? 0 : studentDueInfo.daysLeft,
          isPaid,
          status: computedStatus as 'due' | 'pending_verification' | 'paid',
          subjects: studentFeeInfo.subjects,
          upiId: 'devitintu12345@oksbi',
          payeeName: 'EduHome Tuition Center',
          loyaltyMonths: data.loyalty_months || mockFees.loyaltyMonths,
          monthsPaidOnTime: isPaid ? (data.months_paid_on_time ?? studentFeeInfo.monthsPaidOnTime) : 0,
          recentPayments: approvedPayments,
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

  // Student submits UPI payment for verification
  async submitFeePayment(rollNo: string, utr?: string) {
    const cacheKey = `fees_${rollNo}`;
    const current = (await getCached<any>(cacheKey)) || mockFees;
    const studentFeeInfo = (EDUSYNC_FEES as any)[rollNo];
    const studentName = studentFeeInfo?.name || (current as any).studentName || (rollNo === '2024-JEE-0842' ? 'Arjun S' : rollNo);
    const feeDueAmount = current.monthlyFee || current.actualDue || studentFeeInfo?.monthlyFee || 4000;
    const utrVal = utr || `UPI-${Date.now().toString().slice(-6)}`;

    const updated = {
      ...current,
      status: 'pending_verification' as const,
      utr: utrVal,
      submittedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    await setCached(cacheKey, updated);

    // Save pending verification to admin queue
    const adminKey = 'admin_pending_fees';
    const pendingList = (await getCached<any[]>(adminKey)) || [];
    const exists = pendingList.find((p) => p.rollNo === rollNo);
    if (!exists) {
      pendingList.push({
        rollNo,
        studentName,
        amount: feeDueAmount,
        upiId: 'devitintu12345@oksbi',
        utr: updated.utr,
        submittedAt: updated.submittedAt,
      });
      await setCached(adminKey, pendingList);
    }

    const pendingPaymentItem = {
      month: 'SEP',
      fullMonth: 'September 2026',
      amount: feeDueAmount,
      utr: utrVal,
      submittedAt: new Date().toISOString(),
      status: 'pending_verification',
      studentName,
      rollNo,
    };

    try {
      const { data: record } = await supabase.from('fees_records').select('recent_payments').eq('roll_no', rollNo).maybeSingle();
      const existingPayments = Array.isArray(record?.recent_payments) ? record.recent_payments : [];
      const updatedPayments = [pendingPaymentItem, ...existingPayments.filter((p: any) => p.status !== 'pending_verification')];
      await supabase
        .from('fees_records')
        .update({
          recent_payments: updatedPayments,
          updated_at: new Date().toISOString(),
        })
        .eq('roll_no', rollNo);
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

    const newPayment = {
      month: 'SEP',
      fullMonth: 'September 2026',
      paidOn: paidOnStr,
      amount: approvedAmount,
      onTime: true,
      status: 'Verified by Center Admin',
      receiptNo: `REC-2026-SEP-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    const updated = {
      ...current,
      currentDue: 0,
      isPaid: true,
      status: 'paid' as const,
      daysLeft: 0,
      monthsPaidOnTime: (current.monthsPaidOnTime || 2) + 1,
      loyaltyMonths: [
        { label: 'Month 1', earned: true },
        { label: 'Month 2', earned: true },
        { label: 'Month 3', earned: true },
      ],
      recentPayments: [newPayment, ...(current.recentPayments || []).filter((p: any) => p.status !== 'pending_verification')],
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
      const { data: record } = await supabase.from('fees_records').select('recent_payments').eq('roll_no', rollNo).maybeSingle();
      const existingPayments = Array.isArray(record?.recent_payments) ? record.recent_payments : [];
      const updatedPayments = [newPayment, ...existingPayments.filter((p: any) => p.status !== 'pending_verification')];
      await supabase
        .from('fees_records')
        .update({
          current_due: 0,
          recent_payments: updatedPayments,
          updated_at: new Date().toISOString(),
        })
        .eq('roll_no', rollNo);
    } catch {}

    return updated;
  },


  // Super Admin marks fee paid via cash directly from student roster or admin app
  async markFeeAsPaidCash(rollNo: string, amount: number, verifiedBy: string = 'Mr. R Madhusudanan (Super Admin)') {
    const cacheKey = `fees_${rollNo}`;
    const current = (await getCached<any>(cacheKey)) || mockFees;
    const now = new Date();
    const paidOnStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const curMonth = monthNames[now.getMonth()].toUpperCase();
    const curFullMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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
      { id: '4', title: 'New Study Material', desc: 'Notes for Chemistry Chapter 1 uploaded by Mr. R Madhusudanan.', time: '2d ago', unread: false, type: 'material' },
    ];
  },

  // Academic / Test Paper Alert (Shown on Student Home above Attendance)
  async getAcademicAlert() {
    const key = 'academic_alert_active';

    // 1. First, check dedicated academic_alerts table (guaranteed test papers from admin & faculty)
    try {
      const { data: acData, error: acErr } = (await withTimeout(
        supabase
          .from('academic_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1),
        2500
      )) as any;

      if (acData && acData.length > 0 && !acErr) {
        const top = acData[0];
        const now = new Date();
        let isExpired = false;
        if (top.expiry_date) {
          const expDate = new Date(top.expiry_date);
          if (!isNaN(expDate.getTime()) && now > expDate) {
            isExpired = true;
          }
        }

        if (!isExpired) {
          const alertObj = {
            id: top.id,
            type: 'test_paper',
            title: top.title,
            shortDesc: top.short_desc || (Array.isArray(top.syllabus) ? top.syllabus.join(' • ') : top.syllabus) || 'Test Paper Alert',
            date: top.date || 'Upcoming Test',
            time: top.time || '04:30 PM - 06:00 PM',
            room: top.room || 'Room 204',
            maxMarks: top.max_marks || 100,
            syllabus: Array.isArray(top.syllabus) ? top.syllabus : (top.syllabus ? [top.syllabus] : ['Full Chapters Revision']),
            instructions: top.instructions || [
              'Reporting time is strictly 15 minutes before test commencement.',
              'Bring geometry box and scientific calculator if required.',
              'Syllabus verified by Super Admin Mr. R Madhusudanan.',
            ],
            updatedBy: top.updated_by || 'Faculty / Admin',
            expiryDate: top.expiry_date,
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
          .or('title.ilike.%[Exam Alert]%,title.ilike.%[Test Alert]%,title.ilike.%[Test Paper]%')
          .order('created_at', { ascending: false })
          .limit(5),
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
            return t.includes('[exam alert') || t.includes('[test alert') || t.includes('[test paper');
          });

          if (validTestAnnouncements.length > 0) {
            const top = validTestAnnouncements[0];
            const desc = top.description || '';
            const now = new Date();

            let isExpired = false;
            const expiryMatch = desc.match(/Valid Until:\s*([^\n|]+)/i) || desc.match(/Expiry:\s*([^\n|]+)/i);
            if (expiryMatch) {
              const expDate = new Date(expiryMatch[1].trim());
              if (!isNaN(expDate.getTime()) && now > expDate) {
                isExpired = true;
              }
            }

            if (!isExpired) {
              const dateMatch = desc.match(/Exam Date:\s*([^\n|]+)/i);
              const syllabusMatch = desc.match(/Syllabus:\s*([^\n]+)/i);
              const alertObj = {
                id: top.id,
                type: 'test_paper',
                title: top.title.replace(/^\[(Exam Alert|Test Alert|Test Paper)[^\]]*\]\s*/i, ''),
                shortDesc: desc,
                date: dateMatch ? dateMatch[1].trim() : (top.time_label || 'Upcoming Exam'),
                time: '04:30 PM - 06:00 PM',
                room: 'Exam Hall 1',
                maxMarks: 100,
                syllabus: syllabusMatch ? syllabusMatch[1].split(',').map((s: string) => s.trim()) : ['Full Chapters'],
                instructions: ['Arrive 15 minutes before the exam starts.', 'Carry blue/black ballpoint pens.', 'Calculator not permitted.'],
                updatedBy: 'Examination Controller',
                expiryDate: expiryMatch ? expiryMatch[1].trim() : undefined,
              };
              await setCached(key, alertObj);
              return alertObj;
            }
          }
        }
        // If DB returned successfully and no active alerts exist (admin deleted/cancelled it), CLEAR cache & return null!
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

  async saveAcademicAlert(alert: any) {
    const key = 'academic_alert_active';
    await setCached(key, alert);
    // Push to Supabase announcements and academic_alerts
    try {
      await supabase.from('announcements').insert({
        title: `[Test Alert] ${alert.title}`,
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
  async saveAttendance(rollNo: string, date: string, subject: string, classLabel: string, status: 'P' | 'A') {
    const cacheKey = `attendance_${rollNo}`;
    const existing = (await getCached<any>(cacheKey)) || { overall: 0, attended: 0, total: 0, history: [], todaySubjects: [] };

    // Format entry
    const historyEntry = {
      date,
      subjects: subject,
      score: status === 'P' ? '1/1' : '0/1',
      status: status === 'P' ? 'full' : 'absent',
      class: classLabel,
    };

    // Filter duplicate if same day & subject exists
    const prevHistory = (existing.history || []).filter((h: any) => !(h.date === date && h.subjects === subject));
    const history = [historyEntry, ...prevHistory].slice(0, 60);
    const attended = history.filter((h: any) => h.status === 'full').length;
    const total = history.length;
    const overall = total > 0 ? Math.round((attended / total) * 100) : 0;

    // Update today's subjects
    const prevTodaySubjects = (existing.todaySubjects || []).filter((s: any) => s.subject !== subject);
    const todaySubjects = [
      {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        subject,
        time: 'Class Session',
        status: status === 'P' ? 'present' : 'absent',
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

    // 2. Also update student classes table for today so student home screen status reflects present / absent
    try {
      await supabase
        .from('classes')
        .update({ status: status === 'P' ? 'present' : 'absent' })
        .eq('roll_no', rollNo)
        .ilike('subject', `%${subject}%`);
    } catch {}

    // 3. Update cached classes for student
    try {
      const clsKey = `classes_${rollNo}`;
      const cachedCls = await getCached<any[]>(clsKey);
      if (cachedCls && Array.isArray(cachedCls)) {
        const updatedCls = cachedCls.map((c) =>
          c.subject?.toLowerCase() === subject.toLowerCase()
            ? { ...c, status: status === 'P' ? 'present' : 'absent' }
            : c
        );
        await setCached(clsKey, updatedCls);
      }
    } catch {}

    return updated;
  },

  // Batch save attendance for a full class (from faculty submit)
  async saveBatchAttendance(students: { rollNo: string; name: string; status: 'P' | 'A' }[], date: string, subject: string, classLabel: string) {
    for (const stu of students) {
      await this.saveAttendance(stu.rollNo, date, subject, classLabel, stu.status);
    }
  },

  // ─── TESTS & EXAM PAPERS MANAGEMENT ──────────────────────────────────────────

  // Fetch all teacher tests (persisted in cache & synchronized)
  async getTests(classTag?: string): Promise<any[]> {
    const key = 'teacher_tests';
    const cached = await getCached<any[]>(key);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      if (classTag) {
        return cached.filter((t) => t.classTag === classTag);
      }
      return cached;
    }
    // Return none/empty when no test papers exist (no mock data)
    return [];
  },

  // Fetch all scheduled classes from Supabase admin timetable
  async getAdminTimetableClasses(): Promise<any[]> {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('classes')
          .select('*')
          .order('created_at', { ascending: true }),
        3000
      ) as any;

      if (!error && Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('Error fetching timetable from Supabase:', e);
    }
    return [];
  },

  // Fetch teacher uploaded study materials (no mock data)
  async getTeacherMaterials(subject?: string): Promise<any[]> {
    const key = 'teacher_study_materials';
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
    return updated;
  },

  // Save new test or update existing test paper
  async saveTest(testItem: any) {
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

    // Broadcast test alert to student home dashboard
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
          'Syllabus verified by Super Admin Mr. R Madhusudanan.',
        ],
        updatedBy: 'Mr. R Madhusudanan (Super Admin)',
        updatedAt: 'Just now',
      });
    } catch {}

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



  async addAnnouncement(ann: { title: string; desc: string; tag?: string; author?: string; important?: boolean }) {
    const key = 'eduhome_announcements';
    const existing = await this.getAnnouncements();
    const newAnn = {
      id: 'ann-' + Date.now(),
      title: ann.title,
      desc: ann.desc,
      icon: 'megaphone',
      iconBg: '#EBF3FF',
      iconColor: '#1A56DB',
      time: 'Just now',
      important: ann.important || false,
      tag: ann.tag || 'Faculty Broadcast',
      author: ann.author || 'Faculty Member (Approved by Main Admin)',
    };
    const updated = [newAnn, ...existing];
    await setCached(key, updated);

    try {
      await supabase.from('announcements').insert({
        title: ann.title,
        description: ann.desc,
        icon: 'megaphone',
        icon_bg: '#EBF3FF',
        icon_color: '#1A56DB',
        time_label: 'Just now',
        important: ann.important || false,
      });
    } catch {}

    return updated;
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
        teacher: 'Mr. R Madhusudanan',
        role: 'Super Admin & Physics Head',
        subject: 'Physics',
        remark: 'Arjun is showing remarkable consistency in Optics and Wave theory. Needs slight attention on numerical step derivations.',
        status: 'approved',
        submittedAt: '12 Sep 2026',
        approvedBy: 'Mr. R Madhusudanan (Main Admin)',
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
        approvedBy: 'Mr. R Madhusudanan (Main Admin)',
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
        approvedBy: 'Mr. R Madhusudanan (Main Admin)',
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
      approvedBy: 'Mr. R Madhusudanan (Main Admin)',
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

