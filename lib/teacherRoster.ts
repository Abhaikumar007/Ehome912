import * as SecureStore from 'expo-secure-store';

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

const ACTIVE_TEACHER_KEY = '@active_faculty_id';

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
    subject?: string;
    title?: string;
    class?: string;
    batch?: string;
    status?: string;
    time?: string;
  }
): boolean {
  // 1. Direct Allotment ID match in status (e.g. 'upcoming:fac-chem')
  if (classItem.status && classItem.status.includes(teacher.id)) {
    return true;
  }

  // 2. Direct Allotment Name match in time string (e.g. '4:00 PM - 6:00 PM • Dr. Ramesh Nair')
  if (classItem.time && classItem.time.toLowerCase().includes(teacher.name.toLowerCase())) {
    return true;
  }

  // If another faculty member's id is explicitly assigned, don't show to other teachers
  if (classItem.status && classItem.status.startsWith('upcoming:fac-') && !classItem.status.includes(teacher.id)) {
    return false;
  }

  // 3. Fallback rule-based matching based on teacher's subject & allowed grades
  const itemSubject = (classItem.subject || classItem.title || '').toLowerCase();
  const teacherSubNorm = normalizeSubject(teacher.subject);
  const itemSubNorm = normalizeSubject(itemSubject);

  // Subject match check
  const subjectMatches = itemSubNorm.includes(teacherSubNorm) || teacherSubNorm.includes(itemSubNorm);
  if (!subjectMatches) {
    return false;
  }

  // Grade match check
  const classText = `${classItem.class || ''} ${classItem.batch || ''} ${classItem.title || ''}`;
  const grade = extractGrade(classText);
  if (!grade) {
    // If no grade explicitly parsed, allow if subject strictly matches and teacher has wide assignment
    return true;
  }

  return teacher.allowedGrades.includes('*') || teacher.allowedGrades.includes(grade);
}

export async function getActiveTeacher(): Promise<TeacherProfile> {
  try {
    const savedId = await SecureStore.getItemAsync(ACTIVE_TEACHER_KEY);
    if (savedId) {
      const found = TEACHER_ROSTER.find(t => t.id === savedId);
      if (found) return found;
    }
  } catch (e) {
    console.warn('Error reading active faculty:', e);
  }
  return TEACHER_ROSTER[0]; // Default to Dr. Ramesh Nair (Chemistry)
}

export async function setActiveTeacherId(teacherId: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(ACTIVE_TEACHER_KEY, teacherId);
  } catch (e) {
    console.warn('Error saving active faculty:', e);
  }
}
