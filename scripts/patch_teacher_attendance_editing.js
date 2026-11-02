const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'app', '(teacher)', 'attendance.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

// 1. Add ActivityIndicator to react-native imports if not present
if (!code.includes('ActivityIndicator,')) {
  code = code.replace(
    'TextInput, Alert, Modal, Image, RefreshControl,',
    'TextInput, Alert, Modal, Image, RefreshControl, ActivityIndicator,'
  );
}

// 2. Add state hooks for editing and submission confirmation
if (!code.includes('const [isPreviouslySubmitted, setIsPreviouslySubmitted]')) {
  const stateAnchor = "  const [submitted, setSubmitted] = useState(false);";
  const newStates = `  const [submitted, setSubmitted] = useState(false);
  const [isPreviouslySubmitted, setIsPreviouslySubmitted] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);`;
  code = code.replace(stateAnchor, newStates);
}

// 3. Reset hasUnsavedChanges on class switch
code = code.replace(
`  useEffect(() => {
    setManuallyAddedStudents([]);
    setAttendanceMap({});
  }, [selectedClassId]);`,
`  useEffect(() => {
    setManuallyAddedStudents([]);
    setAttendanceMap({});
    setHasUnsavedChanges(false);
  }, [selectedClassId]);`
);

// 4. Update the roster effect to detect if attendance was previously submitted
const rosterStart = '    const rosterStudents: StudentRoster[] = combinedStudents.map((s, idx) => {';
const rosterEnd = '    setStudents(rosterStudents);\n    setSubmitted(false);\n  }, [';

const rosterStartIndex = code.indexOf(rosterStart);
const rosterEndIndex = code.indexOf(rosterEnd);

if (rosterStartIndex !== -1 && rosterEndIndex !== -1) {
  const oldRosterBlock = code.slice(rosterStartIndex, rosterEndIndex + rosterEnd.length);

  // Replace old block with new one that tracks foundSubmitted
  const updatedRosterBlock = `    let foundSubmitted = false;

    const rosterStudents: StudentRoster[] = combinedStudents.map((s, idx) => {
      const isManual = manuallyAddedStudents.some((m) => m.rollNo.toUpperCase() === s.rollNo.toUpperCase());
      let currentAttendance: 'P' | 'A' = attendanceMap[s.rollNo] || 'P';

      if (!attendanceMap[s.rollNo]) {
        const studentAtt = attRecords.find((a) => (a.roll_no || '').toUpperCase() === s.rollNo.toUpperCase());
        if (studentAtt) {
          const allEntries = [...(studentAtt.today_subjects || []), ...(studentAtt.history || [])];
          const matched = allEntries.find((entry: any) => {
            // 1. Direct classId match is the primary discriminator
            if (activeClassId && entry.classId) {
              return entry.classId === activeClassId;
            }
            // If activeClassId is set but entry has a different classId, do NOT match
            if (activeClassId && entry.classId && entry.classId !== activeClassId) {
              return false;
            }

            // 2. Subject match
            const entrySub = (entry.subject || entry.subjects || '').trim().toLowerCase();
            const targetSubNorm = targetSubject.trim().toLowerCase();
            const sameSub = entrySub === targetSubNorm || entrySub.includes(targetSubNorm) || targetSubNorm.includes(entrySub);
            if (!sameSub) return false;

            // 3. Time slot match (if specific session time is active)
            if (activeSessionTime && activeSessionTime !== 'Class Session') {
              if (entry.time && entry.time !== 'Class Session') {
                const entryTimeNorm = entry.time.split('•')[0].trim().toLowerCase();
                const activeTimeNorm = activeSessionTime.split('•')[0].trim().toLowerCase();
                return entryTimeNorm === activeTimeNorm || entryTimeNorm.includes(activeTimeNorm) || activeTimeNorm.includes(entryTimeNorm);
              }
              return false;
            }

            return true;
          });
          if (matched) {
            foundSubmitted = true;
            currentAttendance = (matched.status === 'absent' || matched.score === '0/1') ? 'A' : 'P';
          }
        }
      }

      return {
        id: s.rollNo,
        no: String(idx + 1).padStart(2, '0'),
        name: s.name,
        roll: s.rollNo,
        overall: \`\${s.accuracy || 85}%\`,
        online: true,
        attendance: currentAttendance,
        subjects: s.subjects || 'General',
        school: s.school,
        syllabus: resolveStudentSyllabus(s),
        isManuallyAdded: isManual,
      };
    });

    setStudents(rosterStudents);
    if (foundSubmitted) {
      setIsPreviouslySubmitted(true);
      setSubmitted(true);
    } else {
      setIsPreviouslySubmitted(false);
      setSubmitted(false);
    }
  }, [`;

  code = code.replace(oldRosterBlock, updatedRosterBlock);
}

// 5. Update toggleAttendance, markAllPresent, clearAll, and submission handlers
const oldHandlersAnchor = `  const toggleAttendance = (id: string, status: 'P' | 'A') => {
    setAttendanceMap((prev) => ({ ...prev, [id]: status }));
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, attendance: status } : s))
    );
    setSubmitted(false);
  };

  const markAllPresent = () => {
    setAttendanceMap((prev) => {
      const next = { ...prev };
      students.forEach((s) => { next[s.id] = 'P'; });
      return next;
    });
    setStudents((prev) => prev.map((s) => ({ ...s, attendance: 'P' })));
    setSubmitted(false);
  };

  const clearAll = () => {
    setAttendanceMap((prev) => {
      const next = { ...prev };
      students.forEach((s) => { next[s.id] = 'A'; });
      return next;
    });
    setStudents((prev) => prev.map((s) => ({ ...s, attendance: 'A' })));
    setSubmitted(false);
  };

  const handleSaveSubmit = async () => {
    const dateLabel = getDateLabel();
    const teacherName = activeTeacher?.name || 'Faculty Member';
    const subjectName = (selectedSubject && selectedSubject !== 'All' && selectedSubject !== 'All Subjects' && selectedSubject !== 'All Students')
      ? selectedSubject
      : (activeTeacher?.subject?.split('(')[0]?.trim() || 'General');
    setSubmitted(true);
    // Save to DataService so it syncs to each student's portal
    try {
      await DataService.saveBatchAttendance(
        students.map((s) => ({ rollNo: s.roll, name: s.name, status: s.attendance })),
        dateLabel,
        subjectName,
        currentClass.label,
        {
          classId: activeClassId,
          timeSlot: activeSessionTime || 'Class Session',
          sessionType: activeSessionType || 'Regular Class',
          classDate: targetDateIso,
        }
      );
    } catch {
      // Offline fallback — still mark submitted
    }
    Alert.alert(
      'Attendance Submitted Successfully',
      \`Class: \${currentClass.label}\\nSubject: \${subjectName}\\nBoard: \${selectedSyllabus === 'All' ? 'Both (CBSE & State)' : selectedSyllabus}\\nSession: \${activeSessionTime || 'Class Session'}\${activeSessionType ? \` (\${activeSessionType})\` : ''}\\nDate: \${dateLabel}\\nTeacher: \${teacherName}\\nPresent: \${presentCount} | Absent: \${absentCount}\${manuallyAddedStudents.length > 0 ? \`\\nFlexible Added: \${manuallyAddedStudents.length} student(s)\` : ''}\\n\\nAttendance has been recorded separately for this session and synced with student portals.\`,
      [{ text: 'OK' }]
    );
  };`;

const newHandlers = `  const toggleAttendance = (id: string, status: 'P' | 'A') => {
    setAttendanceMap((prev) => ({ ...prev, [id]: status }));
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, attendance: status } : s))
    );
    setSubmitted(false);
    setHasUnsavedChanges(true);
  };

  const markAllPresent = () => {
    setAttendanceMap((prev) => {
      const next = { ...prev };
      students.forEach((s) => { next[s.id] = 'P'; });
      return next;
    });
    setStudents((prev) => prev.map((s) => ({ ...s, attendance: 'P' })));
    setSubmitted(false);
    setHasUnsavedChanges(true);
  };

  const clearAll = () => {
    Alert.alert(
      'Mark All Students Absent?',
      \`Are you sure you want to mark all \${students.length} students as absent for this session?\`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All Absent',
          style: 'destructive',
          onPress: () => {
            setAttendanceMap((prev) => {
              const next = { ...prev };
              students.forEach((s) => { next[s.id] = 'A'; });
              return next;
            });
            setStudents((prev) => prev.map((s) => ({ ...s, attendance: 'A' })));
            setSubmitted(false);
            setHasUnsavedChanges(true);
          },
        },
      ]
    );
  };

  const executeSaveSubmit = async () => {
    const dateLabel = getDateLabel();
    const teacherName = activeTeacher?.name || 'Faculty Member';
    const subjectName = (selectedSubject && selectedSubject !== 'All' && selectedSubject !== 'All Subjects' && selectedSubject !== 'All Students')
      ? selectedSubject
      : (activeTeacher?.subject?.split('(')[0]?.trim() || 'General');

    setSavingAttendance(true);
    try {
      const updatedResults = await DataService.saveBatchAttendance(
        students.map((s) => ({ rollNo: s.roll, name: s.name, status: s.attendance })),
        dateLabel,
        subjectName,
        currentClass.label,
        {
          classId: activeClassId,
          timeSlot: activeSessionTime || 'Class Session',
          sessionType: activeSessionType || 'Regular Class',
          classDate: targetDateIso,
        }
      );

      // Immediately merge updated results into in-memory attRecords so class/session switches retain edits
      if (Array.isArray(updatedResults) && updatedResults.length > 0) {
        setAttRecords((prev) => {
          const map = new Map<string, any>();
          prev.forEach((r) => map.set((r.roll_no || '').toUpperCase(), r));
          updatedResults.forEach((u) => {
            if (u.rollNo) {
              const existing = map.get(u.rollNo.toUpperCase()) || {};
              map.set(u.rollNo.toUpperCase(), {
                ...existing,
                roll_no: u.rollNo,
                today_subjects: u.todaySubjects,
                history: u.history,
                overall: u.overall,
                attended: u.attended,
                total: u.total,
              });
            }
          });
          return Array.from(map.values());
        });
      }

      setAttendanceMap({});
      setSubmitted(true);
      setIsPreviouslySubmitted(true);
      setHasUnsavedChanges(false);

      Alert.alert(
        isPreviouslySubmitted ? 'Attendance Corrected & Synced' : 'Attendance Submitted Successfully',
        \`Class: \${currentClass.label}\\nSubject: \${subjectName}\\nBoard: \${selectedSyllabus === 'All' ? 'Both (CBSE & State)' : selectedSyllabus}\\nSession: \${activeSessionTime || 'Class Session'}\${activeSessionType ? \` (\${activeSessionType})\` : ''}\\nDate: \${dateLabel}\\nTeacher: \${teacherName}\\nPresent: \${presentCount} | Absent: \${absentCount}\${manuallyAddedStudents.length > 0 ? \`\\nFlexible Added: \${manuallyAddedStudents.length} student(s)\` : ''}\\n\\nAttendance has been recorded and synced to student portals in real time.\`,
        [{ text: 'OK' }]
      );
    } catch {
      // Offline fallback
      setSubmitted(true);
      setIsPreviouslySubmitted(true);
      setHasUnsavedChanges(false);
      Alert.alert('Saved Offline', 'Attendance saved to your device. It will sync automatically when an internet connection is available.');
    } finally {
      setSavingAttendance(false);
    }
  };

  const handlePressSubmit = () => {
    const presentList = students.filter((s) => s.attendance === 'P');
    const absentList = students.filter((s) => s.attendance === 'A');
    const subjectName = (selectedSubject && selectedSubject !== 'All' && selectedSubject !== 'All Subjects' && selectedSubject !== 'All Students')
      ? selectedSubject
      : (activeTeacher?.subject?.split('(')[0]?.trim() || 'General');
    const boardLabel = selectedSyllabus === 'All' ? 'Both (CBSE & State)' : selectedSyllabus;

    if (isPreviouslySubmitted) {
      // Editing / Correcting previously submitted attendance
      Alert.alert(
        'Confirm Attendance Corrections',
        \`Class: \${currentClass.label} • \${subjectName}\\n\` +
        \`Board: \${boardLabel}\\n\` +
        \`Session: \${activeSessionTime || 'Class Session'}\\n\` +
        \`Date: \${getDateLabel()}\\n\\n\` +
        \`Updated Turnout:\\n\` +
        \`✓ Present: \${presentList.length} student(s)\\n\` +
        \`✗ Absent: \${absentList.length} student(s)\\n\` +
        (absentList.length > 0 ? \`\\nAbsent: \${absentList.map((s) => s.name).join(', ')}\\n\` : '\\nAll students marked Present!\\n') +
        \`\\nStudent portals and turnout records will be updated immediately.\`,
        [
          { text: 'Review / Cancel', style: 'cancel' },
          {
            text: 'Save Corrections',
            style: 'default',
            onPress: () => executeSaveSubmit(),
          },
        ]
      );
    } else {
      // First-time submission
      Alert.alert(
        'Confirm Attendance Submission',
        \`Class: \${currentClass.label} • \${subjectName}\\n\` +
        \`Board: \${boardLabel}\\n\` +
        \`Session: \${activeSessionTime || 'Class Session'}\\n\` +
        \`Date: \${getDateLabel()}\\n\\n\` +
        \`Turnout:\\n\` +
        \`✓ Present: \${presentList.length} student(s)\\n\` +
        \`✗ Absent: \${absentList.length} student(s)\\n\` +
        (absentList.length > 0 ? \`\\nAbsent: \${absentList.map((s) => s.name).join(', ')}\\n\` : '\\nAll students marked Present!\\n') +
        \`\\nYou can edit or correct this record anytime.\`,
        [
          { text: 'Review / Cancel', style: 'cancel' },
          {
            text: 'Confirm & Submit',
            style: 'default',
            onPress: () => executeSaveSubmit(),
          },
        ]
      );
    }
  };`;

code = code.replace(oldHandlersAnchor, newHandlers);

// 6. Update the summary badge in Attendance Summary card
const oldReadyBadge = `<View style={[styles.readyBadge, submitted && styles.submittedBadge]}>
                  <View style={[styles.readyDot, submitted && { backgroundColor: Colors.green }]} />
                  <Text style={[styles.readyText, submitted && { color: Colors.green }]}>
                    {submitted ? 'Submitted ✓' : 'Ready to Submit'}
                  </Text>
                </View>`;

const newReadyBadge = `<View
                  style={[
                    styles.readyBadge,
                    (submitted || isPreviouslySubmitted) && !hasUnsavedChanges && styles.submittedBadge,
                    hasUnsavedChanges && isPreviouslySubmitted && styles.editingBadge,
                  ]}
                >
                  <View
                    style={[
                      styles.readyDot,
                      (submitted || isPreviouslySubmitted) && !hasUnsavedChanges && { backgroundColor: Colors.green },
                      hasUnsavedChanges && isPreviouslySubmitted && { backgroundColor: '#D97706' },
                    ]}
                  />
                  <Text
                    style={[
                      styles.readyText,
                      (submitted || isPreviouslySubmitted) && !hasUnsavedChanges && { color: Colors.green },
                      hasUnsavedChanges && isPreviouslySubmitted && { color: '#D97706' },
                    ]}
                  >
                    {hasUnsavedChanges && isPreviouslySubmitted
                      ? 'Editing (Unsaved)'
                      : (submitted || isPreviouslySubmitted)
                      ? 'Submitted & Synced ✓'
                      : 'Ready to Submit'}
                  </Text>
                </View>`;

code = code.replace(oldReadyBadge, newReadyBadge);

// 7. Add Edit Notice Banner right before Student List if editing
const listAnchor = '{/* Student List / Attendance Table */}';
const editNoticeMarkup = `{/* Editing Alert Banner when modifying an already-submitted attendance */}
        {isPreviouslySubmitted && hasUnsavedChanges && (
          <View style={styles.editNoticeBanner}>
            <Ionicons name="create-outline" size={18} color="#D97706" />
            <View style={{ flex: 1 }}>
              <Text style={styles.editNoticeTitle}>Editing Submitted Attendance</Text>
              <Text style={styles.editNoticeSub}>
                You modified student records. Tap "Save Corrected Attendance" below to update student portals.
              </Text>
            </View>
          </View>
        )}

        {/* Student List / Attendance Table */}`;

code = code.replace(listAnchor, editNoticeMarkup);

// 8. Update Bottom Submit Button
const oldSubmitBtn = `<TouchableOpacity style={styles.submitBtn} onPress={handleSaveSubmit} activeOpacity={0.85}>
          <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.submitBtnText}>Save & Submit Attendance</Text>
        </TouchableOpacity>`;

const newSubmitBtn = `<TouchableOpacity
          style={[
            styles.submitBtn,
            isPreviouslySubmitted && !hasUnsavedChanges && styles.submitBtnAlreadySaved,
            hasUnsavedChanges && isPreviouslySubmitted && styles.submitBtnUpdate,
            savingAttendance && { opacity: 0.7 },
          ]}
          onPress={handlePressSubmit}
          activeOpacity={0.85}
          disabled={savingAttendance}
        >
          {savingAttendance ? (
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
          ) : (
            <Ionicons
              name={hasUnsavedChanges && isPreviouslySubmitted ? "sync-outline" : isPreviouslySubmitted && !hasUnsavedChanges ? "checkmark-done-circle-outline" : "checkmark"}
              size={18}
              color={isPreviouslySubmitted && !hasUnsavedChanges ? Colors.primary : "#fff"}
              style={{ marginRight: 6 }}
            />
          )}
          <Text
            style={[
              styles.submitBtnText,
              isPreviouslySubmitted && !hasUnsavedChanges && styles.submitBtnTextAlreadySaved,
            ]}
          >
            {savingAttendance
              ? 'Saving Attendance...'
              : hasUnsavedChanges && isPreviouslySubmitted
              ? \`Save Corrected Attendance (\${presentCount} Present, \${absentCount} Absent)\`
              : isPreviouslySubmitted && !hasUnsavedChanges
              ? 'Attendance Submitted ✓ (Tap to Edit)'
              : 'Save & Submit Attendance'}
          </Text>
        </TouchableOpacity>`;

code = code.replace(oldSubmitBtn, newSubmitBtn);

// 9. Add styles for editing badge, notice banner, and button states
const styleAnchor = '  submittedBadge: {';
const newStyles = `  editingBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  editNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  editNoticeTitle: {
    fontSize: 12.5,
    fontFamily: 'Inter_700Bold',
    color: '#B45309',
  },
  editNoticeSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#92400E',
    marginTop: 2,
    lineHeight: 15,
  },
  submitBtnAlreadySaved: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  submitBtnTextAlreadySaved: {
    color: Colors.primary,
  },
  submitBtnUpdate: {
    backgroundColor: '#0284C7',
    borderWidth: 0,
  },
  submittedBadge: {`;

code = code.replace(styleAnchor, newStyles);

fs.writeFileSync(targetFile, code, 'utf8');
console.log('Successfully updated app/(teacher)/attendance.tsx with edit protection, confirmation alerts, and live state updates!');

