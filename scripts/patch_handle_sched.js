const fs = require('fs');

// 1. Fix handleOpenScheduleClass in index.tsx
const indexPath = 'c:/Users/madhu/eduhome/eduhome-app/app/(teacher)/index.tsx';
let indexContent = fs.readFileSync(indexPath, 'utf8');

const targetStr = "const handleUpdateSessionType = async (newType: 'Regular' | 'QuestionBank' | 'TP') => {";
const replacementStr = `const handleOpenScheduleClass = () => {
    setSchedSubject(activeTeacher.subject || 'Physics');
    setSchedClassGrade(activeTeacher.allowedGrades?.[0] && activeTeacher.allowedGrades[0] !== '*' ? \`Class \${activeTeacher.allowedGrades[0]}\` : 'Class 10');
    setSchedSyllabus('Both');
    setSchedSessionType('Regular Class');
    setSchedStartTime('04:00 PM');
    setSchedEndTime('05:30 PM');
    setScheduleClassModalVisible(true);
  };

  const handleSaveScheduledClass = async () => {
    if (!schedClassGrade || !schedSubject || !schedStartTime || !schedEndTime) {
      Alert.alert('Missing Details', 'Please fill in Class, Subject, Start Time and End Time.');
      return;
    }
    setIsSavingSchedClass(true);
    try {
      const targetDate = targetDateInfo.iso;
      await DataService.scheduleTeacherClassSession({
        classGrade: schedClassGrade,
        subject: schedSubject,
        classDate: targetDate,
        startTime: schedStartTime,
        endTime: schedEndTime,
        sessionType: schedSessionType,
        targetSyllabus: schedSyllabus,
        facultyId: activeTeacher.id,
        facultyName: activeTeacher.name,
      });

      setScheduleClassModalVisible(false);
      Alert.alert(
        'Session Scheduled ✓',
        \`\${schedClassGrade} (\${schedSyllabus}) \${schedSubject} has been successfully scheduled for \${targetDateInfo.label}.\`
      );
      loadTimetable();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to schedule session. Please try again.');
    } finally {
      setIsSavingSchedClass(false);
    }
  };

  const handleUpdateSessionType = async (newType: 'Regular' | 'QuestionBank' | 'TP') => {`;

indexContent = indexContent.replace(targetStr, replacementStr);

indexContent = indexContent.replace(
  "const { newTime, newStatus, typeTag } = formatUpdatedSession(targetClass, newType, activeTeacher);",
  "const { newTime, newStatus, typeTag } = formatUpdatedSession(targetClass, newType, activeTeacher, editSessionSyllabus);"
);

fs.writeFileSync(indexPath, indexContent, 'utf8');
console.log('✓ Injected handleOpenScheduleClass and handleSaveScheduledClass in index.tsx');

// 2. Fix ExamItem interface in tests.tsx
const testsPath = 'c:/Users/madhu/eduhome/eduhome-app/app/(teacher)/tests.tsx';
let testsContent = fs.readFileSync(testsPath, 'utf8');

testsContent = testsContent.replace(
  "classTag: string;\n  dateStr: string;",
  "classTag: string;\n  targetSyllabus?: 'Both' | 'State Syllabus' | 'CBSE';\n  dateStr: string;"
);

// If CRLF
if (!testsContent.includes("targetSyllabus?: 'Both'")) {
  testsContent = testsContent.replace(
    /classTag:\s*string;[\r\n]+dateStr:\s*string;/,
    "classTag: string;\n  targetSyllabus?: 'Both' | 'State Syllabus' | 'CBSE';\n  dateStr: string;"
  );
}

fs.writeFileSync(testsPath, testsContent, 'utf8');
console.log('✓ Injected targetSyllabus into ExamItem interface in tests.tsx');
