const fs = require('fs');
const path = require('path');

const adminDir = 'C:\\Users\\madhu\\code_test\\private';
const timetableHtmlPath = path.join(adminDir, 'timetable.html');
const adminJsPath = path.join(adminDir, 'js', 'admin.js');

console.log('--- Updating Admin Timetable with Faculty Allotment ---');

// 1. Update timetable.html
if (fs.existsSync(timetableHtmlPath)) {
    let html = fs.readFileSync(timetableHtmlPath, 'utf8');

    // Add Teacher Selection dropdown if not already present
    if (!html.includes('id="timetableFaculty"')) {
        const facultyField = `
                    <!-- Teacher / Faculty Allotment -->
                    <div class="form-group">
                        <label><i class="fas fa-chalkboard-teacher text-primary mr-1"></i> Allot Faculty / Teacher</label>
                        <select class="form-control font-weight-bold" id="timetableFaculty" style="border: 2px solid #0284C7; color: #0284C7;">
                            <option value="auto">✨ Auto-Allot by Subject & Grade</option>
                            <option value="fac-chem" data-name="Dr. Ramesh Nair">Dr. Ramesh Nair (Chemistry • Class 10-12)</option>
                            <option value="fac-bio-lower" data-name="Mrs. Deepa Anoop">Mrs. Deepa Anoop (Biology Lower • Class 6-9)</option>
                            <option value="fac-bio-upper" data-name="Dr. Suresh Kumar">Dr. Suresh Kumar (Biology Upper • Class 10-12)</option>
                            <option value="fac-phy" data-name="Mr. Rajesh Menon">Mr. Rajesh Menon (Physics • Class 8-12)</option>
                            <option value="fac-cs" data-name="Ms. Ananya Sharma">Ms. Ananya Sharma (Computer Science • Class 11-12)</option>
                            <option value="fac-math" data-name="Mr. Arun K. Varma">Mr. Arun K. Varma (Maths • Class 6-9 Temp)</option>
                        </select>
                        <small class="form-text text-muted" id="facultyHint">Select specific faculty or leave auto-allot.</small>
                    </div>`;

        // Insert after Subject group
        if (html.includes('id="timetableSubject"')) {
            html = html.replace(/(<\/div>\s*<!-- Session Type -->)/, `${facultyField}\n\n                    $1`);
            console.log('✓ Added timetableFaculty select box to timetable.html');
        }
    }

    // Add Faculty Allotted column to Table Header if not present
    if (!html.includes('<th>Faculty Allotted</th>')) {
        html = html.replace(
            /<th>Subject<\/th>(\s*)<th>Type<\/th>/,
            '<th>Subject</th>$1<th>Faculty Allotted</th>$1<th>Type</th>'
        );
        html = html.replace(
            /<td colspan="7" class="text-center">No entries added yet\.<\/td>/,
            '<td colspan="8" class="text-center">No entries added yet.</td>'
        );
        console.log('✓ Added Faculty Allotted column to table in timetable.html');
    }

    fs.writeFileSync(timetableHtmlPath, html, 'utf8');
} else {
    console.warn('timetable.html not found at:', timetableHtmlPath);
}

// 2. Update admin.js to handle faculty allotment
if (fs.existsSync(adminJsPath)) {
    let js = fs.readFileSync(adminJsPath, 'utf8');

    // Update renderTimetable to display Faculty column
    if (!js.includes('entry.facultyName ?')) {
        const marker = '<td>${getSubjectWithEmoji(entry.subject)}${locStr}</td>';
        const replacement = '<td>${getSubjectWithEmoji(entry.subject)}${locStr}</td>\r\n                <td>${entry.facultyName ? `<span class="badge badge-info px-2 py-1"><i class="fas fa-user-tie mr-1"></i>${entry.facultyName}</span>` : `<span class="badge badge-light border text-muted">Auto-Allot</span>`}</td>';
        if (js.includes(marker)) {
            js = js.replace(marker, replacement);
            console.log('✓ Updated renderTimetable to show faculty column');
        }
    }

    // Auto-update faculty selector when Class or Subject changes
    if (!js.includes('function autoUpdateFacultySelection()')) {
        const autoAllotScript = `
    // Auto-suggest faculty when Subject or Class changes in Timetable
    function autoUpdateFacultySelection() {
        const classEl = document.getElementById('timetableClass');
        const subjectEl = document.getElementById('timetableSubject');
        const facultyEl = document.getElementById('timetableFaculty');
        if (!classEl || !subjectEl || !facultyEl) return;

        const numClass = parseInt(classEl.value, 10) || 10;
        const sub = (subjectEl.value || '').toLowerCase();

        if (sub.includes('chem')) {
            facultyEl.value = 'fac-chem';
        } else if (sub.includes('bio')) {
            facultyEl.value = numClass <= 9 ? 'fac-bio-lower' : 'fac-bio-upper';
        } else if (sub.includes('phys')) {
            facultyEl.value = 'fac-phy';
        } else if (sub.includes('comp')) {
            facultyEl.value = 'fac-cs';
        } else if (sub.includes('math')) {
            facultyEl.value = 'fac-math';
        }
    }

    const classInput = document.getElementById('timetableClass');
    const subjectInput = document.getElementById('timetableSubject');
    if (classInput) classInput.addEventListener('change', autoUpdateFacultySelection);
    if (subjectInput) subjectInput.addEventListener('change', autoUpdateFacultySelection);
`;
        const insertPoint = "document.getElementById('addTimetableEntryBtn')";
        if (js.includes(insertPoint)) {
            js = js.replace(insertPoint, `${autoAllotScript}\n    ${insertPoint}`);
            console.log('✓ Added autoUpdateFacultySelection listeners');
        }
    }

    fs.writeFileSync(adminJsPath, js, 'utf8');
}

console.log('--- Admin timetable allotment script finished ---');
