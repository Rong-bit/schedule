import React, { useState } from 'react';
import { FileSpreadsheet, X, Copy, Check, Download, ExternalLink, Code } from 'lucide-react';
import { CalendarWeek, SyllabusPlan } from '../types';
import { copyToClipboard, downloadCSV, generateCalendarTSV, generateSyllabusTSV } from '../utils/exportUtils';

interface ExportSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SyllabusPlan;
  calendar: CalendarWeek[];
}

export const ExportSheetsModal: React.FC<ExportSheetsModalProps> = ({
  isOpen,
  onClose,
  plan,
  calendar,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopySyllabusValues = async () => {
    const text = generateSyllabusTSV(plan, false);
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedType('syllabus-values');
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  const handleCopySyllabusFormulas = async () => {
    const text = generateSyllabusTSV(plan, true);
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedType('syllabus-formulas');
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  const handleCopyCalendar = async () => {
    const text = generateCalendarTSV(calendar);
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedType('calendar');
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  const handleDownloadSyllabusCSV = () => {
    const tsv = generateSyllabusTSV(plan, false);
    const csv = tsv.replace(/\t/g, ',');
    downloadCSV(`${plan.meta.className}_${plan.meta.courseName}_教學進度表.csv`, csv);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base font-sans">
                Google 試算表（Google Sheets）匯出與公式範本
              </h3>
              <p className="text-xs text-slate-500">
                可一鍵複製文字並直接貼入 Google Sheets，或查看自動帶出公式
              </p>
            </div>
          </div>
          <button
            id="close-export-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Quick Copy Section */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <span>🚀 一鍵複製至 Google Sheets / Excel</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Copy Processed TSV */}
              <div className="p-4 border border-slate-200 hover:border-emerald-600 rounded-xl bg-slate-50/60 flex flex-col justify-between gap-3 transition-colors">
                <div>
                  <div className="font-bold text-slate-900">複製「教學進度表」（完整數值）</div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    複製後直接在 Google Sheets 或 Excel 空白工作表 A1 按下 <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Ctrl+V</kbd>，立刻排好所有欄位與資料！
                  </p>
                </div>
                <button
                  id="copy-syllabus-values-btn"
                  type="button"
                  onClick={handleCopySyllabusValues}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-2xs transition-colors"
                >
                  {copiedType === 'syllabus-values' ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>已成功複製！可直接貼上</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>複製教學進度表 TSV</span>
                    </>
                  )}
                </button>
              </div>

              {/* Copy Calendar TSV */}
              <div className="p-4 border border-slate-200 hover:border-emerald-600 rounded-xl bg-slate-50/60 flex flex-col justify-between gap-3 transition-colors">
                <div>
                  <div className="font-bold text-slate-900">複製「行事曆主檔」資料庫</div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    含週次、開始日期、結束日期與學校行事。可貼至命名為「行事曆主檔」的分頁中。
                  </p>
                </div>
                <button
                  id="copy-calendar-btn"
                  type="button"
                  onClick={handleCopyCalendar}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition-colors shadow-2xs"
                >
                  {copiedType === 'calendar' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>已成功複製行事曆！</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>複製行事曆主檔 TSV</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button
                id="copy-formulas-btn"
                type="button"
                onClick={handleCopySyllabusFormulas}
                className="text-xs text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors"
              >
                <Code className="w-3.5 h-3.5" />
                <span>
                  {copiedType === 'syllabus-formulas' ? '已複製含 VLOOKUP 公式版本！' : '複製含 VLOOKUP 公式版本'}
                </span>
              </button>
              <span className="text-slate-300">|</span>
              <button
                id="download-csv-btn"
                type="button"
                onClick={handleDownloadSyllabusCSV}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下載教學進度表 CSV</span>
              </button>
            </div>
          </div>

          {/* Formula Reference (Matches User Prompt) */}
          <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-3 font-mono text-[11px]">
            <div className="text-slate-300 font-sans font-bold flex items-center gap-1.5 text-xs">
              <span>📌 Google 試算表 核心自動帶出公式參考：</span>
            </div>

            <div className="space-y-2 border-t border-slate-800 pt-2">
              <div>
                <span className="text-slate-400 font-sans">1. 起訖日期（B欄，自動從行事曆抓取）：</span>
                <div className="bg-slate-950 p-2 rounded-lg text-emerald-400 mt-1 select-all border border-slate-800">
                  =VLOOKUP(A6, 行事曆主檔!$A:$E, 4, FALSE)
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-sans">2. 分組輪調（D欄，每兩週自動交替 A/B 組）：</span>
                <div className="bg-slate-950 p-2 rounded-lg text-amber-400 mt-1 select-all border border-slate-800">
                  =IF(MOD(INT((A6-1)/2),2)=0, "A", "B")
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-sans">3. 備註（G欄，自動帶入學校行事，無行事則留白）：</span>
                <div className="bg-slate-950 p-2 rounded-lg text-blue-400 mt-1 select-all border border-slate-800">
                  =IFNA(VLOOKUP(A6, 行事曆主檔!$A:$E, 5, FALSE), "")
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-200 flex justify-end">
          <button
            id="close-export-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg shadow-2xs transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
