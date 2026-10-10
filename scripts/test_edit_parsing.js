const fs = require('fs');

const js = fs.readFileSync('C:/Users/madhu/code_test/private/js/master_hub.js', 'utf8');

// Test parsing logic from openEditAnnouncementModal on the real announcement
const item = {
  "id": "56bb4536-67cd-4f26-b16e-1e5dc7666c0e",
  "title": "Hello rintu",
  "description": "Helloooooo",
  "icon": "megaphone",
  "icon_bg": "#FEF3F2",
  "icon_color": "#F04438",
  "time_label": "Just now",
  "important": false,
  "created_at": "2026-10-09T11:53:42.545956+00:00"
};

try {
    const rawTitle = item.title || '';
    const desc = item.description || '';

    function toIso(dateInput) {
        if (!dateInput) return '';
        const clean = String(dateInput).trim();
        const isoM = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (isoM) {
            return isoM[1] + '-' + isoM[2].padStart(2, '0') + '-' + isoM[3].padStart(2, '0');
        }
        const d = new Date(clean);
        if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return y + '-' + m + '-' + day;
        }
        return '';
    }

    let type = 'notice';
    const isExam = /exam|test|unit\s*test|paper/i.test(rawTitle)
        || /exam\s*date|max\s*marks|syllabus/i.test(desc)
        || item.icon === 'calendar';
    if (isExam) type = 'exam';
    else if (item.important || /urgent/i.test(rawTitle)) type = 'urgent';
    else if (item.icon === 'calendar' || /holiday/i.test(rawTitle)) type = 'holiday';
    else if (item.icon === 'trophy' || /event/i.test(rawTitle)) type = 'event';

    let targetClass = 'All';
    const clsMatch = rawTitle.match(/\[(Class\s*\d{1,2}(?:-[A-Za-z0-9]+)?|All Classes)\]/i)
        || rawTitle.match(/\[Exam Alert\s*-\s*(Class\s*\d{1,2})\]/i)
        || desc.match(/(?:Class|Grade):\s*([^\n\r|,]+)/i);
    if (clsMatch) {
        targetClass = clsMatch[1].trim();
        if (targetClass === 'All Classes') targetClass = 'All';
    }

    let syllabusStream = 'Both';
    const sylStreamMatch = rawTitle.match(/\[(State Syllabus|CBSE|Both)\]/i)
        || desc.match(/(?:Syllabus Stream|Stream):\s*(State Syllabus|CBSE|Both)/i);
    if (sylStreamMatch) {
        syllabusStream = sylStreamMatch[1];
    } else if (/State Syllabus/i.test(desc) && !desc.match(/Syllabus:\s*(?!State Syllabus)/i)) {
        syllabusStream = 'State Syllabus';
    } else if (/CBSE/i.test(desc) && !desc.match(/Syllabus:\s*(?!CBSE)/i)) {
        syllabusStream = 'CBSE';
    }

    let subject = '';
    const subMatch = rawTitle.match(/\(([^)]+)\)$/)
        || desc.match(/Subject:\s*([^\n\r|]+)/i);
    if (subMatch) {
        subject = subMatch[1].trim();
    }

    let cleanTitle = rawTitle
        .replace(/\[PENDING APPROVAL[^\]]*\]/gi, '')
        .replace(/\[Exam Alert[^\]]*\]/gi, '')
        .replace(/\[Test Alert\]/gi, '')
        .replace(/\[Class\s*[^\]]+\]/gi, '')
        .replace(/\[State Syllabus\]/gi, '')
        .replace(/\[CBSE\]/gi, '')
        .replace(/\[Both\]/gi, '')
        .replace(/\[REJECTED[^\]]*\]/gi, '')
        .trim();

    console.log('Parsed successfully:', { type, targetClass, syllabusStream, subject, cleanTitle });
} catch (e) {
    console.error('Parsing threw error:', e);
}
