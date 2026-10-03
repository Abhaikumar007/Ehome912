const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const adminJsPath = 'C:/Users/madhu/code_test/private/js/admin.js';
const adminJsContent = fs.readFileSync(adminJsPath, 'utf8');

const startMarker = 'const MASTER_STUDENTS_ROSTER = [';
const start = adminJsContent.indexOf(startMarker);
const end = adminJsContent.indexOf('];', start);
const roster = eval(adminJsContent.slice(start + startMarker.length - 1, end + 1));

console.log('Loaded', roster.length, 'students from C:/Users/madhu/code_test/private/js/admin.js');

const allMonths = [
  { name: 'January', short: 'JAN' },
  { name: 'February', short: 'FEB' },
  { name: 'March', short: 'MAR' },
  { name: 'April', short: 'APR' },
  { name: 'May', short: 'MAY' },
  { name: 'June', short: 'JUN' },
  { name: 'July', short: 'JUL' },
  { name: 'August', short: 'AUG' },
  { name: 'September', short: 'SEP' },
  { name: 'October', short: 'OCT' },
];

const TODAY = new Date(2026, 9, 3); // Oct 3, 2026

async function syncRealisticFees() {
  const recordsToUpsert = [];
  const now = new Date();

  for (const s of roster) {
    const roll = s.rollNo || s.id;
    const isArjunS = roll === '2024-JEE-0842' || s.name === 'Arjun S';
    const monthlyFee = Number(s.amount) || 4000;

    const joinParts = (s.joiningDate || '2026-01-15').split('-');
    const jMonth = parseInt(joinParts[1], 10) - 1; // 0-indexed month
    const jDay = parseInt(joinParts[2], 10) || 15;
    const dueDay = Math.min(jDay, 28);

    if (isArjunS) {
      // Arjun S: Did NOT pay September, Did NOT pay October!
      // Paid only January through August 2026 (8 months)
      const arjunPaidMonths = allMonths.slice(0, 8); // Jan to Aug

      const loyaltyMonths = allMonths.map((m, idx) => ({
        label: m.name,
        earned: idx < 8, // Only Jan to Aug earned
      }));

      const recentPayments = arjunPaidMonths.map((m) => ({
        month: m.short,
        fullMonth: m.name + ' 2026',
        paidOn: 'Aug 15, 2026',
        amount: monthlyFee,
        onTime: true,
        status: 'Verified by Center Admin',
        receiptNo: 'REC-2026-' + m.short + '-' + Math.floor(1000 + Math.random() * 9000),
        utr: 'ADMIN-VERIFIED'
      }));

      // September was due on 15 Sep 2026 -> Overdue by 18 days from Oct 3!
      const sepDueDate = new Date(2026, 8, 15);
      const daysOverdue = Math.round((sepDueDate.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24)); // -18

      recordsToUpsert.push({
        roll_no: roll,
        current_due: monthlyFee, // ₹4,000 overdue for September
        due_date: '15 Sep 2026',
        days_left: daysOverdue, // -18 (Overdue)
        months_paid_on_time: 8,
        loyalty_months: loyaltyMonths,
        recent_payments: recentPayments,
        updated_at: now.toISOString()
      });

    } else {
      // Other students: Paid up to September 2026!
      // October 2026 is UPCOMING (due on dueDay October 2026)
      const startMonthIdx = Math.max(0, Math.min(jMonth, 8));
      const studentPaidMonths = allMonths.slice(startMonthIdx, 9); // from join month up to September

      const loyaltyMonths = allMonths.map((m, idx) => ({
        label: m.name,
        earned: idx >= startMonthIdx && idx <= 8, // Jan-Sep earned, October not earned
      }));

      const recentPayments = studentPaidMonths.map((m) => ({
        month: m.short,
        fullMonth: m.name + ' 2026',
        paidOn: 'Sep 20, 2026',
        amount: monthlyFee,
        onTime: true,
        status: 'Verified by Center Admin',
        receiptNo: 'REC-2026-' + m.short + '-' + Math.floor(1000 + Math.random() * 9000),
        utr: 'ADMIN-VERIFIED'
      }));

      const octDueDate = new Date(2026, 9, dueDay);
      const daysLeft = Math.ceil((octDueDate.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
      const dueDateStr = String(dueDay).padStart(2, '0') + ' October 2026';

      recordsToUpsert.push({
        roll_no: roll,
        current_due: monthlyFee, // October fee is due/upcoming
        due_date: dueDateStr,
        days_left: daysLeft,
        months_paid_on_time: studentPaidMonths.length,
        loyalty_months: loyaltyMonths,
        recent_payments: recentPayments, // NO October payment!
        updated_at: now.toISOString()
      });
    }
  }

  console.log('Upserting', recordsToUpsert.length, 'records to Supabase fees_records...');
  const { error: upsertErr } = await sb.from('fees_records').upsert(recordsToUpsert, { onConflict: 'roll_no' });

  if (upsertErr) {
    console.error('Upsert failed:', upsertErr);
  } else {
    console.log('✅ Successfully updated Supabase fees_records!');
    console.log('- Arjun S (2024-JEE-0842): Overdue for September (Due: 15 Sep 2026, daysLeft: -18, currentDue: 4000). September & October NOT paid.');
    console.log('- Other 49 Students: Paid up to September 2026. October is UPCOMING / DUE with their respective October due dates.');
  }
}

syncRealisticFees();
