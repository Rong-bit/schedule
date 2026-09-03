import React, { useMemo, useState } from 'react';
import { Sparkles, X, AlertTriangle } from 'lucide-react';
import { CalendarWeek, SyllabusPlan, GroupRotationPattern } from '../types';
import { isSkippedTeachingWeek, alignRowsWithClassWeekday, assignGroupsSkippingBreaks, applySequentialTeachingProgress } from '../utils/scheduleRules';
import { parseGroupSequenceText } from '../data/defaultCalendar';

interface QuickFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SyllabusPlan;
  calendar?: CalendarWeek[];
  onBatchUpdateRows: (updater: (rows: SyllabusPlan['rows']) => SyllabusPlan['rows']) => void;
  onApplyRotation: (
    pattern: GroupRotationPattern,
    nameA?: string,
    nameB?: string,
    sequence?: string[]
  ) => void;
  onApplySharedAbProgress: (
    topics: string[],
    groupSequenceText?: string
  ) => {
    topicUsed: number;
    skippedWeeks: number[];
    uncoveredTopics: string[];
    sequenceApplied: number;
  };
}

type PasteMode = 'shared-ab' | 'sequential-21';

const DEFAULT_GROUP_PATTERN = 'aabbbbaaaabbbbaaaabb';

export const QuickFillModal: React.FC<QuickFillModalProps> = ({
  isOpen,
  onClose,
  plan,
  calendar,
  onBatchUpdateRows,
  onApplyRotation,
  onApplySharedAbProgress,
}) => {
  const [pastedText, setPastedText] = useState('');
  const [groupPatternText, setGroupPatternText] = useState(() => {
    if (plan.meta.groupSequence && plan.meta.groupSequence.length > 0) {
      return plan.meta.groupSequence
        .map((g) => (g.includes('B') || g.includes('乙') ? 'b' : g === '全班' ? 'x' : 'a'))
        .join('');
    }
    return '';
  });
  const [selectedTool, setSelectedTool] = useState<'paste' | 'exam' | 'rotation' | 'clear'>('paste');
  const defaultPasteMode: PasteMode =
    plan.meta.groupPattern === 'none' ? 'sequential-21' : 'shared-ab';
  const [pasteMode, setPasteMode] = useState<PasteMode>(defaultPasteMode);

  const teachingPreview = useMemo(() => {
    const day = plan.meta.courseDayOfWeek || '星期四';
    const nameA = plan.meta.groupA_name;
    const nameB = plan.meta.groupB_name;
    const seq = parseGroupSequenceText(groupPatternText, nameA, nameB);
    const previewRows = assignGroupsSkippingBreaks(
      plan.rows,
      calendar || [],
      seq.length > 0 ? 'custom' : plan.meta.groupPattern,
      nameA,
      nameB,
      day,
      seq.length > 0 ? seq : plan.meta.groupSequence
    );

    const teaching = previewRows.filter(
      (row) => !isSkippedTeachingWeek(row, calendar, day)
    );
    const aWeeks = teaching.filter(
      (r) => r.group === nameA || /^A/i.test(r.group) || r.group.includes('甲')
    );
    const bWeeks = teaching.filter(
      (r) => r.group === nameB || /^B/i.test(r.group) || r.group.includes('乙')
    );
    return {
      teachingCount: teaching.length,
      aCount: aWeeks.length,
      bCount: bWeeks.length,
      pairHint: Math.min(aWeeks.length, bWeeks.length) || Math.floor(teaching.length / 2),
      seqLen: seq.length,
    };
  }, [plan, calendar, groupPatternText, pasteMode]);

  if (!isOpen) return null;

  const handleApplyPastedText = () => {
    const lines = pastedText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      alert('請先在輸入框中貼上進度文字');
      return;
    }

    if (pasteMode === 'sequential-21') {
      const day = plan.meta.courseDayOfWeek || '星期四';
      const result = applySequentialTeachingProgress(
        plan.rows,
        lines,
        calendar,
        day
      );
      onBatchUpdateRows(() => result.rows);
      const skipText =
        result.skippedWeeks.length > 0
          ? `\n已略過第 ${result.skippedWeeks.join('、')} 週（放假／考查）`
          : '';
      alert(`已將 ${result.used} 項進度填入實際上課週。${skipText}`);
      onClose();
      return;
    }

    // A/B 共用：依 aabbbb… 分組序，略過放假／段考後同序位填相同進度
    const summary = onApplySharedAbProgress(lines, groupPatternText.trim() || undefined);

    const skipText =
      summary.skippedWeeks.length > 0
        ? `\n已略過第 ${summary.skippedWeeks.join('、')} 週（放假／段考／自訂工作）`
        : '';
    const leftover =
      summary.uncoveredTopics.length > 0
        ? `\n尚有 ${summary.uncoveredTopics.length} 項進度未排入（上課週數不足）`
        : '';
    const seqText =
      summary.sequenceApplied > 0 ? `\n已套用分組序 ${summary.sequenceApplied} 週` : '';

    alert(
      `已將 ${summary.topicUsed} 項進度同步填入 ${plan.meta.groupA_name} 與 ${plan.meta.groupB_name}（同序位相同課程）。${seqText}${skipText}${leftover}`
    );
    onClose();
  };

  // 2. Mark exam & holiday weeks from calendar remarks
  const handleMarkHolidaysAndExams = () => {
    onBatchUpdateRows((prevRows) =>
      alignRowsWithClassWeekday(prevRows, calendar || [], plan.meta.courseDayOfWeek || '星期四')
    );
    alert('已依上課日將「放假」或「第Ｎ次定期考查」填入進度；未碰到該日的週次維持空白。');
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
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/40 gap-5 text-xs font-semibold overflow-x-auto">
          <button
            id="tab-quick-paste"
            type="button"
            onClick={() => setSelectedTool('paste')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              selectedTool === 'paste'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            多行批次貼上
          </button>
          <button
            id="tab-quick-exam"
            type="button"
            onClick={() => setSelectedTool('exam')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              selectedTool === 'exam'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            放假與定期考（紅字）
          </button>
          <button
            id="tab-quick-rotation"
            type="button"
            onClick={() => setSelectedTool('rotation')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              selectedTool === 'rotation'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            分組輪調
          </button>
          <button
            id="tab-quick-clear"
            type="button"
            onClick={() => setSelectedTool('clear')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              selectedTool === 'clear'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            清空進度
          </button>
        </div>

        {/* Course info banner */}
        <div className="px-6 py-2 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between text-xs gap-2 flex-wrap">
          <span className="text-slate-600">
            目前編輯課程：
            <strong className="text-slate-900">
              {plan.meta.className || '未設定'}・{plan.meta.courseName || '未設定'}
            </strong>
          </span>
          <span className="text-blue-800 font-bold bg-blue-100/80 px-2.5 py-0.5 rounded border border-blue-200">
            上課時間：{plan.meta.courseDayOfWeek || '星期四'} {plan.meta.coursePeriod || ''}
          </span>
        </div>

        {/* Tool Contents */}
        <div className="p-6">
          {selectedTool === 'paste' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-700">填入方式</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label
                    className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      pasteMode === 'shared-ab'
                        ? 'border-blue-600 bg-blue-50/70'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paste-mode"
                      className="mt-0.5 accent-blue-700"
                      checked={pasteMode === 'shared-ab'}
                      onChange={() => setPasteMode('shared-ab')}
                    />
                    <span>
                      <span className="font-bold text-slate-900 block">A/B 共用進度（建議）</span>
                      <span className="text-[11px] text-slate-500 leading-relaxed">
                        一行＝各組第 N 堂實際上課週。A、B 第 1 堂同填第 1 行，第 2 堂同填第 2 行；放假／考查不佔行。
                      </span>
                    </span>
                  </label>
                  <label
                    className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      pasteMode === 'sequential-21'
                        ? 'border-blue-600 bg-blue-50/70'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paste-mode"
                      className="mt-0.5 accent-blue-700"
                      checked={pasteMode === 'sequential-21'}
                      onChange={() => setPasteMode('sequential-21')}
                    />
                    <span>
                      <span className="font-bold text-slate-900 block">依序填入實際上課週</span>
                      <span className="text-[11px] text-slate-500 leading-relaxed">
                        一行一個單元，只填上課週；放假／考查週不佔行、也不覆蓋。
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              {pasteMode === 'shared-ab' && (
                <div className="space-y-2">
                  <div>
                    <label htmlFor="ab-group-pattern-input" className="block text-xs font-bold text-slate-700 mb-1">
                      自訂分組序（選填；空白則用表上目前輪調，只算實際上課週）
                    </label>
                    <input
                      id="ab-group-pattern-input"
                      type="text"
                      value={groupPatternText}
                      onChange={(e) => setGroupPatternText(e.target.value)}
                      placeholder={DEFAULT_GROUP_PATTERN}
                      className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>
                  <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 leading-relaxed">
                    約可排 <strong>{teachingPreview.pairHint}</strong> 行（各組一堂對一堂）
                    （{plan.meta.groupA_name} {teachingPreview.aCount} 堂／
                    {plan.meta.groupB_name} {teachingPreview.bCount} 堂；放假／考查不佔行）。
                    {teachingPreview.seqLen > 0 && (
                      <span className="text-slate-500"> 分組序長度 {teachingPreview.seqLen}。</span>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {pasteMode === 'shared-ab'
                    ? '請貼上半學期進度（一行＝各組一堂；A/B 第 N 堂共用同一行）：'
                    : '請貼上課進度（一行一個單元，只填實際上課週）：'}
                </label>
                <textarea
                  id="batch-paste-textarea"
                  rows={8}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={
                    pasteMode === 'shared-ab'
                      ? `器具介紹\n單相感應電動機正反轉\n乾燥桶控制電路\n電動空壓機控制電路\n三相感應電動機降壓起動控制\n三相感應電動機電抗器降壓起動控制`
                      : `工場工安守則與工具介紹\n基礎電路焊接練習\nLED 跑馬燈實作\n...（最多支援 21 行）`
                  }
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
                  {pasteMode === 'shared-ab' ? '套用 A/B 共用進度' : '填入實際上課週'}
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
                  <li>
                    <strong>國定假日／放假週</strong>：第 4 週（中秋節放假）、第 6 週（國慶日彈性連假放假）、第 18
                    週（元旦連假放假）
                  </li>
                  <li>
                    <strong>定期考查週</strong>：第 7 週（第一次期中定期考查）、第 14 週（第二次期中定期考查）、第 21
                    週（期末定期考查）
                  </li>
                  <li>
                    <strong>日常評量欄</strong>：同步自動帶入「第 1 次段考」、「第 2 次段考」與「期末考評量」
                  </li>
                </ul>
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
                選擇輪調規則後，只在實際上課週推進 A／B；放假與考查週組別為「—」（{plan.meta.groupA_name} /{' '}
                {plan.meta.groupB_name}）：
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
                    實際上課週每兩週換一次組；放假／考查不佔週次
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
                    實際上課週單雙交替；放假／考查不佔週次
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
                    實際上課週每三週換一次組；放假／考查不佔週次
                  </div>
                </button>
                <button
                  id="rotation-opt-aabbbb"
                  type="button"
                  onClick={() => {
                    onApplyRotation('aabbbb');
                    onClose();
                  }}
                  className="p-3 text-left border border-slate-200 hover:border-blue-600 hover:bg-blue-50/50 rounded-lg transition-all"
                >
                  <div className="font-bold text-slate-800">開頭 2 週 A，4 週 B／4 週 A 循環</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    實際上課週才排組別；放假／考查週為「—」。結尾不足 4 週補 A
                  </div>
                </button>
                <button
                  id="rotation-opt-bbaaaa"
                  type="button"
                  onClick={() => {
                    onApplyRotation('bbaaaa');
                    onClose();
                  }}
                  className="p-3 text-left border border-slate-200 hover:border-blue-600 hover:bg-blue-50/50 rounded-lg transition-all"
                >
                  <div className="font-bold text-slate-800">開頭 2 週 B，4 週 A／4 週 B 循環</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    與上一項相反：先 B 兩週，再 4A／4B 循環，結尾補 B；放假／考查跳過
                  </div>
                </button>
                <button
                  id="rotation-opt-half"
                  type="button"
                  onClick={() => {
                    onApplyRotation('half-semester');
                    onClose();
                  }}
                  className="p-3 text-left border border-slate-200 hover:border-blue-600 hover:bg-blue-50/50 rounded-lg transition-all"
                >
                  <div className="font-bold text-slate-800">上半學期 A、下半學期 B</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    實際上課週對半：前半 A、後半 B
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

              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 space-y-2">
                <div className="font-bold text-amber-950">自訂分組序（如 aabbbbaaaabb）</div>
                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                  可直接貼緊湊字串，或一行一週。此序只套在實際上課週；套用後再回「多行批次貼上」填進度。
                </p>
                <input
                  id="rotation-custom-group-pattern"
                  type="text"
                  value={groupPatternText}
                  onChange={(e) => setGroupPatternText(e.target.value)}
                  placeholder={DEFAULT_GROUP_PATTERN}
                  className="w-full text-xs font-mono px-2.5 py-2 border border-amber-300 rounded-lg bg-white focus:ring-1 focus:ring-amber-600 focus:outline-hidden"
                />
                <div className="flex justify-end">
                  <button
                    id="apply-custom-group-only-btn"
                    type="button"
                    onClick={() => {
                      const sequence = parseGroupSequenceText(
                        groupPatternText,
                        plan.meta.groupA_name,
                        plan.meta.groupB_name
                      );
                      if (sequence.length === 0) {
                        alert('請輸入分組序，例如 aabbbbaaaabbbbaaaabb');
                        return;
                      }
                      onApplyRotation(
                        'custom',
                        plan.meta.groupA_name,
                        plan.meta.groupB_name,
                        sequence
                      );
                      alert(`已套用自訂分組 ${Math.min(sequence.length, 21)} 週`);
                      onClose();
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg"
                  >
                    只套用分組序
                  </button>
                </div>
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
