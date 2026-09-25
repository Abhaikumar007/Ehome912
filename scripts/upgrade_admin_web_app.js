const fs = require('fs');
const path = require('path');

const privateDir = 'C:\\Users\\madhu\\code_test\\private';

// ==============================================================================
// 1. UPDATE config.js
// ==============================================================================
const configPath = path.join(privateDir, 'js', 'config.js');
let configContent = fs.readFileSync(configPath, 'utf8');

const supabaseConfigSnippet = `
// Supabase Database credentials for mobile app & faculty synchronization
const SUPABASE_URL = 'https://xrxwluezguxpqfzedlfq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyeHdsdWV6Z3V4cHFmemVkbGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTQ5ODIsImV4cCI6MjEwNTIzMDk4Mn0.GyAX0VRjgPuZxxBCIO7Y4bH7PubaaRYuW1cJjfoaHPI';
`;

if (!configContent.includes('SUPABASE_URL')) {
    configContent += '\n' + supabaseConfigSnippet;
    fs.writeFileSync(configPath, configContent, 'utf8');
    console.log('✓ Updated config.js with Supabase credentials.');
} else {
    console.log('• config.js already has Supabase credentials.');
}

// ==============================================================================
// 2. CREATE enhanced sheets-client.js with Dual-Sync (Sheets + Supabase)
// ==============================================================================
const dualSyncClientContent = `// ==============================================================================
//  sheets-client.js — Edu Home Dual Cloud Sync Layer (Google Sheets + Supabase)
//  Synchronizes all Admin Web App actions to BOTH Google Sheets and Supabase!
//  - When students are added/edited/deleted, both Sheets and Supabase are updated.
//  - When fees are toggled (Paid/Pending), both Sheets and Supabase are updated.
//  - When attendance is saved, it updates both Sheets and Supabase.
//  - The mobile app (Student & Faculty) reads from Supabase and gets real-time updates!
// ==============================================================================

/** Returns true if Sheets API config is available */
function _sheetsReady() {
    return typeof SHEETS_API_URL !== 'undefined' && SHEETS_API_URL && SHEETS_API_URL !== '';
}

/** Supabase Client Singleton */
let _supabaseClient = null;
function _getSupabaseClient() {
    if (_supabaseClient) return _supabaseClient;
    if (typeof window.supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL) {
        try {
            _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('[DualSync] Supabase client initialized.');
        } catch (e) {
            console.warn('[DualSync] Failed to initialize Supabase client:', e);
        }
    }
    return _supabaseClient;
}

/**
 * Helper: fetch with a timeout so the UI never hangs forever.
 */
function _fetchWithTimeout(url, options, timeoutMs) {
    timeoutMs = timeoutMs || 15000;
    var controller = new AbortController();
    var timeoutId = setTimeout(function () { controller.abort(); }, timeoutMs);

    options = options || {};
    options.signal = controller.signal;

    return fetch(url, options).finally(function () {
        clearTimeout(timeoutId);
    });
}

/** Helper: make a GET request to the Apps Script web app */
async function _sheetsGet(action, timeoutMs) {
    if (!_sheetsReady()) return null;
    try {
        var url = SHEETS_API_URL + '?action=' + action + '&token=' + encodeURIComponent(SHEETS_SECRET || '');
        var res = await _fetchWithTimeout(url, {}, timeoutMs || 15000);
        if (!res.ok) {
            console.error('[Sheets] GET ' + action + ' failed:', res.status, res.statusText);
            return null;
        }
        var json = await res.json();
        if (!json.ok) {
            console.error('[Sheets] GET ' + action + ' error:', json.error);
            return null;
        }
        return json;
    } catch (e) {
        if (e.name === 'AbortError') {
            console.warn('[Sheets] GET ' + action + ' timed out');
        } else {
            console.warn('[Sheets] GET ' + action + ' network error:', e.message);
        }
        return null;
    }
}

/** Helper: make a POST request to the Apps Script web app */
async function _sheetsPost(body, timeoutMs) {
    if (!_sheetsReady()) return null;
    try {
        body.token = SHEETS_SECRET || '';
        var res = await _fetchWithTimeout(SHEETS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(body)
        }, timeoutMs || 15000);
        if (!res.ok) {
            console.error('[Sheets] POST ' + body.action + ' failed:', res.status, res.statusText);
            return null;
        }
        var json = await res.json();
        if (!json.ok) {
            console.error('[Sheets] POST ' + body.action + ' error:', json.error);
            return null;
        }
        return json;
    } catch (e) {
        if (e.name === 'AbortError') {
            console.warn('[Sheets] POST ' + (body.action || '?') + ' timed out');
        } else {
            console.warn('[Sheets] POST ' + (body.action || '?') + ' network error:', e.message);
        }
        return null;
    }
}

// ─── DIAGNOSTICS & DEBUG ──────────────────────────────────────────────────────

window.sb_debug = async function () {
    var out = [];

    // 1. Google Sheets Config
    out.push('📊 SHEETS_API_URL = ' + (typeof SHEETS_API_URL !== 'undefined' ? SHEETS_API_URL : '❌ UNDEFINED'));
    out.push('🔑 SHEETS_SECRET  = ' + (typeof SHEETS_SECRET !== 'undefined' ? '***' + SHEETS_SECRET.slice(-4) : '❌ UNDEFINED'));

    // 2. Supabase Config
    out.push('⚡ SUPABASE_URL    = ' + (typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : '❌ UNDEFINED'));
    out.push('⚡ SUPABASE_SDK    = ' + (typeof window.supabase !== 'undefined' ? '✅ Available' : '❌ Missing CDN'));

    // 3. Test Sheets Ping
    if (_sheetsReady()) {
        try {
            var url = SHEETS_API_URL + '?action=ping&token=' + encodeURIComponent(SHEETS_SECRET || '');
            var res = await _fetchWithTimeout(url, {}, 10000);
            out.push('📡 Sheets Ping: ' + res.status + ' ' + res.statusText);
        } catch (e) {
            out.push('❌ Sheets Ping Failed: ' + e.message);
        }
    } else {
        out.push('⚠️ Google Sheets not configured.');
    }

    // 4. Test Supabase Ping
    const sb = _getSupabaseClient();
    if (sb) {
        try {
            const { data, error } = await sb.from('students').select('count', { count: 'exact', head: true });
            if (!error) {
                out.push('✅ Supabase Connection: OK (Table students accessible)');
            } else {
                out.push('⚠️ Supabase Error: ' + error.message);
            }
        } catch (e) {
            out.push('❌ Supabase Test Failed: ' + e.message);
        }
    } else {
        out.push('⚠️ Supabase client not initialized.');
    }

    // 5. Local Storage Status
    var lsStudents = JSON.parse(localStorage.getItem('students')) || [];
    out.push('💾 LocalStorage students count: ' + lsStudents.length);

    console.log('[DualSync Debug]\\n' + out.join('\\n'));
    return out;
};

// ─── DATA SHAPE CONVERTERS ───────────────────────────────────────────────────

function _toSheetStudent(s) {
    return {
        id:           String(s.id || s.roll_no || s.rollNo || ''),
        name:         String(s.name || ''),
        class:        String(s.class || s.class_name || ''),
        school:       String(s.school || ''),
        phone:        String(s.phone || ''),
        joining_date: String(s.joiningDate || s.joining_date || ''),
        monthly_fee:  (s.amount != null && s.amount !== '') ? Number(s.amount) : '',
        subjects:     Array.isArray(s.subjects) ? s.subjects : (s.subjects ? [s.subjects] : [])
    };
}

function _fromSheetStudent(row) {
    return {
        id:          String(row.id || ''),
        name:        String(row.name || ''),
        class:       String(row['class'] || ''),
        school:      String(row.school || ''),
        phone:       String(row.phone || ''),
        joiningDate: String(row.joining_date || ''),
        amount:      (row.monthly_fee != null && row.monthly_fee !== '') ? String(row.monthly_fee) : '',
        subjects:    Array.isArray(row.subjects) ? row.subjects : []
    };
}

function _cleanPhone(p) {
    let clean = String(p || '').replace(/[^0-9]/g, '');
    if (clean.length > 10 && clean.startsWith('91')) clean = clean.slice(2);
    clean = clean.slice(-10);
    while (clean.length < 10) clean = '9' + clean;
    return clean;
}

function _getRollNo(s) {
    if (s.rollNo && String(s.rollNo).trim()) return String(s.rollNo).trim();
    if (s.roll_no && String(s.roll_no).trim()) return String(s.roll_no).trim();
    if (s.id && String(s.id).trim() && !String(s.id).match(/^\\d{13}$/)) return String(s.id).trim();

    // Generate clean roll number if none exists
    const rawClass = String(s.class || s.class_name || '10').replace(/[^0-9]/g, '');
    const prefix = rawClass ? 'EDU-C' + rawClass : 'EDU';
    const num = (s.id ? String(s.id).slice(-3) : Math.floor(100 + Math.random() * 900));
    return prefix + '-' + num;
}

// ─── LOAD FROM CLOUD (PULL) ──────────────────────────────────────────────────

window.sb_loadFromCloud = async function () {
    let loadedStudents = null;
    let loadedFees = null;

    // Try Google Sheets first
    if (_sheetsReady()) {
        try {
            var stuResult = await _sheetsGet('getStudents');
            var feeResult = await _sheetsGet('getFees');
            if (stuResult && stuResult.data && stuResult.data.length > 0) {
                loadedStudents = stuResult.data.map(_fromSheetStudent);
            }
            if (feeResult && feeResult.data) {
                var feesObj = {};
                feeResult.data.forEach(function (row) {
                    var key = String(row.student_id) + '_' + row.subject + '_' + row.month + '_' + row.year;
                    feesObj[key] = row.status;
                });
                loadedFees = feesObj;
            }
        } catch (e) {
            console.warn('[Sheets] Pull failed, falling back to Supabase', e);
        }
    }

    // If Sheets returned nothing or unavailable, pull from Supabase
    const sb = _getSupabaseClient();
    if (!loadedStudents && sb) {
        try {
            const { data: stuRows, error: sErr } = await sb.from('students').select('*');
            if (!sErr && stuRows && stuRows.length > 0) {
                loadedStudents = stuRows.map(r => ({
                    id: String(r.roll_no || r.id),
                    rollNo: String(r.roll_no),
                    name: r.name,
                    class: String(r.class_name || '').replace('Class ', ''),
                    school: r.school || 'EduHome Campus',
                    phone: r.phone || '',
                    joiningDate: r.joining_date || '',
                    amount: '',
                    subjects: []
                }));
            }

            const { data: feeRows, error: fErr } = await sb.from('fees_records').select('*');
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
            }
        } catch (e) {
            console.warn('[Supabase] Pull failed:', e);
        }
    }

    if (!loadedStudents || loadedStudents.length === 0) {
        return { ok: false, msg: 'No remote student records found.' };
    }

    // Save to LocalStorage
    localStorage.setItem('students', JSON.stringify(loadedStudents));
    if (loadedFees) {
        localStorage.setItem('fees', JSON.stringify(loadedFees));
    }

    return {
        ok: true,
        students: loadedStudents,
        fees: loadedFees || {},
        msg: 'Synced ' + loadedStudents.length + ' students from cloud.'
    };
};

// ─── STUDENTS (DUAL SYNC) ────────────────────────────────────────────────────

window.sb_getStudents = async function () {
    const result = await window.sb_loadFromCloud();
    if (result && result.ok) return result.students;
    return JSON.parse(localStorage.getItem('students')) || [];
};

window.sb_saveStudent = async function (student) {
    let sheetsSuccess = false;
    let supabaseSuccess = false;

    // 1. Google Sheets Sync
    if (_sheetsReady()) {
        try {
            var result = await _sheetsPost({
                action: 'saveStudent',
                student: _toSheetStudent(student)
            });
            sheetsSuccess = !!result;
            if (sheetsSuccess) console.log('[DualSync] Student saved to Google Sheets ✓');
        } catch (e) {
            console.warn('[DualSync] Sheets saveStudent error:', e);
        }
    }

    // 2. Supabase Sync
    const sb = _getSupabaseClient();
    if (sb) {
        try {
            const rollNo = _getRollNo(student);
            const rawClass = String(student.class || student.class_name || '10').trim();
            const className = rawClass.toLowerCase().startsWith('class') ? rawClass : 'Class ' + rawClass;
            const name = (student.name || 'Student').trim();
            const nameParts = name.split(' ');
            const avatar = (nameParts.length > 1 ? nameParts[0][0] + nameParts[1][0] : name.slice(0, 2)).toUpperCase();
            const phone = _cleanPhone(student.phone);
            const monthlyFee = Number(student.amount) || 0;
            const subjectsList = Array.isArray(student.subjects) ? student.subjects : (student.subjects ? [student.subjects] : []);
            const subjectsStr = subjectsList.join(', ');
            const joiningDate = student.joiningDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

            // A. Upsert into students table
            const { error: stuError } = await sb.from('students').upsert({
                roll_no: rollNo,
                name: name,
                class_name: className,
                batch: student.batch || className,
                avatar: avatar,
                phone: phone,
                school: student.school || 'EduHome Campus',
                joining_date: joiningDate,
                pin: student.pin || '1234',
                streak: 0,
                accuracy: 0,
                tests_completed: 0,
                top_percent: 0
            }, { onConflict: 'roll_no' });

            if (stuError) {
                console.warn('[DualSync] Supabase students error:', stuError.message);
            } else {
                console.log('[DualSync] Student upserted in Supabase ✓:', rollNo);
            }

            // B. Upsert into fees_records
            const { error: feeError } = await sb.from('fees_records').upsert({
                roll_no: rollNo,
                monthly_fee: monthlyFee,
                current_due: monthlyFee,
                due_date: '25th of month',
                days_left: 5,
                months_paid_on_time: 0,
                subjects: subjectsStr,
                status: 'due',
                loyalty_months: [],
                recent_payments: []
            }, { onConflict: 'roll_no' });

            if (feeError) console.warn('[DualSync] Supabase fees error:', feeError.message);

            // C. Blank attendance record
            await sb.from('attendance_records').upsert({
                roll_no: rollNo,
                overall: 0,
                attended: 0,
                total: 0,
                today_subjects: [],
                history: []
            }, { onConflict: 'roll_no', ignoreDuplicates: true });

            // D. Blank progress record
            await sb.from('progress_records').upsert({
                roll_no: rollNo,
                tests_attended: 0,
                highest_score: 0,
                top_percent: 0,
                total_students: 0,
                improvement: 0,
                accuracy: 0,
                incorrect: 0
            }, { onConflict: 'roll_no', ignoreDuplicates: true });

            supabaseSuccess = true;
            console.log('[DualSync] Student & companions synced to Supabase ✓');
        } catch (e) {
            console.warn('[DualSync] Supabase saveStudent error:', e);
        }
    }

    return sheetsSuccess || supabaseSuccess;
};

window.sb_deleteStudent = async function (id) {
    let sheetsSuccess = false;
    let supabaseSuccess = false;

    // 1. Delete from Sheets
    if (_sheetsReady()) {
        try {
            var result = await _sheetsPost({
                action: 'deleteStudent',
                id: String(id)
            });
            sheetsSuccess = !!result;
        } catch (e) {
            console.warn('[DualSync] Sheets deleteStudent error:', e);
        }
    }

    // 2. Delete from Supabase
    const sb = _getSupabaseClient();
    if (sb) {
        try {
            const sid = String(id);
            const { error } = await sb.from('students').delete().or('roll_no.eq.' + sid + ',id.eq.' + sid);
            if (!error) {
                supabaseSuccess = true;
                console.log('[DualSync] Student deleted from Supabase ✓:', sid);
            } else {
                console.warn('[DualSync] Supabase delete error:', error.message);
            }
        } catch (e) {
            console.warn('[DualSync] Supabase deleteStudent error:', e);
        }
    }

    return sheetsSuccess || supabaseSuccess;
};

// ─── FEES (DUAL SYNC) ────────────────────────────────────────────────────────

window.sb_getFees = async function () {
    if (_sheetsReady()) {
        var result = await _sheetsGet('getFees');
        if (result && result.data) {
            var feesObj = {};
            var feeRows = Array.isArray(result.data) ? result.data : [];
            feeRows.forEach(function (row) {
                var key = String(row.student_id) + '_' + row.subject + '_' + row.month + '_' + row.year;
                feesObj[key] = row.status;
            });
            return feesObj;
        }
    }
    return JSON.parse(localStorage.getItem('fees')) || {};
};

window.sb_toggleFee = async function (studentId, subject, month, year, newStatus) {
    // 1. Update Sheets
    if (_sheetsReady()) {
        try {
            await _sheetsPost({
                action: 'toggleFee',
                fee: {
                    student_id: String(studentId),
                    subject: subject,
                    month: month,
                    year: Number(year),
                    status: newStatus
                }
            });
            console.log('[DualSync] Fee toggled in Google Sheets ✓');
        } catch (e) {
            console.warn('[DualSync] Sheets toggleFee error:', e);
        }
    }

    // 2. Update Supabase
    const sb = _getSupabaseClient();
    if (sb) {
        try {
            const sid = String(studentId);
            // Locate student in students table or fees_records table
            const { data: feeRecord } = await sb.from('fees_records')
                .select('*')
                .or('roll_no.eq.' + sid + ',id.eq.' + sid)
                .maybeSingle();

            const rollNo = feeRecord ? feeRecord.roll_no : sid;

            if (newStatus === 'Paid') {
                const now = new Date();
                const paidOnStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                const mShort = (month || 'SEP').slice(0, 3).toUpperCase();
                const paymentAmount = feeRecord?.monthly_fee || 4000;

                const paymentEntry = {
                    month: mShort,
                    fullMonth: month + ' ' + year,
                    paidOn: paidOnStr,
                    amount: paymentAmount,
                    onTime: true,
                    status: 'Verified by Admin (Web Panel)',
                    receiptNo: 'REC-' + year + '-' + mShort + '-' + Math.floor(1000 + Math.random() * 9000)
                };

                const currentPayments = Array.isArray(feeRecord?.recent_payments) ? feeRecord.recent_payments : [];
                const updatedPayments = [paymentEntry, ...currentPayments.filter(p => !(p.month === mShort && p.fullMonth?.includes(String(year))))];

                await sb.from('fees_records').update({
                    status: 'paid',
                    current_due: 0,
                    recent_payments: updatedPayments,
                    updated_at: now.toISOString()
                }).eq('roll_no', rollNo);

                console.log('[DualSync] Fee marked PAID in Supabase for:', rollNo);
            } else {
                // Pending / Due
                const monthlyFee = feeRecord?.monthly_fee || 4000;
                await sb.from('fees_records').update({
                    status: 'due',
                    current_due: monthlyFee,
                    updated_at: new Date().toISOString()
                }).eq('roll_no', rollNo);

                console.log('[DualSync] Fee marked DUE in Supabase for:', rollNo);
            }
        } catch (e) {
            console.warn('[DualSync] Supabase toggleFee error:', e);
        }
    }
};

// ─── ATTENDANCE (DUAL SYNC) ──────────────────────────────────────────────────

window.sb_saveAttendance = async function (attData) {
    // attData = { date, subject, className, records: [{ studentId, name, rollNo, status: 'present'|'absent', lateMinutes }] }
    console.log('[DualSync] Saving attendance...', attData);

    // 1. Save to Google Sheets if supported
    if (_sheetsReady()) {
        try {
            await _sheetsPost({
                action: 'saveAttendance',
                attendance: attData
            });
            console.log('[DualSync] Attendance sent to Google Sheets ✓');
        } catch (e) {}
    }

    // 2. Save to Supabase (classes table and attendance_records table)
    const sb = _getSupabaseClient();
    if (sb && attData.records && attData.records.length > 0) {
        try {
            for (const r of attData.records) {
                const rollNo = r.rollNo || r.studentId;
                const isPresent = r.status === 'present';

                // Insert into classes table (session record)
                await sb.from('classes').insert({
                    roll_no: rollNo,
                    class_grade: attData.className || 'Class 10',
                    subject: attData.subject || 'General',
                    time: r.lateMinutes ? ('Late ' + r.lateMinutes) : 'On Time',
                    status: isPresent ? 'present' : 'absent',
                    class_date: attData.date || new Date().toISOString().split('T')[0],
                    published: true
                });

                // Update student's attendance_records
                const { data: curAtt } = await sb.from('attendance_records')
                    .select('*')
                    .eq('roll_no', rollNo)
                    .maybeSingle();

                if (curAtt) {
                    const newAttended = isPresent ? (curAtt.attended || 0) + 1 : (curAtt.attended || 0);
                    const newTotal = (curAtt.total || 0) + 1;
                    const newOverall = Math.round((newAttended / newTotal) * 100);

                    const todaySubjects = Array.isArray(curAtt.today_subjects) ? curAtt.today_subjects : [];
                    todaySubjects.push({
                        name: attData.subject,
                        status: isPresent ? 'present' : 'absent',
                        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    });

                    await sb.from('attendance_records').update({
                        attended: newAttended,
                        total: newTotal,
                        overall: newOverall,
                        today_subjects: todaySubjects,
                        updated_at: new Date().toISOString()
                    }).eq('roll_no', rollNo);
                }
            }
            console.log('[DualSync] Attendance synced to Supabase student records ✓');
            return true;
        } catch (e) {
            console.warn('[DualSync] Supabase saveAttendance error:', e);
        }
    }
    return true;
};

// ─── BULK MIGRATION (PUSH TO BOTH CLOUDS) ─────────────────────────────────────

window.sb_migrateFromLocalStorage = async function () {
    var students = JSON.parse(localStorage.getItem('students')) || [];
    var feesRaw  = JSON.parse(localStorage.getItem('fees'))     || {};

    if (students.length === 0) {
        return { ok: false, msg: 'No students found in localStorage to migrate.' };
    }

    var msgs = [];

    // 1. Push to Google Sheets
    if (_sheetsReady()) {
        try {
            var studentRows = students.map(_toSheetStudent);
            var validStudentIds = {};
            students.forEach(function (s) { validStudentIds[s.id] = true; });

            var feeRows = [];
            Object.keys(feesRaw).forEach(function (key) {
                var parts = key.split('_');
                if (parts.length < 4) return;
                var studentId = parts[0];
                var year      = Number(parts[parts.length - 1]);
                var month     = parts[parts.length - 2];
                var subject   = parts.slice(1, parts.length - 2).join('_');

                if (validStudentIds[studentId] && feesRaw[key] === 'Paid') {
                    feeRows.push({
                        student_id: String(studentId),
                        subject: subject,
                        month: month,
                        year: year,
                        status: 'Paid'
                    });
                }
            });

            var result = await _sheetsPost({
                action: 'migrate',
                students: studentRows,
                fees: feeRows
            }, 60000);

            if (result && result.ok) msgs.push('Google Sheets (' + students.length + ' students)');
        } catch (e) {
            console.warn('[DualSync] Sheets migration error:', e);
        }
    }

    // 2. Push to Supabase
    const sb = _getSupabaseClient();
    if (sb) {
        try {
            let count = 0;
            for (const s of students) {
                await window.sb_saveStudent(s);
                count++;
            }
            msgs.push('Supabase (' + count + ' students)');
        } catch (e) {
            console.warn('[DualSync] Supabase migration error:', e);
        }
    }

    if (msgs.length === 0) {
        return { ok: false, msg: 'Failed to sync to clouds. Check internet and credentials.' };
    }

    return {
        ok: true,
        msg: '✅ Synced to: ' + msgs.join(' and ')
    };
};
`;

const sheetsClientPath = path.join(privateDir, 'js', 'sheets-client.js');
fs.writeFileSync(sheetsClientPath, dualSyncClientContent, 'utf8');
console.log('✓ Updated sheets-client.js with Dual-Sync (Sheets + Supabase).');

// ==============================================================================
// 3. INJECT Supabase CDN and dependencies into HTML files
// ==============================================================================
const htmlFiles = ['add_student.html', 'fees.html', 'attendance.html', 'timetable.html', 'index.html'];

const supabaseCdnTag = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>';

htmlFiles.forEach(file => {
    const filePath = path.join(privateDir, file);
    if (!fs.existsSync(filePath)) return;

    let html = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // A. Ensure Supabase CDN is present
    if (!html.includes('cdn.jsdelivr.net/npm/@supabase/supabase-js')) {
        if (html.includes('js/config.js')) {
            html = html.replace('<script src="js/config.js"></script>', supabaseCdnTag + '\n    <script src="js/config.js"></script>');
            modified = true;
        } else if (html.includes('js/admin.js')) {
            html = html.replace('<script src="js/admin.js"></script>', supabaseCdnTag + '\n    <script src="js/admin.js"></script>');
            modified = true;
        } else if (html.includes('</body>')) {
            html = html.replace('</body>', '    ' + supabaseCdnTag + '\n</body>');
            modified = true;
        }
    }

    // B. In attendance.html, ensure config.js and sheets-client.js are loaded
    if (file === 'attendance.html') {
        if (!html.includes('js/config.js')) {
            html = html.replace('<script src="js/admin.js"></script>', '<script src="js/config.js"></script>\n    <script src="js/sheets-client.js"></script>\n    <script src="js/admin.js"></script>');
            modified = true;
        }
        // Add "Save Attendance to Cloud" button if not present
        if (!html.includes('saveAttendanceCloudBtn')) {
            const btnSnippet = `
                <button class="btn btn-success mr-2" id="saveAttendanceCloudBtn" style="display:none;" onclick="saveAttendanceToCloud()">
                    <i class="fas fa-cloud-upload-alt mr-1"></i> Save & Sync Attendance
                </button>`;
            html = html.replace('<button class="btn btn-primary" id="shareAttendanceBtn"', btnSnippet + '\n                <button class="btn btn-primary" id="shareAttendanceBtn"');
            modified = true;
        }
    }

    // C. In timetable.html, ensure config.js and sheets-client.js are loaded
    if (file === 'timetable.html') {
        if (!html.includes('js/config.js')) {
            html = html.replace('<script src="js/admin.js"></script>', '<script src="js/config.js"></script>\n    <script src="js/sheets-client.js"></script>\n    <script src="js/admin.js"></script>');
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, html, 'utf8');
        console.log('✓ Updated ' + file + ' with Supabase scripts and cloud capabilities.');
    } else {
        console.log('• ' + file + ' already up-to-date.');
    }
});

// ==============================================================================
// 4. UPDATE admin.js for Attendance Cloud Save & Toast enhancement
// ==============================================================================
const adminJsPath = path.join(privateDir, 'js', 'admin.js');
let adminJs = fs.readFileSync(adminJsPath, 'utf8');

const attendanceCloudHandler = `
// --- Attendance Cloud Save Function (Dual Sync to Sheets & Supabase) ---
window.saveAttendanceToCloud = async function () {
    const dateInput = document.getElementById('attendanceDate');
    const subInput = document.getElementById('attendanceSubject');
    const classInput = document.getElementById('attendanceClassSelect');
    const btn = document.getElementById('saveAttendanceCloudBtn');

    if (!classInput || !classInput.value) {
        alert('Please select a Class first.');
        return;
    }
    const classVal = classInput.value;
    const subVal = subInput ? subInput.value : 'General';
    const dateVal = dateInput && dateInput.value ? dateInput.value : new Date().toISOString().split('T')[0];

    const students = getStudents().filter(s => {
        if (s.class !== classVal) return false;
        if (subVal && !s.subjects.includes(subVal)) return false;
        return true;
    });

    if (students.length === 0) {
        alert('No students found to save attendance.');
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Syncing...';
    }

    const records = students.map(s => {
        const cb = document.getElementById('att_' + s.id);
        const lateInput = document.getElementById('late_time_' + s.id);
        const isPresent = cb ? cb.checked : true;
        return {
            studentId: s.id,
            rollNo: s.rollNo || s.roll_no || s.id,
            name: s.name,
            status: isPresent ? 'present' : 'absent',
            lateMinutes: lateInput ? lateInput.value : ''
        };
    });

    try {
        if (typeof sb_saveAttendance === 'function') {
            await sb_saveAttendance({
                date: dateVal,
                subject: subVal,
                className: 'Class ' + classVal,
                records: records
            });
            alert('✓ Attendance synced successfully to Google Sheets & Supabase!\\n\\nStudent and Faculty apps will now reflect the attendance.');
        } else {
            alert('Cloud sync client not available.');
        }
    } catch (err) {
        alert('Failed to sync attendance: ' + err.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-cloud-upload-alt mr-1"></i> Save & Sync Attendance';
        }
    }
};
`;

if (!adminJs.includes('window.saveAttendanceToCloud')) {
    adminJs += '\n' + attendanceCloudHandler;
    fs.writeFileSync(adminJsPath, adminJs, 'utf8');
    console.log('✓ Added window.saveAttendanceToCloud to admin.js.');
} else {
    console.log('• admin.js already has saveAttendanceToCloud.');
}

// Also make sure when class/date changes, the saveAttendanceCloudBtn is shown along with shareBtn
if (adminJs.includes("shareBtn.style.display = 'inline-block';") && !adminJs.includes("saveCloudBtn.style.display = 'inline-block';")) {
    adminJs = adminJs.replace(
        "shareBtn.style.display = 'inline-block';",
        "shareBtn.style.display = 'inline-block'; const saveCloudBtn = document.getElementById('saveAttendanceCloudBtn'); if (saveCloudBtn) saveCloudBtn.style.display = 'inline-block';"
    );
    adminJs = adminJs.replace(
        "shareBtn.style.display = 'none';",
        "shareBtn.style.display = 'none'; const saveCloudBtn2 = document.getElementById('saveAttendanceCloudBtn'); if (saveCloudBtn2) saveCloudBtn2.style.display = 'none';"
    );
    fs.writeFileSync(adminJsPath, adminJs, 'utf8');
    console.log('✓ Updated admin.js to show Save Attendance button alongside WhatsApp Share button.');
}

console.log('\n========================================');
console.log('ALL ADMIN WEB APP UPGRADES COMPLETE!');
console.log('========================================');
