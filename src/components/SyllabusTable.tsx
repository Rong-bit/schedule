import React, { useState } from 'react';
import { CalendarWeek, SyllabusPlan, SyllabusRow } from '../types';
import { Sparkles, Printer, CheckCircle2, Eye, Edit3, Bookmark, AlertCircle, Wand2, CalendarDays } from 'lucide-react';
import { evaluateClassDay, alignRowsWithClassWeekday } from '../utils/scheduleRules';

interface SyllabusTableProps {
  plan: SyllabusPlan;
  calendar?: CalendarWeek[];
  onRowChange: (weekIndex: number, field: keyof SyllabusRow, value: string) => void;
  onBatchUpdateRows?: (updater: (rows: SyllabusRow[]) => SyllabusRow[]) => void;
  onOpenQuickFill?: () => void;
  onPrint?: () => void;
}

// 根據週次開始日期與設定的上課星期，計算該堂實習課的確切日期
export const getClassDateForWeek = (
  startDateStr?: string,
  dayOfWeek: string = '星期四'
): { dateText: string; shortDate: string; weekdayName: string } | null => {
  if (!startDateStr) return null;
  const dayMap: Record<string, number> = {
    '一': 0, '1': 0,
    '二': 1, '2': 1,
    '三': 2, '3': 2,
    '四': 3, '4': 3,
    '五': 4, '5': 4,
    '六': 5, '6': 5,
    '日': 6, '7': 6,
  };

  let dayOffset = 3; // 預設星期四
  for (const [char, offset] of Object.entries(dayMap)) {
    if (dayOfWeek.includes(char)) {
      dayOffset = offset;
      break;
    }
  }

  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return null;

  const target = new Date(start);
  target.setDate(start.getDate() + dayOffset);

  const m = target.getMonth() + 1;
  const d = target.getDate();
  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
  const w = dayNames[target.getDay()];

  return {
    dateText: `${m}/${d}(${w})`,
    shortDate: `${m}/${d}`,
    weekdayName: `星期${w}`,
  };
};

// 檢測備註或進度中是否包含「放假」關鍵字
export const isHolidayKeyword = (text?: string): boolean => {
  if (!text) return false;
  return /放假|連假|國定假日|彈性放假|彈性連假|補假|停課|休假|中秋|國慶|元旦|雙十/.test(text);
};

// 檢測備註或進度中是否包含「段考、定期考」關鍵字
export const isExamKeyword = (text?: string): boolean => {
  if (!text) return false;
  return /段考|定期考|定期考查|期中考|期末考|模擬考|學科測驗|實習考查|技能檢定/.test(text);
};

// 根據週次、上課星期與行事曆備註，精準計算當日是否放假或段考，並產生標準進度建議
export const getAutoProgressSuggestion = (
  row: SyllabusRow,
  calWeek?: CalendarWeek,
  dayOfWeek: string = '星期四'
): { text: string; assessmentText?: string; isExam: boolean; isHoliday: boolean } | null => {
  const weekData = calWeek || {
    week: row.week,
    dateRangeText: row.dateRangeText,
    schoolEvent: row.schoolNote,
  };
  const evalResult = evaluateClassDay(weekData, dayOfWeek);

  if (evalResult.isHoliday) {
    return {
      text: evalResult.suggestedProgress,
      assessmentText: evalResult.suggestedAssessment,
      isExam: false,
      isHoliday: true,
    };
  }

  if (evalResult.isExam) {
    return {
      text: evalResult.suggestedProgress,
      assessmentText: evalResult.suggestedAssessment,
      isExam: true,
      isHoliday: false,
    };
  }

  return null;
};

export const SyllabusTable: React.FC<SyllabusTableProps> = ({
  plan,
  calendar,
  onRowChange,
  onBatchUpdateRows,
  onOpenQuickFill,
  onPrint,
}) => {
  const { meta, rows } = plan;
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [highlightRedMode, setHighlightRedMode] = useState<boolean>(true); // 預設開啟紅字標註模式

  // Calculate completion progress
  const filledCount = rows.filter((r) => r.courseProgress && r.courseProgress.trim().length > 0).length;
  const progressPercent = Math.round((filledCount / rows.length) * 100);

  // 統計放假與段考週數
  const holidayWeeksCount = rows.filter((r) => isHolidayKeyword(r.schoolNote) || isHolidayKeyword(r.courseProgress)).length;
  const examWeeksCount = rows.filter(
    (r) => isExamKeyword(r.schoolNote) || isExamKeyword(r.courseProgress) || r.week === 7 || r.week === 14 || r.week === 21
  ).length;

  // 一鍵自動將行事曆備註之放假與定期考依上課日帶入課程進度（以紅字呈現）
  const handleAutoFillHolidaysAndExams = () => {
    const day = meta.courseDayOfWeek || '星期四';
    if (onBatchUpdateRows) {
      onBatchUpdateRows((prevRows) =>
        alignRowsWithClassWeekday(prevRows, calendar || [], day)
      );
    } else {
      const aligned = alignRowsWithClassWeekday(rows, calendar || [], day);
      aligned.forEach((row, idx) => {
        onRowChange(idx, 'courseProgress', row.courseProgress);
        onRowChange(idx, 'assessment', row.assessment);
        onRowChange(idx, 'assignment', row.assignment);
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Screen-only Document Action & Status Toolbar */}
      <div className="no-print bg-white rounded-xl border border-slate-200/90 shadow-xs px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Progress Summary Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="font-bold text-slate-800 text-xs sm:text-sm">
              進度填寫狀況
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
            <span className="text-slate-500">已規劃：</span>
            <span className="font-bold text-blue-700 font-mono">{filledCount} / {rows.length} 週</span>
            <div className="w-16 sm:w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden ml-1">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 font-mono">
              {progressPercent}%
            </span>
          </div>

          {progressPercent === 100 && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              全學期 21 週已完成
            </span>
          )}
        </div>

        {/* Right: View mode toggle, Red highlight toggle, and Quick Print */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Red Text Highlighting for Holidays & Exams */}
          <button
            type="button"
            onClick={() => setHighlightRedMode(!highlightRedMode)}
            title="切換放假與定期考查紅字標註顯示"
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
              highlightRedMode
                ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 shadow-2xs'
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${highlightRedMode ? 'bg-red-600 animate-pulse' : 'bg-slate-400'}`}></span>
            <span>紅字標註：{highlightRedMode ? '已啟用' : '已關閉'}</span>
          </button>

          {/* Quick Auto-fill Holidays & Exams */}
          <button
            type="button"
            onClick={handleAutoFillHolidaysAndExams}
            title={`一鍵將符合「${meta.courseDayOfWeek || '星期四'}」的放假與定期考查自動帶入課程進度`}
            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-colors shadow-2xs"
          >
            <Wand2 className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">依{meta.courseDayOfWeek || '星期四'}對齊放假與段考</span>
            <span className="sm:hidden">依{meta.courseDayOfWeek ? meta.courseDayOfWeek.slice(-1) : '四'}對齊</span>
          </button>

          {/* Mode Switcher */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setIsPreviewMode(false)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md transition-all ${
                !isPreviewMode
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>編輯模式</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPreviewMode(true)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md transition-all ${
                isPreviewMode
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>文件預覽</span>
            </button>
          </div>

          {onOpenQuickFill && (
            <button
              type="button"
              onClick={onOpenQuickFill}
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">智慧填寫</span>
            </button>
          )}

          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-1 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>列印 A4</span>
            </button>
          )}
        </div>
      </div>

      {/* Realistic Paper Sheet Container */}
      <div className="paper-sheet rounded-2xl border border-slate-200/90 p-5 sm:p-8 lg:p-10 max-w-5xl mx-auto print:border-none print:p-0 print:shadow-none print:max-w-none">
        
        {/* Printable Official Document Header */}
        <div className="text-center mb-5 print:mb-3 relative">
          <div className="inline-block relative">
            <h2 className="text-xl sm:text-2xl font-bold tracking-wider text-slate-900 print:text-black font-serif">
              {meta.schoolName || meta.schoolShortName}
            </h2>
            <h1 className="text-lg sm:text-xl font-bold tracking-normal text-slate-900 print:text-black mt-1 font-sans">
              {meta.academicYear} 學年度第 {meta.semester} 學期實習教學及作業預定進度表
            </h1>
          </div>
        </div>

        {/* Official Form Metadata Bar */}
        <div className="border border-slate-300 print:border-black text-xs sm:text-[13px] mb-[-1px] font-medium text-slate-900 print:text-black bg-slate-50/70 print:bg-transparent rounded-t-lg print:rounded-none overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 print:divide-black">
            <div className="p-2.5 flex items-center gap-1.5">
              <span className="font-bold text-slate-700 print:text-black whitespace-nowrap">授課班級：</span>
              <span className="font-semibold text-blue-900 print:text-black">{meta.className || '未設定'}</span>
            </div>
            <div className="p-2.5 flex items-center gap-1.5">
              <span className="font-bold text-slate-700 print:text-black whitespace-nowrap">實習課程名稱：</span>
              <span className="font-semibold text-blue-900 print:text-black">{meta.courseName || '未設定'}</span>
            </div>
            <div className="p-2.5 flex items-center gap-1.5">
              <span className="font-bold text-slate-700 print:text-black whitespace-nowrap">上課時間：</span>
              <span className="font-bold text-blue-900 print:text-black">
                {meta.courseDayOfWeek || '星期四'}
                {meta.coursePeriod && (
                  <span className="font-normal text-slate-700 print:text-black">（{meta.coursePeriod}）</span>
                )}
              </span>
            </div>
            <div className="p-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-700 print:text-black whitespace-nowrap">每週節數：</span>
                <span className="font-semibold">{meta.weeklyHours} 節</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-700 print:text-black whitespace-nowrap">學分：</span>
                <span className="font-semibold">{meta.credits}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 print:divide-black border-t border-slate-300 print:border-black">
            <div className="p-2.5 flex items-center gap-1.5">
              <span className="font-bold text-slate-700 print:text-black whitespace-nowrap">實習任課教師：</span>
              <span className="font-semibold text-slate-900 print:text-black">{meta.mainTeacher || '無'}</span>
            </div>
            <div className="p-2.5 flex items-center gap-1.5">
              <span className="font-bold text-slate-700 print:text-black whitespace-nowrap">分組任課教師：</span>
              <span className="text-slate-800 print:text-black">{meta.coTeacher || '無'}</span>
            </div>
            <div className="p-2.5 flex items-center gap-1.5">
              <span className="font-bold text-slate-700 print:text-black whitespace-nowrap">填表日期：</span>
              <span className="text-slate-800 print:text-black font-mono">{meta.formDate}</span>
            </div>
            <div className="p-2.5 flex items-center gap-1.5">
              <span className="font-bold text-slate-700 print:text-black whitespace-nowrap">科主任簽章：</span>
              <span className="text-slate-400 print:text-transparent">（核章）</span>
            </div>
          </div>
        </div>

        {/* Main Syllabus Table */}
        <div className="overflow-x-auto">
          <table className="school-table w-full border-collapse border border-slate-300 print:border-black text-left text-xs sm:text-[13px]">
            <thead>
              <tr className="bg-slate-100/90 print:bg-slate-200 text-slate-800 print:text-black font-bold text-center border-b border-slate-300 print:border-black">
                <th className="py-2.5 px-2 w-[5%] min-w-[38px] border border-slate-300 print:border-black">
                  週次
                </th>
                <th className="py-2.5 px-2 w-[16%] min-w-[125px] border border-slate-300 print:border-black">
                  起訖日期
                  <span className="block text-[10px] font-normal text-slate-500 print:hidden">（行事曆自動）</span>
                </th>
                <th className="py-2.5 px-3 w-[36%] min-w-[240px] border border-slate-300 print:border-black text-left">
                  預定實習課程進度
                  <span className="text-[10px] font-semibold text-blue-700 ml-1.5 print:hidden">【老師填寫】</span>
                </th>
                <th className="py-2.5 px-2 w-[8%] min-w-[65px] border border-slate-300 print:border-black">
                  分組
                </th>
                <th className="py-2.5 px-2 w-[14%] min-w-[110px] border border-slate-300 print:border-black">
                  指定作業／成品
                </th>
                <th className="py-2.5 px-2 w-[11%] min-w-[95px] border border-slate-300 print:border-black">
                  日常考查／評量
                </th>
                <th className="py-2.5 px-2.5 w-[14%] min-w-[120px] border border-slate-300 print:border-black text-left">
                  備註（學校重要行事）
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const isExamWeek = row.week === 7 || row.week === 14 || row.week === 21;
                const hasSchoolNote = Boolean(row.schoolNote);

                // 計算該週實習課的上課日與放假/段考命中評估
                const calWeek = calendar?.find((c) => c.week === row.week);
                const evalResult = evaluateClassDay(
                  calWeek || { week: row.week, dateRangeText: row.dateRangeText, schoolEvent: row.schoolNote },
                  meta.courseDayOfWeek || '星期四'
                );

                const isNoteHoliday = isHolidayKeyword(row.schoolNote);
                const isNoteExam = isExamKeyword(row.schoolNote) || isExamWeek;
                const isProgressHoliday = isHolidayKeyword(row.courseProgress);
                const isProgressExam = isExamKeyword(row.courseProgress);

                const isHolidayRow = evalResult.isHoliday || isProgressHoliday;
                const isExamRow = evalResult.isExam || isProgressExam;
                const shouldShowRed = highlightRedMode && (isHolidayRow || isExamRow);
                const suggestion = getAutoProgressSuggestion(row, calWeek, meta.courseDayOfWeek || '星期四');

                return (
                  <tr
                    key={`syllabus-row-${row.week}`}
                    className={`border-b border-slate-200 print:border-black transition-colors print:hover:bg-transparent ${
                      evalResult.isHoliday
                        ? 'bg-rose-50/40 hover:bg-rose-50/70 print:bg-transparent'
                        : evalResult.isExam
                        ? 'bg-purple-50/40 hover:bg-purple-50/70 print:bg-transparent'
                        : isHolidayRow
                        ? 'bg-red-50/30 hover:bg-red-50/60 print:bg-transparent'
                        : isExamWeek
                        ? 'bg-amber-50/50 hover:bg-amber-100/40 print:bg-transparent'
                        : index % 2 === 1
                        ? 'bg-slate-50/30 hover:bg-blue-50/30 print:bg-transparent'
                        : 'bg-white hover:bg-blue-50/30 print:bg-transparent'
                    }`}
                  >
                    {/* A欄: 週次 */}
                    <td className="py-1.5 px-1 text-center font-bold border border-slate-200 print:border-black text-slate-900 print:text-black">
                      <span className="inline-block font-mono">{row.week}</span>
                    </td>

                    {/* B欄: 起訖日期（唯讀，公式從行事曆抓取，並標示該週實習課實際日期） */}
                    <td className="py-1.5 px-2 text-center whitespace-nowrap border border-slate-200 print:border-black font-mono text-xs text-slate-700 print:text-black">
                      <div className="font-medium text-slate-800 print:text-black">{row.dateRangeText}</div>
                      <div className="mt-0.5">
                        {evalResult.isHoliday ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 print:border-none print:bg-transparent print:text-black">
                            <span>🎌 上課日：{evalResult.dateText}（放假）</span>
                          </span>
                        ) : evalResult.isExam ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200 print:border-none print:bg-transparent print:text-black">
                            <span>📝 上課日：{evalResult.dateText}（段考）</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-800 border border-blue-200/60 print:border-none print:bg-transparent print:text-black">
                            <CalendarDays className="w-2.5 h-2.5 print:hidden text-blue-600" />
                            <span>上課日：{evalResult.dateText}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* C欄: 預定實習課程進度（開放輸入，放假與段考支援紅字標註） */}
                    <td className="py-1 px-2 border border-slate-200 print:border-black align-top">
                      {isPreviewMode ? (
                        <div
                          className={`py-1 px-1 text-xs sm:text-[13px] whitespace-pre-wrap leading-relaxed min-h-[28px] ${
                            shouldShowRed
                              ? 'text-red-600 print-red font-bold'
                              : 'text-slate-900 print:text-black'
                          }`}
                        >
                          {row.courseProgress || (
                            suggestion ? (
                              <span className="text-red-500/80 font-semibold print:text-red-600 italic">
                                【{suggestion.isHoliday ? '放假' : '定期考'}】{suggestion.text}
                              </span>
                            ) : (
                              <span className="text-slate-300 italic print:hidden">（未填寫）</span>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <textarea
                            id={`input-progress-${row.week}`}
                            aria-label={`第 ${row.week} 週 預定實習課程進度`}
                            rows={1}
                            value={row.courseProgress}
                            onChange={(e) => onRowChange(index, 'courseProgress', e.target.value)}
                            placeholder={
                              suggestion
                                ? `依${meta.courseDayOfWeek || '星期四'}建議：${suggestion.text}`
                                : isExamWeek
                                ? row.week === 7
                                  ? '例如：第 1 次期中考（技能實作評量與學科測驗）'
                                  : row.week === 14
                                  ? '例如：第 2 次期中考（成品驗收與學科測驗）'
                                  : '例如：期末考查（實習總驗收與工安保養）'
                                : `請輸入第 ${row.week} 週實習單元或進度`
                            }
                            className={`print-clean w-full min-h-[30px] sm:min-h-[28px] px-2 py-1 text-xs sm:text-[13px] border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white rounded-md transition-all resize-y leading-relaxed focus:outline-hidden ${
                              shouldShowRed
                                ? 'text-red-600 print-red font-bold placeholder:text-red-300'
                                : 'text-slate-900'
                            }`}
                          />

                          {/* 依上課日檢測放假或段考，若尚未填入對應內容，提供一鍵快速帶入晶片鈕 */}
                          {suggestion && row.courseProgress !== suggestion.text && (
                            <button
                              type="button"
                              onClick={() => {
                                onRowChange(index, 'courseProgress', suggestion.text);
                                if (suggestion.assessmentText) {
                                  onRowChange(index, 'assessment', suggestion.assessmentText);
                                }
                                if (suggestion.isHoliday) {
                                  onRowChange(index, 'assignment', '無');
                                }
                              }}
                              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-bold transition-colors shadow-2xs print:hidden cursor-pointer border ${
                                suggestion.isHoliday
                                  ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200'
                                  : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200'
                              }`}
                              title={`點擊依「${meta.courseDayOfWeek || '星期四'}」上課日帶入紅字進度`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${suggestion.isHoliday ? 'bg-rose-600' : 'bg-purple-600'}`}></span>
                              <span>
                                帶入{suggestion.isHoliday ? '放假' : '段考'}：「{suggestion.text.length > 16 ? suggestion.text.slice(0, 16) + '...' : suggestion.text}」
                              </span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* D欄: 分組組別 */}
                    <td className="py-1 px-1.5 text-center border border-slate-200 print:border-black align-middle">
                      {isPreviewMode ? (
                        <span className="font-semibold text-xs text-slate-800 print:text-black font-mono">
                          {row.group}
                        </span>
                      ) : (
                        <select
                          id={`select-group-${row.week}`}
                          aria-label={`第 ${row.week} 週 分組組別`}
                          value={row.group}
                          onChange={(e) => onRowChange(index, 'group', e.target.value)}
                          className={`print-clean w-full text-center text-xs font-semibold py-1 px-1 border rounded-md cursor-pointer transition-colors focus:outline-hidden ${
                            row.group === meta.groupA_name
                              ? 'bg-blue-50/80 text-blue-800 border-blue-200 hover:bg-blue-100'
                              : row.group === meta.groupB_name
                              ? 'bg-purple-50/80 text-purple-800 border-purple-200 hover:bg-purple-100'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <option value={meta.groupA_name}>{meta.groupA_name}</option>
                          <option value={meta.groupB_name}>{meta.groupB_name}</option>
                          <option value="全班">全班</option>
                          <option value="—">—</option>
                        </select>
                      )}
                    </td>

                    {/* E欄: 指定作業 / 實習成品 */}
                    <td className="py-1 px-1.5 border border-slate-200 print:border-black align-top">
                      {isPreviewMode ? (
                        <div className="py-1 px-1 text-xs text-slate-900 print:text-black min-h-[26px]">
                          {row.assignment}
                        </div>
                      ) : (
                        <input
                          id={`input-assignment-${row.week}`}
                          aria-label={`第 ${row.week} 週 指定作業／成品`}
                          type="text"
                          value={row.assignment}
                          onChange={(e) => onRowChange(index, 'assignment', e.target.value)}
                          placeholder="例如：實習報告"
                          className="print-clean w-full px-2 py-1 text-xs text-slate-900 border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-md transition-all focus:outline-hidden"
                        />
                      )}
                    </td>

                    {/* F欄: 日常考查 / 評量方式 */}
                    <td className="py-1 px-1.5 border border-slate-200 print:border-black align-top">
                      {isPreviewMode ? (
                        <div className="py-1 px-1 text-xs text-slate-900 print:text-black min-h-[26px]">
                          {row.assessment}
                        </div>
                      ) : (
                        <input
                          id={`input-assessment-${row.week}`}
                          aria-label={`第 ${row.week} 週 日常考查／評量方式`}
                          type="text"
                          value={row.assessment}
                          onChange={(e) => onRowChange(index, 'assessment', e.target.value)}
                          placeholder={isExamWeek ? '段考評量' : '操作考查'}
                          className="print-clean w-full px-2 py-1 text-xs text-slate-900 border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-md transition-all focus:outline-hidden"
                        />
                      )}
                    </td>

                    {/* G欄: 備註（學校重要行事 + 教師自訂補充） */}
                    <td className="py-1 px-2 border border-slate-200 print:border-black align-top text-xs">
                      {/* Auto-filled School Event from Calendar */}
                      {hasSchoolNote && (
                        <div
                          className={`mb-0.5 text-[11px] sm:text-xs font-semibold ${
                            highlightRedMode && isNoteHoliday
                              ? 'text-red-600 print-red font-bold'
                              : highlightRedMode && isNoteExam
                              ? 'text-amber-800 print-red font-bold'
                              : 'text-slate-900 print:text-black'
                          }`}
                        >
                          {row.schoolNote}
                        </div>
                      )}

                      {/* Optional Teacher Custom Note */}
                      {isPreviewMode ? (
                        row.customNote ? (
                          <div className="text-[11px] text-slate-600 print:text-black">
                            {row.customNote}
                          </div>
                        ) : null
                      ) : (
                        <input
                          id={`input-custom-note-${row.week}`}
                          aria-label={`第 ${row.week} 週 教師補充備註`}
                          type="text"
                          value={row.customNote || ''}
                          onChange={(e) => onRowChange(index, 'customNote', e.target.value)}
                          placeholder={hasSchoolNote ? '+ 教師補充備註' : '備註說明'}
                          className="print-clean w-full text-[11px] text-slate-700 print:text-black border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-md px-1.5 py-0.5 focus:outline-hidden transition-all"
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Official Signatures Section (Footer) */}
        <div className="print-avoid-break mt-6 pt-5 border-t border-slate-300 print:border-black text-xs sm:text-[13px] font-medium text-slate-900 print:text-black">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-4">
            <div className="space-y-6">
              <div className="font-bold text-slate-800 print:text-black">實習任課教師簽章：</div>
              <div className="border-b border-dashed border-slate-400 w-36 print:border-black"></div>
            </div>
            <div className="space-y-6">
              <div className="font-bold text-slate-800 print:text-black">分組任課教師簽章：</div>
              <div className="border-b border-dashed border-slate-400 w-36 print:border-black"></div>
            </div>
            <div className="space-y-6">
              <div className="font-bold text-slate-800 print:text-black">科主任核章：</div>
              <div className="border-b border-dashed border-slate-400 w-36 print:border-black"></div>
            </div>
            <div className="space-y-6">
              <div className="font-bold text-slate-800 print:text-black">實習處／教務處核章：</div>
              <div className="border-b border-dashed border-slate-400 w-36 print:border-black"></div>
            </div>
          </div>

          <div className="mt-5 text-[11px] text-slate-500 print:text-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 border-t border-slate-200/80 print:border-none pt-3">
            <span>
              說明：1. 本進度表請於每學期開學前一週或依教學組規定日期填妥送交。 2. 實習課程如採分組輪調教學，請依分組實施計畫填寫。
            </span>
            <span className="font-mono text-slate-600 print:text-black font-semibold whitespace-nowrap">
              第 1 頁 / 共 1 頁
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
