/**
 * Live Mobile App Timetable Management Platform
 * Provides real-time viewing, inline editing, toggling publication, and deleting
 * of timetable class sessions published to the EduHome Mobile App (Supabase 'classes' table).
 * Integrated with the "Assign Teachers" allotment system for accurate faculty assignments.
 */

(function () {
    let _liveClasses = [];
    let _realtimeChannel = null;
    let _activeFilterClass = 'all';
    let _activeFilterSyllabus = 'all';

    function _resolveLiveItemSyllabus(item) {
        if (!item) return 'Both';
        const status = (item.status || '').toLowerCase();
        const time = (item.time || '').toLowerCase();
        const board = (item.board || item.target_syllabus || item.targetSyllabus || item.syllabus || '').toLowerCase();
        const roll = (item.roll_no || '').toLowerCase();
        const grade = (item.class_grade || '').toLowerCase();

        // 0. Explicit Both / Shared
        if (
            board === 'both' || board.includes('both') ||
            status.split(':').includes('both') || status.includes(':both') || status.includes('both:') ||
            time.includes('both') || time.includes('state & cbse') || time.includes('cbse & state')
        ) {
            return 'Both';
        }

        // 1. Explicit CBSE
        if (
            board === 'cbse' || board === 'cbse only' ||
            status.split(':').includes('cbse') || status.includes(':cbse') || status.includes('cbse:') || status === 'cbse' ||
            (time.includes('• cbse') && !time.includes('state & cbse') && !time.includes('cbse & state')) ||
            time.includes('(cbse)') || time.includes('cbse only') || /\bcbse\b/i.test(time) ||
            roll.includes('cbse') || grade.includes('cbse')
        ) {
            return 'CBSE';
        }

        // 2. Explicit State Syllabus
        if (
            board === 'state' || board === 'state only' || board === 'state syllabus' ||
            status.split(':').includes('state') || status.includes(':state') || status.includes('state:') || status.includes('state syllabus') ||
            (time.includes('• state') && !time.includes('state & cbse') && !time.includes('cbse & state')) ||
            time.includes('(state)') || time.includes('state syllabus') || /\bstate\b/i.test(time) ||
            roll.includes('state') || grade.includes('state')
        ) {
            return 'State Syllabus';
        }

        return 'Both';
    }
    let _activeFilterDate = 'all';
    let _activeCustomDate = '';
    let _searchQuery = '';
    let _currentEditId = null;

    // Standard subject emojis & badge colors
    const SUBJECT_META = {
        'Physics': { emoji: '⚛️', color: '#0284c7', bg: '#e0f2fe' },
        'Chemistry': { emoji: '🧪', color: '#059669', bg: '#d1fae5' },
        'Maths': { emoji: '📐', color: '#d97706', bg: '#fef3c7' },
        'Biology': { emoji: '🧬', color: '#16a34a', bg: '#dcfce7' },
        'Computer Science': { emoji: '💻', color: '#7c3aed', bg: '#ede9fe' },
        'General': { emoji: '📖', color: '#475569', bg: '#f1f5f9' },
        'No Class': { emoji: '☕', color: '#dc2626', bg: '#fee2e2' }
    };

    // Official Default Assigned Faculty Roster matching Assign Teachers & Supabase
    const DEFAULT_ASSIGNED_TEACHERS = [
        { id: 'fac-phy', name: 'Mr. Akshay Kumar M', subject: 'Physics', grades: ['8', '9', '10', '11', '12'], dept: 'Science Department' },
        { id: 'fac-chem', name: 'Ms. Renju', subject: 'Chemistry', grades: ['10', '11', '12'], dept: 'Senior Science Department' },
        { id: 'fac-bio-lower', name: 'Mr. Madhusudanan', subject: 'Biology (Lower)', grades: ['6', '7', '8', '9'], dept: 'Secondary Science Department' },
        { id: 'fac-bio-upper', name: 'Mr. Gokul Krishnan', subject: 'Biology (Upper)', grades: ['10', '11', '12'], dept: 'Senior Science Department' },
        { id: 'fac-math', name: 'Ms. Devi', subject: 'Mathematics', grades: ['6', '7', '8', '9', '10', '11', '12'], dept: 'Mathematics Department' },
        { id: 'fac-cs', name: 'Mr. Abhai Kumar', subject: 'Computer Science', grades: ['11', '12'], dept: 'Computer Applications & IT' }
    ];

    // Outdated placeholder faculty names that should be flagged for correction
    const OUTDATED_PLACEHOLDERS = [
        'rajesh menon', 'ramesh nair', 'arun k. varma', 'arun varma', 'deepa anoop', 'suresh kumar', 'ananya sharma'
    ];

    let _assignedTeachers = [...DEFAULT_ASSIGNED_TEACHERS];

    function _getSubjectMeta(sub) {
        if (!sub) return SUBJECT_META['General'];
        for (const [k, v] of Object.entries(SUBJECT_META)) {
            if (sub.toLowerCase().includes(k.toLowerCase())) return v;
        }
        return SUBJECT_META['General'];
    }

    function _getSb() {
        if (typeof _getSupabaseClient === 'function') return _getSupabaseClient();
        if (typeof window._getSupabaseClient === 'function') return window._getSupabaseClient();
        if (typeof window.supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL) {
            try {
                return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            } catch (e) {
                console.warn('[LiveTimetable] Error creating Supabase client:', e);
            }
        }
        return null;
    }

    // Helper: show toast notification
    function _showToast(message, isError) {
        let toast = document.getElementById('_liveTimetableToast');
        if (toast) toast.remove();

        toast = document.createElement('div');
        toast.id = '_liveTimetableToast';
        toast.innerHTML = (isError ? '⚠️ ' : '✅ ') + message;
        toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999999;padding:12px 20px;border-radius:10px;font-weight:600;font-size:0.92rem;box-shadow:0 10px 25px rgba(0,0,0,0.18);transition:all 0.3s cubic-bezier(0.16, 1, 0.3, 1);'
            + (isError ? 'background:#fee2e2;color:#991b1b;border:1px solid #f87171;' : 'background:#ecfdf5;color:#065f46;border:1px solid #34d399;');

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // Format friendly date
    function _friendlyDate(dateStr) {
        if (!dateStr) return 'Unscheduled';
        try {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2], 10);
                const target = new Date(year, month, day);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);

                const dayDiff = Math.round((target - today) / (1000 * 60 * 60 * 24));
                const formatted = target.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

                if (dayDiff === 0) return `Today (${formatted})`;
                if (dayDiff === 1) return `Tomorrow (${formatted})`;
                if (dayDiff === -1) return `Yesterday (${formatted})`;
                return formatted;
            }
        } catch (e) {}
        return dateStr;
    }

    // Parse time and faculty name
    function _parseTimeDetails(rawTime) {
        if (!rawTime) return { time: 'Scheduled', faculty: '', sessionType: '' };
        if (rawTime.includes('•')) {
            const parts = rawTime.split('•').map(p => p.trim()).filter(Boolean);
            const timeSlot = parts[0] || 'Scheduled';
            let faculty = '';
            let sessionType = '';
            for (let i = 1; i < parts.length; i++) {
                const p = parts[i];
                const pl = p.toLowerCase();
                if (pl === 'tp' || pl.includes('test paper') || pl.includes('tp session')) {
                    sessionType = 'TP';
                } else if (pl === 'question bank' || pl === 'qb') {
                    sessionType = 'QuestionBank';
                } else if (pl === 'regular' || pl.includes('regular class')) {
                    sessionType = 'Regular';
                } else {
                    faculty = p;
                }
            }
            return { time: timeSlot, faculty, sessionType };
        }
        return { time: rawTime.trim(), faculty: '', sessionType: '' };
    }

    // Extract base status, faculty ID, and session type
    function _parseStatus(rawStatus) {
        if (!rawStatus) return { status: 'upcoming', facultyId: '', sessionType: '' };
        const parts = rawStatus.split(':').map(p => p.trim()).filter(Boolean);
        const baseStatus = parts[0] || 'upcoming';
        let facultyId = '';
        let sessionType = '';
        for (let i = 1; i < parts.length; i++) {
            const p = parts[i];
            const pl = p.toLowerCase();
            if (p.startsWith('fac-') || p === 'fac') {
                facultyId = p;
            } else if (pl === 'tp' || pl.includes('test')) {
                sessionType = 'TP';
            } else if (pl === 'questionbank' || pl === 'qb' || pl.includes('question')) {
                sessionType = 'QuestionBank';
            } else if (pl === 'regular') {
                sessionType = 'Regular';
            }
        }
        return { status: baseStatus, facultyId, sessionType };
    }

    // ── Load Assigned Teachers from Supabase / localStorage ───────────────
    async function loadAssignedTeachers() {
        const sb = _getSb();
        if (sb) {
            try {
                const { data, error } = await sb.from('teachers').select('*');
                if (!error && Array.isArray(data) && data.length > 0) {
                    _assignedTeachers = data.map(t => {
                        const gradeMatches = (t.subjects || '').match(/\b(1[0-2]|[6-9])\b/g) || [];
                        return {
                            id: t.faculty_id || t.id,
                            name: t.name || 'Faculty Member',
                            subject: t.subjects ? t.subjects.split('(')[0].trim() : 'General',
                            grades: gradeMatches.length > 0 ? gradeMatches : ['6', '7', '8', '9', '10', '11', '12'],
                            phone: t.phone || '',
                            dept: t.role || 'Faculty'
                        };
                    });
                    try {
                        localStorage.setItem('eduhome_faculty_allotments', JSON.stringify(_assignedTeachers));
                    } catch (e) {}
                    return _assignedTeachers;
                }
            } catch (err) {
                console.warn('[LiveTimetable] Failed to fetch teachers from Supabase:', err);
            }
        }

        // Fallback to localStorage
        try {
            const stored = JSON.parse(localStorage.getItem('eduhome_faculty_allotments') || '[]');
            if (Array.isArray(stored) && stored.length > 0) {
                _assignedTeachers = stored.map(t => {
                    const gradeMatches = typeof t.grades === 'string'
                        ? (t.grades.match(/\b(1[0-2]|[6-9])\b/g) || [])
                        : (t.grades || []);
                    return {
                        id: t.id,
                        name: t.name,
                        subject: t.subject,
                        grades: gradeMatches,
                        dept: t.dept || 'Faculty',
                        phone: t.phone || ''
                    };
                });
                return _assignedTeachers;
            }
        } catch (e) {}

        _assignedTeachers = [...DEFAULT_ASSIGNED_TEACHERS];
        return _assignedTeachers;
    }

    // ── Resolve Allotted Teacher based on Subject & Grade ────────────────
    function getAssignedFacultyFor(subject, rawGrade) {
        const gradeNumMatch = String(rawGrade || '').match(/\b(1[0-2]|[6-9])\b/);
        const gradeNum = gradeNumMatch ? parseInt(gradeNumMatch[0], 10) : 10;
        const gradeStr = String(gradeNum);
        const subLower = (subject || '').toLowerCase().trim();

        // 1. Search in loaded _assignedTeachers
        if (Array.isArray(_assignedTeachers) && _assignedTeachers.length > 0) {
            const match = _assignedTeachers.find(t => {
                const tSub = (t.subject || '').toLowerCase();
                let subMatches = false;
                if (subLower.includes('chem') && tSub.includes('chem')) subMatches = true;
                else if (subLower.includes('phys') && tSub.includes('phys')) subMatches = true;
                else if (subLower.includes('math') && tSub.includes('math')) subMatches = true;
                else if ((subLower.includes('comp') || /\bcs\b/i.test(subLower)) && (tSub.includes('comp') || /\bcs\b/i.test(tSub))) subMatches = true;
                else if (subLower.includes('bio') && tSub.includes('bio')) {
                    if (gradeNum <= 9 && (tSub.includes('lower') || tSub.includes('secondary'))) subMatches = true;
                    else if (gradeNum >= 10 && (tSub.includes('upper') || tSub.includes('senior'))) subMatches = true;
                    else if (!tSub.includes('lower') && !tSub.includes('upper')) subMatches = true;
                }
                if (!subMatches) return false;

                const tGrades = Array.isArray(t.grades)
                    ? t.grades
                    : (String(t.grades || '').match(/\b(1[0-2]|[6-9])\b/g) || []);
                return tGrades.length === 0 || tGrades.includes(gradeStr);
            });

            if (match && match.name) {
                return { id: match.id, name: match.name, full: match };
            }
        }

        // 2. Official Standard Fallback
        if (subLower.includes('chem')) return { id: 'fac-chem', name: 'Ms. Renju' };
        if (subLower.includes('bio')) {
            return gradeNum <= 9
                ? { id: 'fac-bio-lower', name: 'Mr. Madhusudanan' }
                : { id: 'fac-bio-upper', name: 'Mr. Gokul Krishnan' };
        }
        if (subLower.includes('phys')) return { id: 'fac-phy', name: 'Mr. Akshay Kumar M' };
        if (subLower.includes('comp') || /\bcs\b/i.test(subLower)) return { id: 'fac-cs', name: 'Mr. Abhai Kumar' };
        if (subLower.includes('math')) return { id: 'fac-math', name: 'Ms. Devi' };
        return { id: 'fac-phy', name: 'Mr. Akshay Kumar M' };
    }

    // Check if faculty name is an outdated placeholder
    function isFacultyOutdated(facultyName) {
        if (!facultyName) return false;
        const norm = facultyName.toLowerCase();
        return OUTDATED_PLACEHOLDERS.some(old => norm.includes(old));
    }

    // ── Load classes from Supabase ──────────────────────────────────────
    async function loadLiveClasses(containerId) {
        const sb = _getSb();
        const container = document.getElementById(containerId || 'liveTimetablePlatform');
        if (!container) return;

        if (!sb) {
            container.innerHTML = `
                <div class="alert alert-warning border-warning shadow-sm p-4 text-center">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2 text-warning"></i>
                    <h5>Database Connection Not Configured</h5>
                    <p class="mb-0 text-muted">Please check your Supabase credentials in <code>js/config.js</code> to view and manage live timetable entries.</p>
                </div>
            `;
            return;
        }

        try {
            // First ensure assigned teachers are fresh
            await loadAssignedTeachers();

            const { data, error } = await sb
                .from('classes')
                .select('*')
                .order('class_date', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(150);

            if (error) {
                console.error('[LiveTimetable] Error fetching classes:', error);
                throw error;
            }

            _liveClasses = data || [];
            renderPlatform(containerId);
            updateBadgeCounters();
        } catch (err) {
            console.error('[LiveTimetable] Fetch error:', err);
            const body = document.getElementById('liveTableBody');
            if (body) {
                body.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4"><i class="fas fa-exclamation-circle mr-2"></i>Failed to load classes: ${err.message || err}</td></tr>`;
            }
        }
    }

    // Update count badges across UI
    function updateBadgeCounters() {
        const activeCount = _liveClasses.filter(c => c.published !== false).length;
        document.querySelectorAll('.live-timetable-counter-badge').forEach(badge => {
            badge.textContent = activeCount;
        });
        const badge1 = document.getElementById('liveAppCountBadge');
        if (badge1) badge1.textContent = activeCount;
        const badge2 = document.getElementById('liveCountBadge');
        if (badge2) badge2.textContent = activeCount;
    }

    // ── Render Platform UI ──────────────────────────────────────────────
    function renderPlatform(containerId) {
        const container = document.getElementById(containerId || 'liveTimetablePlatform');
        if (!container) return;

        // Compute statistics
        const todayStr = new Date().toISOString().slice(0, 10);
        const tomorrowDate = new Date();
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrowStr = tomorrowDate.toISOString().slice(0, 10);

        const totalPublished = _liveClasses.filter(c => c.published !== false).length;
        const classesToday = _liveClasses.filter(c => c.class_date === todayStr && c.published !== false).length;
        const classesTomorrow = _liveClasses.filter(c => c.class_date === tomorrowStr && c.published !== false).length;
        const distinctGrades = new Set(_liveClasses.map(c => c.class_grade || c.roll_no)).size;

        // Filter items
        const filtered = _liveClasses.filter(item => {
            // Class Filter
            if (_activeFilterClass !== 'all') {
                const itemGrade = String(item.class_grade || item.roll_no || '').replace('Class ', '').trim();
                const filterGrade = _activeFilterClass.replace('Class ', '').trim();
                if (itemGrade !== filterGrade) return false;
            }

            // Syllabus Filter
            if (_activeFilterSyllabus !== 'all') {
                const itemSyl = _resolveLiveItemSyllabus(item);
                if (_activeFilterSyllabus === 'State Syllabus') {
                    if (itemSyl !== 'State Syllabus' && itemSyl !== 'Both') return false;
                } else if (_activeFilterSyllabus === 'CBSE') {
                    if (itemSyl !== 'CBSE' && itemSyl !== 'Both') return false;
                } else if (_activeFilterSyllabus === 'Both') {
                    if (itemSyl !== 'Both') return false;
                }
            }

            // Date Filter
            if (_activeFilterDate === 'today') {
                // If exam/test paper is tomorrow, show it 1 day before in today's view!
                const isTomorrowExam = item.class_date === tomorrowStr && (
                    (item.status && (item.status.includes('TP') || item.status.includes('test'))) ||
                    (item.time && item.time.toLowerCase().includes('test paper'))
                );
                if (item.class_date !== todayStr && !isTomorrowExam) return false;
            }
            if (_activeFilterDate === 'tomorrow' && item.class_date !== tomorrowStr) return false;
            if (_activeFilterDate === 'upcoming' && item.class_date < todayStr) return false;
            if (_activeFilterDate === 'custom' && _activeCustomDate && item.class_date !== _activeCustomDate) return false;

            // Search Filter
            if (_searchQuery) {
                const q = _searchQuery.toLowerCase();
                const sub = (item.subject || '').toLowerCase();
                const cls = (item.class_grade || item.roll_no || '').toLowerCase();
                const time = (item.time || '').toLowerCase();
                const dt = (item.class_date || '').toLowerCase();
                if (!sub.includes(q) && !cls.includes(q) && !time.includes(q) && !dt.includes(q)) {
                    return false;
                }
            }

            return true;
        });

        // Generate full template
        container.innerHTML = `
            <div class="live-platform-wrapper mb-5" style="background:#ffffff; border-radius:14px; border:1px solid #e2e8f0; box-shadow:0 4px 20px rgba(0,0,0,0.04); overflow:hidden;">
                
                <!-- Platform Top Header & Quick Stats -->
                <div style="background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color:#ffffff; padding:22px 24px;">
                    <div class="d-flex flex-wrap justify-content-between align-items-center mb-3">
                        <div>
                            <h4 class="font-weight-bold mb-1 d-flex align-items-center" style="letter-spacing:-0.3px;">
                                <i class="fas fa-satellite-dish text-primary mr-2"></i>
                                Live Mobile App Timetable Manager
                                <span class="badge badge-success ml-3 px-2 py-1" style="font-size:0.75rem; border-radius:20px; font-weight:700;">
                                    <i class="fas fa-check-circle mr-1"></i>Supabase Live Sync
                                </span>
                            </h4>
                            <p class="mb-0 text-white-50" style="font-size:0.88rem;">
                                Manage live class sessions published to the EduHome student & faculty mobile apps. Teachers are synced from the Assign Teachers roster.
                            </p>
                        </div>
                        <div class="mt-2 mt-md-0 d-flex flex-wrap align-items-center" style="gap:10px;">
                            <button class="btn btn-sm btn-warning text-dark font-weight-bold shadow-sm" onclick="window.reassignAllLiveClasses('${containerId}')" id="reassignLiveBtn" title="Auto-assign official allotted teachers to all live classes">
                                <i class="fas fa-user-check mr-1"></i> Sync & Fix All Teachers
                            </button>
                            <a href="teacher_allotment.html" class="btn btn-sm btn-outline-light" style="font-weight:600; border-radius:8px;" target="_blank" title="View or edit teacher subject & class allotments">
                                <i class="fas fa-chalkboard-teacher mr-1"></i> Assign Teachers
                            </a>
                            <button class="btn btn-sm btn-outline-light" onclick="window.refreshLiveTimetable('${containerId}')" id="refreshLiveBtn">
                                <i class="fas fa-sync-alt mr-1"></i> Refresh Data
                            </button>
                            <button class="btn btn-sm btn-primary font-weight-bold shadow-sm" onclick="window.openCreateClassModal()" style="border-radius:8px;" title="Schedule a new live class session with target syllabus">
                                <i class="fas fa-plus-circle mr-1"></i> Schedule Session
                            </button>
                        </div>
                    </div>

                    <!-- 4 Live Stats Cards -->
                    <div class="row pt-2" style="margin-right:-8px; margin-left:-8px;">
                        <div class="col-6 col-md-3 px-2 mb-2 mb-md-0">
                            <div style="background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12); border-radius:10px; padding:12px 14px;">
                                <div class="text-white-50 small font-weight-bold text-uppercase" style="font-size:0.7rem; letter-spacing:0.5px;">Published Sessions</div>
                                <div class="h4 font-weight-bold text-white mb-0 mt-1">${totalPublished}</div>
                            </div>
                        </div>
                        <div class="col-6 col-md-3 px-2 mb-2 mb-md-0">
                            <div style="background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12); border-radius:10px; padding:12px 14px;">
                                <div class="text-white-50 small font-weight-bold text-uppercase" style="font-size:0.7rem; letter-spacing:0.5px;">Classes Today</div>
                                <div class="h4 font-weight-bold text-success mb-0 mt-1">${classesToday}</div>
                            </div>
                        </div>
                        <div class="col-6 col-md-3 px-2">
                            <div style="background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12); border-radius:10px; padding:12px 14px;">
                                <div class="text-white-50 small font-weight-bold text-uppercase" style="font-size:0.7rem; letter-spacing:0.5px;">Classes Tomorrow</div>
                                <div class="h4 font-weight-bold text-info mb-0 mt-1">${classesTomorrow}</div>
                            </div>
                        </div>
                        <div class="col-6 col-md-3 px-2">
                            <div style="background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12); border-radius:10px; padding:12px 14px;">
                                <div class="text-white-50 small font-weight-bold text-uppercase" style="font-size:0.7rem; letter-spacing:0.5px;">Active Grades</div>
                                <div class="h4 font-weight-bold text-warning mb-0 mt-1">${distinctGrades}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Filters & Controls Bar -->
                <div class="p-3 border-bottom" style="background:#f8fafc;">
                    <div class="d-flex flex-wrap align-items-center justify-content-between" style="gap:12px;">
                        
                        <!-- Left: Class & Date Filters -->
                        <div class="d-flex flex-wrap align-items-center" style="gap:10px;">
                            <!-- Class Filter -->
                            <div class="d-flex align-items-center">
                                <label class="small text-muted font-weight-bold mr-2 mb-0" style="white-space:nowrap;"><i class="fas fa-layer-group mr-1"></i>Class:</label>
                                <select class="form-control form-control-sm" id="liveFilterClass" style="width:130px; border-radius:6px;" onchange="window.filterLiveClass(this.value, '${containerId}')">
                                    <option value="all" ${_activeFilterClass === 'all' ? 'selected' : ''}>All Classes</option>
                                    <option value="6" ${_activeFilterClass === '6' ? 'selected' : ''}>Class 6</option>
                                    <option value="7" ${_activeFilterClass === '7' ? 'selected' : ''}>Class 7</option>
                                    <option value="8" ${_activeFilterClass === '8' ? 'selected' : ''}>Class 8</option>
                                    <option value="9" ${_activeFilterClass === '9' ? 'selected' : ''}>Class 9</option>
                                    <option value="10" ${_activeFilterClass === '10' ? 'selected' : ''}>Class 10</option>
                                    <option value="11" ${_activeFilterClass === '11' ? 'selected' : ''}>Class 11</option>
                                    <option value="12" ${_activeFilterClass === '12' ? 'selected' : ''}>Class 12</option>
                                </select>
                            </div>

                            <!-- Syllabus Filter -->
                            <div class="d-flex align-items-center">
                                <label class="small text-muted font-weight-bold mr-2 mb-0" style="white-space:nowrap;"><i class="fas fa-book-reader mr-1"></i>Syllabus:</label>
                                <select class="form-control form-control-sm" id="liveFilterSyllabus" style="width:130px; border-radius:6px;" onchange="window.filterLiveSyllabus(this.value, '${containerId}')">
                                    <option value="all" ${_activeFilterSyllabus === 'all' ? 'selected' : ''}>All</option>
                                    <option value="State Syllabus" ${_activeFilterSyllabus === 'State Syllabus' ? 'selected' : ''}>State Only</option>
                                    <option value="CBSE" ${_activeFilterSyllabus === 'CBSE' ? 'selected' : ''}>CBSE Only</option>
                                    <option value="Both" ${_activeFilterSyllabus === 'Both' ? 'selected' : ''}>Both (Shared)</option>
                                </select>
                            </div>

                            <!-- Date Filter Buttons -->
                            <div class="btn-group btn-group-sm" role="group">
                                <button type="button" class="btn ${_activeFilterDate === 'all' ? 'btn-primary' : 'btn-outline-secondary'}" onclick="window.filterLiveDate('all', '', '${containerId}')">All</button>
                                <button type="button" class="btn ${_activeFilterDate === 'today' ? 'btn-primary' : 'btn-outline-secondary'}" onclick="window.filterLiveDate('today', '', '${containerId}')">Today</button>
                                <button type="button" class="btn ${_activeFilterDate === 'tomorrow' ? 'btn-primary' : 'btn-outline-secondary'}" onclick="window.filterLiveDate('tomorrow', '', '${containerId}')">Tomorrow</button>
                                <button type="button" class="btn ${_activeFilterDate === 'upcoming' ? 'btn-primary' : 'btn-outline-secondary'}" onclick="window.filterLiveDate('upcoming', '', '${containerId}')">Upcoming</button>
                            </div>

                            <!-- Specific Date Picker -->
                            <input type="date" class="form-control form-control-sm" id="liveCustomDatePicker" value="${_activeCustomDate}" style="width:145px; border-radius:6px;" title="Pick specific date" onchange="window.filterLiveDate('custom', this.value, '${containerId}')">
                        </div>

                        <!-- Right: Search Bar -->
                        <div class="d-flex align-items-center" style="min-width:240px; flex:1; max-width:320px;">
                            <div class="input-group input-group-sm">
                                <div class="input-group-prepend">
                                    <span class="input-group-text bg-white border-right-0" style="border-radius:6px 0 0 6px;"><i class="fas fa-search text-muted"></i></span>
                                </div>
                                <input type="text" class="form-control border-left-0" id="liveSearchInput" placeholder="Search subject, teacher, time..." value="${_searchQuery}" style="border-radius:0 6px 6px 0;" oninput="window.filterLiveSearch(this.value, '${containerId}')">
                            </div>
                        </div>

                    </div>
                </div>

                <!-- Live Classes Table -->
                <div class="table-responsive" style="max-height: 520px; overflow-y: auto;">
                    <table class="table table-hover mb-0" style="font-size:0.9rem;">
                        <thead style="background:#0f172a; color:#ffffff; position:sticky; top:0; z-index:10;">
                            <tr>
                                <th style="width:150px; font-weight:600; padding:12px 16px;">Date</th>
                                <th style="width:110px; font-weight:600;">Grade</th>
                                <th style="width:160px; font-weight:600;">Subject</th>
                                <th style="min-width:230px; font-weight:600;">Time & Assigned Teacher</th>
                                <th style="width:110px; font-weight:600; text-align:center;">Status</th>
                                <th style="width:120px; font-weight:600; text-align:center;">App Visibility</th>
                                <th style="width:140px; font-weight:600; text-align:center;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="liveTableBody">
                            ${filtered.length === 0 ? `
                                <tr>
                                    <td colspan="7" class="text-center py-5 text-muted">
                                        <div class="py-3">
                                            <i class="fas fa-calendar-times fa-3x mb-3 text-muted" style="opacity:0.4;"></i>
                                            <h6 class="font-weight-bold">No Scheduled Classes Found</h6>
                                            <p class="small text-muted mb-0">No classes match your current filter criteria or none have been published to the mobile app yet.</p>
                                        </div>
                                    </td>
                                </tr>
                            ` : filtered.map(item => {
                                const meta = _getSubjectMeta(item.subject);
                                const timeInfo = _parseTimeDetails(item.time);
                                const statusInfo = _parseStatus(item.status);
                                const dateFormatted = _friendlyDate(item.class_date);
                                const isPublished = item.published !== false;

                                // Resolve correct official allotted teacher
                                const assigned = getAssignedFacultyFor(item.subject, item.class_grade || item.roll_no);
                                const isOutdated = isFacultyOutdated(timeInfo.faculty);
                                const isMismatched = !timeInfo.faculty || (assigned.name && timeInfo.faculty.toLowerCase().trim() !== assigned.name.toLowerCase().trim());

                                let facultyBadgeHtml = '';
                                if (isOutdated || isMismatched) {
                                    facultyBadgeHtml = `
                                        <div class="mt-1 d-flex flex-wrap align-items-center" style="gap:4px;">
                                            ${timeInfo.faculty ? `
                                                <span class="badge ${isOutdated ? 'badge-danger' : 'badge-warning'} text-dark" style="font-size:0.75rem; font-weight:600;" title="${isOutdated ? 'Outdated faculty assignment' : 'Does not match official allotment'}">
                                                    <i class="fas ${isOutdated ? 'fa-times-circle text-danger' : 'fa-exclamation-triangle text-warning'} mr-1"></i>${timeInfo.faculty}
                                                </span>
                                            ` : `
                                                <span class="badge badge-secondary" style="font-size:0.75rem;"><i class="fas fa-question-circle mr-1"></i>No Teacher</span>
                                            `}
                                            <button class="btn btn-xs btn-outline-primary" style="font-size:0.72rem; padding:1px 7px; border-radius:4px; font-weight:700;" onclick="window.quickAssignTeacher('${item.id}', '${assigned.id}', '${assigned.name.replace(/'/g, "\\'")}', '${containerId}')" title="Click to assign allotted teacher: ${assigned.name}">
                                                <i class="fas fa-magic mr-1"></i>Assign ${assigned.name}
                                            </button>
                                        </div>
                                    `;
                                } else {
                                    facultyBadgeHtml = `
                                        <div class="mt-1 d-flex align-items-center">
                                            <span class="badge badge-success px-2 py-1" style="font-size:0.78rem; border-radius:4px; font-weight:600;" title="Verified Allotted Teacher">
                                                <i class="fas fa-chalkboard-teacher mr-1"></i>${timeInfo.faculty}
                                            </span>
                                        </div>
                                    `;
                                }

                                let statusBadge = '<span class="badge badge-info px-2 py-1">Upcoming</span>';
                                if (statusInfo.status === 'completed') {
                                    statusBadge = '<span class="badge badge-success px-2 py-1">Completed</span>';
                                } else if (statusInfo.status === 'cancelled') {
                                    statusBadge = '<span class="badge badge-danger px-2 py-1">Cancelled</span>';
                                }

                                return `
                                    <tr id="liveClassRow_${item.id}" style="${!isPublished ? 'opacity:0.65; background:#fafafa;' : ''}">
                                        
                                        <!-- Date -->
                                        <td style="padding:12px 16px; vertical-align:middle;">
                                            <div class="font-weight-bold text-dark">${dateFormatted}</div>
                                            <small class="text-muted">${item.class_date || ''}</small>
                                        </td>

                                        <!-- Grade & Syllabus -->
                                        <td style="vertical-align:middle;">
                                            <span class="badge px-2 py-1" style="background:#e0f2fe; color:#0369a1; font-weight:700; border-radius:6px; font-size:0.8rem;">
                                                ${item.class_grade || item.roll_no || 'Class'}
                                            </span>
                                            ${(() => {
                                                const syl = _resolveLiveItemSyllabus(item);
                                                if (syl === 'CBSE') {
                                                    return '<div class="mt-1"><span class="badge" style="background:#e0f2fe; color:#0284c7; border:1px solid #bae6fd; font-size:0.72rem; font-weight:600;"><i class="fas fa-book mr-1"></i>CBSE</span></div>';
                                                } else if (syl === 'State Syllabus') {
                                                    return '<div class="mt-1"><span class="badge" style="background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; font-size:0.72rem; font-weight:600;"><i class="fas fa-landmark mr-1"></i>State Syllabus</span></div>';
                                                } else {
                                                    return '<div class="mt-1"><span class="badge" style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; font-size:0.72rem; font-weight:600;"><i class="fas fa-users mr-1"></i>State & CBSE</span></div>';
                                                }
                                            })()}
                                        </td>

                                        <!-- Subject -->
                                        <td style="vertical-align:middle;">
                                            <span class="badge px-2 py-1 font-weight-bold" style="background:${meta.bg}; color:${meta.color}; border-radius:6px; font-size:0.85rem;">
                                                ${meta.emoji} ${item.subject || 'General'}
                                            </span>
                                            ${(() => {
                                                const sType = timeInfo.sessionType || statusInfo.sessionType;
                                                const nStat = (item.status || '').toLowerCase();
                                                const nTime = (item.time || '').toLowerCase();
                                                if (sType === 'TP' || nStat.split(':').includes('tp') || nStat.includes(':tp') || nStat.includes('test') || nTime.includes('test paper') || nTime.includes('• tp')) {
                                                    return '<span class="badge badge-danger ml-1" style="font-size:0.72rem; font-weight:600;"><i class="fas fa-file-alt mr-1"></i>Test Paper</span>';
                                                } else if (sType === 'QuestionBank' || nStat.split(':').includes('questionbank') || nStat.split(':').includes('qb') || nStat.includes(':qb') || nTime.includes('question bank') || nTime.includes('• qb')) {
                                                    return '<span class="badge ml-1 text-white" style="font-size:0.72rem; font-weight:600; background:#7c3aed;"><i class="fas fa-book-open mr-1"></i>Question Bank</span>';
                                                } else {
                                                    return '<span class="badge badge-light border ml-1 text-muted" style="font-size:0.72rem; font-weight:600;">📖 Regular Class</span>';
                                                }
                                            })()}
                                        </td>

                                        <!-- Time & Faculty -->
                                        <td style="vertical-align:middle;">
                                            <div class="font-weight-bold text-dark" style="font-size:0.92rem;">
                                                <i class="far fa-clock text-muted mr-1"></i>${timeInfo.time}
                                            </div>
                                            ${facultyBadgeHtml}
                                        </td>

                                        <!-- Status Badge -->
                                        <td style="vertical-align:middle; text-align:center;">
                                            ${statusBadge}
                                        </td>

                                        <!-- Published Toggle -->
                                        <td style="vertical-align:middle; text-align:center;">
                                            <button class="btn btn-sm ${isPublished ? 'btn-outline-success' : 'btn-outline-secondary'}" style="font-size:0.75rem; border-radius:20px; padding:3px 10px; font-weight:600;" onclick="window.toggleLiveClassPublish('${item.id}', ${isPublished}, '${containerId}')" title="Click to ${isPublished ? 'Hide from Mobile App' : 'Publish to Mobile App'}">
                                                <i class="fas ${isPublished ? 'fa-eye' : 'fa-eye-slash'} mr-1"></i>${isPublished ? 'Live on App' : 'Hidden'}
                                            </button>
                                        </td>

                                        <!-- Actions -->
                                        <td style="vertical-align:middle; text-align:center;">
                                            <div class="btn-group btn-group-sm" role="group">
                                                <button class="btn btn-outline-primary" onclick="window.openEditClassModal('${item.id}')" title="Edit this class session" style="border-radius:6px 0 0 6px; padding:4px 10px;">
                                                    <i class="fas fa-edit mr-1"></i>Edit
                                                </button>
                                                <button class="btn btn-outline-danger" id="delBtn_${item.id}" onclick="window.deleteLiveClass('${item.id}', this, '${containerId}')" title="Delete from Supabase" style="border-radius:0 6px 6px 0; padding:4px 10px;">
                                                    <i class="fas fa-trash-alt"></i>
                                                </button>
                                            </div>
                                        </td>

                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Footer Summary Bar -->
                <div class="p-3 border-top d-flex justify-content-between align-items-center" style="background:#f8fafc; font-size:0.85rem;">
                    <div class="text-muted">
                        Showing <strong>${filtered.length}</strong> of <strong>${_liveClasses.length}</strong> total class sessions in cloud database.
                    </div>
                    <div>
                        <button class="btn btn-sm btn-link text-danger font-weight-bold" onclick="window.clearPastClasses('${containerId}')">
                            <i class="fas fa-broom mr-1"></i> Purge Past Completed Classes
                        </button>
                    </div>
                </div>

            </div>
        `;

        // Ensure Edit Modal DOM exists
        _injectEditModalDOM();
    }

    // ── Inject Edit Modal DOM ───────────────────────────────────────────
    function _injectEditModalDOM() {
        if (document.getElementById('editLiveClassModal')) return;

        const modalDiv = document.createElement('div');
        modalDiv.id = 'editLiveClassModal';
        modalDiv.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15, 23, 42, 0.6); z-index:99999; backdrop-filter:blur(4px); align-items:center; justify-content:center; padding:15px;';
        modalDiv.innerHTML = `
            <div style="background:#ffffff; border-radius:14px; width:100%; max-width:540px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); overflow:hidden; animation:modalPopIn 0.25s ease-out;">
                
                <!-- Modal Header -->
                <div style="background:linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color:#ffffff; padding:16px 20px; display:flex; justify-content:space-between; align-items:center;">
                    <h5 class="mb-0 font-weight-bold" style="font-size:1.1rem;">
                        <i class="fas fa-edit mr-2"></i>Edit Scheduled Class Session
                    </h5>
                    <button type="button" style="background:none; border:none; color:#ffffff; font-size:1.4rem; cursor:pointer; line-height:1;" onclick="window.closeEditClassModal()">&times;</button>
                </div>

                <!-- Modal Body Form -->
                <div style="padding:22px 24px; max-height:80vh; overflow-y:auto;">
                    <input type="hidden" id="editClassId">

                    <!-- Class & Subject Row -->
                    <div class="form-row mb-3">
                        <div class="col-md-6">
                            <label class="font-weight-bold text-dark small mb-1">Class Grade *</label>
                            <select class="form-control" id="editClassGrade" onchange="window.handleEditSubjectOrGradeChange()" required>
                                <option value="Class 6">Class 6</option>
                                <option value="Class 7">Class 7</option>
                                <option value="Class 8">Class 8</option>
                                <option value="Class 9">Class 9</option>
                                <option value="Class 10">Class 10</option>
                                <option value="Class 11">Class 11</option>
                                <option value="Class 12">Class 12</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="font-weight-bold text-dark small mb-1">Subject *</label>
                            <select class="form-control" id="editClassSubject" onchange="window.handleEditSubjectOrGradeChange()" required>
                                <option value="Physics">Physics</option>
                                <option value="Chemistry">Chemistry</option>
                                <option value="Maths">Maths</option>
                                <option value="Biology">Biology</option>
                                <option value="Computer Science">Computer Science</option>
                                <option value="No Class">No Class</option>
                            </select>
                        </div>
                    </div>

                    <!-- Date & Session Type Row -->
                    <div class="form-row mb-3">
                        <div class="col-md-6">
                            <label class="font-weight-bold text-dark small mb-1">Scheduled Date *</label>
                            <input type="date" class="form-control" id="editClassDate" required>
                        </div>
                        <div class="col-md-6">
                            <label class="font-weight-bold text-dark small mb-1">Session Type *</label>
                            <select class="form-control" id="editClassSessionType">
                                <option value="Regular">📖 Regular Class</option>
                                <option value="TP">🎯 Test Paper</option>
                                <option value="QuestionBank">📝 Question Bank</option>
                            </select>
                        </div>
                    </div>

                    <!-- Target Syllabus & Status Row -->
                    <div class="form-row mb-3">
                        <div class="col-md-6">
                            <label class="font-weight-bold text-dark small mb-1">Target Syllabus *</label>
                            <select class="form-control" id="editClassSyllabus" required>
                                <option value="Both">Both (State & CBSE)</option>
                                <option value="State Syllabus">State Syllabus</option>
                                <option value="CBSE">CBSE</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="font-weight-bold text-dark small mb-1">Session Status</label>
                            <select class="form-control" id="editClassStatus">
                                <option value="upcoming">📖 Upcoming</option>
                                <option value="completed">✅ Completed</option>
                                <option value="cancelled">❌ Cancelled</option>
                            </select>
                        </div>
                    </div>

                    <!-- Time Range Row -->
                    <div class="form-row mb-3">
                        <div class="col-md-6">
                            <label class="font-weight-bold text-dark small mb-1">Start Time (12-Hr)</label>
                            <input type="text" class="form-control" id="editClassStartTime" placeholder="e.g. 03:00 PM">
                        </div>
                        <div class="col-md-6">
                            <label class="font-weight-bold text-dark small mb-1">End Time (12-Hr)</label>
                            <input type="text" class="form-control" id="editClassEndTime" placeholder="e.g. 04:00 PM">
                        </div>
                    </div>

                    <!-- Assigned Faculty -->
                    <div class="form-group mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <label class="font-weight-bold text-dark small mb-0">Assigned Teacher</label>
                            <a href="teacher_allotment.html" target="_blank" class="small text-primary font-weight-bold" style="text-decoration:underline;">
                                <i class="fas fa-external-link-alt mr-1"></i>Allotment Rules
                            </a>
                        </div>
                        <select class="form-control" id="editClassFacultySelect" onchange="window.handleEditFacultySelectChange()">
                            <!-- Populated dynamically -->
                        </select>
                        <div id="editCustomFacultyGroup" style="display:none; margin-top:8px;">
                            <input type="text" class="form-control form-control-sm" id="editCustomFacultyInput" placeholder="Enter teacher's full name">
                        </div>
                        <small id="editClassFacultyHint" class="form-text text-primary font-weight-bold mt-1"></small>
                    </div>

                    <!-- Published Checkbox -->
                    <div class="custom-control custom-checkbox mb-3 p-2 rounded" style="background:#f1f5f9;">
                        <input type="checkbox" class="custom-control-input" id="editClassPublished" checked>
                        <label class="custom-control-label font-weight-bold text-dark small" for="editClassPublished" style="cursor:pointer;">
                            Publish to Mobile App (Students & Faculty see this)
                        </label>
                    </div>

                    <!-- Broadcast Announcement Checkbox -->
                    <div class="custom-control custom-checkbox mb-2">
                        <input type="checkbox" class="custom-control-input" id="editClassBroadcast" checked>
                        <label class="custom-control-label text-muted small" for="editClassBroadcast" style="cursor:pointer;">
                            <i class="fas fa-bullhorn text-warning mr-1"></i> Send reschedule announcement alert to mobile app
                        </label>
                    </div>

                </div>

                <!-- Modal Footer -->
                <div style="background:#f8fafc; padding:14px 20px; border-top:1px solid #e2e8f0; display:flex; justify-content:flex-end; gap:10px;">
                    <button type="button" class="btn btn-secondary btn-sm px-3" onclick="window.closeEditClassModal()">Cancel</button>
                    <button type="button" class="btn btn-primary btn-sm px-4 font-weight-bold" id="saveClassEditBtn" onclick="window.saveLiveClassEdit()">
                        <i class="fas fa-save mr-1"></i> Save Changes
                    </button>
                </div>

            </div>
        `;

        document.body.appendChild(modalDiv);
    }

    // Populate faculty dropdown options in edit modal
    function _populateEditFacultyDropdown(selectedFacultyName, assignedTeacher) {
        const select = document.getElementById('editClassFacultySelect');
        if (!select) return;

        let html = `<option value="auto">⚡ Auto (${assignedTeacher.name} - Allotted)</option>`;
        
        // Add options for each teacher in _assignedTeachers
        _assignedTeachers.forEach(t => {
            const gradesStr = Array.isArray(t.grades) ? t.grades.join(', ') : (t.grades || '');
            html += `<option value="${t.id}" data-name="${t.name}">${t.name} (${t.subject} • Classes ${gradesStr})</option>`;
        });

        html += `<option value="none">No Teacher Assigned</option>`;
        html += `<option value="custom">Custom / Other Teacher Name...</option>`;

        select.innerHTML = html;

        // Try to match selected faculty name
        const customGroup = document.getElementById('editCustomFacultyGroup');
        const customInput = document.getElementById('editCustomFacultyInput');

        if (!selectedFacultyName) {
            select.value = 'auto';
            if (customGroup) customGroup.style.display = 'none';
        } else {
            let matched = false;
            for (let i = 0; i < select.options.length; i++) {
                const opt = select.options[i];
                const optName = opt.getAttribute('data-name');
                if (optName && optName.toLowerCase().trim() === selectedFacultyName.toLowerCase().trim()) {
                    select.selectedIndex = i;
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                // If it was the auto allotted teacher
                if (assignedTeacher && assignedTeacher.name.toLowerCase().trim() === selectedFacultyName.toLowerCase().trim()) {
                    select.value = 'auto';
                } else {
                    select.value = 'custom';
                    if (customInput) customInput.value = selectedFacultyName;
                    if (customGroup) customGroup.style.display = 'block';
                }
            } else {
                if (customGroup) customGroup.style.display = 'none';
            }
        }
    }

    // ── Open Edit Modal ─────────────────────────────────────────────────
    window.openEditClassModal = function (classId) {
        _injectEditModalDOM();
        const item = _liveClasses.find(c => c.id === classId);
        if (!item) {
            alert('Class record not found.');
            return;
        }

        _currentEditId = classId;
        document.getElementById('editClassId').value = classId;

        const modalTitle = document.querySelector('#editLiveClassModal h5');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-edit mr-2"></i>Edit Scheduled Class Session';
        }
        const saveBtn = document.getElementById('saveClassEditBtn');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save mr-1"></i> Save Changes';
        }

        // Populate fields
        const rawGrade = String(item.class_grade || item.roll_no || 'Class 10');
        const formattedGrade = rawGrade.startsWith('Class') ? rawGrade : 'Class ' + rawGrade;
        document.getElementById('editClassGrade').value = formattedGrade;
        document.getElementById('editClassSubject').value = item.subject || 'Physics';
        document.getElementById('editClassDate').value = item.class_date || '';
        // Populate editClassSyllabus
        // Populate editClassSyllabus
        const detectedSyl = _resolveLiveItemSyllabus(item);
        const sylInput = document.getElementById('editClassSyllabus');
        if (sylInput) sylInput.value = detectedSyl;

        const timeInfo = _parseTimeDetails(item.time);
        let sTime = '';
        let eTime = '';
        if (timeInfo.time.includes('-')) {
            const tParts = timeInfo.time.split('-');
            sTime = tParts[0].trim();
            eTime = tParts[1].trim();
        } else {
            sTime = timeInfo.time;
        }
        document.getElementById('editClassStartTime').value = sTime;
        document.getElementById('editClassEndTime').value = eTime;

        // Setup assigned teacher dropdown
        const assigned = getAssignedFacultyFor(item.subject, formattedGrade);
        _populateEditFacultyDropdown(timeInfo.faculty, assigned);

        const hintEl = document.getElementById('editClassFacultyHint');
        if (hintEl) {
            hintEl.innerHTML = `<i class="fas fa-check-circle mr-1"></i>Official Allotted Teacher for ${formattedGrade} ${item.subject}: <strong>${assigned.name}</strong>`;
        }

        const statusInfo = _parseStatus(item.status);
        document.getElementById('editClassStatus').value = statusInfo.status || 'upcoming';

        const normStatus = (item.status || '').toLowerCase();
        const normTime = (item.time || '').toLowerCase();
        let detectedType = 'Regular';
        if (normStatus.split(':').includes('tp') || normStatus.includes(':tp') || normStatus.includes('test') || normTime.includes('test paper') || normTime.includes('• tp') || timeInfo.sessionType === 'TP' || statusInfo.sessionType === 'TP') {
            detectedType = 'TP';
        } else if (normStatus.split(':').includes('questionbank') || normStatus.split(':').includes('qb') || normStatus.includes(':qb') || normTime.includes('question bank') || normTime.includes('• qb') || timeInfo.sessionType === 'QuestionBank' || statusInfo.sessionType === 'QuestionBank') {
            detectedType = 'QuestionBank';
        }
        const sessionTypeEl = document.getElementById('editClassSessionType');
        if (sessionTypeEl) sessionTypeEl.value = detectedType;
        document.getElementById('editClassPublished').checked = item.published !== false;

        // Display modal
        const modal = document.getElementById('editLiveClassModal');
        modal.style.display = 'flex';
    };

    window.closeEditClassModal = function () {
        const modal = document.getElementById('editLiveClassModal');
        if (modal) modal.style.display = 'none';
        _currentEditId = null;
    };

    window.handleEditFacultySelectChange = function () {
        const select = document.getElementById('editClassFacultySelect');
        const customGroup = document.getElementById('editCustomFacultyGroup');
        if (select && customGroup) {
            customGroup.style.display = (select.value === 'custom') ? 'block' : 'none';
        }
    };

    window.handleEditSubjectOrGradeChange = function () {
        const grade = document.getElementById('editClassGrade').value;
        const subject = document.getElementById('editClassSubject').value;
        const assigned = getAssignedFacultyFor(subject, grade);

        const select = document.getElementById('editClassFacultySelect');
        const hintEl = document.getElementById('editClassFacultyHint');

        if (hintEl) {
            hintEl.innerHTML = `<i class="fas fa-check-circle mr-1"></i>Official Allotted Teacher for ${grade} ${subject}: <strong>${assigned.name}</strong>`;
        }

        if (select) {
            const autoOpt = select.querySelector('option[value="auto"]');
            if (autoOpt) {
                autoOpt.textContent = `⚡ Auto (${assigned.name} - Allotted)`;
            }
            // If on auto, keep it on auto
            if (select.value === 'auto') {
                // perfect
            }
        }
    };

    // ── Save Class Edit to Supabase ─────────────────────────────────────
    window.saveLiveClassEdit = async function () {
        const classId = _currentEditId || document.getElementById('editClassId').value;

        const sb = _getSb();
        if (!sb) {
            alert('Supabase client not available.');
            return;
        }

        const saveBtn = document.getElementById('saveClassEditBtn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving...';
        }

        try {
            const classGrade = document.getElementById('editClassGrade').value;
            const subject = document.getElementById('editClassSubject').value;
            const classDate = document.getElementById('editClassDate').value;
            const startTime = document.getElementById('editClassStartTime').value.trim();
            const endTime = document.getElementById('editClassEndTime').value.trim();
            const status = document.getElementById('editClassStatus').value;
            const published = document.getElementById('editClassPublished').checked;
            const doBroadcast = document.getElementById('editClassBroadcast').checked;

            // Resolve selected faculty
            const facultySelect = document.getElementById('editClassFacultySelect');
            let facultyName = '';
            let facultyId = '';

            if (facultySelect) {
                const val = facultySelect.value;
                if (val === 'auto') {
                    const assigned = getAssignedFacultyFor(subject, classGrade);
                    facultyName = assigned.name;
                    facultyId = assigned.id;
                } else if (val === 'none') {
                    facultyName = '';
                    facultyId = '';
                } else if (val === 'custom') {
                    const customInput = document.getElementById('editCustomFacultyInput');
                    facultyName = customInput ? customInput.value.trim() : '';
                    facultyId = '';
                } else {
                    facultyId = val;
                    if (facultySelect.selectedOptions && facultySelect.selectedOptions[0]) {
                        facultyName = facultySelect.selectedOptions[0].getAttribute('data-name') || '';
                    }
                }
            }

            const cleanStartTime = startTime.replace(/•.*$/, '').replace(/[\u2013\u2014]/g, '-').trim();
            const cleanEndTime = endTime.replace(/•.*$/, '').replace(/[\u2013\u2014]/g, '-').trim();
            let timeStr = cleanStartTime;
            if (cleanStartTime && cleanEndTime) {
                timeStr = `${cleanStartTime} - ${cleanEndTime}`;
            }

            const targetSyl = document.getElementById('editClassSyllabus') ? document.getElementById('editClassSyllabus').value : 'Both';
            const sessTypeEl = document.getElementById('editClassSessionType');
            const sessType = sessTypeEl ? sessTypeEl.value : 'Regular';
            const sessionTag = (sessType === 'TP' || sessType.toLowerCase().includes('tp') || sessType.toLowerCase().includes('test'))
                ? 'Test Paper'
                : (sessType === 'QuestionBank' || sessType.toLowerCase().includes('question') || sessType.toLowerCase().includes('qb'))
                ? 'Question Bank'
                : 'Regular Class';
            const statusTag = (sessType === 'TP' || sessType.toLowerCase().includes('tp') || sessType.toLowerCase().includes('test'))
                ? 'TP'
                : (sessType === 'QuestionBank' || sessType.toLowerCase().includes('question') || sessType.toLowerCase().includes('qb'))
                ? 'QuestionBank'
                : '';

            const timeParts = [timeStr];
            if (targetSyl === 'CBSE') {
                timeParts.push('CBSE');
            } else if (targetSyl === 'State Syllabus') {
                timeParts.push('State Syllabus');
            }
            if (sessionTag && sessionTag !== 'Regular' && sessionTag !== 'Regular Class') {
                timeParts.push(sessionTag);
            }
            if (facultyName) {
                timeParts.push(facultyName);
            }

            const finalTime = timeParts.join(' • ');
            const sylTag = targetSyl === 'CBSE' ? 'CBSE' : targetSyl === 'State Syllabus' ? 'State' : '';
            const finalStatus = [
                status,
                sylTag,
                statusTag,
                facultyId || (facultyName ? 'fac' : '')
            ].filter(Boolean).join(':');

            // 1. Save (Update or Insert) in Supabase classes table
            const recordPayload = {
                class_grade: classGrade,
                roll_no: classGrade,
                subject: subject,
                class_date: classDate,
                time: finalTime,
                status: finalStatus,
                published: published
            };

            if (classId) {
                const { error: updErr } = await sb.from('classes').update(recordPayload).eq('id', classId);
                if (updErr) {
                    console.error('[LiveTimetable] Update error:', updErr);
                    throw updErr;
                }
                _showToast(`✅ Updated ${classGrade} ${subject} (${targetSyl})!`);
            } else {
                const { error: insErr } = await sb.from('classes').insert([recordPayload]);
                if (insErr) {
                    console.error('[LiveTimetable] Insert error:', insErr);
                    throw insErr;
                }
                _showToast(`✅ Scheduled new ${classGrade} ${subject} (${targetSyl})!`);
            }

            // 2. Broadcast announcement if requested
            if (doBroadcast) {
                try {
                    await sb.from('announcements').insert({
                        title: `🔄 Schedule Update: ${classGrade} - ${subject}`,
                        description: `Class scheduled for ${_friendlyDate(classDate)} has been updated: Time is ${timeStr}${facultyName ? ' with ' + facultyName : ''}. Check your mobile app schedule.`,
                        author: facultyName || 'Center Admin',
                        tag: 'Timetable',
                        important: true
                    });
                } catch (bErr) {
                    console.warn('[LiveTimetable] Broadcast announcement failed:', bErr);
                }
            }

            // Update local memory
            const idx = _liveClasses.findIndex(c => c.id === classId);
            if (idx !== -1) {
                _liveClasses[idx] = {
                    ..._liveClasses[idx],
                    class_grade: classGrade,
                    roll_no: classGrade,
                    subject: subject,
                    class_date: classDate,
                    time: finalTime,
                    status: finalStatus,
                    published: published
                };
            }

            window.closeEditClassModal();
            _showToast('Class session updated successfully in Supabase!');
            renderPlatform();
            updateBadgeCounters();
        } catch (err) {
            alert('Failed to update class: ' + (err.message || err));
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save mr-1"></i> Save Changes';
            }
        }
    };

    // ── Quick Assign Teacher to Single Class ─────────────────────────────
    window.quickAssignTeacher = async function (classId, facultyId, facultyName, containerId) {
        if (!classId) return;
        const item = _liveClasses.find(c => c.id === classId);
        if (!item) return;

        const sb = _getSb();
        if (!sb) {
            alert('Supabase client not ready.');
            return;
        }

        const timeInfo = _parseTimeDetails(item.time);
        const statusInfo = _parseStatus(item.status);
        const sessType = timeInfo.sessionType || statusInfo.sessionType || 'Regular';
        const sessionTag = (sessType === 'TP' || sessType.toLowerCase().includes('tp') || sessType.toLowerCase().includes('test'))
            ? 'Test Paper'
            : (sessType === 'QuestionBank' || sessType.toLowerCase().includes('question') || sessType.toLowerCase().includes('qb'))
            ? 'Question Bank'
            : '';
        const statusTag = (sessType === 'TP' || sessType.toLowerCase().includes('tp') || sessType.toLowerCase().includes('test'))
            ? 'TP'
            : (sessType === 'QuestionBank' || sessType.toLowerCase().includes('question') || sessType.toLowerCase().includes('qb'))
            ? 'QuestionBank'
            : '';

        const timeParts = [timeInfo.time];
        if (sessionTag) timeParts.push(sessionTag);
        if (facultyName) timeParts.push(facultyName);
        const newTime = timeParts.join(' • ');

        const baseStat = statusInfo.status || 'upcoming';
        const newStatus = statusTag
            ? `${baseStat}:${statusTag}${facultyId ? ':' + facultyId : ''}`
            : (facultyId ? `${baseStat}:${facultyId}` : `${baseStat}:fac`);

        try {
            const { error } = await sb.from('classes').update({
                time: newTime,
                status: newStatus
            }).eq('id', classId);

            if (error) throw error;

            item.time = newTime;
            item.status = newStatus;

            _showToast(`Assigned ${facultyName} to ${item.class_grade || item.roll_no} ${item.subject}!`);
            renderPlatform(containerId);
        } catch (err) {
            alert('Failed to assign teacher: ' + (err.message || err));
        }
    };

    // ── Reassign All Live Classes to Allotted Teachers ────────────────────
    window.reassignAllLiveClasses = async function (containerId) {
        if (!_liveClasses || _liveClasses.length === 0) {
            alert('No live class sessions found to reassign.');
            return;
        }

        const sb = _getSb();
        if (!sb) {
            alert('Supabase client not ready.');
            return;
        }

        // Make sure we have latest assigned teachers
        await loadAssignedTeachers();

        // Find classes that need fixing or updating
        const itemsToUpdate = [];
        for (const item of _liveClasses) {
            const timeInfo = _parseTimeDetails(item.time);
            const statusInfo = _parseStatus(item.status);
            const assigned = getAssignedFacultyFor(item.subject, item.class_grade || item.roll_no);

            const isOutdated = isFacultyOutdated(timeInfo.faculty);
            const isMismatched = !timeInfo.faculty || (assigned.name && timeInfo.faculty.toLowerCase().trim() !== assigned.name.toLowerCase().trim());
            const isStatusIdWrong = !statusInfo.facultyId || (assigned.id && statusInfo.facultyId !== assigned.id);

            if (isOutdated || isMismatched || isStatusIdWrong) {
                const sessType = timeInfo.sessionType || statusInfo.sessionType || 'Regular';
                const sessionTag = (sessType === 'TP' || sessType.toLowerCase().includes('tp') || sessType.toLowerCase().includes('test'))
                    ? 'Test Paper'
                    : (sessType === 'QuestionBank' || sessType.toLowerCase().includes('question') || sessType.toLowerCase().includes('qb'))
                    ? 'Question Bank'
                    : '';
                const statusTag = (sessType === 'TP' || sessType.toLowerCase().includes('tp') || sessType.toLowerCase().includes('test'))
                    ? 'TP'
                    : (sessType === 'QuestionBank' || sessType.toLowerCase().includes('question') || sessType.toLowerCase().includes('qb'))
                    ? 'QuestionBank'
                    : '';

                const timeParts = [timeInfo.time];
                if (sessionTag) timeParts.push(sessionTag);
                if (assigned.name) timeParts.push(assigned.name);
                const newTime = timeParts.join(' • ');

                const baseStat = statusInfo.status || 'upcoming';
                const newStatus = statusTag
                    ? `${baseStat}:${statusTag}:${assigned.id}`
                    : `${baseStat}:${assigned.id}`;
                itemsToUpdate.push({
                    id: item.id,
                    oldName: timeInfo.faculty || '(None)',
                    newName: assigned.name,
                    newTime,
                    newStatus,
                    item
                });
            }
        }

        if (itemsToUpdate.length === 0) {
            _showToast('✅ All class sessions already have the correct allotted teachers!');
            return;
        }

        if (!confirm(`Found ${itemsToUpdate.length} class session(s) with outdated, mismatched, or missing teachers.\n\nDo you want to automatically assign the official allotted teachers to these sessions now?`)) {
            return;
        }

        const btn = document.getElementById('reassignLiveBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Syncing Teachers...';
        }

        let updatedCount = 0;
        try {
            for (const upd of itemsToUpdate) {
                const { error } = await sb.from('classes').update({
                    time: upd.newTime,
                    status: upd.newStatus
                }).eq('id', upd.id);

                if (!error) {
                    upd.item.time = upd.newTime;
                    upd.item.status = upd.newStatus;
                    updatedCount++;
                } else {
                    console.warn('[LiveTimetable] Error updating session ' + upd.id, error);
                }
            }

            _showToast(`✅ Successfully synced & assigned official teachers to ${updatedCount} session(s)!`);
            renderPlatform(containerId);
        } catch (err) {
            alert('Error during batch re-assignment: ' + (err.message || err));
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-user-check mr-1"></i> Sync & Fix All Teachers';
            }
        }
    };

    // ── Delete Class Session ────────────────────────────────────────────
    window.deleteLiveClass = async function (classId, btn, containerId) {
        if (!classId) return;

        // 2-step confirmation
        if (btn && btn.getAttribute('data-confirming') !== 'true') {
            btn.setAttribute('data-confirming', 'true');
            const origHtml = btn.innerHTML;
            btn.className = 'btn btn-warning font-weight-bold';
            btn.innerHTML = '<i class="fas fa-exclamation-triangle mr-1"></i> Confirm?';

            setTimeout(() => {
                if (document.body.contains(btn)) {
                    btn.removeAttribute('data-confirming');
                    btn.className = 'btn btn-outline-danger';
                    btn.innerHTML = origHtml;
                }
            }, 3500);
            return;
        }

        const sb = _getSb();
        if (!sb) {
            alert('Supabase client not ready.');
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }

        try {
            const { error } = await sb.from('classes').delete().eq('id', classId);
            if (error) {
                console.error('[LiveTimetable] Delete error:', error);
                throw error;
            }

            // Remove from local list
            _liveClasses = _liveClasses.filter(c => c.id !== classId);
            _showToast('Class deleted from mobile app database.');
            renderPlatform(containerId);
            updateBadgeCounters();
        } catch (err) {
            alert('Failed to delete class: ' + (err.message || err));
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            }
        }
    };

    // ── Toggle Published / Visibility ───────────────────────────────────
    window.toggleLiveClassPublish = async function (classId, currentStatus, containerId) {
        const sb = _getSb();
        if (!sb) return;

        const newStatus = !currentStatus;
        try {
            const { error } = await sb.from('classes').update({ published: newStatus }).eq('id', classId);
            if (error) throw error;

            const idx = _liveClasses.findIndex(c => c.id === classId);
            if (idx !== -1) {
                _liveClasses[idx].published = newStatus;
            }

            _showToast(newStatus ? 'Class is now LIVE on mobile app!' : 'Class is now HIDDEN from mobile app.');
            renderPlatform(containerId);
            updateBadgeCounters();
        } catch (err) {
            alert('Failed to toggle class status: ' + (err.message || err));
        }
    };

    // ── Clear Past Completed Classes ────────────────────────────────────
    window.clearPastClasses = async function (containerId) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const cutoffStr = yesterday.toISOString().slice(0, 10);

        const pastCount = _liveClasses.filter(c => c.class_date && c.class_date <= cutoffStr).length;
        if (pastCount === 0) {
            alert('No past classes to clean up.');
            return;
        }

        if (!confirm(`Are you sure you want to delete ${pastCount} past class session(s) scheduled before today? This cannot be undone.`)) {
            return;
        }

        const sb = _getSb();
        if (!sb) return;

        try {
            const { error } = await sb.from('classes').delete().lte('class_date', cutoffStr);
            if (error) throw error;

            _liveClasses = _liveClasses.filter(c => !c.class_date || c.class_date > cutoffStr);
            _showToast(`Successfully purged ${pastCount} past class session(s).`);
            renderPlatform(containerId);
            updateBadgeCounters();
        } catch (err) {
            alert('Failed to purge past classes: ' + (err.message || err));
        }
    };

    // ── Filter Handlers ─────────────────────────────────────────────────
    window.filterLiveSyllabus = function (val, containerId) {
        _activeFilterSyllabus = val;
        renderPlatform(containerId);
    };

    window.filterLiveClass = function (val, containerId) {
        _activeFilterClass = val;
        renderPlatform(containerId);
    };

    window.filterLiveDate = function (type, customVal, containerId) {
        _activeFilterDate = type;
        if (type === 'custom') {
            _activeCustomDate = customVal;
        }
        renderPlatform(containerId);
    };

    window.filterLiveSearch = function (query, containerId) {
        _searchQuery = (query || '').trim();
        renderPlatform(containerId);
    };

    window.refreshLiveTimetable = async function (containerId) {
        const btn = document.getElementById('refreshLiveBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Refreshing...';
        }
        await loadLiveClasses(containerId);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sync-alt mr-1"></i> Refresh Data';
        }
        _showToast('Live App Timetable refreshed from Supabase.');
    };

    // ── Realtime Synchronization ────────────────────────────────────────
    function _setupRealtime(containerId) {
        const sb = _getSb();
        if (!sb || typeof sb.channel !== 'function') return;

        try {
            if (_realtimeChannel) {
                sb.removeChannel(_realtimeChannel);
            }

            _realtimeChannel = sb
                .channel('live-timetable-realtime')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, payload => {
                    console.log('[LiveTimetable] Realtime event on classes:', payload.eventType);
                    loadLiveClasses(containerId);
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'teachers' }, () => {
                    console.log('[LiveTimetable] Realtime event on teachers allotment update');
                    loadAssignedTeachers().then(() => renderPlatform(containerId));
                })
                .subscribe();
        } catch (e) {
            console.warn('[LiveTimetable] Realtime setup failed:', e);
        }
    }

    // ── Initialize on container ─────────────────────────────────────────
    window.initLiveAppTimetable = function (containerId) {
        const targetId = containerId || 'liveTimetablePlatform';
        loadLiveClasses(targetId);
        _setupRealtime(targetId);
    };

    // Hook into window.shareTimetableToApp so it automatically refreshes
    const originalShare = window.shareTimetableToApp;
    if (typeof originalShare === 'function') {
        window.shareTimetableToApp = async function () {
            await originalShare.apply(this, arguments);
            setTimeout(() => {
                if (typeof window.initLiveAppTimetable === 'function') {
                    window.initLiveAppTimetable('liveTimetablePlatform');
                }
            }, 1000);
        };
    }

    // Auto-init if container exists on page load
    document.addEventListener('DOMContentLoaded', function () {
        if (document.getElementById('liveTimetablePlatform')) {
            window.initLiveAppTimetable('liveTimetablePlatform');
        }
    });

})();
