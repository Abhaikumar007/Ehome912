export interface EduStudent {
  rollNo: string;
  pin: string;
  name: string;
  class: string;
  batch: string;
  avatar: string;
  phone: string;
  school?: string;
  streak: number;
  accuracy: number;
  testsCompleted: number;
  topPercent: number;
  recentScore?: string;
  avatarColor?: string;
  monthlyFee: number;
  currentDue: number;
  dueDate: string;
  daysLeft: number;
  joiningDate?: string;
  joiningDateIso?: string;
  monthsPaidOnTime: number;
  subjects: string;
}

const AVATAR_COLORS = ['#0284C7', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#6366F1'];

const RAW_STUDENTS: Omit<EduStudent, 'recentScore' | 'avatarColor'>[] = [
  { rollNo: '2024-JEE-0842', pin: '1234', name: 'Arjun S', class: 'Class 12', batch: 'Class 12', avatar: 'AS', phone: '9846012345', school: 'EduHome Campus', streak: 0, accuracy: 0, testsCompleted: 0, topPercent: 0, monthlyFee: 4000, currentDue: 4000, dueDate: '15 Sep 2026', daysLeft: -5, joiningDate: '15 Jan 2026', joiningDateIso: '2026-01-15', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Maths' },
  { rollNo: 'EDU-2026-001', pin: '1234', name: 'Amaljith', class: 'Class 10', batch: 'Class 10', avatar: 'AM', phone: '9895423986', school: 'Vendar', streak: 7, accuracy: 78, testsCompleted: 8, topPercent: 4, monthlyFee: 3000, currentDue: 3000, dueDate: '18 Sep 2026', daysLeft: -2, joiningDate: '18 Apr 2026', joiningDateIso: '2026-04-18', monthsPaidOnTime: 2, subjects: 'Physics, Maths, Biology' },
  { rollNo: 'EDU-2026-002', pin: '1234', name: 'Karthik', class: 'Class 11', batch: 'Class 11', avatar: 'KA', phone: '9961796378', school: 'Boys', streak: 8, accuracy: 79, testsCompleted: 9, topPercent: 5, monthlyFee: 2500, currentDue: 2500, dueDate: '06 Sep 2026', daysLeft: -14, joiningDate: '06 Jul 2026', joiningDateIso: '2026-07-06', monthsPaidOnTime: 2, subjects: 'Physics, Maths' },
  { rollNo: 'EDU-2026-003', pin: '1234', name: 'Sivanya', class: 'Class 11', batch: 'Class 11', avatar: 'SI', phone: '8848157457', school: 'Boys', streak: 9, accuracy: 80, testsCompleted: 10, topPercent: 6, monthlyFee: 4500, currentDue: 4500, dueDate: '01 Sep 2026', daysLeft: -19, joiningDate: '01 May 2026', joiningDateIso: '2026-05-01', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Maths, Biology' },
  { rollNo: 'EDU-2026-004', pin: '1234', name: 'Abhinanda', class: 'Class 9', batch: 'Class 9', avatar: 'AB', phone: '9895446203', school: 'Vendar', streak: 10, accuracy: 81, testsCompleted: 11, topPercent: 7, monthlyFee: 2000, currentDue: 2000, dueDate: '01 Sep 2026', daysLeft: -19, joiningDate: '01 May 2026', joiningDateIso: '2026-05-01', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Maths, Biology' },
  { rollNo: 'EDU-2026-005', pin: '1234', name: 'Krishnaveni', class: 'Class 8', batch: 'Class 8', avatar: 'KR', phone: '9544443618', school: 'Puthoor', streak: 11, accuracy: 82, testsCompleted: 12, topPercent: 8, monthlyFee: 750, currentDue: 750, dueDate: '04 Sep 2026', daysLeft: -16, joiningDate: '04 May 2026', joiningDateIso: '2026-05-04', monthsPaidOnTime: 2, subjects: 'Maths' },
  { rollNo: 'EDU-2026-006', pin: '1234', name: 'Meerakrishnan', class: 'Class 7', batch: 'Class 7', avatar: 'ME', phone: '8089939249', school: 'Marthoma', streak: 12, accuracy: 83, testsCompleted: 13, topPercent: 9, monthlyFee: 600, currentDue: 600, dueDate: '23 Sep 2026', daysLeft: 3, joiningDate: '23 May 2026', joiningDateIso: '2026-05-23', monthsPaidOnTime: 2, subjects: 'Maths' },
  { rollNo: 'EDU-2026-007', pin: '1234', name: 'Niranjana', class: 'Class 12', batch: 'Class 12', avatar: 'NI', phone: '7025747029', school: 'Divine', streak: 13, accuracy: 84, testsCompleted: 14, topPercent: 10, monthlyFee: 1000, currentDue: 1000, dueDate: '23 Sep 2026', daysLeft: 3, joiningDate: '23 May 2026', joiningDateIso: '2026-05-23', monthsPaidOnTime: 2, subjects: 'Physics' },
  { rollNo: 'EDU-2026-008', pin: '1234', name: 'Vaiga', class: 'Class 8', batch: 'Class 8', avatar: 'VA', phone: '9446614427', school: 'Marthoma', streak: 14, accuracy: 85, testsCompleted: 15, topPercent: 11, monthlyFee: 1500, currentDue: 1500, dueDate: '23 Sep 2026', daysLeft: 3, joiningDate: '23 May 2026', joiningDateIso: '2026-05-23', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Maths, Biology' },
  { rollNo: 'EDU-2026-009', pin: '1234', name: 'Sari N Raj', class: 'Class 12', batch: 'Class 12', avatar: 'SA', phone: '9746865309', school: 'Boys VHSE', streak: 7, accuracy: 86, testsCompleted: 16, topPercent: 12, monthlyFee: 3500, currentDue: 3500, dueDate: '24 Sep 2026', daysLeft: 4, joiningDate: '24 May 2026', joiningDateIso: '2026-05-24', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Biology' },
  { rollNo: 'EDU-2026-010', pin: '1234', name: 'Aromal', class: 'Class 8', batch: 'Class 8', avatar: 'AR', phone: '9745777289', school: 'Technical Scool', streak: 8, accuracy: 87, testsCompleted: 17, topPercent: 13, monthlyFee: 1500, currentDue: 1500, dueDate: '08 Sep 2026', daysLeft: -12, joiningDate: '08 Apr 2026', joiningDateIso: '2026-04-08', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Maths' },
  { rollNo: 'EDU-2026-011', pin: '1234', name: 'Vaishnavi', class: 'Class 8', batch: 'Class 8', avatar: 'VA', phone: '7558859373', school: 'Siddhartha', streak: 9, accuracy: 88, testsCompleted: 8, topPercent: 14, monthlyFee: 1500, currentDue: 1500, dueDate: '05 Sep 2026', daysLeft: -15, joiningDate: '05 Apr 2026', joiningDateIso: '2026-04-05', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Maths, Biology' },
  { rollNo: 'EDU-2026-012', pin: '1234', name: 'Avani', class: 'Class 9', batch: 'Class 9', avatar: 'AV', phone: '8921856088', school: 'Puthoor', streak: 10, accuracy: 89, testsCompleted: 9, topPercent: 15, monthlyFee: 1000, currentDue: 1000, dueDate: '06 Sep 2026', daysLeft: -14, joiningDate: '06 Apr 2026', joiningDateIso: '2026-04-06', monthsPaidOnTime: 2, subjects: 'Maths' },
  { rollNo: 'EDU-2026-013', pin: '1234', name: 'Nakshathra', class: 'Class 9', batch: 'Class 9', avatar: 'NA', phone: '9633076463', school: 'Marthoma', streak: 11, accuracy: 90, testsCompleted: 10, topPercent: 16, monthlyFee: 2000, currentDue: 2000, dueDate: '06 Sep 2026', daysLeft: -14, joiningDate: '06 Apr 2026', joiningDateIso: '2026-04-06', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Maths, Biology' },
  { rollNo: 'EDU-2026-014', pin: '1234', name: 'Asna', class: 'Class 10', batch: 'Class 10', avatar: 'AS', phone: '9446253365', school: 'Marthoma', streak: 12, accuracy: 91, testsCompleted: 11, topPercent: 17, monthlyFee: 2000, currentDue: 2000, dueDate: '06 Sep 2026', daysLeft: -14, joiningDate: '06 Apr 2026', joiningDateIso: '2026-04-06', monthsPaidOnTime: 2, subjects: 'Physics, Maths' },
  { rollNo: 'EDU-2026-015', pin: '1234', name: 'Sivani', class: 'Class 12', batch: 'Class 12', avatar: 'SI', phone: '8590976055', school: 'Vendar', streak: 13, accuracy: 92, testsCompleted: 12, topPercent: 18, monthlyFee: 4500, currentDue: 4500, dueDate: '13 Sep 2026', daysLeft: -7, joiningDate: '13 Apr 2026', joiningDateIso: '2026-04-13', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Maths, Computer Science' },
  { rollNo: 'EDU-2026-016', pin: '1234', name: 'Nandana', class: 'Class 12', batch: 'Class 12', avatar: 'NA', phone: '7736592931', school: 'MIBS', streak: 14, accuracy: 93, testsCompleted: 13, topPercent: 19, monthlyFee: 2500, currentDue: 2500, dueDate: '08 Sep 2026', daysLeft: -12, joiningDate: '08 Apr 2026', joiningDateIso: '2026-04-08', monthsPaidOnTime: 2, subjects: 'Physics, Maths' },
  { rollNo: 'EDU-2026-017', pin: '1234', name: 'Karun', class: 'Class 12', batch: 'Class 12', avatar: 'KA', phone: '8089978209', school: 'Divine', streak: 7, accuracy: 78, testsCompleted: 14, topPercent: 20, monthlyFee: 2500, currentDue: 2500, dueDate: '04 Sep 2026', daysLeft: -16, joiningDate: '04 Apr 2026', joiningDateIso: '2026-04-04', monthsPaidOnTime: 2, subjects: 'Physics, Maths' },
  { rollNo: 'EDU-2026-018', pin: '1234', name: 'Aadidev', class: 'Class 12', batch: 'Class 12', avatar: 'AA', phone: '9446258069', school: 'Divine', streak: 8, accuracy: 79, testsCompleted: 15, topPercent: 4, monthlyFee: 2500, currentDue: 2500, dueDate: '04 Sep 2026', daysLeft: -16, joiningDate: '04 Apr 2026', joiningDateIso: '2026-04-04', monthsPaidOnTime: 2, subjects: 'Physics, Maths' },
  { rollNo: 'EDU-2026-019', pin: '1234', name: 'Abhinand', class: 'Class 12', batch: 'Class 12', avatar: 'AB', phone: '7012451748', school: 'Vendar', streak: 9, accuracy: 80, testsCompleted: 16, topPercent: 5, monthlyFee: 3500, currentDue: 3500, dueDate: '08 Sep 2026', daysLeft: -12, joiningDate: '08 Apr 2026', joiningDateIso: '2026-04-08', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Maths' },
  { rollNo: 'EDU-2026-020', pin: '1234', name: 'Poojitha', class: 'Class 7', batch: 'Class 7', avatar: 'PO', phone: '8157933242', school: 'Kottathala UP School', streak: 10, accuracy: 81, testsCompleted: 17, topPercent: 6, monthlyFee: 600, currentDue: 600, dueDate: '04 Sep 2026', daysLeft: -16, joiningDate: '04 May 2026', joiningDateIso: '2026-05-04', monthsPaidOnTime: 2, subjects: 'Maths' },
  { rollNo: 'EDU-2026-021', pin: '1234', name: 'Irfan', class: 'Class 12', batch: 'Class 12', avatar: 'IR', phone: '9567187275', school: 'Vendar', streak: 11, accuracy: 82, testsCompleted: 8, topPercent: 7, monthlyFee: 3500, currentDue: 3500, dueDate: '14 Sep 2026', daysLeft: -6, joiningDate: '14 May 2026', joiningDateIso: '2026-05-14', monthsPaidOnTime: 2, subjects: 'Physics, Maths, Computer Science' },
  { rollNo: 'EDU-2026-022', pin: '1234', name: 'Karthik Nath', class: 'Class 9', batch: 'Class 9', avatar: 'KA', phone: '9847270637', school: 'CBSE', streak: 12, accuracy: 83, testsCompleted: 9, topPercent: 8, monthlyFee: 2000, currentDue: 2000, dueDate: '03 Sep 2026', daysLeft: -17, joiningDate: '03 Apr 2026', joiningDateIso: '2026-04-03', monthsPaidOnTime: 2, subjects: 'Physics, Maths' },
  { rollNo: 'EDU-2026-023', pin: '1234', name: 'Vishwathej', class: 'Class 12', batch: 'Class 12', avatar: 'VI', phone: '9961803001', school: 'SG', streak: 13, accuracy: 84, testsCompleted: 10, topPercent: 9, monthlyFee: 4500, currentDue: 4500, dueDate: '01 Sep 2026', daysLeft: -19, joiningDate: '01 Jan 2026', joiningDateIso: '2026-01-01', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Maths, Biology' },
  { rollNo: 'EDU-2026-024', pin: '1234', name: 'Ganga', class: 'Class 10', batch: 'Class 10', avatar: 'GA', phone: '8547495160', school: 'Divine', streak: 14, accuracy: 85, testsCompleted: 11, topPercent: 10, monthlyFee: 3000, currentDue: 3000, dueDate: '09 Sep 2026', daysLeft: -11, joiningDate: '09 Mar 2026', joiningDateIso: '2026-03-09', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Maths, Biology' },
  { rollNo: 'EDU-2026-025', pin: '1234', name: 'Adithya Krishnan', class: 'Class 9', batch: 'Class 9', avatar: 'AD', phone: '8129754629', school: 'MGM', streak: 7, accuracy: 86, testsCompleted: 12, topPercent: 11, monthlyFee: 2000, currentDue: 2000, dueDate: '31 Oct 2026', daysLeft: 11, joiningDate: '31 May 2026', joiningDateIso: '2026-05-31', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Maths, Biology' },
  { rollNo: 'EDU-2026-026', pin: '1234', name: 'Alecia Mathew', class: 'Class 10', batch: 'Class 10', avatar: 'AL', phone: '9650974040', school: 'Divine', streak: 8, accuracy: 87, testsCompleted: 13, topPercent: 12, monthlyFee: 3000, currentDue: 3000, dueDate: '13 Sep 2026', daysLeft: -7, joiningDate: '13 Mar 2026', joiningDateIso: '2026-03-13', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Maths, Biology' },
  { rollNo: 'EDU-2026-027', pin: '1234', name: 'Krishnanandh', class: 'Class 9', batch: 'Class 9', avatar: 'KR', phone: '9495195776', school: 'Siddhartha', streak: 9, accuracy: 88, testsCompleted: 14, topPercent: 13, monthlyFee: 2000, currentDue: 2000, dueDate: '08 Sep 2026', daysLeft: -12, joiningDate: '08 Jun 2026', joiningDateIso: '2026-06-08', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Maths' },
  { rollNo: 'EDU-2026-028', pin: '1234', name: 'Ashwanath', class: 'Class 8', batch: 'Class 8', avatar: 'AS', phone: '9544477117', school: 'Puthoor', streak: 10, accuracy: 89, testsCompleted: 15, topPercent: 14, monthlyFee: 1500, currentDue: 1500, dueDate: '05 Sep 2026', daysLeft: -15, joiningDate: '05 Apr 2026', joiningDateIso: '2026-04-05', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Maths, Biology' },
  { rollNo: 'EDU-2026-029', pin: '1234', name: 'Niranjan', class: 'Class 12', batch: 'Class 12', avatar: 'NI', phone: '9567026060', school: 'SG', streak: 11, accuracy: 90, testsCompleted: 16, topPercent: 15, monthlyFee: 4500, currentDue: 4500, dueDate: '28 Sep 2026', daysLeft: 8, joiningDate: '28 Apr 2026', joiningDateIso: '2026-04-28', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Maths, Biology' },
  { rollNo: 'EDU-2026-030', pin: '1234', name: 'Lekshmipriya', class: 'Class 9', batch: 'Class 9', avatar: 'LE', phone: '8921477592', school: 'Marthoma', streak: 12, accuracy: 91, testsCompleted: 17, topPercent: 16, monthlyFee: 2000, currentDue: 2000, dueDate: '07 Sep 2026', daysLeft: -13, joiningDate: '07 May 2026', joiningDateIso: '2026-05-07', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Maths, Biology' },
  { rollNo: 'EDU-2026-031', pin: '1234', name: 'Achyuth', class: 'Class 9', batch: 'Class 9', avatar: 'AC', phone: '9562902227', school: 'Divine', streak: 13, accuracy: 92, testsCompleted: 8, topPercent: 17, monthlyFee: 1000, currentDue: 1000, dueDate: '06 Sep 2026', daysLeft: -14, joiningDate: '06 Jun 2026', joiningDateIso: '2026-06-06', monthsPaidOnTime: 2, subjects: 'Physics' },
  { rollNo: 'EDU-2026-032', pin: '1234', name: 'Hiba', class: 'Class 11', batch: 'Class 11', avatar: 'HI', phone: '9072435565', school: 'Brm', streak: 14, accuracy: 93, testsCompleted: 9, topPercent: 18, monthlyFee: 2500, currentDue: 2500, dueDate: '22 Sep 2026', daysLeft: 2, joiningDate: '22 Jun 2026', joiningDateIso: '2026-06-22', monthsPaidOnTime: 2, subjects: 'Physics, Maths' },
  { rollNo: 'EDU-2026-033', pin: '1234', name: 'Gowtham', class: 'Class 9', batch: 'Class 9', avatar: 'GO', phone: '9447063343', school: 'Sree Sree', streak: 7, accuracy: 78, testsCompleted: 10, topPercent: 19, monthlyFee: 2000, currentDue: 2000, dueDate: '01 Sep 2026', daysLeft: -19, joiningDate: '01 Jul 2026', joiningDateIso: '2026-07-01', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Maths, Biology' },
  { rollNo: 'EDU-2026-034', pin: '1234', name: 'Vyshnavi', class: 'Class 12', batch: 'Class 12', avatar: 'VY', phone: '9562820950', school: 'Divine', streak: 8, accuracy: 79, testsCompleted: 11, topPercent: 20, monthlyFee: 1000, currentDue: 1000, dueDate: '11 Sep 2026', daysLeft: -9, joiningDate: '11 Jul 2026', joiningDateIso: '2026-07-11', monthsPaidOnTime: 2, subjects: 'Physics' },
  { rollNo: 'EDU-2026-035', pin: '1234', name: 'Gopika', class: 'Class 8', batch: 'Class 8', avatar: 'GO', phone: '9947540424', school: 'Divine', streak: 9, accuracy: 80, testsCompleted: 12, topPercent: 4, monthlyFee: 1000, currentDue: 1000, dueDate: '15 Sep 2026', daysLeft: -5, joiningDate: '15 Jul 2026', joiningDateIso: '2026-07-15', monthsPaidOnTime: 2, subjects: 'Maths' },
  { rollNo: 'EDU-2026-036', pin: '1234', name: 'Cristine', class: 'Class 10', batch: 'Class 10', avatar: 'CR', phone: '9446118812', school: 'Divine cbse', streak: 10, accuracy: 81, testsCompleted: 13, topPercent: 5, monthlyFee: 3000, currentDue: 3000, dueDate: '04 Oct 2026', daysLeft: 14, joiningDate: '04 Sep 2026', joiningDateIso: '2026-09-04', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Maths, Biology' },
  { rollNo: 'EDU-2026-037', pin: '1234', name: 'Roshan', class: 'Class 12', batch: 'Class 12', avatar: 'RO', phone: '8921159422', school: 'Divine', streak: 11, accuracy: 82, testsCompleted: 14, topPercent: 6, monthlyFee: 3500, currentDue: 3500, dueDate: '10 Oct 2026', daysLeft: 20, joiningDate: '10 Sep 2026', joiningDateIso: '2026-09-10', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Maths' },
  { rollNo: 'EDU-2026-038', pin: '1234', name: 'Fathima', class: 'Class 12', batch: 'Class 12', avatar: 'FA', phone: '7034492498', school: 'Svmmhss', streak: 12, accuracy: 83, testsCompleted: 15, topPercent: 7, monthlyFee: 2000, currentDue: 2000, dueDate: '02 Oct 2026', daysLeft: 12, joiningDate: '02 Sep 2026', joiningDateIso: '2026-09-02', monthsPaidOnTime: 2, subjects: 'Physics, Biology' },
  { rollNo: 'EDU-2026-039', pin: '1234', name: 'Hajira', class: 'Class 12', batch: 'Class 12', avatar: 'HA', phone: '9747841626', school: 'Svmmhss', streak: 13, accuracy: 84, testsCompleted: 16, topPercent: 8, monthlyFee: 2500, currentDue: 2500, dueDate: '02 Oct 2026', daysLeft: 12, joiningDate: '02 Sep 2026', joiningDateIso: '2026-09-02', monthsPaidOnTime: 2, subjects: 'Physics, Maths' },
  { rollNo: 'EDU-2026-040', pin: '1234', name: 'Keerthana', class: 'Class 11', batch: 'Class 11', avatar: 'KE', phone: '9656839908', school: 'Svmmhss', streak: 14, accuracy: 85, testsCompleted: 17, topPercent: 9, monthlyFee: 2000, currentDue: 2000, dueDate: '08 Sep 2026', daysLeft: -12, joiningDate: '08 Aug 2026', joiningDateIso: '2026-08-08', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry' },
  { rollNo: 'EDU-2026-041', pin: '1234', name: 'Karthika', class: 'Class 12', batch: 'Class 12', avatar: 'KA', phone: '9656839908', school: 'Vendar', streak: 7, accuracy: 86, testsCompleted: 8, topPercent: 10, monthlyFee: 2500, currentDue: 2500, dueDate: '03 Sep 2026', daysLeft: -17, joiningDate: '03 Aug 2026', joiningDateIso: '2026-08-03', monthsPaidOnTime: 2, subjects: 'Chemistry, Maths' },
  { rollNo: 'EDU-2026-042', pin: '1234', name: 'Dwaitha', class: 'Class 11', batch: 'Class 11', avatar: 'DW', phone: '6238332685', school: 'MGM mylam', streak: 8, accuracy: 87, testsCompleted: 9, topPercent: 11, monthlyFee: 3000, currentDue: 3000, dueDate: '08 Sep 2026', daysLeft: -12, joiningDate: '08 Aug 2026', joiningDateIso: '2026-08-08', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Biology' },
  { rollNo: 'EDU-2026-043', pin: '1234', name: 'Adarsh', class: 'Class 12', batch: 'Class 12', avatar: 'AD', phone: '9544166131', school: 'Vendar', streak: 9, accuracy: 88, testsCompleted: 10, topPercent: 12, monthlyFee: 2000, currentDue: 2000, dueDate: '08 Sep 2026', daysLeft: -12, joiningDate: '08 Aug 2026', joiningDateIso: '2026-08-08', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry' },
  { rollNo: 'EDU-2026-044', pin: '1234', name: 'Sreedev', class: 'Class 12', batch: 'Class 12', avatar: 'SR', phone: '9744795650', school: 'Vendar', streak: 10, accuracy: 89, testsCompleted: 11, topPercent: 13, monthlyFee: 3000, currentDue: 3000, dueDate: '08 Sep 2026', daysLeft: -12, joiningDate: '08 Aug 2026', joiningDateIso: '2026-08-08', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Biology' },
  { rollNo: 'EDU-2026-045', pin: '1234', name: 'Dharmic Krishna', class: 'Class 10', batch: 'Class 10', avatar: 'DH', phone: '8547534316', school: 'Puthoor', streak: 11, accuracy: 90, testsCompleted: 12, topPercent: 14, monthlyFee: 3000, currentDue: 3000, dueDate: '04 Oct 2026', daysLeft: 14, joiningDate: '04 Sep 2026', joiningDateIso: '2026-09-04', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Maths, Biology' },
  { rollNo: 'EDU-2026-046', pin: '1234', name: 'Amrutha', class: 'Class 12', batch: 'Class 12', avatar: 'AM', phone: '6282355118', school: 'Puthoor', streak: 12, accuracy: 91, testsCompleted: 13, topPercent: 15, monthlyFee: 1500, currentDue: 1500, dueDate: '09 Oct 2026', daysLeft: 19, joiningDate: '09 Sep 2026', joiningDateIso: '2026-09-09', monthsPaidOnTime: 2, subjects: 'Maths' },
  { rollNo: 'EDU-2026-047', pin: '1234', name: 'Punya.r', class: 'Class 11', batch: 'Class 11', avatar: 'PU', phone: '8593078422', school: 'EVHS Neduvathoor', streak: 13, accuracy: 92, testsCompleted: 14, topPercent: 16, monthlyFee: 4500, currentDue: 4500, dueDate: '11 Oct 2026', daysLeft: 21, joiningDate: '11 Sep 2026', joiningDateIso: '2026-09-11', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Maths, Biology' },
  { rollNo: 'EDU-2026-048', pin: '1234', name: 'Sreehari', class: 'Class 10', batch: 'Class 10', avatar: 'SR', phone: '9539122202', school: 'Divine School Puthoor', streak: 14, accuracy: 93, testsCompleted: 15, topPercent: 17, monthlyFee: 1000, currentDue: 1000, dueDate: '12 Oct 2026', daysLeft: 22, joiningDate: '12 Sep 2026', joiningDateIso: '2026-09-12', monthsPaidOnTime: 2, subjects: 'Physics' },
  { rollNo: 'EDU-2026-049', pin: '1234', name: 'Sivananda', class: 'Class 6', batch: 'Class 6', avatar: 'SI', phone: '5555555555', school: 'MTGHS', streak: 7, accuracy: 78, testsCompleted: 16, topPercent: 18, monthlyFee: 1000, currentDue: 1000, dueDate: '01 Sep 2026', daysLeft: -19, joiningDate: '01 Jun 2026', joiningDateIso: '2026-06-01', monthsPaidOnTime: 2, subjects: 'Physics, Chemistry, Maths, Biology' },
];

export const EDUSYNC_STUDENTS: EduStudent[] = RAW_STUDENTS.map((s, idx) => ({
  ...s,
  recentScore: `${s.accuracy}%`,
  avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
}));

export const EDUSYNC_FEES: Record<string, {
  name: string;
  school?: string;
  monthlyFee: number;
  currentDue: number;
  dueDate: string;
  daysLeft: number;
  joiningDate: string;
  joiningDateIso: string;
  monthsPaidOnTime: number;
  subjects: string;
}> = {
  '2024-JEE-0842': {
    name: 'Arjun S',
    school: 'EduHome Campus',
    monthlyFee: 4000,
    currentDue: 4000,
    dueDate: '15 Sep 2026',
    daysLeft: -5,
    joiningDate: '15 Jan 2026',
    joiningDateIso: '2026-01-15',
    monthsPaidOnTime: 2,
    subjects: 'Physics, Chemistry, Maths',
  },
  ...RAW_STUDENTS.reduce((acc, s) => {
    acc[s.rollNo] = {
      name: s.name,
      school: s.school,
      monthlyFee: s.monthlyFee,
      currentDue: s.currentDue,
      dueDate: s.dueDate,
      daysLeft: s.daysLeft,
      joiningDate: s.joiningDate || '',
      joiningDateIso: s.joiningDateIso || '',
      monthsPaidOnTime: s.monthsPaidOnTime,
      subjects: s.subjects,
    };
    return acc;
  }, {} as Record<string, any>),
};
