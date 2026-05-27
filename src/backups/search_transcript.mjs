import { createReadStream } from 'fs';
import { createInterface } from 'readline';

const files = [
  'C:/Users/katry/.claude/projects/e--Katriel-Pc-WEB-2026-LOKAL/3ee4e0ee-4712-453b-94f7-6a8b691c4c19.jsonl',
  'C:/Users/katry/.claude/projects/e--Katriel-Pc-WEB-2026-ecosistema-LOKAL-LOKAL/cb51b7e4-7b98-42a3-8f80-8c76a0a9320b.jsonl',
];

for (const file of files) {
  console.log('\n=== Searching:', file.split('/').pop(), '===');
  const rl = createInterface({ input: createReadStream(file, { encoding: 'utf8' }), crlfDelay: Infinity });
  let idx = 0;
  const found = [];
  for await (const line of rl) {
    if (line.length > 10000) {
      try {
        const obj = JSON.parse(line);
        const msg = obj?.message;
        if (msg?.content) {
          for (const c of msg.content) {
            if (c.type === 'tool_result' && typeof c.content === 'string' && c.content.length > 10000) {
              if (c.content.includes('allDemandas') || c.content.includes('navStack') || c.content.includes('fetchDemandas')) {
                found.push({ idx, len: c.content.length, preview: c.content.substring(0, 80) });
              }
            }
          }
        }
      } catch {}
    }
    idx++;
  }
  console.log(`Found ${found.length} App.jsx reads:`);
  found.sort((a,b) => b.len - a.len).slice(0,5).forEach(f => console.log(`  idx=${f.idx} len=${f.len}: ${f.preview}`));
}
