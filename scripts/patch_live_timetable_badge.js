const fs = require('fs');
let js = fs.readFileSync('C:/Users/madhu/code_test/private/js/live_timetable.js', 'utf8');

const targetStr = "${meta.emoji} ${item.subject || 'General'}\n                                            </span>";
if (js.includes(targetStr)) {
  const replacement = `\${meta.emoji} \${item.subject || 'General'}
                                            </span>
                                            \${(() => {
                                                const nStat = (item.status || '').toLowerCase();
                                                const nTime = (item.time || '').toLowerCase();
                                                if (nStat.includes('tp') || nStat.includes('test') || nTime.includes('test paper') || nTime.includes('• tp')) {
                                                    return '<span class="badge badge-danger ml-1" style="font-size:0.72rem; font-weight:600;"><i class="fas fa-file-alt mr-1"></i>Test Paper</span>';
                                                } else if (nStat.includes('question') || nStat.includes('qb') || nTime.includes('question bank') || nTime.includes('• qb')) {
                                                    return '<span class="badge ml-1 text-white" style="font-size:0.72rem; font-weight:600; background:#7c3aed;"><i class="fas fa-book-open mr-1"></i>Question Bank</span>';
                                                } else {
                                                    return '<span class="badge badge-light border ml-1 text-muted" style="font-size:0.72rem; font-weight:600;">📖 Regular</span>';
                                                }
                                            })()}`;
  js = js.replace(targetStr, replacement);
  fs.writeFileSync('C:/Users/madhu/code_test/private/js/live_timetable.js', js, 'utf8');
  console.log('✓ Successfully patched session badges in live_timetable.js table');
} else {
  console.log('Target string not found');
}
