const fs = require('fs');
const transcriptPath = 'C:/Users/madhu/.gemini/antigravity-ide/brain/5b001c79-2e1f-43ea-8e63-d59db5aaea2a/.system_generated/logs/transcript.jsonl';
if (fs.existsSync(transcriptPath)) {
  const content = fs.readFileSync(transcriptPath, 'utf8');
  const matches = [...content.matchAll(/github\.com[^\s"'\\<>]+/g)];
  const urls = [...new Set(matches.map(m => m[0]))];
  console.log('GitHub URLs in transcript:', urls);
} else {
  console.log('No transcript file');
}
