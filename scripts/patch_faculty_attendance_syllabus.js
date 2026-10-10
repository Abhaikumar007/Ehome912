const fs = require('fs');
const path = require('path');

console.log('=== PATCHING FACULTY ATTENDANCE SYLLABUS FILTERING ===\n');

// 1. Patch app/(teacher)/index.tsx to pass targetSyllabus in navigation
const teacherIndexPath = path.join(__dirname, '../app/(teacher)/index.tsx');
let teacherIndex = fs.readFileSync(teacherIndexPath, 'utf8');

const targetPushOld = `params: {
                      classGrade: classTitle,
                      subject: subjectTitle,
                      classId: c.id || '',
                      timeSlot: (c.time || '').split('•')[0].trim(),
                      sessionType: sessionInfo.label,
                      classDate: c.class_date || targetDateInfo.iso,
                      dateOffset: String(dateOffset),
                    },`;

const targetPushNew = `params: {
                      classGrade: classTitle,
                      subject: subjectTitle,
                      classId: c.id || '',
                      timeSlot: (c.time || '').split('•')[0].trim(),
                      sessionType: sessionInfo.label,
                      classDate: c.class_date || targetDateInfo.iso,
                      dateOffset: String(dateOffset),
                      targetSyllabus: resolveClassTargetSyllabus(c),
                    },`;

if (teacherIndex.includes('targetSyllabus: resolveClassTargetSyllabus(c)')) {
  console.log('✓ teacher index.tsx already includes targetSyllabus in navigation params');
} else if (teacherIndex.replace(/\r\n/g, '\n').includes(targetPushOld.replace(/\r\n/g, '\n'))) {
  // Replace respecting CRLF
  const isCrlf = teacherIndex.includes('\r\n');
  const oldNorm = targetPushOld.replace(/\r\n/g, isCrlf ? '\r\n' : '\n');
  const newNorm = targetPushNew.replace(/\r\n/g, isCrlf ? '\r\n' : '\n');
  teacherIndex = teacherIndex.replace(oldNorm, newNorm);
  fs.writeFileSync(teacherIndexPath, teacherIndex, 'utf8');
  console.log('✓ Successfully patched app/(teacher)/index.tsx navigation params');
} else {
  console.warn('Could not find targetPushOld in teacher index.tsx');
}

// 2. Patch app/(teacher)/attendance.tsx
const attendancePath = path.join(__dirname, '../app/(teacher)/attendance.tsx');
let att = fs.readFileSync(attendancePath, 'utf8');
const isCrlfAtt = att.includes('\r\n');
const eol = isCrlfAtt ? '\r\n' : '\n';

// A. Imports
if (!att.includes('resolveClassTargetSyllabus') || !att.includes('resolveStudentSyllabus')) {
  att = att.replace(
    /import\s*\{\s*DataService\s*\}\s*from\s*'\.\.\/\.\.\/lib\/dataService';/,
    "import { DataService, resolveClassTargetSyllabus, resolveStudentSyllabus } from '../../lib/dataService';"
  );
  console.log('✓ Updated dataService imports in attendance.tsx');
}

// B. StudentRoster interface
if (!att.includes('syllabus?: \'State Syllabus\' | \'CBSE\';')) {
  att = att.replace(
    /school\?: string;\s*note\?: string;/,
    `school?: string;${eol}  note?: string;${eol}  syllabus?: 'State Syllabus' | 'CBSE';`
  );
  console.log('✓ Added syllabus to StudentRoster interface');
}

// C. useLocalSearchParams type
if (!att.includes('targetSyllabus?: string;')) {
  att = att.replace(
    /dateOffset\?: string;\s*\}\>\(\);/,
    `dateOffset?: string;${eol}    targetSyllabus?: string;${eol}  }>();`
  );
  console.log('✓ Added targetSyllabus to useLocalSearchParams');
}

// D. fetchLiveStudents syllabus preservation
if (!att.includes('syllabus: resolvedSyllabus')) {
  // Remote merge
  att = att.replace(
    /batch:\s*remote\.batch\s*\|\|\s*remote\.class_name\s*\|\|\s*s\.batch,/,
    `batch: remote.batch || remote.class_name || s.batch,${eol}            syllabus: resolveStudentSyllabus(remote || s),`
  );

  // New remote students
  att = att.replace(
    /batch:\s*d\.batch\s*\|\|\s*d\.class_name\s*\|\|\s*'Class 10',/,
    `batch: d.batch || d.class_name || 'Class 10',${eol}              syllabus: resolveStudentSyllabus(d),`
  );
  console.log('✓ Added syllabus resolution to fetchLiveStudents');
}

// E. Add activeSession and activeSessionSyllabus memos
if (!att.includes('const activeSessionSyllabus = useMemo')) {
  const sessionEffectAnchor = `  useEffect(() => {
    if (sessionsForSelectedClassAndSubject.length > 0) {`;

  const newSessionBlock = `  // Active Session & Syllabus Resolution
  const activeSession = useMemo(() => {
    if (activeClassId) {
      const match = sessionsForSelectedClassAndSubject.find((s) => s.id === activeClassId);
      if (match) return match;
      const adminMatch = adminClasses.find((c) => c.id === activeClassId);
      if (adminMatch) return adminMatch;
    }
    if (activeSessionTime) {
      const normTime = activeSessionTime.split('•')[0].trim().toLowerCase();
      const match = sessionsForSelectedClassAndSubject.find((s) => {
        const sTime = (s.time || '').split('•')[0].trim().toLowerCase();
        return sTime === normTime || sTime.includes(normTime) || normTime.includes(sTime);
      });
      if (match) return match;
    }
    return sessionsForSelectedClassAndSubject[0] || null;
  }, [sessionsForSelectedClassAndSubject, adminClasses, activeClassId, activeSessionTime]);

  const activeSessionSyllabus = useMemo<'State Syllabus' | 'CBSE' | 'Both'>(() => {
    if (!activeSession) {
      if (params.targetSyllabus === 'CBSE' || params.targetSyllabus === 'State Syllabus') {
        return params.targetSyllabus;
      }
      return 'Both';
    }
    return resolveClassTargetSyllabus(activeSession);
  }, [activeSession, params.targetSyllabus]);

  useEffect(() => {
    if (sessionsForSelectedClassAndSubject.length > 0) {`;

  att = att.replace(
    sessionEffectAnchor.replace(/\n/g, eol),
    newSessionBlock.replace(/\n/g, eol)
  );

  // Also add reset in else block if sessions length === 0
  att = att.replace(
    /setActiveSessionType\(sType\);\s*\}\s*\}\s*\}, \[sessionsForSelectedClassAndSubject, params\.classId, params\.timeSlot\]\);/,
    `setActiveSessionType(sType);${eol}      }${eol}    } else {${eol}      setActiveClassId('');${eol}      setActiveSessionTime('');${eol}      setActiveSessionType('Regular Class');${eol}    }${eol}  }, [sessionsForSelectedClassAndSubject, params.classId, params.timeSlot]);`
  );

  console.log('✓ Added activeSession and activeSessionSyllabus memos');
}

// F. Update student filtering useEffect to filter by syllabus strictly
if (!att.includes('// Filter students strictly by selected session syllabus:')) {
  const oldFilterSnippet = `    // Filter students strictly by allotted subject - ONLY students who opted for this faculty's subject!
    const subjectFiltered = classStudents.filter((s) =>
      isStudentEnrolledInSubject(s.subjects, targetSubject)
    );

    const rosterStudents: StudentRoster[] = subjectFiltered.map((s, idx) => {`;

  const newFilterSnippet = `    // Filter students strictly by allotted subject - ONLY students who opted for this faculty's subject!
    const subjectFiltered = classStudents.filter((s) =>
      isStudentEnrolledInSubject(s.subjects, targetSubject)
    );

    // Filter students strictly by selected session syllabus:
    // - If CBSE session: ONLY CBSE students
    // - If State Syllabus session: ONLY State Syllabus students
    // - If Both/Shared session (or no specific session): all eligible students
    const syllabusFiltered = subjectFiltered.filter((s) => {
      if (activeSessionSyllabus === 'Both') return true;
      const studentSyllabus = resolveStudentSyllabus(s);
      if (activeSessionSyllabus === 'CBSE') {
        return studentSyllabus === 'CBSE';
      }
      if (activeSessionSyllabus === 'State Syllabus') {
        return studentSyllabus === 'State Syllabus';
      }
      return true;
    });

    const rosterStudents: StudentRoster[] = syllabusFiltered.map((s, idx) => {`;

  att = att.replace(
    oldFilterSnippet.replace(/\n/g, eol),
    newFilterSnippet.replace(/\n/g, eol)
  );

  // Add syllabus to rosterStudents mapping
  att = att.replace(
    /school:\s*s\.school,\s*\}\;\s*\}\)\;/,
    `school: s.school,${eol}        syllabus: resolveStudentSyllabus(s),${eol}      };${eol}    });`
  );

  // Update dependencies
  att = att.replace(
    /\}, \[selectedClassId, selectedSubject, activeTeacher, liveStudents, activeClassId, activeSessionTime, attRecords\]\);/,
    `}, [selectedClassId, selectedSubject, activeTeacher, liveStudents, activeClassId, activeSessionTime, activeSessionSyllabus, attRecords]);`
  );

  console.log('✓ Implemented syllabus-based student filtering in attendance.tsx');
}

// G. Update UI details:
// 1. Session chips syllabus indication
if (!att.includes('sSyllabus !== \'Both\'')) {
  att = att.replace(
    /const sType = sess\.time\?\.toLowerCase\(\)\.includes\('test paper'\) \? 'Test Paper' : sess\.time\?\.toLowerCase\(\)\.includes\('question bank'\) \? 'Question Bank' : 'Regular Class';/,
    `const sType = sess.time?.toLowerCase().includes('test paper') ? 'Test Paper' : sess.time?.toLowerCase().includes('question bank') ? 'Question Bank' : 'Regular Class';${eol}                const sSyllabus = resolveClassTargetSyllabus(sess);`
  );

  att = att.replace(
    /\{sTime\} • \{sType\}/,
    `{sTime} • {sSyllabus !== 'Both' ? \`\${sSyllabus === 'State Syllabus' ? 'State' : 'CBSE'} • \` : ''}{sType}`
  );
  console.log('✓ Updated session chips with syllabus indicator');
}

// 2. Attendance Summary sub text
if (!att.includes('activeSessionSyllabus !== \'Both\' ? ` • ${activeSessionSyllabus}` : \'\'')) {
  att = att.replace(
    /\{currentClass\.batch\} • \{selectedSubject\}/,
    `{currentClass.batch} • {selectedSubject}{activeSessionSyllabus !== 'Both' ? \` • \${activeSessionSyllabus}\` : ''}`
  );
  console.log('✓ Updated Attendance Summary sub with active syllabus');
}

// 3. Subject Filter Header count
if (!att.includes('{activeSessionSyllabus !== \'Both\' ? ` (${activeSessionSyllabus})` : \'\'}')) {
  att = att.replace(
    /\{totalCount\} student\{totalCount !== 1 \? 's' : ''\} \{selectedSubject === 'All Students' \? 'enrolled' : `taking \${selectedSubject}`\}/,
    `{totalCount} student{totalCount !== 1 ? 's' : ''} {selectedSubject === 'All Students' ? 'enrolled' : \`taking \${selectedSubject}\`}{activeSessionSyllabus !== 'Both' ? \` (\${activeSessionSyllabus})\` : ''}`
  );
  console.log('✓ Updated Subject Filter count with active syllabus');
}

// 4. Empty State message
if (!att.includes('activeSessionSyllabus !== \'Both\'')) {
  att = att.replace(
    /<Text style=\{\{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors\.textPrimary \}\}>\s*No students enrolled in \{selectedSubject\}\s*<\/Text>/,
    `<Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary }}>${eol}                {activeSessionSyllabus !== 'Both'${eol}                  ? \`No \${activeSessionSyllabus} students taking \${selectedSubject || 'this subject'}\`${eol}                  : \`No students enrolled in \${selectedSubject || 'this subject'}\`}${eol}              </Text>`
  );

  att = att.replace(
    /<Text style=\{\{ fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors\.textMuted, textAlign: 'center', marginTop: 4 \}\}>\s*Switch subject filter to "All Subjects" or select another class\.\s*<\/Text>/,
    `<Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, textAlign: 'center', marginTop: 4 }}>${eol}                {activeSessionSyllabus !== 'Both'${eol}                  ? \`No students in \${currentClass.label} are enrolled under \${activeSessionSyllabus}. Switch session or select another class.\`${eol}                  : 'Switch subject filter to "All Subjects" or select another class.'}${eol}              </Text>`
  );
  console.log('✓ Updated Empty State messages with syllabus details');
}

// 5. Student Card syllabus indicator
if (!att.includes('item.syllabus ? ` • ${item.syllabus}` : \'\'')) {
  att = att.replace(
    /\{item\.roll\} • \{item\.school \|\| 'EduHome'\}/,
    `{item.roll} • {item.school || 'EduHome'}{item.syllabus ? \` • \${item.syllabus}\` : ''}`
  );
  console.log('✓ Updated student card subtext with syllabus badge');
}

fs.writeFileSync(attendancePath, att, 'utf8');
console.log('\n=== ALL PATCHES APPLIED TO FACULTY ATTENDANCE MODULE ===');
