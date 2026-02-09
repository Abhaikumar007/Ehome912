
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

// Helper to save fees
function saveFees(fees) {
    localStorage.setItem('fees', JSON.stringify(fees));
}

// --- DATA MANAGEMENT (BACKUP & RESTORE) ---
window.backupData = function () {
    const data = {
        students: getStudents(),
        fees: getFees(),
        timestamp: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `eduhome_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert("Backup file downloaded! Keep it safe.");
};

window.restoreData = function (input) {
    const file = input.files[0];
    if (!file) return;

    if (!confirm("WARNING: This will replace all current data with the backup file. Continue?")) {
        input.value = ''; // Reset
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);

            if (data.students && data.fees) {
                saveStudents(data.students);
                saveFees(data.fees);
                alert("Data Restored Successfully! Reloading...");
                window.location.reload();
            } else {
                alert("Invalid Backup File. Missing student or fee data.");
            }
        } catch (err) {
            alert("Error parsing backup file: " + err.message);
        }
    };
    reader.readAsText(file);
};


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
        const fees = getFees();

        // Month handling
        const selectedMonth = document.getElementById('feeMonthSelect') ? document.getElementById('feeMonthSelect').value : new Date().toLocaleString('default', { month: 'long' });
        const currentYear = new Date().getFullYear();

        if (displayMonth) displayMonth.textContent = `${selectedMonth} ${currentYear}`;

        feeTableBody.innerHTML = '';

        // --- 1. Future Month Check ---
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthIndex = monthNames.indexOf(selectedMonth);
        const now = new Date();
        const currentMonthIndex = now.getMonth();
        const realCurrentYear = now.getFullYear();

        // If selected year is future OR (same year AND selected month > current month)
        if (currentYear > realCurrentYear || (currentYear === realCurrentYear && monthIndex > currentMonthIndex)) {
            feeTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Cannot view fees for future months (${selectedMonth}).</td></tr>`;
            return;
        }

        // --- 2. Filter Students by Class AND Date of Joining ---
        let students = getStudents(); // Get all
        let filteredStudents = students.filter(s => {
            // Class Check
            if (s.class !== selectedClass) return false;

            // Date of Joining Check
            if (s.joiningDate) {
                const joinDate = new Date(s.joiningDate);
                // Compare Month/Year indices to be safe
                // We compare: View Month Start Date vs Join Date
                // If View Month is BEFORE Join Month/Year, exclude.

                // Construct Date objects for comparison (First day of respective months)
                const viewMonthStart = new Date(currentYear, monthIndex, 1);
                const joinMonthStart = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);

                if (viewMonthStart < joinMonthStart) {
                    return false; // Student joined after this month
                }
            }
            return true;
        });

        if (filteredStudents.length === 0) {
            feeTableBody.innerHTML = '<tr><td colspan="4" class="text-center">No active students found for this class in ' + selectedMonth + '.</td></tr>';
            return;
        }

        filteredStudents.forEach(student => {
            const tr = document.createElement('tr');

            let subjectsHtml = '';
            student.subjects.forEach(sub => {
                const feeKey = `${student.id}_${sub}_${selectedMonth}_${currentYear}`;

                let status = fees[feeKey] === 'Paid' ? 'Paid' : 'Pending';
                let statusClass = '';
                let canToggle = true;

                // Day-Based Logic for Pending Fees
                if (status === 'Pending' && student.joiningDate) {
                    const joinDate = new Date(student.joiningDate);
                    const joinDay = joinDate.getDate(); // e.g., 10th

                    // Determine Due Date for THIS selected month
                    // Be careful with months having fewer days
                    const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
                    const dueDay = Math.min(joinDay, daysInMonth);

                    const dueDate = new Date(currentYear, monthIndex, dueDay);
                    // Compare with Today (stripped of time for fair comparison)
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    // If we are looking at the current month/year AND today is BEFORE due date
                    if (currentYear === realCurrentYear && monthIndex === currentMonthIndex) {
                        if (today < dueDate) {
                            status = `Upcoming (Due: ${dueDay})`;
                            statusClass = 'fee-upcoming'; // Yellow/Orange
                            canToggle = true; // User can still mark as paid if they want? Yes, typically.
                        } else {
                            statusClass = 'fee-pending'; // Red
                        }
                    } else if (currentYear < realCurrentYear || (currentYear === realCurrentYear && monthIndex < currentMonthIndex)) {
                        // Past Month: Always Pending if not paid
                        statusClass = 'fee-pending';
                    } else {
                        // Future Month: Should be hidden by top logic, but if not:
                        statusClass = 'fee-upcoming';
                    }
                } else if (status === 'Pending') {
                    // No join date? Default to pending
                    statusClass = 'fee-pending';
                } else {
                    statusClass = 'fee-paid';
                }

                // Reminder Check
                let reminderBtn = '';
                // Only show reminder if actually PENDING (Red)
                if (statusClass === 'fee-pending') {
                    const msg = `Dear Parent, fee for student ${student.name} (Class ${student.class}) for ${sub} - ${selectedMonth} is PENDING. Please pay at the earliest.`;
                    // Use verified whatsapp logic (wa.me)
                    const whatsappUrl = `https://wa.me/91${student.phone}?text=${encodeURIComponent(msg)}`;
                    // Removed ml-2, added mobile styling
                    reminderBtn = `<a href="${whatsappUrl}" target="_blank" class="btn btn-sm btn-warning shadow-sm" style="font-weight:bold; margin-top: 5px;"><i class="fab fa-whatsapp"></i> Share Reminder</a>`;
                }

                subjectsHtml += `
                    <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                        <span style="font-weight: 500; margin-top: 4px;">${sub}</span>
                        <div style="display: flex; flex-direction: column; align-items: flex-end;">
                            <span class="fee-status ${statusClass}" onclick="toggleFee('${student.id}', '${sub}', '${selectedMonth}', '${currentYear}')" style="min-width: 90px; text-align: center;">
                                ${status}
                            </span>
                            ${reminderBtn}
                        </div>
                    </div>`;
            });

            tr.innerHTML = `
                <td>
                    ${student.name}
                    ${student.joiningDate ? `<br><small class="text-muted" style="font-size:0.75rem;">Joined: ${new Date(student.joiningDate).toLocaleDateString()}</small>` : ''}
                </td>
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

    function formatDateFriendly(dateString) {
        if (!dateString) return '';
        const inputDate = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Reset hours to compare dates only
        inputDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        tomorrow.setHours(0, 0, 0, 0);

        if (inputDate.getTime() === today.getTime()) {
            return "Today";
        } else if (inputDate.getTime() === tomorrow.getTime()) {
            return "Tomorrow";
        } else {
            return new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        }
    }

    function formatTime12Hour(timeString) {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const h = parseInt(hours, 10);
        const m = parseInt(minutes, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${m < 10 ? '0' + m : m} ${ampm}`;
    }

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
            const dateDisplay = formatDateFriendly(entry.date);
            const timeDisplay = formatTime12Hour(entry.time);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dateDisplay}</td>
                <td>${timeDisplay}</td>
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
        if (timetableEntries.length === 0) {
            alert("No entries to share.");
            return;
        }

        let message = `*📅 Class Schedule*\n\n`;

        timetableEntries.forEach(entry => {
            const dateDisplay = formatDateFriendly(entry.date);
            const timeDisplay = formatTime12Hour(entry.time);
            const timeStr = timeDisplay ? `🕒 ${timeDisplay}` : '';

            message += `🗓 *${dateDisplay}* ${timeStr}\n`;
            message += `🏫 Class: ${entry.class}\n`;
            message += `📖 Subject: ${entry.subject}\n`;
            message += `-------------------\n`;
        });

        // Open WhatsApp with text to specific number using wa.me
        const whatsappUrl = `https://wa.me/918547457536?text=${encodeURIComponent(message)}`;
        window.location.href = whatsappUrl;
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

            // Construct Text Message
            let message = `*📅 Attendance Report*\n`;
            message += `🗓 Date: ${attDate.value}\n`;
            message += `🏫 Class: ${attClass.value}\n`;
            message += `📖 Subject: ${attSubject.value}\n\n`;
            message += `*Students:*\n`;

            const rows = attTable.querySelectorAll('tr');
            if (rows.length === 0 || (rows.length === 1 && rows[0].innerText.includes("Select Class"))) {
                alert("No students to share.");
                return;
            }

            let presentCount = 0;
            let totalCount = 0;

            rows.forEach((row, index) => {
                const nameCell = row.cells[0];
                if (!nameCell) return;

                const name = nameCell.innerText;
                const checkbox = row.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    totalCount++;
                    const isPresent = checkbox.checked;
                    if (isPresent) presentCount++;
                    const statusIcon = isPresent ? '✅' : '❌';
                    const statusText = isPresent ? 'Present' : 'Absent';
                    message += `${index + 1}. ${name}: ${statusIcon} ${statusText}\n`;
                }
            });

            message += `\n📊 *Summary:* ${presentCount}/${totalCount} Present`;

            // Open WhatsApp with text to specific number using wa.me for robustness
            const whatsappUrl = `https://wa.me/918547457536?text=${encodeURIComponent(message)}`;
            window.location.href = whatsappUrl;
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
                <td>
                    ${s.name}
                    ${s.joiningDate ? `<br><small class="text-muted" style="font-size:0.75rem;">Joined: ${new Date(s.joiningDate).toLocaleDateString()}</small>` : ''}
                </td>
                <td>${s.class}</td>
                <td>${s.phone}</td>
                <td>${s.subjects.join(', ')}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="askDeleteStudent('${s.id}', this)">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Two-step delete to avoid native confirm() issues in WebViews
    window.askDeleteStudent = function (id, btn) {
        btn.innerText = "Confirm?";
        btn.classList.remove('btn-danger');
        btn.classList.add('btn-warning');
        btn.setAttribute('onclick', `confirmDeleteStudent('${id}')`);

        // Revert after 3 seconds if not clicked
        setTimeout(() => {
            if (document.body.contains(btn)) {
                btn.innerText = "Delete";
                btn.classList.add('btn-danger');
                btn.classList.remove('btn-warning');
                btn.setAttribute('onclick', `askDeleteStudent('${id}', this)`);
            }
        }, 3000);
    };

    window.confirmDeleteStudent = function (id) {
        const students = getStudents();
        const updated = students.filter(s => s.id !== id);
        saveStudents(updated);
        renderStudentManagementList();
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
