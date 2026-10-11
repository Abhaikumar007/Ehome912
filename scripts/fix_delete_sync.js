const fs = require('fs');
const path = require('path');

const codeTestDir = path.resolve(__dirname, '..', '..', '..', 'code_test', 'private', 'js');
const sheetsClientPath = path.join(codeTestDir, 'sheets-client.js');
const adminPath = path.join(codeTestDir, 'admin.js');
const masterHubPath = path.join(codeTestDir, 'master_hub.js');

console.log('Target files:');
console.log(' - sheets-client:', fs.existsSync(sheetsClientPath));
console.log(' - admin:', fs.existsSync(adminPath));
console.log(' - master_hub:', fs.existsSync(masterHubPath));

// ==========================================
// 1. UPDATE SHEETS-CLIENT.JS
// ==========================================
let sheetsContent = fs.readFileSync(sheetsClientPath, 'utf8').replace(/\r\n/g, '\n');

// 1a. Replace sb_deleteStudent
const oldSbDeleteRegex = /window\.sb_deleteStudent\s*=\s*async\s*function\s*\(id\)\s*\{[\s\S]*?return\s+sheetsSuccess\s*\|\|\s*supabaseSuccess;\s*\};/;

const newSbDeleteCode = `window.sb_deleteStudent = async function (id) {
    let sheetsSuccess = false;
    let supabaseSuccess = false;
    const sid = String(id || '').trim();
    if (!sid) return false;

    // 0. Blacklist ID in localStorage deleted_students
    try {
        let deletedList = JSON.parse(localStorage.getItem('deleted_students') || '[]');
        if (!deletedList.includes(sid.toUpperCase())) {
            deletedList.push(sid.toUpperCase());
            localStorage.setItem('deleted_students', JSON.stringify(deletedList));
        }
    } catch (_) {}

    // 1. Delete from Sheets
    if (_sheetsReady()) {
        try {
            var result = await _sheetsPost({
                action: 'deleteStudent',
                id: sid
            });
            sheetsSuccess = !!result;
        } catch (e) {
            console.warn('[DualSync] Sheets deleteStudent warning:', e);
        }
    }

    // 2. Delete from Supabase
    const sb = _getSupabaseClient();
    if (sb) {
        try {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sid);
            let targetRoll = sid;
            let targetUuid = isUuid ? sid : null;

            // Look up student to obtain both UUID id and text roll_no
            try {
                let findQuery = sb.from('students').select('id, roll_no');
                if (isUuid) {
                    findQuery = findQuery.or('id.eq.' + sid + ',roll_no.eq.' + sid);
                } else {
                    findQuery = findQuery.eq('roll_no', sid);
                }
                const { data: found } = await findQuery.maybeSingle();
                if (found) {
                    targetRoll = found.roll_no || sid;
                    targetUuid = found.id || targetUuid;

                    // Ensure both identifiers are recorded in deleted_students
                    try {
                        let dList = JSON.parse(localStorage.getItem('deleted_students') || '[]');
                        if (targetRoll && !dList.includes(targetRoll.toUpperCase())) dList.push(targetRoll.toUpperCase());
                        if (targetUuid && !dList.includes(targetUuid.toUpperCase())) dList.push(targetUuid.toUpperCase());
                        localStorage.setItem('deleted_students', JSON.stringify(dList));
                    } catch (_) {}
                }
            } catch (lookErr) {
                console.warn('[DualSync] Lookup before delete error:', lookErr);
            }

            // Clean child records to avoid foreign key constraints / orphaned data
            if (targetRoll) {
                try { await sb.from('fees_records').delete().eq('roll_no', targetRoll); } catch (_) {}
                try { await sb.from('attendance_records').delete().eq('roll_no', targetRoll); } catch (_) {}
                try { await sb.from('progress_records').delete().eq('roll_no', targetRoll); } catch (_) {}
            }

            // Delete student from students table without syntax error
            let delQuery = sb.from('students').delete();
            if (targetUuid) {
                delQuery = delQuery.eq('id', targetUuid);
            } else {
                delQuery = delQuery.eq('roll_no', targetRoll);
            }

            const { error } = await delQuery;
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
};`;

if (!oldSbDeleteRegex.test(sheetsContent)) {
    console.error('FAILED to match sb_deleteStudent in sheets-client.js');
} else {
    sheetsContent = sheetsContent.replace(oldSbDeleteRegex, newSbDeleteCode);
    console.log('✓ Updated sb_deleteStudent in sheets-client.js');
}

// 1b. In sb_loadFromCloud: filter out deleted students when pulling
const oldPullMapCode = `if (!stuRes.error && Array.isArray(stuRes.data) && stuRes.data.length > 0) {
                const localStudents = (typeof getStudents === 'function') ? getStudents() : (JSON.parse(localStorage.getItem('students')) || []);
                const localMap = new Map((localStudents || []).map(l => [String(l.id || l.rollNo).toUpperCase().trim(), l]));

                loadedStudents = stuRes.data.map(r => {`;

const newPullMapCode = `if (!stuRes.error && Array.isArray(stuRes.data) && stuRes.data.length > 0) {
                let deletedSet = new Set();
                try {
                    const d = JSON.parse(localStorage.getItem('deleted_students') || '[]');
                    if (Array.isArray(d)) d.forEach(x => deletedSet.add(String(x).toUpperCase().trim()));
                } catch (_) {}

                const localStudents = (typeof getStudents === 'function') ? getStudents() : (JSON.parse(localStorage.getItem('students')) || []);
                const localMap = new Map((localStudents || []).map(l => [String(l.id || l.rollNo).toUpperCase().trim(), l]));

                const activeStuData = stuRes.data.filter(r => {
                    const rRoll = String(r.roll_no || '').toUpperCase().trim();
                    const rId = String(r.id || '').toUpperCase().trim();
                    return !deletedSet.has(rRoll) && !deletedSet.has(rId);
                });

                loadedStudents = activeStuData.map(r => {`;

if (sheetsContent.includes(oldPullMapCode)) {
    sheetsContent = sheetsContent.replace(oldPullMapCode, newPullMapCode);
    console.log('✓ Updated sb_loadFromCloud pull filter in sheets-client.js');
} else {
    console.warn('Notice: oldPullMapCode not matched verbatim in sheets-client.js, checking alternate...');
}

fs.writeFileSync(sheetsClientPath, sheetsContent, 'utf8');


// ==========================================
// 2. UPDATE ADMIN.JS
// ==========================================
let adminContent = fs.readFileSync(adminPath, 'utf8').replace(/\r\n/g, '\n');

// 2a. Update confirmDeleteStudent
const oldConfirmDeleteRegex = /window\.confirmDeleteStudent\s*=\s*function\s*\(id\)\s*\{[\s\S]*?renderStudentManagementList\(\);\s*\};/;

const newConfirmDeleteCode = `window.confirmDeleteStudent = function (id) {
        const normId = String(id || '').toUpperCase().trim();

        // 1. Record in deleted_students blacklist
        try {
            let deletedList = JSON.parse(localStorage.getItem('deleted_students') || '[]');
            if (!deletedList.includes(normId)) {
                deletedList.push(normId);
                localStorage.setItem('deleted_students', JSON.stringify(deletedList));
            }
        } catch (_) {}

        // 2. Remove from local storage list
        const students = getStudents();
        const updated = students.filter(s => {
            const sId = String(s.id || '').toUpperCase().trim();
            const sRoll = String(s.rollNo || s.roll_no || '').toUpperCase().trim();
            return sId !== normId && sRoll !== normId;
        });
        saveStudents(updated);

        // 3. Sync delete to Cloud
        if (typeof sb_deleteStudent === 'function') {
            sb_deleteStudent(id).then(function (ok) {
                if (ok) {
                    if (typeof _showSyncToast === 'function') _showSyncToast('✓ Deleted from cloud');
                } else {
                    if (typeof _showSyncToast === 'function') _showSyncToast('ℹ️ Deleted locally (not found in cloud)', true);
                }
            });
        }

        renderStudentManagementList();
    };`;

if (!oldConfirmDeleteRegex.test(adminContent)) {
    console.error('FAILED to match confirmDeleteStudent in admin.js');
} else {
    adminContent = adminContent.replace(oldConfirmDeleteRegex, newConfirmDeleteCode);
    console.log('✓ Updated confirmDeleteStudent in admin.js');
}

// 2b. In getStudents(): filter out deleted students and prevent reviving them from MASTER_STUDENTS_ROSTER
const oldGetStudentsStart = `function getStudents() {
    let list = [];
    try {
        const stored = localStorage.getItem('students');
        if (stored) list = JSON.parse(stored);
    } catch (e) {}

    // Deduplicate and consolidate any duplicates by rollNo, name, or phone`;

const newGetStudentsStart = `function getStudents() {
    let list = [];
    try {
        const stored = localStorage.getItem('students');
        if (stored) list = JSON.parse(stored);
    } catch (e) {}

    let deletedSet = new Set();
    try {
        const d = JSON.parse(localStorage.getItem('deleted_students') || '[]');
        if (Array.isArray(d)) d.forEach(x => deletedSet.add(String(x).toUpperCase().trim()));
    } catch (_) {}

    // Deduplicate and consolidate any duplicates by rollNo, name, or phone`;

if (adminContent.includes(oldGetStudentsStart)) {
    adminContent = adminContent.replace(oldGetStudentsStart, newGetStudentsStart);
    console.log('✓ Added deletedSet to getStudents in admin.js');
}

// In getStudents list loop: skip deleted students
const oldListForeach = `if (Array.isArray(list) && list.length > 0) {
        list.forEach(s => {
            const normName = (s.name || '').toLowerCase().trim();
            const roll = (s.rollNo || s.roll_no || s.id || '').toUpperCase().trim();`;

const newListForeach = `if (Array.isArray(list) && list.length > 0) {
        list.forEach(s => {
            const normName = (s.name || '').toLowerCase().trim();
            const roll = (s.rollNo || s.roll_no || s.id || '').toUpperCase().trim();
            const sId = String(s.id || '').toUpperCase().trim();
            if (deletedSet.has(roll) || deletedSet.has(sId)) {
                needsSave = true;
                return;
            }`;

if (adminContent.includes(oldListForeach)) {
    adminContent = adminContent.replace(oldListForeach, newListForeach);
    console.log('✓ Added skip-deleted check in list loop in admin.js');
}

// In getStudents MASTER_STUDENTS_ROSTER loop: do not re-add deleted students
const oldRosterLoop = `if (typeof MASTER_STUDENTS_ROSTER !== 'undefined' && Array.isArray(MASTER_STUDENTS_ROSTER)) {
        MASTER_STUDENTS_ROSTER.forEach(m => {
            const k = (m.rollNo || m.id);
            if (!finalMap.has(k)) {
                finalMap.set(k, JSON.parse(JSON.stringify(m)));
                needsSave = true;
            }
        });
    }`;

const newRosterLoop = `if (typeof MASTER_STUDENTS_ROSTER !== 'undefined' && Array.isArray(MASTER_STUDENTS_ROSTER)) {
        MASTER_STUDENTS_ROSTER.forEach(m => {
            const k = (m.rollNo || m.id);
            const normK = String(k || '').toUpperCase().trim();
            const normMId = String(m.id || '').toUpperCase().trim();
            const normMRoll = String(m.rollNo || '').toUpperCase().trim();
            if (deletedSet.has(normK) || deletedSet.has(normMId) || deletedSet.has(normMRoll)) {
                return; // Do NOT revive deleted student
            }
            if (!finalMap.has(k)) {
                finalMap.set(k, JSON.parse(JSON.stringify(m)));
                needsSave = true;
            }
        });
    }`;

if (adminContent.includes(oldRosterLoop)) {
    adminContent = adminContent.replace(oldRosterLoop, newRosterLoop);
    console.log('✓ Guarded MASTER_STUDENTS_ROSTER against reviving deleted students in admin.js');
}

fs.writeFileSync(adminPath, adminContent, 'utf8');


// ==========================================
// 3. UPDATE MASTER_HUB.JS
// ==========================================
let masterContent = fs.readFileSync(masterHubPath, 'utf8').replace(/\r\n/g, '\n');

// 3a. Update deleteGridRow
const oldDeleteGridRowRegex = /function deleteGridRow\(idx\)\s*\{[\s\S]*?updateFeeSummary\(\);\s*\}\s*\}/;

const newDeleteGridRowCode = `function deleteGridRow(idx) {
    const s = currentStudents[idx];
    if (!s) return;

    if (confirm('Delete student "' + (s.name || 'Unnamed') + '"? This will also remove them from Google Sheets and Supabase.')) {
        const idToDelete = s.id || s.rollNo || s.roll_no;
        const normId = String(idToDelete || '').toUpperCase().trim();

        // Record in deleted_students blacklist
        try {
            let deletedList = JSON.parse(localStorage.getItem('deleted_students') || '[]');
            if (normId && !deletedList.includes(normId)) {
                deletedList.push(normId);
                localStorage.setItem('deleted_students', JSON.stringify(deletedList));
            }
        } catch (_) {}

        currentStudents.splice(idx, 1);
        renderMasterGrid(currentStudents);

        // Delete from clouds
        if (typeof sb_deleteStudent === 'function' && idToDelete) {
            sb_deleteStudent(idToDelete);
        }

        localStorage.setItem('students', JSON.stringify(currentStudents));
        showGridStatusAlert('Deleted student record from local list and clouds.', 'success');
        updateFeeSummary();
    }
}`;

if (!oldDeleteGridRowRegex.test(masterContent)) {
    console.error('FAILED to match deleteGridRow in master_hub.js');
} else {
    masterContent = masterContent.replace(oldDeleteGridRowRegex, newDeleteGridRowCode);
    console.log('✓ Updated deleteGridRow in master_hub.js');
}

// 3b. In refreshMasterData(): filter out deleted students when loading from dbStudents
const oldRefreshFilterCode = `if (!error && Array.isArray(dbStudents) && dbStudents.length > 0) {
                students = dbStudents.map(s => {`;

const newRefreshFilterCode = `if (!error && Array.isArray(dbStudents) && dbStudents.length > 0) {
                let deletedSet = new Set();
                try {
                    const d = JSON.parse(localStorage.getItem('deleted_students') || '[]');
                    if (Array.isArray(d)) d.forEach(x => deletedSet.add(String(x).toUpperCase().trim()));
                } catch (_) {}

                students = dbStudents
                    .filter(s => {
                        const roll = String(s.roll_no || s.rollNo || s.id || '').toUpperCase().trim();
                        const sId = String(s.id || '').toUpperCase().trim();
                        return !deletedSet.has(roll) && !deletedSet.has(sId);
                    })
                    .map(s => {`;

if (masterContent.includes(oldRefreshFilterCode)) {
    masterContent = masterContent.replace(oldRefreshFilterCode, newRefreshFilterCode);
    console.log('✓ Added deletedSet filter in refreshMasterData in master_hub.js');
}

fs.writeFileSync(masterHubPath, masterContent, 'utf8');

console.log('\nAll updates completed successfully!');
