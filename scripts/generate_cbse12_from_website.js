const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://myeduhome.netlify.app/study-materials/cbse12';

const SUBJECTS = [
  { slug: 'cbse-class12-mathematics', key: 'mathematics', name: 'Mathematics', icon: 'calculator', color: '#2563EB', bg: '#EFF6FF' },
  { slug: 'cbse-class12-physics', key: 'physics', name: 'Physics', icon: 'magnet', color: '#7C3AED', bg: '#F5F3FF' },
  { slug: 'cbse-class12-chemistry', key: 'chemistry', name: 'Chemistry', icon: 'flask', color: '#059669', bg: '#ECFDF5' },
  { slug: 'cbse-class12-biology', key: 'biology', name: 'Biology', icon: 'fitness', color: '#16A34A', bg: '#F0FDF4' },
  { slug: 'cbse-class12-english-core', key: 'english_core', name: 'English Core', icon: 'book', color: '#EA580C', bg: '#FFF7ED' },
  { slug: 'cbse-class12-accountancy', key: 'accountancy', name: 'Accountancy', icon: 'bar-chart', color: '#0284C7', bg: '#F0F9FF' },
  { slug: 'cbse-class12-business-studies', key: 'business_studies', name: 'Business Studies', icon: 'business', color: '#0D9488', bg: '#F0FDFA' },
  { slug: 'cbse-class12-economics', key: 'economics', name: 'Economics', icon: 'bar-chart', color: '#D97706', bg: '#FFFBEB' },
  { slug: 'cbse-class12-applied-maths', key: 'applied_maths', name: 'Applied Maths', icon: 'calculator', color: '#4F46E5', bg: '#EEF2FF' },
  { slug: 'cbse-class12-hindi-core', key: 'hindi_core', name: 'Hindi Core', icon: 'language', color: '#E11D48', bg: '#FFF1F2' },
  { slug: 'cbse-class12-psychology', key: 'psychology', name: 'Psychology', icon: 'book', color: '#9333EA', bg: '#FAF5FF' },
  { slug: 'cbse-class12-physical-education', key: 'physical_education', name: 'Physical Edu.', icon: 'fitness', color: '#0891B2', bg: '#ECFEFF' },
  { slug: 'cbse-class12-history', key: 'history', name: 'History', icon: 'globe', color: '#B45309', bg: '#FFFBEB' },
  { slug: 'cbse-class12-geography', key: 'geography', name: 'Geography', icon: 'globe', color: '#15803D', bg: '#F0FDF4' },
  { slug: 'cbse-class12-political-science', key: 'political_science', name: 'Political Sci.', icon: 'globe', color: '#DC2626', bg: '#FEF2F2' },
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

function parseSubjectHtml(html, sub) {
  const sections = [];
  const yearSectionRegex = /<section[^>]*id="year-(\d{4})"[^>]*>([\s\S]*?)(?=<section[^>]*id="year-\d{4}"|<\/main>|<footer|$)/gi;
  let secMatch;

  while ((secMatch = yearSectionRegex.exec(html)) !== null) {
    const yr = secMatch[1];
    const secBody = secMatch[2];

    const subGroupRegex = /<div class="subsection-group">([\s\S]*?)(?=<div class="subsection-group">|$)/gi;
    const subGroups = [];
    let sgMatch;
    while ((sgMatch = subGroupRegex.exec(secBody)) !== null) {
      subGroups.push(sgMatch[1]);
    }
    const blocks = subGroups.length > 0 ? subGroups : [secBody];

    const cards = [];
    for (const block of blocks) {
      const headingMatch = block.match(/<h3 class="subsection-heading"[^>]*>([\s\S]*?)<\/h3>/i);
      const headingText = headingMatch ? stripTags(headingMatch[1]) : '';
      const isSupp = /supp|compart/i.test(headingText);
      const isTerm1 = /term[\s-]*1/i.test(headingText);
      const isTerm2 = /term[\s-]*2/i.test(headingText);

      const cardParts = block.split('<div class="exam-card">').slice(1);
      for (const cardHtml of cardParts) {
        const yearBadgeMatch = cardHtml.match(/<span class="badge badge-year">([^<]+)<\/span>/i);
        const cardYear = yearBadgeMatch ? stripTags(yearBadgeMatch[1]) : yr;

        const titleMatch = cardHtml.match(/<h3 class="card-title">([\s\S]*?)<\/h3>/i);
        let title = titleMatch ? stripTags(titleMatch[1]) : `${yr} Paper`;

        if (isSupp && !/supp|compart/i.test(title)) {
          title = `[Supplementary] ${title}`;
        } else if (isTerm1 && !/term/i.test(title)) {
          title = `[Term 1] ${title}`;
        } else if (isTerm2 && !/term/i.test(title)) {
          title = `[Term 2] ${title}`;
        }

        const links = [];
        const linkRegex = /<a\s+[^>]*href="([^"]+)"[^>]*class="btn\s+([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        let lMatch;
        while ((lMatch = linkRegex.exec(cardHtml)) !== null) {
          const url = decodeHtml(lMatch[1]);
          const cls = lMatch[2];
          const label = stripTags(lMatch[3]) || (cls.includes('btn-key') ? 'Solution' : 'Question Paper');
          const type = cls.includes('btn-key') ? 'key' : cls.includes('btn-qp') ? 'qp' : 'other';
          links.push({ type, label, url });
        }

        if (links.length > 0) {
          cards.push({
            id: `${sub.key}-year-${yr}-${cards.length}`,
            year: cardYear,
            title,
            sectionId: `year-${yr}`,
            links,
          });
        }
      }
    }

    if (cards.length > 0) {
      sections.push({
        id: `year-${yr}`,
        title: `CBSE Board Exam ${yr}`,
        cardsCount: cards.length,
        practiceSetsCount: 0,
        cards,
        practiceSets: [],
      });
    }
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
        console.log(`Parsed ${sub.name}: ${totalCards} cards across ${sections.length} years`);

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

  // Build subjectsList in deterministic SUBJECTS order
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
 * EduHome Class 12 (CBSE Board) Previous Year Question Papers & Marking Scheme Solutions (2013–2026)
 * Auto-generated from EduHome website CBSE Class 12 archive.
 */
import type { PyqSubject } from './class12PyqData';

export const CLASS_12_CBSE_PYQ_DATA: Record<string, PyqSubject> = ${JSON.stringify(result, null, 2)};

export const CLASS_12_CBSE_SUBJECTS_LIST = ${JSON.stringify(subjectsList, null, 2)};
`;

  const outPath = path.join(__dirname, '../constants/class12CbsePyqData.ts');
  fs.writeFileSync(outPath, header, 'utf8');
  console.log('Generated:', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
