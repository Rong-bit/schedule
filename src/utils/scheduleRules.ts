import { CalendarWeek, SyllabusRow } from '../types';

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

// 標準段考週定義（高工學期標準：第 7 週第 1 次段考、第 14 週第 2 次段考、第 21 週期末考）
export const STANDARD_EXAM_WEEKS = {
  firstMidterm: 7,
  secondMidterm: 14,
  finalExam: 21,
};

// 評估指定週次與上課星期的當日狀態（是否剛好命中放假或段考）
export function evaluateClassDay(
  weekData: CalendarWeek | { week: number; startDate?: string; endDate?: string; schoolEvent?: string },
  dayOfWeek: string = '星期四'
): ClassDayEvaluation {
  const dayOffset = getDayOffset(dayOfWeek);
  const weekNum = weekData.week;
  const note = weekData.schoolEvent || '';

  let classDate: Date | null = null;
  let m = 0;
  let d = 0;
  const dayNames = ['一', '二', '三', '四', '五', '六', '日'];
  const weekdayShort = dayNames[dayOffset] || '四';
  const weekdayName = `星期${weekdayShort}`;

  if (weekData.startDate) {
    const start = new Date(weekData.startDate);
    if (!isNaN(start.getTime())) {
      classDate = new Date(start.getTime() + dayOffset * 86400000);
      m = classDate.getMonth() + 1;
      d = classDate.getDate();
    }
  }

  const shortDate = m && d ? `${m}/${d}` : '';
  const dateText = shortDate ? `${shortDate}(${weekdayShort})` : weekdayName;

  // 1. 檢測特定放假（若行事曆記載特定日期，例如 9/25 中秋節、10/9 國慶、1/1 元旦）
  let isHoliday = false;
  let holidayName = '';

  // 解析日期關鍵字如 "9/25"、"10/9"、"1/1"
  const isMidAutumn = /中秋/.test(note);
  const isNationalDay = /國慶|雙十/.test(note);
  const isNewYear = /元旦|開國紀念/.test(note);
  const isTombSweeping = /清明|民族掃墓/.test(note);
  const isDragonBoat = /端午/.test(note);
  const isWinterVacation = /寒假/.test(note);

  // 檢查當天是否恰好命中放假日期
  if (isMidAutumn) {
    // 預設 9/25 中秋放假
    if (shortDate === '9/25' || (note.includes('9/25') && shortDate === '9/25') || (dayOffset === 4 && weekNum === 4)) {
      isHoliday = true;
      holidayName = '中秋節放假';
    }
  }

  if (isNationalDay) {
    // 預設 10/9 國慶彈性連假
    if (shortDate === '10/9' || (note.includes('10/9') && shortDate === '10/9') || (dayOffset === 4 && weekNum === 6)) {
      isHoliday = true;
      holidayName = '國慶日彈性連假放假';
    }
  }

  if (isNewYear) {
    // 1/1 元旦放假
    if (shortDate === '1/1' || (note.includes('1/1') && shortDate === '1/1') || (dayOffset === 4 && weekNum === 18)) {
      isHoliday = true;
      holidayName = '元旦連假放假';
    }
  }

  if (isWinterVacation) {
    // 1/20 休業式後開始放寒假（週四 1/21、週五 1/22 均放假）
    if (weekNum === 21 && (dayOffset >= 3 || d >= 21)) {
      isHoliday = true;
      holidayName = '寒假開始放假';
    }
  }

  // 通用正則比對特定日期連假：例如 "4/3-4/6 放假" 或 "5/1 勞動節放假"
  if (!isHoliday && /放假|連假|彈性放假|停課/.test(note)) {
    // 尋找行事曆中的月/日
    const singleMatch = note.match(/(\d{1,2})\/(\d{1,2})\s*(?:放假|連假|彈性)/);
    if (singleMatch) {
      const matchM = parseInt(singleMatch[1], 10);
      const matchD = parseInt(singleMatch[2], 10);
      if (m === matchM && d === matchD) {
        isHoliday = true;
        holidayName = note.split('、')[0].split('，')[0].replace(/\(.*?\)/g, '').trim();
      }
    }

    const rangeMatch = note.match(/(\d{1,2})\/(\d{1,2})-(\d{1,2})\s*(?:放假|連假)/);
    if (rangeMatch) {
      const matchM = parseInt(rangeMatch[1], 10);
      const startD = parseInt(rangeMatch[2], 10);
      const endD = parseInt(rangeMatch[3], 10);
      if (m === matchM && d >= startD && d <= endD) {
        isHoliday = true;
        holidayName = note.split('、')[0].split('，')[0].replace(/\(.*?\)/g, '').trim();
      }
    }
  }

  // 2. 檢測段考（定期考查）
  let isExam = false;
  let examName = '';

  // 檢查是否命中第 1 次段考
  if (weekNum === 7 || /第\s*1\s*次期中|第一次期中|第一次段考|第1次段考/.test(note)) {
    // 第 1 次段考範圍通常是 10/14-16 (週三～週五)
    // 若該週為第 7 週，高工普遍將整週或段考日認定為段考
    isExam = true;
    examName = '第一次期中考';
  } else if (weekNum === 14 || /第\s*2\s*次期中|第二次期中|第二次段考|第2次段考/.test(note)) {
    // 第 2 次段考通常是 12/1-3 (週二～週四)
    isExam = true;
    examName = '第二次期中考';
  } else if (weekNum === 21 || /期末考|期末定期考|期末段考/.test(note)) {
    // 若當天尚未放寒假（週一～週三 1/18-20），則為期末考
    if (!isHoliday) {
      isExam = true;
      examName = '期末考';
    }
  } else if (/段考|定期考查|期中考|期末考/.test(note)) {
    isExam = true;
    examName = '定期考查';
  }

  // 若同時檢測出放假與段考，放假優先（如寒假第一天）
  if (isHoliday) {
    isExam = false;
  }

  // 計算標準進度、作業與評量建議文字
  let suggestedProgress = '';
  let suggestedAssessment = '';
  let suggestedAssignment = '';
  let statusLabel = '正常上課';

  if (isHoliday) {
    statusLabel = '放假';
    suggestedProgress = holidayName.includes('放假') ? holidayName : `${holidayName}放假`;
    suggestedAssessment = '放假';
    suggestedAssignment = '無';
  } else if (isExam) {
    statusLabel = '段考';
    if (examName.includes('第一次') || weekNum === 7) {
      suggestedProgress = '第一次期中定期考查（技能實作評量與學科測驗）';
      suggestedAssessment = '第 1 次段考';
    } else if (examName.includes('第二次') || weekNum === 14) {
      suggestedProgress = '第二次期中定期考查（實習成品驗收與專業測驗）';
      suggestedAssessment = '第 2 次段考';
    } else {
      suggestedProgress = '期末定期考查（實習總驗收與工場工安清潔保養）';
      suggestedAssessment = '期末考評量';
    }
    suggestedAssignment = '段考複習/自主學習';
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

// 根據設定的上課星期，一鍵自動同步/更新 21 週的課程進度、日常考查與作業
export function alignRowsWithClassWeekday(
  rows: SyllabusRow[],
  calendar: CalendarWeek[],
  dayOfWeek: string,
  backupSampleProgress?: string[]
): SyllabusRow[] {
  return rows.map((row, idx) => {
    const calWeek = calendar.find((c) => c.week === row.week) || {
      week: row.week,
      dateRangeText: row.dateRangeText,
      schoolEvent: row.schoolNote,
    };

    const evalResult = evaluateClassDay(calWeek, dayOfWeek);

    // 情況 1: 該星期的上課日是「放假」
    if (evalResult.isHoliday) {
      return {
        ...row,
        courseProgress: evalResult.suggestedProgress,
        assessment: evalResult.suggestedAssessment,
        assignment: evalResult.suggestedAssignment,
      };
    }

    // 情況 2: 該星期的上課日是「段考」
    if (evalResult.isExam) {
      return {
        ...row,
        courseProgress: evalResult.suggestedProgress,
        assessment: evalResult.suggestedAssessment,
        assignment: row.assignment && !row.assignment.includes('量測表') ? row.assignment : evalResult.suggestedAssignment,
      };
    }

    // 情況 3: 該星期的上課日是「正常上課」
    // 如果原本該列被填成了放假（例如之前選星期五是中秋放假，現在切換到星期四變正常上課），則需要恢復正常進度
    const isCurrentlyHoliday = /放假|連假|中秋|國慶|元旦|寒假開始/.test(row.courseProgress);
    if (isCurrentlyHoliday) {
      // 恢復為預設範本進度或清空讓老師填寫
      const fallback = backupSampleProgress && backupSampleProgress[idx]
        ? backupSampleProgress[idx]
        : `第 ${row.week} 週實習單元進度`;
      return {
        ...row,
        courseProgress: fallback,
        assessment: row.assessment === '放假' ? '技能操作評量' : row.assessment,
        assignment: row.assignment === '無' ? `實習作業第 ${row.week} 次` : row.assignment,
      };
    }

    return row;
  });
}
