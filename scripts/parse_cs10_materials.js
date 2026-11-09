const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/madhu/code_test/study-materials/cs10';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'kerala-state-class10.html');

console.log('Found', files.length, 'Class 10 subject HTML files');

const subjectsMeta = {
  'maths': { name: 'Mathematics', icon: 'calculator', color: '#2563EB', bg: '#EFF6FF' },
  'physics': { name: 'Physics', icon: 'magnet', color: '#0284C7', bg: '#F0F9FF' },
  'chemistry': { name: 'Chemistry', icon: 'flask', color: '#059669', bg: '#ECFDF5' },
  'biology': { name: 'Biology', icon: 'fitness', color: '#16A34A', bg: '#F0FDF4' },
  'social': { name: 'Social Science', icon: 'globe', color: '#0D9488', bg: '#F0FDFA' },
  'english': { name: 'English', icon: 'book', color: '#EA580C', bg: '#FFF7ED' },
  'malayalam1': { name: 'Malayalam I', icon: 'feather', color: '#DC2626', bg: '#FEF2F2' },
  'malayalam2': { name: 'Malayalam II', icon: 'feather', color: '#B91C1C', bg: '#FEF2F2' },
  'hindi': { name: 'Hindi', icon: 'language', color: '#E11D48', bg: '#FFF1F2' },
  'arabic': { name: 'Arabic', icon: 'moon', color: '#4F46E5', bg: '#EEF2FF' },
  'general': { name: 'All Subjects (Pools)', icon: 'folder', color: '#475569', bg: '#F8FAFC' }
};

function parseSubjectHtml(filePath, subjectKey) {
  const html = fs.readFileSync(filePath, 'utf8');
  
  // Extract sections
  const sections = [];
  const sectionRegex = /<section id="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g;
  let secMatch;

  while ((secMatch = sectionRegex.exec(html)) !== null) {
    const sectionId = secMatch[1];
    const sectionContent = secMatch[2];
    
    // Get section title
    const titleMatch = sectionContent.match(/<h2>(.*?)<\/h2>/);
    const sectionTitle = titleMatch ? titleMatch[1].trim() : sectionId;

    // Get cards in this section
    const cards = [];
    const cardRegex = /<div class="exam-card">([\s\S]*?)<\/div>\s*(?=<div class="exam-card"|<\/div>\s*<\/section>)/g;
    let cardMatch;

    while ((cardMatch = cardRegex.exec(sectionContent)) !== null) {
      const cardContent = cardMatch[1];
      
      // Extract year badge
      const yearMatch = cardContent.match(/<span class="badge badge-year">(.*?)<\/span>/);
      const year = yearMatch ? yearMatch[1].trim() : '';

      // Extract card title
      const titleM = cardContent.match(/<h3 class="card-title">(.*?)<\/h3>/);
      const title = titleM ? titleM[1].trim() : '';

      // Extract buttons / links
      const links = [];
      const linkRegex = /<a href="(https:\/\/drive\.google\.com\/[^"]+)"[^>]*class="btn ([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
      let linkMatch;

      while ((linkMatch = linkRegex.exec(cardContent)) !== null) {
        const url = linkMatch[1];
        const btnClass = linkMatch[2];
        let label = linkMatch[3].replace(/<[^>]+>/g, '').trim();
        
        let type = 'other';
        if (btnClass.includes('btn-qp')) type = 'qp';
        else if (btnClass.includes('btn-key')) type = 'key';

        links.push({
          type,
          label,
          url
        });
      }

      if (title || links.length > 0) {
        cards.push({
          id: `c10-${subjectKey}-${sectionId}-${year}-${cards.length}`,
          year,
          title,
          sectionId,
          links
        });
      }
    }

    // Also look for practice-sets if sectionId is practice-sets
    const practiceSets = [];
    const practiceRegex = /<a href="(https:\/\/drive\.google\.com\/[^"]+)"[^>]*class="practice-set-card"[^>]*>([\s\S]*?)<\/a>/g;
    let pMatch;
    while ((pMatch = practiceRegex.exec(sectionContent)) !== null) {
      const url = pMatch[1];
      const pContent = pMatch[2];
      const labelMatch = pContent.match(/<span class="set-label">(.*?)<\/span>/);
      const subMatch = pContent.match(/<span class="set-sub">(.*?)<\/span>/);
      const label = labelMatch ? labelMatch[1].trim() : 'Practice Set';
      const sub = subMatch ? subMatch[1].trim() : '';
      practiceSets.push({
        label: sub ? `${label} (${sub})` : label,
        url
      });
    }

    if (cards.length > 0 || practiceSets.length > 0) {
      sections.push({
        id: sectionId,
        title: sectionTitle,
        cardsCount: cards.length,
        practiceSetsCount: practiceSets.length,
        cards,
        practiceSets
      });
    }
  }

  const meta = subjectsMeta[subjectKey] || { name: subjectKey, icon: 'book', color: '#0284C7', bg: '#F0F9FF' };

  return {
    subjectKey,
    subjectName: meta.name,
    icon: meta.icon,
    color: meta.color,
    bg: meta.bg,
    sections
  };
}

const allData = {};
for (const f of files) {
  const key = f.replace('kerala-state-class10-', '').replace('.html', '');
  const parsed = parseSubjectHtml(path.join(dir, f), key);
  allData[key] = parsed;
  const totalCards = parsed.sections.reduce((acc, s) => acc + s.cardsCount, 0);
  const totalPractice = parsed.sections.reduce((acc, s) => acc + s.practiceSetsCount, 0);
  const totalLinks = parsed.sections.reduce((acc, s) => acc + s.cards.reduce((cAcc, c) => cAcc + c.links.length, 0) + s.practiceSetsCount, 0);
  console.log(`${parsed.subjectName.padEnd(25)}: ${totalCards} exam cards, ${totalPractice} practice sets, ${totalLinks} drive links`);
}

// Write the compiled dataset to eduhome-app/constants/class10PyqData.ts
const outputPath = 'c:/Users/madhu/eduhome/eduhome-app/constants/class10PyqData.ts';
const fileContent = `/**
 * EduHome Class 10 (SSLC) Previous Year Question Papers & Answer Keys (PYQ)
 * Auto-compiled from Kerala State Board (SSLC) curriculum.
 * Verified Google Drive links for Maths, Physics, Chemistry, Biology, Social Science, etc.
 */

import { PyqSubject } from './class12PyqData';

export const CLASS_10_PYQ_DATA: Record<string, PyqSubject> = ${JSON.stringify(allData, null, 2)};

export const CLASS_10_SUBJECTS_LIST = Object.values(CLASS_10_PYQ_DATA).map((s) => ({
  key: s.subjectKey,
  name: s.subjectName,
  icon: s.icon,
  color: s.color,
  bg: s.bg,
  papersCount: s.sections.reduce((acc, sec) => acc + sec.cardsCount + sec.practiceSetsCount, 0),
}));
`;

fs.writeFileSync(outputPath, fileContent, 'utf8');
console.log('Successfully written to', outputPath);
