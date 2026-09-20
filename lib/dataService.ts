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
  async getClasses(rollNo: string) {
    const cacheKey = `classes_${rollNo}`;
    const cached = await getCached<any[]>(cacheKey);

    try {
      const query = supabase
        .from('classes')
        .select('*')
        .eq('roll_no', rollNo);

      const { data, error } = await withTimeout(query, 2500) as any;
      if (data && data.length > 0 && !error) {
        const mapped = data.map((c: any) => ({
          id: c.id,
          time: c.time,
          subject: c.subject,
          status: c.status,
          published: c.published !== false,
        }));
        await setCached(cacheKey, mapped);
        return mapped;
      }
    } catch (e) {
      // Timeout or offline
    }

    return cached || mockClasses;
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
      if (data && data.length > 0 && !error) {
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
      }
    } catch (e) {
      console.warn('Network fetch for announcements failed, falling back to cache', e);
    }

    // 2. Offline / timeout fallback to cached announcements
    if (cached && cached.length > 0) return cached;

    const defaultAnnouncements = [
      {
        id: 'ann-1',
        title: 'Parent-Teacher Meeting on 20th Sep',
        desc: 'All students must inform their parents. Timing: 10 AM – 1 PM in Main Hall A.',
        icon: 'megaphone',
        iconBg: '#FEF3F2',
        iconColor: '#F04438',
        time: '2 hours ago',
        important: true,
        tag: 'Admin Notice',
        author: 'Mr. R Madhusudanan (Main Admin)',
      },
      {
        id: 'ann-2',
        title: 'Weekly Test #9 – This Saturday',
        desc: 'Syllabus: Physics Ch-10, Chemistry Ch-1, Maths Ch-4. Arrive 15 mins prior.',
        icon: 'calendar',
        iconBg: '#EBF3FF',
        iconColor: '#1A56DB',
        time: '5 hours ago',
        important: false,
        tag: 'Exam Dept',
        author: 'Examination Controller',
      },
      {
        id: 'ann-3',
        title: '🎉 Arjun S scored Top 8% this month!',
        desc: 'Congratulations! Keep up the excellent board & entrance examination performance.',
        icon: 'trophy',
        iconBg: '#FFFAEB',
        iconColor: '#F79009',
        time: 'Yesterday',
        important: false,
        tag: 'Achievement',
        author: 'Academic Council',
      },
      {
        id: 'ann-4',
        title: 'New Chemistry Reference Guide Uploaded',
        desc: 'Chapter 1 & 2 notes annotated by Dr. Sunita Rao available in Study Materials.',
        icon: 'document-text',
        iconBg: '#F5F3FF',
        iconColor: '#8B5CF6',
        time: '3 days ago',
        important: false,
        tag: 'Study Material',
        author: 'Faculty Team',
      },
    ];

    await setCached(cacheKey, defaultAnnouncements);
    return defaultAnnouncements;
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

    if (cached) {
      return {
        ...cached,
        monthlyFee: cached.monthlyFee || studentFeeInfo.monthlyFee,
        subjects: cached.subjects || studentFeeInfo.subjects,
        joiningDate: cached.joiningDate || studentFeeInfo.joiningDate,
        currentDue: cached.isPaid ? 0 : 1, // Strictly ₹1 test amount for seamless UPI testing
        actualDue: cached.isPaid ? 0 : (cached.monthlyFee || studentFeeInfo.monthlyFee),
        daysLeft: cached.isPaid ? 0 : dueInfo.daysLeft,
        dueDate: dueInfo.dueDate,
        monthsPaidOnTime: cached.monthsPaidOnTime ?? studentFeeInfo.monthsPaidOnTime,
      };
    }

    try {
      const query = supabase
        .from('fees_records')
        .select('*')
        .eq('roll_no', rollNo)
        .single();

      const { data, error } = await withTimeout(query, 2500) as any;
      if (data && !error) {
        const studentDueInfo = this.calculateDueInfo(data.joining_date || data.due_date || studentFeeInfo.joiningDate || 25);
        const mapped = {
          monthlyFee: Number(data.monthly_fee) || studentFeeInfo.monthlyFee,
          currentDue: data.status === 'paid' ? 0 : 1, // Strictly ₹1 test amount
          actualDue: data.status === 'paid' ? 0 : (Number(data.monthly_fee) || studentFeeInfo.monthlyFee),
          dueDate: data.due_date || studentDueInfo.dueDate,
          joiningDate: data.joining_date || studentFeeInfo.joiningDate || studentDueInfo.dueDate,
          daysLeft: studentDueInfo.daysLeft,
          isPaid: data.status === 'paid',
          status: (data.status || 'due') as 'due' | 'pending_verification' | 'paid',
          subjects: data.subjects || studentFeeInfo.subjects,
          upiId: 'devitintu12345@oksbi',
          payeeName: 'EduHome Tuition Center',
          loyaltyMonths: data.loyalty_months || mockFees.loyaltyMonths,
          monthsPaidOnTime: data.months_paid_on_time ?? studentFeeInfo.monthsPaidOnTime,
          recentPayments: data.recent_payments || mockFees.recentPayments,
        };
        await setCached(cacheKey, mapped);
        return mapped;
      }
    } catch (e) {
      // Timeout or offline
    }

    const initial = {
      ...mockFees,
      monthlyFee: studentFeeInfo.monthlyFee,
      currentDue: 1, // Strictly ₹1 test amount for smooth UPI
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

  // Student submits UPI payment for Superadmin verification
  async submitFeePayment(rollNo: string, utr?: string) {
    const cacheKey = `fees_${rollNo}`;
    const current = (await getCached<any>(cacheKey)) || mockFees;
    const updated = {
      ...current,
      status: 'pending_verification' as const,
      utr: utr || `UPI-${Date.now().toString().slice(-6)}`,
      submittedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    await setCached(cacheKey, updated);

    // Save pending verification to admin queue
    const studentFeeInfo = (EDUSYNC_FEES as any)[rollNo];
    const studentName = studentFeeInfo?.name || (current as any).studentName || (rollNo === '2024-JEE-0842' ? 'Arjun S' : rollNo);

    const adminKey = 'admin_pending_fees';
    const pendingList = (await getCached<any[]>(adminKey)) || [];
    const exists = pendingList.find((p) => p.rollNo === rollNo);
    if (!exists) {
      pendingList.push({
        rollNo,
        studentName,
        amount: 1,
        upiId: 'devitintu12345@oksbi',
        utr: updated.utr,
        submittedAt: updated.submittedAt,
      });
      await setCached(adminKey, pendingList);
    }

    try {
      await supabase
        .from('fees_records')
        .update({ status: 'pending_verification', current_due: 1 })
        .eq('roll_no', rollNo);
    } catch {}

    return updated;
  },

  // Superadmin approves student fee payment
  async approveFeePayment(rollNo: string) {
    const cacheKey = `fees_${rollNo}`;
    const current = (await getCached<any>(cacheKey)) || mockFees;
    const now = new Date();
    const paidOnStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newPayment = {
      month: 'SEP',
      fullMonth: 'September 2026',
      paidOn: paidOnStr,
      amount: 1,
      onTime: true,
      status: 'Verified by Super Admin',
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
      recentPayments: [newPayment, ...(current.recentPayments || [])],
      verifiedAt: paidOnStr,
      verifiedBy: 'Mr. R Madhusudanan (Super Admin)',
    };

    await setCached(cacheKey, updated);

    // Remove from admin pending queue
    const adminKey = 'admin_pending_fees';
    const pendingList = (await getCached<any[]>(adminKey)) || [];
    const filtered = pendingList.filter((p) => p.rollNo !== rollNo);
    await setCached(adminKey, filtered);

    try {
      await supabase
        .from('fees_records')
        .update({ status: 'paid', current_due: 0 })
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
      currentDue: 1,
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
        .update({ status: 'due', current_due: 1 })
        .eq('roll_no', rollNo);
    } catch {}
    return reset;
  },

  // Get list of pending fee approvals for Superadmin
  async getPendingFeeApprovals() {
    const adminKey = 'admin_pending_fees';
    return (await getCached<any[]>(adminKey)) || [];
  },

  // Fetch Progress with Cache & 2.5s Timeout
  async getProgress(rollNo: string) {
    const cacheKey = `progress_${rollNo}`;
    const cached = await getCached<any>(cacheKey);

    try {
      const query = supabase
        .from('progress_records')
        .select('*')
        .eq('roll_no', rollNo)
        .single();

      const { data, error } = await withTimeout(query, 2500) as any;
      if (data && !error) {
        const mapped = {
          testsAttended: data.tests_attended,
          highestScore: data.highest_score,
          topPercent: data.top_percent,
          totalStudents: data.total_students,
          improvement: data.improvement,
          chartLabels: data.chart_labels || ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'],
          yourScores: data.your_scores || [48, 62, 68, 72, 78, 82, 88, 92],
          avgScores: data.avg_scores || [50, 50, 52, 55, 58, 60, 62, 65],
          accuracy: data.accuracy,
          incorrect: data.incorrect,
          commonMistakes: data.common_mistakes || [],
          practice: data.practice || { attended: 18, completed: 14, pending: 4, highest: 96 },
        };
        await setCached(cacheKey, mapped);
        return mapped;
      }
    } catch (e) {
      // Timeout or offline
    }

    return cached || mockProgress;
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

    // 1. Try to fetch latest active exam alert from Supabase announcements
    try {
      const { data, error } = (await withTimeout(
        supabase
          .from('announcements')
          .select('*')
          .or('icon.eq.calendar,title.ilike.%Exam Alert%,title.ilike.%Test Alert%')
          .order('created_at', { ascending: false })
          .limit(1),
        2500
      )) as any;

      if (data && data.length > 0 && !error) {
        const top = data[0];
        // Parse syllabus and date from description if formatted by master hub
        const desc = top.description || '';
        const now = new Date();

        // Check if there is an expiry in description
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
            type: 'exam',
            title: top.title.replace(/^\[(Exam Alert|Test Alert)[^\]]*\]\s*/i, ''),
            shortDesc: desc,
            date: dateMatch ? dateMatch[1].trim() : (top.time_label || 'Upcoming Exam'),
            time: '09:30 AM - 12:30 PM',
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
    } catch (e) {
      // fallback to cached
    }

    const cached = await getCached<any>(key);
    if (!cached) return null;

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
    // Also try to push to Supabase
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

  // Save attendance record for a student (called from faculty portal)
  async saveAttendance(rollNo: string, date: string, subject: string, classLabel: string, status: 'P' | 'A') {
    const cacheKey = `attendance_${rollNo}`;
    const existing = (await getCached<any>(cacheKey)) || { overall: 0, attended: 0, total: 0, history: [], todaySubjects: [] };

    // Update history
    const historyEntry = {
      date,
      subjects: subject,
      score: status === 'P' ? '1/1' : '0/1',
      status: status === 'P' ? 'full' : 'absent',
      class: classLabel,
    };

    const history = [historyEntry, ...(existing.history || [])].slice(0, 60);
    const attended = history.filter((h: any) => h.status === 'full').length;
    const total = history.length;
    const overall = total > 0 ? Math.round((attended / total) * 100) : 0;

    const updated = { ...existing, overall, attended, total, history };
    await setCached(cacheKey, updated);

    // Push to Supabase
    try {
      await supabase.from('attendance_records').insert({
        roll_no: rollNo,
        date,
        subject,
        class_label: classLabel,
        status,
      });
    } catch {}

    return updated;
  },

  // Batch save attendance for a full class (from faculty submit)
  async saveBatchAttendance(students: { rollNo: string; name: string; status: 'P' | 'A' }[], date: string, subject: string, classLabel: string) {
    for (const stu of students) {
      await this.saveAttendance(stu.rollNo, date, subject, classLabel, stu.status);
    }
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
    return [
      {
        receiptNo: 'REC-2026-SEP-0842',
        month: 'SEP',
        fullMonth: 'September 2026',
        paidOn: '19 Sep 2026, 06:14 PM',
        amount: 1,
        mode: 'UPI (GPay / devitintu12345@oksbi)',
        status: 'Verified ✓',
        verifiedBy: 'Mr. R Madhusudanan (Main Admin)',
        onTime: true,
        category: 'Monthly Tuition Fee (Demo)',
      },
      {
        receiptNo: 'REC-2026-AUG-0842',
        month: 'AUG',
        fullMonth: 'August 2026',
        paidOn: '08 Aug 2026, 07:03 PM',
        amount: 6000,
        mode: 'UPI (devitintu12345@oksbi)',
        status: 'Verified ✓',
        verifiedBy: 'Mr. R Madhusudanan (Main Admin)',
        onTime: true,
        category: 'Regular Monthly Tuition Fee',
      },
      {
        receiptNo: 'REC-2026-JUL-0842',
        month: 'JUL',
        fullMonth: 'July 2026',
        paidOn: '09 Jul 2026, 05:56 PM',
        amount: 6000,
        mode: 'UPI (devitintu12345@oksbi)',
        status: 'Verified ✓',
        verifiedBy: 'Mr. R Madhusudanan (Main Admin)',
        onTime: true,
        category: 'Regular Monthly Tuition Fee',
      },
      {
        receiptNo: 'REC-2026-JUN-0842',
        month: 'JUN',
        fullMonth: 'June 2026',
        paidOn: '10 Jun 2026, 04:30 PM',
        amount: 6000,
        mode: 'Online Transfer',
        status: 'Verified ✓',
        verifiedBy: 'Mr. R Madhusudanan (Main Admin)',
        onTime: true,
        category: 'Regular Monthly Tuition Fee',
      },
      {
        receiptNo: 'REC-2026-MAY-0842',
        month: 'MAY',
        fullMonth: 'May 2026',
        paidOn: '14 May 2026, 02:15 PM',
        amount: 4500,
        mode: 'UPI (devitintu12345@oksbi)',
        status: 'Verified ✓',
        verifiedBy: 'Mr. R Madhusudanan (Main Admin)',
        onTime: true,
        category: 'Entrance Coaching Intensive Batch',
      },
      {
        receiptNo: 'REC-2026-APR-0842',
        month: 'APR',
        fullMonth: 'April 2026',
        paidOn: '05 Apr 2026, 11:00 AM',
        amount: 1500,
        mode: 'Cash Receipt at Center Desk',
        status: 'Verified ✓',
        verifiedBy: 'Mr. R Madhusudanan (Main Admin)',
        onTime: true,
        category: 'Annual Registration & Lab Modules Kit',
      },
    ];
  },
};
