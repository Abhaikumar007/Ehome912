const fs = require('fs');
const filePath = 'C:/Users/madhu/code_test/private/js/live_timetable.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add _activeFilterSyllabus and _resolveLiveItemSyllabus near _activeFilterClass
if (!content.includes('let _activeFilterSyllabus')) {
    content = content.replace(
        "let _activeFilterClass = 'all';",
        `let _activeFilterClass = 'all';\n    let _activeFilterSyllabus = 'all';\n\n    function _resolveLiveItemSyllabus(item) {\n        if (!item) return 'Both';\n        const status = (item.status || '').toLowerCase();\n        const time = (item.time || '').toLowerCase();\n        const board = (item.board || item.target_syllabus || item.targetSyllabus || item.syllabus || '').toLowerCase();\n        const roll = (item.roll_no || '').toLowerCase();\n        const grade = (item.class_grade || '').toLowerCase();\n\n        // 0. Explicit Both / Shared\n        if (\n            board === 'both' || board.includes('both') ||\n            status.split(':').includes('both') || status.includes(':both') || status.includes('both:') ||\n            time.includes('both') || time.includes('state & cbse') || time.includes('cbse & state')\n        ) {\n            return 'Both';\n        }\n\n        // 1. Explicit CBSE\n        if (\n            board === 'cbse' || board === 'cbse only' ||\n            status.split(':').includes('cbse') || status.includes(':cbse') || status.includes('cbse:') || status === 'cbse' ||\n            (time.includes('• cbse') && !time.includes('state & cbse') && !time.includes('cbse & state')) ||\n            time.includes('(cbse)') || time.includes('cbse only') || /\\bcbse\\b/i.test(time) ||\n            roll.includes('cbse') || grade.includes('cbse')\n        ) {\n            return 'CBSE';\n        }\n\n        // 2. Explicit State Syllabus\n        if (\n            board === 'state' || board === 'state only' || board === 'state syllabus' ||\n            status.split(':').includes('state') || status.includes(':state') || status.includes('state:') || status.includes('state syllabus') ||\n            (time.includes('• state') && !time.includes('state & cbse') && !time.includes('cbse & state')) ||\n            time.includes('(state)') || time.includes('state syllabus') || /\\bstate\\b/i.test(time) ||\n            roll.includes('state') || grade.includes('state')\n        ) {\n            return 'State Syllabus';\n        }\n\n        return 'Both';\n    }`
    );
}

// 2. Add syllabus filtering inside renderPlatform
const filterClassTarget = `if (itemGrade !== filterGrade) return false;\n            }`;
const filterSylAddition = `\n\n            // Syllabus Filter\n            if (_activeFilterSyllabus !== 'all') {\n                const itemSyl = _resolveLiveItemSyllabus(item);\n                if (_activeFilterSyllabus === 'State Syllabus') {\n                    if (itemSyl !== 'State Syllabus' && itemSyl !== 'Both') return false;\n                } else if (_activeFilterSyllabus === 'CBSE') {\n                    if (itemSyl !== 'CBSE' && itemSyl !== 'Both') return false;\n                } else if (_activeFilterSyllabus === 'Both') {\n                    if (itemSyl !== 'Both') return false;\n                }\n            }`;

if (!content.includes('// Syllabus Filter') && content.includes(filterClassTarget)) {
    content = content.replace(filterClassTarget, filterClassTarget + filterSylAddition);
}

// 3. Add Schedule Session button in header
const postNewTarget = `<a href="#timetable-container" class="btn btn-sm btn-primary" style="font-weight:600; border-radius:8px;">\n                                <i class="fas fa-plus mr-1"></i> Post New\n                            </a>`;
const postNewReplacement = `<button class="btn btn-sm btn-primary font-weight-bold shadow-sm" onclick="window.openCreateClassModal()" style="border-radius:8px;" title="Schedule a new live class session with target syllabus">\n                                <i class="fas fa-plus-circle mr-1"></i> Schedule Session\n                            </button>`;
if (content.includes(postNewTarget)) {
    content = content.replace(postNewTarget, postNewReplacement);
}

// 4. Add Syllabus Filter dropdown next to Class Filter in toolbar
const classFilterEnd = `</select>\n                            </div>`;
const syllabusFilterHtml = `\n\n                            <!-- Syllabus Filter -->\n                            <div class="d-flex align-items-center">\n                                <label class="small text-muted font-weight-bold mr-2 mb-0" style="white-space:nowrap;"><i class="fas fa-book-reader mr-1"></i>Syllabus:</label>\n                                <select class="form-control form-control-sm" id="liveFilterSyllabus" style="width:130px; border-radius:6px;" onchange="window.filterLiveSyllabus(this.value, '\${containerId}')">\n                                    <option value="all" \${_activeFilterSyllabus === 'all' ? 'selected' : ''}>All</option>\n                                    <option value="State Syllabus" \${_activeFilterSyllabus === 'State Syllabus' ? 'selected' : ''}>State Only</option>\n                                    <option value="CBSE" \${_activeFilterSyllabus === 'CBSE' ? 'selected' : ''}>CBSE Only</option>\n                                    <option value="Both" \${_activeFilterSyllabus === 'Both' ? 'selected' : ''}>Both (Shared)</option>\n                                </select>\n                            </div>`;

if (!content.includes('id="liveFilterSyllabus"') && content.includes(classFilterEnd)) {
    content = content.replace(classFilterEnd, classFilterEnd + syllabusFilterHtml);
}

// 5. Update Grade Column to show Syllabus Badge
const gradeColTarget = `<!-- Grade -->\n                                        <td style="vertical-align:middle;">\n                                            <span class="badge px-2 py-1" style="background:#e0f2fe; color:#0369a1; font-weight:700; border-radius:6px; font-size:0.8rem;">\n                                                \${item.class_grade || item.roll_no || 'Class'}\n                                            </span>\n                                        </td>`;
const gradeColReplacement = `<!-- Grade & Syllabus -->\n                                        <td style="vertical-align:middle;">\n                                            <span class="badge px-2 py-1" style="background:#e0f2fe; color:#0369a1; font-weight:700; border-radius:6px; font-size:0.8rem;">\n                                                \${item.class_grade || item.roll_no || 'Class'}\n                                            </span>\n                                            \${(() => {\n                                                const syl = _resolveLiveItemSyllabus(item);\n                                                if (syl === 'CBSE') {\n                                                    return '<div class=\"mt-1\"><span class=\"badge\" style=\"background:#e0f2fe; color:#0284c7; border:1px solid #bae6fd; font-size:0.72rem; font-weight:600;\"><i class=\"fas fa-book mr-1\"></i>CBSE</span></div>';\n                                                } else if (syl === 'State Syllabus') {\n                                                    return '<div class=\"mt-1\"><span class=\"badge\" style=\"background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; font-size:0.72rem; font-weight:600;\"><i class=\"fas fa-landmark mr-1\"></i>State Syllabus</span></div>';\n                                                } else {\n                                                    return '<div class=\"mt-1\"><span class=\"badge\" style=\"background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; font-size:0.72rem; font-weight:600;\"><i class=\"fas fa-users mr-1\"></i>State & CBSE</span></div>';\n                                                }\n                                            })()}\n                                        </td>`;

if (content.includes(gradeColTarget)) {
    content = content.replace(gradeColTarget, gradeColReplacement);
}

// 6. Update _injectEditModalDOM to include editClassSyllabus
const oldStatusRow = `<!-- Status Row -->\n                    <div class="form-row mb-3">\n                        <div class="col-md-12">\n                            <label class="font-weight-bold text-dark small mb-1">Session Status</label>\n                            <select class="form-control" id="editClassStatus">\n                                <option value="upcoming">📖 Upcoming</option>\n                                <option value="completed">✅ Completed</option>\n                                <option value="cancelled">❌ Cancelled</option>\n                            </select>\n                        </div>\n                    </div>`;

const newSyllabusAndStatusRow = `<!-- Target Syllabus & Status Row -->\n                    <div class="form-row mb-3">\n                        <div class="col-md-6">\n                            <label class="font-weight-bold text-dark small mb-1">Target Syllabus *</label>\n                            <select class="form-control" id="editClassSyllabus" required>\n                                <option value="Both">Both (State & CBSE)</option>\n                                <option value="State Syllabus">State Syllabus</option>\n                                <option value="CBSE">CBSE</option>\n                            </select>\n                        </div>\n                        <div class="col-md-6">\n                            <label class="font-weight-bold text-dark small mb-1">Session Status</label>\n                            <select class="form-control" id="editClassStatus">\n                                <option value="upcoming">📖 Upcoming</option>\n                                <option value="completed">✅ Completed</option>\n                                <option value="cancelled">❌ Cancelled</option>\n                            </select>\n                        </div>\n                    </div>`;

if (content.includes(oldStatusRow)) {
    content = content.replace(oldStatusRow, newSyllabusAndStatusRow);
}

// 7. Update openEditClassModal
const openEditTarget = `_currentEditId = classId;\n        document.getElementById('editClassId').value = classId;`;
const openEditReplacement = `_currentEditId = classId;\n        document.getElementById('editClassId').value = classId;\n\n        const modalTitle = document.querySelector('#editLiveClassModal h5');\n        if (modalTitle) {\n            modalTitle.innerHTML = '<i class=\"fas fa-edit mr-2\"></i>Edit Scheduled Class Session';\n        }\n        const saveBtn = document.getElementById('saveClassEditBtn');\n        if (saveBtn) {\n            saveBtn.disabled = false;\n            saveBtn.innerHTML = '<i class=\"fas fa-save mr-1\"></i> Save Changes';\n        }`;

if (content.includes(openEditTarget) && !content.includes(`modalTitle.innerHTML = '<i class="fas fa-edit mr-2"></i>Edit Scheduled Class Session'`)) {
    content = content.replace(openEditTarget, openEditReplacement);
}

// Replace detection in openEditClassModal to use _resolveLiveItemSyllabus
const oldDetectSyl = `const normSylStatus = (item.status || '').toLowerCase();\n        const normSylTime = (item.time || '').toLowerCase();\n        let detectedSyl = 'Both';\n        if (normSylStatus.includes(':cbse') || normSylStatus.includes('cbse:') || normSylTime.includes('• cbse') || normSylTime.includes('(cbse)')) {\n            detectedSyl = 'CBSE';\n        } else if (normSylStatus.includes(':state') || normSylStatus.includes('state:') || normSylTime.includes('• state') || normSylTime.includes('(state)')) {\n            detectedSyl = 'State Syllabus';\n        }\n        const sylInput = document.getElementById('editClassSyllabus');\n        if (sylInput) sylInput.value = detectedSyl;`;

const newDetectSyl = `// Populate editClassSyllabus\n        const detectedSyl = _resolveLiveItemSyllabus(item);\n        const sylInput = document.getElementById('editClassSyllabus');\n        if (sylInput) sylInput.value = detectedSyl;`;

if (content.includes(oldDetectSyl)) {
    content = content.replace(oldDetectSyl, newDetectSyl);
}

// 8. Add window.openCreateClassModal
if (!content.includes('window.openCreateClassModal')) {
    const createModalFunc = `\n    // ── Open Create Class Modal ────────────────────────────────────────\n    window.openCreateClassModal = function (prefillGrade) {\n        _injectEditModalDOM();\n        _currentEditId = null;\n        document.getElementById('editClassId').value = '';\n\n        const modalTitle = document.querySelector('#editLiveClassModal h5');\n        if (modalTitle) {\n            modalTitle.innerHTML = '<i class=\"fas fa-plus-circle mr-2\"></i>Schedule Class Session';\n        }\n        const saveBtn = document.getElementById('saveClassEditBtn');\n        if (saveBtn) {\n            saveBtn.disabled = false;\n            saveBtn.innerHTML = '<i class=\"fas fa-plus-circle mr-1\"></i> Schedule & Publish Session';\n        }\n\n        const todayStr = new Date().toISOString().slice(0, 10);\n        const defaultGrade = prefillGrade || (_activeFilterClass !== 'all' ? \`Class \${_activeFilterClass}\` : 'Class 8');\n        document.getElementById('editClassGrade').value = defaultGrade;\n        document.getElementById('editClassSubject').value = 'Maths';\n        document.getElementById('editClassDate').value = todayStr;\n\n        const sylInput = document.getElementById('editClassSyllabus');\n        if (sylInput) {\n            sylInput.value = (_activeFilterSyllabus !== 'all' ? _activeFilterSyllabus : 'Both');\n        }\n\n        document.getElementById('editClassStartTime').value = '04:00 PM';\n        document.getElementById('editClassEndTime').value = '05:00 PM';\n        document.getElementById('editClassStatus').value = 'upcoming';\n\n        const sessionTypeEl = document.getElementById('editClassSessionType');\n        if (sessionTypeEl) sessionTypeEl.value = 'Regular';\n\n        document.getElementById('editClassPublished').checked = true;\n        document.getElementById('editClassBroadcast').checked = true;\n\n        const assigned = getAssignedFacultyFor('Maths', defaultGrade);\n        _populateEditFacultyDropdown('', assigned);\n        const hintEl = document.getElementById('editClassFacultyHint');\n        if (hintEl) {\n            hintEl.innerHTML = \`<i class=\"fas fa-check-circle mr-1\"></i>Official Allotted Teacher: <strong>\${assigned.name}</strong>\`;\n        }\n\n        const modal = document.getElementById('editLiveClassModal');\n        modal.style.display = 'flex';\n    };\n`;

    content = content.replace(
        'window.closeEditClassModal = function () {',
        createModalFunc + '\n    window.closeEditClassModal = function () {'
    );
}

// 9. Update saveLiveClassEdit to handle both insert and update
const oldCheckId = `const classId = _currentEditId || document.getElementById('editClassId').value;\n        if (!classId) return;`;
const newCheckId = `const classId = _currentEditId || document.getElementById('editClassId').value;`;

if (content.includes(oldCheckId)) {
    content = content.replace(oldCheckId, newCheckId);
}

const oldUpdateBlock = `// 1. Update in Supabase classes table\n            const { error: updErr } = await sb.from('classes').update({\n                class_grade: classGrade,\n                roll_no: classGrade,\n                subject: subject,\n                class_date: classDate,\n                time: finalTime,\n                status: finalStatus,\n                published: published\n            }).eq('id', classId);\n\n            if (updErr) {\n                console.error('[LiveTimetable] Update error:', updErr);\n                throw updErr;\n            }`;

const newUpdateBlock = `// 1. Save (Update or Insert) in Supabase classes table\n            const recordPayload = {\n                class_grade: classGrade,\n                roll_no: classGrade,\n                subject: subject,\n                class_date: classDate,\n                time: finalTime,\n                status: finalStatus,\n                published: published\n            };\n\n            if (classId) {\n                const { error: updErr } = await sb.from('classes').update(recordPayload).eq('id', classId);\n                if (updErr) {\n                    console.error('[LiveTimetable] Update error:', updErr);\n                    throw updErr;\n                }\n                _showToast(\`✅ Updated \${classGrade} \${subject} (\${targetSyl})!\`);\n            } else {\n                const { error: insErr } = await sb.from('classes').insert([recordPayload]);\n                if (insErr) {\n                    console.error('[LiveTimetable] Insert error:', insErr);\n                    throw insErr;\n                }\n                _showToast(\`✅ Scheduled new \${classGrade} \${subject} (\${targetSyl})!\`);\n            }`;

if (content.includes(oldUpdateBlock)) {
    content = content.replace(oldUpdateBlock, newUpdateBlock);
}

// 10. Add window.filterLiveSyllabus
if (!content.includes('window.filterLiveSyllabus =')) {
    content = content.replace(
        'window.filterLiveClass = function (val, containerId) {',
        `window.filterLiveSyllabus = function (val, containerId) {\n        _activeFilterSyllabus = val;\n        renderPlatform(containerId);\n    };\n\n    window.filterLiveClass = function (val, containerId) {`
    );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched live_timetable.js! New length:', content.length);
