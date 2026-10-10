const fs = require('fs');

const filePath = 'c:/Users/madhu/eduhome/eduhome-app/app/(teacher)/index.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update imports
content = content.replace(
  "import { DataService, compareClassTimes } from '../../lib/dataService';",
  "import { DataService, compareClassTimes, resolveClassTargetSyllabus } from '../../lib/dataService';"
);

// 2. Update formatUpdatedSession
const oldFormatFunc = `function formatUpdatedSession(
  currentClass: any,
  newType: 'Regular' | 'QuestionBank' | 'TP',
  teacher: TeacherProfile
) {
  const typeTag = newType === 'TP' ? 'Test Paper' : newType === 'QuestionBank' ? 'Question Bank' : 'Regular Class';

  const rawTime = currentClass.time || '';
  const timeTokens = rawTime.split('•').map((s: string) => s.trim()).filter(Boolean);
  const baseSlot = timeTokens[0] || '';

  const teacherName = teacher?.name || '';
  const facultyToken = timeTokens.find((tok: string) => {
    const l = tok.toLowerCase();
    if (l === 'test paper' || l === 'tp' || l === 'question bank' || l === 'qb' || l === 'regular') return false;
    return (
      l.includes('mr.') ||
      l.includes('ms.') ||
      l.includes('mrs.') ||
      l.includes('dr.') ||
      (teacherName && l.includes(teacherName.toLowerCase()))
    );
  }) || (teacherName ? teacherName : undefined);

  const newTimeParts: string[] = [baseSlot];
  if (newType !== 'Regular') {
    newTimeParts.push(typeTag);
  }
  if (facultyToken) {
    newTimeParts.push(facultyToken);
  }
  const newTime = newTimeParts.join(' • ');

  const rawStatus = currentClass.status || 'upcoming';
  const statusParts = rawStatus.split(':').map((s: string) => s.trim()).filter(Boolean);
  const facId = statusParts.find((p: string) => p.startsWith('fac-')) || teacher?.id || 'fac-math';

  let newStatus: string;
  if (newType === 'Regular') {
    newStatus = \`upcoming:\${facId}\`;
  } else {
    newStatus = \`upcoming:\${newType}:\${facId}\`;
  }

  return { newTime, newStatus, typeTag };
}`;

const newFormatFunc = `function formatUpdatedSession(
  currentClass: any,
  newType: 'Regular' | 'QuestionBank' | 'TP',
  teacher: TeacherProfile,
  newSyllabus?: 'Both' | 'State Syllabus' | 'CBSE'
) {
  const typeTag = newType === 'TP' ? 'Test Paper' : newType === 'QuestionBank' ? 'Question Bank' : 'Regular Class';

  const rawTime = currentClass.time || '';
  const timeTokens = rawTime.split('•').map((s: string) => s.trim()).filter(Boolean);
  const baseSlot = timeTokens[0] || '';

  const effectiveSyllabus = newSyllabus || resolveClassTargetSyllabus(currentClass);

  const teacherName = teacher?.name || '';
  const facultyToken = timeTokens.find((tok: string) => {
    const l = tok.toLowerCase();
    if (l === 'test paper' || l === 'tp' || l === 'question bank' || l === 'qb' || l === 'regular' || l === 'cbse' || l === 'state' || l === 'state syllabus') return false;
    return (
      l.includes('mr.') ||
      l.includes('ms.') ||
      l.includes('mrs.') ||
      l.includes('dr.') ||
      (teacherName && l.includes(teacherName.toLowerCase()))
    );
  }) || (teacherName ? teacherName : undefined);

  const newTimeParts: string[] = [baseSlot];
  if (effectiveSyllabus === 'CBSE') {
    newTimeParts.push('CBSE');
  } else if (effectiveSyllabus === 'State Syllabus') {
    newTimeParts.push('State Syllabus');
  }

  if (newType !== 'Regular') {
    newTimeParts.push(typeTag);
  }
  if (facultyToken) {
    newTimeParts.push(facultyToken);
  }
  const newTime = newTimeParts.join(' • ');

  const rawStatus = currentClass.status || 'upcoming';
  const statusParts = rawStatus.split(':').map((s: string) => s.trim()).filter(Boolean);
  const facId = statusParts.find((p: string) => p.startsWith('fac-')) || teacher?.id || 'fac-math';

  const sylPart = effectiveSyllabus === 'CBSE' ? 'CBSE' : effectiveSyllabus === 'State Syllabus' ? 'State' : '';
  const typePart = newType === 'Regular' ? '' : newType;

  const newStatus = ['upcoming', sylPart, typePart, facId].filter(Boolean).join(':');

  return { newTime, newStatus, typeTag, effectiveSyllabus };
}`;

if (content.includes(oldFormatFunc)) {
  content = content.replace(oldFormatFunc, newFormatFunc);
} else {
  console.log('formatUpdatedSession matching by regex...');
  content = content.replace(
    /function formatUpdatedSession[\s\S]*?return \{ newTime, newStatus, typeTag \};\s*\}/,
    newFormatFunc
  );
}

// 3. Add states for scheduling classes and editing session syllabus
const targetStateAnchor = "const [selectedClassForSessionType, setSelectedClassForSessionType] = useState<any>(null);";
const additionalStates = `const [selectedClassForSessionType, setSelectedClassForSessionType] = useState<any>(null);
  const [editSessionSyllabus, setEditSessionSyllabus] = useState<'Both' | 'State Syllabus' | 'CBSE'>('Both');

  // Schedule New Class Session modal state
  const [scheduleClassModalVisible, setScheduleClassModalVisible] = useState(false);
  const [schedClassGrade, setSchedClassGrade] = useState('Class 10');
  const [schedSyllabus, setSchedSyllabus] = useState<'Both' | 'State Syllabus' | 'CBSE'>('Both');
  const [schedSubject, setSchedSubject] = useState('');
  const [schedStartTime, setSchedStartTime] = useState('04:00 PM');
  const [schedEndTime, setSchedEndTime] = useState('05:30 PM');
  const [schedSessionType, setSchedSessionType] = useState('Regular Class');
  const [isSavingSchedClass, setIsSavingSchedClass] = useState(false);`;

content = content.replace(targetStateAnchor, additionalStates);

// 4. Add handlers for scheduling classes and updating session format
const oldHandleUpdate = `  const handleUpdateSessionType = async (newType: 'Regular' | 'QuestionBank' | 'TP') => {
    if (!selectedClassForSessionType) return;
    const targetClass = selectedClassForSessionType;
    setSessionTypeModalVisible(false);

    const { newTime, newStatus, typeTag } = formatUpdatedSession(targetClass, newType, activeTeacher);`;

const newHandleUpdate = `  const handleOpenScheduleClass = () => {
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

  const handleUpdateSessionType = async (newType: 'Regular' | 'QuestionBank' | 'TP') => {
    if (!selectedClassForSessionType) return;
    const targetClass = selectedClassForSessionType;
    setSessionTypeModalVisible(false);

    const { newTime, newStatus, typeTag } = formatUpdatedSession(targetClass, newType, activeTeacher, editSessionSyllabus);`;

content = content.replace(oldHandleUpdate, newHandleUpdate);

// 5. When opening session format modal, also populate editSessionSyllabus
content = content.replace(
  `                        setSelectedClassForSessionType(c);
                        setSessionTypeModalVisible(true);`,
  `                        setSelectedClassForSessionType(c);
                        setEditSessionSyllabus(resolveClassTargetSyllabus(c));
                        setSessionTypeModalVisible(true);`
);

// 6. In Teaching Schedule Header, add Day Toggle + Schedule Class button
const oldScheduleHeader = `        {/* Teaching Schedule Header with Day Toggle (Today vs Tomorrow) */}
        <View style={styles.scheduleHeaderContainer}>
          <View style={styles.scheduleTopRow}>
            <View style={{ flex: 1, paddingRight: 6 }}>
              <Text style={styles.sectionTitle} numberOfLines={1}>
                {dateOffset === 1
                  ? "Tomorrow's Classes"
                  : "Today's Classes"}
              </Text>
              <View style={styles.scheduleSubRow}>
                <Text style={styles.scheduleSubDate}>
                  {targetDateInfo.label} • {assignedClasses.length > 0 ? \`\${assignedClasses.length} Session\${assignedClasses.length > 1 ? 's' : ''}\` : 'None'}
                </Text>
                {new Date().getHours() >= 19 && dateOffset === 1 && (
                  <View style={styles.autoTomorrowBadge}>
                    <Ionicons name="moon" size={9} color="#1D4ED8" />
                    <Text style={styles.autoTomorrowBadgeText}>7 PM+ Auto</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Day Toggle Switch */}
            <View style={styles.daySwitchContainer}>
              <TouchableOpacity
                style={[styles.daySwitchBtn, dateOffset === 0 && styles.daySwitchBtnActive]}
                onPress={() => setDateOffset(0)}
                activeOpacity={0.8}
              >
                <Text style={[styles.daySwitchBtnText, dateOffset === 0 && styles.daySwitchBtnTextActive]}>
                  Today
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.daySwitchBtn, dateOffset === 1 && styles.daySwitchBtnActive]}
                onPress={() => setDateOffset(1)}
                activeOpacity={0.8}
              >
                <Text style={[styles.daySwitchBtnText, dateOffset === 1 && styles.daySwitchBtnTextActive]}>
                  Tomorrow
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>`;

const newScheduleHeader = `        {/* Teaching Schedule Header with Day Toggle & Schedule Class */}
        <View style={styles.scheduleHeaderContainer}>
          <View style={styles.scheduleTopRow}>
            <View style={{ flex: 1, paddingRight: 6 }}>
              <Text style={styles.sectionTitle} numberOfLines={1}>
                {dateOffset === 1
                  ? "Tomorrow's Classes"
                  : "Today's Classes"}
              </Text>
              <View style={styles.scheduleSubRow}>
                <Text style={styles.scheduleSubDate}>
                  {targetDateInfo.label} • {assignedClasses.length > 0 ? \`\${assignedClasses.length} Session\${assignedClasses.length > 1 ? 's' : ''}\` : 'None'}
                </Text>
                {new Date().getHours() >= 19 && dateOffset === 1 && (
                  <View style={styles.autoTomorrowBadge}>
                    <Ionicons name="moon" size={9} color="#1D4ED8" />
                    <Text style={styles.autoTomorrowBadgeText}>7 PM+ Auto</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Day Toggle Switch */}
            <View style={styles.daySwitchContainer}>
              <TouchableOpacity
                style={[styles.daySwitchBtn, dateOffset === 0 && styles.daySwitchBtnActive]}
                onPress={() => setDateOffset(0)}
                activeOpacity={0.8}
              >
                <Text style={[styles.daySwitchBtnText, dateOffset === 0 && styles.daySwitchBtnTextActive]}>
                  Today
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.daySwitchBtn, dateOffset === 1 && styles.daySwitchBtnActive]}
                onPress={() => setDateOffset(1)}
                activeOpacity={0.8}
              >
                <Text style={[styles.daySwitchBtnText, dateOffset === 1 && styles.daySwitchBtnTextActive]}>
                  Tomorrow
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Schedule Class Action Bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 8 }}>
            <TouchableOpacity
              style={styles.scheduleClassBtn}
              onPress={handleOpenScheduleClass}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={15} color="#ffffff" />
              <Text style={styles.scheduleClassBtnText}>Schedule Class</Text>
            </TouchableOpacity>
          </View>
        </View>`;

if (content.includes(oldScheduleHeader)) {
  content = content.replace(oldScheduleHeader, newScheduleHeader);
} else {
  console.log('scheduleHeader matching with regex...');
  content = content.replace(
    /\{\/\* Teaching Schedule Header with Day Toggle \(Today vs Tomorrow\) \*\/\}[\s\S]*?<\/View>\s*<\/View>\s*<\/View>/,
    newScheduleHeader
  );
}

// 7. In class card: show target syllabus badge
const oldBadgeWrap = `                    <View style={styles.classBadgeWrap}>
                      <Text style={[styles.classBadgeName, { color: sessionInfo.color }]}>{classTitle}</Text>
                      <Text style={styles.subjectDot}>•</Text>
                      <Text style={styles.subjectText}>{subjectTitle}</Text>
                    </View>`;

const newBadgeWrap = `                    <View style={styles.classBadgeWrap}>
                      <Text style={[styles.classBadgeName, { color: sessionInfo.color }]}>{classTitle}</Text>
                      <Text style={styles.subjectDot}>•</Text>
                      <Text style={styles.subjectText}>{subjectTitle}</Text>
                      {(() => {
                        const syl = resolveClassTargetSyllabus(c);
                        const isCBSE = syl === 'CBSE';
                        const isState = syl === 'State Syllabus';
                        return (
                          <View style={[
                            styles.syllabusBadgePill,
                            isCBSE ? styles.cbseBadgePill : isState ? styles.stateBadgePill : styles.bothBadgePill
                          ]}>
                            <Text style={[
                              styles.syllabusBadgeText,
                              isCBSE ? styles.cbseBadgeText : isState ? styles.stateBadgeText : styles.bothBadgeText
                            ]}>
                              {isCBSE ? 'CBSE' : isState ? 'State' : 'State & CBSE'}
                            </Text>
                          </View>
                        );
                      })()}
                    </View>`;

content = content.replace(oldBadgeWrap, newBadgeWrap);

// 8. In Session Format modal: add Target Syllabus selector chips
const oldSessionModalHeader = `<View style={{ marginTop: 10 }}>
              {[`;

const newSessionModalHeader = `<View style={{ marginTop: 10 }}>
              {/* Target Syllabus selector in format modal */}
              <Text style={[styles.modalFieldLabel, { marginBottom: 6 }]}>Target Syllabus</Text>
              <View style={[styles.chipRow, { marginBottom: 12 }]}>
                {(['Both', 'State Syllabus', 'CBSE'] as const).map((syl) => (
                  <TouchableOpacity
                    key={syl}
                    style={[styles.modalSelectChip, editSessionSyllabus === syl && styles.modalSelectChipActive]}
                    onPress={() => setEditSessionSyllabus(syl)}
                  >
                    <Text style={[styles.modalSelectChipText, editSessionSyllabus === syl && styles.modalSelectChipTextActive]}>
                      {syl === 'Both' ? 'Both (State & CBSE)' : syl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.modalFieldLabel, { marginBottom: 6 }]}>Select Format</Text>
              {[`;

content = content.replace(oldSessionModalHeader, newSessionModalHeader);

// 9. Add Schedule Class Session Modal before closing </SafeAreaView>
const scheduleClassModalDOM = `      {/* Schedule Class Session Modal */}
      <Modal visible={scheduleClassModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '90%' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Schedule Class Session</Text>
                <Text style={styles.modalSub}>
                  {activeTeacher.name} • {activeTeacher.subject}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setScheduleClassModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 10 }}>
              {/* Target Class */}
              <Text style={styles.modalFieldLabel}>Target Class</Text>
              <View style={styles.chipRow}>
                {['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map((cls) => (
                  <TouchableOpacity
                    key={cls}
                    style={[styles.modalSelectChip, schedClassGrade === cls && styles.modalSelectChipActive]}
                    onPress={() => setSchedClassGrade(cls)}
                  >
                    <Text style={[styles.modalSelectChipText, schedClassGrade === cls && styles.modalSelectChipTextActive]}>
                      {cls}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Target Syllabus */}
              <Text style={styles.modalFieldLabel}>Target Syllabus</Text>
              <View style={styles.chipRow}>
                {(['Both', 'State Syllabus', 'CBSE'] as const).map((syl) => (
                  <TouchableOpacity
                    key={syl}
                    style={[styles.modalSelectChip, schedSyllabus === syl && styles.modalSelectChipActive]}
                    onPress={() => setSchedSyllabus(syl)}
                  >
                    <Text style={[styles.modalSelectChipText, schedSyllabus === syl && styles.modalSelectChipTextActive]}>
                      {syl === 'Both' ? 'Both (State & CBSE)' : syl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Session Format */}
              <Text style={styles.modalFieldLabel}>Session Format</Text>
              <View style={styles.chipRow}>
                {['Regular Class', 'Question Bank', 'Test Paper'].map((fmt) => (
                  <TouchableOpacity
                    key={fmt}
                    style={[styles.modalSelectChip, schedSessionType === fmt && styles.modalSelectChipActive]}
                    onPress={() => setSchedSessionType(fmt)}
                  >
                    <Text style={[styles.modalSelectChipText, schedSessionType === fmt && styles.modalSelectChipTextActive]}>
                      {fmt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Subject */}
              <Text style={styles.modalFieldLabel}>Subject</Text>
              <TextInput
                style={styles.modalInput}
                value={schedSubject}
                onChangeText={setSchedSubject}
                placeholder="e.g. Mathematics"
                placeholderTextColor={Colors.textMuted}
              />

              {/* Time Slots */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalFieldLabel}>Start Time</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={schedStartTime}
                    onChangeText={setSchedStartTime}
                    placeholder="e.g. 04:00 PM"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalFieldLabel}>End Time</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={schedEndTime}
                    onChangeText={setSchedEndTime}
                    placeholder="e.g. 05:30 PM"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>

              <View style={[styles.opinionDisclaimerBox, { marginTop: 12, marginBottom: 12 }]}>
                <Ionicons name="information-circle-outline" size={15} color="#0284C7" />
                <Text style={styles.opinionDisclaimerText}>
                  Scheduled for {targetDateInfo.label}. Students enrolled in {schedSyllabus === 'Both' ? 'State or CBSE syllabus' : schedSyllabus} will see this in their timetable.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, isSavingSchedClass && { opacity: 0.7 }]}
                onPress={handleSaveScheduledClass}
                disabled={isSavingSchedClass}
                activeOpacity={0.8}
              >
                {isSavingSchedClass ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Confirm & Schedule Session</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>`;

content = content.replace(/\n\s*<\/SafeAreaView>/, '\n' + scheduleClassModalDOM);

// 10. Add styles
const newStyles = `  scheduleClassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  scheduleClassBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  syllabusBadgePill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    marginLeft: 4,
  },
  cbseBadgePill: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  stateBadgePill: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  bothBadgePill: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  syllabusBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
  },
  cbseBadgeText: {
    color: '#0369A1',
  },
  stateBadgeText: {
    color: '#15803D',
  },
  bothBadgeText: {
    color: '#64748B',
  },
  modalFieldLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  modalSelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: '#F8FAFC',
  },
  modalSelectChipActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  modalSelectChipText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  modalSelectChipTextActive: {
    color: '#0284C7',
    fontFamily: 'Inter_600SemiBold',
  },
  modalSubmitBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});`;

content = content.replace(/\n\}\);\s*$/, '\n' + newStyles);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Successfully patched app/(teacher)/index.tsx');
