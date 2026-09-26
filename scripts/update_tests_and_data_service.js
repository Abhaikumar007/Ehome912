const fs = require('fs');
const path = require('path');

const appDir = 'c:\\Users\\madhu\\eduhome\\eduhome-app';
const testsTsxPath = path.join(appDir, 'app', '(teacher)', 'tests.tsx');
const dataServicePath = path.join(appDir, 'lib', 'dataService.ts');

console.log('=== 1. Updating app/(teacher)/tests.tsx to dynamically load activeTeacher, restrict classes, and purge Madhusudanan ===');

let testsCode = fs.readFileSync(testsTsxPath, 'utf8');

// Add imports
if (!testsCode.includes('getActiveTeacher')) {
    testsCode = testsCode.replace(
        "import { EDUSYNC_STUDENTS } from '../../lib/studentsRoster';",
        "import { EDUSYNC_STUDENTS } from '../../lib/studentsRoster';\nimport { getActiveTeacher, TeacherProfile, getInitials } from '../../lib/teacherRoster';\nimport { supabase } from '../../lib/supabase';"
    );
}

// Add activeTeacher state and loadTeacher
const oldStateBlock = `export default function TeacherTestsScreen() {
  const router = useRouter();
  const [tests, setTests] = useState<ExamItem[]>([]);
  const [selectedClass, setSelectedClass] = useState('Class 10-A');
  const [activeTestId, setActiveTestId] = useState<string>('');`;

const newStateBlock = `export default function TeacherTestsScreen() {
  const router = useRouter();
  const [activeTeacher, setActiveTeacher] = useState<TeacherProfile | null>(null);
  const [tests, setTests] = useState<ExamItem[]>([]);
  const [selectedClass, setSelectedClass] = useState('Class 10-A');
  const [activeTestId, setActiveTestId] = useState<string>('');

  // Load active teacher profile & subscribe to changes
  useEffect(() => {
    const loadTeacher = async () => {
      const t = await getActiveTeacher();
      setActiveTeacher(t);
      if (t?.subject) {
        const sub = t.subject.split(' ')[0] as FacultySubject;
        if (SUBJECTS.includes(sub)) setNewSubject(sub);
      }
    };
    loadTeacher();

    const channel = supabase
      .channel('tests_teacher_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teachers' }, () => {
        loadTeacher();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter only classes assigned to this active faculty
  const teacherClasses = React.useMemo(() => {
    if (!activeTeacher || !activeTeacher.allowedGrades || activeTeacher.allowedGrades.includes('*')) {
      return AUTHORIZED_CLASSES;
    }
    return AUTHORIZED_CLASSES.filter((cls) => {
      const gradeNum = cls.match(/\\b(1[0-2]|[6-9])\\b/)?.[1];
      return gradeNum && activeTeacher.allowedGrades.includes(gradeNum);
    });
  }, [activeTeacher]);

  useEffect(() => {
    if (teacherClasses.length > 0 && !teacherClasses.includes(selectedClass)) {
      setSelectedClass(teacherClasses[0]);
    }
  }, [teacherClasses]);`;

if (testsCode.includes(oldStateBlock)) {
    testsCode = testsCode.replace(oldStateBlock, newStateBlock);
}

// Update authorization banner
const oldBanner = `        {/* Super Admin Authorization Banner */}
        <View style={styles.adminAuthCard}>
          <View style={styles.adminAvatarBox}>
            <Text style={styles.adminAvatarText}>RM</Text>
          </View>
          <View style={styles.adminAuthInfo}>
            <View style={styles.adminBadgeRow}>
              <Text style={styles.adminAuthTitle}>Mr. Abhai Kumar</Text>
              <View style={[styles.superBadge, { backgroundColor: '#0284C7' }]}>
                <Ionicons name="school" size={10} color="#fff" />
                <Text style={styles.superBadgeText}>FACULTY</Text>
              </View>
            </View>
            <Text style={styles.adminAuthSub}>
              Subjects, classes & student rosters assigned by Main Admin • Auto-sync active
            </Text>
          </View>
        </View>`;

const newBanner = `        {/* Super Admin Authorization Banner */}
        <View style={styles.adminAuthCard}>
          <View style={styles.adminAvatarBox}>
            <Text style={styles.adminAvatarText}>{activeTeacher ? getInitials(activeTeacher.name) : 'AK'}</Text>
          </View>
          <View style={styles.adminAuthInfo}>
            <View style={styles.adminBadgeRow}>
              <Text style={styles.adminAuthTitle}>{activeTeacher?.name || 'Mr. Abhai Kumar'}</Text>
              <View style={[styles.superBadge, { backgroundColor: '#0284C7' }]}>
                <Ionicons name="school" size={10} color="#fff" />
                <Text style={styles.superBadgeText}>FACULTY</Text>
              </View>
            </View>
            <Text style={styles.adminAuthSub}>
              {activeTeacher ? \`\${activeTeacher.subject} • \${activeTeacher.department}\` : 'Academic Head & Super Admin • Auto-sync active'}
            </Text>
          </View>
        </View>`;

if (testsCode.includes(oldBanner)) {
    testsCode = testsCode.replace(oldBanner, newBanner);
}

// Update chips to map over teacherClasses
testsCode = testsCode.replace('{AUTHORIZED_CLASSES.map((cls) => {', '{teacherClasses.map((cls) => {');
testsCode = testsCode.replace('{AUTHORIZED_CLASSES.map((cls) => (', '{teacherClasses.map((cls) => (');

// Update alert instructions & updatedBy
testsCode = testsCode.replace(
    "'Syllabus verified by Super Admin Mr. Abhai Kumar.'",
    "`Syllabus verified by Academic Head \${activeTeacher?.name || 'Mr. Abhai Kumar'}.`"
);
testsCode = testsCode.replace(
    "updatedBy: 'Mr. Abhai Kumar (Super Admin)',",
    "updatedBy: `\${activeTeacher?.name || 'Mr. Abhai Kumar'} (Faculty)\`,"
);
testsCode = testsCode.replace(
    "<Text style={styles.createModalSub}>Authorized by Super Admin Mr. Abhai Kumar</Text>",
    "<Text style={styles.createModalSub}>Authorized by Academic Head {activeTeacher?.name || 'Mr. Abhai Kumar'}</Text>"
);

fs.writeFileSync(testsTsxPath, testsCode, 'utf8');
console.log('✓ app/(teacher)/tests.tsx updated successfully');

console.log('=== 2. Updating lib/dataService.ts to purge Madhusudanan from test records ===');
let dsCode = fs.readFileSync(dataServicePath, 'utf8');

const oldGetTests = `  async getTests(classTag?: string): Promise<any[]> {
    const key = 'teacher_tests';
    const cached = await getCached<any[]>(key);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      if (classTag) {
        return cached.filter((t) => t.classTag === classTag);
      }
      return cached;
    }
    // Return none/empty when no test papers exist (no mock data)
    return [];
  },`;

const newGetTests = `  async getTests(classTag?: string): Promise<any[]> {
    const key = 'teacher_tests';
    const cached = await getCached<any[]>(key);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      // Purge any test items referencing Madhusudanan
      const valid = cached.filter((t) => !JSON.stringify(t).includes('Madhusudanan'));
      if (valid.length !== cached.length) {
        await setCached(key, valid);
      }
      if (classTag) {
        return valid.filter((t) => t.classTag === classTag);
      }
      return valid;
    }
    // Return empty when no test papers exist (no mock data)
    return [];
  },

  async clearAllTests(): Promise<void> {
    await setCached('teacher_tests', []);
    await setCached('academic_alert_active', null);
  },`;

if (dsCode.includes(oldGetTests)) {
    dsCode = dsCode.replace(oldGetTests, newGetTests);
    fs.writeFileSync(dataServicePath, dsCode, 'utf8');
    console.log('✓ lib/dataService.ts getTests updated');
}

console.log('=== Step completed ===');
