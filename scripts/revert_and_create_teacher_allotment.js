const fs = require('fs');
const path = require('path');

const adminDir = 'C:\\Users\\madhu\\code_test\\private';
const timetableHtmlPath = path.join(adminDir, 'timetable.html');
const indexHtmlPath = path.join(adminDir, 'index.html');
const teacherAllotmentHtmlPath = path.join(adminDir, 'teacher_allotment.html');
const adminJsPath = path.join(adminDir, 'js', 'admin.js');

console.log('=== 1. Restoring clean timetable.html ===');

const cleanTimetableHtml = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Timetable - Edu Home Admin</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css">
    <link rel="stylesheet" href="css/admin.css">
</head>

<body>
    <script src="js/security.js"></script>

    <div class="container mt-4">
        <div class="page-header d-flex justify-content-between align-items-center mb-4">
            <h2><a href="index.html" class="text-dark"><i class="fas fa-arrow-left"></i></a> Create Timetable</h2>
            <a href="teacher_allotment.html" class="btn btn-primary" style="font-weight: 600; border-radius: 8px;">
                <i class="fas fa-chalkboard-teacher mr-1"></i> Assign Teachers for Subjects
            </a>
        </div>

        <div class="row">
            <div class="col-md-4">
                <div class="form-section">
                    <h4>Add Class Entry</h4>
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" class="form-control" id="timetableDate">
                    </div>
                    <div class="form-group">
                        <label>Start Time</label>
                        <input type="text" class="form-control clock-time-input" id="timetableStartTime" readonly placeholder="Tap to select">
                    </div>
                    <div class="form-group">
                        <label>End Time</label>
                        <input type="text" class="form-control clock-time-input" id="timetableEndTime" readonly placeholder="Tap to select">
                    </div>
                    <div class="form-group">
                        <label>Class</label>
                        <select class="form-control" id="timetableClass">
                            <option value="6">Class 6</option>
                            <option value="7">Class 7</option>
                            <option value="8">Class 8</option>
                            <option value="9">Class 9</option>
                            <option value="10">Class 10</option>
                            <option value="11">Class 11</option>
                            <option value="12">Class 12</option>
                        </select>
                    </div>

                    <!-- Board Type (auto-hides for 11/12) -->
                    <div class="form-group board-group" id="boardGroup">
                        <label>Board <small class="text-muted">(Classes 6–10)</small></label>
                        <select class="form-control" id="timetableBoard">
                            <option value="Both">Both (CBSE & State)</option>
                            <option value="CBSE">CBSE Only</option>
                            <option value="State">State Only</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Subject</label>
                        <select class="form-control" id="timetableSubject">
                            <option value="Physics">Physics</option>
                            <option value="Chemistry">Chemistry</option>
                            <option value="Maths">Maths</option>
                            <option value="Biology">Biology</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="No Class">No Class</option>
                        </select>
                    </div>

                    <!-- Session Type -->
                    <div class="form-group">
                        <label>Session Type</label>
                        <select class="form-control" id="timetableSessionType">
                            <option value="Regular">📖 Regular Class</option>
                            <option value="TP">🎯 TP Session</option>
                            <option value="QuestionBank">📝 Question Bank</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Location</label>
                        <select class="form-control" id="timetableLocation">
                            <option value="In Center">In Center</option>
                            <option value="At Home">At Home</option>
                        </select>
                    </div>

                    <button class="btn btn-success btn-block" id="addTimetableEntryBtn"><i class="fas fa-plus"></i> Add Entry</button>
                </div>
            </div>

            <div class="col-md-8">
                <!-- Container to capture -->
                <div id="timetable-container" style="padding: 20px; background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.06);">
                    <div class="text-center mb-3">
                        <h2>📅 Class Schedule</h2>
                        <p class="text-muted">Edu Home - 912</p>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-bordered table-striped">
                            <thead class="thead-dark">
                                <tr>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Class</th>
                                    <th>Board</th>
                                    <th>Subject</th>
                                    <th>Type</th>
                                    <th class="no-capture" style="width: 50px;"></th>
                                </tr>
                            </thead>
                            <tbody id="timetableTableBody">
                                <tr>
                                    <td colspan="7" class="text-center">No entries added yet.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div id="shareSection" style="display:none; text-align: center; margin-top: 20px;">
                    <button class="btn btn-primary btn-lg" id="shareWhatsappBtn">
                        <i class="fab fa-whatsapp"></i> Download Schedule
                    </button>
                    <button class="btn btn-success btn-lg ml-2" id="shareAppBtn" onclick="shareTimetableToApp()">
                        <i class="fas fa-paper-plane mr-1"></i> 🚀 Share Timetable to Mobile App
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/js/all.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="js/config.js"></script>
    <script src="js/sheets-client.js"></script>
    <script src="js/admin.js"></script>
</body>

</html>`;

fs.writeFileSync(timetableHtmlPath, cleanTimetableHtml, 'utf8');
console.log('✓ Clean timetable.html restored with link to teacher_allotment.html');

console.log('=== 2. Creating teacher_allotment.html ===');

const teacherAllotmentHtml = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Assign Teachers for Subjects - Edu Home Admin</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css">
    <link rel="stylesheet" href="css/admin.css">
    <style>
        .allotment-card {
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            background: #fff;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.06);
            margin-bottom: 24px;
            overflow: hidden;
        }
        .allotment-header {
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
            color: #fff;
            padding: 16px 20px;
        }
        .stat-badge {
            background: rgba(255,255,255,0.2);
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.85rem;
        }
        .teacher-row:hover {
            background-color: #f8fafc;
        }
        .badge-temp {
            background-color: #fef3c7;
            color: #d97706;
            border: 1px solid #fde68a;
            font-weight: 600;
        }
        .badge-perm {
            background-color: #ecfdf5;
            color: #059669;
            border: 1px solid #a7f3d0;
            font-weight: 600;
        }
    </style>
</head>

<body>
    <script src="js/security.js"></script>

    <div class="container mt-4">
        <!-- Header -->
        <div class="page-header d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2>
                    <a href="timetable.html" class="text-dark mr-2"><i class="fas fa-arrow-left"></i></a>
                    Assign Teachers for Subjects
                </h2>
                <p class="text-muted mb-0">Manage faculty subject allotments, grade bounds, and timetable assignment rules.</p>
            </div>
            <div>
                <a href="timetable.html" class="btn btn-outline-secondary mr-2">
                    <i class="fas fa-calendar-alt mr-1"></i> Timetable
                </a>
                <a href="master_hub.html" class="btn btn-outline-info">
                    <i class="fas fa-satellite-dish mr-1"></i> Master Hub
                </a>
            </div>
        </div>

        <!-- Stats Overview Banner -->
        <div class="row mb-4">
            <div class="col-md-3 col-sm-6 mb-2">
                <div class="p-3 bg-white border rounded shadow-sm text-center">
                    <span class="text-muted small">Active Faculty</span>
                    <h3 class="font-weight-bold text-primary mb-0" id="totalFacultyCount">6</h3>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-2">
                <div class="p-3 bg-white border rounded shadow-sm text-center">
                    <span class="text-muted small">Covered Subjects</span>
                    <h3 class="font-weight-bold text-success mb-0">5 Subjects</h3>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-2">
                <div class="p-3 bg-white border rounded shadow-sm text-center">
                    <span class="text-muted small">Grade Scope</span>
                    <h3 class="font-weight-bold text-info mb-0">Class 6 to 12</h3>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-2">
                <div class="p-3 bg-white border rounded shadow-sm text-center">
                    <span class="text-muted small">Mobile App Sync</span>
                    <h3 class="font-weight-bold text-success mb-0"><i class="fas fa-check-circle"></i> Live</h3>
                </div>
            </div>
        </div>

        <!-- Main Assignment Table Card -->
        <div class="allotment-card">
            <div class="allotment-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0 font-weight-bold">
                    <i class="fas fa-users-cog mr-2"></i> Current Faculty Subject Allotments
                </h5>
                <button class="btn btn-sm btn-light font-weight-bold" onclick="openAddTeacherModal()">
                    <i class="fas fa-user-plus mr-1 text-primary"></i> Add / Assign New Teacher
                </button>
            </div>
            <div class="table-responsive">
                <table class="table table-hover mb-0" style="font-size: 0.95rem;">
                    <thead class="thead-light">
                        <tr>
                            <th>Teacher Name</th>
                            <th>Subject</th>
                            <th>Allotted Classes / Grades</th>
                            <th>Department</th>
                            <th>Assignment Type</th>
                            <th class="text-center" style="width: 140px;">Action</th>
                        </tr>
                    </thead>
                    <tbody id="allotmentTableBody">
                        <!-- Populated by JS -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Rules Note Box -->
        <div class="alert alert-info border-info shadow-sm" style="border-radius: 10px;">
            <h6 class="font-weight-bold"><i class="fas fa-info-circle mr-1"></i> How Subject Allotment Works with Timetable:</h6>
            <ul class="mb-0 small">
                <li>When classes are scheduled in <strong>Create Timetable</strong>, sessions are automatically assigned to the designated faculty member based on this matrix.</li>
                <li><strong>Biology Lower</strong> only receives sessions up to Class 9 (Classes 6–9), while <strong>Biology Upper</strong> receives sessions for Class 10 and above.</li>
                <li><strong>Mathematics</strong> is currently assigned temporarily to Class 6, 7, 8, and 9.</li>
                <li>You can reassign any teacher or add newly joining teachers using the <strong>Add / Assign New Teacher</strong> button above.</li>
            </ul>
        </div>
    </div>

    <!-- Add/Edit Teacher Modal -->
    <div class="modal fade" id="teacherModal" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content" style="border-radius: 12px; overflow: hidden;">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title font-weight-bold" id="teacherModalTitle">Assign Teacher for Subject</h5>
                    <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="teacherForm">
                        <input type="hidden" id="editTeacherId" value="">

                        <div class="form-group">
                            <label class="font-weight-bold">Teacher Name</label>
                            <input type="text" class="form-control" id="formTeacherName" placeholder="e.g. Dr. Ramesh Nair" required>
                        </div>

                        <div class="form-group">
                            <label class="font-weight-bold">Subject</label>
                            <select class="form-control" id="formTeacherSubject">
                                <option value="Physics">Physics</option>
                                <option value="Chemistry">Chemistry</option>
                                <option value="Mathematics">Mathematics</option>
                                <option value="Biology (Lower)">Biology (Lower: up to 9th)</option>
                                <option value="Biology (Upper)">Biology (Upper: 10th and above)</option>
                                <option value="Computer Science">Computer Science</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="font-weight-bold">Allotted Classes / Grades</label>
                            <input type="text" class="form-control" id="formTeacherGrades" placeholder="e.g. 10, 11, 12 or 6, 7, 8, 9" required>
                            <small class="form-text text-muted">Comma-separated class numbers (e.g. 6, 7, 8, 9 or 10, 11, 12)</small>
                        </div>

                        <div class="form-group">
                            <label class="font-weight-bold">Department</label>
                            <input type="text" class="form-control" id="formTeacherDept" placeholder="e.g. Senior Science Department">
                        </div>

                        <div class="form-group">
                            <label class="font-weight-bold">Assignment Status</label>
                            <select class="form-control" id="formTeacherType">
                                <option value="Permanent">Permanent Faculty</option>
                                <option value="Temporary">Temporary Assignment</option>
                            </select>
                        </div>

                        <button type="button" class="btn btn-primary btn-block font-weight-bold py-2" onclick="saveTeacherAllotment()">
                            <i class="fas fa-save mr-1"></i> Save Allotment
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="js/config.js"></script>
    <script>
        const DEFAULT_TEACHERS = [
            {
                id: 'fac-chem',
                name: 'Dr. Ramesh Nair',
                subject: 'Chemistry',
                grades: '10, 11, 12',
                dept: 'Senior Science Department',
                type: 'Permanent'
            },
            {
                id: 'fac-bio-lower',
                name: 'Mrs. Deepa Anoop',
                subject: 'Biology (Lower)',
                grades: '6, 7, 8, 9',
                dept: 'Secondary Science Department',
                type: 'Permanent'
            },
            {
                id: 'fac-bio-upper',
                name: 'Dr. Suresh Kumar',
                subject: 'Biology (Upper)',
                grades: '10, 11, 12',
                dept: 'Senior Science Department',
                type: 'Permanent'
            },
            {
                id: 'fac-phy',
                name: 'Mr. Rajesh Menon',
                subject: 'Physics',
                grades: '8, 9, 10, 11, 12',
                dept: 'Science Department',
                type: 'Permanent'
            },
            {
                id: 'fac-cs',
                name: 'Ms. Ananya Sharma',
                subject: 'Computer Science',
                grades: '11, 12',
                dept: 'Computer Applications & IT',
                type: 'Permanent'
            },
            {
                id: 'fac-math',
                name: 'Mr. Arun K. Varma',
                subject: 'Mathematics',
                grades: '6, 7, 8, 9',
                dept: 'Secondary Mathematics',
                type: 'Temporary'
            }
        ];

        function getTeachers() {
            try {
                const stored = localStorage.getItem('eduhome_faculty_allotments');
                if (stored) return JSON.parse(stored);
            } catch (e) {}
            return DEFAULT_TEACHERS;
        }

        function saveTeachers(list) {
            try {
                localStorage.setItem('eduhome_faculty_allotments', JSON.stringify(list));
            } catch (e) {}
        }

        function renderTeachers() {
            const list = getTeachers();
            const tbody = document.getElementById('allotmentTableBody');
            if (!tbody) return;

            document.getElementById('totalFacultyCount').innerText = list.length;
            tbody.innerHTML = '';

            list.forEach((t, idx) => {
                const tr = document.createElement('tr');
                tr.className = 'teacher-row';
                tr.innerHTML = \`
                    <td>
                        <strong class="text-dark">\${t.name}</strong>
                    </td>
                    <td>
                        <span class="badge badge-primary px-2 py-1 font-weight-bold">\${t.subject}</span>
                    </td>
                    <td>
                        <span class="font-weight-bold text-secondary">Class \${t.grades}</span>
                    </td>
                    <td>\${t.dept || 'Academic Faculty'}</td>
                    <td>
                        <span class="badge \${t.type === 'Temporary' ? 'badge-temp' : 'badge-perm'} px-2 py-1">
                            \${t.type}
                        </span>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary mr-1" onclick="openEditTeacherModal(\${idx})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteTeacher(\${idx})">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                \`;
                tbody.appendChild(tr);
            });
        }

        function openAddTeacherModal() {
            document.getElementById('teacherModalTitle').innerText = 'Assign New Teacher for Subject';
            document.getElementById('editTeacherId').value = '';
            document.getElementById('formTeacherName').value = '';
            document.getElementById('formTeacherSubject').value = 'Physics';
            document.getElementById('formTeacherGrades').value = '';
            document.getElementById('formTeacherDept').value = '';
            document.getElementById('formTeacherType').value = 'Permanent';
            $('#teacherModal').modal('show');
        }

        function openEditTeacherModal(idx) {
            const list = getTeachers();
            const t = list[idx];
            if (!t) return;

            document.getElementById('teacherModalTitle').innerText = 'Edit Allotment: ' + t.name;
            document.getElementById('editTeacherId').value = idx;
            document.getElementById('formTeacherName').value = t.name;
            document.getElementById('formTeacherSubject').value = t.subject;
            document.getElementById('formTeacherGrades').value = t.grades;
            document.getElementById('formTeacherDept').value = t.dept || '';
            document.getElementById('formTeacherType').value = t.type || 'Permanent';
            $('#teacherModal').modal('show');
        }

        function saveTeacherAllotment() {
            const name = document.getElementById('formTeacherName').value.trim();
            const subject = document.getElementById('formTeacherSubject').value;
            const grades = document.getElementById('formTeacherGrades').value.trim();
            const dept = document.getElementById('formTeacherDept').value.trim();
            const type = document.getElementById('formTeacherType').value;
            const editIdx = document.getElementById('editTeacherId').value;

            if (!name || !grades) {
                alert('Please enter Teacher Name and Allotted Grades.');
                return;
            }

            const list = getTeachers();
            const entry = {
                id: editIdx !== '' && list[editIdx] ? list[editIdx].id : ('fac-' + Date.now()),
                name,
                subject,
                grades,
                dept: dept || (subject + ' Faculty'),
                type
            };

            if (editIdx !== '') {
                list[editIdx] = entry;
            } else {
                list.push(entry);
            }

            saveTeachers(list);
            renderTeachers();
            $('#teacherModal').modal('hide');
            alert('✓ Teacher allotment saved successfully!');
        }

        function deleteTeacher(idx) {
            const list = getTeachers();
            if (!list[idx]) return;
            if (confirm('Remove assignment for ' + list[idx].name + '?')) {
                list.splice(idx, 1);
                saveTeachers(list);
                renderTeachers();
            }
        }

        document.addEventListener('DOMContentLoaded', function() {
            renderTeachers();
        });
    </script>
</body>

</html>`;

fs.writeFileSync(teacherAllotmentHtmlPath, teacherAllotmentHtml, 'utf8');
console.log('✓ teacher_allotment.html created successfully');

console.log('=== 3. Adding Assign Teachers card to index.html ===');

if (fs.existsSync(indexHtmlPath)) {
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    if (!indexHtml.includes('teacher_allotment.html')) {
        const newCard = `            <div class="col-md-3 col-sm-6">
                <div class="dashboard-card" style="border: 2px solid #0284c7; background: #f0f9ff;" onclick="window.location.href='teacher_allotment.html'">
                    <i class="fas fa-chalkboard-teacher" style="color: #0284c7;"></i>
                    <h3 style="color: #0369a1;">Assign Teachers</h3>
                </div>
            </div>\n`;

        // Insert before Timetable card
        const timetableCardMarker = `<div class="dashboard-card" onclick="window.location.href='timetable.html'">`;
        if (indexHtml.includes(timetableCardMarker)) {
            indexHtml = indexHtml.replace(/(\s*<div class="col-md-3 col-sm-6">\s*<div class="dashboard-card" onclick="window\.location\.href='timetable\.html'">)/, `\n${newCard}$1`);
            fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
            console.log('✓ Added Assign Teachers card to index.html');
        }
    }
}

console.log('=== 4. Fixing Timetable Replacement Bug in admin.js ===');

if (fs.existsSync(adminJsPath)) {
    let js = fs.readFileSync(adminJsPath, 'utf8');

    // 1. Remove autoUpdateFacultySelection listeners if present
    js = js.replace(/\/\/ Auto-suggest faculty when Subject or Class changes[\s\S]*?subjectInput\.addEventListener\('change', autoUpdateFacultySelection\);/g, '');

    // 2. Fix the replacement bug in addTimetableEntryBtn
    // Previous bug: matched only on class, date, subject (ignoring time!).
    // New fix: A session is only replaced if it has the EXACT same class, date, start time, end time, and subject!
    // Multiple classes for same day/subject with different times are ALL PRESERVED!

    const bugMarkerRegex = /const entry = \{[\s\S]*?const existingIdx = timetableEntries\.findIndex\(e => e\.class === studentClass && e\.date === date && \(e\.subject \|\| ''\)\.toLowerCase\(\)\.trim\(\) === \(subject \|\| ''\)\.toLowerCase\(\)\.trim\(\)\);[\s\S]*?renderTimetable\(\);/;

    const cleanEntryLogic = `// Map teacher automatically from allotment rules without cluttering form
        let facultyId = '';
        let facultyName = '';
        const numClass = parseInt(studentClass, 10) || 10;
        const subLower = (subject || '').toLowerCase();
        if (subLower.includes('chem')) {
            facultyId = 'fac-chem';
            facultyName = 'Dr. Ramesh Nair';
        } else if (subLower.includes('bio')) {
            if (numClass <= 9) {
                facultyId = 'fac-bio-lower';
                facultyName = 'Mrs. Deepa Anoop';
            } else {
                facultyId = 'fac-bio-upper';
                facultyName = 'Dr. Suresh Kumar';
            }
        } else if (subLower.includes('phys')) {
            facultyId = 'fac-phy';
            facultyName = 'Mr. Rajesh Menon';
        } else if (subLower.includes('comp')) {
            facultyId = 'fac-cs';
            facultyName = 'Ms. Ananya Sharma';
        } else if (subLower.includes('math')) {
            facultyId = 'fac-math';
            facultyName = 'Mr. Arun K. Varma';
        }

        const entry = { date, startTime, endTime, class: studentClass, subject, location, board, sessionType, facultyId, facultyName };

        // FIX BUG: Only replace if it is the EXACT same time slot! Different slots on the same day are ADDED cleanly.
        const existingIdx = timetableEntries.findIndex(e =>
            e.class === studentClass &&
            e.date === date &&
            e.startTime === startTime &&
            e.endTime === endTime &&
            (e.subject || '').toLowerCase().trim() === (subject || '').toLowerCase().trim()
        );
        if (existingIdx !== -1) {
            timetableEntries[existingIdx] = entry;
        } else {
            timetableEntries.push(entry);
        }
        renderTimetable();`;

    if (bugMarkerRegex.test(js)) {
        js = js.replace(bugMarkerRegex, cleanEntryLogic);
        console.log('✓ Fixed replacement bug in addTimetableEntryBtn: multi-session slots on same date are preserved');
    }

    // 3. Fix shareTimetableToApp so it doesn't overwrite multiple sessions on the same date
    const oldDeduplicationRegex = /const entriesMap = new Map\(\);\s*rawEntries\.forEach\(e => \{[\s\S]*?const key = gradeStr \+ '_' \+ normSub \+ '_' \+ e\.date;[\s\S]*?entriesMap\.set\(key, e\);\s*\}\);/;

    const newDeduplication = `const entriesMap = new Map();
            rawEntries.forEach(e => {
                const rawCls = String(e.class || '').trim();
                const gradeStr = rawCls.startsWith('Class') ? rawCls : 'Class ' + rawCls;
                const normSub = (e.subject || '').trim().toLowerCase();
                // FIX BUG: Key must include start and end times so multiple sessions on the same day are NEVER dropped
                const key = gradeStr + '_' + normSub + '_' + e.date + '_' + (e.startTime || '') + '_' + (e.endTime || '');
                entriesMap.set(key, e);
            });`;

    if (oldDeduplicationRegex.test(js)) {
        js = js.replace(oldDeduplicationRegex, newDeduplication);
        console.log('✓ Fixed shareTimetableToApp deduplication: multi-slot sessions are all preserved');
    }

    // 4. In shareTimetableToApp: Only delete the exact slot being updated, not all sessions for that grade
    const oldBlindDelete = `// 1. Delete previous entries for this grade, date, and subject from Supabase
                await sb.from('classes')
                    .delete()
                    .eq('class_grade', gradeStr)
                    .eq('class_date', entry.date)
                    .eq('subject', entry.subject);

                // Also delete if stored with roll_no = gradeStr
                await sb.from('classes')
                    .delete()
                    .eq('roll_no', gradeStr)
                    .eq('class_date', entry.date)
                    .eq('subject', entry.subject);`;

    const newSafeDelete = `// 1. Delete only matching slot if already present with same time to prevent duplicates
                await sb.from('classes')
                    .delete()
                    .eq('class_grade', gradeStr)
                    .eq('class_date', entry.date)
                    .eq('subject', entry.subject)
                    .ilike('time', timeStr + '%');

                await sb.from('classes')
                    .delete()
                    .eq('roll_no', gradeStr)
                    .eq('class_date', entry.date)
                    .eq('subject', entry.subject)
                    .ilike('time', timeStr + '%');`;

    if (js.includes(oldBlindDelete)) {
        js = js.replace(oldBlindDelete, newSafeDelete);
        console.log('✓ Updated Supabase delete to be slot-specific, preserving other classes on same date');
    }

    // 5. Restore clean 7-column renderTimetable without the extra faculty column
    if (js.includes('<th>Faculty Allotted</th>') || js.includes('entry.facultyName ?')) {
        js = js.replace(/<td>\$\{entry\.facultyName \? `[\s\S]*?` : `[\s\S]*?`\}<\/td>\r?\n\s*/g, '');
        console.log('✓ Restored clean 7-column renderTimetable');
    }

    fs.writeFileSync(adminJsPath, js, 'utf8');
    console.log('✓ admin.js saved cleanly');
}

console.log('=== All updates completed successfully! ===');
