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
    subject: 'Academic Head & Physics',
    department: 'Senior Science & Administration',
    qualification: 'M.Sc. Physics, B.Ed.',
    email: 'abhai.kumar@eduhome.ac.in',
    phone: '+91 91234 56780',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    allowedGrades: ['*'],
    gradeDescription: 'All Grades (Academic Head / Super Admin)',
  },
  {
    id: 'fac-chem',
    name: 'Dr. Ramesh Nair',
    subject: 'Chemistry',
    department: 'Senior Science Department',
    qualification: 'M.Sc., Ph.D. in Chemistry',
    email: 'ramesh.nair@eduhome.ac.in',
    phone: '+91 98470 12345',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    allowedGrades: ['10', '11', '12'],
    gradeDescription: 'Grades 10th to 12th',
  },
  {
    id: 'fac-bio-lower',
    name: 'Mrs. Deepa Anoop',
    subject: 'Biology (Lower)',
    department: 'Secondary Science Department',
    qualification: 'M.Sc. Botany, B.Ed.',
    email: 'deepa.anoop@eduhome.ac.in',
    phone: '+91 98470 23456',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    allowedGrades: ['6', '7', '8', '9'],
    gradeDescription: 'Grades up to 9th (6th - 9th)',
  },
  {
    id: 'fac-bio-upper',
    name: 'Dr. Suresh Kumar',
    subject: 'Biology (Upper)',
    department: 'Senior Science Department',
    qualification: 'M.Sc. Zoology, Ph.D., B.Ed.',
    email: 'suresh.kumar@eduhome.ac.in',
    phone: '+91 98470 34567',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    allowedGrades: ['10', '11', '12'],
    gradeDescription: 'Grades 10th and above (10th - 12th)',
  },
  {
    id: 'fac-phy',
    name: 'Mr. Rajesh Menon',
    subject: 'Physics',
    department: 'Science Department',
    qualification: 'M.Sc. Physics, M.Phil',
    email: 'rajesh.menon@eduhome.ac.in',
    phone: '+91 98470 45678',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    allowedGrades: ['8', '9', '10', '11', '12'],
    gradeDescription: 'Secondary & Higher Secondary (8th - 12th)',
  },
  {
    id: 'fac-cs',
    name: 'Ms. Ananya Sharma',
    subject: 'Computer Science',
    department: 'Computer Applications & IT',
    qualification: 'M.Tech Computer Science',
    email: 'ananya.sharma@eduhome.ac.in',
    phone: '+91 98470 56789',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    allowedGrades: ['11', '12'],
    gradeDescription: 'Grades 11th & 12th',
  },
  {
    id: 'fac-math',
    name: 'Mr. Arun K. Varma',
    subject: 'Mathematics',
    department: 'Secondary Mathematics',
    qualification: 'M.Sc. Mathematics, B.Ed.',
    email: 'arun.varma@eduhome.ac.in',
    phone: '+91 98470 67890',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    allowedGrades: ['6', '7', '8', '9'],
    gradeDescription: 'Temporarily Assigned: 6th, 7th, 8th & 9th',
    isTemporary: true,
  },
];

const ACTIVE_TEACHER_KEY = 'eduhome_active_faculty_id';
const ROSTER_CACHE_KEY = 'eduhome_teacher_roster_cache_v2';

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
 */
export async function getTeacherRoster(): Promise<TeacherProfile[]> {
  // 1. Try reading from local cache
  try {
    const cached = await SecureStore.getItemAsync(ROSTER_CACHE_KEY);
    if (cached) {
      const parsed: TeacherProfile[] = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach((saved) => {
          const match = TEACHER_ROSTER.find((t) => t.id === saved.id);
          if (match) {
            match.name = saved.name || match.name;
            match.phone = saved.phone || match.phone;
            match.email = saved.email || match.email;
            match.qualification = saved.qualification || match.qualification;
          } else {
            TEACHER_ROSTER.push(saved);
          }
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
        const match = TEACHER_ROSTER.find((t) => t.id === remote.faculty_id);
        if (match) {
          if (remote.name) match.name = remote.name;
          if (remote.phone) match.phone = remote.phone;
        } else if (remote.faculty_id.startsWith('fac-')) {
          TEACHER_ROSTER.push({
            id: remote.faculty_id,
            name: remote.name || 'Faculty Member',
            subject: remote.subjects ? remote.subjects.split('(')[0].trim() : 'General',
            department: 'Academic Faculty',
            qualification: 'Academic Specialist',
            email: `${remote.faculty_id}@eduhome.ac.in`,
            phone: remote.phone || '+91 98470 00000',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            allowedGrades: ['*'],
            gradeDescription: remote.subjects || 'Assigned Classes',
          });
        }
      });

      // Update cache
      await SecureStore.setItemAsync(ROSTER_CACHE_KEY, JSON.stringify(TEACHER_ROSTER));
    }
  } catch (err) {
    console.warn('Error syncing roster from Supabase:', err);
  }

  return [...TEACHER_ROSTER];
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

export async function getActiveTeacher(): Promise<TeacherProfile> {
  // Ensure roster is initialized with latest names
  await getTeacherRoster();

  try {
    const savedId = await SecureStore.getItemAsync(ACTIVE_TEACHER_KEY);
    if (savedId) {
      const found = TEACHER_ROSTER.find((t) => t.id === savedId);
      if (found) return { ...found };
    }
  } catch (e) {
    console.warn('Error reading active faculty:', e);
  }
  return { ...TEACHER_ROSTER[0] }; // Default to Dr. Ramesh Nair (Chemistry)
}

export async function setActiveTeacherId(teacherId: string): Promise<void> {
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
