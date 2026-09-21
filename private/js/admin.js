// Master Roster of all 50 students with full subjects, fees, schools, and joining dates
const MASTER_STUDENTS_ROSTER = [
    {
        "id": "2024-JEE-0842",
        "rollNo": "2024-JEE-0842",
        "name": "Arjun S",
        "class": "12",
        "school": "EduHome Campus",
        "phone": "9876543210",
        "joiningDate": "2026-01-15",
        "amount": "4000",
        "subjects": [
            "Physics",
            "Chemistry",
            "Maths"
        ]
    },
    {
        "id": "EDU-2026-001",
        "rollNo": "EDU-2026-001",
        "name": "Amaljith",
        "class": "10",
        "school": "Vendar",
        "phone": "919895423986",
        "joiningDate": "2026-04-18",
        "amount": "3000",
        "subjects": [
            "Physics",
            "Maths",
            "Biology"
        ]
    },
    {
        "id": "EDU-2026-002",
        "rollNo": "EDU-2026-002",
        "name": "Karthik",
        "class": "11",
        "school": "Boys",
        "phone": "919961796378",
        "joiningDate": "2026-07-06",
        "amount": "2500",
        "subjects": [
            "Physics",
            "Maths"
        ]
    },
    {
        "id": "EDU-2026-003",
        "rollNo": "EDU-2026-003",
        "name": "Sivanya",
        "class": "11",
        "school": "Boys",
        "phone": "918848157457",
        "joiningDate": "2026-05-01",
        "amount": "4500",
        "subjects": [
            "Physics",
            "Chemistry",
            "Maths",
            "Biology"
        ]
    },
    {
        "id": "EDU-2026-004",
        "rollNo": "EDU-2026-004",
        "name": "Abhinanda",
        "class": "9",
        "school": "Vendar",
        "phone": "919895446203",
        "joiningDate": "2026-05-01",
        "amount": "2000",
        "subjects": [
            "Physics",
            "Chemistry",
            "Maths",
            "Biology"
        ]
    },
    {
        "id": "EDU-2026-005",
        "rollNo": "EDU-2026-005",
        "name": "Krishnaveni",
        "class": "8",
        "school": "Puthoor",
        "phone": "9544443618",
        "joiningDate": "2026-05-04",
        "amount": "750",
        "subjects": [
            "Maths"
        ]
    },
    {
        "id": "EDU-2026-006",
        "rollNo": "EDU-2026-006",
        "name": "Meerakrishnan",
        "class": "7",
        "school": "Marthoma",
        "phone": "8089939249",
        "joiningDate": "2026-05-23",
        "amount": "600",
        "subjects": [
            "Maths"
        ]
    },
    {
        "id": "EDU-2026-007",
        "rollNo": "EDU-2026-007",
        "name": "Niranjana",
        "class": "12",
        "school": "Divine",
        "phone": "7025747029",
        "joiningDate": "2026-05-23",
        "amount": "1000",
        "subjects": [
            "Physics"
        ]
    },
    {
        "id": "EDU-2026-008",
        "rollNo": "EDU-2026-008",
        "name": "Vaiga",
        "class": "8",
        "school": "Marthoma",
        "phone": "9446614427",
        "joiningDate": "2026-05-23",
        "amount": "1500",
        "subjects": [
            "Physics",
            "Chemistry",
            "Maths",
            "Biology"
        ]
    },
    {
        "id": "EDU-2026-009",
        "rollNo": "EDU-2026-009",
        "name": "Sari N Raj",
        "class": "12",
        "school": "Boys VHSE",
        "phone": "9746865309",
        "joiningDate": "2026-05-24",
        "amount": "3500",
        "subjects": [
            "Physics",
            "Chemistry",
            "Biology"
        ]
    },
    {
        "id": "EDU-2026-010",
        "rollNo": "EDU-2026-010",
        "name": "Aromal",
        "class": "8",
        "school": "Technical Scool",
        "phone": "9745777289",
        "joiningDate": "2026-04-08",
        "amount": "1500",
        "subjects": [
            "Physics",
            "Chemistry",
            "Maths"
        ]
    },
    {
        "id": "EDU-2026-011",
        "rollNo": "EDU-2026-011",
        "name": "Vaishnavi",
        "class": "8",
        "school": "Siddhartha",
        "phone": "7558859373",
        "joiningDate": "2026-04-05",
        "amount": "1500",
        "subjects": [
            "Physics",
            "Chemistry",
            "Maths",
            "Biology"
        ]
    },
    {
        "id": "EDU-2026-012",
        "rollNo": "EDU-2026-012",
        "name": "Avani",
        "class": "9",
        "school": "Puthoor",
        "phone": "8921856088",
        "joiningDate": "2026-04-06",
        "amount": "1000",
        "subjects": [
            "Maths"
        ]
    },
    {
        "id": "EDU-2026-013",
        "rollNo": "EDU-2026-013",
        "name": "Nakshathra",
        "class": "9",
        "school": "Marthoma",
        "phone": "9633076463",
        "joiningDate": "2026-04-06",
        "amount": "2000",
        "subjects": [
            "Physics",
            "Chemistry",
            "Maths",
            "Biology"
        ]
    },
    {
        "id": "EDU-2026-014",
        "rollNo": "EDU-2026-014",
        "name": "Asna",
        "class": "10",
        "school": "Marthoma",
        "phone": "9446253365",
        "joiningDate": "2026-04-06",
        "amount": "2000",
        "subjects": [
            "Physics",
            "Maths"
        ]
    },
    {
        "id": "EDU-2026-015",
        "rollNo": "EDU-2026-015",
        "name": "Sivani",
        "class": "12",
        "school": "Vendar",
        "phone": "8590976055",
        "joiningDate": "2026-04-13",
        "amount": "4500",
        "subjects": [
            "Physics",
            "Chemistry",
            "Maths",
            "Computer Science"
        ]
    },
    {
        "id": "EDU-2026-016",
        "rollNo": "EDU-2026-016",
        "name": "Nandana",
        "class": "12",
        "school": "MIBS",
        "phone": "7736592931",
        "joiningDate": "2026-04-08",
        "amount": "2500",
        "subjects": [
            "Physics",
            "Maths"
        ]
    },
    {
        "id": "EDU-2026-017",
        "rollNo": "EDU-2026-017",
        "name": "Karun",
        "class": "12",
        "school": "Divine",
        "phone": "918089978209",
        "joiningDate": "2026-04-04",
        "amount": "2500",
        "subjects": [
            "Physics",
            "Maths"
        ]
    },
    {
        "id": "EDU-2026-018",
        "rollNo": "EDU-2026-018",
        "name": "Aadidev",
        "class": "12",
        "school": "Divine",
        "phone": "9446258069",
        "joiningDate": "2026-04-04",
        "amount": "2500",
        "subjects": [
            "Physics",
            "Maths"
        ]
    },
    {
        "id": "EDU-2026-019",
        "rollNo": "EDU-2026-019",
        "name": "Abhinand",
        "class": "12",
        "school": "Vendar",
        "phone": "7012451748",
        "joiningDate": "2026-04-08",
        "amount": "3500",
        "subjects": [
            "Physics",
            "Chemistry",
            "Maths"
        ]
    },
    {
        "id": "EDU-2026-020",
        "rollNo": "EDU-2026-020",
        "name": "Poojitha",
        "class": "7",
        "school": "Kottathala UP School",
        "phone": "8157933242",
        "joiningDate": "2026-05-04",
        "amount": "600",
        "subjects": [
            "Maths"
        ]
    },
    {
        "id": "EDU-2026-021",
        "rollNo": "EDU-2026-021",
        "name": "Irfan",
        "class": "12",
        "school": "Vendar",
        "phone": "9567187275",
        "joiningDate": "2026-05-14",
        "amount": "3500",
        "subjects": [
            "Physics",
            "Maths",
            "Computer Science"
        ]
    },
    {
        "id": "EDU-2026-022",
        "rollNo": "EDU-2026-022",
        "name": "Karthik Nath",
        "class": "9",
        "school": "CBSE",
        "phone": "9847270637",
        "joiningDate": "2026-04-03",
        "amount": "2000",
        "subjects": [
            "Physics",
            "Maths"
        ]
    },
    {
        "id": "EDU-2026-023",
        "rollNo": "EDU-2026-023",
        "name": "Vishwathej",
        "class": "12",
        "school": "SG",
        "phone": "9961803001",
        "joiningDate": "2026-01-01",
        "amount": "4500",
        "subjects": [
            "Physics",
            "Chemistry",
            "Maths",
            "Biology"
        ]
    },
    {
        "id": "EDU-2026-024",
        "rollNo": "EDU-2026-024",
        "name": "Ganga",
        "class": "10",
        "school": "Divine",
        "phone": "8547495160",
        "joiningDate": "2026-03-09",
        "amount": "3000",
        "subjects": [
            "Physics",
            "Chemistry",
            "Maths",
            "Biology"
        ]
    },
    {
        "id": "EDU-2026-025",
        "rollNo": "EDU-2026-025",
        "name": "Adithya Krishnan",
        "class": "9",
        "school": "MGM",
        "phone": "918129754629",
        "joiningDate": "2026-05-31",
        "amount": "2000",
        "subjects": [
            "Physics",
            "Chemistry",
            "Maths",
            "Biology"
        ]
    },
    {
        "id": "EDU-2026-026",
        "rollNo": "EDU-2026-026",
        "name": "Alecia Mathew",
        "class": "10",
        "school": "Divine",
        "phone": "9650974040",
        "joiningDate": "2026-03-13",
        "amount": "3000",
        "subjects": [
            "Physics",
            "Chemistry",
            "Maths",
            "Biology"
        ]
    },
    {
        "id": "EDU-2026-027",
        "rollNo": "EDU-2026-027",
        "name": "Krishnanandh",
        "class": "9",
        "school": "Siddhartha",
        "phone": "9495195776",
        "joiningDate": "2026-06-08",
        "amount": "2000",
        "subjects": [
            "Physics",
            "Chemistry",
            "Maths"
        ]
    },
    {
        "id": "EDU-2026-028",
        "rollNo": "EDU-2026-028",
        "name": "Ashwanath",
        "class": "8",
        "school": "Puthoor",
        "phone": "9544477117",
        "joiningDate": "2026-04-05",
        "amount": "1500",
        "subjects": [
            "Physics",
            "Chemistry",
            "Maths",
            "Biology"
        ]
    },
    {
        "id": "EDU-2026-029",
        "rollNo": "EDU-2026-029",
        "name": "Niranjan",
        "class": "12",
        "school": "SG",
        "phone": "919567026060",
        "joiningDate": "2026-04-28",
        "amount": "4500",
        "subjects": [
            "Physics",
            "Chemistry",
            "Maths",
            "Biology"
        ]
    },
    {
        "id": "EDU-2026-030",
        "rollNo": "EDU-2026-030",
        "name": "Lekshmipriya",
        "class": "9",
        "school": "Marthoma",
        "phone": "918921477592",
        "joiningDate": "2026-05-07",
        "amount": "2000",
        "subjects": [
            "Physics",
            "Chemistry",
            "Maths",
            "Biology"
        ]
    },
    {
        "id": "EDU-2026-031",
        "rollNo": "EDU-2026-031",
        "name": "Achyuth",
        "class": "9",
        "school": "Divine",
        "phone": "919562902227",
        "joiningDate": "2026-06-06",
        "amount": "1000",
        "subjects": [
            "Physics"
        ]
    },
    {
        "id": "EDU-2026-032",
        "rollNo": "EDU-2026-032",
        "name": "Hiba",
        "class": "11",
        "school": "Brm",
        "phone": "919072435565",
        "joiningDate": "2026-06-22",
        "amount": "2500",
        "subjects": [
            "Physics",
            "Maths"
        ]
    },
    {
        "id": "EDU-2026-033",
        "rollNo": "EDU-2026-033",
        "name": "Gowtham",
        "class": "9",
        "school": "Sree Sree",
        "phone": "9447063343",
        "joiningDate": "2026-07-01",
        "amount": "2000",
        "subjects": [
            "Physics",
            "Chemistry",
            "Maths",
            "Biology"
        ]
    },
    {
        "id": "EDU-2026-034",
        "rollNo": "EDU-2026-034",
        "name": "Vyshnavi",
        "class": "12",
        "school": "Divine",
        "phone": "9562820950",
        "joiningDate": "2026-07-11",
        "amount": "1000",
        "subjects": [
            "Physics"
        ]
    },
    {
        "id": "EDU-2026-035",
        "rollNo": "EDU-2026-035",
        "name": "Gopika",
        "class": "8",
        "school": "Divine",
        "phone": "9947540424",
        "joiningDate": "2026-07-15",
        "amount": "1000",
        "subjects": [
            "Maths"
        ]
    },
    {
        "id": "EDU-2026-036",
        "rollNo": "EDU-2026-036",
        "name": "Cristine",
        "class": "10",
        "school": "Divine cbse",
        "phone": "9446118812",
        "joiningDate": "2026-09-04",
        "amount": "3000",
        "subjects": [
            "Physics",
            "Chemistry",
            "Maths",
            "Biology"
        ]
    },
    {
        "id": "EDU-2026-037",
        "rollNo": "EDU-2026-037",
        "name": "Roshan",
        "class": "12",
        "school": "Divine",
        "phone": "8921159422",
        "joiningDate": "2026-09-10",
        "amount": "3500",
        "subjects": [
            "Physics",
            "Chemistry",
            "Maths"
        ]
    },
    {
        "id": "EDU-2026-038",
        "rollNo": "EDU-2026-038",
        "name": "Fathima",
        "class": "12",
        "school": "Svmmhss",
        "phone": "7034492498",
        "joiningDate": "2026-09-02",
        "amount": "2000",
        "subjects": [
            "Physics",
            "Biology"
        ]
    },
    {
        "id": "EDU-2026-039",
        "rollNo": "EDU-2026-039",
        "name": "Hajira",
        "class": "12",
        "school": "Svmmhss",
        "phone": "9747841626",
        "joiningDate": "2026-09-02",
        "amount": "2500",
        "subjects": [
            "Physics",
            "Maths"
        ]
    },
    {
        "id": "EDU-2026-040",
        "rollNo": "EDU-2026-040",
        "name": "Keerthana",
        "class": "11",
        "school": "Svmmhss",
        "phone": "9656839908",
        "joiningDate": "2026-08-08",
        "amount": "2000",
        "subjects": [
            "Physics",
            "Chemistry"
        ]
    },
    {
        "id": "EDU-2026-041",
        "rollNo": "EDU-2026-041",
        "name": "Karthika",
        "class": "12",
        "school": "Vendar",
        "phone": "9656839908",
        "joiningDate": "2026-08-03",
        "amount": "2500",
        "subjects": [
            "Chemistry",
            "Maths"
        ]
    },
    {
        "id": "EDU-2026-042",
        "rollNo": "EDU-2026-042",
        "name": "Dwaitha",
        "class": "11",
        "school": "MGM mylam",
        "phone": "6238332685",
        "joiningDate": "2026-08-08",
        "amount": "3000",
        "subjects": [
            "Physics",
            "Chemistry",
            "Biology"
        ]
    },
    {
        "id": "EDU-2026-043",
        "rollNo": "EDU-2026-043",
        "name": "Adarsh",
        "class": "12",
        "school": "Vendar",
        "phone": "9544166131",
        "joiningDate": "2026-08-08",
        "amount": "2000",
        "subjects": [
            "Physics",
            "Chemistry"
        ]
    },
    {
        "id": "EDU-2026-044",
        "rollNo": "EDU-2026-044",
        "name": "Sreedev",
        "class": "12",
        "school": "Vendar",
        "phone": "9744795650",
        "joiningDate": "2026-08-08",
        "amount": "3000",
        "subjects": [
            "Physics",
            "Chemistry",
            "Biology"
        ]
    },
    {
        "id": "EDU-2026-045",
        "rollNo": "EDU-2026-045",
        "name": "Dharmic Krishna",
        "class": "10",
        "school": "Puthoor",
        "phone": "8547534316",
        "joiningDate": "2026-09-04",
        "amount": "3000",
        "subjects": [
            "Physics",
            "Chemistry",
            "Maths",
            "Biology"
        ]
    },
    {
        "id": "EDU-2026-046",
        "rollNo": "EDU-2026-046",
        "name": "Amrutha",
        "class": "12",
        "school": "Puthoor",
        "phone": "6282355118",
        "joiningDate": "2026-09-09",
        "amount": "1500",
        "subjects": [
            "Maths"
        ]
    },
    {
        "id": "EDU-2026-047",
        "rollNo": "EDU-2026-047",
        "name": "Punya.r",
        "class": "11",
        "school": "EVHS Neduvathoor",
        "phone": "8593078422",
        "joiningDate": "2026-09-11",
        "amount": "4500",
        "subjects": [
            "Physics",
            "Chemistry",
            "Maths",
            "Biology"
        ]
    },
    {
        "id": "EDU-2026-048",
        "rollNo": "EDU-2026-048",
        "name": "Sreehari",
        "class": "10",
        "school": "Divine School Puthoor",
        "phone": "9539122202",
        "joiningDate": "2026-09-12",
        "amount": "1000",
        "subjects": [
            "Physics"
        ]
    },
    {
        "id": "EDU-2026-049",
        "rollNo": "EDU-2026-049",
        "name": "Sivananda",
        "class": "6",
        "school": "MTGHS",
        "phone": "5555555555",
        "joiningDate": "2026-06-01",
        "amount": "1000",
        "subjects": [
            "Physics",
            "Chemistry",
            "Maths",
            "Biology"
        ]
    }
];

// Helper to get students from LocalStorage with automatic master roster fallback & hydration
function getStudents() {
    let list = [];
    try {
        const stored = localStorage.getItem('students');
        if (stored) list = JSON.parse(stored);
    } catch (e) {}

    // If completely empty, seed directly from master roster
    if (!Array.isArray(list) || list.length === 0) {
        list = JSON.parse(JSON.stringify(MASTER_STUDENTS_ROSTER));
        try { localStorage.setItem('students', JSON.stringify(list)); } catch (e) {}
        return list;
    }

    // Hydrate any missing subjects/amounts from master roster
    const masterMap = new Map(MASTER_STUDENTS_ROSTER.map(m => [m.id || m.rollNo, m]));
    let needsSave = false;

    const merged = list.map(s => {
        const key = s.id || s.rollNo;
        const master = masterMap.get(key);
        if (!master) {
            if (!s.subjects || !Array.isArray(s.subjects) || s.subjects.length === 0) {
                s.subjects = ['General Tuition'];
            }
            return s;
        }

        const copy = { ...s };
        if (!copy.subjects || !Array.isArray(copy.subjects) || copy.subjects.length === 0) {
            copy.subjects = master.subjects;
            needsSave = true;
        }
        if (!copy.amount || copy.amount === '-' || copy.amount === '') {
            copy.amount = master.amount;
            needsSave = true;
        }
        if (!copy.joiningDate) {
            copy.joiningDate = master.joiningDate;
            needsSave = true;
        }
        if (!copy.school || copy.school === 'EduHome Campus') {
            copy.school = master.school;
            needsSave = true;
        }
        return copy;
    });

    // Ensure any students from master that are missing are also added
    const existingIds = new Set(merged.map(s => s.id || s.rollNo));
    MASTER_STUDENTS_ROSTER.forEach(m => {
        const k = m.id || m.rollNo;
        if (!existingIds.has(k)) {
            merged.push(JSON.parse(JSON.stringify(m)));
            needsSave = true;
        }
    });

    if (needsSave) {
        try { localStorage.setItem('students', JSON.stringify(merged)); } catch (e) {}
    }

    return merged;
}

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

// --- EXPORT STUDENT DATA ---
window.exportStudentData = function () {
    const students = getStudents();
    const fees = getFees();

    if (students.length === 0) {
        alert('No students found to export.');
        return;
    }

    // Build enriched export (students + per-student fee summary)
    const exportData = {
        exportedAt: new Date().toISOString(),
        totalStudents: students.length,
        students: students.map(function (s) {
            // Collect all fee keys for this student
            const studentFees = {};
            Object.keys(fees).forEach(function (key) {
                if (key.startsWith(s.id + '_')) {
                    // key format: studentId_Subject_Month_Year
                    const parts = key.split('_');
                    if (parts.length >= 4) {
                        const label = parts.slice(1).join('_'); // Subject_Month_Year
                        studentFees[label] = fees[key];
                    }
                }
            });
            return {
                id: s.id,
                name: s.name,
                class: s.class,
                school: s.school || '',
                phone: s.phone,
                joiningDate: s.joiningDate || '',
                monthlyFee: s.amount || '',
                subjects: s.subjects,
                feeRecords: studentFees
            };
        })
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'students_export_' + new Date().toISOString().slice(0, 10) + '.json';
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('✅ Student data exported! File downloaded.');
};

// --- SUPABASE EXPORT HELPERS (SQL & CSV) ---
async function getStudentsForSupabaseExport() {
    var toggle = document.getElementById('sourceToggleSwitch');
    var isCloud = toggle ? toggle.checked : false;

    // 1. If toggle is set to cloud, try cloud first
    if (isCloud && typeof sb_getStudents === 'function') {
        try {
            var cloudData = await sb_getStudents();
            if (cloudData && cloudData.length > 0) return cloudData;
        } catch (e) {
            console.warn('[Export] Cloud fetch error:', e);
        }
    }

    // 2. Check local storage
    var local = getStudents();
    if (local && local.length > 0) return local;

    // 3. Fallback to Cloud if local had 0 students
    if (typeof sb_getStudents === 'function') {
        try {
            var cloudDataFallback = await sb_getStudents();
            if (cloudDataFallback && cloudDataFallback.length > 0) return cloudDataFallback;
        } catch (e) {
            console.warn('[Export] Cloud fallback fetch error:', e);
        }
    }

    // 4. Also try sb_loadFromCloud if available to sync
    if (typeof sb_loadFromCloud === 'function') {
        try {
            var res = await sb_loadFromCloud();
            if (res && res.ok && res.students && res.students.length > 0) {
                return res.students;
            }
        } catch (e) {
            console.warn('[Export] sb_loadFromCloud error:', e);
        }
    }

    return [];
}

function formatStudentForSupabase(s, idx) {
    var rawName = String(s.name || s.student_name || '').trim();
    var titleName = rawName.toLowerCase().split(' ').filter(Boolean).map(function (w) {
        return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(' ') || 'Student';

    // 2-Letter Uppercase Initials
    var parts = rawName.split(/\s+/).filter(Boolean);
    var avatar = 'AS';
    if (parts.length === 1 && parts[0].length >= 2) {
        avatar = parts[0].slice(0, 2).toUpperCase();
    } else if (parts.length > 1) {
        avatar = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length === 1) {
        avatar = (parts[0] + 'S').toUpperCase();
    }

    // Clean Phone (10 digits, strip +91, dashes, spaces)
    var phoneStr = String(s.phone || s.mobile || s.contact || '').replace(/[^0-9]/g, '');
    if (phoneStr.length > 10 && phoneStr.indexOf('91') === 0) {
        phoneStr = phoneStr.slice(2);
    }
    var phone = phoneStr.slice(-10);
    while (phone.length < 10) phone = '9' + phone;

    // Class Name
    var rawClass = String(s.class_name || s.class || '12').trim();
    var classGrade = rawClass.toLowerCase().indexOf('class') >= 0 ? rawClass : 'Class ' + rawClass;

    // Batch Name
    var batch = s.batch;
    if (!batch) {
        var numClass = parseInt(rawClass.replace(/[^0-9]/g, ''), 10);
        if (numClass === 12) batch = 'JEE Target (Batch A)';
        else if (numClass === 11) batch = 'Class 11 (CBSE)';
        else if (numClass === 10) batch = 'Class 10-A (CBSE)';
        else batch = 'Class ' + (numClass || 10) + ' Batch';
    }

    // Roll Number
    var rollNo = s.roll_no || s.rollNo;
    if (!rollNo || String(rollNo).trim().length === 0) {
        var year = new Date().getFullYear();
        var code = 'CBSE';
        var bUpper = (batch + ' ' + classGrade).toUpperCase();
        if (bUpper.indexOf('JEE') >= 0) code = 'JEE';
        else if (bUpper.indexOf('NEET') >= 0 || bUpper.indexOf('MED') >= 0) code = 'NEET';
        else if (bUpper.indexOf('10') >= 0) code = 'CBSE';
        else if (bUpper.indexOf('11') >= 0) code = 'CBSE11';
        else if (bUpper.indexOf('12') >= 0) code = 'CBSE12';

        var serial = String(idx + 1);
        while (serial.length < 4) serial = '0' + serial;
        rollNo = year + '-' + code + '-' + serial;
    }

    return {
        roll_no: String(rollNo).trim(),
        pin: s.pin && String(s.pin).length === 4 ? String(s.pin) : '1234',
        name: titleName,
        class_name: classGrade,
        batch: batch,
        avatar: avatar,
        phone: phone,
        streak: typeof s.streak === 'number' ? s.streak : 10,
        accuracy: typeof s.accuracy === 'number' ? s.accuracy : 85,
        tests_completed: typeof s.tests_completed === 'number' ? s.tests_completed : 14,
        top_percent: typeof s.top_percent === 'number' ? s.top_percent : 10
    };
}

window.exportSupabaseSQL = async function () {
    var btn = document.getElementById('exportSupabaseSqlBtn');
    var origHtml = btn ? btn.innerHTML : '';
    var status = document.getElementById('syncStatus');

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Fetching Data...';
    }
    if (status) {
        status.innerHTML = '<span class="text-info"><i class="fas fa-spinner fa-spin mr-1"></i>Gathering student records from storage...</span>';
    }

    try {
        var students = await getStudentsForSupabaseExport();
        if (!students || students.length === 0) {
            alert('No student records found in Local Storage or Cloud Storage.\n\nTip: If your data is in Google Sheets, click the "Pull" button first.');
            if (status) status.innerHTML = '<span class="text-warning"><i class="fas fa-exclamation-triangle mr-1"></i>No student records found to export.</span>';
            return;
        }

        var lines = [
            '--',
            '-- ==============================================================================--',
            '-- EduHome: Supabase Students & Companion Records Seed SQL',
            '-- Generated: ' + new Date().toISOString(),
            '-- Total Students: ' + students.length,
            '-- ==============================================================================--',
            'BEGIN;',
            ''
        ];

        students.forEach(function (raw, idx) {
            var s = formatStudentForSupabase(raw, idx);
            var escName = s.name.replace(/'/g, "''");
            var escClass = s.class_name.replace(/'/g, "''");
            var escBatch = s.batch.replace(/'/g, "''");

            lines.push('-- Student: ' + s.name + ' (' + s.roll_no + ')');
            lines.push(
                "INSERT INTO students (roll_no, pin, name, class_name, batch, avatar, phone, streak, accuracy, tests_completed, top_percent) " +
                "VALUES ('" + s.roll_no + "', '" + s.pin + "', '" + escName + "', '" + escClass + "', '" + escBatch + "', '" + s.avatar + "', '" + s.phone + "', " + s.streak + ", " + s.accuracy + ", " + s.tests_completed + ", " + s.top_percent + ") " +
                "ON CONFLICT (roll_no) DO UPDATE SET " +
                "name = EXCLUDED.name, class_name = EXCLUDED.class_name, batch = EXCLUDED.batch, phone = EXCLUDED.phone;"
            );
            lines.push(
                "INSERT INTO attendance_records (roll_no, overall, attended, total, today_subjects, history) " +
                "VALUES ('" + s.roll_no + "', 90, 45, 50, '[]'::jsonb, '[]'::jsonb) " +
                "ON CONFLICT (roll_no) DO NOTHING;"
            );
            lines.push(
                "INSERT INTO fees_records (roll_no, current_due, due_date, days_left, months_paid_on_time, loyalty_months, recent_payments) " +
                "VALUES ('" + s.roll_no + "', 1, '25 Sep 2026', 5, 2, '[]'::jsonb, '[]'::jsonb) " +
                "ON CONFLICT (roll_no) DO NOTHING;"
            );
            lines.push(
                "INSERT INTO progress_records (roll_no, tests_attended, highest_score, top_percent, total_students, improvement, accuracy, incorrect) " +
                "VALUES ('" + s.roll_no + "', 14, 92, 10, 1200, 15, 85, 15) " +
                "ON CONFLICT (roll_no) DO NOTHING;\n"
            );
        });

        lines.push('COMMIT;');
        var sqlStr = lines.join('\n');

        // Safe Download
        var blob = new Blob([sqlStr], { type: 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var filename = 'supabase_students_seed_' + new Date().toISOString().slice(0, 10) + '.sql';

        var link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        setTimeout(function () {
            if (link.parentNode) link.parentNode.removeChild(link);
            URL.revokeObjectURL(url);
        }, 5000);

        if (status) {
            status.innerHTML = '<span class="text-success"><i class="fas fa-check-circle mr-1"></i>Successfully exported ' + students.length + ' students to ' + filename + '!</span>';
        }
    } catch (err) {
        console.error('[Export Error]', err);
        alert('Export failed: ' + err.message);
        if (status) status.innerHTML = '<span class="text-danger"><i class="fas fa-exclamation-triangle mr-1"></i>Export failed: ' + err.message + '</span>';
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = origHtml;
        }
    }
};

window.exportSupabaseCSV = async function () {
    var btn = document.getElementById('exportSupabaseCsvBtn');
    var origHtml = btn ? btn.innerHTML : '';
    var status = document.getElementById('syncStatus');

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Fetching Data...';
    }
    if (status) {
        status.innerHTML = '<span class="text-info"><i class="fas fa-spinner fa-spin mr-1"></i>Gathering student records for CSV...</span>';
    }

    try {
        var students = await getStudentsForSupabaseExport();
        if (!students || students.length === 0) {
            alert('No student records found in Local Storage or Cloud Storage.\n\nTip: If your data is in Google Sheets, click the "Pull" button first.');
            if (status) status.innerHTML = '<span class="text-warning"><i class="fas fa-exclamation-triangle mr-1"></i>No student records found to export.</span>';
            return;
        }

        var escapeCsv = function (val) {
            var str = String(val == null ? '' : val);
            if (str.indexOf(',') >= 0 || str.indexOf('"') >= 0 || str.indexOf('\n') >= 0) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        };

        var headers = ['roll_no', 'pin', 'name', 'class_name', 'batch', 'avatar', 'phone', 'streak', 'accuracy', 'tests_completed', 'top_percent'];
        var rows = students.map(function (raw, idx) {
            var s = formatStudentForSupabase(raw, idx);
            return [
                escapeCsv(s.roll_no),
                escapeCsv(s.pin),
                escapeCsv(s.name),
                escapeCsv(s.class_name),
                escapeCsv(s.batch),
                escapeCsv(s.avatar),
                escapeCsv(s.phone),
                s.streak,
                s.accuracy,
                s.tests_completed,
                s.top_percent
            ].join(',');
        });

        var csvStr = [headers.join(','), rows.join('\n')].join('\n');
        var blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var filename = 'supabase_students_' + new Date().toISOString().slice(0, 10) + '.csv';

        var link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        setTimeout(function () {
            if (link.parentNode) link.parentNode.removeChild(link);
            URL.revokeObjectURL(url);
        }, 5000);

        if (status) {
            status.innerHTML = '<span class="text-success"><i class="fas fa-check-circle mr-1"></i>Successfully exported ' + students.length + ' students to ' + filename + '!</span>';
        }
    } catch (err) {
        console.error('[Export Error]', err);
        alert('CSV Export failed: ' + err.message);
        if (status) status.innerHTML = '<span class="text-danger"><i class="fas fa-exclamation-triangle mr-1"></i>CSV export failed: ' + err.message + '</span>';
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = origHtml;
        }
    }
};

window.sendExportToWhatsApp = function () {
    const students = getStudents();
    if (students.length === 0) {
        alert('No students found to send.');
        return;
    }

    // Sort by class then name
    const sorted = students.slice().sort(function (a, b) {
        if (a.class !== b.class) return (parseInt(a.class) || 0) - (parseInt(b.class) || 0);
        return a.name.localeCompare(b.name);
    });

    // Group by class
    const byClass = {};
    sorted.forEach(function (s) {
        if (!byClass[s.class]) byClass[s.class] = [];
        byClass[s.class].push(s);
    });

    let msg = '*📋 Edu Home — Student Export*\n';
    msg += 'Date: ' + new Date().toLocaleDateString('en-IN') + '\n';
    msg += 'Total Students: ' + students.length + '\n\n';

    Object.keys(byClass).sort(function (a, b) { return (parseInt(a) || 0) - (parseInt(b) || 0); }).forEach(function (cls) {
        msg += '━━━━━━━━━━━━━━━━━━\n';
        msg += '🏫 *Class ' + cls + '* (' + byClass[cls].length + ' students)\n';
        msg += '━━━━━━━━━━━━━━━━━━\n';
        byClass[cls].forEach(function (s, i) {
            msg += (i + 1) + '. *' + s.name + '*\n';
            msg += '   📱 ' + s.phone + '\n';
            msg += '   📚 ' + (s.subjects && s.subjects.length ? s.subjects.join(', ') : '-') + '\n';
            msg += '   💰 ₹' + (s.amount || '-') + '/month\n';
            if (s.school) msg += '   🏛 ' + s.school + '\n';
            if (s.joiningDate) msg += '   📅 Joined: ' + new Date(s.joiningDate).toLocaleDateString('en-IN') + '\n';
            msg += '\n';
        });
    });

    // WhatsApp has a URL length limit; warn if too long
    const encoded = encodeURIComponent(msg);
    if (encoded.length > 4000) {
        alert('⚠️ Data is very large for WhatsApp. Consider downloading the JSON file instead.\n\nOpening WhatsApp with the summary anyway...');
    }
    window.open('https://wa.me/?text=' + encoded, '_blank');
};

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


// Helper: sync a student object to cloud if the client is available
function _syncStudentToCloud(student) {
    if (typeof sb_saveStudent === 'function') {
        sb_saveStudent(student).then(function (ok) {
            if (ok) {
                _showSyncToast('✅ Synced to cloud');
            } else {
                _showSyncToast('⚠️ Cloud sync failed — saved locally', true);
            }
        });
    }
}

// Helper: show a small non-blocking toast for sync status
function _showSyncToast(msg, isError) {
    // Remove any existing toast
    var old = document.getElementById('_syncToast');
    if (old) old.remove();

    var toast = document.createElement('div');
    toast.id = '_syncToast';
    toast.textContent = msg;
    toast.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:10px 18px;border-radius:8px;font-size:0.85rem;font-weight:600;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:opacity 0.3s;'
        + (isError ? 'background:#fff3cd;color:#856404;' : 'background:#d4edda;color:#155724;');
    document.body.appendChild(toast);
    setTimeout(function () {
        toast.style.opacity = '0';
        setTimeout(function () { toast.remove(); }, 300);
    }, 2500);
}

if (document.getElementById('addStudentForm')) {
    document.getElementById('addStudentForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const id = document.getElementById('studentId').value;
        const name = document.getElementById('name').value;
        const studentClass = document.getElementById('class').value;
        const school = document.getElementById('school').value;
        const phone = document.getElementById('phone').value;
        const joiningDate = document.getElementById('joiningDate').value;
        const amount = document.getElementById('amount').value;

        // Get selected subjects
        const subjects = [];
        document.querySelectorAll('input[name="subject"]:checked').forEach((checkbox) => {
            subjects.push(checkbox.value);
        });

        const students = getStudents();
        let studentToSync = null;

        if (id) {
            // EDIT MODE
            const index = students.findIndex(s => s.id === id);
            if (index !== -1) {
                students[index] = {
                    ...students[index],
                    name, class: studentClass, school, phone, joiningDate, amount, subjects
                };
                studentToSync = students[index];
                alert('Student Updated Successfully!');
            }
        } else {
            // ADD MODE
            const newStudent = {
                id: Date.now().toString(),
                name, class: studentClass, school, phone, joiningDate, amount, subjects
            };
            students.push(newStudent);
            studentToSync = newStudent;
            alert('Student Added Successfully!');
        }

        saveStudents(students);

        // ── Sync to Cloud ──────────────────────────────
        if (studentToSync) _syncStudentToCloud(studentToSync);

        e.target.reset();
        document.getElementById('studentId').value = '';
        document.getElementById('submitStudentBtn').innerText = 'Add Student';
        document.querySelectorAll('input[name="subject"]').forEach(cb => cb.checked = false);
        
        if (typeof window.manualFeeOverride !== 'undefined') {
            window.manualFeeOverride = false;
        }
        const hint = document.getElementById('feeHint');
        if (hint) hint.textContent = 'Select class and subjects to auto-fill fee.';
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
            (Array.isArray(student.subjects) && student.subjects.length > 0 ? student.subjects : ['General']).forEach(sub => {
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
                    // Check logic for ALL pending months
                    // We need to calculate this dynamically here or helper?
                    // Let's do a meaningful check here.

                    const pendingInfo = getPendingDues(student, fees);
                    const pendingMonths = pendingInfo.months.join(', ');
                    const pendingSubjects = pendingInfo.subjects.join(', ');
                    const amountMsg = student.amount ? `Amount per month: ₹${student.amount}` : 'Amount: Not Set';

                    const msg = `Dear Parent, fee for student *${student.name}* (Class ${student.class}) is pending.\n\n` +
                        `*Pending Months:* ${pendingMonths}\n` +
                        `*Subjects:* ${pendingSubjects}\n` +
                        `*${amountMsg}*\n\n` +
                        `Please pay at the earliest.`;

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

    function getPendingDues(student, fees) {
        if (!student.joiningDate) return { months: [], subjects: [] };

        const joinDate = new Date(student.joiningDate);
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonthIndex = now.getMonth();

        const pendingMonths = [];
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        // Iterate from Join Month/Year to Current Month/Year
        let iterDate = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);
        const endDate = new Date(currentYear, currentMonthIndex, 1);

        while (iterDate <= endDate) {
            const mIndex = iterDate.getMonth();
            const y = iterDate.getFullYear();
            const mName = monthNames[mIndex];

            // Check if ANY subject is pending for this month
            let isMonthPending = false;
            student.subjects.forEach(sub => {
                const key = `${student.id}_${sub}_${mName}_${y}`;
                if (fees[key] !== 'Paid') {
                    isMonthPending = true;
                }
            });

            if (isMonthPending) {
                pendingMonths.push(`${mName} ${y}`);
            }

            // Next month
            iterDate.setMonth(iterDate.getMonth() + 1);
        }

        return {
            months: pendingMonths,
            subjects: student.subjects // Return all subjects they take, as user requested "if he has other subjects it hsould go in after ','"
        };
    }

    window.toggleFee = function (studentId, subject, month, year) {
        const key = `${studentId}_${subject}_${month}_${year}`;
        const fees = getFees();
        var newStatus;
        if (fees[key] === 'Paid') {
            delete fees[key]; // Toggle back to pending
            newStatus = 'Pending';
        } else {
            fees[key] = 'Paid';
            newStatus = 'Paid';
        }
        saveFees(fees);
        loadFeeTable(); // Refresh UI immediately

        // ── Auto-sync fee change to cloud (fire-and-forget) ──
        if (typeof sb_toggleFee === 'function') {
            sb_toggleFee(studentId, subject, month, year, newStatus).then(function () {
                if (typeof _showSyncToast === 'function') _showSyncToast('✅ Fee synced');
            }).catch(function () {
                if (typeof _showSyncToast === 'function') _showSyncToast('⚠️ Fee sync failed — saved locally', true);
            });
        }
    };

    // Expose for cloud sync refresh
    window.loadFeeTable = loadFeeTable;

    // Initial load
    loadFeeTable();
}


// --- TIMETABLE PAGE ---
if (document.getElementById('timetableTableBody')) {
    const timetableEntries = [];
    window.timetableEntries = timetableEntries;
    const tableBody = document.getElementById('timetableTableBody');
    const shareBtn = document.getElementById('shareWhatsappBtn');

    // ── Board dropdown auto-hide for class 11/12 ──────────────────────
    const classSelect = document.getElementById('timetableClass');
    const boardGroup = document.getElementById('boardGroup');
    const boardSelect = document.getElementById('timetableBoard');

    function updateBoardVisibility() {
        const cls = classSelect.value;
        const isHigher = (cls === '11' || cls === '12');
        if (isHigher) {
            boardGroup.classList.add('hidden-smooth');
            boardSelect.value = 'Both'; // default for 11/12
        } else {
            boardGroup.classList.remove('hidden-smooth');
        }
    }

    classSelect.addEventListener('change', updateBoardVisibility);
    // Run once on load
    updateBoardVisibility();

    // ── Clock Time Picker Component ───────────────────────────────────
    (function initClockPicker() {
        // Build DOM
        const overlay = document.createElement('div');
        overlay.className = 'clock-picker-overlay';
        overlay.innerHTML = `
            <div class="clock-picker-modal">
                <div class="clock-picker-header">
                    <h3>Select Time</h3>
                    <div class="clock-picker-display">
                        <span class="clock-display-segment active" id="cpHourDisplay">01</span>
                        <span class="clock-display-colon">:</span>
                        <span class="clock-display-segment inactive" id="cpMinDisplay">00</span>
                        <div class="clock-ampm-toggle">
                            <button class="clock-ampm-btn" id="cpAmBtn">AM</button>
                            <button class="clock-ampm-btn active" id="cpPmBtn">PM</button>
                        </div>
                    </div>
                </div>
                <div class="clock-face-container">
                    <div class="clock-face" id="cpClockFace">
                        <div class="clock-center-dot"></div>
                        <div class="clock-hand" id="cpHand"></div>
                    </div>
                </div>
                <div class="clock-picker-actions">
                    <button class="clock-btn-cancel" id="cpCancel">Cancel</button>
                    <button class="clock-btn-ok" id="cpOk">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // State
        let cpMode = 'hour'; // 'hour' or 'minute'
        let cpHour = 1;
        let cpMinute = 0;
        let cpAmPm = 'PM';
        let cpTargetInput = null;

        const hourDisplay = document.getElementById('cpHourDisplay');
        const minDisplay = document.getElementById('cpMinDisplay');
        const amBtn = document.getElementById('cpAmBtn');
        const pmBtn = document.getElementById('cpPmBtn');
        const clockFace = document.getElementById('cpClockFace');
        const hand = document.getElementById('cpHand');

        // Clock geometry
        const FACE_SIZE = 244;
        const CENTER = FACE_SIZE / 2;
        const RADIUS = 96; // distance from center to number centers
        const NUM_SIZE = 40;

        function positionNumbers(values, count) {
            // Clear old numbers
            clockFace.querySelectorAll('.clock-number').forEach(n => n.remove());

            values.forEach((val, i) => {
                const angle = ((i * (360 / count)) - 90) * Math.PI / 180;
                const x = CENTER + RADIUS * Math.cos(angle) - (NUM_SIZE / 2);
                const y = CENTER + RADIUS * Math.sin(angle) - (NUM_SIZE / 2);

                const el = document.createElement('div');
                el.className = 'clock-number';
                el.textContent = val.toString().padStart(2, '0');
                el.style.left = x + 'px';
                el.style.top = y + 'px';
                el.dataset.value = val;

                if (cpMode === 'hour' && val === cpHour) el.classList.add('selected');
                if (cpMode === 'minute' && val === cpMinute) el.classList.add('selected');

                el.addEventListener('click', function () {
                    if (cpMode === 'hour') {
                        cpHour = parseInt(this.dataset.value);
                        updateDisplay();
                        // Auto-switch to minute mode after selecting hour
                        setTimeout(() => switchMode('minute'), 250);
                    } else {
                        cpMinute = parseInt(this.dataset.value);
                        updateDisplay();
                    }
                });

                clockFace.appendChild(el);
            });

            updateHand();
        }

        function updateHand() {
            let selectedVal, totalSteps;
            if (cpMode === 'hour') {
                selectedVal = cpHour;
                totalSteps = 12;
                // Hour position: 12 is at top (index 0), 1 at index 1, etc.
                const index = selectedVal === 12 ? 0 : selectedVal;
                const angleDeg = index * 30;
                hand.style.height = RADIUS + 'px';
                hand.style.transform = `rotate(${angleDeg}deg)`;
            } else {
                selectedVal = cpMinute;
                totalSteps = 60;
                const angleDeg = selectedVal * 6;
                hand.style.height = RADIUS + 'px';
                hand.style.transform = `rotate(${angleDeg}deg)`;
            }
        }

        function updateDisplay() {
            hourDisplay.textContent = cpHour.toString().padStart(2, '0');
            minDisplay.textContent = cpMinute.toString().padStart(2, '0');

            hourDisplay.className = 'clock-display-segment ' + (cpMode === 'hour' ? 'active' : 'inactive');
            minDisplay.className = 'clock-display-segment ' + (cpMode === 'minute' ? 'active' : 'inactive');

            amBtn.className = 'clock-ampm-btn' + (cpAmPm === 'AM' ? ' active' : '');
            pmBtn.className = 'clock-ampm-btn' + (cpAmPm === 'PM' ? ' active' : '');

            // Update selected number highlight
            clockFace.querySelectorAll('.clock-number').forEach(n => {
                const v = parseInt(n.dataset.value);
                if (cpMode === 'hour') {
                    n.classList.toggle('selected', v === cpHour);
                } else {
                    n.classList.toggle('selected', v === cpMinute);
                }
            });

            updateHand();
        }

        function switchMode(mode) {
            cpMode = mode;
            if (mode === 'hour') {
                const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
                positionNumbers(hours, 12);
            } else {
                const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
                positionNumbers(minutes, 12);
            }
            updateDisplay();
        }

        function openPicker(inputEl) {
            cpTargetInput = inputEl;
            // Parse existing value if any (format: "HH:MM")
            const existing = inputEl.value;
            if (existing && existing.includes(':')) {
                const [h, m] = existing.split(':').map(Number);
                cpAmPm = h >= 12 ? 'PM' : 'AM';
                cpHour = h % 12 || 12;
                cpMinute = m;
            } else {
                cpHour = 1;
                cpMinute = 0;
                cpAmPm = 'PM';
            }
            cpMode = 'hour';
            switchMode('hour');
            overlay.classList.add('active');
        }

        function closePicker() {
            overlay.classList.remove('active');
            cpTargetInput = null;
        }

        // Convert to 24h and set value
        function confirmTime() {
            let h24 = cpHour;
            if (cpAmPm === 'AM' && h24 === 12) h24 = 0;
            if (cpAmPm === 'PM' && h24 !== 12) h24 += 12;
            const timeStr = h24.toString().padStart(2, '0') + ':' + cpMinute.toString().padStart(2, '0');

            if (cpTargetInput) {
                // Display in 12h format for user
                const displayStr = cpHour + ':' + cpMinute.toString().padStart(2, '0') + ' ' + cpAmPm;
                cpTargetInput.value = timeStr;
                cpTargetInput.dataset.display = displayStr;
            }
            closePicker();
        }

        // Event listeners
        hourDisplay.addEventListener('click', () => switchMode('hour'));
        minDisplay.addEventListener('click', () => switchMode('minute'));
        amBtn.addEventListener('click', () => { cpAmPm = 'AM'; updateDisplay(); });
        pmBtn.addEventListener('click', () => { cpAmPm = 'PM'; updateDisplay(); });
        document.getElementById('cpCancel').addEventListener('click', closePicker);
        document.getElementById('cpOk').addEventListener('click', confirmTime);

        // Close on overlay click (outside modal)
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closePicker();
        });

        // Hook into time inputs
        const startInput = document.getElementById('timetableStartTime');
        const endInput = document.getElementById('timetableEndTime');
        if (startInput) startInput.addEventListener('click', () => openPicker(startInput));
        if (endInput) endInput.addEventListener('click', () => openPicker(endInput));
    })();

    // ── Add Entry ─────────────────────────────────────────────────────
    document.getElementById('addTimetableEntryBtn').addEventListener('click', function () {
        const date = document.getElementById('timetableDate').value;
        const startTime = document.getElementById('timetableStartTime').value;
        const endTime = document.getElementById('timetableEndTime').value;
        const studentClass = document.getElementById('timetableClass').value;
        const subject = document.getElementById('timetableSubject').value;
        const locationElement = document.getElementById('timetableLocation');
        const location = locationElement ? locationElement.value : 'In Center';
        const board = boardSelect ? boardSelect.value : 'Both';
        const sessionTypeEl = document.getElementById('timetableSessionType');
        const sessionType = sessionTypeEl ? sessionTypeEl.value : 'Regular';

        if (!date || !startTime || !endTime || !studentClass || !subject) {
            alert("Please fill in all fields: Date, Start Time, End Time, Class and Subject are mandatory.");
            return;
        }

        const entry = { date, startTime, endTime, class: studentClass, subject, location, board, sessionType };
        timetableEntries.push(entry);
        renderTimetable();

        // Don't clear date to make adding multiple slots for same day easier
        document.getElementById('timetableStartTime').value = '';
        document.getElementById('timetableEndTime').value = '';
        document.getElementById('timetableSubject').value = 'Physics';
        if (locationElement) locationElement.value = 'In Center';
        if (sessionTypeEl) sessionTypeEl.value = 'Regular';
    });

    // ── Helpers ───────────────────────────────────────────────────────
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

        const dateFormatted = new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

        if (inputDate.getTime() === today.getTime()) {
            return `Today (${dateFormatted})`;
        } else if (inputDate.getTime() === tomorrow.getTime()) {
            return `Tomorrow (${dateFormatted})`;
        } else {
            return dateFormatted;
        }
    }

    function formatTime12Hour(timeString) {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const h = parseInt(hours, 10);
        const m = parseInt(minutes, 10);
        
        let timeOfDay = '';
        if (h >= 5 && h < 12) timeOfDay = 'Morning';
        else if (h >= 12 && h < 16) timeOfDay = 'Afternoon';
        else if (h >= 16 && h < 20) timeOfDay = 'Evening';
        else timeOfDay = 'Night';

        const h12 = h % 12 || 12;
        return `${h12}:${m < 10 ? '0' + m : m} (${timeOfDay})`;
    }

    function getSubjectWithEmoji(subject) {
        if (!subject) return '';
        switch (subject.toLowerCase()) {
            case 'physics': return '💡 Physics';
            case 'biology': return '🧬 Biology';
            case 'chemistry': return '🧪 Chemistry';
            case 'computer science': return '💻 Computer Science';
            case 'maths': return '📐 Maths';
            default: return `📖 ${subject}`;
        }
    }

    function getBoardBadge(board) {
        switch (board) {
            case 'CBSE':  return '<span class="badge-board badge-cbse">CBSE</span>';
            case 'State': return '<span class="badge-board badge-state">State</span>';
            case 'Both':
            default:      return '<span class="badge-board badge-both">Both</span>';
        }
    }

    function getSessionBadge(sessionType) {
        switch (sessionType) {
            case 'TP':           return '<span class="badge-session badge-tp">🎯 TP Session</span>';
            case 'QuestionBank': return '<span class="badge-session badge-qb">📝 Question Bank</span>';
            case 'Regular':
            default:             return '<span class="badge-session badge-regular">📖 Regular</span>';
        }
    }

    function getSessionEmoji(sessionType) {
        switch (sessionType) {
            case 'TP':           return '🎯 TP Session';
            case 'QuestionBank': return '📝 Question Bank';
            case 'Regular':
            default:             return '📖 Regular Class';
        }
    }

    function getBoardEmoji(board) {
        switch (board) {
            case 'CBSE':  return '🔵 CBSE';
            case 'State': return '🟢 State';
            case 'Both':
            default:      return '🟣 Both';
        }
    }

    // ── Render Table ──────────────────────────────────────────────────
    function renderTimetable() {
        tableBody.innerHTML = '';
        if (timetableEntries.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No entries added.</td></tr>';
            document.getElementById('shareSection').style.display = 'none';
            return;
        }

        // Sort by Date then Class (descending) then Start Time
        timetableEntries.sort((a, b) => {
            if (a.date !== b.date) {
                return new Date(a.date) - new Date(b.date);
            }
            const classA = parseInt(a.class) || 0;
            const classB = parseInt(b.class) || 0;
            if (classA !== classB) {
                return classB - classA;
            }
            const timeA = a.startTime || '00:00';
            const timeB = b.startTime || '00:00';
            return timeA.localeCompare(timeB);
        });

        timetableEntries.forEach((entry, index) => {
            const dateDisplay = formatDateFriendly(entry.date);

            let timeRange = '';
            if (entry.startTime && entry.endTime) {
                timeRange = `${formatTime12Hour(entry.startTime)} - ${formatTime12Hour(entry.endTime)}`;
            } else if (entry.startTime) {
                timeRange = formatTime12Hour(entry.startTime);
            } else {
                timeRange = '-';
            }

            let locStr = entry.location === 'At Home'
                ? '<br><small class="text-danger">(At Home)</small>'
                : '<br><small class="text-success">(In Center)</small>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dateDisplay}</td>
                <td>${timeRange}</td>
                <td>${entry.class}</td>
                <td>${getBoardBadge(entry.board)}</td>
                <td>${getSubjectWithEmoji(entry.subject)}${locStr}</td>
                <td>${getSessionBadge(entry.sessionType)}</td>
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

    // ── WhatsApp Share ────────────────────────────────────────────────
    shareBtn.addEventListener('click', function () {
        if (timetableEntries.length === 0) {
            alert("No entries to share.");
            return;
        }

        let message = `*Class Schedule*\n\n`;

        // Group by Date, then by Class
        const grouped = {};
        timetableEntries.forEach(entry => {
            const dateDisplay = formatDateFriendly(entry.date);
            if (!grouped[dateDisplay]) {
                grouped[dateDisplay] = {};
            }
            if (!grouped[dateDisplay][entry.class]) {
                grouped[dateDisplay][entry.class] = [];
            }
            grouped[dateDisplay][entry.class].push(entry);
        });

        const dates = Object.keys(grouped);
        dates.forEach((dateDisplay, dateIndex) => {
            message += `*${dateDisplay}*\n\n`;

            // Sort classes descending (12, 11, etc.)
            const classes = Object.keys(grouped[dateDisplay]).sort((a, b) => {
                return (parseInt(b) || 0) - (parseInt(a) || 0);
            });

            classes.forEach((cls, classIndex) => {
                message += `🏫 *Class ${cls}*\n`;

                // Sort entries for this class by time
                const entries = grouped[dateDisplay][cls].sort((a, b) => {
                    const timeA = a.startTime || '00:00';
                    const timeB = b.startTime || '00:00';
                    return timeA.localeCompare(timeB);
                });

                entries.forEach(entry => {
                    let timeStr = '';
                    if (entry.startTime && entry.endTime) {
                        timeStr = `${formatTime12Hour(entry.startTime)} - ${formatTime12Hour(entry.endTime)}`;
                    } else if (entry.startTime) {
                        timeStr = formatTime12Hour(entry.startTime);
                    } else {
                        timeStr = '-';
                    }

                    let locStr = entry.location === 'At Home' ? '🏠 At Home' : '🏢 In Center';
                    let boardStr = getBoardEmoji(entry.board || 'Both');
                    let sessionStr = getSessionEmoji(entry.sessionType || 'Regular');

                    message += `🕒 ${timeStr}\n`;
                    message += `${getSubjectWithEmoji(entry.subject)}\n`;
                    message += `📋 Board: ${boardStr}\n`;
                    message += `📌 Type: ${sessionStr}\n`;
                    message += `📍 ${locStr}\n\n`;
                });

                if (classIndex < classes.length - 1) {
                    message += `-------------------\n`;
                }
            });

            if (dateIndex < dates.length - 1) {
                message += `\n\n`;
            }
        });

        // Open WhatsApp with text to specific number using wa.me
        const whatsappUrl = `https://wa.me/918547457536?text=${encodeURIComponent(message)}`;
        window.location.href = whatsappUrl;
    });


    



    // --- SHARE TIMETABLE TO MOBILE APP (STUDENT & FACULTY SYNC) ---
        // --- SHARE TIMETABLE TO MOBILE APP (STUDENT & FACULTY SYNC) ---
    window.shareTimetableToApp = async function () {
        const entries = (typeof timetableEntries !== 'undefined' && timetableEntries.length > 0) 
            ? timetableEntries 
            : (window.timetableEntries || []);

        if (!entries || entries.length === 0) {
            alert("Please add at least one timetable entry to share.");
            return;
        }

        const shareBtn = document.getElementById('shareAppBtn');
        if (shareBtn) {
            shareBtn.disabled = true;
            shareBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Sharing to App...';
        }

        try {
            const sb = _getSupabaseClient();
            if (!sb) {
                alert("Database connection not ready. Please check your network and try again.");
                if (shareBtn) {
                    shareBtn.disabled = false;
                    shareBtn.innerHTML = '<i class="fas fa-paper-plane mr-1"></i> Share Timetable to Mobile App';
                }
                return;
            }

            function to12Hr(t) {
                if (!t) return '';
                const parts = t.split(':');
                const h = parseInt(parts[0], 10);
                const m = parseInt(parts[1] || '0', 10);
                const ampm = h >= 12 ? 'PM' : 'AM';
                const h12 = h % 12 || 12;
                return h12 + ':' + (m < 10 ? '0' + m : m) + ' ' + ampm;
            }

            const rowsToInsert = [];
            const announcementsToInsert = [];

            for (const entry of entries) {
                let timeStr = '';
                if (entry.startTime && entry.endTime) {
                    timeStr = to12Hr(entry.startTime) + ' - ' + to12Hr(entry.endTime);
                } else if (entry.startTime) {
                    timeStr = to12Hr(entry.startTime);
                } else {
                    timeStr = 'Scheduled';
                }

                const rawCls = String(entry.class || '').trim();
                const gradeStr = rawCls.startsWith('Class') ? rawCls : 'Class ' + rawCls;

                // 1. Cleanly delete any existing entries for this class, date and subject
                // (Clears both class-level entries and legacy per-student rows)
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
                    .eq('subject', entry.subject);

                // 2. Insert EXACTLY ONE row per class session (not per-student duplicates!)
                rowsToInsert.push({
                    roll_no: gradeStr,
                    class_grade: gradeStr,
                    subject: entry.subject,
                    time: timeStr,
                    status: 'upcoming',
                    published: true,
                    class_date: entry.date,
                });

                announcementsToInsert.push({
                    title: '🗓️ Timetable: ' + gradeStr + ' - ' + entry.subject,
                    description: 'Date: ' + formatDateFriendly(entry.date) + ' | Time: ' + timeStr + ' | Venue: ' + (entry.location || 'In Center') + ' (' + (entry.board || 'Both') + ' Board). Check your schedule tab.',
                    author: 'Center Admin',
                    tag: 'Timetable',
                    important: true,
                });
            }

            // 1. Insert into Supabase classes table
            const { error: classErr } = await sb.from('classes').insert(rowsToInsert);
            if (classErr) {
                console.error('Error inserting classes:', classErr);
                throw classErr;
            }

            // 2. Broadcast announcement so mobile alerts fire instantly
            if (announcementsToInsert.length > 0) {
                await sb.from('announcements').insert(announcementsToInsert);
            }

            alert('✅ Timetable Successfully Shared to Mobile App!\n\n' + rowsToInsert.length + ' class schedule session(s) published.\nAll students in the class and faculty will see this schedule on their live dashboard.');
        } catch (e) {
            console.error('Failed to share timetable:', e);
            alert("Failed to share timetable to mobile app: " + (e.message || e));
        } finally {
            if (shareBtn) {
                shareBtn.disabled = false;
                shareBtn.innerHTML = '<i class="fas fa-paper-plane mr-1"></i> Share Timetable to Mobile App';
            }
        }
    };
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
            shareBtn.style.display = 'none'; const saveCloudBtn2 = document.getElementById('saveAttendanceCloudBtn'); if (saveCloudBtn2) saveCloudBtn2.style.display = 'none';
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

        shareBtn.style.display = 'inline-block'; const saveCloudBtn = document.getElementById('saveAttendanceCloudBtn'); if (saveCloudBtn) saveCloudBtn.style.display = 'inline-block';
        attTable.innerHTML = '';

        filtered.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${s.name}</td>
                <td>
                    <div style="display:flex; flex-direction: column;">
                        <div style="display:flex; align-items:center; margin-bottom: 5px;">
                            <div class="custom-control custom-switch mr-2">
                                <input type="checkbox" class="custom-control-input" id="att_${s.id}" checked onchange="togglePresent('${s.id}')">
                                <label class="custom-control-label" for="att_${s.id}">Present</label>
                            </div>
                            <button class="btn btn-sm btn-outline-warning" id="late_btn_${s.id}" onclick="showLateInput('${s.id}')" type="button">Late?</button>
                        </div>
                        
                        <div id="late_input_group_${s.id}" style="display:none; align-items:center;">
                            <input type="text" class="form-control form-control-sm mr-1" id="late_time_${s.id}" placeholder="Late time (e.g. 15m)" style="width: 120px;">
                            <button class="btn btn-sm btn-success mr-1" onclick="saveLate('${s.id}')" type="button">✓</button>
                            <button class="btn btn-sm btn-danger" onclick="cancelLate('${s.id}')" type="button">×</button>
                        </div>
                        <span id="late_badge_${s.id}" class="badge badge-warning" style="display:none; align-self: flex-start;"></span>
                    </div>
                </td>
            `;
            attTable.appendChild(tr);
        });
    }

    // Attendance Helpers
    window.togglePresent = function (id) {
        const cb = document.getElementById(`att_${id}`);
        const lateBtn = document.getElementById(`late_btn_${id}`);
        const lateGroup = document.getElementById(`late_input_group_${id}`);
        const lateBadge = document.getElementById(`late_badge_${id}`);
        const lateInput = document.getElementById(`late_time_${id}`);

        if (!cb.checked) {
            // Absent: Hide all late controls
            lateBtn.style.display = 'none';
            lateGroup.style.display = 'none';
            lateBadge.style.display = 'none';
            lateInput.value = '';
        } else {
            // Present: Show Late button (if not already marked late)
            if (lateInput.value === '') {
                lateBtn.style.display = 'inline-block';
                lateBadge.style.display = 'none';
            } else {
                // Already marked late
                lateBadge.style.display = 'inline-block';
            }
        }
    };

    window.showLateInput = function (id) {
        document.getElementById(`late_btn_${id}`).style.display = 'none';
        document.getElementById(`late_input_group_${id}`).style.display = 'flex';
        // Auto-focus logic
        setTimeout(() => document.getElementById(`late_time_${id}`).focus(), 100);
    };

    window.saveLate = function (id) {
        const time = document.getElementById(`late_time_${id}`).value;
        if (time && time.trim() !== '') {
            document.getElementById(`late_input_group_${id}`).style.display = 'none';
            const badge = document.getElementById(`late_badge_${id}`);
            badge.innerText = `Late: ${time}`;
            badge.style.display = 'inline-block';
        } else {
            // Treat as cancel if empty
            cancelLate(id);
        }
    };

    window.cancelLate = function (id) {
        document.getElementById(`late_input_group_${id}`).style.display = 'none';
        document.getElementById(`late_time_${id}`).value = ''; // Clear
        document.getElementById(`late_btn_${id}`).style.display = 'inline-block';
    };

    if (attDate) attDate.addEventListener('change', updateAttendanceView);
    if (attSubject) attSubject.addEventListener('change', updateAttendanceView);
    if (attClass) attClass.addEventListener('change', updateAttendanceView);

    if (shareBtn) {
        shareBtn.addEventListener('click', function () {
            if (!attDate.value || !attSubject.value) {
                alert("Please select Date and Subject before sharing.");
                return;
            }

            // Date Formatting
            const dateObj = new Date(attDate.value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dateObjMidnight = new Date(dateObj);
            dateObjMidnight.setHours(0, 0, 0, 0);

            let dateString = '';
            if (dateObjMidnight.getTime() === today.getTime()) {
                dateString = "Today's";
            } else if (dateObjMidnight.getTime() === today.getTime() - 86400000) {
                dateString = "Yesterday's";
            } else {
                // dd-mm-yyyy format
                const d = dateObj.getDate().toString().padStart(2, '0');
                const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                const y = dateObj.getFullYear();
                dateString = `${d}-${m}-${y}`;
            }

            // Construct Text Message
            let message = `*${dateString} Attendance Report*\n`;
            if (dateString !== "Today's" && dateString !== "Yesterday's") {
                // For specific dates, we already have it in the title, but redundant to add line? 
                // User said "attendance report date must be in 12-02-2026", "not like the reverse".
                // Let's keep it simple.
            } else {
                // If Today/Yesterday, maybe add specific date in brackets? Or just leave as is. User said "Today's attendance report...".
                const d = dateObj.getDate().toString().padStart(2, '0');
                const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                const y = dateObj.getFullYear();
                message += `Date: ${d}-${m}-${y}\n`;
            }
            if (dateString !== "Today's" && dateString !== "Yesterday's") {
                // If not today/yesterday, the title is "12-02-2026 Attendance Report", so no need for extra date line?
                // Actually, "12-02-2026 Attendance Report" is a bit weird.
                // Let's stick to standard user request: "Attendance Report (12-02-2026)"
                message = `*Attendance Report (${dateString})*\n`;
            }
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

                    if (isPresent) {
                        presentCount++;
                        const id = checkbox.id.split('_')[1];
                        const lateTimeInput = document.getElementById(`late_time_${id}`);
                        const lateTime = lateTimeInput ? lateTimeInput.value : '';

                        if (lateTime) {
                            message += `${index + 1}. ${name}: ⚠️ Present (Late: ${lateTime})\n`;
                        } else {
                            message += `${index + 1}. ${name}: ✅ Present\n`;
                        }
                    } else {
                        message += `${index + 1}. ${name}: ❌ Absent\n`;
                    }
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
    async function renderStudentManagementList() {
        const tbody = document.getElementById('studentListBody');
        const toggle = document.getElementById('sourceToggleSwitch');
        const isCloud = toggle ? toggle.checked : false;
        
        tbody.innerHTML = '<tr><td colspan="6" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
        
        let students = [];
        if (isCloud) {
            if (typeof sb_getStudents === 'function') {
                const cloudData = await sb_getStudents();
                if (cloudData) {
                    students = cloudData;
                } else {
                    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger"><i class="fas fa-exclamation-triangle"></i> Failed to fetch from Cloud. Check console for errors.</td></tr>';
                    return;
                }
            } else {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger"><i class="fas fa-exclamation-triangle"></i> Cloud sync not available.</td></tr>';
                return;
            }
        } else {
            students = getStudents();
        }

        tbody.innerHTML = '';

        if (students.length === 0) {
            if (isCloud) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No students found in Cloud. Try pushing your local data first.</td></tr>';
            } else {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No students found in Local Storage.</td></tr>';
            }
            return;
        }

        // (Removed data-level search filtering. Search is now handled by DOM filtering in filterStudentTable)

        // Sort by class then name
        students.sort((a, b) => {
            if (a.class !== b.class) return (parseInt(a.class)||0) - (parseInt(b.class)||0);
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
                <td>₹${s.amount || '-'}</td>
                <td>${s.phone}</td>
                <td>${Array.isArray(s.subjects) && s.subjects.length > 0 ? s.subjects.join(', ') : (typeof s.subjects === 'string' ? s.subjects : 'General')}</td>
                <td>
                    ${isCloud ? `<span class="badge badge-secondary">Read-only in Cloud View</span>` : `
                    <button class="btn btn-sm btn-info mb-1" onclick="editStudent('${s.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="askDeleteStudent('${s.id}', this)">Delete</button>
                    `}
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Re-apply any active search filter
        if (typeof filterStudentTable === 'function') filterStudentTable();
    }

    // --- INSTANT DOM SEARCH FILTER ---
    window.filterStudentTable = function() {
        const searchInput = document.getElementById('studentSearchInput');
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const tbody = document.getElementById('studentListBody');
        if (!tbody) return;

        const rows = tbody.getElementsByTagName('tr');
        let visibleCount = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            // Skip special status rows (like "Loading..." or "No students found")
            if (row.cells.length === 1 && row.cells[0].colSpan === 6 && row.id !== 'noMatchRow') continue;
            if (row.id === 'noMatchRow') continue;

            const textContent = row.textContent.toLowerCase();
            if (textContent.includes(query)) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        }

        // Handle "no results" message
        let noMatchRow = document.getElementById('noMatchRow');
        if (visibleCount === 0 && query !== '') {
            if (!noMatchRow) {
                noMatchRow = document.createElement('tr');
                noMatchRow.id = 'noMatchRow';
                noMatchRow.innerHTML = '<td colspan="6" class="text-center text-muted">No students match your search.</td>';
                tbody.appendChild(noMatchRow);
            }
            noMatchRow.style.display = '';
        } else if (noMatchRow) {
            noMatchRow.style.display = 'none';
        }
    };

    // Listen to toggle
    const toggleSwitch = document.getElementById('sourceToggleSwitch');
    if (toggleSwitch) {
        toggleSwitch.addEventListener('change', function() {
            const lblLoc = document.getElementById('labelLocal');
            const lblCld = document.getElementById('labelCloud');
            if (this.checked) {
                lblLoc.classList.replace('font-weight-bold', 'text-muted');
                lblLoc.style.color = '';
                lblCld.classList.replace('text-muted', 'font-weight-bold');
                lblCld.style.color = '#003366';
            } else {
                lblCld.classList.replace('font-weight-bold', 'text-muted');
                lblCld.style.color = '';
                lblLoc.classList.replace('text-muted', 'font-weight-bold');
                lblLoc.style.color = '#003366';
            }
            renderStudentManagementList();
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

        // ── Sync delete to Cloud ───────────────────────
        if (typeof sb_deleteStudent === 'function') {
            sb_deleteStudent(id).then(function (ok) {
                if (ok) {
                    if (typeof _showSyncToast === 'function') _showSyncToast('✅ Deleted from cloud');
                } else {
                    if (typeof _showSyncToast === 'function') _showSyncToast('⚠️ Cloud delete failed — deleted locally', true);
                }
            });
        }

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


    // Edit Student Function
    window.editStudent = function (id) {
        const students = getStudents();
        const student = students.find(s => s.id === id);
        if (!student) return;

        // Populate Form
        document.getElementById('studentId').value = student.id;
        document.getElementById('name').value = student.name;
        document.getElementById('class').value = student.class;
        document.getElementById('school').value = student.school;
        document.getElementById('phone').value = student.phone;
        document.getElementById('joiningDate').value = student.joiningDate || '';
        document.getElementById('amount').value = student.amount || '';
        
        // Stop auto-calc from overriding during an edit
        if (typeof window.manualFeeOverride !== 'undefined') {
            window.manualFeeOverride = true;
        }
        const hint = document.getElementById('feeHint');
        if (hint) hint.textContent = 'Editing mode: Auto-calc disabled. Clear amount to recalculate.';

        // Subjects
        document.querySelectorAll('input[name="subject"]').forEach(cb => {
            cb.checked = student.subjects.includes(cb.value);
        });

        // Change Button Text and scroll to top
        const btn = document.getElementById('submitStudentBtn');
        if (btn) btn.innerText = "Update Student";

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
}


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
            alert('✓ Attendance synced successfully to Google Sheets & Supabase!\n\nStudent and Faculty apps will now reflect the attendance.');
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



// --- PENDING FEE VERIFICATION QUEUE (MOBILE APP APPROVAL) ---
window.loadPendingVerifications = async function() {
    const tbody = document.getElementById('pendingVerificationBody');
    if (!tbody) return;

    const sb = _getSupabaseClient();
    if (!sb) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">Database client not initialized.</td></tr>';
        return;
    }

    try {
        const { data, error } = await sb
            .from('fees_records')
            .select('*');

        if (error) throw error;

        const pending = [];
        (data || []).forEach(record => {
            const payments = Array.isArray(record.recent_payments) ? record.recent_payments : [];
            const pItem = payments.find(p => p.status === 'pending_verification');
            if (pItem) {
                pending.push({
                    record,
                    payment: pItem,
                });
            }
        });

        if (pending.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-success py-3"><i class="fas fa-check-circle mr-1"></i> No pending verification requests. All mobile student fees are cleared!</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        pending.forEach(({ record, payment }) => {
            const tr = document.createElement('tr');
            const studentName = payment.studentName || record.roll_no;
            const rollNo = record.roll_no || '';
            const amount = payment.amount || record.current_due || 4000;
            const utr = payment.utr || 'UPI-APP';
            const submittedAt = payment.submittedAt ? new Date(payment.submittedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Today';

            tr.innerHTML = `
                <td><strong>${studentName}</strong></td>
                <td><span class="badge badge-info">Class 12</span> <small class="text-muted">${rollNo}</small></td>
                <td><strong class="text-primary">₹${amount.toLocaleString('en-IN')}</strong></td>
                <td><code>${utr}</code></td>
                <td><small class="text-muted">${submittedAt}</small></td>
                <td>
                    <button class="btn btn-sm btn-success shadow-sm mr-1" onclick="approveStudentFee('${rollNo}', '${studentName}', ${amount}, '${utr}')">
                        <i class="fas fa-check-circle mr-1"></i> Approve
                    </button>
                    <button class="btn btn-sm btn-outline-danger shadow-sm" onclick="rejectStudentFee('${rollNo}')">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Error loading pending verifications:', e);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-3">Failed to load pending payments: ${e.message || e}</td></tr>`;
    }
};

window.approveStudentFee = async function(rollNo, studentName, amount, utr) {
    if (!confirm(`Approve fee payment of ₹${amount} from ${studentName} (${rollNo})?\n\nThis will immediately mark the student's dashboard and profile as PAID / Cleared.`)) {
        return;
    }

    const sb = _getSupabaseClient();
    if (!sb) return;

    try {
        const now = new Date();
        const paidOnStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        const paymentEntry = {
            month: 'SEP',
            fullMonth: 'September 2026',
            paidOn: paidOnStr,
            amount: amount,
            onTime: true,
            status: 'Verified by Center Admin',
            receiptNo: 'REC-2026-SEP-' + Math.floor(1000 + Math.random() * 9000),
            utr: utr,
        };

        const { data: currentRecord } = await sb
            .from('fees_records')
            .select('recent_payments')
            .eq('roll_no', rollNo)
            .maybeSingle();

        const currentPayments = Array.isArray(currentRecord?.recent_payments) ? currentRecord.recent_payments : [];
        const updatedPayments = [paymentEntry, ...currentPayments.filter(p => p.status !== 'pending_verification')];

        const { error } = await sb
            .from('fees_records')
            .update({
                current_due: 0,
                recent_payments: updatedPayments,
                updated_at: now.toISOString(),
            })
            .eq('roll_no', rollNo);

        if (error) throw error;

        // Also update local storage fees if matching
        if (typeof getFees === 'function' && typeof getStudents === 'function') {
            const fees = getFees();
            const students = getStudents();
            const matched = students.find(s => s.id === rollNo || s.phone === rollNo);
            if (matched && Array.isArray(matched.subjects)) {
                matched.subjects.forEach(sub => {
                    fees[`${matched.id}_${sub}_September_2026`] = 'Paid';
                });
                if (typeof saveFees === 'function') saveFees(fees);
                if (typeof window.loadFeeTable === 'function') window.loadFeeTable();
            }
        }

        alert(`✓ Payment Verified!\n${studentName}'s fee has been marked as Paid and synchronized to their student portal.`);
        window.loadPendingVerifications();
    } catch (e) {
        alert("Failed to approve fee: " + (e.message || e));
    }
};

window.rejectStudentFee = async function(rollNo) {
    if (!confirm(`Reject payment verification for roll ${rollNo}? The student's fee status will revert to Due.`)) {
        return;
    }

    const sb = _getSupabaseClient();
    if (!sb) return;

    try {
        const { data: currentRecord } = await sb
            .from('fees_records')
            .select('recent_payments')
            .eq('roll_no', rollNo)
            .maybeSingle();

        const currentPayments = Array.isArray(currentRecord?.recent_payments) ? currentRecord.recent_payments : [];
        const updatedPayments = currentPayments.filter(p => p.status !== 'pending_verification');

        await sb
            .from('fees_records')
            .update({
                current_due: 4000,
                recent_payments: updatedPayments,
                updated_at: new Date().toISOString(),
            })
            .eq('roll_no', rollNo);

        alert('Payment request rejected. Student status set to Due.');
        window.loadPendingVerifications();
    } catch (e) {
        alert("Failed to reject fee: " + (e.message || e));
    }
};
