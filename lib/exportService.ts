// lib/exportService.ts
// Supabase Student Data & Companion Records Exporter (SQL & CSV)

export interface RawStudent {
  roll_no?: string;
  pin?: string;
  name: string;
  class_name?: string;
  class?: string;
  batch?: string;
  phone?: string | number;
  avatar?: string;
  streak?: number;
  accuracy?: number;
  tests_completed?: number;
  top_percent?: number;
}

export interface FormattedStudent {
  roll_no: string;
  pin: string;
  name: string;
  class_name: string;
  batch: string;
  avatar: string;
  phone: string;
  streak: number;
  accuracy: number;
  tests_completed: number;
  top_percent: number;
}

/**
 * 1. Sanitizes 10-digit phone number (strips spaces, dashes, +91)
 */
export function cleanPhoneNumber(phone?: string | number): string {
  if (!phone) return '9876543210';
  let clean = String(phone).replace(/[^0-9]/g, '');
  if (clean.length > 10 && clean.startsWith('91')) {
    clean = clean.slice(2);
  }
  return clean.slice(-10).padStart(10, '0');
}

/**
 * 2. Extracts 2-letter uppercase initials for avatar (e.g. 'Arjun S' -> 'AS')
 */
export function generateAvatarInitials(name: string): string {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ST';
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * 3. Title-cases names properly
 */
export function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * 4. Ensures consistent roll number if missing (e.g. 2024-JEE-0842, 2024-CBSE-0101)
 */
export function ensureRollNumber(student: RawStudent, index: number): string {
  if (student.roll_no && student.roll_no.trim().length > 0) {
    return student.roll_no.trim();
  }
  const year = new Date().getFullYear();
  let code = 'CBSE';
  const batchStr = (student.batch || student.class_name || student.class || '').toUpperCase();
  if (batchStr.includes('JEE')) code = 'JEE';
  else if (batchStr.includes('NEET') || batchStr.includes('MED')) code = 'NEET';
  else if (batchStr.includes('10')) code = 'CBSE10';
  else if (batchStr.includes('11')) code = 'CBSE11';
  else if (batchStr.includes('12')) code = 'CBSE12';

  const serial = String(index + 1).padStart(4, '0');
  return `${year}-${code}-${serial}`;
}

/**
 * Transform raw students list according to strict schema rules
 */
export function formatStudents(rawList: RawStudent[]): FormattedStudent[] {
  return rawList.map((s, idx) => ({
    roll_no: ensureRollNumber(s, idx),
    pin: s.pin && String(s.pin).length === 4 ? String(s.pin) : '1234',
    name: toTitleCase(s.name),
    class_name: s.class_name || s.class || 'Class 12',
    batch: s.batch || 'JEE Target (Batch A)',
    avatar: s.avatar && s.avatar.length === 2 ? s.avatar.toUpperCase() : generateAvatarInitials(s.name),
    phone: cleanPhoneNumber(s.phone),
    streak: typeof s.streak === 'number' ? s.streak : 10,
    accuracy: typeof s.accuracy === 'number' ? s.accuracy : 85,
    tests_completed: typeof s.tests_completed === 'number' ? s.tests_completed : 14,
    top_percent: typeof s.top_percent === 'number' ? s.top_percent : 10,
  }));
}

/**
 * 5. Generates Ready-to-Run PostgreSQL SQL for Supabase with companion seed records
 */
export function generatePostgreSql(students: FormattedStudent[]): string {
  const lines: string[] = [
    '--',
    '-- ==============================================================================--',
    '-- EduHome: Supabase Students & Companion Records Seed Data',
    `-- Generated: ${new Date().toISOString()}`,
    `-- Total Students: ${students.length}`,
    '-- ==============================================================================--',
    'BEGIN;',
    ''
  ];

  for (const s of students) {
    const escapedName = s.name.replace(/'/g, "''");
    const escapedClass = s.class_name.replace(/'/g, "''");
    const escapedBatch = s.batch.replace(/'/g, "''");

    lines.push(`-- --------------------------------------------------------------------------`);
    lines.push(`-- Student: ${s.name} (${s.roll_no})`);
    lines.push(`-- --------------------------------------------------------------------------`);

    // Primary student record
    lines.push(
      `INSERT INTO students (roll_no, pin, name, class_name, batch, avatar, phone, streak, accuracy, tests_completed, top_percent) ` +
      `VALUES ('${s.roll_no}', '${s.pin}', '${escapedName}', '${escapedClass}', '${escapedBatch}', '${s.avatar}', '${s.phone}', ${s.streak}, ${s.accuracy}, ${s.tests_completed}, ${s.top_percent}) ` +
      `ON CONFLICT (roll_no) DO UPDATE SET ` +
      `name = EXCLUDED.name, class_name = EXCLUDED.class_name, batch = EXCLUDED.batch, phone = EXCLUDED.phone;`
    );

    // Companion 1: attendance_records
    lines.push(
      `INSERT INTO attendance_records (roll_no, overall, attended, total, today_subjects, history) ` +
      `VALUES ('${s.roll_no}', 90, 45, 50, '[]'::jsonb, '[]'::jsonb) ` +
      `ON CONFLICT (roll_no) DO NOTHING;`
    );

    // Companion 2: fees_records
    lines.push(
      `INSERT INTO fees_records (roll_no, current_due, due_date, days_left, months_paid_on_time, loyalty_months, recent_payments) ` +
      `VALUES ('${s.roll_no}', 1, '25 Sep 2026', 5, 2, '[]'::jsonb, '[]'::jsonb) ` +
      `ON CONFLICT (roll_no) DO NOTHING;`
    );

    // Companion 3: progress_records
    lines.push(
      `INSERT INTO progress_records (roll_no, tests_attended, highest_score, top_percent, total_students, improvement, accuracy, incorrect) ` +
      `VALUES ('${s.roll_no}', 14, 92, 10, 1200, 15, 85, 15) ` +
      `ON CONFLICT (roll_no) DO NOTHING;\n`
    );
  }

  lines.push('COMMIT;');
  return lines.join('\n');
}

/**
 * 6. Generates Clean CSV for Supabase / Spreadsheets
 */
export function generateCsv(students: FormattedStudent[]): string {
  const headers = [
    'roll_no',
    'pin',
    'name',
    'class_name',
    'batch',
    'avatar',
    'phone',
    'streak',
    'accuracy',
    'tests_completed',
    'top_percent',
  ];

  const escapeCsv = (val: any) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = students.map((s) =>
    [
      escapeCsv(s.roll_no),
      escapeCsv(s.pin),
      escapeCsv(s.name),
      escapeCsv(s.class_name),
      escapeCsv(s.batch),
      escapeCsv(s.avatar),
      escapeCsv(s.phone),
      s.streak,
      s.accuracy,
      s.tests_completed,
      s.top_percent,
    ].join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Trigger file download on web browser
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  if (typeof document !== 'undefined') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Copy text to clipboard (works on web and mobile)
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard write error:', err);
  }
  return false;
}
