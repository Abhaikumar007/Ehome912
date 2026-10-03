function _formatToDateInputValue(dateStr) {
    if (!dateStr) return '';
    const trimmed = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
    }
    return '';
}

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

    // Deduplicate and consolidate any duplicates by rollNo, name, or phone
    const masterMapByName = new Map();
    const masterMapByRoll = new Map();
    if (typeof MASTER_STUDENTS_ROSTER !== 'undefined' && Array.isArray(MASTER_STUDENTS_ROSTER)) {
        MASTER_STUDENTS_ROSTER.forEach(m => {
            if (m.name) masterMapByName.set(m.name.toLowerCase().trim(), m);
            if (m.rollNo) masterMapByRoll.set(m.rollNo.toUpperCase().trim(), m);
            if (m.id) masterMapByRoll.set(m.id.toUpperCase().trim(), m);
        });
    }

    const finalMap = new Map();
    let needsSave = false;

    // Process stored students and merge duplicates
    if (Array.isArray(list) && list.length > 0) {
        list.forEach(s => {
            const normName = (s.name || '').toLowerCase().trim();
            const roll = (s.rollNo || s.roll_no || s.id || '').toUpperCase().trim();
            const master = masterMapByRoll.get(roll) || masterMapByName.get(normName);

            // Canonical key: prefer official master rollNo, or normalized name + class
            const key = master ? (master.rollNo || master.id) : (normName ? normName + '_' + (s.class || '10') : roll);
            if (!key) return;

            if (!finalMap.has(key)) {
                finalMap.set(key, {
                    id: s.id || (master ? (master.rollNo || master.id) : roll),
                    rollNo: s.rollNo || s.roll_no || (master ? master.rollNo : roll),
                    name: s.name || (master ? master.name : 'Student'),
                    class: String(s.class || (master ? master.class : '10')).replace('Class ', '').trim(),
                    school: s.school || (master ? master.school : 'EduHome Campus'),
                    phone: s.phone || (master ? master.phone : ''),
                    joiningDate: s.joiningDate || (master ? master.joiningDate : '2026-01-15'),
                    amount: (s.amount !== undefined && s.amount !== null && s.amount !== '') ? String(s.amount) : (master ? String(master.amount) : '4000'),
                    subjects: (Array.isArray(s.subjects) && s.subjects.length > 0)
                        ? s.subjects
                        : ((master && master.subjects && master.subjects.length > 0) ? master.subjects : ['General Tuition'])
                });
            } else {
                needsSave = true; // Consolidating a duplicate
            }
        });
    }

    // Ensure all 50 students from master roster are populated
    if (typeof MASTER_STUDENTS_ROSTER !== 'undefined' && Array.isArray(MASTER_STUDENTS_ROSTER)) {
        MASTER_STUDENTS_ROSTER.forEach(m => {
            const k = (m.rollNo || m.id);
            if (!finalMap.has(k)) {
                finalMap.set(k, JSON.parse(JSON.stringify(m)));
                needsSave = true;
            }
        });
    }

    const deduplicated = Array.from(finalMap.values());
    if (needsSave || !list || list.length !== deduplicated.length) {
        try { localStorage.setItem('students', JSON.stringify(deduplicated)); } catch (e) {}
    }

    return deduplicated;
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

        lines.push('-- Subjects Master Table & Allotments');
        lines.push('CREATE TABLE IF NOT EXISTS subjects (');
        lines.push('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
        lines.push('  code TEXT UNIQUE NOT NULL,');
        lines.push('  name TEXT NOT NULL,');
        lines.push('  category TEXT DEFAULT \'Science\',');
        lines.push('  classes TEXT[] DEFAULT \'{"6", "7", "8", "9", "10", "11", "12"}\',');
        lines.push('  faculty_id TEXT,');
        lines.push('  faculty_name TEXT,');
        lines.push('  monthly_fee_unit NUMERIC DEFAULT 1000,');
        lines.push('  icon TEXT DEFAULT \'book-outline\',');
        lines.push('  color TEXT DEFAULT \'#1A56DB\',');
        lines.push('  created_at TIMESTAMPTZ DEFAULT now()');
        lines.push(');');
        lines.push('ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;');
        lines.push('DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = \'subjects\' AND policyname = \'Public subjects access\') THEN CREATE POLICY "Public subjects access" ON subjects FOR ALL USING (true) WITH CHECK (true); END IF; END $$;');
        lines.push('INSERT INTO subjects (code, name, category, classes, faculty_id, faculty_name, monthly_fee_unit, icon, color) VALUES');
        lines.push('  (\'PHY\',  \'Physics\',          \'Science\',    \'{"8", "9", "10", "11", "12"}\', \'fac-phy\',       \'Mr. Akshay Kumar M\',    1000, \'flash-outline\',       \'#1A56DB\'),');
        lines.push('  (\'CHEM\', \'Chemistry\',        \'Science\',    \'{"8", "9", "10", "11", "12"}\', \'fac-chem\',      \'Ms. Renju\',     1000, \'flask-outline\',       \'#12B76A\'),');
        lines.push('  (\'MATH\', \'Mathematics\',      \'Maths\',      \'{"6", "7", "8", "9", "10", "11", "12"}\', \'fac-math\', \'Ms. Devi\', 1000, \'calculator-outline\',  \'#F79009\'),');
        lines.push('  (\'BIO\',  \'Biology\',          \'Science\',    \'{"6", "7", "8", "9", "10", "11", "12"}\', \'fac-bio-lower\', \'Mr. Madhusudanan / Mr. Gokul Krishnan\', 1000, \'leaf-outline\', \'#0284C7\'),');
        lines.push('  (\'CS\',   \'Computer Science\', \'Technology\', \'{"11", "12"}\',                 \'fac-cs\',        \'Mr. Abhai Kumar\',   1000, \'code-slash-outline\',  \'#7C3AED\'),');
        lines.push('  (\'SCI\',  \'Science\',          \'Science\',    \'{"6", "7", "8", "9"}\',         \'fac-bio-lower\', \'Mr. Madhusudanan\',    1000, \'planet-outline\',      \'#059669\')');
        lines.push('ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, classes = EXCLUDED.classes, faculty_id = EXCLUDED.faculty_id, faculty_name = EXCLUDED.faculty_name, monthly_fee_unit = EXCLUDED.monthly_fee_unit, icon = EXCLUDED.icon, color = EXCLUDED.color;');
        lines.push('');
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
            // EDIT MODE: Preserve original admission/joining date if input is blank or unchanged
            const index = students.findIndex(s => s.id === id || (s.rollNo && s.rollNo === id) || (s.roll_no && s.roll_no === id));
            if (index !== -1) {
                const existingDate = students[index].joiningDate || students[index].joining_date || '';
                const finalJoiningDate = joiningDate ? joiningDate : (existingDate || new Date().toISOString().slice(0, 10));

                students[index] = {
                    ...students[index],
                    name,
                    class: studentClass,
                    school,
                    phone,
                    joiningDate: finalJoiningDate,
                    amount,
                    subjects
                };
                studentToSync = students[index];
                alert('Student Updated Successfully!');
            }
        } else {
            // ADD MODE: Default to today if left blank
            const finalJoiningDate = joiningDate || new Date().toISOString().slice(0, 10);
            const newStudent = {
                id: Date.now().toString(),
                name,
                class: studentClass,
                school,
                phone,
                joiningDate: finalJoiningDate,
                amount,
                subjects
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
        const updateQuickMonthLabels = () => {
            const mVal = monthSelect.value;
            const qTxt = document.getElementById('quickSettlementMonthText');
            const qBtn = document.getElementById('quickBtnMonth');
            if (qTxt) qTxt.textContent = mVal;
            if (qBtn) qBtn.textContent = mVal;
        };
        monthSelect.addEventListener('change', () => {
            updateQuickMonthLabels();
            loadFeeTable();
        });
        updateQuickMonthLabels();
    }

    function loadFeeTable() {
        if (!classSelect) return;

        const selectedClass = classSelect.value;
        const fees = getFees();

        // Month handling
        const selectedMonth = document.getElementById('feeMonthSelect') ? document.getElementById('feeMonthSelect').value : new Date().toLocaleString('default', { month: 'long' });
        const currentYear = new Date().getFullYear();

        if (displayMonth) displayMonth.textContent = selectedMonth + ' ' + currentYear;

        feeTableBody.innerHTML = '';

        // Month indexing
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthIndex = monthNames.indexOf(selectedMonth);
        const now = new Date();
        const currentMonthIndex = now.getMonth();
        const realCurrentYear = now.getFullYear();

        // Filter Students by Class (or All) AND Date of Joining
        let students = getStudents();
        let filteredStudents = students.filter(s => {
            // Class Check
            if (selectedClass && selectedClass !== 'all' && String(s.class || '').replace('Class ', '').trim() !== String(selectedClass).replace('Class ', '').trim()) {
                return false;
            }

            // Date of Joining Check
            if (s.joiningDate) {
                const joinDate = new Date(s.joiningDate);
                const viewMonthStart = new Date(currentYear, monthIndex, 1);
                const joinMonthStart = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);

                if (viewMonthStart < joinMonthStart) {
                    return false; // Student joined after this month
                }
            }
            return true;
        });

        if (filteredStudents.length === 0) {
            const msg = selectedClass ? ('No active students found for this class in ' + selectedMonth + '.') : 'Select Class to view student fees.';
            feeTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">' + msg + '</td></tr>';
            return;
        }

        filteredStudents.forEach(student => {
            const tr = document.createElement('tr');
            const rollUpper = String(student.rollNo || student.id).toUpperCase().trim();
            const fRec = window._supabaseFeeMap ? window._supabaseFeeMap.get(rollUpper) : null;

            let subjectsHtml = '';
            (Array.isArray(student.subjects) && student.subjects.length > 0 ? student.subjects : ['General']).forEach(sub => {
                // Check all fee key variants
                const k1 = student.id + '_' + sub + '_' + selectedMonth + '_' + currentYear;
                const k2 = student.id + '_' + sub + '_' + selectedMonth + ' ' + currentYear;
                const k3 = student.rollNo + '_' + sub + '_' + selectedMonth + '_' + currentYear;
                const k4 = student.rollNo + '_' + sub + '_' + selectedMonth + ' ' + currentYear;

                let isPaid = (fees[k1] === 'Paid' || fees[k2] === 'Paid' || fees[k3] === 'Paid' || fees[k4] === 'Paid');
                let isPendingVerification = false;

                // Also check live Supabase fee record
                if (fRec) {
                    const pmts = Array.isArray(fRec.recent_payments) ? fRec.recent_payments : [];
                    const mShort = selectedMonth.slice(0, 3).toUpperCase();

                    const approvedReceipt = pmts.find(p => 
                        (p.month === mShort || (p.fullMonth && p.fullMonth.includes(selectedMonth))) &&
                        p.status !== 'pending_verification'
                    );
                    if (approvedReceipt) isPaid = true;

                    const pendingReceipt = pmts.find(p => 
                        (p.month === mShort || (p.fullMonth && p.fullMonth.includes(selectedMonth))) &&
                        p.status === 'pending_verification'
                    );
                    if (pendingReceipt) isPendingVerification = true;

                    // If the selected month appears in the stored payments OR student has current_due=0 (all cleared)
                    // "All Cleared" means every month through the most-recently-paid one is paid
                    if (!isPaid && (Number(fRec.current_due) === 0 || fRec.due_date === 'All Cleared' || fRec.status === 'paid')) {
                        const _mlm = {JAN:'January',FEB:'February',MAR:'March',APR:'April',MAY:'May',JUN:'June',JUL:'July',AUG:'August',SEP:'September',OCT:'October',NOV:'November',DEC:'December'};
                        const allPmts = Array.isArray(fRec.recent_payments) ? fRec.recent_payments : [];
                        const approvedPmts = allPmts.filter(p => p.status !== 'pending_verification');
                        // Check if selectedMonth is in the approved list
                        const foundApproved = approvedPmts.some(p => {
                            const pLong = p.fullMonth ? p.fullMonth.split(' ')[0] : (_mlm[String(p.month||'').slice(0,3).toUpperCase()]||p.month||'');
                            return pLong.toLowerCase() === selectedMonth.toLowerCase();
                        });
                        if (foundApproved) isPaid = true;
                    }
                }

                let status = 'Pending';
                let statusClass = 'fee-pending';
                let canToggle = true;

                if (isPaid) {
                    status = 'Paid';
                    statusClass = 'fee-paid';
                } else if (isPendingVerification) {
                    status = 'Verification Pending';
                    statusClass = 'fee-upcoming';
                } else if (student.joiningDate) {
                    const joinDate = new Date(student.joiningDate);
                    const joinDay = joinDate.getDate();
                    const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
                    const dueDay = Math.min(joinDay, daysInMonth);
                    const dueDate = new Date(currentYear, monthIndex, dueDay);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    if (currentYear === realCurrentYear && monthIndex === currentMonthIndex) {
                        if (today < dueDate) {
                            status = 'Upcoming (Due: ' + dueDay + ')';
                            statusClass = 'fee-upcoming';
                        } else {
                            statusClass = 'fee-pending';
                        }
                    } else if (currentYear < realCurrentYear || (currentYear === realCurrentYear && monthIndex < currentMonthIndex)) {
                        statusClass = 'fee-pending';
                    } else {
                        statusClass = 'fee-upcoming';
                    }
                }

                // Reminder Check
                let reminderBtn = '';
                if (statusClass === 'fee-pending') {
                    const pendingInfo = getPendingDues(student, fees);
                    const pendingMonths = pendingInfo.months.join(', ');
                    const pendingSubjects = pendingInfo.subjects.join(', ');
                    const amountMsg = student.amount ? ('Amount per month: ₹' + student.amount) : 'Amount: Not Set';

                    const msg = 'Dear Parent, fee for student *' + student.name + '* (Class ' + student.class + ') is pending.\n\n' +
                        '*Pending Months:* ' + (pendingMonths || selectedMonth) + '\n' +
                        '*Subjects:* ' + pendingSubjects + '\n' +
                        '*' + amountMsg + '*\n\n' +
                        'Please pay at the earliest.';

                    const whatsappUrl = 'https://wa.me/91' + student.phone + '?text=' + encodeURIComponent(msg);
                    reminderBtn = '<a href="' + whatsappUrl + '" target="_blank" class="btn btn-sm btn-warning shadow-sm" style="font-weight:bold; margin-top: 5px;"><i class="fab fa-whatsapp"></i> Share Reminder</a>';
                }

                subjectsHtml += '<div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #eee; padding-bottom: 8px;">' +
                    '<span style="font-weight: 500; margin-top: 4px;">' + sub + '</span>' +
                    '<div style="display: flex; flex-direction: column; align-items: flex-end;">' +
                    '<span class="fee-status ' + statusClass + '" onclick="toggleFee(\'' + student.id + '\', \'' + sub + '\', \'' + selectedMonth + '\', \'' + currentYear + '\')" style="min-width: 90px; text-align: center; cursor: pointer;">' +
                    status +
                    '</span>' +
                    reminderBtn +
                    '</div>' +
                    '</div>';
            });

            tr.innerHTML = '<td>' +
                '<strong>' + student.name + '</strong>' +
                (student.class ? ('<br><span class="badge badge-light border">Class ' + student.class + '</span>') : '') +
                (student.joiningDate ? ('<small class="text-muted ml-1" style="font-size:0.75rem;">Joined: ' + new Date(student.joiningDate).toLocaleDateString() + '</small>') : '') +
                '</td>' +
                '<td>' + student.phone + '</td>' +
                '<td>' + subjectsHtml + '</td>';
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
        const k1 = studentId + '_' + subject + '_' + month + '_' + year;
        const k2 = studentId + '_' + subject + '_' + month + ' ' + year;
        const fees = getFees();
        var newStatus;
        if (fees[k1] === 'Paid' || fees[k2] === 'Paid') {
            delete fees[k1];
            delete fees[k2];
            newStatus = 'Pending';
        } else {
            fees[k1] = 'Paid';
            fees[k2] = 'Paid';
            newStatus = 'Paid';
        }
        saveFees(fees);

        // Update in-memory feeMap immediately
        const students = getStudents();
        const student = students.find(s => s.id === studentId || s.rollNo === studentId);
        const roll = student ? (student.rollNo || student.id) : studentId;
        const rollUpper = String(roll).toUpperCase().trim();
        if (window._supabaseFeeMap && window._supabaseFeeMap.has(rollUpper)) {
            const rec = window._supabaseFeeMap.get(rollUpper);
            const pmts = Array.isArray(rec.recent_payments) ? [...rec.recent_payments] : [];
            const mShort = month.slice(0, 3).toUpperCase();
            if (newStatus === 'Paid') {
                if (!pmts.some(p => p.month === mShort || (p.fullMonth && p.fullMonth.includes(month)))) {
                    pmts.push({
                        month: mShort,
                        fullMonth: month + ' ' + year,
                        amount: Number(student?.amount) || 4000,
                        paidOn: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
                        status: 'Verified by Center Admin',
                        receiptNo: 'REC-' + year + '-' + mShort + '-' + Math.floor(1000 + Math.random() * 9000),
                        utr: 'ADMIN-DIRECT-TOGGLE'
                    });
                }
                // Recalculate current_due after adding this payment
                const nowDate = new Date();
                const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                const nowMonthIdx = nowDate.getMonth();
                const paidMonths = new Set(pmts.map(p => p.month)); // short codes
                let due = 0;
                for (let mi = 0; mi <= nowMonthIdx; mi++) {
                    const sh = months[mi].slice(0,3).toUpperCase();
                    if (!paidMonths.has(sh)) due++;
                }
                rec.current_due = due * (Number(student?.amount) || 4000);
                rec.due_date = due === 0 ? 'All Cleared' : ('25 ' + months[nowMonthIdx] + ' ' + nowDate.getFullYear());
                rec.status = due === 0 ? 'paid' : 'due';
                rec.recent_payments = pmts;
            } else {
                rec.recent_payments = pmts.filter(p => !(p.month === mShort && (p.fullMonth?.includes(String(year)) || !p.fullMonth)));
                // Recalculate current_due after removing this payment
                const nowDate2 = new Date();
                const months2 = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                const nowMonthIdx2 = nowDate2.getMonth();
                const remainPmts = rec.recent_payments;
                const paidMonths2 = new Set(remainPmts.map(p => p.month));
                let due2 = 0;
                for (let mi = 0; mi <= nowMonthIdx2; mi++) {
                    const sh = months2[mi].slice(0,3).toUpperCase();
                    if (!paidMonths2.has(sh)) due2++;
                }
                rec.current_due = due2 * (Number(student?.amount) || 4000);
                rec.due_date = due2 === 0 ? 'All Cleared' : ('25 ' + months2[nowMonthIdx2] + ' ' + nowDate2.getFullYear());
                rec.status = due2 === 0 ? 'paid' : 'due';
            }
        }

        loadFeeTable(); // Refresh UI immediately

        // ── Auto-sync fee change to Supabase ──
        if (typeof sb_toggleFee === 'function') {
            sb_toggleFee(studentId, subject, month, year, newStatus).then(function () {
                if (typeof _showSyncToast === 'function') _showSyncToast('✅ Synced ' + month + ' fee to Supabase');
            }).catch(function (err) {
                console.warn('[ToggleFee] Sync error:', err);
                if (typeof _showSyncToast === 'function') _showSyncToast('⚠️ Fee sync issue — saved locally', true);
            });
        }
    };

    window.loadFeeTable = loadFeeTable;

    // Initial load
    loadFeeTable();
}

/**
 * sb_toggleFee — Writes fee paid/unpaid change to Supabase fees_records.
 * Called by toggleFee() after local state is updated.
 */
window.sb_toggleFee = async function(studentId, subject, month, year, newStatus) {
    const sb = typeof _getSafeAdminSupabase === 'function' ? _getSafeAdminSupabase() : null;
    if (!sb) { console.warn('[sb_toggleFee] No Supabase client'); return; }

    const students = typeof getStudents === 'function' ? getStudents() : [];
    const student = students.find(s => s.id === studentId || s.rollNo === studentId);
    if (!student) { console.warn('[sb_toggleFee] Student not found:', studentId); return; }

    const roll = String(student.rollNo || student.id).toUpperCase().trim();
    const rollUpper = roll;

    // Fetch current record from Supabase
    const { data, error } = await sb
        .from('fees_records')
        .select('*')
        .eq('roll_no', rollUpper)
        .single();

    if (error || !data) {
        console.warn('[sb_toggleFee] Fetch error:', error);
        return;
    }

    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const mShort = month.slice(0,3).toUpperCase();
    let pmts = Array.isArray(data.recent_payments) ? [...data.recent_payments] : [];

    if (newStatus === 'Paid') {
        // Add if not already there
        if (!pmts.some(p => p.month === mShort || (p.fullMonth && p.fullMonth.toLowerCase().includes(month.toLowerCase())))) {
            pmts.unshift({
                month: mShort,
                fullMonth: month + ' ' + year,
                amount: Number(student.amount) || 4000,
                paidOn: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
                status: 'Verified by Center Admin',
                receiptNo: 'ADMIN-TOGGLE-' + Date.now(),
                utr: 'ADMIN-DIRECT-TOGGLE'
            });
        }
    } else {
        // Remove the month entry
        pmts = pmts.filter(p => {
            const pLong = p.fullMonth ? p.fullMonth.split(' ')[0] : '';
            return !(p.month === mShort || pLong.toLowerCase() === month.toLowerCase());
        });
    }

    // Recalculate current_due based on how many months (Jan → now) are unpaid
    const nowDate = new Date();
    const nowMonthIdx = nowDate.getMonth();
    const paidSet = new Set(pmts.map(p => p.month));
    let due = 0;
    for (let mi = 0; mi <= nowMonthIdx; mi++) {
        const sh = months[mi].slice(0,3).toUpperCase();
        if (!paidSet.has(sh)) due++;
    }
    const amount = Number(student.amount) || 4000;
    const currentDue = due * amount;
    const dueDate = due === 0 ? 'All Cleared' : ('25 ' + months[nowMonthIdx] + ' ' + nowDate.getFullYear());
    const loyalty = pmts.filter(p => p.status !== 'pending_verification').length;

    // Update Supabase
    const { error: upErr } = await sb
        .from('fees_records')
        .update({
            recent_payments: pmts,
            current_due: currentDue,
            due_date: dueDate,
            loyalty_months: loyalty
        })
        .eq('roll_no', rollUpper);

    if (upErr) {
        console.error('[sb_toggleFee] Update error:', upErr);
        throw upErr;
    }

    // Also update local in-memory map so the table reflects correctly without reload
    if (window._supabaseFeeMap) {
        const rec = window._supabaseFeeMap.get(rollUpper) || {};
        rec.recent_payments = pmts;
        rec.current_due = currentDue;
        rec.due_date = dueDate;
        rec.loyalty_months = loyalty;
        window._supabaseFeeMap.set(rollUpper, rec);
    }

    console.log('[sb_toggleFee] Synced', roll, month, newStatus, '→ due:', currentDue);
};

/**
 * Robust Supabase Client Resolver for Admin Panel
 */
/**
 * Direct Supabase Fees & Students Loader
 * Keeps fees.html in real-time sync with Supabase and EduHome mobile app
 */
window.loadSupabaseFeesData = async function() {
    const statusEl = document.getElementById('manualSyncStatus');
    const sb = _getSafeAdminSupabase();
    if (!sb) {
        console.warn('[SupabaseFees] Supabase client not available');
        return { ok: false, msg: 'Supabase client unavailable' };
    }

    try {
        if (statusEl) statusEl.innerHTML = '<span class="text-muted"><i class="fas fa-spinner fa-spin mr-1"></i> Connecting directly to Supabase cloud fees...</span>';

        const [feeRes, stuRes] = await Promise.all([
            sb.from('fees_records').select('*'),
            sb.from('students').select('*')
        ]);

        if (feeRes.error) throw feeRes.error;

        const feeRecords = feeRes.data || [];
        const feeMap = new Map();
        feeRecords.forEach(r => {
            if (r.roll_no) feeMap.set(String(r.roll_no).toUpperCase().trim(), r);
        });
        window._supabaseFeeMap = feeMap;

        // If students exist in Supabase, ensure local cache is up to date
        if (stuRes.data && stuRes.data.length > 0) {
            const cloudStudents = stuRes.data;
            const localStudents = typeof getStudents === 'function' ? getStudents() : [];
            const localMap = new Map(localStudents.map(s => [String(s.rollNo || s.id).toUpperCase().trim(), s]));

            const merged = cloudStudents.map(cs => {
                const roll = String(cs.roll_no || cs.id).toUpperCase().trim();
                const loc = localMap.get(roll);
                const feeRec = feeMap.get(roll);
                return {
                    id: cs.roll_no || cs.id,
                    rollNo: cs.roll_no || cs.id,
                    name: cs.name || loc?.name || 'Student',
                    class: String(cs.class_name || loc?.class || '10').replace('Class ', '').trim(),
                    school: cs.school || loc?.school || 'EduHome Campus',
                    phone: cs.phone || loc?.phone || '',
                    joiningDate: cs.joining_date || loc?.joiningDate || '2026-01-15',
                    amount: (feeRec && feeRec.monthly_fee) ? String(feeRec.monthly_fee) : (loc?.amount || '4000'),
                    subjects: (loc && Array.isArray(loc.subjects) && loc.subjects.length > 0) ? loc.subjects : ['General']
                };
            });
            localStorage.setItem('students', JSON.stringify(merged));
        }

        // Populate local fees cache with verified payments from Supabase
        const feesCache = typeof getFees === 'function' ? getFees() : {};
        const allStudents = typeof getStudents === 'function' ? getStudents() : [];

        feeRecords.forEach(fr => {
            const roll = fr.roll_no;
            const stu = allStudents.find(s => String(s.rollNo || s.id).toUpperCase().trim() === String(roll).toUpperCase().trim());
            const subjects = (stu && Array.isArray(stu.subjects) && stu.subjects.length > 0) ? stu.subjects : ['General'];
            const payments = Array.isArray(fr.recent_payments) ? fr.recent_payments : [];
            const isCleared = (Number(fr.current_due) === 0 || fr.due_date === 'All Cleared' || fr.status === 'paid');

            payments.forEach(p => {
                if (p.status !== 'pending_verification') {
                    const _monthLongMap = {JAN:'January',FEB:'February',MAR:'March',APR:'April',MAY:'May',JUN:'June',JUL:'July',AUG:'August',SEP:'September',OCT:'October',NOV:'November',DEC:'December'};
                    const mName = p.fullMonth ? p.fullMonth.split(' ')[0] : (_monthLongMap[String(p.month || '').slice(0,3).toUpperCase()] || p.month || 'Unknown');
                    const y = p.fullMonth ? (p.fullMonth.split(' ')[1] || '2026') : '2026';
                    subjects.forEach(sub => {
                        feesCache[roll + '_' + sub + '_' + mName + '_' + y] = 'Paid';
                        feesCache[roll + '_' + sub + '_' + mName + ' ' + y] = 'Paid';
                        if (stu && stu.id) {
                            feesCache[stu.id + '_' + sub + '_' + mName + '_' + y] = 'Paid';
                            feesCache[stu.id + '_' + sub + '_' + mName + ' ' + y] = 'Paid';
                        }
                    });
                }
            });

            if (isCleared) {
                subjects.forEach(sub => {
                    feesCache[roll + '_' + sub + '_October_2026'] = 'Paid';
                    feesCache[roll + '_' + sub + '_October 2026'] = 'Paid';
                    if (stu && stu.id) {
                        feesCache[stu.id + '_' + sub + '_October_2026'] = 'Paid';
                        feesCache[stu.id + '_' + sub + '_October 2026'] = 'Paid';
                    }
                });
            }
        });

        localStorage.setItem('fees', JSON.stringify(feesCache));

        // Setup realtime subscription if not already active
        if (!window._supabaseFeesRealtimeSubscribed) {
            try {
                sb.channel('admin_fees_live_channel')
                  .on('postgres_changes', { event: '*', schema: 'public', table: 'fees_records' }, (payload) => {
                      console.log('[SupabaseRealtime] fees_records updated live:', payload);
                      if (payload.new && payload.new.roll_no) {
                          if (!window._supabaseFeeMap) window._supabaseFeeMap = new Map();
                          window._supabaseFeeMap.set(String(payload.new.roll_no).toUpperCase().trim(), payload.new);
                      }
                      if (typeof window.loadFeeTable === 'function') window.loadFeeTable();
                      if (typeof window.loadPendingVerifications === 'function') window.loadPendingVerifications();
                  })
                  .subscribe();
                window._supabaseFeesRealtimeSubscribed = true;
            } catch (rtErr) {
                console.warn('[SupabaseRealtime] Subscription error:', rtErr);
            }
        }

        if (statusEl) {
            statusEl.innerHTML = '<span class="text-success" style="font-size:0.85rem;"><i class="fas fa-check-circle mr-1"></i> Connected to Supabase Cloud (' + feeRecords.length + ' student records live)</span>';
            setTimeout(() => { if (statusEl) statusEl.innerHTML = ''; }, 4000);
        }

        if (typeof window.loadFeeTable === 'function') window.loadFeeTable();
        if (typeof window.loadPendingVerifications === 'function') window.loadPendingVerifications();

        return { ok: true, count: feeRecords.length };
    } catch (err) {
        console.error('[SupabaseFees] Error loading Supabase fees:', err);
        if (statusEl) {
            statusEl.innerHTML = '<span class="text-danger" style="font-size:0.85rem;"><i class="fas fa-exclamation-triangle mr-1"></i> Supabase fees error: ' + (err.message || err) + '</span>';
        }
        return { ok: false, msg: err.message || err };
    }
};

function _getSafeAdminSupabase() {
    if (typeof _getSupabaseClient === 'function') {
        const client = _getSupabaseClient();
        if (client) return client;
    }
    if (typeof window._supabaseClient !== 'undefined' && window._supabaseClient) {
        return window._supabaseClient;
    }
    if (typeof window.supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL && typeof SUPABASE_ANON_KEY !== 'undefined' && SUPABASE_ANON_KEY) {
        try {
            const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            window._supabaseClient = client;
            return client;
        } catch (e) {
            console.warn('[AdminSupabase] Error creating Supabase client:', e);
        }
    }
    return null;
}
window._getSafeAdminSupabase = _getSafeAdminSupabase;
window._getAdminSupabase = _getSafeAdminSupabase;

window.quickMarkPaidUpToMonth = async function() {
    const monthSelect = document.getElementById('feeMonthSelect');
    const classSelect = document.getElementById('feesClassSelect');
    const selectedMonth = monthSelect ? monthSelect.value : 'October';
    const selectedClass = classSelect ? classSelect.value : '';
    const alertBox = document.getElementById('quickFeeStatusAlert');
    const statusEl = document.getElementById('manualSyncStatus');
    const btn = document.getElementById('btnQuickMarkPaid');

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthIndex = monthNames.indexOf(selectedMonth);
    const endIdx = monthIndex >= 0 ? monthIndex : 9;
    const startIdx = 0; // January

    const confirmMsg = `Mark all students as PAID from January to ${selectedMonth} (${endIdx + 1} months)?\n\nThis will:\n• Record verified receipt entries directly in Supabase (fees_records)\n• Award loyalty badges for all ${endIdx + 1} months\n• Reset dues to ₹0 for covered months\n• Update student mobile apps live in real-time.`;
    if (typeof window.__confirmBypass === 'undefined' && !confirm(confirmMsg)) return;

    const originalBtnHtml = btn ? btn.innerHTML : `<i class="fas fa-check-circle mr-1"></i> Mark All Paid (Jan → ${selectedMonth})`;
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Syncing to Supabase...';
    }

    try {
        const sb = _getSafeAdminSupabase();
        let students = typeof getStudents === 'function' ? getStudents() : [];
        if (selectedClass) {
            const normClass = String(selectedClass).replace('Class ', '').trim();
            students = students.filter(s => String(s.class || '').replace('Class ', '').trim() === normClass);
        }

        // If local students is empty, fallback to Supabase students table
        if (students.length === 0 && sb) {
            try {
                const { data: cloudStu } = await sb.from('students').select('*');
                if (Array.isArray(cloudStu) && cloudStu.length > 0) {
                    students = cloudStu;
                    if (selectedClass) {
                        const normClass = String(selectedClass).replace('Class ', '').trim();
                        students = students.filter(s => String(s.class || '').replace('Class ', '').trim() === normClass);
                    }
                }
            } catch (e) {
                console.warn('[QuickFee] Failed to fetch students from cloud fallback:', e);
            }
        }

        const now = new Date();
        const paidDateStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

        const clearedMonths = [];
        const monthShorts = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        for (let i = startIdx; i <= endIdx; i++) {
            clearedMonths.push({
                index: i,
                name: monthNames[i],
                short: monthShorts[i],
                full: `${monthNames[i]} 2026`
            });
        }

        // 1. Update localStorage fees cache
        let localFees = typeof getFees === 'function' ? getFees() : {};
        students.forEach(s => {
            const canonId = s.id;
            const allIds = [...new Set([canonId, s.rollNo, s.roll_no].filter(Boolean))];
            const subjects = (Array.isArray(s.subjects) && s.subjects.length > 0) ? s.subjects : ['General'];
            clearedMonths.forEach(m => {
                subjects.forEach(sub => {
                    allIds.forEach(idVariant => {
                        localFees[`${idVariant}_${sub}_${m.name}_2026`] = 'Paid';
                        if (sub !== sub.toLowerCase()) {
                            localFees[`${idVariant}_${sub.toLowerCase()}_${m.name}_2026`] = 'Paid';
                        }
                    });
                });
            });
        });
        localStorage.setItem('fees', JSON.stringify(localFees));

        // 2. Direct Sync to Supabase fees_records table
        let syncSuccess = false;
        let syncErrorMsg = '';
        let recordsUpsertedCount = 0;

        if (sb) {
            let feeMap = new Map();
            try {
                const { data: fRows } = await sb.from('fees_records').select('*');
                if (Array.isArray(fRows)) {
                    fRows.forEach(r => { if (r.roll_no) feeMap.set(String(r.roll_no).toUpperCase().trim(), r); });
                }
            } catch (e) {
                console.warn('[QuickFee] Pre-fetching fees_records warning:', e);
            }

            const recordsToUpsert = [];
            const isCurrentCycleCovered = endIdx >= 9; // October or later

            students.forEach(s => {
                const roll = s.rollNo || s.roll_no || s.id;
                if (!roll) return;
                const rollKey = String(roll).toUpperCase().trim();
                const fRec = feeMap.get(rollKey);
                const sClass = s.class || s.class_name || '10';
                const stdFee = (typeof getStandardClassFee === 'function') ? getStandardClassFee(sClass) : 4000;
                const monthlyFee = Number(s.amount || s.fee) || stdFee;

                const existingPayments = Array.isArray(fRec?.recent_payments) ? [...fRec.recent_payments] : [];
                clearedMonths.forEach(m => {
                    const pIdx = existingPayments.findIndex(p => p.fullMonth === m.full || p.month === m.short);
                    const receiptItem = {
                        month: m.short,
                        fullMonth: m.full,
                        paidOn: paidDateStr,
                        amount: monthlyFee,
                        onTime: true,
                        status: 'Verified by Center Admin',
                        receiptNo: `REC-2026-${m.short}-${Math.floor(1000 + Math.random() * 9000)}`,
                        utr: 'ADMIN-BULK-SETTLED'
                    };
                    if (pIdx >= 0) existingPayments[pIdx] = receiptItem;
                    else existingPayments.push(receiptItem);
                });

                const existingLoyalty = Array.isArray(fRec?.loyalty_months) ? [...fRec.loyalty_months] : [];
                clearedMonths.forEach(m => {
                    if (!existingLoyalty.some(l => l.label === m.name || l.label === m.full)) {
                        existingLoyalty.push({ label: m.name, earned: true });
                    }
                });

                recordsToUpsert.push({
                    roll_no: String(roll).trim(),
                    current_due: isCurrentCycleCovered ? 0 : monthlyFee,
                    due_date: isCurrentCycleCovered ? 'All Cleared' : '25 October 2026',
                    status: isCurrentCycleCovered ? 'paid' : 'due',
                    days_left: isCurrentCycleCovered ? 0 : 24,
                    months_paid_on_time: Math.max(fRec?.months_paid_on_time || 0, endIdx + 1),
                    loyalty_months: existingLoyalty,
                    recent_payments: existingPayments,
                    updated_at: now.toISOString()
                });
            });

            if (recordsToUpsert.length > 0) {
                const { error: upErr } = await sb.from('fees_records').upsert(recordsToUpsert, { onConflict: 'roll_no' });
                if (upErr) {
                    console.error('[QuickFee] Supabase fees_records upsert failed:', upErr);
                    syncErrorMsg = upErr.message || String(upErr);
                } else {
                    syncSuccess = true;
                    recordsUpsertedCount = recordsToUpsert.length;
                    console.log(`[QuickFee] Successfully upserted ${recordsUpsertedCount} rows to Supabase fees_records ✓`);

                    // Send Realtime Broadcast event to connected mobile apps
                    try {
                        const channel = sb.channel('admin_fee_broadcast');
                        channel.subscribe((status) => {
                            if (status === 'SUBSCRIBED') {
                                channel.send({
                                    type: 'broadcast',
                                    event: 'bulk_fee_cleared',
                                    payload: {
                                        month: selectedMonth,
                                        monthsCount: endIdx + 1,
                                        studentCount: recordsUpsertedCount,
                                        timestamp: now.toISOString()
                                    }
                                });
                            }
                        });
                    } catch (rtErr) {
                        console.warn('[QuickFee] Realtime broadcast warning:', rtErr);
                    }
                }
            } else {
                syncErrorMsg = 'No matching student records found to upsert.';
            }
        } else {
            syncErrorMsg = 'Supabase client could not be initialized.';
            console.warn('[QuickFee] Supabase client not available.');
        }

        // Switch the month dropdown to the settlement end month so the table shows Paid rows
        const monthDropdown = document.getElementById('feeMonthSelect');
        if (monthDropdown) {
            monthDropdown.value = selectedMonth;
            const qTxt = document.getElementById('quickSettlementMonthText');
            const qBtn = document.getElementById('quickBtnMonth');
            if (qTxt) qTxt.textContent = selectedMonth;
            if (qBtn) qBtn.textContent = selectedMonth;
        }

        if (typeof window.loadFeeTable === 'function') {
            window.loadFeeTable();
        }

        if (typeof window.updateFeeSummary === 'function') {
            await window.updateFeeSummary();
        }

        // Rich UI status banner
        if (alertBox) {
            if (syncSuccess) {
                alertBox.innerHTML = `
                    <div class="alert alert-success alert-dismissible fade show my-2" role="alert" style="border-left: 5px solid #10b981; border-radius: 8px;">
                        <div class="d-flex align-items-start">
                            <i class="fas fa-check-circle fa-2x text-success mr-3 mt-1"></i>
                            <div>
                                <h6 class="font-weight-bold mb-1 text-success" style="font-size: 1.02rem;">
                                    <i class="fas fa-cloud-upload-alt mr-1"></i> Settled & Synced Directly to Supabase!
                                </h6>
                                <p class="mb-1 text-dark" style="font-size: 0.9rem;">
                                    Marked <strong>${students.length} students</strong> as <strong>PAID</strong> for <strong>${endIdx + 1} months</strong> (January → ${selectedMonth} 2026).
                                </p>
                                <div class="my-1">
                                    <span class="badge badge-success px-2 py-1 mr-2"><i class="fas fa-database mr-1"></i> Supabase: ${recordsUpsertedCount} Records Synced</span>
                                    <span class="badge badge-info px-2 py-1 mr-2"><i class="fas fa-receipt mr-1"></i> Official Receipts Generated</span>
                                    <span class="badge badge-primary px-2 py-1"><i class="fas fa-mobile-alt mr-1"></i> Live Mobile Apps Updated</span>
                                </div>
                                <small class="text-muted d-block mt-2">
                                    The fee table below is displaying <strong>${selectedMonth} 2026</strong>. You can switch to any month (January to ${selectedMonth}) to review individual subjects.
                                </small>
                            </div>
                        </div>
                        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                `;
            } else {
                alertBox.innerHTML = `
                    <div class="alert alert-warning alert-dismissible fade show my-2" role="alert" style="border-left: 5px solid #f59e0b; border-radius: 8px;">
                        <div class="d-flex align-items-start">
                            <i class="fas fa-exclamation-triangle fa-2x text-warning mr-3 mt-1"></i>
                            <div>
                                <h6 class="font-weight-bold mb-1 text-warning">
                                    Marked Paid Locally, but Supabase Sync Encountered an Issue
                                </h6>
                                <p class="mb-1 text-dark" style="font-size: 0.88rem;">
                                    Fees updated locally for January → ${selectedMonth}. Supabase sync message: <em>${syncErrorMsg || 'Client connection unavailable'}</em>
                                </p>
                                <button class="btn btn-sm btn-outline-warning mt-2 font-weight-bold" onclick="runPushToCloud()" style="border-radius: 20px;">
                                    <i class="fas fa-cloud-upload-alt mr-1"></i> Retry Push to Supabase Cloud
                                </button>
                            </div>
                        </div>
                        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                `;
            }
        }

        if (statusEl) {
            if (syncSuccess) {
                statusEl.innerHTML = `<span class="text-success" style="font-size:0.86rem; font-weight:600;"><i class="fas fa-check-circle mr-1"></i>Synced to Supabase: ${recordsUpsertedCount} fees_records updated live</span>`;
                setTimeout(() => { if (statusEl) statusEl.innerHTML = ''; }, 6000);
            } else {
                statusEl.innerHTML = `<span class="text-warning" style="font-size:0.86rem; font-weight:600;"><i class="fas fa-exclamation-triangle mr-1"></i>Supabase sync pending: ${syncErrorMsg || 'Offline'}</span>`;
            }
        }
    } catch (err) {
        console.error('Error in quickMarkPaidUpToMonth:', err);
        alert('Error clearing fees: ' + (err.message || err));
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalBtnHtml;
        }
    }
};


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
    // Teacher Auto-Sync
    const subjectSelect = document.getElementById('timetableSubject');
    const facultySelect = document.getElementById('timetableFaculty');
    const facultyHint = document.getElementById('timetableFacultyHint');

    function getOfficialAssignedTeacher(sub, grade) {
        const numClass = parseInt(grade, 10) || 10;
        const subLower = (sub || '').toLowerCase();
        try {
            const stored = JSON.parse(localStorage.getItem('eduhome_faculty_allotments') || '[]');
            if (Array.isArray(stored) && stored.length > 0) {
                const match = stored.find(t => {
                    const tSub = (t.subject || '').toLowerCase();
                    const subMatches = (subLower.includes('chem') && tSub.includes('chem')) ||
                                       (subLower.includes('phys') && tSub.includes('phys')) ||
                                       (subLower.includes('math') && tSub.includes('math')) ||
                                       (subLower.includes('comp') && tSub.includes('comp')) ||
                                       (subLower.includes('bio') && tSub.includes('bio'));
                    if (!subMatches) return false;
                    const grades = (t.grades || '').match(/\b(1[0-2]|[6-9])\b/g) || [];
                    return grades.length === 0 || grades.includes(String(numClass));
                });
                if (match && match.name) return { id: match.id, name: match.name };
            }
        } catch(e) {}

        if (subLower.includes('chem')) return { id: 'fac-chem', name: 'Ms. Renju' };
        if (subLower.includes('bio')) {
            return numClass <= 9 ? { id: 'fac-bio-lower', name: 'Mr. Madhusudanan' } : { id: 'fac-bio-upper', name: 'Mr. Gokul Krishnan' };
        }
        if (subLower.includes('phys')) return { id: 'fac-phy', name: 'Mr. Akshay Kumar M' };
        if (subLower.includes('comp') || /\bcs\b/i.test(subLower)) return { id: 'fac-cs', name: 'Mr. Abhai Kumar' };
        if (subLower.includes('math')) return { id: 'fac-math', name: 'Ms. Devi' };
        return { id: 'fac-phy', name: 'Mr. Akshay Kumar M' };
    }

    function updateTimetableFacultySync() {
        if (!classSelect || !subjectSelect || !facultySelect) return;
        const cls = classSelect.value;
        const sub = subjectSelect.value;
        const assigned = getOfficialAssignedTeacher(sub, cls);

        if (facultyHint) {
            facultyHint.innerHTML = `<i class="fas fa-check-circle mr-1"></i>Allotted Teacher: <strong>${assigned.name}</strong>`;
        }

        const autoOpt = facultySelect.querySelector('option[value="auto"]');
        if (autoOpt) {
            autoOpt.textContent = `⚡ Auto (${assigned.name} - Allotted)`;
        }
    }

    if (classSelect) classSelect.addEventListener('change', updateTimetableFacultySync);
    if (subjectSelect) subjectSelect.addEventListener('change', updateTimetableFacultySync);
    updateTimetableFacultySync();

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

        
        let facultyId = '';
        let facultyName = '';
        const facultySelect = document.getElementById('timetableFaculty');
        if (facultySelect && facultySelect.value && facultySelect.value !== 'auto') {
            facultyId = facultySelect.value;
            if (facultySelect.selectedOptions && facultySelect.selectedOptions[0]) {
                facultyName = facultySelect.selectedOptions[0].getAttribute('data-name') || '';
            }
        }

        // Auto-assign based on official allotment rules if not manually picked
        if (!facultyId || facultyId === 'auto' || !facultyName) {
            const assigned = getOfficialAssignedTeacher(subject, studentClass);
            facultyId = assigned.id;
            facultyName = assigned.name;
        }

        const entry = { date, startTime, endTime, class: studentClass, subject, location, board, sessionType, facultyId, facultyName };

        // Only replace if ALL fields are identical (exact duplicate). Otherwise always add as a new entry.
        const existingIdx = timetableEntries.findIndex(e =>
            e.class === studentClass &&
            e.date === date &&
            e.startTime === startTime &&
            e.endTime === endTime &&
            (e.subject || '').toLowerCase().trim() === (subject || '').toLowerCase().trim() &&
            (e.board || 'Both') === (board || 'Both') &&
            (e.sessionType || 'Regular') === (sessionType || 'Regular')
        );
        if (existingIdx !== -1) {
            timetableEntries[existingIdx] = entry;
        } else {
            timetableEntries.push(entry);
        }
        renderTimetable();

        // Instantly sync slot to Supabase classes table so it reflects in student & teacher apps in real-time
        (async () => {
            try {
                const sb = _getSupabaseClient();
                if (!sb) return;

                function _format12Hr(t) {
                    if (!t) return '';
                    if (t.includes('AM') || t.includes('PM') || t.includes('am') || t.includes('pm')) return t;
                    const parts = t.split(':');
                    const h = parseInt(parts[0], 10);
                    const m = parseInt(parts[1] || '0', 10);
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    const h12 = h % 12 || 12;
                    return h12 + ':' + (m < 10 ? '0' + m : m) + ' ' + ampm;
                }

                const gradeStr = studentClass.startsWith('Class') ? studentClass : 'Class ' + studentClass;
                let timeStr = (startTime && endTime) ? (`${_format12Hr(startTime)} - ${_format12Hr(endTime)}`) : _format12Hr(startTime || 'Scheduled');
                const sessType = (sessionType || 'Regular').trim();
                const sessionTag = (sessType === 'TP' || sessType.toLowerCase().includes('tp') || sessType.toLowerCase().includes('test'))
                    ? 'TP'
                    : (sessType === 'QuestionBank' || sessType.toLowerCase().includes('question') || sessType.toLowerCase().includes('qb'))
                    ? 'Question Bank'
                    : 'Regular';
                const statusStr = 'upcoming' + (sessType && sessType !== 'Regular' ? ':' + sessType : '') + (facultyId ? ':' + facultyId : '');
                const timeParts = [timeStr];
                if (sessType && sessType !== 'Regular') {
                    timeParts.push(sessionTag);
                }
                if (facultyName) {
                    timeParts.push(facultyName);
                }
                const finalTime = timeParts.join(' • ');

                // Clean duplicate slot for same class, date, subject and time prefix
                await sb.from('classes')
                    .delete()
                    .eq('class_grade', gradeStr)
                    .eq('class_date', date)
                    .eq('subject', subject)
                    .ilike('time', timeStr + '%');

                await sb.from('classes')
                    .delete()
                    .eq('roll_no', gradeStr)
                    .eq('class_date', date)
                    .eq('subject', subject)
                    .ilike('time', timeStr + '%');

                await sb.from('classes').insert({
                    roll_no: gradeStr,
                    class_grade: gradeStr,
                    subject: subject,
                    time: finalTime,
                    status: statusStr,
                    published: true,
                    class_date: date,
                });
                console.log('[Timetable] Synced to Supabase:', gradeStr, subject, finalTime);
            } catch (syncErr) {
                console.warn('[Timetable] Auto-sync to Supabase warning:', syncErr);
            }
        })();

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
        const rawEntries = (typeof timetableEntries !== 'undefined' && timetableEntries.length > 0) 
            ? timetableEntries 
            : (window.timetableEntries || []);

        if (!rawEntries || rawEntries.length === 0) {
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

            // Deduplicate entries: key must include ALL distinguishing fields so different boards/session types are preserved
            const entriesMap = new Map();
            rawEntries.forEach(e => {
                const rawCls = String(e.class || '').trim();
                const gradeStr = rawCls.startsWith('Class') ? rawCls : 'Class ' + rawCls;
                const normSub = (e.subject || '').trim().toLowerCase();
                const boardVal = (e.board || 'Both').trim();
                const sessVal = (e.sessionType || 'Regular').trim();
                // Key includes ALL fields so multiple sessions with same time but different board/type are NEVER dropped
                const key = gradeStr + '_' + normSub + '_' + e.date + '_' + (e.startTime || '') + '_' + (e.endTime || '') + '_' + boardVal + '_' + sessVal;
                entriesMap.set(key, e);
            });
            const deduplicatedEntries = Array.from(entriesMap.values());

            const rowsToInsert = [];
            const announcementsToInsert = [];

            for (const entry of deduplicatedEntries) {
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

                // 1. Delete only matching slot if already present with same time to prevent duplicates
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
                    .ilike('time', timeStr + '%');

                // 2. Insert exactly 1 clean class session with session type preserved
                const sessType = (entry.sessionType || 'Regular').trim();
                const sessionTag = (sessType === 'TP' || sessType.toLowerCase().includes('tp') || sessType.toLowerCase().includes('test'))
                    ? 'TP'
                    : (sessType === 'QuestionBank' || sessType.toLowerCase().includes('question') || sessType.toLowerCase().includes('qb'))
                    ? 'Question Bank'
                    : 'Regular';
                const statusStr = 'upcoming' + (sessType && sessType !== 'Regular' ? ':' + sessType : '') + (entry.facultyId ? ':' + entry.facultyId : '');
                const timeParts = [timeStr];
                if (sessType && sessType !== 'Regular') {
                    timeParts.push(sessionTag);
                }
                if (entry.facultyName) {
                    timeParts.push(entry.facultyName);
                }

                rowsToInsert.push({
                    roll_no: gradeStr,
                    class_grade: gradeStr,
                    subject: entry.subject,
                    time: timeParts.join(' • '),
                    status: statusStr,
                    published: true,
                    class_date: entry.date,
                });

                announcementsToInsert.push({
                    title: '🗓️ Timetable: ' + gradeStr + ' - ' + entry.subject + (entry.facultyName ? ' (' + entry.facultyName + ')' : ''),
                    description: 'Date: ' + formatDateFriendly(entry.date) + ' | Time: ' + timeStr + (entry.facultyName ? ' | Faculty: ' + entry.facultyName : '') + ' | Venue: ' + (entry.location || 'In Center') + ' (' + (entry.board || 'Both') + ' Board). Check your schedule tab.',
                    author: entry.facultyName || 'Center Admin',
                    tag: 'Timetable',
                    important: true,
                });
            }

            // 1. Insert clean sessions into Supabase
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
            if (typeof switchTimetableMode === 'function') {
                switchTimetableMode('live');
            } else if (typeof window.initLiveAppTimetable === 'function') {
                window.initLiveAppTimetable('liveTimetablePlatform');
            }
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

    window.markAllAttendance = function (isPresent) {
        const table = document.getElementById('attendanceTableBody');
        if (!table) return;
        const checkboxes = table.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = !!isPresent;
            const id = cb.id.replace('att_', '');
            if (typeof togglePresent === 'function') {
                togglePresent(id);
            }
        });
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
    window.renderStudentManagementList = async function renderStudentManagementList() {
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
            let joinText = '';
            if (s.joiningDate || s.joining_date) {
                const rawDate = s.joiningDate || s.joining_date;
                try {
                    const parsed = new Date(rawDate);
                    joinText = isNaN(parsed.getTime()) ? rawDate : parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                } catch(e) {
                    joinText = rawDate;
                }
            }
            const feeVal = s.amount || s.monthly_fee || '-';
            const subStr = Array.isArray(s.subjects) && s.subjects.length > 0 ? s.subjects.join(', ') : (typeof s.subjects === 'string' && s.subjects ? s.subjects : 'General');
            const phoneVal = s.phone || '-';

            tr.innerHTML = `
                <td>
                    <span class="font-weight-bold" style="color:#003366;">${s.name || 'Student'}</span>
                    ${s.rollNo ? `<br><small class="badge badge-light border text-muted" style="font-size:0.7rem;">${s.rollNo}</small>` : ''}
                    ${joinText ? `<br><small class="text-muted" style="font-size:0.75rem;">Joined: ${joinText}</small>` : ''}
                </td>
                <td>Class ${s.class}</td>
                <td class="font-weight-bold" style="color:#1a7a3c;">₹${feeVal}</td>
                <td>${phoneVal}</td>
                <td>${subStr}</td>
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
        document.getElementById('joiningDate').value = _formatToDateInputValue(student.joiningDate || student.joining_date);
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

    const attStatusEl = document.getElementById('attendanceSyncStatus');
    try {
        if (typeof sb_saveAttendance === 'function') {
            await sb_saveAttendance({
                date: dateVal,
                subject: subVal,
                className: 'Class ' + classVal,
                records: records
            });
            if (attStatusEl) {
                attStatusEl.innerHTML = `<span class="badge badge-success px-3 py-2" style="font-size:0.9rem;"><i class="fas fa-check-circle mr-1"></i> Attendance synced to Google Sheets & Supabase! (${records.length} students)</span>`;
                setTimeout(() => { if (attStatusEl) attStatusEl.innerHTML = ''; }, 6000);
            }
            alert('✓ Attendance synced successfully to Google Sheets & Supabase!\n\nStudent and Faculty apps will now reflect the attendance.');
        } else {
            if (attStatusEl) {
                attStatusEl.innerHTML = `<span class="badge badge-warning px-3 py-2"><i class="fas fa-exclamation-triangle mr-1"></i> Cloud sync client not available.</span>`;
            }
            alert('Cloud sync client not available.');
        }
    } catch (err) {
        if (attStatusEl) {
            attStatusEl.innerHTML = `<span class="badge badge-danger px-3 py-2"><i class="fas fa-times-circle mr-1"></i> Failed to sync: ${err.message}</span>`;
        }
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
    if (!sb) { tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-3">Database not initialized.</td></tr>'; return; }
    try {
        const { data, error } = await sb.from('fees_records').select('*');
        if (error) throw error;
        const pending = [];
        (data || []).forEach(record => {
            const payments = Array.isArray(record.recent_payments) ? record.recent_payments : [];
            const pItem = payments.find(p => p.status === 'pending_verification');
            if (pItem) pending.push({ record, payment: pItem });
        });
        if (pending.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="text-center text-success py-3"><i class="fas fa-check-circle mr-1"></i> All fees cleared!</td></tr>'; return; }
        tbody.innerHTML = '';
        pending.forEach(({ record, payment }) => {
            const tr = document.createElement('tr');
            const studentName = payment.studentName || record.roll_no;
            const rollNo = record.roll_no || '';
            const amount = payment.amount || record.current_due || 4000;
            const utr = payment.utr || 'UPI-APP';
            const submittedAt = payment.submittedAt ? new Date(payment.submittedAt).toLocaleString('en-IN', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : 'Today';
            const studentClass = payment.studentClass || record.student_class || '';
            const hasScreenshot = payment.screenshot && (payment.screenshot.startsWith('data:image') || payment.screenshot.startsWith('http'));
            const screenshotHtml = hasScreenshot ? '<img src="' + payment.screenshot + '" style="width:52px;height:52px;object-fit:cover;border-radius:6px;border:1.5px solid #e5e7eb;cursor:pointer" onclick="window.open(this.src,\'_blank\')" title="View receipt" />' : '<span class="text-muted small">No screenshot</span>';
            const classBadge = studentClass ? ('<span class="badge badge-info">' + studentClass + '</span> ') : '';
            tr.innerHTML = '<td><strong>' + studentName + '</strong></td>' +
                '<td>' + classBadge + '<small class="text-muted">' + rollNo + '</small></td>' +
                '<td><strong class="text-primary">&#8377;' + amount.toLocaleString('en-IN') + '</strong></td>' +
                '<td><code>' + utr + '</code></td>' +
                '<td>' + screenshotHtml + '</td>' +
                '<td><small class="text-muted">' + submittedAt + '</small></td>' +
                '<td><button class="btn btn-sm btn-success shadow-sm mr-1" onclick="approveStudentFee(\'' + rollNo + '\',\'' + studentName + '\',' + amount + ',\'' + utr + '\')"><i class="fas fa-check-circle mr-1"></i> Approve</button><button class="btn btn-sm btn-outline-danger shadow-sm" onclick="rejectStudentFee(\'' + rollNo + '\',' + amount + ')"><i class="fas fa-times"></i></button></td>';
            tbody.appendChild(tr);
        });
    } catch (e) { console.error(e); tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-3">Failed to load.</td></tr>'; }
};

window.approveStudentFee = async function(rollNo, studentName, amount, utr) {
    if (!confirm('Approve ₹' + amount + ' from ' + studentName + '? This marks the student as PAID.')) return;
    const sb = _getSafeAdminSupabase ? _getSafeAdminSupabase() : _getSupabaseClient();
    if (!sb) return;
    try {
        const now = new Date();
        const paidOnStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        const mNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
        const mLong = ['January','February','March','April','May','June','July','August','September','October','November','December'];

        const { data: rec } = await sb.from('fees_records').select('*').eq('roll_no', rollNo).maybeSingle();
        const cur = Array.isArray(rec && rec.recent_payments) ? rec.recent_payments : [];
        const approvedOnly = cur.filter(p => p.status !== 'pending_verification');

        // Month being approved = the month on the student's pending proof.
        // Fallback: the oldest month (since Jan / joining) with no approved payment.
        const pend = cur.find(p => p.status === 'pending_verification');
        let curMonth, fullMonth, monthLong;
        const keyOf = (p) => {
            let mi = -1, yr = now.getFullYear();
            if (p.fullMonth) {
                const parts = String(p.fullMonth).split(' ');
                mi = mLong.findIndex(m => m.toLowerCase() === (parts[0] || '').toLowerCase());
                if (parts[1] && !isNaN(Number(parts[1]))) yr = Number(parts[1]);
            }
            if (mi < 0 && p.month) mi = mNames.indexOf(String(p.month).slice(0, 3).toUpperCase());
            return mi >= 0 ? yr * 12 + mi : null;
        };
        const paidKeys = new Set(approvedOnly.map(keyOf).filter(k => k !== null));
        if (pend && pend.month && pend.fullMonth) {
            curMonth = pend.month;
            fullMonth = pend.fullMonth;
            monthLong = String(pend.fullMonth).split(' ')[0];
        } else {
            let k = now.getFullYear() * 12;
            const curKey = now.getFullYear() * 12 + now.getMonth();
            while (k <= curKey && paidKeys.has(k)) k++;
            while (paidKeys.has(k)) k++;
            curMonth = mNames[k % 12];
            monthLong = mLong[k % 12];
            fullMonth = monthLong + ' ' + Math.floor(k / 12);
        }
        const approvedKey = keyOf({ month: curMonth, fullMonth: fullMonth });
        if (approvedKey !== null) paidKeys.add(approvedKey);

        const paymentEntry = {
            month: curMonth,
            fullMonth: fullMonth,
            paidOn: paidOnStr,
            amount: amount,
            onTime: true,
            status: 'Verified by Center Admin',
            receiptNo: 'REC-' + now.getFullYear() + '-' + curMonth + '-' + Math.floor(1000 + Math.random() * 9000),
            utr: utr || 'ADMIN-APPROVED'
        };
        const updated = [paymentEntry, ...approvedOnly];

        const existingLoyalty = Array.isArray(rec && rec.loyalty_months) ? [...rec.loyalty_months] : [];
        if (!existingLoyalty.some(l => l.label === monthLong || l.label === fullMonth)) {
            existingLoyalty.push({ label: monthLong, earned: true });
        }

        // Fully paid only if every month up to NOW (since Jan / joining) has an approved payment
        let firstUnpaid = null;
        let unpaidCount = 0;
        const nowKey = now.getFullYear() * 12 + now.getMonth();
        for (let k = now.getFullYear() * 12; k <= nowKey; k++) {
            if (!paidKeys.has(k)) {
                unpaidCount++;
                if (firstUnpaid === null) firstUnpaid = k;
            }
        }
        const fullyPaid = firstUnpaid === null;
        const stuList = typeof getStudents === 'function' ? getStudents() : [];
        const matchedStudent = stuList.find(s => s.id === rollNo || s.rollNo === rollNo || s.phone === rollNo);
        const monthlyAmt = Number(matchedStudent?.amount) || Number(amount) || 4000;
        const currentDue = fullyPaid ? 0 : (unpaidCount * monthlyAmt);

        const upd = {
            current_due: currentDue,
            loyalty_months: existingLoyalty,
            recent_payments: updated,
            updated_at: now.toISOString()
        };
        if (fullyPaid) {
            upd.due_date = 'All Cleared';
            upd.days_left = 0;
        } else if (firstUnpaid !== null) {
            upd.due_date = '15 ' + mLong[firstUnpaid % 12] + ' ' + Math.floor(firstUnpaid / 12);
        }
        const { error } = await sb.from('fees_records').update(upd).eq('roll_no', rollNo);

        if (error) throw error;

        // Broadcast to mobile app
        try {
            await sb.channel('fee_realtime_broadcast').send({
                type: 'broadcast',
                event: 'fee_approved',
                payload: { rollNo, approvedAt: now.toISOString() }
            });
        } catch (be) { console.warn('Broadcast:', be); }

        // Update local fees cache under both key variants
        if (typeof getFees === 'function' && typeof getStudents === 'function') {
            const fees = getFees();
            const students = getStudents();
            const matched = students.find(s => s.id === rollNo || s.rollNo === rollNo || s.phone === rollNo);
            const subjects = (matched && Array.isArray(matched.subjects) && matched.subjects.length > 0) ? matched.subjects : ['General'];
            subjects.forEach(sub => {
                const y = now.getFullYear();
                fees[rollNo + '_' + sub + '_' + monthLong + '_' + y] = 'Paid';
                fees[rollNo + '_' + sub + '_' + monthLong + ' ' + y] = 'Paid';
                if (matched && matched.id) {
                    fees[matched.id + '_' + sub + '_' + monthLong + '_' + y] = 'Paid';
                    fees[matched.id + '_' + sub + '_' + monthLong + ' ' + y] = 'Paid';
                }
            });
            if (typeof saveFees === 'function') saveFees(fees);
        }

        // Update in-memory feeMap
        if (window._supabaseFeeMap) {
            window._supabaseFeeMap.set(String(rollNo).toUpperCase().trim(), {
                ...(rec || {}),
                ...upd,
                recent_payments: updated
            });
        }

        alert('Payment Verified! ' + studentName + ' marked as Paid in Supabase.');
        if (typeof window.loadPendingVerifications === 'function') window.loadPendingVerifications();
        if (typeof window.loadFeeTable === 'function') window.loadFeeTable();
    } catch (e) {
        alert('Failed to approve: ' + (e.message || e));
    }
};

window.rejectStudentFee = async function(rollNo, pendingAmount) {
    if (!confirm('Reject payment for ' + rollNo + '? Status will revert to Due.')) return;
    const sb = _getSafeAdminSupabase ? _getSafeAdminSupabase() : _getSupabaseClient();
    if (!sb) return;
    try {
        const { data: rec } = await sb.from('fees_records').select('recent_payments, current_due').eq('roll_no', rollNo).maybeSingle();
        const cur = Array.isArray(rec && rec.recent_payments) ? rec.recent_payments : [];
        const updated = cur.filter(p => p.status !== 'pending_verification');
        const restoreAmount = pendingAmount || (rec && rec.current_due) || 4000;
        await sb.from('fees_records').update({
            current_due: restoreAmount,
            status: 'due',
            recent_payments: updated,
            updated_at: new Date().toISOString()
        }).eq('roll_no', rollNo);

        try {
            await sb.channel('fee_realtime_broadcast').send({
                type: 'broadcast',
                event: 'fee_rejected',
                payload: { rollNo, rejectedAt: new Date().toISOString() }
            });
        } catch (be) { console.warn('Broadcast:', be); }

        alert('Payment rejected. Student status set to Due.');
        if (typeof window.loadPendingVerifications === 'function') window.loadPendingVerifications();
        if (typeof window.loadFeeTable === 'function') window.loadFeeTable();
    } catch (e) {
        alert('Failed to reject: ' + (e.message || e));
    }
};

// --- PENDING TEST APPROVAL (FACULTY SUBMITTED TESTS) ---
window.loadPendingTests = async function() {
    const container = document.getElementById('pendingTestsContainer');
    if (!container) return;
    const sb = _getSupabaseClient();
    if (!sb) { container.innerHTML = '<p class="text-muted">Database not initialized.</p>'; return; }
    try {
        const { data, error } = await sb.from('pending_tests').select('*').eq('status', 'pending_approval').order('submitted_at', { ascending: false });
        if (error) throw error;
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-success py-2"><i class="fas fa-check-circle mr-1"></i> No pending test submissions.</p>';
            return;
        }
        container.innerHTML = '';
        data.forEach(test => {
            const card = document.createElement('div');
            card.className = 'card mb-3 border-0 shadow-sm';
            card.style.cssText = 'border-radius:12px;overflow:hidden;border-left:4px solid #8B5CF6 !important';
            const syllabusHtml = Array.isArray(test.syllabus) ? test.syllabus.map(s => '<li>' + s + '</li>').join('') : '<li>' + (test.syllabus || 'N/A') + '</li>';
            card.innerHTML =
                '<div class="card-body p-3">' +
                '<div class="d-flex justify-content-between align-items-start mb-2">' +
                '<div>' +
                '<span class="badge badge-info mr-1">' + (test.subject || '') + '</span>' +
                '<span class="badge badge-secondary">' + (test.class_tag || '') + '</span>' +
                '<h6 class="mb-0 mt-1" style="font-weight:700">' + (test.title || '') + '</h6>' +
                '<small class="text-muted">By: ' + (test.faculty_name || 'Faculty') + ' &bull; Date: ' + (test.date_str || 'TBD') + ' &bull; Max: ' + (test.max_marks || 100) + ' marks</small>' +
                '</div>' +
                '<span class="badge badge-warning">Pending</span>' +
                '</div>' +
                '<ul class="mb-2 small">' + syllabusHtml + '</ul>' +
                '<div class="row mb-2">' +
                '<div class="col-6"><label class="small font-weight-bold">Time</label><input type="text" class="form-control form-control-sm" id="test_time_' + test.test_id + '" placeholder="e.g. 4:30 PM - 6:00 PM" /></div>' +
                '<div class="col-6"><label class="small font-weight-bold">Venue / Room</label><input type="text" class="form-control form-control-sm" id="test_venue_' + test.test_id + '" placeholder="e.g. Room 204" /></div>' +
                '</div>' +
                '<div class="d-flex flex-wrap" style="gap: 8px;">' +
                '<button class="btn btn-sm btn-success" onclick="approvePendingTest(\'' + test.test_id + '\',\'' + (test.id || '') + '\',\'' + (test.class_tag || '') + '\',\'' + (test.subject || '') + '\')">' +
                '<i class="fas fa-check-circle mr-1"></i> Approve & Publish</button>' +
                '<button class="btn btn-sm btn-outline-danger" onclick="rejectPendingTest(\'' + (test.id || '') + '\')">' +
                '<i class="fas fa-times mr-1"></i> Reject</button>' +
                '</div>' +
                '</div>';
            container.appendChild(card);
        });
    } catch (e) {
        container.innerHTML = '<p class="text-danger">Error: ' + (e.message || e) + '</p>';
    }
};

window.approvePendingTest = async function(testId, rowId, classTag, subject) {
    const timeInput = document.getElementById('test_time_' + testId);
    const venueInput = document.getElementById('test_venue_' + testId);
    const timeStr = (timeInput && timeInput.value.trim()) || 'TBD';
    const venueStr = (venueInput && venueInput.value.trim()) || 'TBD';
    if (!confirm('Approve this test? Time: ' + timeStr + ', Venue: ' + venueStr + '. This will broadcast to students.')) return;
    const sb = _getSupabaseClient();
    if (!sb) return;
    try {
        await sb.from('pending_tests').update({ status: 'approved', approved_at: new Date().toISOString(), time_str: timeStr, venue_str: venueStr }).eq('id', rowId);
        
        // 1. Fetch test details for clean sync
        const { data: ptData } = await sb.from('pending_tests').select('*').eq('id', rowId).maybeSingle();
        const examDate = (ptData && ptData.date_str) || new Date().toISOString().split('T')[0];
        const teacherName = (ptData && ptData.faculty_name) || 'Faculty Member';
        const marks = (ptData && ptData.max_marks) || 100;
        const syl = Array.isArray(ptData?.syllabus) ? ptData.syllabus.join(', ') : (ptData?.syllabus || 'Full Syllabus');

        // 2. Publish as academic alert to student dashboard
        await sb.from('announcements').insert({
            title: '[' + classTag + '] ' + (ptData?.title || 'Test Paper') + ' (' + subject + ')',
            description: 'Exam Date: ' + examDate + '\nMax Marks: ' + marks + '\nVenue: ' + venueStr + '\nSyllabus: ' + syl + '\nSubmitted by: ' + teacherName,
            time_label: 'Exam: ' + examDate,
            author: teacherName,
            icon: 'calendar',
            icon_bg: '#EFF6FF',
            icon_color: '#1A56DB',
            tag: 'Test Alert',
            important: true,
        });

        // 3. Sync to classes table as Test Paper slot so it appears in student & faculty timetables
        await sb.from('classes').delete().eq('class_grade', classTag).eq('class_date', examDate).eq('subject', subject);
        await sb.from('classes').insert({
            roll_no: classTag,
            class_grade: classTag,
            subject: subject,
            class_date: examDate,
            time: (timeStr && timeStr !== 'TBD' ? timeStr : '11:30 AM - 12:00 PM') + ' • Test Paper • ' + teacherName,
            status: 'upcoming:TP',
            published: true,
        });
        alert('Test approved and broadcast to students!');
        window.loadPendingTests();
    } catch (e) {
        alert('Failed to approve: ' + (e.message || e));
    }
};

window.rejectPendingTest = async function(rowId) {
    if (!confirm('Reject this test request?')) return;
    const sb = _getSupabaseClient();
    if (!sb) return;
    try {
        await sb.from('pending_tests').update({ status: 'rejected', rejected_at: new Date().toISOString() }).eq('id', rowId);
        alert('Test request rejected.');
        window.loadPendingTests();
    } catch (e) {
        alert('Failed to reject: ' + (e.message || e));
    }
};
