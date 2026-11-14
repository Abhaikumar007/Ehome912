const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://myeduhome.netlify.app/study-materials/cs11';

const SUBJECTS = [
  { slug: 'kerala-state-class11-maths', key: 'maths', name: 'Mathematics', icon: 'calculator', color: '#2563EB', bg: '#EFF6FF' },
  { slug: 'kerala-state-class11-physics', key: 'physics', name: 'Physics', icon: 'magnet', color: '#7C3AED', bg: '#F5F3FF' },
  { slug: 'kerala-state-class11-chemistry', key: 'chemistry', name: 'Chemistry', icon: 'flask', color: '#059669', bg: '#ECFDF5' },
  { slug: 'kerala-state-class11-biology', key: 'biology', name: 'Biology', icon: 'fitness', color: '#16A34A', bg: '#F0FDF4' },
  { slug: 'kerala-state-class11-computer', key: 'computer', name: 'Computer Sci.', icon: 'laptop', color: '#4F46E5', bg: '#EEF2FF' },
  { slug: 'kerala-state-class11-commerce', key: 'commerce', name: 'Commerce', icon: 'business', color: '#0284C7', bg: '#F0F9FF' },
  { slug: 'kerala-state-class11-humanities', key: 'humanities', name: 'Humanities', icon: 'globe', color: '#0D9488', bg: '#F0FDFA' },
  { slug: 'kerala-state-class11-social', key: 'social', name: 'Social Sci.', icon: 'globe', color: '#D97706', bg: '#FFFBEB' },
  { slug: 'kerala-state-class11-english', key: 'english', name: 'English', icon: 'book', color: '#EA580C', bg: '#FFF7ED' },
  { slug: 'kerala-state-class11-malayalam1', key: 'malayalam1', name: 'Malayalam', icon: 'language', color: '#E11D48', bg: '#FFF1F2' },
  { slug: 'kerala-state-class11-hindi', key: 'hindi', name: 'Hindi', icon: 'language', color: '#DC2626', bg: '#FEF2F2' },
  { slug: 'kerala-state-class11-arabic', key: 'arabic', name: 'Arabic', icon: 'moon', color: '#4F46E5', bg: '#EEF2FF' },
  { slug: 'kerala-state-class11-general', key: 'general', name: 'General', icon: 'folder', color: '#64748B', bg: '#F1F5F9' },
  { slug: 'kerala-state-class11-other', key: 'other', name: 'Other Subjects', icon: 'folder', color: '#475569', bg: '#F1F5F9' },
];

const SECTION_DEFS = [
  { id: 'board-exams', title: 'Board & Annual Examinations' },
  { id: 'model-exams', title: 'Model Examinations' },
  { id: 'terminal-exams', title: 'Terminal / Onam / Christmas Exams' },
  { id: 'practice-sets', title: 'Question Banks, Notes & Other Papers' },
];

function decodeHtml(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(str) {
  return decodeHtml(str.replace(/<[^>]+>/g, ' '));
}

function mapCategory(codeText) {
  const c = codeText.toLowerCase();
  if (c.includes('annual') || c.includes('board') || c.includes('improvement') || c.includes('say')) {
    return 'board-exams';
  }
  if (c.includes('model')) {
    return 'model-exams';
  }
  if (c.includes('term') || c.includes('onam') || c.includes('christmas')) {
    return 'terminal-exams';
  }
  return 'practice-sets';
}

function parseSubjectHtml(html, sub) {
  const buckets = {
    'board-exams': [],
    'model-exams': [],
    'terminal-exams': [],
    'practice-sets': [],
  };

  const cardParts = html.split('<div class="exam-card">').slice(1);
  for (const cardHtml of cardParts) {
    const yearMatch = cardHtml.match(/<span class="badge badge-year">([^<]+)<\/span>/i);
    const year = yearMatch ? stripTags(yearMatch[1]) : 'Other';

    const codeMatch = cardHtml.match(/<span class="badge badge-code">([^<]+)<\/span>/i);
    const codeText = codeMatch ? stripTags(codeMatch[1]) : '';
    const sectionId = mapCategory(codeText);

    const titleMatch = cardHtml.match(/<h4 class="card-title">([\s\S]*?)<\/h4>/i)
      || cardHtml.match(/<h3 class="card-title">([\s\S]*?)<\/h3>/i);
    let title = titleMatch ? stripTags(titleMatch[1]) : `${sub.name} ${year}`;
    if (codeText.toLowerCase().includes('improvement') && !/improv|say/i.test(title)) {
      title = `[Improvement / SAY] ${title}`;
    }

    const links = [];
    const linkRegex = /<a\s+[^>]*href="([^"]+)"[^>]*class="btn\s+([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let lMatch;
    while ((lMatch = linkRegex.exec(cardHtml)) !== null) {
      const url = decodeHtml(lMatch[1]);
      const cls = lMatch[2];
      let label = stripTags(lMatch[3]);
      if (label.length > 45) {
        label = label.slice(0, 42).trim() + '...';
      }
      if (!label) {
        label = cls.includes('btn-key') ? 'Answer Key' : 'Question Paper';
      }
      const type = cls.includes('btn-key') ? 'key' : cls.includes('btn-qp') ? 'qp' : 'other';
      links.push({ type, label, url });
    }

    if (links.length > 0) {
      buckets[sectionId].push({
        id: `${sub.key}-${sectionId}-${year}-${buckets[sectionId].length}`,
        year,
        title,
        sectionId,
        links,
      });
    }
  }

  const sections = [];
  for (const def of SECTION_DEFS) {
    const cards = buckets[def.id];
    if (cards.length === 0) continue;
    cards.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    sections.push({
      id: def.id,
      title: def.title,
      cardsCount: cards.length,
      practiceSetsCount: 0,
      cards,
      practiceSets: [],
    });
  }

  return sections;
}

async function main() {
  const result = {};
  const subjectsList = [];

  for (let i = 0; i < SUBJECTS.length; i += 5) {
    const batch = SUBJECTS.slice(i, i + 5);
    await Promise.all(
      batch.map(async (sub) => {
        const url = `${BASE_URL}/${sub.slug}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to fetch ${url}: ${res.status}`);
        }
        const html = await res.text();
        const sections = parseSubjectHtml(html, sub);
        const totalCards = sections.reduce((acc, s) => acc + s.cardsCount, 0);
        console.log(`Parsed ${sub.name}: ${totalCards} cards across ${sections.length} categories`);

        result[sub.key] = {
          subjectKey: sub.key,
          subjectName: sub.name,
          icon: sub.icon,
          color: sub.color,
          bg: sub.bg,
          sections,
        };
      })
    );
  }

  for (const sub of SUBJECTS) {
    const data = result[sub.key];
    if (!data || data.sections.length === 0) continue;
    const papersCount = data.sections.reduce((acc, s) => acc + s.cardsCount, 0);
    subjectsList.push({
      key: sub.key,
      name: sub.name,
      icon: sub.icon,
      color: sub.color,
      bg: sub.bg,
      papersCount,
    });
  }

  const header = `/**
 * EduHome Class 11 (Plus One - Kerala State DHSE) Previous Year Question Papers & Answer Keys
 * Auto-generated from EduHome website Class 11 archive.
 */
import type { PyqSubject } from './class12PyqData';

export const CLASS_11_PYQ_DATA: Record<string, PyqSubject> = ${JSON.stringify(result, null, 2)};

export const CLASS_11_SUBJECTS_LIST = ${JSON.stringify(subjectsList, null, 2)};
`;

  const outPath = path.join(__dirname, '../constants/class11PyqData.ts');
  fs.writeFileSync(outPath, header, 'utf8');
  console.log('Generated:', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

