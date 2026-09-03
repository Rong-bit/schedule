/**
 * 建置前下載中正高工公開 Google 日曆 ICS，
 * 寫成 events.json（單一檔、檔名不含 @/#），供 GitHub Pages 同步備註。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceFile = path.join(root, 'src/data/schoolGoogleCalendars.ts');
const outDir = path.join(root, 'public/gcal-cache');

const source = fs.readFileSync(sourceFile, 'utf8');
const blocks = [...source.matchAll(/id:\s*'([^']+)'[\s\S]*?slug:\s*'([^']+)'/g)];

if (blocks.length === 0) {
  console.error('找不到日曆 ID');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const pack = {};
let ok = 0;

for (const [, id, slug] of blocks) {
  const url = `https://calendar.google.com/calendar/ical/${encodeURIComponent(id)}/public/basic.ics`;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'text/calendar, text/plain;q=0.9' },
    });
    const text = await res.text();
    if (!res.ok || !text.includes('BEGIN:VCALENDAR')) {
      console.error(`略過 ${slug}：HTTP ${res.status}`);
      continue;
    }
    pack[id] = text;
    fs.writeFileSync(path.join(outDir, `${slug}.ics`), text);
    ok += 1;
    console.log(`已快取 ${slug}（${text.length} bytes）`);
  } catch (err) {
    console.error(`略過 ${slug}：${err instanceof Error ? err.message : String(err)}`);
  }
}

if (ok === 0) {
  console.error('無法下載任何公開日曆');
  process.exit(1);
}

fs.writeFileSync(path.join(outDir, 'events.json'), JSON.stringify(pack));
console.log(`完成：${ok}/${blocks.length} 本日曆已寫入 public/gcal-cache/events.json`);
