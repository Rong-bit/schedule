/**
 * 建置前下載中正高工公開 Google 日曆 ICS，
 * 讓 GitHub Pages（無後端、有 CORS）仍可同步備註。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceFile = path.join(root, 'src/data/schoolGoogleCalendars.ts');
const outDir = path.join(root, 'public/gcal-cache');

const source = fs.readFileSync(sourceFile, 'utf8');
const ids = [...source.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]);

if (ids.length === 0) {
  console.error('找不到日曆 ID');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

let ok = 0;
for (const id of ids) {
  const url = `https://calendar.google.com/calendar/ical/${encodeURIComponent(id)}/public/basic.ics`;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'text/calendar, text/plain;q=0.9' },
    });
    const text = await res.text();
    if (!res.ok || !text.includes('BEGIN:VCALENDAR')) {
      console.error(`略過 ${id}：HTTP ${res.status}`);
      continue;
    }
    fs.writeFileSync(path.join(outDir, `${encodeURIComponent(id)}.ics`), text);
    ok += 1;
    console.log(`已快取 ${id}（${text.length} bytes）`);
  } catch (err) {
    console.error(`略過 ${id}：${err instanceof Error ? err.message : String(err)}`);
  }
}

if (ok === 0) {
  console.error('無法下載任何公開日曆');
  process.exit(1);
}

console.log(`完成：${ok}/${ids.length} 本日曆已寫入 public/gcal-cache`);
