// ─── STUDENT DATA ────────────────────────────────────────────────────────────

export const studentData = {
  name: 'Arjun S',
  rollNo: '2024-JEE-0842',
  class: 'Class 12',
  batch: 'JEE Target (Batch A)',
  avatar: 'AS',
  streak: 12,
  accuracy: 86,
  testsCompleted: 16,
  topPercent: 8,
};

// ─── TODAY'S CLASSES ──────────────────────────────────────────────────────────

export const todaysClasses = [
  { id: '1', time: '5:00 PM – 6:00 PM',  subject: 'Physics',   status: 'present',  published: true },
  { id: '2', time: '6:00 PM – 7:00 PM',  subject: 'Chemistry', status: 'absent',   published: true },
  { id: '3', time: '7:00 PM – 8:00 PM',  subject: 'Maths',     status: 'upcoming', published: true },
  { id: '4', time: '8:00 PM – 9:00 PM',  subject: 'Biology',   status: 'upcoming', published: true },
];

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────

export const attendanceData = {
  overall: 92,
  attended: 46,
  total: 50,
  todaySubjects: [
    { id: '1', subject: 'Physics',     time: '09:00 AM – 10:30 AM', icon: 'flash',    status: 'present' },
    { id: '2', subject: 'Mathematics', time: '11:00 AM – 12:30 PM', icon: 'book',     status: 'present' },
    { id: '3', subject: 'Chemistry',   time: '02:00 PM – 03:30 PM', icon: 'flask',    status: 'absent' },
    { id: '4', subject: 'Biology',     time: '04:00 PM – 05:30 PM', icon: 'leaf',     status: 'present' },
  ],
  history: [
    { date: 'Tue, 08 Sep 2026', subjects: 'Physics, Math, Chemistry, Biology', score: '4/4', status: 'full' },
    { date: 'Mon, 07 Sep 2026', subjects: 'Physics, Math, Biology',             score: '3/3', status: 'full' },
    { date: 'Sat, 05 Sep 2026', subjects: 'Chemistry, Biology',                 score: '1/2', status: 'partial' },
    { date: 'Fri, 04 Sep 2026', subjects: 'Physics, Math, Chemistry, Biology',  score: '4/4', status: 'full' },
  ],
};

// ─── FEES ────────────────────────────────────────────────────────────────────

export const feesData = {
  currentDue: 1, // Set to ₹1 for testing as requested
  dueDate: '25 Sep 2026',
  daysLeft: 6,
  isPaid: false,
  status: 'due' as 'due' | 'pending_verification' | 'paid',
  upiId: 'devitintu12345@oksbi',
  payeeName: 'EduHome Tuition Center',
  loyaltyMonths: [
    { label: 'Month 1', earned: true },
    { label: 'Month 2', earned: true },
    { label: 'Month 3', earned: false, comingSoon: true },
  ],
  monthsPaidOnTime: 2,
  recentPayments: [
    { month: 'AUG', fullMonth: 'August 2026', paidOn: '08 Aug 2026, 07:03 PM', amount: 6000, onTime: true, status: 'Verified' },
    { month: 'JUL', fullMonth: 'July 2026',   paidOn: '09 Jul 2026, 05:56 PM', amount: 6000, onTime: true, status: 'Verified' },
  ],
};

// ─── PROGRESS ────────────────────────────────────────────────────────────────

export const progressData = {
  testsAttended: 18,
  highestScore: 96,
  topPercent: 8,
  totalStudents: 1200,
  improvement: 16,
  chartLabels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'],
  yourScores:  [48,   62,   68,   72,   78,   82,   88,   92],
  avgScores:   [50,   50,   52,   55,   58,   60,   62,   65],
  accuracy: 86,
  incorrect: 14,
  commonMistakes: [
    { rank: 1, text: 'Sign errors in equations',    count: 24 },
    { rank: 2, text: 'Unit conversion mistakes',    count: 18 },
    { rank: 3, text: 'Diagram-based questions',     count: 15 },
    { rank: 4, text: 'Formula recall errors',       count: 12 },
  ],
  practice: { attended: 18, completed: 14, pending: 4, highest: 96 },
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
  role: 'Super Admin',
  subjects: 'Physics & Chemistry',
  avatar: 'RM',
  date: 'Tue, 9 Sep 2026',
  classes: [
    { id: 'c1', label: 'Class 10-A (Physics)',    active: true },
    { id: 'c2', label: 'Class 10-B (Chemistry)',  active: false },
    { id: 'c3', label: 'Class 11-A (Maths)',      active: false },
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
