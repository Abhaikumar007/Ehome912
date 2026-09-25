const fs = require('fs');
const path = require('path');

const inputData = [
  {"roll_no":"2024-JEE-0842","name":"Arjun S","class_name":"Class 12","school":"EduHome Campus","joining_date_formatted":"15 Jan 2026","joining_date_iso":"2026-01-15","monthly_fee":4000,"phone":"9876543210","subjects":"Physics, Chemistry, Maths"},
  {"roll_no":"EDU-2026-001","name":"Amaljith","class_name":"Class 10","school":"Vendar","joining_date_formatted":"18 Apr 2026","joining_date_iso":"2026-04-18","monthly_fee":3000,"phone":"919895423986","subjects":"Physics, Maths, Biology"},
  {"roll_no":"EDU-2026-002","name":"Karthik","class_name":"Class 11","school":"Boys","joining_date_formatted":"06 Jul 2026","joining_date_iso":"2026-07-06","monthly_fee":2500,"phone":"919961796378","subjects":"Physics, Maths"},
  {"roll_no":"EDU-2026-003","name":"Sivanya","class_name":"Class 11","school":"Boys","joining_date_formatted":"01 May 2026","joining_date_iso":"2026-05-01","monthly_fee":4500,"phone":"918848157457","subjects":"Physics, Chemistry, Maths, Biology"},
  {"roll_no":"EDU-2026-004","name":"Abhinanda","class_name":"Class 9","school":"Vendar","joining_date_formatted":"01 May 2026","joining_date_iso":"2026-05-01","monthly_fee":2000,"phone":"919895446203","subjects":"Physics, Chemistry, Maths, Biology"},
  {"roll_no":"EDU-2026-005","name":"Krishnaveni","class_name":"Class 8","school":"Puthoor","joining_date_formatted":"04 May 2026","joining_date_iso":"2026-05-04","monthly_fee":750,"phone":"9544443618","subjects":"Maths"},
  {"roll_no":"EDU-2026-006","name":"Meerakrishnan","class_name":"Class 7","school":"Marthoma","joining_date_formatted":"23 May 2026","joining_date_iso":"2026-05-23","monthly_fee":600,"phone":"8089939249","subjects":"Maths"},
  {"roll_no":"EDU-2026-007","name":"Niranjana","class_name":"Class 12","school":"Divine","joining_date_formatted":"23 May 2026","joining_date_iso":"2026-05-23","monthly_fee":1000,"phone":"7025747029","subjects":"Physics"},
  {"roll_no":"EDU-2026-008","name":"Vaiga","class_name":"Class 8","school":"Marthoma","joining_date_formatted":"23 May 2026","joining_date_iso":"2026-05-23","monthly_fee":1500,"phone":"9446614427","subjects":"Physics, Chemistry, Maths, Biology"},
  {"roll_no":"EDU-2026-009","name":"Sari N Raj","class_name":"Class 12","school":"Boys VHSE","joining_date_formatted":"24 May 2026","joining_date_iso":"2026-05-24","monthly_fee":3500,"phone":"9746865309","subjects":"Physics, Chemistry, Biology"},
  {"roll_no":"EDU-2026-010","name":"Aromal","class_name":"Class 8","school":"Technical Scool","joining_date_formatted":"08 Apr 2026","joining_date_iso":"2026-04-08","monthly_fee":1500,"phone":"9745777289","subjects":"Physics, Chemistry, Maths"},
  {"roll_no":"EDU-2026-011","name":"Vaishnavi","class_name":"Class 8","school":"Siddhartha","joining_date_formatted":"05 Apr 2026","joining_date_iso":"2026-04-05","monthly_fee":1500,"phone":"7558859373","subjects":"Physics, Chemistry, Maths, Biology"},
  {"roll_no":"EDU-2026-012","name":"Avani","class_name":"Class 9","school":"Puthoor","joining_date_formatted":"06 Apr 2026","joining_date_iso":"2026-04-06","monthly_fee":1000,"phone":"8921856088","subjects":"Maths"},
  {"roll_no":"EDU-2026-013","name":"Nakshathra","class_name":"Class 9","school":"Marthoma","joining_date_formatted":"06 Apr 2026","joining_date_iso":"2026-04-06","monthly_fee":2000,"phone":"9633076463","subjects":"Physics, Chemistry, Maths, Biology"},
  {"roll_no":"EDU-2026-014","name":"Asna","class_name":"Class 10","school":"Marthoma","joining_date_formatted":"06 Apr 2026","joining_date_iso":"2026-04-06","monthly_fee":2000,"phone":"9446253365","subjects":"Physics, Maths"},
  {"roll_no":"EDU-2026-015","name":"Sivani","class_name":"Class 12","school":"Vendar","joining_date_formatted":"13 Apr 2026","joining_date_iso":"2026-04-13","monthly_fee":4500,"phone":"8590976055","subjects":"Physics, Chemistry, Maths, Computer Science"},
  {"roll_no":"EDU-2026-016","name":"Nandana","class_name":"Class 12","school":"MIBS","joining_date_formatted":"08 Apr 2026","joining_date_iso":"2026-04-08","monthly_fee":2500,"phone":"7736592931","subjects":"Physics, Maths"},
  {"roll_no":"EDU-2026-017","name":"Karun","class_name":"Class 12","school":"Divine","joining_date_formatted":"04 Apr 2026","joining_date_iso":"2026-04-04","monthly_fee":2500,"phone":"918089978209","subjects":"Physics, Maths"},
  {"roll_no":"EDU-2026-018","name":"Aadidev","class_name":"Class 12","school":"Divine","joining_date_formatted":"04 Apr 2026","joining_date_iso":"2026-04-04","monthly_fee":2500,"phone":"9446258069","subjects":"Physics, Maths"},
  {"roll_no":"EDU-2026-019","name":"Abhinand","class_name":"Class 12","school":"Vendar","joining_date_formatted":"08 Apr 2026","joining_date_iso":"2026-04-08","monthly_fee":3500,"phone":"7012451748","subjects":"Physics, Chemistry, Maths"},
  {"roll_no":"EDU-2026-020","name":"Poojitha","class_name":"Class 7","school":"Kottathala UP School","joining_date_formatted":"04 May 2026","joining_date_iso":"2026-05-04","monthly_fee":600,"phone":"8157933242","subjects":"Maths"},
  {"roll_no":"EDU-2026-021","name":"Irfan","class_name":"Class 12","school":"Vendar","joining_date_formatted":"14 May 2026","joining_date_iso":"2026-05-14","monthly_fee":3500,"phone":"9567187275","subjects":"Physics, Maths, Computer Science"},
  {"roll_no":"EDU-2026-022","name":"Karthik Nath","class_name":"Class 9","school":"CBSE","joining_date_formatted":"03 Apr 2026","joining_date_iso":"2026-04-03","monthly_fee":2000,"phone":"9847270637","subjects":"Physics, Maths"},
  {"roll_no":"EDU-2026-023","name":"Vishwathej","class_name":"Class 12","school":"SG","joining_date_formatted":"01 Jan 2026","joining_date_iso":"2026-01-01","monthly_fee":4500,"phone":"9961803001","subjects":"Physics, Chemistry, Maths, Biology"},
  {"roll_no":"EDU-2026-024","name":"Ganga","class_name":"Class 10","school":"Divine","joining_date_formatted":"09 Mar 2026","joining_date_iso":"2026-03-09","monthly_fee":3000,"phone":"8547495160","subjects":"Physics, Chemistry, Maths, Biology"},
  {"roll_no":"EDU-2026-025","name":"Adithya Krishnan","class_name":"Class 9","school":"MGM","joining_date_formatted":"31 May 2026","joining_date_iso":"2026-05-31","monthly_fee":2000,"phone":"918129754629","subjects":"Physics, Chemistry, Maths, Biology"},
  {"roll_no":"EDU-2026-026","name":"Alecia Mathew","class_name":"Class 10","school":"Divine","joining_date_formatted":"13 Mar 2026","joining_date_iso":"2026-03-13","monthly_fee":3000,"phone":"9650974040","subjects":"Physics, Chemistry, Maths, Biology"},
  {"roll_no":"EDU-2026-027","name":"Krishnanandh","class_name":"Class 9","school":"Siddhartha","joining_date_formatted":"08 Jun 2026","joining_date_iso":"2026-06-08","monthly_fee":2000,"phone":"9495195776","subjects":"Physics, Chemistry, Maths"},
  {"roll_no":"EDU-2026-028","name":"Ashwanath","class_name":"Class 8","school":"Puthoor","joining_date_formatted":"05 Apr 2026","joining_date_iso":"2026-04-05","monthly_fee":1500,"phone":"9544477117","subjects":"Physics, Chemistry, Maths, Biology"},
  {"roll_no":"EDU-2026-029","name":"Niranjan","class_name":"Class 12","school":"SG","joining_date_formatted":"28 Apr 2026","joining_date_iso":"2026-04-28","monthly_fee":4500,"phone":"919567026060","subjects":"Physics, Chemistry, Maths, Biology"},
  {"roll_no":"EDU-2026-030","name":"Lekshmipriya","class_name":"Class 9","school":"Marthoma","joining_date_formatted":"07 May 2026","joining_date_iso":"2026-05-07","monthly_fee":2000,"phone":"918921477592","subjects":"Physics, Chemistry, Maths, Biology"},
  {"roll_no":"EDU-2026-031","name":"Achyuth","class_name":"Class 9","school":"Divine","joining_date_formatted":"06 Jun 2026","joining_date_iso":"2026-06-06","monthly_fee":1000,"phone":"919562902227","subjects":"Physics"},
  {"roll_no":"EDU-2026-032","name":"Hiba","class_name":"Class 11","school":"Brm","joining_date_formatted":"22 Jun 2026","joining_date_iso":"2026-06-22","monthly_fee":2500,"phone":"919072435565","subjects":"Physics, Maths"},
  {"roll_no":"EDU-2026-033","name":"Gowtham","class_name":"Class 9","school":"Sree Sree","joining_date_formatted":"01 Jul 2026","joining_date_iso":"2026-07-01","monthly_fee":2000,"phone":"9447063343","subjects":"Physics, Chemistry, Maths, Biology"},
  {"roll_no":"EDU-2026-034","name":"Vyshnavi","class_name":"Class 12","school":"Divine","joining_date_formatted":"11 Jul 2026","joining_date_iso":"2026-07-11","monthly_fee":1000,"phone":"9562820950","subjects":"Physics"},
  {"roll_no":"EDU-2026-035","name":"Gopika","class_name":"Class 8","school":"Divine","joining_date_formatted":"15 Jul 2026","joining_date_iso":"2026-07-15","monthly_fee":1000,"phone":"9947540424","subjects":"Maths"},
  {"roll_no":"EDU-2026-036","name":"Cristine","class_name":"Class 10","school":"Divine cbse","joining_date_formatted":"04 Sep 2026","joining_date_iso":"2026-09-04","monthly_fee":3000,"phone":"9446118812","subjects":"Physics, Chemistry, Maths, Biology"},
  {"roll_no":"EDU-2026-037","name":"Roshan","class_name":"Class 12","school":"Divine","joining_date_formatted":"10 Sep 2026","joining_date_iso":"2026-09-10","monthly_fee":3500,"phone":"8921159422","subjects":"Physics, Chemistry, Maths"},
  {"roll_no":"EDU-2026-038","name":"Fathima","class_name":"Class 12","school":"Svmmhss","joining_date_formatted":"02 Sep 2026","joining_date_iso":"2026-09-02","monthly_fee":2000,"phone":"7034492498","subjects":"Physics, Biology"},
  {"roll_no":"EDU-2026-039","name":"Hajira","class_name":"Class 12","school":"Svmmhss","joining_date_formatted":"02 Sep 2026","joining_date_iso":"2026-09-02","monthly_fee":2500,"phone":"9747841626","subjects":"Physics, Maths"},
  {"roll_no":"EDU-2026-040","name":"Keerthana","class_name":"Class 11","school":"Svmmhss","joining_date_formatted":"08 Aug 2026","joining_date_iso":"2026-08-08","monthly_fee":2000,"phone":"9656839908","subjects":"Physics, Chemistry"},
  {"roll_no":"EDU-2026-041","name":"Karthika","class_name":"Class 12","school":"Vendar","joining_date_formatted":"03 Aug 2026","joining_date_iso":"2026-08-03","monthly_fee":2500,"phone":"9656839908","subjects":"Chemistry, Maths"},
  {"roll_no":"EDU-2026-042","name":"Dwaitha","class_name":"Class 11","school":"MGM mylam","joining_date_formatted":"08 Aug 2026","joining_date_iso":"2026-08-08","monthly_fee":3000,"phone":"6238332685","subjects":"Physics, Chemistry, Biology"},
  {"roll_no":"EDU-2026-043","name":"Adarsh","class_name":"Class 12","school":"Vendar","joining_date_formatted":"08 Aug 2026","joining_date_iso":"2026-08-08","monthly_fee":2000,"phone":"9544166131","subjects":"Physics, Chemistry"},
  {"roll_no":"EDU-2026-044","name":"Sreedev","class_name":"Class 12","school":"Vendar","joining_date_formatted":"08 Aug 2026","joining_date_iso":"2026-08-08","monthly_fee":3000,"phone":"9744795650","subjects":"Physics, Chemistry, Biology"},
  {"roll_no":"EDU-2026-045","name":"Dharmic Krishna","class_name":"Class 10","school":"Puthoor","joining_date_formatted":"04 Sep 2026","joining_date_iso":"2026-09-04","monthly_fee":3000,"phone":"8547534316","subjects":"Physics, Chemistry, Maths, Biology"},
  {"roll_no":"EDU-2026-046","name":"Amrutha","class_name":"Class 12","school":"Puthoor","joining_date_formatted":"09 Sep 2026","joining_date_iso":"2026-09-09","monthly_fee":1500,"phone":"6282355118","subjects":"Maths"},
  {"roll_no":"EDU-2026-047","name":"Punya.r","class_name":"Class 11","school":"EVHS Neduvathoor","joining_date_formatted":"11 Sep 2026","joining_date_iso":"2026-09-11","monthly_fee":4500,"phone":"8593078422","subjects":"Physics, Chemistry, Maths, Biology"},
  {"roll_no":"EDU-2026-048","name":"Sreehari","class_name":"Class 10","school":"Divine School Puthoor","joining_date_formatted":"12 Sep 2026","joining_date_iso":"2026-09-12","monthly_fee":1000,"phone":"9539122202","subjects":"Physics"},
  {"roll_no":"EDU-2026-049","name":"Sivananda","class_name":"Class 6","school":"MTGHS","joining_date_formatted":"01 Jun 2026","joining_date_iso":"2026-06-01","monthly_fee":1000,"phone":"5555555555","subjects":"Physics, Chemistry, Maths, Biology"}
];

// Reference date is 20 Sep 2026
const TODAY = new Date(2026, 8, 20); // 0-indexed: month 8 = September

function computeDue(joiningDateIso, joiningDateFormatted) {
  const parts = joiningDateIso.split('-');
  const jYear = parseInt(parts[0], 10);
  const jMonth = parseInt(parts[1], 10) - 1; // 0-indexed
  const jDay = parseInt(parts[2], 10);

  // If student joined in Sep 2026, their next fee is in October 2026 on jDay
  // Otherwise, their recurring fee for this month is in Sep 2026 on jDay
  let dueYear = 2026;
  let dueMonth = 8; // September
  let dueDay = jDay;

  if (jYear === 2026 && jMonth === 8) {
    // Joined in Sep 2026 -> next monthly fee due in Oct
    dueMonth = 9; // October
  }

  const targetDate = new Date(dueYear, dueMonth, dueDay);
  const diffDays = Math.round((targetDate.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
  const monthShort = targetDate.toLocaleString('en-US', { month: 'short' });
  const dayStr = String(dueDay).padStart(2, '0');
  const dueDateStr = `${dayStr} ${monthShort} ${dueYear}`;

  return {
    dueDate: dueDateStr,
    daysLeft: diffDays,
    dueDay: dueDay,
  };
}

const processed = inputData.map((s) => {
  const due = computeDue(s.joining_date_iso, s.joining_date_formatted);
  return {
    ...s,
    due_date: due.dueDate,
    days_left: due.daysLeft,
    due_day: due.dueDay,
  };
});

fs.writeFileSync(path.join(__dirname, 'processed_students.json'), JSON.stringify(processed, null, 2));
console.log('Saved', processed.length, 'students with exact calculated due dates and days left.');
