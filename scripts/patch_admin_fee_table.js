const fs = require('fs');
const f = 'C:/Users/madhu/code_test/private/js/admin.js';
let s = fs.readFileSync(f, 'utf8');

// ─── Fix 1: broken month-name lookup in Supabase cache builder ───────────────
// Old: uses only OCT/SEP special cases
// New: full short→long map
const badCacheBuilder = `                if (p.status !== 'pending_verification') {
                    const mName = p.fullMonth ? p.fullMonth.split(' ')[0] : (p.month === 'OCT' ? 'October' : (p.month === 'SEP' ? 'September' : p.month));
                    const y = p.fullMonth ? (p.fullMonth.split(' ')[1] || '2026') : '2026';`;

const goodCacheBuilder = `                if (p.status !== 'pending_verification') {
                    const _monthLongMap = {JAN:'January',FEB:'February',MAR:'March',APR:'April',MAY:'May',JUN:'June',JUL:'July',AUG:'August',SEP:'September',OCT:'October',NOV:'November',DEC:'December'};
                    const mName = p.fullMonth ? p.fullMonth.split(' ')[0] : (_monthLongMap[String(p.month || '').slice(0,3).toUpperCase()] || p.month || 'Unknown');
                    const y = p.fullMonth ? (p.fullMonth.split(' ')[1] || '2026') : '2026';`;

// ─── Fix 2: hardcoded October-only "all cleared" check in loadFeeTable ───────
const badOctCheck = `                    // If October (or active month) is marked all cleared or current_due === 0
                    if (selectedMonth === 'October' && (Number(fRec.current_due) === 0 || fRec.due_date === 'All Cleared' || fRec.status === 'paid')) {
                        isPaid = true;
                    }`;

const goodOctCheck = `                    // If the selected month appears in the stored payments OR student has current_due=0 (all cleared)
                    // "All Cleared" means every month through the most-recently-paid one is paid
                    if (!isPaid && (Number(fRec.current_due) === 0 || fRec.due_date === 'All Cleared' || fRec.status === 'paid')) {
                        const _mlm = {JAN:'January',FEB:'February',MAR:'March',APR:'April',MAY:'May',JUN:'June',JUL:'July',AUG:'August',SEP:'September',OCT:'October',NOV:'November',DEC:'December'};
                        const allPmts = Array.isArray(fRec.recent_payments) ? fRec.recent_payments : [];
                        const approvedPmts = allPmts.filter(p => p.status !== 'pending_verification');
                        // Check if selectedMonth is in the approved list
                        const foundApproved = approvedPmts.some(p => {
                            const pLong = p.fullMonth ? p.fullMonth.split(' ')[0] : (_mlm[String(p.month||'').slice(0,3).toUpperCase()]||p.month||'');
                            return pLong.toLowerCase() === selectedMonth.toLowerCase();
                        });
                        if (foundApproved) isPaid = true;
                    }`;

let n1 = s.includes(badCacheBuilder);
let n2 = s.includes(badOctCheck);
console.log('Fix1 found:', n1, 'Fix2 found:', n2);

if (n1) s = s.replace(badCacheBuilder, goodCacheBuilder);
if (n2) s = s.replace(badOctCheck, goodOctCheck);

fs.writeFileSync(f, s);
console.log('Done');
