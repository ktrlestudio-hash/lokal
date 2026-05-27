import { readFileSync, writeFileSync, createReadStream } from 'fs';
import { createInterface } from 'readline';
import { execSync } from 'child_process';

const JSONL = 'C:/Users/katry/.claude/projects/e--Katriel-Pc-WEB-2026-ecosistema-LOKAL-LOKAL/cb51b7e4-7b98-42a3-8f80-8c76a0a9320b.jsonl';

const edits = [];
const rl = createInterface({ input: createReadStream(JSONL, { encoding: 'utf8' }), crlfDelay: Infinity });

let idx = 0;
for await (const line of rl) {
  if (line.includes('App.jsx') && line.length > 200) {
    try {
      const obj = JSON.parse(line);
      const r = obj?.toolUseResult;
      if (r?.filePath?.includes('App.jsx') && r.newString != null) {
        edits.push({ idx, oldString: r.oldString || '', newString: r.newString, replaceAll: !!r.replaceAll });
      }
    } catch {}
  }
  idx++;
}

edits.sort((a, b) => a.idx - b.idx);
console.log(`Edits found: ${edits.length}`);

// Start from git version
const gitContent = execSync('git show HEAD:src/App.jsx', {
  cwd: 'e:\\Katriel Pc\\WEB\\2026\\ecosistema LOKAL\\LOKAL'
}).toString();

let content = gitContent;
let applied = 0, skipped = 0;

for (const edit of edits) {
  const { oldString, newString, replaceAll } = edit;
  if (!oldString) { skipped++; continue; }
  if (content.includes(oldString)) {
    content = replaceAll ? content.split(oldString).join(newString) : content.replace(oldString, newString);
    applied++;
  } else {
    skipped++;
  }
}

const lines = content.split('\n').length;
console.log(`Applied: ${applied}, Skipped: ${skipped}`);
console.log(`Final: ${content.length} chars, ~${lines} lines`);

const out = 'e:\\Katriel Pc\\WEB\\2026\\ecosistema LOKAL\\LOKAL\\src\\App.jsx';
writeFileSync(out, content, 'utf8');
console.log('Written to src/App.jsx');
