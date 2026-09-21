// ─── STUDENT DATA ────────────────────────────────────────────────────────────

export const studentData = {
  name: 'Arjun S',
  rollNo: '2024-JEE-0842',
  class: 'Class 12',
  batch: 'JEE Target (Batch A)',
  avatar: 'AS',
  streak: 0,
  accuracy: 0,
  testsCompleted: 0,
  topPercent: 0,
};

// ─── TODAY'S CLASSES ──────────────────────────────────────────────────────────

export const todaysClasses: any[] = [];

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────

export const attendanceData = {
  overall: 0,
  attended: 0,
  total: 0,
  todaySubjects: [] as any[],
  history: [] as any[],
};

// ─── FEES ────────────────────────────────────────────────────────────────────

export const feesData = {
  currentDue: 0, // placeholder; actual amount loaded from EDUSYNC_FEES per student
  monthlyFee: 0, // loaded from student record
  actualDue: 0,
  dueDate: '—',
  daysLeft: 0,
  isPaid: false,
  status: 'due' as 'due' | 'pending_verification' | 'paid',
  upiId: 'devitintu12345@oksbi',
  payeeName: 'EduHome Tuition Center',
  loyaltyMonths: [
    { label: 'Month 1', earned: false },
    { label: 'Month 2', earned: false },
    { label: 'Month 3', earned: false, comingSoon: true },
  ],
  monthsPaidOnTime: 0,
  recentPayments: [] as any[],
};

// ─── PROGRESS ────────────────────────────────────────────────────────────────

export const progressData = {
  testsAttended: 0,
  highestScore: 0,
  topPercent: 0,
  totalStudents: 0,
  improvement: 0,
  chartLabels: [] as string[],
  yourScores:  [] as number[],
  avgScores:   [] as number[],
  accuracy: 0,
  incorrect: 0,
  commonMistakes: [] as { rank: number; text: string; count: number }[],
  practice: { attended: 0, completed: 0, pending: 0, highest: 0 },
};

// ─── MATERIALS ────────────────────────────────────────────────────────────────

export const studyMaterials = [
  {
    id: 'sm1',
    subject: 'Physics',
    chapter: 'Chapter 10',
    title: 'Light – Reflection & Refraction',
    desc: 'Comprehensive board revision with teacher annotations',
    tag: "Teacher's Handwritten Notes",
    tagColor: '#EBF3FF',
    pages: 14,
    size: '4.2 MB',
    icon: 'flash-outline',
    iconBg: '#EBF3FF',
    iconColor: '#1A56DB',
  },
  {
    id: 'sm2',
    subject: 'Chemistry',
    chapter: 'Chapter 1',
    title: 'Chemical Reactions & Equations',
    desc: 'Reaction balancing methods & precipitate indicators',
    tag: 'Revision Summary + Formulas',
    tagColor: '#ECFDF3',
    pages: 8,
    size: '2.8 MB',
    icon: 'flask-outline',
    iconBg: '#ECFDF3',
    iconColor: '#12B76A',
  },
  {
    id: 'sm3',
    subject: 'Mathematics',
    chapter: 'Chapter 4',
    title: 'Quadratic Equations Masterclass',
    desc: 'Discriminant analysis, roots nature & word problems',
    tag: 'Formula Sheet + Solved Examples',
    tagColor: '#FFF7ED',
    pages: 10,
    size: '3.1 MB',
    icon: 'calculator-outline',
    iconBg: '#FFF7ED',
    iconColor: '#EA580C',
  },
];

// ─── TEACHER DATA ─────────────────────────────────────────────────────────────

export const teacherData = {
  name: 'Mr. R Madhusudanan',
  role: 'Faculty',
  subjects: 'Physics & Chemistry',
  avatar: 'RM',
  date: 'Tue, 9 Sep 2026',
  classes: [
    { id: 'c1', label: 'Class 10-A (Physics)',    active: true },
    { id: 'c2', label: 'Class 10-B (Chemistry)',  active: false },
    { id: 'c3', label: 'Class 11-A (Maths)',      active: false },
    { id: 'c4', label: 'Class 12-JEE (Physics & Chem)', active: false },
  ],
  summary: { total: 42, present: 38, absent: 4 },
  students: [
    { id: 's1', no: '01', name: 'Arjun S',  roll: '#2026-1001', overall: '94%', online: true,  attendance: 'P' },
    { id: 's2', no: '02', name: 'Akhil S',  roll: '#2026-1002', overall: '91%', online: true,  attendance: 'P' },
    { id: 's3', no: '03', name: 'Ananya R', roll: '#2026-1003', overall: '88%', online: false, attendance: 'A', note: 'Sick Leave' },
    { id: 's4', no: '04', name: 'Dev P',    roll: '#2026-1004', overall: '88%', online: true,  attendance: 'P' },
    { id: 's5', no: '05', name: 'Meera K',  roll: '#2026-1005', overall: '96%', online: true,  attendance: 'P' },
    { id: 's6', no: '06', name: 'Riya M',   roll: '#2026-1006', overall: '82%', online: true,  attendance: 'P' },
    { id: 's7', no: '07', name: 'Karan V',  roll: '#2026-1007', overall: '79%', online: false, attendance: 'A' },
    { id: 's8', no: '08', name: 'Priya S',  roll: '#2026-1008', overall: '90%', online: true,  attendance: 'P' },
  ],
};
