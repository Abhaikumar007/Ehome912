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

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October'];
const monthShorts = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT'];

async function syncAllPaidUpToOctober() {
  const { data: existingRecords, error: fetchErr } = await sb.from('fees_records').select('*');
  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
    return;
  }
  const existingMap = new Map();
  (existingRecords || []).forEach(r => existingMap.set(String(r.roll_no).toUpperCase().trim(), r));

  const recordsToUpsert = [];
  const now = new Date();
  const paidOnDateStr = 'Oct 1, 2026';

  for (const s of roster) {
    const roll = s.rollNo || s.id;
    const rollKey = String(roll).toUpperCase().trim();
    const fRec = existingMap.get(rollKey);
    const monthlyFee = Number(s.amount) || 4000;

    // Build loyalty_months (Jan to Oct)
    const loyaltyMonths = monthNames.map(m => ({ label: m, earned: true }));

    // Build recent_payments (Jan to Oct)
    const existingPayments = Array.isArray(fRec?.recent_payments) ? [...fRec.recent_payments] : [];
    monthNames.forEach((mName, idx) => {
      const mShort = monthShorts[idx];
      const fullMonth = mName + ' 2026';
      const pIdx = existingPayments.findIndex(p => p.fullMonth === fullMonth || p.month === mShort);
      const receiptItem = {
        month: mShort,
        fullMonth: fullMonth,
        paidOn: paidOnDateStr,
        amount: monthlyFee,
        onTime: true,
        status: 'Verified by Center Admin',
        receiptNo: 'REC-2026-' + mShort + '-' + Math.floor(1000 + Math.random() * 9000),
        utr: 'ADMIN-BULK-SETTLED'
      };
      if (pIdx >= 0) existingPayments[pIdx] = receiptItem;
      else existingPayments.push(receiptItem);
    });

    recordsToUpsert.push({
      roll_no: roll,
      current_due: 0,
      due_date: 'All Cleared',
      days_left: 0,
      months_paid_on_time: 10,
      loyalty_months: loyaltyMonths,
      recent_payments: existingPayments,
      updated_at: now.toISOString()
    });
  }

  console.log('Upserting', recordsToUpsert.length, 'records to Supabase fees_records...');
  const { error: upsertErr } = await sb.from('fees_records').upsert(recordsToUpsert, { onConflict: 'roll_no' });
  if (upsertErr) {
    console.error('Upsert failed:', upsertErr);
  } else {
    console.log('✅ Successfully synced all 50 students to Supabase fees_records!');
    console.log('All 50 records set to current_due: 0, due_date: "All Cleared", with verified receipts up to October 2026.');
  }
}

syncAllPaidUpToOctober();
