import React, { useState } from 'react';
import { Sparkles, X, Clipboard, Check, Calendar, RotateCcw, AlertTriangle } from 'lucide-react';
import { SyllabusPlan, GroupRotationPattern } from '../types';
import { getCalculatedGroup } from '../data/defaultCalendar';

interface QuickFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SyllabusPlan;
  onBatchUpdateRows: (updater: (rows: SyllabusPlan['rows']) => SyllabusPlan['rows']) => void;
  onApplyRotation: (pattern: GroupRotationPattern) => void;
}

export const QuickFillModal: React.FC<QuickFillModalProps> = ({
  isOpen,
  onClose,
  plan,
  onBatchUpdateRows,
  onApplyRotation,
}) => {
  const [pastedText, setPastedText] = useState('');
  const [selectedTool, setSelectedTool] = useState<'paste' | 'exam' | 'rotation' | 'clear'>('paste');

  if (!isOpen) return null;

  // 1. Handle multiline paste into 1-21 weeks
  const handleApplyPastedText = () => {
    const lines = pastedText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      alert('請先在輸入框中貼上進度文字');
      return;
    }

    onBatchUpdateRows((prevRows) =>
      prevRows.map((row, idx) => ({
        ...row,
        courseProgress: lines[idx] !== undefined ? lines[idx] : row.courseProgress,
      }))
    );

    alert(`已成功將 ${Math.min(lines.length, 21)} 週的課程進度依序填入！`);
    onClose();
  };

  // 2. Mark exam & holiday weeks from calendar remarks
  const handleMarkHolidaysAndExams = () => {
    onBatchUpdateRows((prevRows) =>
      prevRows.map((row) => {
        const note = row.schoolNote || '';
        let newProgress = row.courseProgress;
        let newAssessment = row.assessment;

        // Exams
        if (row.week === 7 || /第\s*1\s*次期中|第一次期中|第一次段考|第1次段考/.test(note)) {
          newProgress = row.courseProgress || '第一次期中定期考查（技能實作評量與學科測驗）';
          newAssessment = row.assessment || '第 1 次段考';
        } else if (row.week === 14 || /第\s*2\s*次期中|第二次期中|第二次段考|第2次段考/.test(note)) {
          newProgress = row.courseProgress || '第二次期中定期考查（實習成品驗收與專業測驗）';
          newAssessment = row.assessment || '第 2 次段考';
        } else if (row.week === 21 || /期末考|期末定期考|期末段考/.test(note)) {
          newProgress = row.courseProgress || '期末定期考查（實習總驗收與工安保養）';
          newAssessment = row.assessment || '期末考評量';
        }
        // Holidays from calendar
        else if (/中秋/.test(note)) {
          newProgress = row.courseProgress || '中秋節放假';
        } else if (/國慶|雙十/.test(note)) {
          newProgress = row.courseProgress || '國慶日彈性連假放假';
        } else if (/元旦/.test(note)) {
          newProgress = row.courseProgress || '元旦連假放假';
        } else if (/放假|連假|停課/.test(note)) {
          newProgress = row.courseProgress || `${note}（放假）`;
        }

        return {
          ...row,
          courseProgress: newProgress,
          assessment: newAssessment,
        };
      })
    );
    alert('已成功將行事曆中之「放假」與「段考／定期考」自動填入課程進度，並以紅字醒目顯示！');
    onClose();
  };

  // 3. Clear all progresses
  const handleClearProgress = () => {
    if (window.confirm('確定要清空所有週次的「預定實習課程進度」嗎？（起訖日期與學校行事仍會保留）')) {
      onBatchUpdateRows((prevRows) =>
        prevRows.map((row) => ({
          ...row,
          courseProgress: '',
        }))
      );
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-base font-sans">
              智慧填寫小工具（輔助老師快速編制進度）
            </h3>
          </div>
          <button
            id="close-quick-fill-btn"
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tab Options */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/40 gap-5 text-xs font-semibold">
          <button
            id="tab-quick-paste"
            type="button"
            onClick={() => setSelectedTool('paste')}
            className={`py-3 border-b-2 transition-colors ${
              selectedTool === 'paste'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 多行批次貼上
          </button>
          <button
            id="tab-quick-exam"
            type="button"
            onClick={() => setSelectedTool('exam')}
            className={`py-3 border-b-2 transition-colors ${
              selectedTool === 'exam'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🔴 放假與定期考（紅字自動標記）
          </button>
          <button
            id="tab-quick-rotation"
            type="button"
            onClick={() => setSelectedTool('rotation')}
            className={`py-3 border-b-2 transition-colors ${
              selectedTool === 'rotation'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🔄 分組輪調一鍵套用
          </button>
          <button
            id="tab-quick-clear"
            type="button"
            onClick={() => setSelectedTool('clear')}
            className={`py-3 border-b-2 transition-colors ${
              selectedTool === 'clear'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🧹 清空進度
          </button>
        </div>

        {/* Course info banner */}
        <div className="px-6 py-2 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between text-xs">
          <span className="text-slate-600">
            目前編輯課程：<strong className="text-slate-900">{plan.meta.className || '未設定'}・{plan.meta.courseName || '未設定'}</strong>
          </span>
          <span className="text-blue-800 font-bold bg-blue-100/80 px-2.5 py-0.5 rounded border border-blue-200">
            📅 上課時間：{plan.meta.courseDayOfWeek || '星期四'} {plan.meta.coursePeriod || ''}
          </span>
        </div>

        {/* Tool Contents */}
        <div className="p-6">
          {selectedTool === 'paste' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  請將 21 週的課程進度文字貼在下方（一行代表一週）：
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  例如從 Word、教學計畫書或以前的試算表複製 21 行內容，系統會自動分配至第 1 週到第 21 週。
                </p>
                <textarea
                  id="batch-paste-textarea"
                  rows={8}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`工場工安守則與工具介紹\n基礎電路焊接練習\nLED 跑馬燈實作\n中斷控制實驗\n...（最多支援 21 行）`}
                  className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition-colors"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  id="cancel-paste-btn"
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  id="apply-paste-btn"
                  type="button"
                  onClick={handleApplyPastedText}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-2xs transition-colors"
                >
                  依序填入 21 週
                </button>
              </div>
            </div>
          )}

          {selectedTool === 'exam' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-red-50/70 rounded-xl border border-red-200">
                <h4 className="font-bold text-red-900 mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  一鍵填入高工標準「放假」與「定期考查」標註（紅字顯示）
                </h4>
                <p className="text-red-800 leading-relaxed">
                  點擊下方按鈕，系統將自動比對行事曆備註，自動於課程進度填寫並以<strong>紅字</strong>醒目呈現：
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1.5 text-red-900 font-medium">
                  <li><strong>國定假日／放假週</strong>：第 4 週（中秋節放假）、第 6 週（國慶日彈性連假放假）、第 18 週（元旦連假放假）</li>
                  <li><strong>定期考查週</strong>：第 7 週（第一次期中定期考查）、第 14 週（第二次期中定期考查）、第 21 週（期末定期考查）</li>
                  <li><strong>日常評量欄</strong>：同步自動帶入「第 1 次段考」、「第 2 次段考」與「期末考評量」</li>
                </ul>
                <div className="mt-3 p-2 bg-white rounded-md border border-red-200/80 text-[11px] text-slate-600">
                  💡 說明：填入後進度表中的「放假」與「定期考」文字將以<strong>專業紅字</strong>呈現，列印或另存 PDF 亦保留紅字標記。
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  id="cancel-exam-btn"
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  id="apply-exam-btn"
                  type="button"
                  onClick={handleMarkHolidaysAndExams}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-2xs transition-colors"
                >
                  套用放假與定期考紅字標註
                </button>
              </div>
            </div>
          )}

          {selectedTool === 'rotation' && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-600">
                選擇實習工場合作分組的輪調頻率，系統會自動重新計算 21 週的組別代號（{plan.meta.groupA_name} / {plan.meta.groupB_name}）：
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  id="rotation-opt-2"
                  type="button"
                  onClick={() => {
                    onApplyRotation('alternate-2');
                    onClose();
                  }}
                  className="p-3 text-left border border-slate-200 hover:border-blue-600 hover:bg-blue-50/50 rounded-lg transition-all"
                >
                  <div className="font-bold text-slate-800">每 2 週輪調一次（標準公版）</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    第 1-2 週 A組，第 3-4 週 B組，依此類推
                  </div>
                </button>
                <button
                  id="rotation-opt-1"
                  type="button"
                  onClick={() => {
                    onApplyRotation('alternate-1');
                    onClose();
                  }}
                  className="p-3 text-left border border-slate-200 hover:border-blue-600 hover:bg-blue-50/50 rounded-lg transition-all"
                >
                  <div className="font-bold text-slate-800">每 1 週輪調一次（單雙週）</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    奇數週 A組，偶數週 B組 交替輪調
                  </div>
                </button>
                <button
                  id="rotation-opt-3"
                  type="button"
                  onClick={() => {
                    onApplyRotation('alternate-3');
                    onClose();
                  }}
                  className="p-3 text-left border border-slate-200 hover:border-blue-600 hover:bg-blue-50/50 rounded-lg transition-all"
                >
                  <div className="font-bold text-slate-800">每 3 週輪調一次</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    每三個單元大模組輪換一次組別
                  </div>
                </button>
                <button
                  id="rotation-opt-none"
                  type="button"
                  onClick={() => {
                    onApplyRotation('none');
                    onClose();
                  }}
                  className="p-3 text-left border border-slate-200 hover:border-blue-600 hover:bg-blue-50/50 rounded-lg transition-all"
                >
                  <div className="font-bold text-slate-800">全班不分組</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    整學期為全體同學共同進度
                  </div>
                </button>
              </div>
            </div>
          )}

          {selectedTool === 'clear' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-rose-900">清空預定課程進度</h4>
                  <p className="text-rose-700 mt-1 leading-relaxed">
                    這會將 21 週的「預定實習課程進度」全部清空為空白，以便老師全新手動輸入。起訖日期、分組與學校行事不會受到影響。
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  id="cancel-clear-btn"
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  id="confirm-clear-btn"
                  type="button"
                  onClick={handleClearProgress}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors"
                >
                  確認清空進度
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
