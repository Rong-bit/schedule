export interface CalendarWeek {
  week: number;
  startDate: string; // e.g. "2026-08-31"
  endDate: string;   // e.g. "2026-09-04"
  dateRangeText: string; // e.g. "8/31(一)-9/4(五)"
  schoolEvent: string;   // e.g. "8/31 開學日"
  isHolidayOrExam?: boolean;
}

export interface SyllabusRow {
  week: number;
  dateRangeText: string;
  courseProgress: string; // 預定實習課程進度
  group: string;          // 分組組別 (A, B, 全班, or custom)
  assignment: string;     // 指定作業 / 實習成品
  assessment: string;     // 日常考查 / 評量方式
  schoolNote: string;     // 學校行事 (唯讀/自動帶入)
  customNote?: string;    // 教師補充備註
}

export type GroupRotationPattern = 'none' | 'alternate-2' | 'alternate-1' | 'alternate-3' | 'custom';

export interface PlanMetadata {
  id: string;
  schoolName: string;      // e.g. "高雄市立中正高級工業職業學校"
  schoolShortName: string; // e.g. "高雄市立中正高工"
  academicYear: string;    // e.g. "115"
  semester: string;        // e.g. "1"
  className: string;       // e.g. "資訊科二年甲班"
  courseName: string;      // e.g. "微處理機實習"
  courseDayOfWeek: string; // e.g. "星期四" (實習課上課星期)
  coursePeriod?: string;   // e.g. "第 5~7 節" (上課節次)
  mainTeacher: string;     // e.g. "王大明"
  coTeacher: string;       // e.g. "陳建宏"
  credits: string;         // e.g. "3"
  weeklyHours: string;     // e.g. "3"
  formDate: string;        // e.g. "115 年 8 月 30 日"
  departmentDirector: string; // 科主任簽章處備註
  groupPattern: GroupRotationPattern;
  groupA_name: string;     // e.g. "A組"
  groupB_name: string;     // e.g. "B組"
}

export interface SyllabusPlan {
  meta: PlanMetadata;
  rows: SyllabusRow[];
  updatedAt: number;
}
