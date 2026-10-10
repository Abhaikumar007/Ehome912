const fs = require('fs');
const path = require('path');

const masterHubJsPath = 'C:/Users/madhu/code_test/private/js/master_hub.js';
const masterHubHtmlPath = 'C:/Users/madhu/code_test/private/master_hub.html';

console.log('--- Applying Edit Announcement & Live Alert feature ---');

// 1. Read files
let jsContent = fs.readFileSync(masterHubJsPath, 'utf8');
let htmlContent = fs.readFileSync(masterHubHtmlPath, 'utf8');

// Backup files first
fs.writeFileSync(masterHubJsPath + '.bak_' + Date.now(), jsContent, 'utf8');
fs.writeFileSync(masterHubHtmlPath + '.bak_' + Date.now(), htmlContent, 'utf8');

// 2. Check and patch loadActiveBroadcasts in master_hub.js
// Store loaded announcements globally so openEditAnnouncementModal can read them instantly
if (!jsContent.includes('window._allLoadedAnnouncements = anns;')) {
    jsContent = jsContent.replace(
        'if (anns && anns.length > 0) {',
        'if (anns && anns.length > 0) {\n                window._allLoadedAnnouncements = anns;'
    );
}

// In regularAnns card footer, add Edit button
const regularFooterOld = `<div class="broadcast-card-footer d-flex justify-content-end align-items-center pt-2 border-top">
                            + '<button type="button" class="btn btn-sm btn-outline-danger px-3 py-1 btn-delete-ann" data-id="' + a.id + '" onclick="window.requestDeleteAnnouncement('\\'' + a.id + '\\'', this, event)" title="Delete this announcement" style="cursor: pointer;">'
                            + '<i class="fas fa-trash-alt mr-1" style="pointer-events: none;"></i> Delete'
                            + '</button>'
                            + '</div>'`;

// Let's replace the regular announcements card footer
const regularTargetRegex = /html \+= '<div class="broadcast-card-footer d-flex justify-content-end align-items-center pt-2 border-top">'\s*\+\s*'<button type="button" class="btn btn-sm btn-outline-danger px-3 py-1 btn-delete-ann" data-id="' \+ a\.id \+ '" onclick="window\.requestDeleteAnnouncement\('\\'' \+ a\.id \+ '\\'', this, event\)" title="Delete this announcement" style="cursor: pointer;">'\s*\+\s*'<i class="fas fa-trash-alt mr-1" style="pointer-events: none;"><\/i> Delete'\s*\+\s*'<\/button>'\s*\+\s*'<\/div>';/;

const regularReplacement = `html += '<div class="broadcast-card-footer d-flex justify-content-end align-items-center pt-2 border-top">'
                            + '<div class="broadcast-actions-area d-flex align-items-center" style="gap: 8px;">'
                            + '<button type="button" class="btn btn-sm btn-outline-primary px-3 py-1 btn-edit-ann" data-id="' + a.id + '" onclick="window.openEditAnnouncementModal(\\'' + a.id + '\\', this, event)" title="Edit this announcement" style="cursor: pointer;">'
                            + '<i class="fas fa-edit mr-1" style="pointer-events: none;"></i> Edit'
                            + '</button>'
                            + '<button type="button" class="btn btn-sm btn-outline-danger px-3 py-1 btn-delete-ann" data-id="' + a.id + '" onclick="window.requestDeleteAnnouncement(\\'' + a.id + '\\', this, event)" title="Delete this announcement" style="cursor: pointer;">'
                            + '<i class="fas fa-trash-alt mr-1" style="pointer-events: none;"></i> Delete'
                            + '</button>'
                            + '</div>'
                            + '</div>';`;

if (regularTargetRegex.test(jsContent)) {
    jsContent = jsContent.replace(regularTargetRegex, regularReplacement);
    console.log('✓ Replaced regularAnns footer with Edit + Delete buttons');
} else {
    console.warn('⚠️ Could not match regularTargetRegex directly, checking alternative match...');
    // Fallback search
    const regMarker = 'title="Delete this announcement"';
    if (jsContent.includes(regMarker)) {
        console.log('Found regMarker, patching...');
        jsContent = jsContent.replace(
            `<button type="button" class="btn btn-sm btn-outline-danger px-3 py-1 btn-delete-ann" data-id="' + a.id + '" onclick="window.requestDeleteAnnouncement('\\'' + a.id + '\\'', this, event)" title="Delete this announcement" style="cursor: pointer;">`,
            `<div class="broadcast-actions-area d-flex align-items-center" style="gap: 8px;">'
                            + '<button type="button" class="btn btn-sm btn-outline-primary px-3 py-1 btn-edit-ann" data-id="' + a.id + '" onclick="window.openEditAnnouncementModal(\\'' + a.id + '\\', this, event)" title="Edit this announcement" style="cursor: pointer;">'
                            + '<i class="fas fa-edit mr-1" style="pointer-events: none;"></i> Edit'
                            + '</button>'
                            + '<button type="button" class="btn btn-sm btn-outline-danger px-3 py-1 btn-delete-ann" data-id="' + a.id + '" onclick="window.requestDeleteAnnouncement(\\'' + a.id + '\\', this, event)" title="Delete this announcement" style="cursor: pointer;">`
        ).replace(
            `+ '<i class="fas fa-trash-alt mr-1" style="pointer-events: none;"></i> Delete'\n                            + '</button>'\n                            + '</div>';`,
            `+ '<i class="fas fa-trash-alt mr-1" style="pointer-events: none;"></i> Delete'\n                            + '</button>'\n                            + '</div>'\n                            + '</div>';`
        );
    }
}

// In examAlerts card footer, add Edit button
const examTargetRegex = /html \+= '<div class="broadcast-card-footer d-flex justify-content-end align-items-center pt-2 border-top">'\s*\+\s*'<button type="button" class="btn btn-sm btn-outline-danger px-3 py-1 btn-delete-ann" data-id="' \+ a\.id \+ '" onclick="window\.requestDeleteAnnouncement\('\\'' \+ a\.id \+ '\\'', this, event\)" title="Delete this exam alert" style="cursor: pointer;">'\s*\+\s*'<i class="fas fa-trash-alt mr-1" style="pointer-events: none;"><\/i> Delete'\s*\+\s*'<\/button>'\s*\+\s*'<\/div>';/;

const examReplacement = `html += '<div class="broadcast-card-footer d-flex justify-content-end align-items-center pt-2 border-top">'
                            + '<div class="broadcast-actions-area d-flex align-items-center" style="gap: 8px;">'
                            + '<button type="button" class="btn btn-sm btn-outline-primary px-3 py-1 btn-edit-ann" data-id="' + a.id + '" onclick="window.openEditAnnouncementModal(\\'' + a.id + '\\', this, event)" title="Edit this exam alert" style="cursor: pointer;">'
                            + '<i class="fas fa-edit mr-1" style="pointer-events: none;"></i> Edit'
                            + '</button>'
                            + '<button type="button" class="btn btn-sm btn-outline-danger px-3 py-1 btn-delete-ann" data-id="' + a.id + '" onclick="window.requestDeleteAnnouncement(\\'' + a.id + '\\', this, event)" title="Delete this exam alert" style="cursor: pointer;">'
                            + '<i class="fas fa-trash-alt mr-1" style="pointer-events: none;"></i> Delete'
                            + '</button>'
                            + '</div>'
                            + '</div>';`;

if (examTargetRegex.test(jsContent)) {
    jsContent = jsContent.replace(examTargetRegex, examReplacement);
    console.log('✓ Replaced examAlerts footer with Edit + Delete buttons');
} else {
    console.warn('⚠️ Could not match examTargetRegex directly, checking alternative match...');
    const examMarker = 'title="Delete this exam alert"';
    if (jsContent.includes(examMarker)) {
        console.log('Found examMarker, patching...');
        jsContent = jsContent.replace(
            `<button type="button" class="btn btn-sm btn-outline-danger px-3 py-1 btn-delete-ann" data-id="' + a.id + '" onclick="window.requestDeleteAnnouncement('\\'' + a.id + '\\'', this, event)" title="Delete this exam alert" style="cursor: pointer;">`,
            `<div class="broadcast-actions-area d-flex align-items-center" style="gap: 8px;">'
                            + '<button type="button" class="btn btn-sm btn-outline-primary px-3 py-1 btn-edit-ann" data-id="' + a.id + '" onclick="window.openEditAnnouncementModal(\\'' + a.id + '\\', this, event)" title="Edit this exam alert" style="cursor: pointer;">'
                            + '<i class="fas fa-edit mr-1" style="pointer-events: none;"></i> Edit'
                            + '</button>'
                            + '<button type="button" class="btn btn-sm btn-outline-danger px-3 py-1 btn-delete-ann" data-id="' + a.id + '" onclick="window.requestDeleteAnnouncement(\\'' + a.id + '\\', this, event)" title="Delete this exam alert" style="cursor: pointer;">`
        );
    }
}

// 3. Add Edit Modal HTML string & Controller Functions in master_hub.js
const editModalFunctions = `
// ─── ACTIVE ANNOUNCEMENT & LIVE ALERT EDIT CONTROLLER ────────────────────────

window.ensureEditAnnouncementModalInDOM = function () {
    if (document.getElementById('editAnnouncementModal')) return;

    const modalHtml = \`
    <div class="modal fade" id="editAnnouncementModal" tabindex="-1" role="dialog" aria-labelledby="editAnnouncementModalLabel" aria-hidden="true" style="z-index: 1065;">
        <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 14px; overflow: hidden;">
                <div class="modal-header bg-primary text-white py-3">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-edit fa-lg mr-2"></i>
                        <div>
                            <h5 class="modal-title font-weight-bold mb-0" id="editAnnouncementModalLabel">Edit Active Announcement & Live Alert</h5>
                            <small class="text-white-50">Modify existing alert details and broadcast updates live to students and faculty</small>
                        </div>
                    </div>
                    <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close" onclick="window.closeEditAnnouncementModal()" style="opacity: 0.9; outline: none;">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form id="editAnnouncementForm" onsubmit="window.handleSaveEditedAnnouncement(event)">
                    <div class="modal-body p-4" style="max-height: 75vh; overflow-y: auto;">
                        <input type="hidden" id="edit_ann_id" />

                        <!-- Section 1: Classification & Target Scope -->
                        <div class="card p-3 mb-3 border-0" style="background: #f8fafc; border-radius: 10px; border-left: 4px solid #3b82f6 !important;">
                            <h6 class="font-weight-bold text-dark mb-2"><i class="fas fa-bullseye mr-1 text-primary"></i> Target Audience & Classification</h6>
                            <div class="row">
                                <div class="col-md-6 form-group">
                                    <label class="font-weight-bold small text-secondary">Priority / Alert Type</label>
                                    <select class="form-control" id="edit_ann_type" onchange="window.toggleEditAnnTypeFields()">
                                        <option value="exam">📅 Academic Exam / Test Alert</option>
                                        <option value="urgent">🚨 Urgent Alert</option>
                                        <option value="notice">📢 General Notice</option>
                                        <option value="holiday">🌴 Holiday / Reschedule</option>
                                        <option value="event">🏆 Event / Celebration</option>
                                    </select>
                                </div>
                                <div class="col-md-6 form-group">
                                    <label class="font-weight-bold small text-secondary">Target Class / Student Scope</label>
                                    <select class="form-control" id="edit_ann_class">
                                        <option value="All">All Students & Teachers</option>
                                        <option value="Class 12">Class 12</option>
                                        <option value="Class 11">Class 11</option>
                                        <option value="Class 10">Class 10</option>
                                        <option value="Class 9">Class 9</option>
                                        <option value="Class 8">Class 8</option>
                                        <option value="Class 7">Class 7</option>
                                        <option value="Class 6">Class 6</option>
                                    </select>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 form-group mb-0">
                                    <label class="font-weight-bold small text-secondary">Syllabus Stream Scope</label>
                                    <select class="form-control" id="edit_ann_syllabus_stream">
                                        <option value="Both">Both (State Syllabus & CBSE)</option>
                                        <option value="State Syllabus">State Syllabus Only</option>
                                        <option value="CBSE">CBSE Only</option>
                                    </select>
                                </div>
                                <div class="col-md-6 form-group mb-0">
                                    <label class="font-weight-bold small text-secondary">Subject (Optional)</label>
                                    <input type="text" class="form-control" id="edit_ann_subject" placeholder="e.g. Computer Science, Physics, Mathematics" />
                                </div>
                            </div>
                        </div>

                        <!-- Section 2: Alert Title & Content -->
                        <div class="form-group">
                            <label class="font-weight-bold small text-secondary">Alert Title <span class="text-danger">*</span></label>
                            <input type="text" class="form-control font-weight-bold" id="edit_ann_title" placeholder="e.g. Unit 6 Revision / Physics Test" required />
                        </div>

                        <div class="form-group" id="edit_ann_msg_group">
                            <label class="font-weight-bold small text-secondary">Message / Details Content</label>
                            <textarea class="form-control" id="edit_ann_msg" rows="3" placeholder="Enter full announcement details to be shown on student and faculty dashboards..."></textarea>
                        </div>

                        <!-- Section 3: Academic Exam Specific Details -->
                        <div id="edit_ann_exam_section" class="card p-3 mb-3 border-0" style="background: #fef2f2; border-radius: 10px; border-left: 4px solid #ef4444 !important;">
                            <h6 class="font-weight-bold text-danger mb-2"><i class="fas fa-file-signature mr-1"></i> Academic Test & Exam Information</h6>
                            <div class="row">
                                <div class="col-md-6 form-group">
                                    <label class="font-weight-bold small text-dark">📅 Exam Date</label>
                                    <input type="date" class="form-control" id="edit_ann_exam_date" />
                                </div>
                                <div class="col-md-6 form-group">
                                    <label class="font-weight-bold small text-dark">🎯 Max Marks</label>
                                    <input type="number" class="form-control" id="edit_ann_max_marks" placeholder="100" />
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 form-group">
                                    <label class="font-weight-bold small text-dark">📍 Venue / Room</label>
                                    <input type="text" class="form-control" id="edit_ann_venue" placeholder="e.g. Exam Hall 1, Room 204" />
                                </div>
                                <div class="col-md-6 form-group">
                                    <label class="font-weight-bold small text-dark">👨‍🏫 Faculty / Submitted By</label>
                                    <input type="text" class="form-control" id="edit_ann_author" placeholder="e.g. Faculty Member / Center Admin" />
                                </div>
                            </div>
                            <div class="form-group mb-0">
                                <label class="font-weight-bold small text-dark">📚 Prescribed Syllabus (Chapters / Portion)</label>
                                <textarea class="form-control" id="edit_ann_syllabus" rows="2" placeholder="e.g. Unit 6: Object Oriented Programming&#10;Unit 7: Data Structures"></textarea>
                            </div>
                        </div>

                        <!-- Section 4: Schedule, Timing & Visibility Dates -->
                        <div class="card p-3 mb-3 border-0 shadow-sm" style="background: #eff6ff; border-radius: 10px; border-left: 4px solid #2563eb !important;">
                            <h6 class="font-weight-bold text-primary mb-2">
                                <i class="fas fa-calendar-alt mr-1"></i> Schedule & Alert Visibility Dates
                            </h6>
                            <div class="row">
                                <div class="col-md-6 form-group">
                                    <label class="font-weight-bold small text-dark">Show From Date (Start Date)</label>
                                    <input type="date" class="form-control" id="edit_ann_start_date" />
                                    <small class="text-muted">Alert appears on student devices from this date onwards.</small>
                                </div>
                                <div class="col-md-6 form-group">
                                    <label class="font-weight-bold small text-dark">Valid Until Date (End Date / Expiry)</label>
                                    <input type="date" class="form-control" id="edit_ann_end_date" />
                                    <small class="text-muted">Alert automatically disappears after this date passes.</small>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 form-group mb-0">
                                    <label class="font-weight-bold small text-dark">⏰ Start Time</label>
                                    <input type="text" class="form-control" id="edit_ann_start_time" placeholder="e.g. 11:30 AM" />
                                </div>
                                <div class="col-md-6 form-group mb-0">
                                    <label class="font-weight-bold small text-dark">⏰ End Time</label>
                                    <input type="text" class="form-control" id="edit_ann_end_time" placeholder="e.g. 1:00 PM" />
                                </div>
                            </div>
                        </div>

                        <!-- Section 5: Display Settings -->
                        <div class="row">
                            <div class="col-md-6 form-group">
                                <label class="font-weight-bold small text-secondary">Display Badge / Time Label</label>
                                <input type="text" class="form-control" id="edit_ann_time_label" placeholder="e.g. Just now, Exam: Sat, Oct 10, 2026" />
                            </div>
                            <div class="col-md-6 form-group">
                                <label class="font-weight-bold small text-secondary">Display Icon</label>
                                <select class="form-control" id="edit_ann_icon">
                                    <option value="calendar">📅 Calendar (Exam / Date)</option>
                                    <option value="megaphone">📢 Megaphone (Notice / Broadcast)</option>
                                    <option value="trophy">🏆 Trophy (Event / Award)</option>
                                    <option value="bell">🔔 Bell (Alert)</option>
                                </select>
                            </div>
                        </div>

                        <div class="custom-control custom-switch mt-2">
                            <input type="checkbox" class="custom-control-input" id="edit_ann_important">
                            <label class="custom-control-label font-weight-bold text-dark" for="edit_ann_important">
                                Mark as High Priority / Highlighted Alert Banner
                            </label>
                            <small class="d-block text-muted">Pins this announcement at the top of the mobile home screen.</small>
                        </div>
                    </div>
                    <div class="modal-footer bg-light px-4 py-3 d-flex justify-content-between">
                        <button type="button" class="btn btn-secondary px-3" data-dismiss="modal" onclick="window.closeEditAnnouncementModal()">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary font-weight-bold px-4 shadow-sm" id="saveEditAnnBtn">
                            <i class="fas fa-save mr-1"></i> Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    \`;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHtml;
    document.body.appendChild(wrapper.firstElementChild);
};

window.toggleEditAnnTypeFields = function () {
    const type = document.getElementById('edit_ann_type')?.value || 'notice';
    const examSection = document.getElementById('edit_ann_exam_section');
    const iconSelect = document.getElementById('edit_ann_icon');
    const importantCheck = document.getElementById('edit_ann_important');

    if (examSection) {
        if (type === 'exam') {
            examSection.style.display = 'block';
            if (iconSelect && (!iconSelect.value || iconSelect.value === 'megaphone')) {
                iconSelect.value = 'calendar';
            }
        } else {
            // Keep accessible or slightly faded for non-exams
            examSection.style.display = 'none';
        }
    }
};

window.openEditAnnouncementModal = async function (id, btn, e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    if (!id) return;

    window.ensureEditAnnouncementModalInDOM();

    const sb = _getMasterHubSupabase();
    let item = null;

    if (window._allLoadedAnnouncements && Array.isArray(window._allLoadedAnnouncements)) {
        item = window._allLoadedAnnouncements.find(a => String(a.id) === String(id));
    }

    if (!item && sb) {
        try {
            const { data, error } = await sb.from('announcements').select('*').eq('id', id).maybeSingle();
            if (!error && data) item = data;
        } catch (fetchErr) {
            console.warn('[MasterHub] Error fetching announcement for edit:', fetchErr);
        }
    }

    if (!item) {
        alert('Could not find announcement details. Please refresh the page.');
        return;
    }

    const rawTitle = item.title || '';
    const desc = item.description || '';

    // Helpers to parse date to YYYY-MM-DD
    function toIso(dateInput) {
        if (!dateInput) return '';
        const clean = String(dateInput).trim();
        const isoM = clean.match(/^(\\d{4})-(\\d{1,2})-(\\d{1,2})/);
        if (isoM) {
            return isoM[1] + '-' + isoM[2].padStart(2, '0') + '-' + isoM[3].padStart(2, '0');
        }
        const d = new Date(clean);
        if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return y + '-' + m + '-' + day;
        }
        return '';
    }

    // 1. Determine Type
    let type = 'notice';
    const isExam = /exam|test|unit\\s*test|paper/i.test(rawTitle)
        || /exam\\s*date|max\\s*marks|syllabus/i.test(desc)
        || item.icon === 'calendar';
    if (isExam) type = 'exam';
    else if (item.important || /urgent/i.test(rawTitle)) type = 'urgent';
    else if (item.icon === 'calendar' || /holiday/i.test(rawTitle)) type = 'holiday';
    else if (item.icon === 'trophy' || /event/i.test(rawTitle)) type = 'event';

    // 2. Class Scope
    let targetClass = 'All';
    const clsMatch = rawTitle.match(/\\[(Class\\s*\\d{1,2}(?:-[A-Za-z0-9]+)?|All Classes)\\]/i)
        || rawTitle.match(/\\[Exam Alert\\s*-\\s*(Class\\s*\\d{1,2})\\]/i)
        || desc.match(/(?:Class|Grade):\\s*([^\\n\\r|,]+)/i);
    if (clsMatch) {
        targetClass = clsMatch[1].trim();
        if (targetClass === 'All Classes') targetClass = 'All';
    }

    // 3. Syllabus Stream Scope
    let syllabusStream = 'Both';
    const sylStreamMatch = rawTitle.match(/\\[(State Syllabus|CBSE|Both)\\]/i)
        || desc.match(/(?:Syllabus Stream|Stream):\\s*(State Syllabus|CBSE|Both)/i);
    if (sylStreamMatch) {
        syllabusStream = sylStreamMatch[1];
    } else if (/State Syllabus/i.test(desc) && !desc.match(/Syllabus:\\s*(?!State Syllabus)/i)) {
        syllabusStream = 'State Syllabus';
    } else if (/CBSE/i.test(desc) && !desc.match(/Syllabus:\\s*(?!CBSE)/i)) {
        syllabusStream = 'CBSE';
    }

    // 4. Subject
    let subject = '';
    const subMatch = rawTitle.match(/\\(([^)]+)\\)$/)
        || desc.match(/Subject:\\s*([^\\n\\r|]+)/i);
    if (subMatch) {
        subject = subMatch[1].trim();
    }

    // 5. Clean Title
    let cleanTitle = rawTitle
        .replace(/\\[PENDING APPROVAL[^\\]]*\\]/gi, '')
        .replace(/\\[Exam Alert[^\\]]*\\]/gi, '')
        .replace(/\\[Test Alert\\]/gi, '')
        .replace(/\\[Class\\s*[^\\]]+\\]/gi, '')
        .replace(/\\[State Syllabus\\]/gi, '')
        .replace(/\\[CBSE\\]/gi, '')
        .replace(/\\[Both\\]/gi, '')
        .replace(/\\[REJECTED[^\\]]*\\]/gi, '')
        .trim();
    if (subject && cleanTitle.endsWith('(' + subject + ')')) {
        cleanTitle = cleanTitle.slice(0, -(subject.length + 2)).trim();
    }

    // 6. Dates
    const examDateMatch = desc.match(/(?:Exam\\s*Date|ExamDate|Date)\\s*:\\s*([^\\n\\r|]+)/i);
    const examDateIso = examDateMatch ? toIso(examDateMatch[1].trim()) : '';

    const showFromMatch = desc.match(/(?:Show From|Start Date|Visible From)\\s*:\\s*([^\\n\\r|]+)/i);
    const showFromIso = showFromMatch ? toIso(showFromMatch[1].trim()) : '';

    const stopDateMatch = desc.match(/(?:Valid Until|Stop Date|Expiry Date|Expiry)\\s*:\\s*([^\\n\\r|]+)/i);
    const stopDateIso = stopDateMatch ? toIso(stopDateMatch[1].trim()) : (examDateIso || '');

    // 7. Times
    let startTime = '';
    let endTime = '';
    const timeMatch = desc.match(/(?:Time|Exam Time):\\s*([^\\n\\r|]+)/i);
    if (timeMatch) {
        const timeSlot = timeMatch[1].trim();
        const parts = timeSlot.split(/\\s*[-–]\\s*/);
        if (parts.length >= 1) startTime = parts[0].trim();
        if (parts.length >= 2) endTime = parts[1].trim();
    }

    // 8. Venue & Marks & Author & Syllabus
    const marksMatch = desc.match(/(?:Max|Total)\\s*Marks:\\s*([^\\n\\r|]+)/i);
    const maxMarks = marksMatch ? parseInt(marksMatch[1].trim(), 10) || 100 : 100;

    const venueMatch = desc.match(/(?:Venue|Room):\\s*([^\\n\\r|]+)/i);
    const venue = venueMatch ? venueMatch[1].trim() : 'Exam Hall 1';

    const authorMatch = desc.match(/(?:Submitted by|Faculty|Author|Teacher|By):\\s*([^\\n\\r|]+)/i);
    const author = authorMatch ? authorMatch[1].trim() : (item.author || 'Center Admin');

    const sylMatch = desc.match(/Syllabus:\\s*([^\\n\\r]+)/i);
    let syllabusText = sylMatch ? sylMatch[1].trim() : '';
    if (syllabusText === 'State Syllabus' || syllabusText === 'CBSE' || syllabusText === 'Both') {
        // If syllabus field only mirrored the stream name, preserve stream and let chapters be editable
        if (!sylStreamMatch) syllabusStream = syllabusText;
    }

    // 9. Clean Message
    const metaRegex = /(?:Exam\\s*Date|Subject|Max\\s*Marks|Venue|Syllabus|Show\\s*From|Valid\\s*Until|Time|Submitted\\s*by):[^\\n\\r]*/gi;
    let cleanMsg = desc.replace(metaRegex, '').replace(/\\|/g, '').trim();

    // Fill form
    document.getElementById('edit_ann_id').value = item.id;
    document.getElementById('edit_ann_type').value = type;

    // Target Class dropdown
    const classSelect = document.getElementById('edit_ann_class');
    if (classSelect) {
        let found = false;
        for (let i = 0; i < classSelect.options.length; i++) {
            if (classSelect.options[i].value.toLowerCase() === targetClass.toLowerCase()) {
                classSelect.selectedIndex = i;
                found = true;
                break;
            }
        }
        if (!found) {
            const opt = document.createElement('option');
            opt.value = targetClass;
            opt.textContent = targetClass;
            opt.selected = true;
            classSelect.appendChild(opt);
        }
    }

    document.getElementById('edit_ann_syllabus_stream').value = syllabusStream;
    document.getElementById('edit_ann_subject').value = subject;
    document.getElementById('edit_ann_title').value = cleanTitle || rawTitle;
    document.getElementById('edit_ann_msg').value = cleanMsg;

    document.getElementById('edit_ann_exam_date').value = examDateIso;
    document.getElementById('edit_ann_max_marks').value = maxMarks;
    document.getElementById('edit_ann_venue').value = venue;
    document.getElementById('edit_ann_author').value = author;
    document.getElementById('edit_ann_syllabus').value = syllabusText;

    document.getElementById('edit_ann_start_date').value = showFromIso;
    document.getElementById('edit_ann_end_date').value = stopDateIso;
    document.getElementById('edit_ann_start_time').value = startTime;
    document.getElementById('edit_ann_end_time').value = endTime;

    document.getElementById('edit_ann_time_label').value = item.time_label || 'Just now';
    document.getElementById('edit_ann_icon').value = item.icon || (type === 'exam' ? 'calendar' : 'megaphone');
    document.getElementById('edit_ann_important').checked = !!item.important;

    window.toggleEditAnnTypeFields();

    // Show modal using jQuery / Bootstrap or Vanilla fallback
    if (typeof $ !== 'undefined' && typeof $('#editAnnouncementModal').modal === 'function') {
        $('#editAnnouncementModal').modal('show');
    } else {
        const m = document.getElementById('editAnnouncementModal');
        if (m) {
            m.style.display = 'block';
            m.classList.add('show');
            document.body.classList.add('modal-open');
            let backdrop = document.getElementById('editAnnBackdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.id = 'editAnnBackdrop';
                backdrop.className = 'modal-backdrop fade show';
                document.body.appendChild(backdrop);
            }
        }
    }
};

window.closeEditAnnouncementModal = function () {
    if (typeof $ !== 'undefined' && typeof $('#editAnnouncementModal').modal === 'function') {
        $('#editAnnouncementModal').modal('hide');
    }
    const m = document.getElementById('editAnnouncementModal');
    if (m) {
        m.style.display = 'none';
        m.classList.remove('show');
    }
    document.body.classList.remove('modal-open');
    const backdrop = document.getElementById('editAnnBackdrop');
    if (backdrop) backdrop.remove();
};

window.handleSaveEditedAnnouncement = async function (e) {
    if (e) e.preventDefault();

    const id = document.getElementById('edit_ann_id').value;
    const type = document.getElementById('edit_ann_type').value;
    const targetClass = document.getElementById('edit_ann_class').value;
    const syllabusStream = document.getElementById('edit_ann_syllabus_stream').value;
    const subject = document.getElementById('edit_ann_subject').value.trim();
    const title = document.getElementById('edit_ann_title').value.trim();
    const message = document.getElementById('edit_ann_msg').value.trim();

    const examDate = document.getElementById('edit_ann_exam_date').value;
    const maxMarks = document.getElementById('edit_ann_max_marks').value || '100';
    const venue = document.getElementById('edit_ann_venue').value.trim() || 'Exam Hall 1';
    const author = document.getElementById('edit_ann_author').value.trim() || 'Center Admin';
    const syllabus = document.getElementById('edit_ann_syllabus').value.trim();

    const startDate = document.getElementById('edit_ann_start_date').value;
    const endDate = document.getElementById('edit_ann_end_date').value;
    const startTime = document.getElementById('edit_ann_start_time').value.trim();
    const endTime = document.getElementById('edit_ann_end_time').value.trim();

    const timeLabelInput = document.getElementById('edit_ann_time_label').value.trim();
    const iconInput = document.getElementById('edit_ann_icon').value;
    const isImportant = document.getElementById('edit_ann_important').checked;

    if (!id) {
        alert('Missing announcement ID. Please try again.');
        return;
    }
    if (!title) {
        alert('Please enter an Announcement / Alert Title.');
        return;
    }

    const saveBtn = document.getElementById('saveEditAnnBtn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving Changes...';
    }

    try {
        const sb = _getMasterHubSupabase();
        if (!sb) throw new Error('Supabase client not initialized. Please refresh.');

        // Format friendly exam date (e.g. Sat, Oct 10, 2026)
        let friendlyExamDate = examDate;
        if (examDate) {
            try {
                const parts = examDate.split('-');
                const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                friendlyExamDate = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            } catch (_) {}
        }

        // Construct combined time slot if both start & end exist
        let timeSlot = '';
        if (startTime && endTime) {
            timeSlot = startTime + ' - ' + endTime;
        } else if (startTime) {
            timeSlot = startTime;
        }

        // Build Title
        let fullTitle = '';
        if (type === 'exam') {
            const classPrefix = targetClass !== 'All' ? '[' + targetClass + ']' : '[All Classes]';
            const syllabusPrefix = syllabusStream && syllabusStream !== 'Both' ? '[' + syllabusStream + '] ' : '';
            const subjectSuffix = subject ? ' (' + subject + ')' : '';
            fullTitle = classPrefix + ' [Test Alert] ' + syllabusPrefix + title + subjectSuffix;
        } else {
            const classPrefix = targetClass !== 'All' ? '[' + targetClass + '] ' : '';
            const syllabusPrefix = syllabusStream && syllabusStream !== 'Both' ? '[' + syllabusStream + '] ' : '';
            fullTitle = classPrefix + syllabusPrefix + title;
        }

        // Build Description
        let fullDesc = '';
        if (type === 'exam') {
            const lines = [];
            if (friendlyExamDate) lines.push('Exam Date: ' + friendlyExamDate);
            if (subject) lines.push('Subject: ' + subject);
            lines.push('Max Marks: ' + maxMarks);
            if (venue) lines.push('Venue: ' + venue);
            const sylContent = syllabus || (syllabusStream !== 'Both' ? syllabusStream : 'Full Syllabus');
            lines.push('Syllabus: ' + sylContent);
            if (startDate) lines.push('Show From: ' + startDate);
            if (endDate) lines.push('Valid Until: ' + endDate);
            if (timeSlot) lines.push('Time: ' + timeSlot);
            if (message) lines.push(message);
            if (author) lines.push('Submitted by: ' + author);
            fullDesc = lines.join('\\n');
        } else {
            const lines = [];
            if (message) lines.push(message);
            if (startDate) lines.push('Show From: ' + startDate);
            if (endDate) lines.push('Valid Until: ' + endDate);
            if (timeSlot) lines.push('Time: ' + timeSlot);
            fullDesc = lines.join('\\n');
        }

        // Build Icons & Badge
        let icon = iconInput || 'megaphone';
        let iconBg = '#F8FAFC';
        let iconColor = '#475467';
        let timeLabel = timeLabelInput || 'Just now';

        if (type === 'exam') {
            icon = 'calendar';
            iconBg = '#EFF6FF';
            iconColor = '#1A56DB';
            if (!timeLabelInput && friendlyExamDate) {
                timeLabel = 'Exam: ' + friendlyExamDate;
            }
        } else if (type === 'urgent') {
            icon = 'megaphone';
            iconBg = '#FEF3F2';
            iconColor = '#F04438';
            if (!timeLabelInput) timeLabel = 'Urgent Alert';
        } else if (type === 'holiday') {
            icon = 'calendar';
            iconBg = '#ECFDF5';
            iconColor = '#10B981';
            if (!timeLabelInput) timeLabel = 'Notice';
        } else if (type === 'event') {
            icon = 'trophy';
            iconBg = '#EFF6FF';
            iconColor = '#3B82F6';
            if (!timeLabelInput) timeLabel = 'Event';
        }

        const updatePayload = {
            title: fullTitle,
            description: fullDesc,
            time_label: timeLabel,
            icon: icon,
            icon_bg: iconBg,
            icon_color: iconColor,
            important: isImportant,
            author: author
        };

        // 1. Update announcement in Supabase
        const { error: updateErr } = await sb.from('announcements').update(updatePayload).eq('id', id);
        if (updateErr) throw updateErr;

        // 2. If it's an Exam / Test alert, sync to timetable 'classes' table
        if (type === 'exam' && examDate) {
            try {
                const classTag = targetClass !== 'All' ? targetClass : 'Class 10';
                const subTag = subject || 'General';
                const examTimeStr = timeSlot || '11:30 AM - 12:00 PM';

                // Remove previous slot if matching
                await sb.from('classes')
                    .delete()
                    .eq('class_grade', classTag)
                    .eq('class_date', examDate)
                    .eq('subject', subTag);

                // Insert updated Test Paper slot
                await sb.from('classes').insert({
                    roll_no: classTag,
                    class_grade: classTag,
                    subject: subTag,
                    class_date: examDate,
                    time: examTimeStr + ' • Test Paper • ' + author,
                    status: 'upcoming:TP',
                    published: true
                });
            } catch (clsErr) {
                console.warn('[MasterHub] Error updating classes slot for edited test:', clsErr);
            }
        }

        // 3. Send Supabase Realtime broadcast
        try {
            await sb.channel('student_dashboard_realtime').send({
                type: 'broadcast',
                event: 'announcement_updated',
                payload: { id, title: fullTitle, updated_at: new Date().toISOString() }
            });
        } catch (be) {
            console.warn('[MasterHub] Realtime broadcast error:', be);
        }

        // Close modal
        window.closeEditAnnouncementModal();

        // Show confirmation message
        showBroadcastStatus('✅ Announcement "' + title + '" updated successfully! Changes immediately reflect across all student & faculty portals.');

        // Refresh feed
        await loadActiveBroadcasts();

        // Refresh live timetable if available
        if (typeof window.initLiveAppTimetable === 'function') {
            window.initLiveAppTimetable('hubTimetablePlatform');
            window.initLiveAppTimetable('liveTimetablePlatform');
        }
    } catch (err) {
        console.error('[MasterHub] Error updating announcement:', err);
        showBroadcastStatus('Failed to update announcement: ' + (err.message || err), true);
        alert('Failed to save announcement: ' + (err.message || err));
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save mr-1"></i> Save Changes';
        }
    }
};

// Global click delegation for Edit buttons
document.addEventListener('click', function (evt) {
    const editBtn = evt.target.closest('.btn-edit-ann');
    if (editBtn) {
        const annId = editBtn.getAttribute('data-id');
        if (annId) {
            window.openEditAnnouncementModal(annId, editBtn, evt);
        }
    }
});
`;

// Append modal controller functions before end of file or before closing
if (!jsContent.includes('window.openEditAnnouncementModal')) {
    jsContent += '\n' + editModalFunctions;
    console.log('✓ Added Edit Announcement modal controller functions to master_hub.js');
} else {
    console.log('openEditAnnouncementModal already in master_hub.js, updating implementation...');
    // Replace existing block if already present
    const startIdx = jsContent.indexOf('// ─── ACTIVE ANNOUNCEMENT & LIVE ALERT EDIT CONTROLLER ────────────────────────');
    if (startIdx !== -1) {
        jsContent = jsContent.substring(0, startIdx) + editModalFunctions;
    }
}

// 4. Update master_hub.html: Add modal markup before </body>
const modalMarkup = `
<!-- Edit Active Announcement & Live Alert Modal -->
<div class="modal fade" id="editAnnouncementModal" tabindex="-1" role="dialog" aria-labelledby="editAnnouncementModalLabel" aria-hidden="true" style="z-index: 1065;">
    <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 14px; overflow: hidden;">
            <div class="modal-header bg-primary text-white py-3">
                <div class="d-flex align-items-center">
                    <i class="fas fa-edit fa-lg mr-2"></i>
                    <div>
                        <h5 class="modal-title font-weight-bold mb-0" id="editAnnouncementModalLabel">Edit Active Announcement & Live Alert</h5>
                        <small class="text-white-50">Modify existing alert details and broadcast updates live to students and faculty</small>
                    </div>
                </div>
                <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close" onclick="window.closeEditAnnouncementModal()" style="opacity: 0.9; outline: none;">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <form id="editAnnouncementForm" onsubmit="window.handleSaveEditedAnnouncement(event)">
                <div class="modal-body p-4" style="max-height: 75vh; overflow-y: auto;">
                    <input type="hidden" id="edit_ann_id" />

                    <!-- Section 1: Classification & Target Scope -->
                    <div class="card p-3 mb-3 border-0" style="background: #f8fafc; border-radius: 10px; border-left: 4px solid #3b82f6 !important;">
                        <h6 class="font-weight-bold text-dark mb-2"><i class="fas fa-bullseye mr-1 text-primary"></i> Target Audience & Classification</h6>
                        <div class="row">
                            <div class="col-md-6 form-group">
                                <label class="font-weight-bold small text-secondary">Priority / Alert Type</label>
                                <select class="form-control" id="edit_ann_type" onchange="window.toggleEditAnnTypeFields()">
                                    <option value="exam">📅 Academic Exam / Test Alert</option>
                                    <option value="urgent">🚨 Urgent Alert</option>
                                    <option value="notice">📢 General Notice</option>
                                    <option value="holiday">🌴 Holiday / Reschedule</option>
                                    <option value="event">🏆 Event / Celebration</option>
                                </select>
                            </div>
                            <div class="col-md-6 form-group">
                                <label class="font-weight-bold small text-secondary">Target Class / Student Scope</label>
                                <select class="form-control" id="edit_ann_class">
                                    <option value="All">All Students & Teachers</option>
                                    <option value="Class 12">Class 12</option>
                                    <option value="Class 11">Class 11</option>
                                    <option value="Class 10">Class 10</option>
                                    <option value="Class 9">Class 9</option>
                                    <option value="Class 8">Class 8</option>
                                    <option value="Class 7">Class 7</option>
                                    <option value="Class 6">Class 6</option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 form-group mb-0">
                                <label class="font-weight-bold small text-secondary">Syllabus Stream Scope</label>
                                <select class="form-control" id="edit_ann_syllabus_stream">
                                    <option value="Both">Both (State Syllabus & CBSE)</option>
                                    <option value="State Syllabus">State Syllabus Only</option>
                                    <option value="CBSE">CBSE Only</option>
                                </select>
                            </div>
                            <div class="col-md-6 form-group mb-0">
                                <label class="font-weight-bold small text-secondary">Subject (Optional)</label>
                                <input type="text" class="form-control" id="edit_ann_subject" placeholder="e.g. Computer Science, Physics, Mathematics" />
                            </div>
                        </div>
                    </div>

                    <!-- Section 2: Alert Title & Content -->
                    <div class="form-group">
                        <label class="font-weight-bold small text-secondary">Alert Title <span class="text-danger">*</span></label>
                        <input type="text" class="form-control font-weight-bold" id="edit_ann_title" placeholder="e.g. Unit 6 Revision / Physics Test" required />
                    </div>

                    <div class="form-group" id="edit_ann_msg_group">
                        <label class="font-weight-bold small text-secondary">Message / Details Content</label>
                        <textarea class="form-control" id="edit_ann_msg" rows="3" placeholder="Enter full announcement details to be shown on student and faculty dashboards..."></textarea>
                    </div>

                    <!-- Section 3: Academic Exam Specific Details -->
                    <div id="edit_ann_exam_section" class="card p-3 mb-3 border-0" style="background: #fef2f2; border-radius: 10px; border-left: 4px solid #ef4444 !important;">
                        <h6 class="font-weight-bold text-danger mb-2"><i class="fas fa-file-signature mr-1"></i> Academic Test & Exam Information</h6>
                        <div class="row">
                            <div class="col-md-6 form-group">
                                <label class="font-weight-bold small text-dark">📅 Exam Date</label>
                                <input type="date" class="form-control" id="edit_ann_exam_date" />
                            </div>
                            <div class="col-md-6 form-group">
                                <label class="font-weight-bold small text-dark">🎯 Max Marks</label>
                                <input type="number" class="form-control" id="edit_ann_max_marks" placeholder="100" />
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 form-group">
                                <label class="font-weight-bold small text-dark">📍 Venue / Room</label>
                                <input type="text" class="form-control" id="edit_ann_venue" placeholder="e.g. Exam Hall 1, Room 204" />
                            </div>
                            <div class="col-md-6 form-group">
                                <label class="font-weight-bold small text-dark">👨‍🏫 Faculty / Submitted By</label>
                                <input type="text" class="form-control" id="edit_ann_author" placeholder="e.g. Faculty Member / Center Admin" />
                            </div>
                        </div>
                        <div class="form-group mb-0">
                            <label class="font-weight-bold small text-dark">📚 Prescribed Syllabus (Chapters / Portion)</label>
                            <textarea class="form-control" id="edit_ann_syllabus" rows="2" placeholder="e.g. Unit 6: Object Oriented Programming&#10;Unit 7: Data Structures"></textarea>
                        </div>
                    </div>

                    <!-- Section 4: Schedule, Timing & Visibility Dates -->
                    <div class="card p-3 mb-3 border-0 shadow-sm" style="background: #eff6ff; border-radius: 10px; border-left: 4px solid #2563eb !important;">
                        <h6 class="font-weight-bold text-primary mb-2">
                            <i class="fas fa-calendar-alt mr-1"></i> Schedule & Alert Visibility Dates
                        </h6>
                        <div class="row">
                            <div class="col-md-6 form-group">
                                <label class="font-weight-bold small text-dark">Show From Date (Start Date)</label>
                                <input type="date" class="form-control" id="edit_ann_start_date" />
                                <small class="text-muted">Alert appears on student devices from this date onwards.</small>
                            </div>
                            <div class="col-md-6 form-group">
                                <label class="font-weight-bold small text-dark">Valid Until Date (End Date / Expiry)</label>
                                <input type="date" class="form-control" id="edit_ann_end_date" />
                                <small class="text-muted">Alert automatically disappears after this date passes.</small>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 form-group mb-0">
                                <label class="font-weight-bold small text-dark">⏰ Start Time</label>
                                <input type="text" class="form-control" id="edit_ann_start_time" placeholder="e.g. 11:30 AM" />
                            </div>
                            <div class="col-md-6 form-group mb-0">
                                <label class="font-weight-bold small text-dark">⏰ End Time</label>
                                <input type="text" class="form-control" id="edit_ann_end_time" placeholder="e.g. 1:00 PM" />
                            </div>
                        </div>
                    </div>

                    <!-- Section 5: Display Settings -->
                    <div class="row">
                        <div class="col-md-6 form-group">
                            <label class="font-weight-bold small text-secondary">Display Badge / Time Label</label>
                            <input type="text" class="form-control" id="edit_ann_time_label" placeholder="e.g. Just now, Exam: Sat, Oct 10, 2026" />
                        </div>
                        <div class="col-md-6 form-group">
                            <label class="font-weight-bold small text-secondary">Display Icon</label>
                            <select class="form-control" id="edit_ann_icon">
                                <option value="calendar">📅 Calendar (Exam / Date)</option>
                                <option value="megaphone">📢 Megaphone (Notice / Broadcast)</option>
                                <option value="trophy">🏆 Trophy (Event / Award)</option>
                                <option value="bell">🔔 Bell (Alert)</option>
                            </select>
                        </div>
                    </div>

                    <div class="custom-control custom-switch mt-2">
                        <input type="checkbox" class="custom-control-input" id="edit_ann_important">
                        <label class="custom-control-label font-weight-bold text-dark" for="edit_ann_important">
                            Mark as High Priority / Highlighted Alert Banner
                        </label>
                        <small class="d-block text-muted">Pins this announcement at the top of the mobile home screen.</small>
                    </div>
                </div>
                <div class="modal-footer bg-light px-4 py-3 d-flex justify-content-between">
                    <button type="button" class="btn btn-secondary px-3" data-dismiss="modal" onclick="window.closeEditAnnouncementModal()">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-primary font-weight-bold px-4 shadow-sm" id="saveEditAnnBtn">
                        <i class="fas fa-save mr-1"></i> Save Changes
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
`;

if (!htmlContent.includes('id="editAnnouncementModal"')) {
    htmlContent = htmlContent.replace('</body>', modalMarkup + '\n</body>');
    console.log('✓ Added #editAnnouncementModal markup to master_hub.html');
} else {
    console.log('#editAnnouncementModal already in master_hub.html, refreshing markup...');
    htmlContent = htmlContent.replace(/<!-- Edit Active Announcement & Live Alert Modal -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/, modalMarkup.trim());
}

// Write updated files
fs.writeFileSync(masterHubJsPath, jsContent, 'utf8');
fs.writeFileSync(masterHubHtmlPath, htmlContent, 'utf8');

console.log('✓ Successfully written updated files to disk.');
