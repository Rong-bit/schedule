import { CalendarWeek, GroupRotationPattern, SyllabusRow } from '../types';
import { getCalculatedGroup } from '../data/defaultCalendar';

export interface ClassDayEvaluation {
  classDate: Date | null;
  dateText: string; // e.g. "9/25(五)"
  shortDate: string; // e.g. "9/25"
  weekdayName: string; // e.g. "星期五"
  weekdayShort: string; // e.g. "五"
  dayOffset: number; // 0 for Mon, 4 for Fri
  isHoliday: boolean;
  holidayName: string;
  isExam: boolean;
  examName: string;
  statusLabel: string; // e.g. "放假", "段考", "正常上課"
  suggestedProgress: string;
  suggestedAssessment: string;
  suggestedAssignment: string;
}

// 根據星期字串解析週一到週日的位移天數 (0=週一, 4=週五)
export function getDayOffset(dayOfWeek: string = '星期四'): number {
  if (dayOfWeek.includes('一') || dayOfWeek.includes('1')) return 0;
  if (dayOfWeek.includes('二') || dayOfWeek.includes('2')) return 1;
  if (dayOfWeek.includes('三') || dayOfWeek.includes('3')) return 2;
  if (dayOfWeek.includes('四') || dayOfWeek.includes('4')) return 3;
  if (dayOfWeek.includes('五') || dayOfWeek.includes('5')) return 4;
  if (dayOfWeek.includes('六') || dayOfWeek.includes('6')) return 5;
  if (dayOfWeek.includes('日') || dayOfWeek.includes('7') || dayOfWeek.includes('天')) return 6;
  return 3; // 預設星期四
}

export const STANDARD_EXAM_WEEKS = {
  firstMidterm: 7,
  secondMidterm: 14,
  finalExam: 21,
};

function parseLocalYmd(ymd?: string): Date | null {
  if (!ymd) return null;
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function addLocalDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function examOrdinalFromText(text: string): string {
  if (/第\s*1\s*次|第一次|第1次/.test(text)) return '1';
  if (/第\s*2\s*次|第二次|第2次/.test(text)) return '2';
  if (/第\s*3\s*次|第三次|第3次|期末/.test(text)) return '3';
  return '';
}

function isHolidayClause(text: string): boolean {
  return /放假|補假|連假|彈性放假|停課|中秋|國慶|元旦|開國|光復節|端午|清明/.test(text);
}

function isExamClause(text: string): boolean {
  return /定期考查|段考|期中考|期末考/.test(text) && !/模擬考/.test(text);
}

function dateInMdRange(
  classDate: Date,
  m1: number,
  d1: number,
  m2: number,
  d2: number
): boolean {
  const y = classDate.getFullYear();
  const cm = classDate.getMonth() + 1;
  let startY = y;
  let endY = y;
  if (m1 > m2) {
    if (cm <= m2) startY = y - 1;
    else endY = y + 1;
  }
  const start = new Date(startY, m1 - 1, d1);
  const end = new Date(endY, m2 - 1, d2);
  const t = new Date(classDate.getFullYear(), classDate.getMonth(), classDate.getDate());
  return t >= start && t <= end;
}

function clauseCoversClassDate(clause: string, classDate: Date): boolean {
  const full = [...clause.matchAll(/(\d{1,2})\/(\d{1,2})\s*[-~～]\s*(\d{1,2})\/(\d{1,2})/g)];
  if (full.length > 0) {
    return full.some((x) =>
      dateInMdRange(classDate, Number(x[1]), Number(x[2]), Number(x[3]), Number(x[4]))
    );
  }
  const short = [...clause.matchAll(/(\d{1,2})\/(\d{1,2})\s*[-~～]\s*(\d{1,2})(?!\s*\/)/g)];
  if (short.length > 0) {
    return short.some((x) =>
      dateInMdRange(classDate, Number(x[1]), Number(x[2]), Number(x[1]), Number(x[3]))
    );
  }
  const singles = [...clause.matchAll(/(\d{1,2})\/(\d{1,2})/g)];
  return singles.some((x) =>
    dateInMdRange(classDate, Number(x[1]), Number(x[2]), Number(x[1]), Number(x[2]))
  );
}

function matchNoteOnClassDate(
  note: string,
  classDate: Date
): { isHoliday: boolean; isExam: boolean; examOrdinal: string } {
  const clauses = note.split(/[、；;\n]/).map((s) => s.trim()).filter(Boolean);
  let isHoliday = false;
  let isExam = false;
  let examOrdinal = '';

  for (const clause of clauses) {
    if (!clauseCoversClassDate(clause, classDate)) continue;
    if (isHolidayClause(clause)) isHoliday = true;
    if (isExamClause(clause)) {
      isExam = true;
      examOrdinal = examOrdinalFromText(clause) || examOrdinal;
    }
  }

  return { isHoliday, isExam, examOrdinal };
}

export function isAutoFilledProgress(text?: string): boolean {
  if (!text) return false;
  const t = text.trim();
  return /技能實作評量與學科測驗|實習成品驗收與專業測驗|工場工安清潔保養|第一次期中定期考查|第二次期中定期考查|期末定期考查/.test(
    t
  ) || /^(放假|第[123]次定期考查|中秋節放假|國慶日|元旦連假|寒假開始)/.test(t);
}

/** 去掉舊版自動帶入的括號說明，改為「第Ｎ次定期考查」 */
export function stripLegacyExamBoilerplate(text: string): string {
  if (!text) return text;
  return text
    .replace(/第一次期中定期考查（技能實作評量與學科測驗）/g, '第1次定期考查')
    .replace(/第二次期中定期考查（實習成品驗收與專業測驗）/g, '第2次定期考查')
    .replace(/期末定期考查（實習總驗收與工場工安清潔保養）/g, '第3次定期考查')
    .replace(/第一次期中定期考查/g, '第1次定期考查')
    .replace(/第二次期中定期考查/g, '第2次定期考查')
    .replace(/期末定期考查/g, '第3次定期考查');
}

export function evaluateClassDay(
  weekData: CalendarWeek | { week: number; startDate?: string; endDate?: string; schoolEvent?: string },
  dayOfWeek: string = '星期四'
): ClassDayEvaluation {
  const dayOffset = getDayOffset(dayOfWeek);
  const note = (weekData as CalendarWeek).schoolEvent || (weekData as { schoolEvent?: string }).schoolEvent || '';

  let classDate: Date | null = null;
  let m = 0;
  let d = 0;
  const dayNames = ['一', '二', '三', '四', '五', '六', '日'];
  const weekdayShort = dayNames[dayOffset] || '四';
  const weekdayName = `星期${weekdayShort}`;

  const startLocal = parseLocalYmd(weekData.startDate);
  if (startLocal) {
    classDate = addLocalDays(startLocal, dayOffset);
    m = classDate.getMonth() + 1;
    d = classDate.getDate();
  }

  const shortDate = m && d ? `${m}/${d}` : '';
  const dateText = shortDate ? `${shortDate}(${weekdayShort})` : weekdayName;

  const hit = classDate
    ? matchNoteOnClassDate(note, classDate)
    : { isHoliday: false, isExam: false, examOrdinal: '' };

  let isHoliday = hit.isHoliday;
  const holidayName = hit.isHoliday ? '放假' : '';
  let isExam = hit.isExam;
  const examName = hit.examOrdinal ? `第${hit.examOrdinal}次定期考查` : hit.isExam ? '定期考查' : '';

  if (isHoliday) isExam = false;

  let suggestedProgress = '';
  const suggestedAssessment = '';
  const suggestedAssignment = '';
  let statusLabel = '正常上課';

  if (isHoliday) {
    statusLabel = '放假';
    suggestedProgress = '放假';
  } else if (isExam) {
    statusLabel = '段考';
    suggestedProgress = examName || '定期考查';
  }

  return {
    classDate,
    dateText,
    shortDate,
    weekdayName,
    weekdayShort,
    dayOffset,
    isHoliday,
    holidayName,
    isExam,
    examName,
    statusLabel,
    suggestedProgress,
    suggestedAssessment,
    suggestedAssignment,
  };
}

// 根據設定的上課星期，一鍵自動同步/更新 21 週的課程進度（作業／評量欄不自動填寫）
export function alignRowsWithClassWeekday(
  rows: SyllabusRow[],
  calendar: CalendarWeek[],
  dayOfWeek: string,
  _backupSampleProgress?: string[]
): SyllabusRow[] {
  return rows.map((row) => {
    const calWeek = calendar.find((c) => c.week === row.week) || {
      week: row.week,
      dateRangeText: row.dateRangeText,
      schoolEvent: row.schoolNote,
      startDate: undefined,
      endDate: undefined,
    };

    const evalResult = evaluateClassDay(
      {
        ...calWeek,
        schoolEvent: calWeek.schoolEvent || row.schoolNote,
      },
      dayOfWeek
    );

    const progress = stripLegacyExamBoilerplate(row.courseProgress);

    if (evalResult.isHoliday || evalResult.isExam) {
      return {
        ...row,
        courseProgress: evalResult.suggestedProgress,
      };
    }

    if (isAutoFilledProgress(progress)) {
      return {
        ...row,
        courseProgress: '',
      };
    }

    if (progress !== row.courseProgress) {
      return {
        ...row,
        courseProgress: progress,
      };
    }

    return row;
  });
}

/** 自訂／非正規上課週（貼進度時應略過，不消耗進度項目） */
export function isCustomWorkProgress(text?: string): boolean {
  if (!text) return false;
  return /自訂工作|自訂活動|補課活動|自主學習週|工場整理|設備維修|臨時調整|臨時任務|不排進度/.test(
    text
  );
}

/**
 * 判斷該週是否應略過進度填入（放假／段考／自訂工作）。
 * 優先依上課星期精準判斷；若無行事曆則回退關鍵字。
 */
export function isSkippedTeachingWeek(
  row: SyllabusRow,
  calendar: CalendarWeek[] | undefined,
  dayOfWeek: string = '星期四'
): boolean {
  if (isCustomWorkProgress(row.courseProgress) || isCustomWorkProgress(row.schoolNote)) {
    return true;
  }

  const calWeek = calendar?.find((c) => c.week === row.week);
  const evalResult = evaluateClassDay(
    {
      week: row.week,
      dateRangeText: row.dateRangeText,
      startDate: calWeek?.startDate,
      endDate: calWeek?.endDate,
      schoolEvent: row.schoolNote || calWeek?.schoolEvent,
    },
    dayOfWeek
  );
  if (evalResult.isHoliday || evalResult.isExam) return true;

  // 進度欄已標成放假／定期考查時也略過（不含「段考檢討」等實際上課週）
  if (
    /^(放假|連假)/.test(row.courseProgress.trim()) ||
    /寒假開始/.test(row.courseProgress) ||
    /^第\s*\d+\s*次定期考查/.test(row.courseProgress.trim())
  ) {
    return true;
  }

  return false;
}

function isWholeClassGroup(group: string): boolean {
  const g = (group || '').trim();
  return g === '全班' || g === '全體' || g === '不分組';
}

function isGroupA(group: string, nameA: string): boolean {
  if (!group) return false;
  if (group === nameA) return true;
  return /^A/i.test(group.trim()) || group.includes('A組') || group.includes('甲組');
}

function isGroupB(group: string, nameB: string): boolean {
  if (!group) return false;
  if (group === nameB) return true;
  return /^B/i.test(group.trim()) || group.includes('B組') || group.includes('乙組');
}

/**
 * 從學期結尾往前調整，讓 A／B 實際上課週數相同（總數為奇數時最多差 1）。
 * 用於 aabbbb／bbaaaa 等結尾補組會造成不均的規則。
 */
function balanceAbGroupsAtEnd(
  rows: SyllabusRow[],
  nameA: string,
  nameB: string
): SyllabusRow[] {
  const next = rows.map((r) => ({ ...r }));
  const rotatable = next
    .map((r, idx) => ({ r, idx }))
    .filter(({ r }) => isGroupA(r.group, nameA) || isGroupB(r.group, nameB))
    .map(({ idx }) => idx);

  if (rotatable.length === 0) return next;

  const countOf = (name: string, isA: boolean) =>
    rotatable.filter((i) => (isA ? isGroupA(next[i].group, name) : isGroupB(next[i].group, name)))
      .length;

  for (let k = rotatable.length - 1; k >= 0; k -= 1) {
    const aCount = countOf(nameA, true);
    const bCount = countOf(nameB, false);
    const total = aCount + bCount;
    const targetDiff = total % 2 === 0 ? 0 : 1;
    if (Math.abs(aCount - bCount) <= targetDiff) break;

    const idx = rotatable[k];
    if (aCount > bCount && isGroupA(next[idx].group, nameA)) {
      next[idx] = { ...next[idx], group: nameB };
    } else if (bCount > aCount && isGroupB(next[idx].group, nameB)) {
      next[idx] = { ...next[idx], group: nameA };
    }
  }

  return next;
}

/** 放假／考查週組別為「—」。已標「全班」的週（非整學期都是全班時）保留並不佔輪調序。 */
export function assignGroupsSkippingBreaks(
  rows: SyllabusRow[],
  calendar: CalendarWeek[],
  pattern: GroupRotationPattern,
  nameA: string,
  nameB: string,
  dayOfWeek: string,
  sequence?: string[]
): SyllabusRow[] {
  if (pattern === 'none') {
    return rows.map((r) => ({
      ...r,
      group: isSkippedTeachingWeek(r, calendar, dayOfWeek) ? '—' : '全班',
    }));
  }

  const teaching = rows.filter((r) => !isSkippedTeachingWeek(r, calendar, dayOfWeek));
  const wholeClassCount = teaching.filter((r) => isWholeClassGroup(r.group)).length;
  // 剛從「全班不分組」改輪調：上課週全是全班 → 全部重新分配
  // 僅部分週手動設成全班：那些週跳過，其餘才推進 A／B
  const preserveWholeClass =
    wholeClassCount > 0 && wholeClassCount < teaching.length;

  const teachingCount = teaching.filter(
    (r) => !(preserveWholeClass && isWholeClassGroup(r.group))
  ).length;

  let slot = 0;
  const assigned = rows.map((r) => {
    if (isSkippedTeachingWeek(r, calendar, dayOfWeek)) {
      return { ...r, group: '—' };
    }
    if (preserveWholeClass && isWholeClassGroup(r.group)) {
      return { ...r, group: '全班' };
    }
    slot += 1;
    return {
      ...r,
      group: getCalculatedGroup(slot, pattern, nameA, nameB, sequence, teachingCount),
    };
  });

  // aabbbb／bbaaaa：結尾補組常造成 A／B 週數不均，從結尾往前平衡
  if (pattern === 'aabbbb' || pattern === 'bbaaaa') {
    return balanceAbGroupsAtEnd(assigned, nameA, nameB);
  }

  return assigned;
}

export interface ApplySharedProgressOptions {
  topics: string[];
  calendar?: CalendarWeek[];
  dayOfWeek?: string;
  groupPattern: GroupRotationPattern;
  groupAName?: string;
  groupBName?: string;
  /** 是否同步把放假／段考建議文字寫入略過週（預設 true） */
  fillHolidayExamLabels?: boolean;
}

export interface ApplySharedProgressResult {
  rows: SyllabusRow[];
  topicUsed: number;
  teachingWeekPairs: number;
  skippedWeeks: number[];
  uncoveredTopics: string[];
}

/**
 * 貼上「一組半學期進度」：略過放假／段考／自訂工作後，
 * A、B 對應序位的上課週填入相同進度（僅需輸入一組）。
 * 全班不分組時，則依上課週序依序填入。
 */
export function applySharedGroupProgress(
  rows: SyllabusRow[],
  options: ApplySharedProgressOptions
): ApplySharedProgressResult {
  const dayOfWeek = options.dayOfWeek || '星期四';
  const nameA = options.groupAName || 'A組';
  const nameB = options.groupBName || 'B組';
  const fillLabels = options.fillHolidayExamLabels !== false;
  const topics = options.topics.map((t) => t.trim()).filter(Boolean);

  const next = rows.map((r) => ({ ...r }));
  const skippedWeeks: number[] = [];
  const teachingIndexes: number[] = [];

  next.forEach((row, idx) => {
    if (isSkippedTeachingWeek(row, options.calendar, dayOfWeek)) {
      skippedWeeks.push(row.week);
      if (fillLabels && options.calendar) {
        const calWeek = options.calendar.find((c) => c.week === row.week);
        if (calWeek) {
          const evalResult = evaluateClassDay(calWeek, dayOfWeek);
          if (
            (evalResult.isHoliday || evalResult.isExam) &&
            !isCustomWorkProgress(row.courseProgress)
          ) {
            next[idx] = {
              ...row,
              courseProgress: evalResult.suggestedProgress || row.courseProgress,
            };
          }
        }
      }
      return;
    }
    teachingIndexes.push(idx);
    // 只走貼上的一輪：先清空上課週舊進度，避免多出來的週次留下上一輪內容
    if (!isCustomWorkProgress(row.courseProgress)) {
      next[idx] = { ...next[idx], courseProgress: '' };
    }
  });

  // 全班：上課週依序填 topics（其餘上課週維持空白）
  if (options.groupPattern === 'none') {
    let used = 0;
    for (const idx of teachingIndexes) {
      if (used >= topics.length) break;
      next[idx] = { ...next[idx], courseProgress: topics[used] };
      used += 1;
    }
    return {
      rows: next,
      topicUsed: used,
      teachingWeekPairs: used,
      skippedWeeks,
      uncoveredTopics: topics.slice(used),
    };
  }

  // 有分組：A、B 各取上課週清單，第 N 堂同序位填相同進度（一行＝各組一堂；多出的堂次留白）
  const aIndexes = teachingIndexes.filter((idx) => isGroupA(next[idx].group, nameA));
  const bIndexes = teachingIndexes.filter((idx) => isGroupB(next[idx].group, nameB));

  const pairCount =
    aIndexes.length > 0 && bIndexes.length > 0
      ? Math.min(aIndexes.length, bIndexes.length, topics.length)
      : 0;

  let used = 0;
  if (pairCount > 0) {
    for (let i = 0; i < pairCount; i += 1) {
      const topic = topics[i];
      next[aIndexes[i]] = { ...next[aIndexes[i]], courseProgress: topic };
      next[bIndexes[i]] = { ...next[bIndexes[i]], courseProgress: topic };
      used += 1;
    }
  } else {
    // 無有效 A/B：兩兩配對相鄰上課週
    for (let i = 0; i + 1 < teachingIndexes.length && used < topics.length; i += 2) {
      const topic = topics[used];
      next[teachingIndexes[i]] = {
        ...next[teachingIndexes[i]],
        courseProgress: topic,
      };
      next[teachingIndexes[i + 1]] = {
        ...next[teachingIndexes[i + 1]],
        courseProgress: topic,
      };
      used += 1;
    }
    if (teachingIndexes.length % 2 === 1 && used < topics.length) {
      const lastIdx = teachingIndexes[teachingIndexes.length - 1];
      next[lastIdx] = { ...next[lastIdx], courseProgress: topics[used] };
      used += 1;
    }
  }

  return {
    rows: next,
    topicUsed: used,
    teachingWeekPairs: used,
    skippedWeeks,
    uncoveredTopics: topics.slice(used),
  };
}

/** 一行一個單元，只填實際上課週（放假／考查週不佔行；多出的上課週清空） */
export function applySequentialTeachingProgress(
  rows: SyllabusRow[],
  topics: string[],
  calendar: CalendarWeek[] | undefined,
  dayOfWeek: string
): { rows: SyllabusRow[]; used: number; skippedWeeks: number[] } {
  const clean = topics.map((t) => t.trim()).filter(Boolean);
  const skippedWeeks: number[] = [];
  let used = 0;
  const next = rows.map((row) => {
    if (isSkippedTeachingWeek(row, calendar, dayOfWeek)) {
      skippedWeeks.push(row.week);
      return row;
    }
    if (isCustomWorkProgress(row.courseProgress)) return row;
    if (used >= clean.length) {
      return { ...row, courseProgress: '' };
    }
    const topic = clean[used];
    used += 1;
    return { ...row, courseProgress: topic };
  });
  return { rows: next, used, skippedWeeks };
}
