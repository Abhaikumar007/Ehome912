const fs = require('fs');
const path = require('path');

const codeTestDir = 'C:/Users/madhu/code_test/private';

// 1. Update fees.html default selected month
const feesHtmlPath = path.join(codeTestDir, 'fees.html');
if (fs.existsSync(feesHtmlPath)) {
  let feesHtml = fs.readFileSync(feesHtmlPath, 'utf8');
  feesHtml = feesHtml.replace('<option value="October">October</option>', '<option value="October" selected>October</option>');
  fs.writeFileSync(feesHtmlPath, feesHtml, 'utf8');
  console.log('✅ Updated C:/Users/madhu/code_test/private/fees.html with default selected month October');
}

// 2. Update sheets-client.js:
// A) In sb_loadFromCloud: reconstruct loadedFees from feeRows so localStorage and loadFeeTable have paid statuses!
// B) In sb_saveStudent: don't wipe out recent_payments and current_due if fee record already exists!
const sheetsClientPath = path.join(codeTestDir, 'js', 'sheets-client.js');
if (fs.existsSync(sheetsClientPath)) {
  let scContent = fs.readFileSync(sheetsClientPath, 'utf8');

  // Fix A: reconstruct loadedFees in sb_loadFromCloud
  const targetA = `            const { data: feeRows, error: fErr } = await sb.from('fees_records').select('*');
            if (!fErr && feeRows && loadedStudents) {
                loadedStudents.forEach(st => {
                    const fr = feeRows.find(f => f.roll_no === st.id || f.roll_no === st.rollNo);
                    if (fr) {
                        st.amount = fr.monthly_fee ? String(fr.monthly_fee) : '';
                        if (fr.subjects) {
                            st.subjects = fr.subjects.split(',').map(s => s.trim());
                        }
                    }
                });
            }`;

  const replacementA = `            const { data: feeRows, error: fErr } = await sb.from('fees_records').select('*');
            if (!fErr && feeRows && loadedStudents) {
                const feesObj = {};
                loadedStudents.forEach(st => {
                    const fr = feeRows.find(f => f.roll_no === st.id || f.roll_no === st.rollNo);
                    if (fr) {
                        st.amount = fr.monthly_fee ? String(fr.monthly_fee) : '';
                        if (fr.subjects) {
                            st.subjects = fr.subjects.split(',').map(s => s.trim());
                        }
                        const payments = Array.isArray(fr.recent_payments) ? fr.recent_payments : [];
                        const subs = Array.isArray(st.subjects) && st.subjects.length > 0 ? st.subjects : ['General'];
                        payments.forEach(p => {
                            if (p.status !== 'pending_verification') {
                                const m = p.fullMonth ? p.fullMonth.split(' ')[0] : (p.month === 'OCT' ? 'October' : (p.month === 'SEP' ? 'September' : p.month));
                                const y = p.fullMonth ? (p.fullMonth.split(' ')[1] || '2026') : '2026';
                                subs.forEach(sub => {
                                    feesObj[\`\${st.id}_\${sub}_\${m}_\${y}\`] = 'Paid';
                                    if (st.rollNo) feesObj[\`\${st.rollNo}_\${sub}_\${m}_\${y}\`] = 'Paid';
                                });
                            }
                        });
                    }
                });
                loadedFees = feesObj;
            }`;

  if (scContent.includes(targetA)) {
    scContent = scContent.replace(targetA, replacementA);
    console.log('✅ Fixed sb_loadFromCloud in sheets-client.js to populate loadedFees from Supabase fees_records');
  } else {
    console.warn('⚠️ Target A in sheets-client.js not found');
  }

  // Fix B: In sb_saveStudent: check if record exists before resetting
  const targetB = `            // B. Upsert into fees_records
            const { error: feeError } = await sb.from('fees_records').upsert({
                roll_no: rollNo,
                current_due: monthlyFee,
                due_date: '25th of month',
                days_left: 5,
                months_paid_on_time: 0,
                loyalty_months: [],
                recent_payments: []
            }, { onConflict: 'roll_no' });`;

  const replacementB = `            // B. Upsert into fees_records (preserve existing payments & dues!)
            const { data: existingFee } = await sb.from('fees_records').select('*').eq('roll_no', rollNo).maybeSingle();
            if (!existingFee) {
                const { error: feeError } = await sb.from('fees_records').upsert({
                    roll_no: rollNo,
                    current_due: monthlyFee,
                    due_date: '25th of month',
                    days_left: 5,
                    months_paid_on_time: 0,
                    loyalty_months: [],
                    recent_payments: []
                }, { onConflict: 'roll_no' });
                if (feeError) console.warn('[DualSync] Supabase fees error:', feeError.message);
            }`;

  if (scContent.includes(targetB)) {
    scContent = scContent.replace(targetB, replacementB);
    console.log('✅ Fixed sb_saveStudent in sheets-client.js to preserve existing fees_records');
  } else {
    console.warn('⚠️ Target B in sheets-client.js not found');
  }

  fs.writeFileSync(sheetsClientPath, scContent, 'utf8');
}

// 3. Update master_hub.js:
// In generateMonthlyFeeCycle: preserve students who already paid for that cycle!
const masterHubJsPath = path.join(codeTestDir, 'js', 'master_hub.js');
if (fs.existsSync(masterHubJsPath)) {
  let mhContent = fs.readFileSync(masterHubJsPath, 'utf8');

  const targetC = `            recordsToUpsert.push({
                roll_no: String(rollNo).trim(),
                current_due: monthlyFee,
                due_date: dueDateStr,
                days_left: daysLeft,
                updated_at: new Date().toISOString()
            });`;

  const replacementC = `            // Check if student is already cleared/paid for this cycle
            const rollKey = String(rollNo).toUpperCase().trim();
            const fRec = (typeof feeMap !== 'undefined' && feeMap) ? feeMap.get(rollKey) : null;
            const pmts = Array.isArray(fRec?.recent_payments) ? fRec.recent_payments : [];
            const isCyclePaid = pmts.some(p => p.fullMonth?.includes(cycleMonth) || (cycleMonth.includes('October') && p.month === 'OCT'));

            recordsToUpsert.push({
                roll_no: String(rollNo).trim(),
                current_due: isCyclePaid ? 0 : monthlyFee,
                due_date: isCyclePaid ? 'All Cleared' : dueDateStr,
                days_left: isCyclePaid ? 0 : daysLeft,
                updated_at: new Date().toISOString()
            });`;

  if (mhContent.includes(targetC)) {
    mhContent = mhContent.replace(targetC, replacementC);
    console.log('✅ Fixed generateMonthlyFeeCycle in master_hub.js to preserve paid students');
    fs.writeFileSync(masterHubJsPath, mhContent, 'utf8');
  } else {
    console.warn('⚠️ Target C in master_hub.js not found');
  }
}

console.log('=== All code_test/private patches completed ===');
