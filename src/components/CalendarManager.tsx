import React, { useMemo, useState } from 'react';
import { CalendarWeek } from '../types';
import {
  Calendar,
  RotateCcw,
  Download,
  HelpCircle,
  CloudDownload,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { DEFAULT_CALENDAR_115_1 } from '../data/defaultCalendar';
import {
  SCHOOL_GOOGLE_CALENDARS,
  SCHOOL_GOOGLE_CALENDAR_EMBED_URL,
} from '../data/schoolGoogleCalendars';
import { downloadCSV, generateCalendarTSV } from '../utils/exportUtils';
import { syncSchoolEventsFromGoogleCalendar } from '../utils/googleCalendarSync';

interface CalendarManagerProps {
  calendar: CalendarWeek[];
  onUpdateCalendar: (updated: CalendarWeek[]) => void;
}

export const CalendarManager: React.FC<CalendarManagerProps> = ({
  calendar,
  onUpdateCalendar,
}) => {
  const [baseDate, setBaseDate] = useState('2026-08-31');
  const defaultSelectedIds = useMemo(
    () => SCHOOL_GOOGLE_CALENDARS.filter((c) => c.defaultSelected).map((c) => c.id),
    []
  );
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>(defaultSelectedIds);
  const [importantOnly, setImportantOnly] = useState(true);
  const [syncMode, setSyncMode] = useState<'overwrite' | 'merge'>('overwrite');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Helper to format date into "m/d(週幾)"
  const formatDateWithDay = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const days = ['日', '一', '二', '三', '四', '五', '六'];
      const month = d.getMonth() + 1;
      const date = d.getDate();
      const day = days[d.getDay()];
      return `${month}/${date}(${day})`;
    } catch {
      return dateStr;
    }
  };

  const handleRowChange = (index: number, field: keyof CalendarWeek, value: any) => {
    const updated = [...calendar];
    const row = { ...updated[index], [field]: value };

    // If start or end date changed, auto recalculate dateRangeText
    if (field === 'startDate' || field === 'endDate') {
      const startText = formatDateWithDay(field === 'startDate' ? value : row.startDate);
      const endText = formatDateWithDay(field === 'endDate' ? value : row.endDate);
      row.dateRangeText = `${startText}-${endText}`;
    }

    updated[index] = row;
    onUpdateCalendar(updated);
  };

  // Quick append a tag to row's schoolEvent
  const handleQuickAddEventTag = (index: number, tagText: string) => {
    const updated = [...calendar];
    const current = updated[index].schoolEvent || '';
    if (current.includes(tagText)) return;
    updated[index].schoolEvent = current ? `${current}；${tagText}` : tagText;
    onUpdateCalendar(updated);
  };

  // One-click generate all 21 weeks from a base Monday
  const handleAutoGenerateWeeks = () => {
    const start = new Date(baseDate);
    if (isNaN(start.getTime())) {
      alert('請先輸入正確的第 1 週開學週一日期');
      return;
    }

    const updated = calendar.map((cal, idx) => {
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() + idx * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 4); // Friday

      const startISO = weekStart.toISOString().split('T')[0];
      const endISO = weekEnd.toISOString().split('T')[0];
      const rangeText = `${formatDateWithDay(startISO)}-${formatDateWithDay(endISO)}`;

      return {
        ...cal,
        startDate: startISO,
        endDate: endISO,
        dateRangeText: rangeText,
      };
    });

    onUpdateCalendar(updated);
  };

  const handleResetToOfficial115_1 = () => {
    if (window.confirm('確定要將行事曆重設為中正高工 115-1 官方預設行事曆嗎？')) {
      onUpdateCalendar(DEFAULT_CALENDAR_115_1);
    }
  };

  const handleExportCSV = () => {
    const tsv = generateCalendarTSV(calendar);
    const csv = tsv.replace(/\t/g, ',');
    downloadCSV('中正高工_115-1_行事曆主檔.csv', csv);
  };

  const toggleCalendarSource = (id: string) => {
    setSelectedCalendarIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSyncFromGoogle = async () => {
    if (selectedCalendarIds.length === 0) {
      setSyncMessage('請至少勾選一個日曆來源');
      return;
    }

    const confirmText =
      syncMode === 'overwrite'
        ? '將以 Google 日曆行程「覆蓋」各週學校行事備註，並同步到進度表備註欄。確定繼續？'
        : '將把 Google 日曆行程「合併」到各週現有備註，並同步到進度表備註欄。確定繼續？';
    if (!window.confirm(confirmText)) return;

    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const result = await syncSchoolEventsFromGoogleCalendar(calendar, {
        calendarIds: selectedCalendarIds,
        importantOnly,
        mode: syncMode,
      });
      onUpdateCalendar(result.calendar);

      const errText =
        result.errors.length > 0 ? `（部分來源失敗：${result.errors.join('；')}）` : '';
      setSyncMessage(
        `已同步 ${result.eventCount} 筆行程至 ${result.weekHitCount} 週備註${errText}`
      );
    } catch (e) {
      setSyncMessage(e instanceof Error ? e.message : '同步失敗，請稍後再試');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-7 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md font-mono">
              工作表 1：行事曆主檔資料庫
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-sans">
              全學期行事曆主檔（115-1 共 21 週）
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            此工作表相當於 Google 試算表中的「行事曆主檔」。教學進度表中的「起訖日期」與「學校行事備註」均直接與此連動。
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <button
            id="reset-calendar-btn"
            type="button"
            onClick={handleResetToOfficial115_1}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition-all shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>重設官方預設</span>
          </button>

          <button
            id="export-calendar-csv-btn"
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>匯出行事曆 CSV</span>
          </button>
        </div>
      </div>

      {/* Auto-generator tools bar */}
      <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Calendar className="w-4 h-4 text-blue-700 shrink-0" />
            <span>自動推算 21 週：</span>
          </div>
          <span className="text-slate-600">開學週一</span>
          <input
            id="base-date-input"
            aria-label="第 1 週開學週一日期"
            type="date"
            value={baseDate}
            onChange={(e) => setBaseDate(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden transition-colors"
          />
          <button
            id="auto-calc-calendar-btn"
            type="button"
            onClick={handleAutoGenerateWeeks}
            className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-all shadow-2xs"
          >
            一鍵重新排定全學期日期
          </button>
        </div>
        <div className="text-[11px] text-slate-500 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>修改後，進度表起訖日期與備註將同步更新</span>
        </div>
      </div>

      {/* Google Calendar sync */}
      <div className="p-4 bg-indigo-50/50 border border-indigo-200/70 rounded-xl space-y-3 text-xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <CloudDownload className="w-4 h-4 text-indigo-700 shrink-0" />
              <span>同步中正高工 Google 日曆 → 備註欄</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed max-w-3xl">
              讀取學校公開行事曆（教務處、學務處、實習處、國定假日等），依各週起訖日期寫入「學校行事備註」，並自動帶入教學進度表 G 欄。線上版使用網站更新時下載的日曆快取；本機開發則即時抓取。
            </p>
          </div>
          <a
            href={SCHOOL_GOOGLE_CALENDAR_EMBED_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-800 hover:text-indigo-950 shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            開啟原始日曆
          </a>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {SCHOOL_GOOGLE_CALENDARS.map((src) => {
            const checked = selectedCalendarIds.includes(src.id);
            return (
              <label
                key={src.id}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border cursor-pointer transition-colors ${
                  checked
                    ? 'bg-white border-indigo-300 text-indigo-950'
                    : 'bg-transparent border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  className="accent-indigo-700"
                  checked={checked}
                  onChange={() => toggleCalendarSource(src.id)}
                />
                <span className="font-semibold">{src.label}</span>
              </label>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-700">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                className="accent-indigo-700"
                checked={importantOnly}
                onChange={(e) => setImportantOnly(e.target.checked)}
              />
              <span>僅同步重要行事（段考／放假／開學／校慶等）</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="gcal-sync-mode"
                className="accent-indigo-700"
                checked={syncMode === 'overwrite'}
                onChange={() => setSyncMode('overwrite')}
              />
              <span>覆蓋備註</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="gcal-sync-mode"
                className="accent-indigo-700"
                checked={syncMode === 'merge'}
                onChange={() => setSyncMode('merge')}
              />
              <span>合併到現有備註</span>
            </label>
          </div>

          <button
            id="sync-google-calendar-btn"
            type="button"
            disabled={isSyncing}
            onClick={handleSyncFromGoogle}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 text-white font-semibold transition-all shadow-2xs shrink-0"
          >
            {isSyncing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CloudDownload className="w-3.5 h-3.5" />
            )}
            <span>{isSyncing ? '同步中…' : '立即同步備註'}</span>
          </button>
        </div>

        {syncMessage && (
          <p className="text-[11px] text-indigo-950 bg-white/80 border border-indigo-100 rounded-lg px-3 py-2">
            {syncMessage}
          </p>
        )}
      </div>

      {/* Editable Modern Table */}
      <div className="overflow-x-auto border border-slate-200/90 rounded-xl">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
              <th className="py-3 px-3 w-[8%] text-center">
                週次
              </th>
              <th className="py-3 px-3 w-[18%]">
                開始日期 (週一)
              </th>
              <th className="py-3 px-3 w-[18%]">
                結束日期 (週五)
              </th>
              <th className="py-3 px-3 w-[22%]">
                起訖區間（進度表公式引用）
              </th>
              <th className="py-3 px-3 w-[34%]">
                學校行事備註（進度表備註欄自動帶入）
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {calendar.map((cal, idx) => {
              const isExam = cal.schoolEvent.includes('段考') || cal.schoolEvent.includes('期末考');
              const isHoliday = cal.schoolEvent.includes('放假') || cal.schoolEvent.includes('連假');
              return (
                <tr
                  key={`cal-row-${cal.week}`}
                  className={`hover:bg-blue-50/20 transition-colors ${
                    isExam
                      ? 'bg-amber-50/40'
                      : isHoliday
                      ? 'bg-rose-50/30'
                      : idx % 2 === 1
                      ? 'bg-slate-50/30'
                      : 'bg-white'
                  }`}
                >
                  <td className="py-2 px-3 text-center font-bold text-slate-800">
                    <span className="font-mono">第 {cal.week} 週</span>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      id={`cal-start-${cal.week}`}
                      aria-label={`第 ${cal.week} 週 開始日期`}
                      type="date"
                      value={cal.startDate}
                      onChange={(e) => handleRowChange(idx, 'startDate', e.target.value)}
                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden text-xs transition-colors"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      id={`cal-end-${cal.week}`}
                      aria-label={`第 ${cal.week} 週 結束日期`}
                      type="date"
                      value={cal.endDate}
                      onChange={(e) => handleRowChange(idx, 'endDate', e.target.value)}
                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden text-xs transition-colors"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      id={`cal-range-${cal.week}`}
                      aria-label={`第 ${cal.week} 週 日期區間文字`}
                      type="text"
                      value={cal.dateRangeText}
                      onChange={(e) => handleRowChange(idx, 'dateRangeText', e.target.value)}
                      className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden text-xs"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <div className="space-y-1">
                      <input
                        id={`cal-event-${cal.week}`}
                        aria-label={`第 ${cal.week} 週 學校行事與備註`}
                        type="text"
                        value={cal.schoolEvent}
                        onChange={(e) => handleRowChange(idx, 'schoolEvent', e.target.value)}
                        placeholder="填寫開學、段考、放假或重大活動"
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden text-xs transition-colors"
                      />
                      {/* Quick event chip shortcuts */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {cal.week === 7 && !cal.schoolEvent.includes('第一次期中考') && (
                          <button
                            type="button"
                            onClick={() => handleQuickAddEventTag(idx, '第一次期中考')}
                            className="text-[10px] bg-amber-50 text-amber-800 hover:bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200"
                          >
                            + 第一次期中考
                          </button>
                        )}
                        {cal.week === 14 && !cal.schoolEvent.includes('第二次期中考') && (
                          <button
                            type="button"
                            onClick={() => handleQuickAddEventTag(idx, '第二次期中考')}
                            className="text-[10px] bg-amber-50 text-amber-800 hover:bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200"
                          >
                            + 第二次期中考
                          </button>
                        )}
                        {cal.week === 21 && !cal.schoolEvent.includes('期末考') && (
                          <button
                            type="button"
                            onClick={() => handleQuickAddEventTag(idx, '期末考查評量')}
                            className="text-[10px] bg-amber-50 text-amber-800 hover:bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200"
                          >
                            + 期末考查評量
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
