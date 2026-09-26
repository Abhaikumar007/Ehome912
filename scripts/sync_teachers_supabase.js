const fs = require('fs');
const path = require('path');

// Paths
const codeTestDir = 'C:\\Users\\madhu\\code_test\\private';
const teacherAllotmentHtmlPath = path.join(codeTestDir, 'teacher_allotment.html');
const adminJsPath = path.join(codeTestDir, 'js', 'admin.js');

const appDir = 'c:\\Users\\madhu\\eduhome\\eduhome-app';
const teacherRosterTsPath = path.join(appDir, 'lib', 'teacherRoster.ts');
const teacherProfileTsxPath = path.join(appDir, 'app', '(teacher)', 'profile.tsx');
const teacherIndexTsxPath = path.join(appDir, 'app', '(teacher)', 'index.tsx');

console.log('=== 1. Updating teacher_allotment.html with live Supabase bidirectional sync ===');

if (fs.existsSync(teacherAllotmentHtmlPath)) {
    let html = fs.readFileSync(teacherAllotmentHtmlPath, 'utf8');

    // Replace the script section with Supabase live sync
    const scriptStartMarker = '<script src="js/config.js"></script>';
    const endMarker = '</body>';

    const newScriptContent = `<script src="js/config.js"></script>
    <script>
        const sb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

        const DEFAULT_TEACHERS = [
            {
                id: 'fac-chem',
                name: 'Dr. Ramesh Nair',
                subject: 'Chemistry',
                grades: '10, 11, 12',
                dept: 'Senior Science Department',
                type: 'Permanent',
                phone: '9847012345'
            },
            {
                id: 'fac-bio-lower',
                name: 'Mrs. Deepa Anoop',
                subject: 'Biology (Lower)',
                grades: '6, 7, 8, 9',
                dept: 'Secondary Science Department',
                type: 'Permanent',
                phone: '9847023456'
            },
            {
                id: 'fac-bio-upper',
                name: 'Dr. Suresh Kumar',
                subject: 'Biology (Upper)',
                grades: '10, 11, 12',
                dept: 'Senior Science Department',
                type: 'Permanent',
                phone: '9847034567'
            },
            {
                id: 'fac-phy',
                name: 'Mr. Rajesh Menon',
                subject: 'Physics',
                grades: '8, 9, 10, 11, 12',
                dept: 'Science Department',
                type: 'Permanent',
                phone: '9847045678'
            },
            {
                id: 'fac-cs',
                name: 'Ms. Ananya Sharma',
                subject: 'Computer Science',
                grades: '11, 12',
                dept: 'Computer Applications & IT',
                type: 'Permanent',
                phone: '9847056789'
            },
            {
                id: 'fac-math',
                name: 'Mr. Arun K. Varma',
                subject: 'Mathematics',
                grades: '6, 7, 8, 9',
                dept: 'Secondary Mathematics',
                type: 'Temporary',
                phone: '9847067890'
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

        function getInitials(name) {
            if (!name) return 'FA';
            return name.replace(/Dr\.|Mr\.|Mrs\.|Ms\./g, '').trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'FA';
        }

        async function syncFromSupabase() {
            if (!sb) return;
            try {
                const { data, error } = await sb.from('teachers').select('*');
                if (!error && Array.isArray(data) && data.length > 0) {
                    const localList = getTeachers();
                    data.forEach(remote => {
                        if (!remote.faculty_id) return;
                        const match = localList.find(t => t.id === remote.faculty_id);
                        if (match) {
                            if (remote.name) match.name = remote.name;
                            if (remote.phone) match.phone = remote.phone;
                        } else if (remote.faculty_id.startsWith('fac-')) {
                            localList.push({
                                id: remote.faculty_id,
                                name: remote.name,
                                subject: remote.subjects ? remote.subjects.split('(')[0].trim() : 'General',
                                grades: remote.subjects && remote.subjects.includes('Class') ? remote.subjects.replace(/.*Class\\s*/, '').replace(')', '').trim() : 'All',
                                dept: 'Academic Faculty',
                                type: 'Permanent',
                                phone: remote.phone || ''
                            });
                        }
                    });
                    saveTeachers(localList);
                    renderTeachers();
                }
            } catch (err) {
                console.warn('Sync from Supabase failed:', err);
            }
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

        async function saveTeacherAllotment() {
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
            const facultyId = editIdx !== '' && list[editIdx] ? list[editIdx].id : ('fac-' + Date.now());
            const entry = {
                id: facultyId,
                name,
                subject,
                grades,
                dept: dept || (subject + ' Faculty'),
                type,
                phone: (editIdx !== '' && list[editIdx]?.phone) ? list[editIdx].phone : '9847000000'
            };

            if (editIdx !== '') {
                list[editIdx] = entry;
            } else {
                list.push(entry);
            }

            saveTeachers(list);
            renderTeachers();
            $('#teacherModal').modal('hide');

            // SYNC DIRECTLY TO SUPABASE DATABASE
            if (sb) {
                try {
                    const initials = getInitials(name);
                    const { error } = await sb.from('teachers').upsert({
                        faculty_id: facultyId,
                        name: name,
                        subjects: \`\${subject} (Class \${grades})\`,
                        phone: entry.phone,
                        role: 'Faculty',
                        avatar: initials,
                        pin: '654321'
                    }, { onConflict: 'faculty_id' });

                    if (error) {
                        console.warn('Supabase upsert warning:', error);
                        alert('✓ Saved locally. (Cloud sync: ' + error.message + ')');
                    } else {
                        alert('✓ Teacher allotment saved & synced live to Faculty Mobile App!');
                    }
                } catch (e) {
                    console.warn('Supabase sync error:', e);
                }
            } else {
                alert('✓ Teacher allotment saved successfully!');
            }
        }

        async function deleteTeacher(idx) {
            const list = getTeachers();
            if (!list[idx]) return;
            const target = list[idx];
            if (confirm('Remove assignment for ' + target.name + '?')) {
                list.splice(idx, 1);
                saveTeachers(list);
                renderTeachers();
                if (sb && target.id) {
                    try {
                        await sb.from('teachers').delete().eq('faculty_id', target.id);
                    } catch (e) {}
                }
            }
        }

        document.addEventListener('DOMContentLoaded', function() {
            renderTeachers();
            syncFromSupabase();

            // Realtime listener: if teacher updates their name in the mobile app, admin updates live!
            if (sb) {
                sb.channel('faculty_realtime_admin')
                  .on('postgres_changes', { event: '*', schema: 'public', table: 'teachers' }, () => {
                      syncFromSupabase();
                  })
                  .subscribe();
            }
        });
    </script>
</body>`;

    const idx = html.indexOf(scriptStartMarker);
    if (idx !== -1) {
        html = html.substring(0, idx) + newScriptContent + '\n</html>';
        fs.writeFileSync(teacherAllotmentHtmlPath, html, 'utf8');
        console.log('✓ teacher_allotment.html updated with live Supabase bidirectional sync');
    }
}

console.log('=== 2. Updating admin.js to resolve dynamic teacher names from allotments ===');

if (fs.existsSync(adminJsPath)) {
    let js = fs.readFileSync(adminJsPath, 'utf8');
    const oldMapping = `        // Map teacher automatically from allotment rules without cluttering form
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
        }`;

    const newMapping = `        // Map teacher automatically from allotment rules without cluttering form
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

        // Dynamically resolve custom teacher name if updated in Assign Teachers
        try {
            const storedAllotments = JSON.parse(localStorage.getItem('eduhome_faculty_allotments') || '[]');
            const matchedFaculty = storedAllotments.find(t => t.id === facultyId);
            if (matchedFaculty && matchedFaculty.name) {
                facultyName = matchedFaculty.name;
            }
        } catch (e) {}`;

    if (js.includes(oldMapping)) {
        js = js.replace(oldMapping, newMapping);
        fs.writeFileSync(adminJsPath, js, 'utf8');
        console.log('✓ admin.js updated with dynamic teacher name resolution from allotments');
    }
}

console.log('=== All code_test changes updated! ===');
