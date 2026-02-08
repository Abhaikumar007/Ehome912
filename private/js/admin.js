
// Helper to get students from LocalStorage
function getStudents() {
    return JSON.parse(localStorage.getItem('students')) || [];
}

// Helper to save students
function saveStudents(students) {
    localStorage.setItem('students', JSON.stringify(students));
}

// Helper to get fee records
function getFees() {
    return JSON.parse(localStorage.getItem('fees')) || {}; // Structure: { studentId_Month_Year: 'Paid' }
}

function saveFees(fees) {
    localStorage.setItem('fees', JSON.stringify(fees));
}


// --- ADD STUDENT PAGE ---
if (document.getElementById('addStudentForm')) {
    document.getElementById('addStudentForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const studentClass = document.getElementById('class').value;
        const school = document.getElementById('school').value;
        const phone = document.getElementById('phone').value;

        const joiningDate = document.getElementById('joiningDate').value;

        // Get selected subjects
        const subjects = [];
        document.querySelectorAll('input[name="subject"]:checked').forEach((checkbox) => {
            subjects.push(checkbox.value);
        });

        const newStudent = {
            id: Date.now().toString(), // Simple ID
            name,
            class: studentClass,
            school,
            phone,
            joiningDate,
            subjects
        };

        const students = getStudents();
        students.push(newStudent);
        saveStudents(students);

        alert('Student Added Successfully!');
        e.target.reset();
    });
}

// --- FEES PAGE ---
if (document.getElementById('feesClassSelect')) {
    const classSelect = document.getElementById('feesClassSelect');
    const feeTableBody = document.getElementById('feeTableBody');
    const displayMonth = document.getElementById('displayMonth');

    // Create Month Selector dynamically if not exists (or user can add in HTML, but let's stick to valid HTML structure)
    // Actually, let's inject a month selector into the DOM if it's not there, or assume user added it. 
    // Wait, I haven't added the month selector HTML yet. I should do that in fees.html first? 
    // No, I can inject it here or just look for it. Use a standard month.

    // Better: Helper triggers. 
    // Let's assume standard date for now or add a month picker in JS? 
    // The user asked for "DROPDOWN FOR EVERY MONTH". 
    // Let's inject it via JS for simplicity if HTML edit is too heavy, or just use current date defaults but allow change.

    // For now, let's keep it simple: We need a month dropdown. 
    // I will add the logic here assuming the IDs exist, and then I will update fees.html.

    // But wait, I am editing JS now. 

    classSelect.addEventListener('change', loadFeeTable);
    // We need a month select event listener too
    const monthSelect = document.getElementById('feeMonthSelect');
    if (monthSelect) {
        monthSelect.addEventListener('change', loadFeeTable);
    }

    function loadFeeTable() {
        // Safe check
        if (!classSelect) return;

        const selectedClass = classSelect.value;
        const students = getStudents();
        const filteredStudents = students.filter(s => s.class === selectedClass);
        const fees = getFees();

        // Month handling
        const selectedMonth = document.getElementById('feeMonthSelect') ? document.getElementById('feeMonthSelect').value : new Date().toLocaleString('default', { month: 'long' });
        const currentYear = new Date().getFullYear(); // Simplified for now

        if (displayMonth) displayMonth.textContent = `${selectedMonth} ${currentYear}`;

        feeTableBody.innerHTML = '';

        if (filteredStudents.length === 0) {
            feeTableBody.innerHTML = '<tr><td colspan="4" class="text-center">No students found for this class.</td></tr>';
            return;
        }

        filteredStudents.forEach(student => {
            const tr = document.createElement('tr');

            let subjectsHtml = '';
            student.subjects.forEach(sub => {
                const feeKey = `${student.id}_${sub}_${selectedMonth}_${currentYear}`;
                const status = fees[feeKey] === 'Paid' ? 'Paid' : 'Pending';
                const statusClass = status === 'Paid' ? 'fee-paid' : 'fee-pending';

                // Reminder Check
                let reminderBtn = '';
                if (status === 'Pending') {
                    const msg = `Dear Parent, fee for student ${student.name} (Class ${student.class}) for ${sub} - ${selectedMonth} is PENDING. Please pay at the earliest.`;
                    const whatsappUrl = `https://wa.me/91${student.phone}?text=${encodeURIComponent(msg)}`;
                    reminderBtn = `<a href="${whatsappUrl}" target="_blank" class="btn btn-sm btn-warning ml-2 shadow-sm" style="font-weight:bold;"><i class="fab fa-whatsapp"></i> Share Reminder</a>`;
                }

                subjectsHtml += `
                    <div style="margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center;">
                        <span>${sub}</span>
                        <div>
                            <span class="fee-status ${statusClass}" onclick="toggleFee('${student.id}', '${sub}', '${selectedMonth}', '${currentYear}')">
                                ${status}
                            </span>
                            ${reminderBtn}
                        </div>
                    </div>`;
            });

            tr.innerHTML = `
                <td>${student.name}</td>
                <td>${student.phone}</td>
                <td>${subjectsHtml}</td>
            `;
            feeTableBody.appendChild(tr);
        });
    }

    window.toggleFee = function (studentId, subject, month, year) {
        const key = `${studentId}_${subject}_${month}_${year}`;
        const fees = getFees();
        if (fees[key] === 'Paid') {
            delete fees[key]; // Toggle back to pending
        } else {
            fees[key] = 'Paid';
        }
        saveFees(fees);
        loadFeeTable(); // Refresh
    };

    // Initial load
    loadFeeTable();
}


// --- TIMETABLE PAGE ---
if (document.getElementById('timetableTableBody')) {
    const timetableEntries = [];
    const tableBody = document.getElementById('timetableTableBody');
    const shareBtn = document.getElementById('shareWhatsappBtn');

    document.getElementById('addTimetableEntryBtn').addEventListener('click', function () {
        const date = document.getElementById('timetableDate').value;
        const time = document.getElementById('timetableTime').value;
        const studentClass = document.getElementById('timetableClass').value;
        const subject = document.getElementById('timetableSubject').value;

        if (!date || !studentClass || !subject) {
            alert("Please fill in Date, Class and Subject");
            return;
        }

        const entry = { date, time, class: studentClass, subject };
        timetableEntries.push(entry);
        renderTimetable();

        // Don't clear date to make adding multiple slots for same day easier
        document.getElementById('timetableTime').value = '';
        document.getElementById('timetableSubject').value = '';
    });

    function renderTimetable() {
        tableBody.innerHTML = '';
        if (timetableEntries.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No entries added.</td></tr>';
            document.getElementById('shareSection').style.display = 'none';
            return;
        }

        // Sort by Date then Time (handle empty time)
        timetableEntries.sort((a, b) => {
            const timeA = a.time || '00:00';
            const timeB = b.time || '00:00';
            return new Date(a.date + ' ' + timeA) - new Date(b.date + ' ' + timeB);
        });

        timetableEntries.forEach((entry, index) => {
            const dateObj = new Date(entry.date);
            const dateString = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dateString}</td>
                <td>${entry.time}</td>
                <td>${entry.class}</td>
                <td>${entry.subject}</td>
                <td class="no-capture"><button class="btn btn-sm btn-danger" onclick="removeTimetableEntry(${index})">&times;</button></td>
            `;
            tableBody.appendChild(tr);
        });

        document.getElementById('shareSection').style.display = 'block';
    }

    window.removeTimetableEntry = function (index) {
        timetableEntries.splice(index, 1);
        renderTimetable();
    };

    shareBtn.addEventListener('click', function () {
        const captureArea = document.getElementById('timetable-container');

        // Hide delete buttons for capture
        document.querySelectorAll('.no-capture').forEach(el => el.style.display = 'none');

        html2canvas(captureArea).then(canvas => {
            // Restore delete buttons
            document.querySelectorAll('.no-capture').forEach(el => el.style.display = '');

            const imgData = canvas.toDataURL("image/jpeg", 0.9);
            const link = document.createElement('a');
            link.download = `timetable-schedule-${Date.now()}.jpg`;
            link.href = imgData;
            link.click();
            alert("Timetable downloaded for sharing!");
            window.open("https://web.whatsapp.com/", "_blank");
        });
    });
}

// --- ATTENDANCE PAGE ---
if (document.getElementById('attendanceClassSelect')) {
    const attDate = document.getElementById('attendanceDate');
    const attSubject = document.getElementById('attendanceSubject');
    const attClass = document.getElementById('attendanceClassSelect');

    const attTable = document.getElementById('attendanceTableBody');
    const displayDate = document.getElementById('displayDate');
    const displaySubject = document.getElementById('displaySubject');
    const shareBtn = document.getElementById('shareAttendanceBtn');

    function updateAttendanceView() {
        const dateVal = attDate.value;
        const subVal = attSubject.value;
        const classVal = attClass.value;

        if (displayDate) displayDate.innerText = dateVal || 'Date Not Selected';
        if (displaySubject) displaySubject.innerText = subVal || 'Subject Not Selected';

        if (!classVal) {
            attTable.innerHTML = '<tr><td colspan="2" class="text-center">Please select a Class.</td></tr>';
            shareBtn.style.display = 'none';
            return;
        }

        const students = getStudents();
        // Filter by Class AND Subject (if selected)
        const filtered = students.filter(s => {
            if (s.class !== classVal) return false;
            // If subVal is selected, student must have that subject
            if (subVal && !s.subjects.includes(subVal)) return false;
            return true;
        });

        if (filtered.length === 0) {
            // Friendly message
            let msg = 'No students found for this class.';
            if (subVal) msg = `No students found for this class taking ${subVal}.`;

            attTable.innerHTML = `<tr><td colspan="2" class="text-center">${msg}</td></tr>`;
            shareBtn.style.display = 'none';
            return;
        }

        shareBtn.style.display = 'inline-block';
        attTable.innerHTML = '';

        filtered.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${s.name}</td>
                <td>
                    <div class="custom-control custom-switch">
                        <input type="checkbox" class="custom-control-input" id="att_${s.id}" checked>
                        <label class="custom-control-label" for="att_${s.id}">Present</label>
                    </div>
                </td>
            `;
            attTable.appendChild(tr);
        });
    }

    if (attDate) attDate.addEventListener('change', updateAttendanceView);
    if (attSubject) attSubject.addEventListener('change', updateAttendanceView);
    if (attClass) attClass.addEventListener('change', updateAttendanceView);

    if (shareBtn) {
        shareBtn.addEventListener('click', function () {
            if (!attDate.value || !attSubject.value) {
                alert("Please select Date and Subject before sharing.");
                return;
            }

            const captureArea = document.getElementById('attendance-capture-area');
            html2canvas(captureArea).then(canvas => {
                const imgData = canvas.toDataURL("image/jpeg", 0.9);
                const link = document.createElement('a');
                link.download = `attendance-${attDate.value}.jpg`;
                link.href = imgData;
                link.click();
                alert("Attendance Sheet downloaded!");
                window.open("https://web.whatsapp.com/", "_blank");
            });
        });
    }

    // Initial load for attendance
    updateAttendanceView();
}

// --- STUDENT MANAGEMENT LIST (ADD STUDENT PAGE) ---
if (document.getElementById('studentListBody')) {
    function renderStudentManagementList() {
        const tbody = document.getElementById('studentListBody');
        const students = getStudents();
        tbody.innerHTML = '';

        if (students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No students added yet.</td></tr>';
            return;
        }

        // Sort by class then name
        students.sort((a, b) => {
            if (a.class !== b.class) return a.class - b.class;
            return a.name.localeCompare(b.name);
        });

        students.forEach((s) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${s.name}</td>
                <td>${s.class}</td>
                <td>${s.phone}</td>
                <td>${s.subjects.join(', ')}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteStudent('${s.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.deleteStudent = function (id) {
        if (confirm("Are you sure you want to delete this student?")) {
            const students = getStudents();
            const updated = students.filter(s => s.id !== id);
            saveStudents(updated);
            renderStudentManagementList();
        }
    };

    // Call render initially
    renderStudentManagementList();

    // Hook into the form submission to re-render
    const form = document.getElementById('addStudentForm');
    if (form) {
        // We know the form exists and has a listener above, but we need to hook into the 'submit' 
        // We can just add another listener that runs AFTER the first one (event bubbling/sequence).
        // Since the first one is already defined, let's just make sure we call render in that block?
        // Or cleaner: modify the original block. 
        // Limitation: I can't easily modify the exact middle of the block above without extensive context match.
        // So I'll add a separate listener that waits 100ms (dirty hack) or uses a custom event.
        // BETTER: Update the top block. I will use 'replace_file_content' on the top block too if needed.
        // BUT wait, I can just use a mutation observer or just reload the page? No.

        // Let's add a listener that runs; since the previous listener does e.preventDefault(), this one will also run on submit.
        form.addEventListener('submit', function () {
            // Allow small delay for data save
            setTimeout(renderStudentManagementList, 100);
        });
    }
}
