import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabase';

export interface TeacherProfile {
  id: string;
  name: string;
  subject: string;
  department: string;
  qualification: string;
  email: string;
  phone: string;
  avatar: string;
  allowedGrades: string[]; // e.g. ['6', '7', '8', '9'] or ['10', '11', '12'] or ['*']
  gradeDescription: string;
  isTemporary?: boolean;
}

export const TEACHER_ROSTER: TeacherProfile[] = [
  {
    id: 'FAC-2024-042',
    name: 'Mr. Abhai Kumar',
    subject: 'Computer Science',
    department: 'Computer Applications & IT',
    qualification: 'M.Tech Computer Science, B.Ed.',
    email: 'abhai.kumar@eduhome.ac.in',
    phone: '+91 75111 72864',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    allowedGrades: ['11', '12'],
    gradeDescription: 'Grades 11th & 12th (Computer Science)',
  },
  {
    id: 'fac-chem',
    name: 'Ms. Renju',
    subject: 'Chemistry',
    department: 'Senior Science Department',
    qualification: 'M.Sc., B.Ed. in Chemistry',
    email: 'renju@eduhome.ac.in',
    phone: '+91 98470 12345',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    allowedGrades: ['10', '11', '12'],
    gradeDescription: 'Grades 10th to 12th',
  },
  {
    id: 'fac-bio-lower',
    name: 'Mr. Madhusudanan',
    subject: 'Biology (Lower)',
    department: 'Secondary Science Department',
    qualification: 'M.Sc. Botany, B.Ed.',
    email: 'madhusudanan@eduhome.ac.in',
    phone: '+91 98470 23456',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    allowedGrades: ['6', '7', '8', '9'],
    gradeDescription: 'Grades up to 9th (6th - 9th)',
  },
  {
    id: 'fac-bio-upper',
    name: 'Mr. Gokul Krishnan',
    subject: 'Biology (Upper)',
    department: 'Senior Science Department',
    qualification: 'M.Sc. Zoology, Ph.D., B.Ed.',
    email: 'gokul.krishnan@eduhome.ac.in',
    phone: '+91 98470 34567',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    allowedGrades: ['10', '11', '12'],
    gradeDescription: 'Grades 10th and above (10th - 12th)',
  },
  {
    id: 'fac-phy',
    name: 'Mr. Akshay Kumar M',
    subject: 'Physics',
    department: 'Science Department',
    qualification: 'M.Sc. Physics, M.Phil',
    email: 'akshay.kumar@eduhome.ac.in',
    phone: '+91 98470 45678',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    allowedGrades: ['8', '9', '10', '11', '12'],
    gradeDescription: 'Secondary & Higher Secondary (8th - 12th)',
  },
  {
    id: 'fac-cs',
    name: 'Mr. Abhai Kumar',
    subject: 'Computer Science',
    department: 'Computer Applications & IT',
    qualification: 'M.Tech Computer Science',
    email: 'abhai.kumar.cs@eduhome.ac.in',
    phone: '+91 75111 72864',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    allowedGrades: ['11', '12'],
    gradeDescription: 'Grades 11th & 12th',
  },
  {
    id: 'fac-math',
    name: 'Ms. Devi',
    subject: 'Mathematics',
    department: 'Mathematics Department',
    qualification: 'M.Sc. Mathematics, B.Ed.',
    email: 'devi@eduhome.ac.in',
    phone: '+91 98470 67890',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    allowedGrades: ['6', '7', '8', '9', '10', '11', '12'],
    gradeDescription: 'Grades 6th to 12th (All Secondary & Higher Secondary)',
    isTemporary: false,
  },
];

const ACTIVE_TEACHER_KEY = 'eduhome_active_faculty_id';
// v4: bumped to bust stale cache entries that had corrupted allowedGrades
// due to the parseAllowedGrades 'physics'.includes('cs') bug.
const ROSTER_CACHE_KEY = 'eduhome_teacher_roster_cache_v4';

export function parseAllowedGrades(subjectsStr?: string): string[] {
  if (!subjectsStr) return ['11', '12'];
  const s = subjectsStr.toLowerCase();

  // First check if the string explicitly names grade numbers (e.g. "8th-12th", "Class 9, 10")
  // Only trust these explicit numbers — do NOT infer from subject name alone
  const matches = subjectsStr.match(/\b(1[0-2]|[6-9])\b/g);
  if (matches && matches.length > 0) {
    return Array.from(new Set(matches)).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }

  // Wildcard / "all grades"
  if (s.includes('all') || s.includes('*')) {
    return ['6', '7', '8', '9', '10', '11', '12'];
  }

  // IMPORTANT: NEVER use s.includes('cs') here!
  // 'physics' ends in 'cs', 'mathematics' ends in 'cs' — substring match is wrong.
  // Use word-boundary regex \bcs\b to match only standalone "CS".
  if (s.includes('comp') || /\bcs\b/i.test(subjectsStr)) {
    return ['11', '12'];
  }

  // No grade info found — return a safe wide default so no class is incorrectly dropped
  return ['6', '7', '8', '9', '10', '11', '12'];
}

export function getInitials(name: string): string {
  if (!name) return 'FA';
  return name
    .replace(/Dr\.|Mr\.|Mrs\.|Ms\./g, '')
    .trim()
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'FA';
}

/**
 * Loads teacher roster from local storage and syncs with Supabase teachers table.
 *
 * IMPORTANT: This function NEVER mutates the global TEACHER_ROSTER array.
 * It always deep-copies the source-of-truth static array and applies
 * overrides only to that copy, so repeated calls don't accumulate corruption.
 */
export async function getTeacherRoster(): Promise<TeacherProfile[]> {
  // Always start from a fresh deep copy of the hardcoded static roster.
  // This is the source of truth for allowedGrades, subject, department, etc.
  const working: TeacherProfile[] = TEACHER_ROSTER.map((t) => ({ ...t }));

  // Helper: find entry in our working copy by ID
  const findInWorking = (id: string) => working.find((t) => t.id === id);

  // 1. Apply personal-detail overrides from local SecureStore cache
  //    (Only name, phone, email, qualification — never allowedGrades from cache,
  //     since old cache may contain corrupted grades from the previous bug.)
  try {
    const cached = await SecureStore.getItemAsync(ROSTER_CACHE_KEY);
    if (cached) {
      const parsed: TeacherProfile[] = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach((saved) => {
          const match = findInWorking(saved.id);
          if (match) {
            // Only overlay safe personal fields from cache
            if (saved.name) match.name = saved.name;
            if (saved.phone) match.phone = saved.phone;
            if (saved.email) match.email = saved.email;
            if (saved.qualification) match.qualification = saved.qualification;
            // Do NOT restore allowedGrades from old cache — hardcoded values are correct
          }
          // Do NOT push unknown IDs from cache — only Supabase can add new teachers
        });
      }
    }
  } catch (e) {
    console.warn('Error reading cached roster:', e);
  }

  // 2. Fetch fresh from Supabase teachers table
  try {
    const { data, error } = await supabase.from('teachers').select('*');
    if (!error && Array.isArray(data) && data.length > 0) {
      data.forEach((remote: any) => {
        if (!remote.faculty_id) return;
        const match = findInWorking(remote.faculty_id);
        if (match) {
          // Safe personal-detail overrides from Supabase
          if (remote.name) match.name = remote.name;
          if (remote.phone) match.phone = remote.phone;

          if (remote.subjects) {
            // Update display description only
            match.gradeDescription = remote.subjects;

            // Update subject name (strip parenthetical qualifiers)
            const parsedSubject = remote.subjects.split('(')[0].trim();
            // Only update subject if the Supabase value contains a real subject keyword.
            // This prevents a bad row like 'Physics & Chemistry' overwriting a CS teacher.
            if (parsedSubject && parsedSubject !== match.subject) {
              // Only trust Supabase subject if it's a strict known subject name,
              // not a combined/description string
              const knownSubjects = ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Computer Science', 'Maths', 'Science'];
              const matchesKnown = knownSubjects.some((ks) => parsedSubject.toLowerCase().startsWith(ks.toLowerCase()));
              if (matchesKnown) {
                match.subject = parsedSubject;
              }
            }

            // ONLY overwrite allowedGrades when Supabase subjects string has explicit grade numbers.
            // e.g. "Physics (8th-12th)" → safe to parse. "Physics" alone → keep hardcoded grades.
            const hasExplicitGrades = /\b(1[0-2]|[6-9])\b/.test(remote.subjects);
            if (hasExplicitGrades) {
              match.allowedGrades = parseAllowedGrades(remote.subjects);
            }
            // Otherwise hardcoded allowedGrades from static roster remain intact
          }
        } else if (remote.faculty_id.startsWith('fac-') || remote.faculty_id.startsWith('FAC-')) {
          // Genuinely new teacher from Supabase not in static roster
          const parsedGrades = parseAllowedGrades(remote.subjects);
          working.push({
            id: remote.faculty_id,
            name: remote.name || 'Faculty Member',
            subject: remote.subjects ? remote.subjects.split('(')[0].trim() : 'General',
            department: 'Academic Faculty',
            qualification: 'Academic Specialist',
            email: `${remote.faculty_id}@eduhome.ac.in`,
            phone: remote.phone || '+91 98470 00000',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            allowedGrades: parsedGrades,
            gradeDescription: remote.subjects || 'Assigned Classes',
          });
        }
      });

      // Save ONLY the personal-detail fields to cache (never allowedGrades/subject from Supabase)
      const safeCache = working.map((t) => ({
        id: t.id,
        name: t.name,
        phone: t.phone,
        email: t.email,
        qualification: t.qualification,
      }));
      await SecureStore.setItemAsync(ROSTER_CACHE_KEY, JSON.stringify(safeCache));
    }
  } catch (err) {
    console.warn('Error syncing roster from Supabase:', err);
  }

  return working;
}

/**
 * Accurately determines if a student's enrolled subjects list matches a target subject.
 * Note: Must NEVER use substring 'cs' because words like 'physics' and 'mathematics' end in 'cs'!
 */
export function isStudentEnrolledInSubject(studentSubjectsStr?: string, targetSubject?: string): boolean {
  if (!targetSubject || targetSubject === 'All' || targetSubject === 'All Subjects' || targetSubject === 'All Students') {
    return true;
  }
  const stu = (studentSubjectsStr || '').toLowerCase();
  const tgt = targetSubject.toLowerCase().trim();

  // 1. Computer Science (Do NOT use substring 'cs' because 'physics' ends in 'cs'!)
  if (tgt.includes('comp') || /\bcs\b/i.test(tgt)) {
    return stu.includes('computer') || /\bcs\b/i.test(stu);
  }

  // 2. Mathematics
  if (tgt.includes('math')) {
    return stu.includes('math');
  }

  // 3. Physics
  if (tgt.includes('phys')) {
    return stu.includes('phys');
  }

  // 4. Chemistry
  if (tgt.includes('chem')) {
    return stu.includes('chem');
  }

  // 5. Biology
  if (tgt.includes('bio')) {
    return stu.includes('bio');
  }

  // 6. General Science (Grades 6-9)
  if (tgt === 'science' || tgt.startsWith('science')) {
    return stu.includes('science') || stu.includes('phys') || stu.includes('chem') || stu.includes('bio');
  }

  return stu.includes(tgt);
}

/**
 * Normalizes subject names for matching.
 * e.g. "Biology (Lower)" -> "biology", "Computer Science" -> "computer science"
 */
export function normalizeSubject(subject: string): string {
  const s = subject.toLowerCase();
  if (s.includes('computer')) return 'computer';
  if (s.includes('bio')) return 'biology';
  if (s.includes('chem')) return 'chemistry';
  if (s.includes('phys')) return 'physics';
  if (s.includes('math')) return 'mathematics';
  return s.trim();
}

/**
 * Extracts numeric class grade from class/batch string.
 * e.g. "Class 11 Science" -> "11", "Class 10" -> "10", "Grade 9" -> "9"
 */
export function extractGrade(str: string): string | null {
  const match = str.match(/\b(1[0-2]|[1-9])\b/);
  return match ? match[1] : null;
}

/**
 * Checks if a teacher profile is permitted to teach a specific grade and subject.
 */
export function isTeacherAssignedToClass(
  teacher: TeacherProfile,
  classItem: {
    id?: string;
    class_grade?: string;
    roll_no?: string;
    subject?: string;
    title?: string;
    class?: string;
    batch?: string;
    status?: string;
    time?: string;
  }
): boolean {
  if (!teacher || !classItem) return false;

  // 1. Direct Allotment ID match in status (e.g. 'upcoming:fac-cs')
  if (classItem.status && classItem.status.includes('fac-')) {
    return classItem.status.includes(teacher.id);
  }

  // 2. Direct Allotment Name match in time string (e.g. '• Ms. Ananya Sharma')
  if (classItem.time && teacher.name && classItem.time.toLowerCase().includes(teacher.name.toLowerCase())) {
    return true;
  }

  // If another faculty member's name is in the time string, do NOT match
  if (classItem.time) {
    const hasOtherTeacher = TEACHER_ROSTER.some(
      (other) => other.id !== teacher.id && other.name && classItem.time?.toLowerCase().includes(other.name.toLowerCase())
    );
    if (hasOtherTeacher) {
      return false;
    }
  }

  // 3. Subject match: Class subject must match this active teacher's subject domain
  const itemSubject = (classItem.subject || classItem.title || '').toLowerCase().trim();
  const teacherSubNorm = normalizeSubject(teacher.subject);
  const itemSubNorm = normalizeSubject(itemSubject);

  if (!itemSubNorm || !teacherSubNorm) return false;
  const subjectMatches = itemSubNorm.includes(teacherSubNorm) || teacherSubNorm.includes(itemSubNorm);
  if (!subjectMatches) {
    return false;
  }

  // 4. Grade match check
  const classText = `${classItem.class_grade || ''} ${classItem.roll_no || ''} ${classItem.class || ''} ${classItem.batch || ''} ${classItem.title || ''}`;
  const grade = extractGrade(classText);
  if (!grade) {
    return false;
  }

  return teacher.allowedGrades.includes('*') || teacher.allowedGrades.includes(grade);
}

let inMemoryActiveId: string | null = null;

type TeacherChangeListener = (teacher: TeacherProfile) => void;
const teacherListeners = new Set<TeacherChangeListener>();

export function subscribeToActiveTeacher(callback: TeacherChangeListener): () => void {
  teacherListeners.add(callback);
  return () => {
    teacherListeners.delete(callback);
  };
}

export async function getActiveTeacher(): Promise<TeacherProfile> {
  // Always fetch the clean copy (never reads from the global mutated TEACHER_ROSTER)
  const roster = await getTeacherRoster();

  try {
    const savedId = inMemoryActiveId || (await SecureStore.getItemAsync(ACTIVE_TEACHER_KEY));
    if (savedId) {
      inMemoryActiveId = savedId;
      const found = roster.find((t) => t.id === savedId);
      if (found) return { ...found };
    }
  } catch (e) {
    console.warn('Error reading active faculty:', e);
  }
  return { ...roster[0] };
}

export async function setActiveTeacherId(teacherId: string): Promise<void> {
  inMemoryActiveId = teacherId;
  // Use the clean roster copy so listeners receive correct grades/subject
  const roster = await getTeacherRoster();
  const match = roster.find((t) => t.id === teacherId);
  if (match) {
    teacherListeners.forEach((fn) => {
      try {
        fn({ ...match });
      } catch (e) {
        console.warn('Listener notification error:', e);
      }
    });
  }
  try {
    await SecureStore.setItemAsync(ACTIVE_TEACHER_KEY, teacherId);
  } catch (e) {
    console.warn('Error saving active faculty:', e);
  }
}

/**
 * Allows faculty to update their personal details (Name, Phone, Email, Qualification).
 * Strictly PREVENTS modifying academic allotments (Subject, Grades, Department, Role).
 */
export async function updateFacultySelfProfile(
  facultyId: string,
  updates: {
    name: string;
    phone?: string;
    email?: string;
    qualification?: string;
  }
): Promise<{ success: boolean; error?: string; updated?: TeacherProfile }> {
  if (!updates.name || !updates.name.trim()) {
    return { success: false, error: 'Full name cannot be empty.' };
  }

  const trimmedName = updates.name.trim();
  const trimmedPhone = (updates.phone || '').trim();
  const trimmedEmail = (updates.email || '').trim();
  const trimmedQual = (updates.qualification || '').trim();

  // Find in memory
  const profile = TEACHER_ROSTER.find((t) => t.id === facultyId);
  if (!profile) {
    return { success: false, error: 'Faculty profile not found.' };
  }

  // Update in-memory profile
  profile.name = trimmedName;
  if (trimmedPhone) profile.phone = trimmedPhone;
  if (trimmedEmail) profile.email = trimmedEmail;
  if (trimmedQual) profile.qualification = trimmedQual;

  // Persist locally
  try {
    await SecureStore.setItemAsync(ROSTER_CACHE_KEY, JSON.stringify(TEACHER_ROSTER));
  } catch (e) {}

  // Sync to Supabase teachers table so admin portal sees it immediately
  try {
    const { error: dbError } = await supabase
      .from('teachers')
      .update({
        name: trimmedName,
        phone: trimmedPhone || profile.phone,
        avatar: getInitials(trimmedName),
      })
      .eq('faculty_id', facultyId);

    if (dbError) {
      console.warn('Supabase profile update warning:', dbError);
    }
  } catch (e) {
    console.warn('Supabase update failed:', e);
  }

  return { success: true, updated: { ...profile } };
}
