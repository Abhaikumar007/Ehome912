const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'lib', 'dataService.ts');
let code = fs.readFileSync(targetFile, 'utf8');

const startMarker = '  // Save attendance record for a student (called from faculty portal) -> syncs to student view & Supabase';
const endMarker = '  // ─── TESTS & EXAM PAPERS MANAGEMENT';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found!');
  process.exit(1);
}

const newImplementation = `  // Save attendance record for a student (called from faculty portal) -> syncs to student view & Supabase
  async saveAttendance(
    rollNo: string,
    date: string,
    subject: string,
    classLabel: string,
    status: 'P' | 'A',
    meta?: SessionAttendanceMeta
  ) {
    const cacheKey = \`attendance_\${rollNo}\`;
    let existing = await getCached<any>(cacheKey);

    // If local cache lacks history, fetch remote record from Supabase to preserve student's past attendance
    if (!existing || !existing.history || existing.history.length === 0) {
      try {
        const { data: remoteData } = await withTimeout(
          supabase.from('attendance_records').select('*').eq('roll_no', rollNo).maybeSingle(),
          2000
        ) as any;
        if (remoteData) {
          existing = {
            overall: remoteData.overall || 0,
            attended: remoteData.attended || 0,
            total: remoteData.total || 0,
            history: Array.isArray(remoteData.history) ? remoteData.history : [],
            todaySubjects: Array.isArray(remoteData.today_subjects) ? remoteData.today_subjects : [],
          };
        }
      } catch {
        // network fallback
      }
    }

    if (!existing) {
      existing = { overall: 0, attended: 0, total: 0, history: [], todaySubjects: [] };
    }

    const timeSlotStr = meta?.timeSlot || 'Class Session';
    const classIdStr = meta?.classId || '';
    const sessionTypeStr = meta?.sessionType || 'Regular Class';

    // Format entry
    const historyEntry = {
      date,
      subjects: subject,
      time: timeSlotStr,
      classId: classIdStr,
      sessionType: sessionTypeStr,
      score: status === 'P' ? '1/1' : '0/1',
      status: status === 'P' ? 'full' : 'absent',
      class: classLabel,
    };

    const normSub = (s: string) => {
      const lower = (s || '').toLowerCase().trim();
      if (lower.includes('math')) return 'mathematics';
      if (lower.includes('phys')) return 'physics';
      if (lower.includes('chem')) return 'chemistry';
      if (lower.includes('bio')) return 'biology';
      if (lower.includes('comp') || /\\bcs\\b/i.test(lower)) return 'computer';
      return lower;
    };

    const normTime = (t: string) => {
      if (!t) return '';
      return t.split('•')[0].split('(')[0].trim().toLowerCase();
    };

    const isSameSession = (entry: any) => {
      if (classIdStr && entry.classId && entry.classId === classIdStr) {
        return true;
      }
      if (classIdStr && entry.classId && entry.classId !== classIdStr) {
        return false;
      }
      if (entry.date && date && entry.date !== date) {
        return false;
      }
      const entrySub = normSub(entry.subjects || entry.subject || '');
      const targetSub = normSub(subject);
      if (entrySub && targetSub && entrySub !== targetSub && !entrySub.includes(targetSub) && !targetSub.includes(entrySub)) {
        return false;
      }
      const entryTime = normTime(entry.time || '');
      const targetTime = normTime(timeSlotStr);
      if (targetTime && targetTime !== 'class session' && entryTime && entryTime !== 'class session') {
        return entryTime === targetTime || entryTime.includes(targetTime) || targetTime.includes(entryTime);
      }
      return true;
    };

    const prevHistory = (existing.history || []).filter((h: any) => !isSameSession(h));
    const history = [historyEntry, ...prevHistory].slice(0, 60);
    const attended = history.filter((h: any) => h.status === 'full' || h.status === 'present' || h.score === '1/1').length;
    const total = history.length;
    const overall = total > 0 ? Math.round((attended / total) * 100) : 0;

    const prevTodaySubjects = (existing.todaySubjects || []).filter((s: any) => !isSameSession(s));
    const todaySubjects = [
      {
        id: classIdStr || \`att-\${Date.now()}-\${Math.random().toString(36).slice(2, 6)}\`,
        classId: classIdStr,
        subject,
        time: timeSlotStr,
        sessionType: sessionTypeStr,
        status: status === 'P' ? 'present' : 'absent',
        date,
      },
      ...prevTodaySubjects,
    ];

    const updated = { ...existing, overall, attended, total, history, todaySubjects };
    await setCached(cacheKey, updated);

    // Sync to Supabase attendance_records matching table columns
    try {
      await supabase.from('attendance_records').upsert({
        roll_no: rollNo,
        overall,
        attended,
        total,
        today_subjects: todaySubjects,
        history,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'roll_no' });
    } catch (e) {
      console.warn('[Attendance Sync] Error saving to Supabase attendance_records:', e);
    }

    return updated;
  },

  // Batch save attendance for a full class (from faculty submit) -> preserves history & fast atomic upsert
  async saveBatchAttendance(
    students: { rollNo: string; name: string; status: 'P' | 'A' }[],
    date: string,
    subject: string,
    classLabel: string,
    meta?: SessionAttendanceMeta
  ) {
    if (!students || students.length === 0) return [];

    const rollNos = students.map((s) => s.rollNo);
    const remoteMap = new Map<string, any>();
    try {
      const { data: remoteData } = await withTimeout(
        supabase.from('attendance_records').select('*').in('roll_no', rollNos),
        3000
      ) as any;
      if (Array.isArray(remoteData)) {
        remoteData.forEach((rec) => {
          if (rec && rec.roll_no) remoteMap.set(rec.roll_no.toUpperCase(), rec);
        });
      }
    } catch (e) {
      console.warn('[Batch Attendance] Supabase fetch warning, using local cache:', e);
    }

    const timeSlotStr = meta?.timeSlot || 'Class Session';
    const classIdStr = meta?.classId || '';
    const sessionTypeStr = meta?.sessionType || 'Regular Class';

    const normSub = (s: string) => {
      const lower = (s || '').toLowerCase().trim();
      if (lower.includes('math')) return 'mathematics';
      if (lower.includes('phys')) return 'physics';
      if (lower.includes('chem')) return 'chemistry';
      if (lower.includes('bio')) return 'biology';
      if (lower.includes('comp') || /\\bcs\\b/i.test(lower)) return 'computer';
      return lower;
    };

    const normTime = (t: string) => {
      if (!t) return '';
      return t.split('•')[0].split('(')[0].trim().toLowerCase();
    };

    const isSameSession = (entry: any) => {
      if (classIdStr && entry.classId && entry.classId === classIdStr) {
        return true;
      }
      if (classIdStr && entry.classId && entry.classId !== classIdStr) {
        return false;
      }
      if (entry.date && date && entry.date !== date) {
        return false;
      }
      const entrySub = normSub(entry.subjects || entry.subject || '');
      const targetSub = normSub(subject);
      if (entrySub && targetSub && entrySub !== targetSub && !entrySub.includes(targetSub) && !targetSub.includes(entrySub)) {
        return false;
      }
      const entryTime = normTime(entry.time || '');
      const targetTime = normTime(timeSlotStr);
      if (targetTime && targetTime !== 'class session' && entryTime && entryTime !== 'class session') {
        return entryTime === targetTime || entryTime.includes(targetTime) || targetTime.includes(entryTime);
      }
      return true;
    };

    const upsertBatch: any[] = [];
    const results: any[] = [];

    for (const stu of students) {
      const cacheKey = \`attendance_\${stu.rollNo}\`;
      let existing = await getCached<any>(cacheKey);
      const remote = remoteMap.get(stu.rollNo.toUpperCase());

      // If local cache lacks history, use remote record to ensure past days are never lost
      if (!existing || !existing.history || existing.history.length === 0) {
        if (remote) {
          existing = {
            overall: remote.overall || 0,
            attended: remote.attended || 0,
            total: remote.total || 0,
            history: Array.isArray(remote.history) ? remote.history : [],
            todaySubjects: Array.isArray(remote.today_subjects) ? remote.today_subjects : [],
          };
        }
      } else if (remote && Array.isArray(remote.history) && remote.history.length > existing.history.length) {
        existing = {
          overall: remote.overall || 0,
          attended: remote.attended || 0,
          total: remote.total || 0,
          history: remote.history,
          todaySubjects: Array.isArray(remote.today_subjects) ? remote.today_subjects : existing.todaySubjects,
        };
      }

      if (!existing) {
        existing = { overall: 0, attended: 0, total: 0, history: [], todaySubjects: [] };
      }

      const historyEntry = {
        date,
        subjects: subject,
        time: timeSlotStr,
        classId: classIdStr,
        sessionType: sessionTypeStr,
        score: stu.status === 'P' ? '1/1' : '0/1',
        status: stu.status === 'P' ? 'full' : 'absent',
        class: classLabel,
      };

      const prevHistory = (existing.history || []).filter((h: any) => !isSameSession(h));
      const history = [historyEntry, ...prevHistory].slice(0, 60);
      const attended = history.filter((h: any) => h.status === 'full' || h.status === 'present' || h.score === '1/1').length;
      const total = history.length;
      const overall = total > 0 ? Math.round((attended / total) * 100) : 0;

      const prevTodaySubjects = (existing.todaySubjects || []).filter((s: any) => !isSameSession(s));
      const todaySubjects = [
        {
          id: classIdStr || \`att-\${Date.now()}-\${Math.random().toString(36).slice(2, 6)}\`,
          classId: classIdStr,
          subject,
          time: timeSlotStr,
          sessionType: sessionTypeStr,
          status: stu.status === 'P' ? 'present' : 'absent',
          date,
        },
        ...prevTodaySubjects,
      ];

      const updated = { ...existing, overall, attended, total, history, todaySubjects };
      await setCached(cacheKey, updated);
      results.push({ rollNo: stu.rollNo, ...updated });

      upsertBatch.push({
        roll_no: stu.rollNo,
        overall,
        attended,
        total,
        today_subjects: todaySubjects,
        history,
        updated_at: new Date().toISOString(),
      });
    }

    if (upsertBatch.length > 0) {
      try {
        await supabase.from('attendance_records').upsert(upsertBatch, { onConflict: 'roll_no' });
      } catch (e) {
        console.warn('[Batch Attendance] Error batch saving to Supabase:', e);
      }
    }

    return results;
  },
\r\n`;

const updatedCode = code.slice(0, startIndex) + newImplementation + code.slice(endIndex);
fs.writeFileSync(targetFile, updatedCode, 'utf8');
console.log('Successfully updated lib/dataService.ts with robust saveAttendance & saveBatchAttendance!');

