import { CalendarWeek } from '../types';
import { SCHOOL_GOOGLE_CALENDARS } from '../data/schoolGoogleCalendars';

export interface GoogleCalendarEvent {
  calendarId: string;
  calendarLabel: string;
  summary: string;
  /** YYYY-MM-DD（Asia/Taipei） */
  startDate: string;
  /** YYYY-MM-DD inclusive（Asia/Taipei） */
  endDate: string;
}

export interface SyncGoogleCalendarOptions {
  calendarIds: string[];
  /** 僅同步段考／放假／開學等重要關鍵字（預設 true） */
  importantOnly?: boolean;
  /** overwrite = 覆蓋備註；merge = 合併到現有備註 */
  mode?: 'overwrite' | 'merge';
}

export interface SyncGoogleCalendarResult {
  calendar: CalendarWeek[];
  eventCount: number;
  weekHitCount: number;
  errors: string[];
}

const IMPORTANT_KEYWORD_RE =
  /放假|補假|連假|段考|期中|期末|定期考查|考查|考試|開學|休業|結業|註冊|輔導課|運動會|校慶|典禮|親師|懇談|停課|彈性|國慶|元旦|中秋|端午|清明|春節|教師節|補班|技藝競賽|技能檢定|工安|宣導|週會|防災|寒假|暑假|結業式/;

const NOISE_KEYWORD_RE =
  /陳報|統計表|會報|工作會議|繳交截止|成績繳交|鑰匙|噴藥|設備檢查|維護保養|更換選手|報名作業|選課|投稿|數位素養|優質化/;

function unfoldIcs(ics: string): string {
  return ics.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
}

function unescapeIcsText(value: string): string {
  return value
    .replace(/\\n/gi, ' ')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

function ymdFromParts(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** ICS DTSTART/DTEND → Asia/Taipei 的 YYYY-MM-DD */
export function icsStampToTaipeiYmd(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.includes('T')) {
    const y = trimmed.slice(0, 4);
    const m = trimmed.slice(4, 6);
    const d = trimmed.slice(6, 8);
    return `${y}-${m}-${d}`;
  }

  const m = trimmed.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/
  );
  if (!m) return trimmed.slice(0, 10);

  const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${m[7] || ''}`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return trimmed.slice(0, 10);

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const y = parts.find((p) => p.type === 'year')?.value || '1970';
  const mo = parts.find((p) => p.type === 'month')?.value || '01';
  const d = parts.find((p) => p.type === 'day')?.value || '01';
  return `${y}-${mo}-${d}`;
}

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatYmd(date: Date): string {
  return ymdFromParts(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function addDays(ymd: string, days: number): string {
  const d = parseYmd(ymd);
  d.setDate(d.getDate() + days);
  return formatYmd(d);
}

function compareYmd(a: string, b: string): number {
  return a.localeCompare(b);
}

function eachDateInclusive(startYmd: string, endYmd: string): string[] {
  const out: string[] = [];
  let cur = startYmd;
  while (compareYmd(cur, endYmd) <= 0) {
    out.push(cur);
    cur = addDays(cur, 1);
    if (out.length > 90) break;
  }
  return out;
}

function formatMd(ymd: string): string {
  const [, m, d] = ymd.split('-');
  return `${Number(m)}/${Number(d)}`;
}

function formatEventNote(event: GoogleCalendarEvent): string {
  const sameDay = event.startDate === event.endDate;
  const dateLabel = sameDay
    ? formatMd(event.startDate)
    : `${formatMd(event.startDate)}-${formatMd(event.endDate)}`;

  let summary = event.summary;
  const isHolidayCal = event.calendarLabel.includes('節慶') || event.calendarLabel.includes('假日');
  if (
    isHolidayCal &&
    !/放假|補假|連假/.test(summary) &&
    /中秋|國慶|元旦|開國|端午|清明|春節|補假/.test(summary)
  ) {
    summary = `${summary}放假`;
  }

  return `${dateLabel} ${summary}`;
}

export function parseIcsEvents(
  icsText: string,
  calendarId: string,
  calendarLabel: string
): GoogleCalendarEvent[] {
  const unfolded = unfoldIcs(icsText);
  const events: GoogleCalendarEvent[] = [];
  const blockRe = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
  let match: RegExpExecArray | null;

  while ((match = blockRe.exec(unfolded))) {
    const block = match[1];
    const summaryRaw = (block.match(/\nSUMMARY(?:;[^:\n]*)?:([^\n\r]*)/) || [])[1];
    const dtStartRaw = (block.match(/\nDTSTART(?:;[^:\n]*)?:([^\n\r]*)/) || [])[1];
    const dtEndRaw = (block.match(/\nDTEND(?:;[^:\n]*)?:([^\n\r]*)/) || [])[1];
    if (!summaryRaw || !dtStartRaw) continue;

    const timed = dtStartRaw.includes('T');
    const startDate = icsStampToTaipeiYmd(dtStartRaw);
    let endDate = dtEndRaw ? icsStampToTaipeiYmd(dtEndRaw) : startDate;

    // 全日事件的 DTEND 為 exclusive
    if (!timed && dtEndRaw && compareYmd(endDate, startDate) > 0) {
      endDate = addDays(endDate, -1);
    }
    if (compareYmd(endDate, startDate) < 0) endDate = startDate;

    events.push({
      calendarId,
      calendarLabel,
      summary: unescapeIcsText(summaryRaw),
      startDate,
      endDate,
    });
  }

  return events;
}

function isImportantEvent(event: GoogleCalendarEvent): boolean {
  if (NOISE_KEYWORD_RE.test(event.summary) && !/段考|定期考查|放假|補假|開學/.test(event.summary)) {
    return false;
  }
  return IMPORTANT_KEYWORD_RE.test(event.summary);
}

function eventOverlapsWeek(event: GoogleCalendarEvent, week: CalendarWeek): boolean {
  return (
    compareYmd(event.endDate, week.startDate) >= 0 &&
    compareYmd(event.startDate, week.endDate) <= 0
  );
}

function looksLikeIcs(text: string): boolean {
  return text.includes('BEGIN:VCALENDAR');
}

function isLocalDevHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host.endsWith('.local') ||
    /^192\.168\./.test(host) ||
    /^10\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}

async function tryFetchIcs(url: string): Promise<string | null> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  const text = await res.text();
  return looksLikeIcs(text) ? text : null;
}

function cacheBase(): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}gcal-cache/`;
}

let cachePackPromise: Promise<Record<string, string>> | null = null;

async function loadCachePack(): Promise<Record<string, string>> {
  if (!cachePackPromise) {
    cachePackPromise = fetch(`${cacheBase()}events.json`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return {};
        const data = await res.json();
        return data && typeof data === 'object' ? data : {};
      })
      .catch(() => ({}));
  }
  return cachePackPromise;
}

function calendarSlug(calendarId: string): string {
  return SCHOOL_GOOGLE_CALENDARS.find((c) => c.id === calendarId)?.slug || '';
}

/** 本機走 Vite 代理；GitHub Pages 讀建置時快取（瀏覽器無法直連 Google ICS） */
async function fetchIcsViaProxy(calendarId: string): Promise<string> {
  if (isLocalDevHost()) {
    try {
      const text = await tryFetchIcs(`/api/gcal-ics?id=${encodeURIComponent(calendarId)}`);
      if (text) return text;
    } catch {
      // 改讀快取
    }
  }

  const pack = await loadCachePack();
  const packed = pack[calendarId];
  if (typeof packed === 'string' && looksLikeIcs(packed)) return packed;

  const slug = calendarSlug(calendarId);
  if (slug) {
    try {
      const text = await tryFetchIcs(`${cacheBase()}${slug}.ics`);
      if (text) return text;
    } catch {
      // 無個別快取檔
    }
  }

  throw new Error('無法讀取公開日曆，請稍後再試');
}

/**
 * 從中正高工公開 Google 日曆同步「學校行事備註」，
 * 並回寫到行事曆主檔（進度表備註欄會連動）。
 */
export async function syncSchoolEventsFromGoogleCalendar(
  currentCalendar: CalendarWeek[],
  options: SyncGoogleCalendarOptions
): Promise<SyncGoogleCalendarResult> {
  const importantOnly = options.importantOnly !== false;
  const mode = options.mode || 'overwrite';
  const errors: string[] = [];
  const selected = SCHOOL_GOOGLE_CALENDARS.filter((c) =>
    options.calendarIds.includes(c.id)
  );

  if (selected.length === 0) {
    return {
      calendar: currentCalendar,
      eventCount: 0,
      weekHitCount: 0,
      errors: ['請至少選擇一個日曆來源'],
    };
  }

  const termStart = currentCalendar[0]?.startDate;
  const termEnd = currentCalendar[currentCalendar.length - 1]?.endDate;
  if (!termStart || !termEnd) {
    return {
      calendar: currentCalendar,
      eventCount: 0,
      weekHitCount: 0,
      errors: ['行事曆週次資料不完整'],
    };
  }

  const allEvents: GoogleCalendarEvent[] = [];

  await Promise.all(
    selected.map(async (src) => {
      try {
        const ics = await fetchIcsViaProxy(src.id);
        const parsed = parseIcsEvents(ics, src.id, src.label);
        for (const ev of parsed) {
          if (compareYmd(ev.endDate, termStart) < 0) continue;
          if (compareYmd(ev.startDate, termEnd) > 0) continue;
          if (importantOnly && !isImportantEvent(ev)) continue;
          allEvents.push(ev);
        }
      } catch (e) {
        errors.push(`${src.label}：${e instanceof Error ? e.message : String(e)}`);
      }
    })
  );

  // 去重（同日期區間 + 同標題）
  const uniq = new Map<string, GoogleCalendarEvent>();
  for (const ev of allEvents) {
    const key = `${ev.startDate}|${ev.endDate}|${ev.summary}`;
    if (!uniq.has(key)) uniq.set(key, ev);
  }
  const events = [...uniq.values()].sort(
    (a, b) =>
      compareYmd(a.startDate, b.startDate) || a.summary.localeCompare(b.summary, 'zh-Hant')
  );

  let weekHitCount = 0;
  const updated = currentCalendar.map((week) => {
    const weekEvents = events.filter((ev) => eventOverlapsWeek(ev, week));
    if (weekEvents.length === 0) {
      if (mode === 'overwrite') {
        return {
          ...week,
          schoolEvent: '',
          isHolidayOrExam: false,
        };
      }
      return week;
    }

    weekHitCount += 1;
    const notes = weekEvents.map(formatEventNote);
    const merged =
      mode === 'merge' && week.schoolEvent
        ? Array.from(new Set([...week.schoolEvent.split(/[、；;]/).map((s) => s.trim()).filter(Boolean), ...notes]))
        : notes;

    const schoolEvent = merged.join('、');
    const isHolidayOrExam =
      /放假|補假|連假|段考|定期考查|期末考|期中考/.test(schoolEvent);

    return {
      ...week,
      schoolEvent,
      isHolidayOrExam,
    };
  });

  return {
    calendar: updated,
    eventCount: events.length,
    weekHitCount,
    errors,
  };
}

/** 供單元測試或除錯：將事件依週次分組 */
export function groupEventsByWeek(
  calendar: CalendarWeek[],
  events: GoogleCalendarEvent[]
): Record<number, string[]> {
  const out: Record<number, string[]> = {};
  for (const week of calendar) {
    out[week.week] = events
      .filter((ev) => eventOverlapsWeek(ev, week))
      .map(formatEventNote);
  }
  return out;
}

export { eachDateInclusive };
