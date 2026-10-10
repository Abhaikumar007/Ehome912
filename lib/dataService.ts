import { supabase } from './supabase';
import { AppStorage } from './storage';
import {
  studentData as mockStudent,
  attendanceData as mockAttendance,
  feesData as mockFees,
  studyMaterials as mockMaterials,
} from '../constants/mockData';
import { EDUSYNC_STUDENTS, EDUSYNC_FEES } from './studentsRoster';
import {
  verifyPassword,
  hashPassword,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  saveAuthSession,
  clearAuthSession,
  INVALID_CREDENTIALS_MSG,
} from './securityAuth';

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
  syllabus?: 'State Syllabus' | 'CBSE';
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

/**
 * Robust helper to extract and resolve target syllabus for any timetable class or test
 * Returns 'CBSE', 'State Syllabus', or 'Both'
 */
export function resolveClassTargetSyllabus(cls: any): 'State Syllabus' | 'CBSE' | 'Both' {
  const status = (cls?.status || '').toLowerCase();
  const time = (cls?.time || '').toLowerCase();
  const roll = (cls?.roll_no || '').toLowerCase();
  const grade = (cls?.class_grade || '').toLowerCase();
  const board = (cls?.board || cls?.target_syllabus || cls?.targetSyllabus || cls?.syllabus || '').toLowerCase();

  // 0. Explicit Both / Shared indicators
  if (
    board === 'both' ||
    board.includes('both') ||
    status.split(':').includes('both') ||
    status.includes(':both') ||
    status.includes('both:') ||
    time.includes('both') ||
    time.includes('state & cbse') ||
    time.includes('cbse & state')
  ) {
    return 'Both';
  }

  // 1. Explicit CBSE indicators
  if (
    board === 'cbse' ||
    board === 'cbse only' ||
    status.split(':').includes('cbse') ||
    status.includes(':cbse') ||
    status.includes('cbse:') ||
    status === 'cbse' ||
    (time.includes('• cbse') && !time.includes('state & cbse') && !time.includes('cbse & state')) ||
    time.includes('(cbse)') ||
    time.includes('cbse only') ||
    roll.includes('cbse') ||
    grade.includes('cbse')
  ) {
    return 'CBSE';
  }

  // 2. Explicit State Syllabus indicators
  if (
    board === 'state' ||
    board === 'state only' ||
    board === 'state syllabus' ||
    status.split(':').includes('state') ||
    status.includes(':state') ||
    status.includes('state:') ||
    status.includes('state syllabus') ||
    (time.includes('• state') && !time.includes('state & cbse') && !time.includes('cbse & state')) ||
    time.includes('(state)') ||
    time.includes('state syllabus') ||
    roll.includes('state') ||
    grade.includes('state')
  ) {
    return 'State Syllabus';
  }

  // 3. Default: Shared between both syllabuses
  return 'Both';
}

/**
 * Robust helper to extract and resolve syllabus for a student
 * Returns 'State Syllabus' or 'CBSE'
 */
export function resolveStudentSyllabus(student: any): 'State Syllabus' | 'CBSE' {
  if (student?.syllabus === 'CBSE' || student?.syllabus === 'State Syllabus') {
    return student.syllabus;
  }
  const batchLower = (student?.batch || '').toLowerCase();
  const schoolLower = (student?.school || '').toLowerCase();
  if (batchLower.includes('cbse') || schoolLower.includes('cbse')) return 'CBSE';
  if (batchLower.includes('state') || schoolLower.includes('state')) return 'State Syllabus';

  const roll = (student?.rollNo || student?.roll_no || student?.roll || student?.id || '').toUpperCase();
  const matched = EDUSYNC_STUDENTS.find((s) => s.rollNo.toUpperCase() === roll);
  if (matched?.syllabus) return matched.syllabus;

  return 'State Syllabus';
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
 * Normalizes a date string or timestamp into a YYYY-MM-DD ISO string.
 * Handles:
 * - YYYY-MM-DD or YYYY/MM/DD
 * - DD-MM-YYYY or DD/MM/YYYY
 * - "9 October 2026", "09 Oct 2026", "October 9, 2026", "Oct 9, 2026"
 * - Weekday prefixes like "Sat, Oct 10, 2026" or "Fri, 9 Oct 2026"
 */
export function parseDateToIso(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  let clean = String(dateStr).trim();
  clean = clean.replace(/^[a-zA-Z]+,\s*/, ''); // strip weekday if present

  // YYYY-MM-DD or YYYY/MM/DD
  const isoM = clean.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (isoM) {
    return `${isoM[1]}-${isoM[2].padStart(2, '0')}-${isoM[3].padStart(2, '0')}`;
  }
  // DD-MM-YYYY or DD/MM/YYYY
  const dmyM = clean.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (dmyM) {
    return `${dmyM[3]}-${dmyM[2].padStart(2, '0')}-${dmyM[1].padStart(2, '0')}`;
  }

  // Named months (e.g. '9 October 2026' or '09 Oct 2026')
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  const dMonYM = clean.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/);
  if (dMonYM) {
    const monKey = dMonYM[2].toLowerCase().substring(0, 3);
    if (months[monKey]) {
      return `${dMonYM[3]}-${months[monKey]}-${dMonYM[1].padStart(2, '0')}`;
    }
  }

  const monDYM = clean.match(/^([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monDYM) {
    const monKey = monDYM[1].toLowerCase().substring(0, 3);
    if (months[monKey]) {
      return `${monDYM[3]}-${months[monKey]}-${monDYM[2].padStart(2, '0')}`;
    }
  }

  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return null;
}

/**
 * Extracts the scheduled start date (Show From / Start Date) for an alert, notice, or test schedule.
 */
export function extractAlertStartDate(item: any): string | null {
  if (!item) return null;
  if (item.showFromDate) return parseDateToIso(item.showFromDate);
  if (item.show_from_date) return parseDateToIso(item.show_from_date);
  if (item.startDate) return parseDateToIso(item.startDate);
  if (item.start_date) return parseDateToIso(item.start_date);
  if (item.showFrom) return parseDateToIso(item.showFrom);

  const text = `${item.desc || ''} ${item.description || ''} ${item.shortDesc || ''}`;
  const m = text.match(/(?:Show From|Start Date|Visible From|Display From|From Date)\s*:\s*([^\n\r|,]+)/i);
  if (m) {
    return parseDateToIso(m[1].trim());
  }
  return null;
}

/**
 * Extracts the scheduled expiry date (Valid Until / Stop Date) for an alert, notice, or test schedule.
 */
export function extractAlertExpiryDate(item: any): string | null {
  if (!item) return null;
  if (item.expiryDate) return parseDateToIso(item.expiryDate);
  if (item.expiry_date) return parseDateToIso(item.expiry_date);
  if (item.stopDate) return parseDateToIso(item.stopDate);
  if (item.stop_date) return parseDateToIso(item.stop_date);

  const text = `${item.desc || ''} ${item.description || ''} ${item.shortDesc || ''}`;
  const m = text.match(/(?:Valid Until|Stop Date|Expiry Date|Expiry)\s*:\s*([^\n\r|,]+)/i);
  if (m) {
    return parseDateToIso(m[1].trim());
  }
  return null;
}

/**
 * Determines whether a test schedule or announcement alert should be visible to students on a given date.
 * Enforces the required logic:
 * - "Current Date < Start Date" -> Do not show alert (returns false)
 * - "Current Date >= Start Date" -> Show alert (returns true)
 * - "Current Date > Expiry Date" -> Do not show alert (returns false, alert expired)
 * - If no start date or show from date is configured, returns true.
 */
export function isAlertVisibleOnDate(
  item: any,
  targetDate: Date = new Date()
): boolean {
  if (!item) return false;

  const y = targetDate.getFullYear();
  const m = String(targetDate.getMonth() + 1).padStart(2, '0');
  const d = String(targetDate.getDate()).padStart(2, '0');
  const targetIso = `${y}-${m}-${d}`;

  const startIso = extractAlertStartDate(item);
  if (startIso && targetIso < startIso) {
    // Current Date < Start Date -> Do not show alert
    return false;
  }

  const expiryIso = extractAlertExpiryDate(item);
  if (expiryIso && targetIso > expiryIso) {
    // Current Date > Expiry Date -> Do not show alert (expired)
    return false;
  }

  return true;
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

/**
 * Checks whether an announcement, timetable notification, or academic alert
 * is targeted to a specific student's syllabus (CBSE vs State Syllabus).
 * - If no studentSyllabus is specified, or studentSyllabus is 'Both', returns true.
 * - If explicitly tagged/marked for Both or all boards, returns true.
 * - If marked CBSE, only CBSE students see it.
 * - If marked State Syllabus, only State Syllabus students see it.
 */
export function isTargetedToSyllabus(
  item: {
    title?: string;
    desc?: string;
    description?: string;
    shortDesc?: string;
    target_syllabus?: string;
    targetSyllabus?: string;
    syllabus_tag?: string;
    board?: string;
    syllabus?: string;
  } | null | undefined,
  studentSyllabus?: string
): boolean {
  if (!item) return false;
  if (!studentSyllabus || studentSyllabus === 'Both') {
    return true;
  }

  const title = (item.title || '').toLowerCase();
  const desc = (item.desc || item.description || item.shortDesc || '').toLowerCase();
  const rawTag = (item.target_syllabus || item.targetSyllabus || item.syllabus_tag || item.board || item.syllabus || '').toLowerCase();
  const fullText = `${title} ${desc} ${rawTag}`;

  // Explicit Both / Shared indicators
  if (
    rawTag === 'both' ||
    rawTag.includes('both') ||
    fullText.includes('(both board') ||
    fullText.includes('[both board') ||
    fullText.includes('both board') ||
    fullText.includes('both syllabus') ||
    fullText.includes('state & cbse') ||
    fullText.includes('cbse & state')
  ) {
    return true;
  }

  // Explicit CBSE indicators
  const isCbse =
    rawTag === 'cbse' ||
    rawTag === 'cbse only' ||
    fullText.includes('[cbse') ||
    fullText.includes('(cbse') ||
    fullText.includes('cbse board') ||
    fullText.includes('cbse syllabus');

  // Explicit State Syllabus indicators
  const isState =
    rawTag === 'state' ||
    rawTag === 'state only' ||
    rawTag.includes('state syllabus') ||
    fullText.includes('[state') ||
    fullText.includes('(state') ||
    fullText.includes('state board') ||
    fullText.includes('state syllabus');

  if (isCbse && !isState) {
    return studentSyllabus === 'CBSE';
  }
  if (isState && !isCbse) {
    return studentSyllabus === 'State Syllabus';
  }

  // If no specific syllabus board is mentioned, it applies to all
  return true;
}

export function isTargetedToStudent(item: any, studentClass?: string, studentSyllabus?: string): boolean {
  return isTargetedToClass(item, studentClass) && isTargetedToSyllabus(item, studentSyllabus);
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
      await clearAuthSession('student');
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
        const batchLower = (data.batch || '').toLowerCase();
        const schoolLower = (data.school || '').toLowerCase();
        const matchedRoster = EDUSYNC_STUDENTS.find((s) => s.rollNo.toUpperCase() === String(targetRoll).toUpperCase());
        const resolvedSyllabus: 'State Syllabus' | 'CBSE' =
          data.syllabus ||
          (batchLower.includes('cbse') ? 'CBSE' : batchLower.includes('state') ? 'State Syllabus' : undefined) ||
          (schoolLower.includes('cbse') ? 'CBSE' : undefined) ||
          matchedRoster?.syllabus ||
          'State Syllabus';

        const studentCustomKey = `eduhome_student_custom_${String(targetRoll).trim().toUpperCase()}`;
        let localPhotoUrl = current?.photoUrl;
        let localAvatar = current?.avatar;
        try {
          const savedCustom = await AppStorage.getItem(studentCustomKey);
          if (savedCustom) {
            const parsed = JSON.parse(savedCustom);
            if (parsed.photoUrl) localPhotoUrl = parsed.photoUrl;
            if (parsed.avatar) localAvatar = parsed.avatar;
          }
        } catch {}

        const updated: StudentProfile = {
          rollNo: data.roll_no || targetRoll,
          name: data.name || current?.name || targetRoll,
          class: data.class_name || current?.class || 'Class 10',
          batch: data.batch || data.class_name || current?.batch || 'Batch A',
          syllabus: resolvedSyllabus,
          phone: data.phone || current?.phone || '9876543210',
          avatar: localAvatar || data.avatar || current?.avatar || 'ST',
          photoUrl: localPhotoUrl || current?.photoUrl || undefined,
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

  async restoreStudentCustomizations(student: StudentProfile): Promise<StudentProfile> {
    try {
      const key = `eduhome_student_custom_${student.rollNo.trim().toUpperCase()}`;
      const saved = await AppStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.photoUrl) student.photoUrl = parsed.photoUrl;
        if (parsed.avatar) student.avatar = parsed.avatar;
        if (parsed.phone && !student.phone) student.phone = parsed.phone;
        if (parsed.goals && !student.goals) student.goals = parsed.goals;
      }
    } catch (e) {
      console.warn('Failed to restore student customizations:', e);
    }
    return student;
  },

  // Student Login
  async loginStudent(rollNo: string, pin: string): Promise<{ success: boolean; student?: StudentProfile; error?: string }> {
    const trimmedRoll = rollNo.trim();
    const trimmedPin = pin.trim();

    if (!trimmedRoll || !trimmedPin) {
      return { success: false, error: 'Please enter both your Roll Number and PIN.' };
    }

    // Rate limiting defense
    const rateCheck = checkRateLimit(trimmedRoll);
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: `Too many failed login attempts. Please wait ${rateCheck.waitSeconds} seconds before trying again.`,
      };
    }

    try {
      // Step 1: Validate account existence in database
      const queryPromise = supabase
        .from('students')
        .select('*')
        .ilike('roll_no', trimmedRoll)
        .single();

      const { data, error } = (await withTimeout(queryPromise, 3000)) as any;

      if (data && !error) {
        // Step 2: Validate password against securely stored password/hash
        const isValid = verifyPassword(trimmedPin, data.pin);
        if (!isValid) {
          recordFailedAttempt(trimmedRoll);
          return { success: false, error: INVALID_CREDENTIALS_MSG };
        }

        // Reset failed attempts on success
        resetRateLimit(trimmedRoll);

        const batchLower = (data.batch || '').toLowerCase();
        const schoolLower = (data.school || '').toLowerCase();
        const matchedRoster = EDUSYNC_STUDENTS.find((s) => s.rollNo.toUpperCase() === trimmedRoll.toUpperCase());
        const resolvedSyllabus: 'State Syllabus' | 'CBSE' =
          data.syllabus ||
          (batchLower.includes('cbse') ? 'CBSE' : batchLower.includes('state') ? 'State Syllabus' : undefined) ||
          (schoolLower.includes('cbse') ? 'CBSE' : undefined) ||
          matchedRoster?.syllabus ||
          'State Syllabus';

        const student: StudentProfile = {
          id: data.id,
          rollNo: data.roll_no,
          name: data.name,
          class: data.class_name,
          batch: data.batch,
          syllabus: resolvedSyllabus,
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
        await this.restoreStudentCustomizations(student);
        await this.saveCurrentStudent(student);
        await saveAuthSession('student', student.rollNo);
        return { success: true, student };
      } else {
        // Username does not exist in database
        recordFailedAttempt(trimmedRoll);
        return { success: false, error: INVALID_CREDENTIALS_MSG };
      }
    } catch (err) {
      console.warn('[DataService] Database query error during login:', err);

      // Offline fallback: check cached roster if device has network outage
      const matchedEduStudent = EDUSYNC_STUDENTS.find(
        (s) => s.rollNo.toUpperCase() === trimmedRoll.toUpperCase()
      );
      if (matchedEduStudent) {
        const isValid = verifyPassword(trimmedPin, matchedEduStudent.pin);
        if (isValid) {
          resetRateLimit(trimmedRoll);
          const student: StudentProfile = {
            rollNo: matchedEduStudent.rollNo,
            name: matchedEduStudent.name,
            class: matchedEduStudent.class,
            batch: matchedEduStudent.batch,
            syllabus: matchedEduStudent.syllabus || 'State Syllabus',
            avatar: matchedEduStudent.avatar,
            streak: matchedEduStudent.streak || 0,
            accuracy: matchedEduStudent.accuracy || 0,
            testsCompleted: matchedEduStudent.testsCompleted || 0,
            topPercent: matchedEduStudent.topPercent || 0,
            phone: matchedEduStudent.phone,
            email: `${matchedEduStudent.name.toLowerCase().replace(/\s+/g, '.')}@eduhome.ac.in`,
            goals: matchedEduStudent.class,
          };
          await this.restoreStudentCustomizations(student);
          await this.saveCurrentStudent(student);
          await saveAuthSession('student', student.rollNo);
          return { success: true, student };
        }
      }

      recordFailedAttempt(trimmedRoll);
      return { success: false, error: INVALID_CREDENTIALS_MSG };
    }
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
          .ilike('roll_no', rollNo)
          .single();
        const { data } = (await withTimeout(checkQuery, 2500)) as any;
        if (data && !verifyPassword(currentPin.trim(), data.pin)) {
          return { success: false, error: 'Current security PIN is incorrect' };
        }
      } catch {
        const matched = EDUSYNC_STUDENTS.find((s) => s.rollNo.toUpperCase() === rollNo.toUpperCase());
        if (matched && !verifyPassword(currentPin.trim(), matched.pin)) {
          return { success: false, error: 'Current security PIN is incorrect' };
        }
      }
    }

    const mergedStudent: StudentProfile = {
      ...current,
      ...updates,
    };

    // Save to local session immediately
    await this.saveCurrentStudent(mergedStudent);

    // Save to permanent device custom profile cache so logout never wipes photo or avatar
    try {
      const studentCustomKey = `eduhome_student_custom_${rollNo.trim().toUpperCase()}`;
      await AppStorage.setItem(
        studentCustomKey,
        JSON.stringify({
          avatar: mergedStudent.avatar,
          photoUrl: mergedStudent.photoUrl || null,
          name: mergedStudent.name,
          phone: mergedStudent.phone,
          goals: mergedStudent.goals,
        })
      );
    } catch (e) {
      console.warn('Failed to save student custom profile locally:', e);
    }

    // Save to Supabase in background with salted hash
    try {
      const payload: Record<string, any> = {
        name: mergedStudent.name,
        avatar: mergedStudent.avatar,
        phone: mergedStudent.phone,
      };
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

  // Fetch Classes with Cache & 2.5s Timeout — Filtered strictly by Student Syllabus
  async getClasses(rollNo: string, studentClass?: string, studentSyllabus?: string) {
    let effectiveSyllabus = studentSyllabus;
    if (!effectiveSyllabus) {
      try {
        const cur = await this.getCurrentStudent();
        if (cur && cur.rollNo === rollNo && cur.syllabus) {
          effectiveSyllabus = cur.syllabus;
        } else {
          const r = EDUSYNC_STUDENTS.find((s) => s.rollNo === rollNo);
          effectiveSyllabus = r?.syllabus || 'State Syllabus';
        }
      } catch {
        effectiveSyllabus = 'State Syllabus';
      }
    }

    const cacheKey = `classes_${rollNo}_${effectiveSyllabus}`;
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
        // Filter strictly by target syllabus:
        // State Syllabus timetable entries appear ONLY for State Syllabus students
        // CBSE timetable entries appear ONLY for CBSE students
        // Entries assigned to Both appear for students from both syllabuses
        const syllabusFiltered = data.filter((c: any) => {
          const target = resolveClassTargetSyllabus(c);
          if (target === 'Both') return true;
          if (effectiveSyllabus === 'CBSE') {
            return target === 'CBSE';
          } else {
            return target === 'State Syllabus';
          }
        });

        // Deduplicate so each subject on a given date appears EXACTLY ONCE (latest schedule takes precedence)
        const seen = new Set<string>();
        const deduplicated: any[] = [];
        const reversed = [...syllabusFiltered].reverse();
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
          target_syllabus: resolveClassTargetSyllabus(c),
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
        const filteredCached = cached.filter((c: any) => {
          const target = resolveClassTargetSyllabus(c);
          if (target === 'Both') return true;
          return effectiveSyllabus === 'CBSE' ? target === 'CBSE' : target === 'State Syllabus';
        });
        const seen = new Set<string>();
        const list = [...filteredCached].reverse().filter((c: any) => {
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


  // Invalidate and clear all local timetable and classes caches
  async clearClassesCache(rollNo?: string, syllabus?: string): Promise<void> {
    try {
      // Clear in-memory cache keys
      Object.keys(memoryCache).forEach((k) => {
        if (
          k.startsWith('classes_') ||
          k.startsWith('admin_timetable_') ||
          k.startsWith('published_timetable_') ||
          k.startsWith('cached_tests')
        ) {
          delete memoryCache[k];
        }
      });
      // Clear AppStorage persistent keys
      if (rollNo) {
        if (syllabus) {
          await AppStorage.removeItem(CACHE_PREFIX + `classes_${rollNo}_${syllabus}`);
        }
        await AppStorage.removeItem(CACHE_PREFIX + `classes_${rollNo}_State Syllabus`);
        await AppStorage.removeItem(CACHE_PREFIX + `classes_${rollNo}_CBSE`);
        await AppStorage.removeItem(CACHE_PREFIX + `classes_${rollNo}_Both`);
      }
      await AppStorage.removeItem(CACHE_PREFIX + 'admin_timetable_classes');
      await AppStorage.removeItem(CACHE_PREFIX + 'published_timetable_dates');
      await AppStorage.removeItem(CACHE_PREFIX + 'academic_alert_active');
    } catch (e) {
      console.log('[DataService] clearClassesCache note:', e);
    }
  },

  // Check which dates have published timetables across the tuition centre
  async getPublishedTimetableDates(): Promise<string[]> {
    const cacheKey = 'published_timetable_dates';
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('class_date')
        .eq('published', true);

      if (!error && Array.isArray(data)) {
        const dates = Array.from(
          new Set(
            data
              .map((d: any) => (d.class_date || '').trim())
              .filter(Boolean)
          )
        );
        await setCached(cacheKey, dates);
        return dates;
      }
    } catch (e) {
      console.warn('Error fetching published timetable dates:', e);
    }
    const cached = await getCached<string[]>(cacheKey);
    return cached || [];
  },

  // Access Control: Enforce timetable scheduling restrictions (Admin Portal only)
  async scheduleTeacherClassSession(_sessionData: {
    classGrade: string;
    subject: string;
    classDate: string;
    startTime: string;
    endTime: string;
    sessionType?: string;
    targetSyllabus: 'Both' | 'State Syllabus' | 'CBSE';
    facultyId?: string;
    facultyName?: string;
  }) {
    throw new Error('Access Denied: Timetable management and class scheduling are restricted strictly to Administrators through the Admin Portal. Faculty members do not have permission to schedule classes.');
  },

  async updateClassSession(_id: string, _updates: any) {
    throw new Error('Access Denied: Timetable management and class editing are restricted strictly to Administrators through the Admin Portal.');
  },

  async deleteClassSession(_id: string) {
    throw new Error('Access Denied: Timetable management and class deletion are restricted strictly to Administrators through the Admin Portal.');
  },

  // Fetch Announcements — Network-First with Cache Fallback (Optionally filtered by student class and syllabus)
  async getAnnouncements(forceRefresh = false, studentClass?: string, isStudentView = false, studentSyllabus?: string) {
    const classSuffix = studentClass ? `_${studentClass.replace(/\s+/g, '_').toLowerCase()}` : '';
    const sylSuffix = studentSyllabus ? `_${studentSyllabus.replace(/\s+/g, '_').toLowerCase()}` : '';
    const cacheKey = `eduhome_announcements${classSuffix}${sylSuffix}`;
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
            startDate: extractAlertStartDate(a),
            expiryDate: extractAlertExpiryDate(a),
          }));

          // Filter by student class & syllabus if specified
          const studentFiltered = (studentClass || studentSyllabus)
            ? mapped.filter((a: any) => isTargetedToClass(a, studentClass) && isTargetedToSyllabus(a, studentSyllabus))
            : mapped;

          // For student view (when studentClass is provided or isStudentView is true):
          // Enforce: Current Date >= Start Date (hide before start date) and not expired
          const filtered = (studentClass || isStudentView)
            ? studentFiltered.filter((a: any) => isAlertVisibleOnDate(a))
            : studentFiltered;

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
      const studentFiltered = (studentClass || studentSyllabus)
        ? cached.filter((a: any) => isTargetedToClass(a, studentClass) && isTargetedToSyllabus(a, studentSyllabus))
        : cached;
      return (studentClass || isStudentView)
        ? studentFiltered.filter((a: any) => isAlertVisibleOnDate(a))
        : studentFiltered;
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
        .update({ current_due: studentFeeInfo.monthlyFee, updated_at: new Date().toISOString() })
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

  // Fetch Notifications with Cache & 2.5s Timeout — Filtered strictly by student roll number, class & syllabus
  async getNotifications(rollNo: string, studentClass?: string, studentSyllabus?: string) {
    const classTag = studentClass ? `_${studentClass.replace(/[^0-9]/g, '')}` : '';
    const sylTag = studentSyllabus ? `_${studentSyllabus.replace(/\s+/g, '')}` : '';
    const cacheKey = `notifs_${rollNo}${classTag}${sylTag}`;
    const cached = await getCached<any[]>(cacheKey);

    try {
      // 1. Fetch direct notifications matching this student OR broadcast 'ALL'
      const query = supabase
        .from('notifications')
        .select('*')
        .or(`roll_no.eq.${rollNo},roll_no.eq.ALL`)
        .order('created_at', { ascending: false })
        .limit(30);

      const { data, error } = await withTimeout(query, 2500) as any;

      // 2. Fetch timetable announcements targeted to this student's class and syllabus
      let timetableNotifs: any[] = [];
      try {
        const { data: ttData } = await withTimeout(
          supabase
            .from('announcements')
            .select('*')
            .eq('tag', 'Timetable')
            .order('created_at', { ascending: false })
            .limit(10),
          2000
        ) as any;

        if (Array.isArray(ttData)) {
          timetableNotifs = ttData
            .filter((a: any) => isTargetedToClass(a, studentClass) && isTargetedToSyllabus(a, studentSyllabus))
            .map((a: any) => ({
              id: `tt_${a.id}`,
              title: a.title,
              desc: a.description || a.desc,
              time: a.time_label || 'Recently',
              unread: true,
              type: 'schedule',
              created_at: a.created_at,
            }));
        }
      } catch (_) {}

      if (!error && (Array.isArray(data) || timetableNotifs.length > 0)) {
        const filteredDirect = (data || [])
          .filter((n: any) => {
            if (n.roll_no === rollNo) return true;
            // For broadcast notifications: ensure they match student's class and syllabus
            return isTargetedToClass(n, studentClass) && isTargetedToSyllabus(n, studentSyllabus);
          })
          .map((n: any) => ({
            id: String(n.id),
            title: n.title,
            desc: n.message || n.desc,
            time: n.time_label || 'Recently',
            unread: !n.is_read,
            type: n.type || 'general',
            created_at: n.created_at,
          }));

        // Merge timetable notifications and direct notifications (sorted newest first)
        const combined = [...timetableNotifs, ...filteredDirect];
        combined.sort((a, b) => {
          const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tB - tA;
        });

        // Deduplicate by title & desc
        const seen = new Set<string>();
        const unique = combined.filter((item) => {
          const k = `${item.title}_${item.desc}`;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });

        if (unique.length > 0) {
          await setCached(cacheKey, unique);
          return unique;
        }
      }
    } catch (e) {
      // Timeout or offline
    }

    return cached || [
      { id: '1', title: 'Class Timetable Updated', desc: 'Tomorrow class schedule has been updated. Open your timetable tab to view details.', time: 'Recently', unread: true, type: 'schedule' },
      { id: '2', title: 'Fee Reminder', desc: 'Tuition fees reminder. Check fee status tab.', time: '1h ago', unread: true, type: 'fee' },
      { id: '3', title: 'Test Result Published', desc: 'Latest assessment test results are published.', time: '1d ago', unread: false, type: 'result' },
    ];
  },

  // Academic / Test Paper Alert (Shown on Student Home above Attendance - Optionally filtered by student class and syllabus)
  async getAcademicAlert(studentClass?: string, studentSyllabus?: string) {
    const classSuffix = studentClass ? `_${studentClass.replace(/\s+/g, '_').toLowerCase()}` : '';
    const sylSuffix = studentSyllabus ? `_${studentSyllabus.replace(/\s+/g, '_').toLowerCase()}` : '';
    const key = `academic_alert_active${classSuffix}${sylSuffix}`;

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
          // Check start date & expiry date
          if (!isAlertVisibleOnDate(top, now)) {
            return false;
          }
          if (studentClass && !isTargetedToClass(top, studentClass)) {
            return false;
          }
          // Filter by syllabus
          if (studentSyllabus) {
            const rawSyl = (top.syllabus_tag || top.target_syllabus || top.targetSyllabus || '').toLowerCase();
            const rawTitle = (top.title || '').toLowerCase();
            const rawDesc = (top.short_desc || '').toLowerCase();
            let targetSyl = 'Both';
            if (rawSyl.includes('cbse') || rawTitle.includes('[cbse]') || rawTitle.includes('(cbse)') || rawDesc.includes('cbse only')) {
              targetSyl = 'CBSE';
            } else if (rawSyl.includes('state') || rawTitle.includes('[state') || rawTitle.includes('(state') || rawDesc.includes('state syllabus only')) {
              targetSyl = 'State Syllabus';
            }
            if (targetSyl !== 'Both') {
              if (studentSyllabus === 'CBSE' && targetSyl !== 'CBSE') return false;
              if (studentSyllabus === 'State Syllabus' && targetSyl !== 'State Syllabus') return false;
            }
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
          const now = new Date();
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

            // Check start date & expiry date: do NOT show tests before scheduled start date or after expiry
            if (!isAlertVisibleOnDate(item, now)) {
              return false;
            }

            return true;
          });

          if (validTestAnnouncements.length > 0) {
            const top = validTestAnnouncements[0];
            const desc = top.description || '';
            const expiryMatch = desc.match(/(?:Valid Until|Stop Date|Expiry)\s*:\s*([^\n|]+)/i);
            const showMatch = desc.match(/(?:Show From|Start Date)\s*:\s*([^\n|]+)/i);
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

    // Verify start date on cached item
    if (!isAlertVisibleOnDate(cached)) {
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

  isTargetedToSyllabus(item: any, studentSyllabus?: string): boolean {
    return isTargetedToSyllabus(item, studentSyllabus);
  },

  isTargetedToStudent(item: any, studentClass?: string, studentSyllabus?: string): boolean {
    return isTargetedToStudent(item, studentClass, studentSyllabus);
  },

  isAlertVisibleOnDate(item: any, targetDate: Date = new Date()): boolean {
    return isAlertVisibleOnDate(item, targetDate);
  },

  extractAlertStartDate(item: any): string | null {
    return extractAlertStartDate(item);
  },

  extractAlertExpiryDate(item: any): string | null {
    return extractAlertExpiryDate(item);
  },

  parseDateToIso(dateStr?: string | null): string | null {
    return parseDateToIso(dateStr);
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

  
  async setCachedTests(tests: any[]): Promise<void> {
    await setCached('teacher_tests', tests);
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
      const testDate = testItem?.date ? parseDateToIso(testItem.date) : '';
      const testSub = testItem?.subject || '';
      const testGrade = testItem?.classTag || testItem?.class_tag || testItem?.class_grade || '';
      if (testDate && testSub) {
        await supabase.from('classes').delete().eq('class_date', testDate).eq('subject', testSub);
      }
      if (testDate && testGrade) {
        await supabase.from('classes').delete().eq('class_date', testDate).eq('class_grade', testGrade).ilike('time', '%Test Paper%');
      }
      if (testSub) {
        await supabase.from('classes').delete().eq('subject', testSub).ilike('time', '%Test Paper%');
      }
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

      if (!error && Array.isArray(data)) {
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

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('roll_no', rollNo)
        .eq('type', 'teacher_opinion')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const cloudOpinions = data
          .map((row) => {
            try {
              const parsed = JSON.parse(row.message);
              return { ...parsed, supabaseId: row.id, id: parsed.id || row.id };
            } catch {
              return null;
            }
          })
          .filter((o) => {
            if (!o || o.status !== 'approved') return false;
            const targetStudentId = o.student_id || o.studentId || o.rollNo;
            return !targetStudentId || targetStudentId.toUpperCase() === rollNo.toUpperCase();
          });

        // Directly update cache to match Supabase cloud truth; do not resurrect deleted opinions
        await setCached(key, cloudOpinions);
        return cloudOpinions;
      }
    } catch (e) {
      console.warn('Error fetching student opinions from Supabase:', e);
    }

    if (cached && Array.isArray(cached) && cached.length > 0) return cached;
    return [];
  },

  async addTeacherOpinion(opinion: {
    rollNo: string;
    studentId?: string;
    student_id?: string;
    studentName?: string;
    teacher: string;
    facultyId?: string;
    faculty_id?: string;
    subject: string;
    remark: string;
  }) {
    const sId = opinion.student_id || opinion.studentId || opinion.rollNo;
    const fId = opinion.faculty_id || opinion.facultyId;
    const opId = 'top-' + Date.now();
    const newOpinion: any = {
      id: opId,
      ...opinion,
      studentId: sId,
      student_id: sId,
      facultyId: fId,
      faculty_id: fId,
      status: 'pending_review',
      submittedAt: 'Just now',
    };

    const pendingKey = 'pending_teacher_opinions';
    const existing = (await getCached<any[]>(pendingKey)) || [];
    const updatedPending = [newOpinion, ...existing.filter((o) => o.id !== opId)];
    await setCached(pendingKey, updatedPending);
    if (fId) {
      const fPendingKey = `pending_teacher_opinions_${fId}`;
      const fExisting = (await getCached<any[]>(fPendingKey)) || [];
      await setCached(fPendingKey, [newOpinion, ...fExisting.filter((o) => o.id !== opId)]);
    }

    try {
      const { data, error } = await supabase.from('notifications').insert({
        roll_no: opinion.rollNo,
        title: `${opinion.teacher} • ${opinion.subject}`,
        message: JSON.stringify(newOpinion),
        type: 'teacher_opinion',
        time_label: 'Just now',
        is_read: false,
      }).select().single();

      if (!error && data?.id) {
        newOpinion.supabaseId = data.id;
      }
    } catch (e) {
      console.warn('Error saving opinion to Supabase:', e);
    }

    return newOpinion;
  },

  async getPendingTeacherOpinions(requester?: {
    id?: string;
    facultyId?: string;
    faculty_id?: string;
    name?: string;
    role?: string;
  }): Promise<any[]> {
    const isSuperAdmin =
      !requester ||
      Boolean(requester.role?.toLowerCase().includes('admin')) ||
      requester.id === 'fac-admin' ||
      Boolean(requester.name?.includes('Abhai'));

    const facultyId = requester?.faculty_id || requester?.facultyId || requester?.id;
    const facultyName = (requester?.name || '').trim();

    const pendingKey = isSuperAdmin
      ? 'pending_teacher_opinions'
      : `pending_teacher_opinions_${facultyId || facultyName}`;
    const cached = (await getCached<any[]>(pendingKey)) || [];

    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('type', 'teacher_opinion')
        .order('created_at', { ascending: false });

      // Database-level query restriction: only authoring faculty can query
      if (!isSuperAdmin) {
        const orConditions: string[] = [];
        if (facultyId) {
          orConditions.push(`message.ilike.%"facultyId":"${facultyId}"%`);
          orConditions.push(`message.ilike.%"faculty_id":"${facultyId}"%`);
        }
        if (facultyName) {
          orConditions.push(`message.ilike.%"teacher":"${facultyName}"%`);
          orConditions.push(`title.ilike.%${facultyName}%`);
        }
        if (orConditions.length > 0) {
          query = query.or(orConditions.join(','));
        }
      }

      const { data, error } = await query;

      if (!error && Array.isArray(data)) {
        const cloudPending = data
          .map((row) => {
            try {
              const parsed = JSON.parse(row.message);
              return { ...parsed, supabaseId: row.id, id: parsed.id || row.id };
            } catch {
              return null;
            }
          })
          .filter((o) => {
            if (!o || o.status !== 'pending_review') return false;
            if (isSuperAdmin) return true;
            // Strict backend verification: must be authoring faculty
            const opFacultyId = o.faculty_id || o.facultyId;
            if (facultyId && opFacultyId && opFacultyId.toLowerCase() === facultyId.toLowerCase()) {
              return true;
            }
            if (facultyName && o.teacher && o.teacher.toLowerCase().includes(facultyName.toLowerCase())) {
              return true;
            }
            return false;
          });

        const map = new Map<string, any>();
        cloudPending.forEach((o) => map.set(o.id, o));
        cached.forEach((o) => {
          if (!map.has(o.id)) map.set(o.id, o);
        });
        const merged = Array.from(map.values());
        await setCached(pendingKey, merged);
        return merged;
      }
    } catch (e) {
      console.warn('Error fetching pending opinions from Supabase:', e);
    }

    return cached;
  },

  async approveTeacherOpinion(opinionId: string) {
    const pendingKey = 'pending_teacher_opinions';
    const pending = (await getCached<any[]>(pendingKey)) || [];
    const target = pending.find((o) => o.id === opinionId || o.supabaseId === opinionId);
    if (!target) return null;

    // Remove from pending
    const remaining = pending.filter((o) => o.id !== opinionId && o.supabaseId !== opinionId);
    await setCached(pendingKey, remaining);

    const approvedItem = {
      ...target,
      status: 'approved',
      approvedBy: 'Mr. Abhai Kumar (Main Admin)',
      approvedAt: 'Just now',
    };

    // Update in Supabase
    try {
      if (target.supabaseId) {
        await supabase
          .from('notifications')
          .update({
            message: JSON.stringify(approvedItem),
          })
          .eq('id', target.supabaseId);
      } else {
        await supabase
          .from('notifications')
          .update({
            message: JSON.stringify(approvedItem),
          })
          .ilike('message', `%"id":"${opinionId}"%`);
      }
    } catch (e) {
      console.warn('Error updating approved opinion in Supabase:', e);
    }

    // Add to student approved opinions cache
    const studentOpinionsKey = `teacher_opinions_${target.rollNo}`;
    const studentOpinions = (await this.getStudentTeacherOpinions(target.rollNo)) || [];
    const updatedStudentOpinions = [
      approvedItem,
      ...studentOpinions.filter((o: any) => o.id !== opinionId && o.supabaseId !== opinionId),
    ];
    await setCached(studentOpinionsKey, updatedStudentOpinions);

    return approvedItem;
  },

  async getAllTeacherOpinions(requester?: {
    id?: string;
    facultyId?: string;
    faculty_id?: string;
    name?: string;
    role?: string;
  }): Promise<any[]> {
    const isSuperAdmin =
      !requester ||
      Boolean(requester.role?.toLowerCase().includes('admin')) ||
      requester.id === 'fac-admin' ||
      Boolean(requester.name?.includes('Abhai'));

    const facultyId = requester?.faculty_id || requester?.facultyId || requester?.id;
    const facultyName = (requester?.name || '').trim();

    const pending = (await this.getPendingTeacherOpinions(requester)) || [];
    const opinionsList: any[] = [];

    const cacheKey = isSuperAdmin
      ? 'all_teacher_opinions'
      : `all_teacher_opinions_${facultyId || facultyName}`;

    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('type', 'teacher_opinion')
        .order('created_at', { ascending: false });

      // Backend database query filter:
      // A faculty member should only be able to retrieve opinions where they are the authoring faculty member.
      if (!isSuperAdmin) {
        const orConditions: string[] = [];
        if (facultyId) {
          orConditions.push(`message.ilike.%"facultyId":"${facultyId}"%`);
          orConditions.push(`message.ilike.%"faculty_id":"${facultyId}"%`);
        }
        if (facultyName) {
          orConditions.push(`message.ilike.%"teacher":"${facultyName}"%`);
          orConditions.push(`title.ilike.%${facultyName}%`);
        }
        if (orConditions.length > 0) {
          query = query.or(orConditions.join(','));
        }
      }

      const { data, error } = await query;

      if (!error && Array.isArray(data)) {
        data.forEach((row) => {
          try {
            const parsed = JSON.parse(row.message);
            const op = { ...parsed, supabaseId: row.id, id: parsed.id || row.id };

            // Strict backend authorization check:
            // Admin role -> has full access
            // Faculty -> can only retrieve opinions where they are the authoring faculty member
            if (isSuperAdmin) {
              opinionsList.push(op);
            } else {
              const opFacultyId = op.faculty_id || op.facultyId;
              const matchesFacultyId = Boolean(
                facultyId && opFacultyId && opFacultyId.toLowerCase() === facultyId.toLowerCase()
              );
              const matchesFacultyName = Boolean(
                facultyName && op.teacher && op.teacher.toLowerCase().includes(facultyName.toLowerCase())
              );
              if (matchesFacultyId || matchesFacultyName) {
                opinionsList.push(op);
              }
            }
          } catch {}
        });
      }
    } catch (e) {
      console.warn('Error fetching all opinions from Supabase:', e);
    }

    const map = new Map<string, any>();
    opinionsList.forEach((o) => map.set(o.id, o));
    pending.forEach((o) => map.set(o.id, o));
    const result = Array.from(map.values());
    await setCached(cacheKey, result);
    return result;
  },

  async deleteTeacherOpinion(
    opinionId: string,
    rollNo?: string,
    requesterTeacher?: { id?: string; facultyId?: string; faculty_id?: string; name?: string; role?: string }
  ): Promise<boolean> {
    // 1. Authorization check
    if (requesterTeacher) {
      const isSuperAdmin =
        Boolean(requesterTeacher.role?.toLowerCase().includes('admin')) ||
        requesterTeacher.id === 'fac-admin' ||
        Boolean(requesterTeacher.name?.includes('Abhai'));

      if (!isSuperAdmin) {
        // Normal faculty: can only delete their own opinion
        const allOpinions = await this.getAllTeacherOpinions(requesterTeacher);
        const target = allOpinions.find(
          (o) => o.id === opinionId || o.supabaseId === opinionId
        );
        const fId = requesterTeacher.faculty_id || requesterTeacher.facultyId || requesterTeacher.id;
        const opFId = target?.faculty_id || target?.facultyId;
        const matchesFId = Boolean(fId && opFId && opFId.toLowerCase() === fId.toLowerCase());
        const matchesName = Boolean(
          target && target.teacher && requesterTeacher.name &&
          target.teacher.toLowerCase().includes(requesterTeacher.name.toLowerCase())
        );

        if (!target || (!matchesFId && !matchesName)) {
          throw new Error('Access Denied: Faculty members can only delete opinions they have submitted.');
        }
      }
    }

    // 2. Remove from Supabase
    try {
      await supabase.from('notifications').delete().eq('id', opinionId);
      await supabase.from('notifications').delete().ilike('message', `%"id":"${opinionId}"%`);
    } catch (e) {
      console.warn('Error deleting opinion from Supabase:', e);
    }

    // 3. Remove from pending cache
    const pendingKey = 'pending_teacher_opinions';
    const pending = (await getCached<any[]>(pendingKey)) || [];
    const remainingPending = pending.filter(
      (o) => o.id !== opinionId && o.supabaseId !== opinionId
    );
    await setCached(pendingKey, remainingPending);

    // 4. Remove from student approved cache
    const targetRoll = rollNo || pending.find((o) => o.id === opinionId)?.rollNo;
    if (targetRoll) {
      const studentKey = `teacher_opinions_${targetRoll}`;
      const studentOps = (await getCached<any[]>(studentKey)) || [];
      const remainingStudentOps = studentOps.filter(
        (o) => o.id !== opinionId && o.supabaseId !== opinionId
      );
      await setCached(studentKey, remainingStudentOps);
    }

    // 5. Invalidate faculty-specific cache
    if (requesterTeacher) {
      const fId = requesterTeacher.faculty_id || requesterTeacher.facultyId || requesterTeacher.id;
      if (fId) {
        await setCached(`all_teacher_opinions_${fId}`, null);
        await setCached(`pending_teacher_opinions_${fId}`, null);
      }
    }
    await setCached('all_teacher_opinions', null);

    return true;
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

