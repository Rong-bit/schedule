import { CalendarWeek, PlanMetadata, SyllabusPlan, SyllabusRow } from '../types';

export const DEFAULT_CALENDAR_115_1: CalendarWeek[] = [
  {
    week: 1,
    startDate: '2026-08-31',
    endDate: '2026-09-04',
    dateRangeText: '8/31(一)-9/4(五)',
    schoolEvent: '8/31 開學日、實習工場工安與衛生宣導、工具設備清點',
    isHolidayOrExam: false,
  },
  {
    week: 2,
    startDate: '2026-09-07',
    endDate: '2026-09-11',
    dateRangeText: '9/7(一)-9/11(五)',
    schoolEvent: '正式上課、實習分組與工場座次確認',
    isHolidayOrExam: false,
  },
  {
    week: 3,
    startDate: '2026-09-14',
    endDate: '2026-09-18',
    dateRangeText: '9/14(一)-9/18(五)',
    schoolEvent: '9/14 第8節課後輔導課開始',
    isHolidayOrExam: false,
  },
  {
    week: 4,
    startDate: '2026-09-21',
    endDate: '2026-09-25',
    dateRangeText: '9/21(一)-9/25(五)',
    schoolEvent: '9/25 中秋節放假(預定)',
    isHolidayOrExam: true,
  },
  {
    week: 5,
    startDate: '2026-09-28',
    endDate: '2026-10-02',
    dateRangeText: '9/28(一)-10/2(五)',
    schoolEvent: '9/28 教師節敬師週',
    isHolidayOrExam: false,
  },
  {
    week: 6,
    startDate: '2026-10-05',
    endDate: '2026-10-09',
    dateRangeText: '10/5(一)-10/9(五)',
    schoolEvent: '10/9 國慶日彈性連假',
    isHolidayOrExam: true,
  },
  {
    week: 7,
    startDate: '2026-10-12',
    endDate: '2026-10-16',
    dateRangeText: '10/12(一)-10/16(五)',
    schoolEvent: '10/14-16 高一二第1次期中段考',
    isHolidayOrExam: true,
  },
  {
    week: 8,
    startDate: '2026-10-19',
    endDate: '2026-10-23',
    dateRangeText: '10/19(一)-10/23(五)',
    schoolEvent: '第1次段考試題檢討、實習設備自主保養',
    isHolidayOrExam: false,
  },
  {
    week: 9,
    startDate: '2026-10-26',
    endDate: '2026-10-30',
    dateRangeText: '10/26(一)-10/30(五)',
    schoolEvent: '實習作業與報告第1次抽查',
    isHolidayOrExam: false,
  },
  {
    week: 10,
    startDate: '2026-11-02',
    endDate: '2026-11-06',
    dateRangeText: '11/2(一)-11/6(五)',
    schoolEvent: '教學進度與實習日誌查核',
    isHolidayOrExam: false,
  },
  {
    week: 11,
    startDate: '2026-11-09',
    endDate: '2026-11-13',
    dateRangeText: '11/9(一)-11/13(五)',
    schoolEvent: '技能檢定學術科加強輔導',
    isHolidayOrExam: false,
  },
  {
    week: 12,
    startDate: '2026-11-16',
    endDate: '2026-11-20',
    dateRangeText: '11/16(一)-11/20(五)',
    schoolEvent: '全校運動會／專業實習成果觀摩週',
    isHolidayOrExam: false,
  },
  {
    week: 13,
    startDate: '2026-11-23',
    endDate: '2026-11-27',
    dateRangeText: '11/23(一)-11/27(五)',
    schoolEvent: '第2次期中段考前複習',
    isHolidayOrExam: false,
  },
  {
    week: 14,
    startDate: '2026-11-30',
    endDate: '2026-12-04',
    dateRangeText: '11/30(一)-12/4(五)',
    schoolEvent: '12/1-3 高一二第2次期中段考',
    isHolidayOrExam: true,
  },
  {
    week: 15,
    startDate: '2026-12-07',
    endDate: '2026-12-11',
    dateRangeText: '12/7(一)-12/11(五)',
    schoolEvent: '段考檢討、實習作業第2次抽查',
    isHolidayOrExam: false,
  },
  {
    week: 16,
    startDate: '2026-12-14',
    endDate: '2026-12-18',
    dateRangeText: '12/14(一)-12/18(五)',
    schoolEvent: '專題實習作品評選與展示',
    isHolidayOrExam: false,
  },
  {
    week: 17,
    startDate: '2026-12-21',
    endDate: '2026-12-25',
    dateRangeText: '12/21(一)-12/25(五)',
    schoolEvent: '實習工場年終盤點、工安教育宣導',
    isHolidayOrExam: false,
  },
  {
    week: 18,
    startDate: '2026-12-28',
    endDate: '2027-01-01',
    dateRangeText: '12/28(一)-1/1(五)',
    schoolEvent: '1/1 開國紀念日元旦放假',
    isHolidayOrExam: true,
  },
  {
    week: 19,
    startDate: '2027-01-04',
    endDate: '2027-01-08',
    dateRangeText: '1/4(一)-1/8(五)',
    schoolEvent: '第8節輔導課結束、實習技能總結評量',
    isHolidayOrExam: false,
  },
  {
    week: 20,
    startDate: '2027-01-11',
    endDate: '2027-01-15',
    dateRangeText: '1/11(一)-1/15(五)',
    schoolEvent: '期末實習成果驗收、工具箱歸位清潔',
    isHolidayOrExam: false,
  },
  {
    week: 21,
    startDate: '2027-01-18',
    endDate: '2027-01-22',
    dateRangeText: '1/18(一)-1/22(五)',
    schoolEvent: '1/18-20 期末段考、1/20 休業式、寒假開始',
    isHolidayOrExam: true,
  },
];

export const DEFAULT_META: PlanMetadata = {
  id: 'default-plan-115-1',
  schoolName: '高雄市立中正高級工業職業學校',
  schoolShortName: '高雄市立中正高工',
  academicYear: '115',
  semester: '1',
  className: '資訊科二年甲班',
  courseName: '微處理機實習',
  courseDayOfWeek: '星期四',
  coursePeriod: '第 5~7 節',
  mainTeacher: '陳銘智',
  coTeacher: '林志豪',
  credits: '3',
  weeklyHours: '3',
  formDate: '115 年 8 月 30 日',
  departmentDirector: '資訊科主任',
  groupPattern: 'alternate-2',
  groupA_name: 'A組',
  groupB_name: 'B組',
};

// Calculate rotation group for a given week
export function getCalculatedGroup(
  week: number,
  pattern: 'none' | 'alternate-2' | 'alternate-1' | 'alternate-3' | 'aabbbb' | 'half-semester' | 'custom',
  nameA: string = 'A組',
  nameB: string = 'B組',
  sequence?: string[],
  totalWeeks: number = 21
): string {
  if (pattern === 'none') return '全班';
  if (pattern === 'custom') {
    if (sequence && sequence.length > 0) {
      return sequence[week - 1] ?? sequence[sequence.length - 1];
    }
    return nameA;
  }
  if (pattern === 'half-semester') {
    // 上半學期 A、下半學期 B（21 週 → 1~11 為 A，12~21 為 B）
    const mid = Math.ceil(totalWeeks / 2);
    return week <= mid ? nameA : nameB;
  }
  if (pattern === 'alternate-1') {
    // Alternate every 1 week: 1->A, 2->B, 3->A, 4->B
    return (week % 2 === 1) ? nameA : nameB;
  }
  if (pattern === 'alternate-2') {
    // Formula from user request: =IF(MOD(INT((A6-1)/2),2)=0, "B", "A") or 2-week block
    // Week 1-2: A, Week 3-4: B, Week 5-6: A...
    const block = Math.floor((week - 1) / 2);
    return (block % 2 === 0) ? nameA : nameB;
  }
  if (pattern === 'aabbbb') {
    // 仍以 2 週為單位：AA 後接兩個 BB（第 5–6 週維持 B），再換回 A
    // 1-2 A, 3-6 B, 7-8 A, 9-12 B, ...
    const pos = (week - 1) % 6;
    return pos < 2 ? nameA : nameB;
  }
  if (pattern === 'alternate-3') {
    // Alternate every 3 weeks: Week 1-3: A, Week 4-6: B...
    const block = Math.floor((week - 1) / 3);
    return (block % 2 === 0) ? nameA : nameB;
  }
  return nameA;
}

/**
 * 解析自訂分組序。
 * 支援：
 * - 緊湊字串：aabbbbaaaabbbbaaaabb
 * - 一行一週：a / b / A組 / B組
 */
export function parseGroupSequenceText(
  text: string,
  nameA: string = 'A組',
  nameB: string = 'B組'
): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const hasNewline = /[\r\n]/.test(trimmed);
  const compact = trimmed.replace(/[\s,，、._\-]/g, '');

  // 單行緊湊 aabb…（不含換行）
  if (!hasNewline && /^[aAbB甲乙]+$/.test(compact)) {
    return [...compact].map((ch) => (/[bB乙]/.test(ch) ? nameB : nameA));
  }

  return trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const normalized = line.replace(/\s+/g, '');
      if (/全班|全體|不分組/i.test(normalized)) return '全班';
      if (/^(b|B|乙)/.test(normalized) || /B組|乙組/.test(normalized)) return nameB;
      if (/^(a|A|甲)/.test(normalized) || /A組|甲組/.test(normalized)) return nameA;
      return nameA;
    });
}

export const SAMPLE_PROGRESS_MICROPROCESSOR = [
  '工場工安規定與微處理機實習環境介紹',
  '8051/Arduino 開發板硬體架構與基本輸出入測試',
  'I/O 埠控制實習：LED 跑馬燈與霹靂燈程式設計',
  '按鍵開關輸入控制與彈跳消除（Debounce）電路實作',
  '七段顯示器靜態與動態掃描顯示實習',
  '中斷系統（External Interrupt）原理與實作練習',
  '第一次期中考週（實作考查與學科評量）',
  '第一次段考檢討、計時器/計數器（Timer/Counter）模式實習',
  'Timer 產生精準方波與音階發聲實習（蜂鳴器音樂箱）',
  '脈衝寬度調變（PWM）直流馬達調速控制實作',
  '類比數位轉換（ADC）感測器數據擷取（溫度/光敏電阻）',
  'LCD 1602 液晶顯示模組驅動與字串顯示控制實習',
  '串列通訊 UART 原理與電腦終端機雙向傳輸實習',
  '第二次期中考週（實習成品驗收與學科測驗）',
  '第二次段考檢討、步進馬達角度與轉速控制實習',
  'I2C/SPI 匯流排感測元件（OLED/溫濕度感測器）整合實習',
  '無線通訊模組（藍牙/Wi-Fi）基本指令與連線設定',
  '微處理機綜合專案實作：智慧溫室監控系統（一）',
  '微處理機綜合專案實作：智慧溫室監控系統（二）',
  '學期專案成果展示評分、實習總報告驗收',
  '期末考週（工場安全總檢討與設備年度保養）',
];

export const SAMPLE_ASSIGNMENTS_MICROPROCESSOR = [
  '實習安全守則手冊簽署',
  '基礎電路接線與點燈',
  '跑馬燈程式報告作業一',
  '防彈跳開關實作紀錄',
  '雙位數計數器電路圖',
  '外部中斷控制實作單',
  '第一次實習考查報告',
  '計時器模式分析作業',
  '自選樂曲程式碼繳交',
  'PWM 馬達電路測試表',
  '感測器特性量測曲線',
  '客製化文字顯示成果',
  '串列傳輸通訊協定作業',
  '第二次實習考查報告',
  '步進馬達控制線路圖',
  'I2C 模組實作驗收',
  '無線連線測試記錄',
  '專案電路雛型板製作',
  '專案程式除錯與封裝',
  '期末專案完整書面報告',
  '實習日誌彙整繳交',
];

export const SAMPLE_ASSESSMENTS_MICROPROCESSOR = [
  '出席態度 100%',
  '電路接線 60%、程式 40%',
  '成品操作 70%、報告 30%',
  '技能操作評量',
  '工作態度與實作成果',
  '程式邏輯檢核',
  '第一次段考',
  '訂正檢討與技能補測',
  '成品演示與音準考查',
  'PWM 訊號量測紀錄',
  'ADC 數據精準度考核',
  '顯示器驅動功能驗收',
  '雙向通訊操作測驗',
  '第二次段考',
  '轉向角度精確度驗收',
  '通訊協定分析考查',
  '無線數據傳輸展示',
  '專案進度與團隊合作',
  '專案功能完整性考核',
  '成果總評與口頭發表',
  '期末考與實習總成績',
];

export function createDefaultSyllabusRows(
  calendar: CalendarWeek[],
  pattern: PlanMetadata['groupPattern'] = 'alternate-2'
): SyllabusRow[] {
  return calendar.map((cal, idx) => ({
    week: cal.week,
    dateRangeText: cal.dateRangeText,
    courseProgress: SAMPLE_PROGRESS_MICROPROCESSOR[idx] || '',
    group: getCalculatedGroup(cal.week, pattern),
    assignment: SAMPLE_ASSIGNMENTS_MICROPROCESSOR[idx] || '',
    assessment: SAMPLE_ASSESSMENTS_MICROPROCESSOR[idx] || '',
    schoolNote: cal.schoolEvent,
    customNote: '',
  }));
}

export const SAMPLE_PRESETS: { label: string; plan: () => SyllabusPlan }[] = [
  {
    label: '資訊科 - 微處理機實習 (預設範本)',
    plan: () => ({
      meta: { ...DEFAULT_META },
      rows: createDefaultSyllabusRows(DEFAULT_CALENDAR_115_1, 'alternate-2'),
      updatedAt: Date.now(),
    }),
  },
  {
    label: '機械科 - 機械加工實習',
    plan: () => {
      const rows = DEFAULT_CALENDAR_115_1.map((cal, i) => {
        const progresses = [
          '工場工安衛生及機械加工安全手冊研讀',
          '車床構造、操作規程與量具（游標卡尺/分厘卡）使用',
          '端面車削、外徑粗車與精車實習',
          '階梯軸車削與公差尺寸控制練習',
          '中心鑽鑽孔與尾座頂心使用技巧',
          '外徑切槽與切斷作業安全實作',
          '第一次期中考（尺寸精度檢測與學科測驗）',
          '第一次段考檢討、成形刀具研磨與修磨實習',
          '車床車錐度實習（複式刀座法與尾座偏置法）',
          '外三角螺紋車削理論與刀具對刀實作',
          '公制標準螺紋車削與牙規檢測實作',
          '銑床構造說明、虎鉗校正與尋邊器實作',
          '六面體六面直角度銑削加工實作',
          '第二次期中考（加工精度量測與學科測驗）',
          '第二次段考檢討、立銑階梯槽銑削加工',
          '貫穿槽與鍵槽銑削實作練習',
          '分度頭原理與多邊形銑削實作',
          '乙級機械加工技能檢定工件製作練習（一）',
          '乙級機械加工技能檢定工件製作練習（二）',
          '綜合實習工件精度全尺寸量測與總評',
          '期末考、機械設備保養清潔、工安總體檢',
        ];
        return {
          week: cal.week,
          dateRangeText: cal.dateRangeText,
          courseProgress: progresses[i] || '',
          group: getCalculatedGroup(cal.week, 'alternate-2'),
          assignment: `實習工件第 ${i + 1} 號量測表`,
          assessment: cal.isHolidayOrExam ? '段考/測驗' : '工件尺寸公差考核',
          schoolNote: cal.schoolEvent,
          customNote: '',
        };
      });
      return {
        meta: {
          ...DEFAULT_META,
          id: 'machining-plan-115-1',
          className: '機械科二年乙班',
          courseName: '機械加工實習',
          mainTeacher: '張永發',
          coTeacher: '郭俊良',
          departmentDirector: '機械科主任',
        },
        rows,
        updatedAt: Date.now(),
      };
    },
  },
  {
    label: '空白進度表 (老師自行輸入進度)',
    plan: () => ({
      meta: {
        ...DEFAULT_META,
        id: `blank-plan-${Date.now()}`,
        className: '請選擇或填入班級',
        courseName: '請填入實習課程名稱',
        mainTeacher: '任課教師',
        coTeacher: '',
      },
      rows: DEFAULT_CALENDAR_115_1.map((cal) => ({
        week: cal.week,
        dateRangeText: cal.dateRangeText,
        courseProgress: '',
        group: getCalculatedGroup(cal.week, 'alternate-2'),
        assignment: '',
        assessment: '',
        schoolNote: cal.schoolEvent,
        customNote: '',
      })),
      updatedAt: Date.now(),
    }),
  },
];
