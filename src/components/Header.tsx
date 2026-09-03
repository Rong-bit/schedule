import React from 'react';
import { 
  Printer, 
  FileSpreadsheet, 
  Calendar, 
  Sparkles, 
  BookOpen, 
  FolderOpen,
  GraduationCap,
  ChevronDown
} from 'lucide-react';
import { SyllabusPlan } from '../types';
import { SAMPLE_PRESETS } from '../data/defaultCalendar';

interface HeaderProps {
  currentTab: 'syllabus' | 'calendar' | 'guide';
  setCurrentTab: (tab: 'syllabus' | 'calendar' | 'guide') => void;
  onOpenQuickFill: () => void;
  onOpenSheetsModal: () => void;
  onPrint: () => void;
  plan: SyllabusPlan;
  onLoadPreset: (presetIndex: number) => void;
  onResetToDefault: () => void;
  plansList: SyllabusPlan[];
  onSelectPlan: (planId: string) => void;
  onNewPlan: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  onOpenQuickFill,
  onOpenSheetsModal,
  onPrint,
  plan,
  onLoadPreset,
  plansList,
  onSelectPlan,
  onNewPlan,
}) => {
  return (
    <header className="no-print bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-3.5 gap-4">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white flex items-center justify-center shadow-md shadow-blue-900/15 shrink-0 border border-blue-600/30">
              <GraduationCap className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight font-sans">
                  高工實習教學進度表系統
                </h1>
                <span className="text-[11px] bg-blue-50 text-blue-800 font-semibold px-2 py-0.5 rounded-md border border-blue-200/80">
                  {plan.meta.schoolShortName} 公版
                </span>
                <span className="text-[11px] bg-slate-100 text-slate-700 font-mono font-medium px-2 py-0.5 rounded-md border border-slate-200">
                  {plan.meta.academicYear}-{plan.meta.semester}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block mt-0.5">
                行事曆自動排程・週次起訖日期防呆・分組輪調・支援 A4 單頁列印與 Google 試算表
              </p>
            </div>
          </div>

          {/* Action Tools Cluster */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-2.5">
            {/* Presets and Plans selector */}
            <div className="relative">
              <div className="relative flex items-center">
                <FolderOpen className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                <select
                  id="preset-selector"
                  aria-label="選擇進度表草稿或示範範本"
                  className="text-xs font-semibold bg-slate-50 hover:bg-white text-slate-800 py-2 pl-8 pr-7 rounded-lg border border-slate-200 hover:border-slate-300 transition-all focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-hidden cursor-pointer shadow-2xs appearance-none"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'new') {
                      onNewPlan();
                    } else if (val.startsWith('preset-')) {
                      onLoadPreset(parseInt(val.replace('preset-', ''), 10));
                    } else {
                      onSelectPlan(val);
                    }
                  }}
                  value={plan.meta.id}
                >
                  <optgroup label="我的科目進度表">
                    {plansList.map((p) => (
                      <option key={p.meta.id} value={p.meta.id}>
                        {p.meta.className || '未命名班級'} - {p.meta.courseName || '未命名科目'}
                      </option>
                    ))}
                    <option value="new">➕ 新增另一份科目進度表...</option>
                  </optgroup>
                  <optgroup label="載入高工示範範本">
                    {SAMPLE_PRESETS.map((preset, idx) => (
                      <option key={`preset-${idx}`} value={`preset-${idx}`}>
                        ✨ {preset.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Quick Fill Tool */}
            <button
              id="quick-fill-btn"
              type="button"
              onClick={onOpenQuickFill}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-amber-50/80 text-amber-900 border border-amber-200/80 hover:bg-amber-100/80 transition-all shadow-2xs hover:shadow-xs"
              title="快速貼上進度、一鍵標註段考週、分組輪調設定"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>智慧填寫小工具</span>
            </button>

            {/* Google Sheets Modal Button */}
            <button
              id="sheets-export-btn"
              type="button"
              onClick={onOpenSheetsModal}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-50/80 text-emerald-900 border border-emerald-200/80 hover:bg-emerald-100/80 transition-all shadow-2xs hover:shadow-xs"
              title="匯出至 Google 試算表 / 查看公式範本"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google 試算表匯出</span>
            </button>

            {/* Print / PDF Export Button */}
            <button
              id="print-action-btn"
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-all shadow-sm hover:shadow-md hover:shadow-blue-700/20 active:scale-[0.98]"
              title="直接列印或另存為 A4 PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>列印 / 匯出 PDF</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-slate-100 pt-1 -mb-px gap-2 sm:gap-4 overflow-x-auto text-xs sm:text-sm font-medium">
          <button
            id="tab-syllabus"
            type="button"
            onClick={() => setCurrentTab('syllabus')}
            className={`py-2.5 px-3 rounded-t-lg border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              currentTab === 'syllabus'
                ? 'border-blue-700 text-blue-700 font-bold bg-blue-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>教學進度表（公版填寫）</span>
          </button>

          <button
            id="tab-calendar"
            type="button"
            onClick={() => setCurrentTab('calendar')}
            className={`py-2.5 px-3 rounded-t-lg border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              currentTab === 'calendar'
                ? 'border-blue-700 text-blue-700 font-bold bg-blue-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>學校行事曆設定（115-1）</span>
            <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.2 rounded-md font-mono font-medium">
              21週
            </span>
          </button>

          <button
            id="tab-guide"
            type="button"
            onClick={() => setCurrentTab('guide')}
            className={`py-2.5 px-3 rounded-t-lg border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              currentTab === 'guide'
                ? 'border-blue-700 text-blue-700 font-bold bg-blue-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>使用說明與試算表公式</span>
          </button>
        </div>
      </div>
    </header>
  );
};
