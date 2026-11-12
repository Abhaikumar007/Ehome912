const fs = require('fs');
const path = require('path');

const rawPath = path.join(__dirname, '../constants/cbseClass10PyqData.json');
const outPath = path.join(__dirname, '../constants/class10CbsePyqData.ts');

const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

const SUBJECT_META = {
  maths_standard: { name: 'Maths Standard', icon: 'calculator', color: '#2563EB', bg: '#EFF6FF' },
  maths_basic: { name: 'Maths Basic', icon: 'calculator', color: '#0284C7', bg: '#F0F9FF' },
  science: { name: 'Science', icon: 'flask', color: '#059669', bg: '#ECFDF5' },
  social_science: { name: 'Social Science', icon: 'globe', color: '#0D9488', bg: '#F0FDFA' },
  english_language_literature: { name: 'English L&L', icon: 'book', color: '#EA580C', bg: '#FFF7ED' },
  english_communicative: { name: 'English Comm.', icon: 'book', color: '#D97706', bg: '#FFFBEB' },
  hindi_a: { name: 'Hindi A', icon: 'language', color: '#E11D48', bg: '#FFF1F2' },
  hindi_b: { name: 'Hindi B', icon: 'language', color: '#DC2626', bg: '#FEF2F2' },
  sanskrit: { name: 'Sanskrit', icon: 'feather', color: '#7C3AED', bg: '#F5F3FF' },
  information_technology: { name: 'Info Tech (IT)', icon: 'laptop', color: '#4F46E5', bg: '#EEF2FF' },
  computer_applications: { name: 'Computer App.', icon: 'laptop', color: '#6366F1', bg: '#EEF2FF' },
};

const SUBJECT_ORDER = [
  'maths_standard',
  'maths_basic',
  'science',
  'social_science',
  'english_language_literature',
  'english_communicative',
  'hindi_a',
  'hindi_b',
  'sanskrit',
  'information_technology',
  'computer_applications',
];

const result = {};

for (const subKey of SUBJECT_ORDER) {
  const subData = raw.by_subject[subKey];
  if (!subData) continue;

  const meta = SUBJECT_META[subKey] || {
    name: subData.subject_name,
    icon: 'book',
    color: '#2563EB',
    bg: '#EFF6FF',
  };

  const sections = [];
  const years = subData.available_years || Object.keys(subData.years || {}).sort((a, b) => Number(b) - Number(a));

  for (const yr of years) {
    const yrData = subData.years[yr];
    if (!yrData || !yrData.sections) continue;

    const cards = [];
    for (const sec of yrData.sections) {
      const secTitle = sec.section_title || '';
      const isSupp = /supp|compart/i.test(secTitle);
      const isTerm1 = /term[\s-]*1/i.test(secTitle);
      const isTerm2 = /term[\s-]*2/i.test(secTitle);
      const isBoard2 = /board exam\s*-\s*ii/i.test(secTitle);

      for (let i = 0; i < (sec.papers || []).length; i++) {
        const p = sec.papers[i];
        const links = [];

        if (p.question_paper_url) {
          links.push({
            type: 'qp',
            label: yrData.type === 'google_drive_folder' ? 'Open Drive Folder' : 'Question Paper',
            url: p.question_paper_url,
          });
        }

        if (Array.isArray(p.solutions)) {
          for (const sol of p.solutions) {
            if (sol.url && sol.url !== p.question_paper_url) {
              links.push({
                type: 'key',
                label: sol.label || 'Solution',
                url: sol.url,
              });
            }
          }
        }

        if (links.length === 0) continue;

        let tagSuffix = '';
        if (isSupp) tagSuffix = ' • Supplementary';
        else if (isBoard2) tagSuffix = ' • Board Exam II';
        else if (isTerm1) tagSuffix = ' • Term 1';
        else if (isTerm2) tagSuffix = ' • Term 2';

        const cardTitle = p.title + (tagSuffix && !p.title.toLowerCase().includes(tagSuffix.slice(3).toLowerCase()) ? tagSuffix : '');

        cards.push({
          id: `cbse10-${subKey}-${yr}-${cards.length}`,
          year: yr,
          title: cardTitle,
          sectionId: `year-${yr}`,
          links,
        });
      }
    }

    if (cards.length > 0) {
      sections.push({
        id: `year-${yr}`,
        title: `${yr} Board Examinations`,
        cardsCount: cards.length,
        practiceSetsCount: 0,
        cards,
        practiceSets: [],
      });
    }
  }

  result[subKey] = {
    subjectKey: subKey,
    subjectName: meta.name,
    icon: meta.icon,
    color: meta.color,
    bg: meta.bg,
    sections,
  };
}

const fileContent = `/**
 * EduHome Class 10 (CBSE) Previous Year Question Papers & Marking Scheme Solutions (PYQ)
 * Auto-compiled from CBSE Board Exams (2013 - 2026).
 * Verified Google Drive links across 11 subjects.
 */

import { PyqSubject } from './class12PyqData';

export const CLASS_10_CBSE_PYQ_DATA: Record<string, PyqSubject> = ${JSON.stringify(result, null, 2)};

export const CLASS_10_CBSE_SUBJECTS_LIST = Object.values(CLASS_10_CBSE_PYQ_DATA).map((s) => ({
  key: s.subjectKey,
  name: s.subjectName,
  icon: s.icon,
  color: s.color,
  bg: s.bg,
  papersCount: s.sections.reduce((acc, sec) => acc + sec.cardsCount + sec.practiceSetsCount, 0),
}));
`;

fs.writeFileSync(outPath, fileContent, 'utf8');
console.log('Successfully generated:', outPath);
Object.values(result).forEach((s) => {
  const count = s.sections.reduce((acc, sec) => acc + sec.cardsCount, 0);
  console.log(`  ${s.subjectName.padEnd(20)}: ${count} exam cards across ${s.sections.length} years`);
});
