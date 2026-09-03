import React, { useState, useEffect } from 'react';
import { CalendarWeek, GroupRotationPattern, PlanMetadata, SyllabusPlan, SyllabusRow } from './types';
import { DEFAULT_CALENDAR_115_1, DEFAULT_META, SAMPLE_PRESETS, SAMPLE_PROGRESS_MICROPROCESSOR, createDefaultSyllabusRows, getCalculatedGroup, parseGroupSequenceText } from './data/defaultCalendar';
import { alignRowsWithClassWeekday, applySharedGroupProgress } from './utils/scheduleRules';
import { Header } from './components/Header';
import { MetaEditor } from './components/MetaEditor';
import { SyllabusTable } from './components/SyllabusTable';
import { CalendarManager } from './components/CalendarManager';
import { GuideTab } from './components/GuideTab';
import { QuickFillModal } from './components/QuickFillModal';
import { ExportSheetsModal } from './components/ExportSheetsModal';
import { Check, Sparkles, Printer, FileSpreadsheet, Info, X } from 'lucide-react';

const STORAGE_KEY_PLANS = 'zzvs_syllabus_plans_v1';
const STORAGE_KEY_CALENDAR = 'zzvs_calendar_115_1_v1';
const STORAGE_KEY_EMPTY_HW_COLS = 'zzvs_empty_assignment_assessment_v1';

function withBlankHomeworkColumns(plans: SyllabusPlan[]): SyllabusPlan[] {
  return plans.map((p) => ({
    ...p,
    rows: p.rows.map((r) => ({
      ...r,
      assignment: '',
      assessment: '',
    })),
  }));
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<'syllabus' | 'calendar' | 'guide'>('syllabus');
  const [calendar, setCalendar] = useState<CalendarWeek[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CALENDAR);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CALENDAR_115_1;
  });

  const [plansList, setPlansList] = useState<SyllabusPlan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLANS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (!localStorage.getItem(STORAGE_KEY_EMPTY_HW_COLS)) {
            const cleared = withBlankHomeworkColumns(parsed);
            localStorage.setItem(STORAGE_KEY_EMPTY_HW_COLS, '1');
            localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(cleared));
            return cleared;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [SAMPLE_PRESETS[0].plan()];
  });

  const [currentPlanId, setCurrentPlanId] = useState<string>(() => {
    return plansList[0]?.meta.id || DEFAULT_META.id;
  });

  const [isQuickFillOpen, setIsQuickFillOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('已同步儲存');
  const [bannerNotice, setBannerNotice] = useState<{ message: string; detail?: string } | null>(null);

  const currentPlan = plansList.find((p) => p.meta.id === currentPlanId) || plansList[0];

  // Save calendar changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CALENDAR, JSON.stringify(calendar));
    } catch (e) {
      console.error(e);
    }
  }, [calendar]);

  // Save plans changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(plansList));
      setSaveStatus('已自動儲存草稿');
      const timer = setTimeout(() => setSaveStatus('已同步儲存'), 2000);
      return () => clearTimeout(timer);
    } catch (e) {
      console.error(e);
    }
  }, [plansList]);

  // Update a field in the current plan's rows
  const handleRowChange = (weekIndex: number, field: keyof SyllabusRow, value: string) => {
    setPlansList((prev) =>
      prev.map((p) => {
        if (p.meta.id !== currentPlan.meta.id) return p;
        const updatedRows = [...p.rows];
        updatedRows[weekIndex] = {
          ...updatedRows[weekIndex],
          [field]: value,
        };
        return {
          ...p,
          rows: updatedRows,
          updatedAt: Date.now(),
        };
      })
    );
  };

  // Update current plan's metadata
  const handleMetaChange = (updatedMeta: Partial<PlanMetadata>) => {
    let changedToDay: string | null = null;

    setPlansList((prev) =>
      prev.map((p) => {
        if (p.meta.id !== currentPlan.meta.id) return p;

        let updatedRows = p.rows;
        // 如果變更上課星期（例如設為星期五），自動將「預定實習課程進度」中遇到放假或段考自動填入！
        if (
          updatedMeta.courseDayOfWeek &&
          updatedMeta.courseDayOfWeek !== p.meta.courseDayOfWeek
        ) {
          changedToDay = updatedMeta.courseDayOfWeek;
          updatedRows = alignRowsWithClassWeekday(
            p.rows,
            calendar,
            updatedMeta.courseDayOfWeek,
            SAMPLE_PROGRESS_MICROPROCESSOR
          );
        }

        return {
          ...p,
          meta: { ...p.meta, ...updatedMeta },
          rows: updatedRows,
          updatedAt: Date.now(),
        };
      })
    );

    if (changedToDay) {
      const day = changedToDay;
      const detailText =
        day === '星期五'
          ? '已自動將【第 4 週（9/25）中秋節放假】、【第 6 週（10/9）國慶連假放假】、【第 7 週（10/16）第一次段考】、【第 18 週（1/1）元旦連假放假】帶入預定進度與紅字標示！'
          : day === '星期四'
          ? '已自動對齊週四進度：第 4 週（9/24）正常上課、第 7 週（10/15）第一次段考、第 14 週（12/3）第二次段考、第 21 週（1/21）寒假開始！'
          : `已依${day}行事曆自動對齊全學期 21 週放假與段考進度！`;

      setBannerNotice({
        message: `已依「${day}」上課日自動同步更新課程進度！`,
        detail: detailText,
      });
    }
  };

  // Apply group rotation to current plan
  const handleApplyRotation = (
    pattern: GroupRotationPattern,
    nameA: string = currentPlan.meta.groupA_name,
    nameB: string = currentPlan.meta.groupB_name,
    sequence?: string[]
  ) => {
    setPlansList((prev) =>
      prev.map((p) => {
        if (p.meta.id !== currentPlan.meta.id) return p;

        const resolvedSequence =
          pattern === 'custom'
            ? sequence && sequence.length > 0
              ? sequence
              : p.meta.groupSequence
            : undefined;

        const updatedRows = p.rows.map((r) => {
          if (pattern === 'custom' && (!resolvedSequence || resolvedSequence.length === 0)) {
            return r;
          }
          return {
            ...r,
            group: getCalculatedGroup(
              r.week,
              pattern,
              nameA,
              nameB,
              resolvedSequence,
              p.rows.length || 21
            ),
          };
        });

        return {
          ...p,
          meta: {
            ...p.meta,
            groupPattern: pattern,
            groupA_name: nameA,
            groupB_name: nameB,
            groupSequence: pattern === 'custom' ? resolvedSequence : undefined,
          },
          rows: updatedRows,
          updatedAt: Date.now(),
        };
      })
    );
  };

  /** A/B 共用進度：可同時套用自訂分組序（如 aabbbbaaaabb）再填相同課程 */
  const handleApplySharedAbProgress = (topics: string[], groupSequenceText?: string) => {
    const nameA = currentPlan.meta.groupA_name;
    const nameB = currentPlan.meta.groupB_name;
    const sequence = groupSequenceText
      ? parseGroupSequenceText(groupSequenceText, nameA, nameB)
      : currentPlan.meta.groupSequence || [];

    let rows = currentPlan.rows;
    let nextMeta = currentPlan.meta;

    if (groupSequenceText && sequence.length > 0) {
      nextMeta = {
        ...nextMeta,
        groupPattern: 'custom',
        groupSequence: sequence,
      };
      rows = rows.map((r) => ({
        ...r,
        group: getCalculatedGroup(r.week, 'custom', nameA, nameB, sequence),
      }));
    }

    const result = applySharedGroupProgress(rows, {
      topics,
      calendar,
      dayOfWeek: nextMeta.courseDayOfWeek || '星期四',
      groupPattern: nextMeta.groupPattern === 'none' ? 'none' : nextMeta.groupPattern,
      groupAName: nameA,
      groupBName: nameB,
      fillHolidayExamLabels: true,
    });

    setPlansList((prev) =>
      prev.map((p) => {
        if (p.meta.id !== currentPlan.meta.id) return p;
        return {
          ...p,
          meta: nextMeta,
          rows: result.rows,
          updatedAt: Date.now(),
        };
      })
    );

    return {
      topicUsed: result.topicUsed,
      skippedWeeks: result.skippedWeeks,
      uncoveredTopics: result.uncoveredTopics,
      sequenceApplied: sequence.length,
    };
  };

  // Batch update rows (e.g. from QuickFillModal)
  const handleBatchUpdateRows = (updater: (rows: SyllabusRow[]) => SyllabusRow[]) => {
    setPlansList((prev) =>
      prev.map((p) => {
        if (p.meta.id !== currentPlan.meta.id) return p;
        return {
          ...p,
          rows: updater(p.rows),
          updatedAt: Date.now(),
        };
      })
    );
  };

  // Update calendar and synchronize dates & events in all plans
  const handleCalendarUpdate = (updatedCalendar: CalendarWeek[]) => {
    setCalendar(updatedCalendar);

    // Synchronize current plans' dateRangeText and schoolNote from calendar
    setPlansList((prev) =>
      prev.map((p) => {
        const syncedRows = p.rows.map((row, idx) => {
          const calItem = updatedCalendar[idx];
          if (!calItem) return row;
          return {
            ...row,
            dateRangeText: calItem.dateRangeText,
            schoolNote: calItem.schoolEvent,
          };
        });
        return {
          ...p,
          rows: syncedRows,
          updatedAt: Date.now(),
        };
      })
    );
  };

  // Load a preset
  const handleLoadPreset = (presetIndex: number) => {
    const preset = SAMPLE_PRESETS[presetIndex];
    if (!preset) return;
    const newPlan = preset.plan();
    // Update dates with current calendar
    newPlan.rows = newPlan.rows.map((r, i) => ({
      ...r,
      dateRangeText: calendar[i]?.dateRangeText || r.dateRangeText,
      schoolNote: calendar[i]?.schoolEvent || r.schoolNote,
    }));

    setPlansList((prev) => [newPlan, ...prev]);
    setCurrentPlanId(newPlan.meta.id);
  };

  // Create a new blank plan
  const handleNewPlan = () => {
    const newId = `plan-${Date.now()}`;
    const newPlan: SyllabusPlan = {
      meta: {
        ...DEFAULT_META,
        id: newId,
        className: '新班級',
        courseName: '新實習科目',
      },
      rows: calendar.map((cal) => ({
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
    };

    setPlansList((prev) => [newPlan, ...prev]);
    setCurrentPlanId(newId);
  };

  const handlePrint = () => {
    setCurrentTab('syllabus');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A] flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Top Application Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenQuickFill={() => setIsQuickFillOpen(true)}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onPrint={handlePrint}
        plan={currentPlan}
        onLoadPreset={handleLoadPreset}
        onResetToDefault={() => handleLoadPreset(0)}
        plansList={plansList}
        onSelectPlan={(id) => setCurrentPlanId(id)}
        onNewPlan={handleNewPlan}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7">
        {/* Status indicator bar (screen only) */}
        <div className="no-print mb-4 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="font-semibold text-slate-800">中正高工 115-1 實習教學進度表系統</span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700 font-medium">{saveStatus}</span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-slate-500 text-[11px]">
              💡 提示：老師僅需填寫「課程進度」，週次、起訖日期、分組與重大行事均已自動防呆對應
            </span>
          </div>
        </div>

        {/* Dynamic weekday alignment notification banner */}
        {bannerNotice && (
          <div className="no-print mb-4 bg-linear-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200/90 rounded-xl p-3.5 flex items-start justify-between gap-3 shadow-xs animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-blue-950">{bannerNotice.message}</div>
                {bannerNotice.detail && (
                  <div className="text-xs text-blue-800 leading-relaxed mt-1 font-medium">
                    {bannerNotice.detail}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBannerNotice(null)}
              className="text-xs text-blue-700 hover:text-blue-900 font-semibold px-2 py-1 rounded-md bg-blue-100/70 hover:bg-blue-200 transition-colors shrink-0"
              title="關閉提示"
            >
              <X className="w-3.5 h-3.5 inline mr-0.5" />
              關閉
            </button>
          </div>
        )}

        {/* Tab 1: Syllabus Progress Table (Default & Print View) */}
        {currentTab === 'syllabus' && (
          <div className="space-y-6">
            <MetaEditor
              meta={currentPlan.meta}
              onChange={handleMetaChange}
              onApplyRotation={handleApplyRotation}
            />

            <SyllabusTable
              plan={currentPlan}
              calendar={calendar}
              onRowChange={handleRowChange}
              onBatchUpdateRows={handleBatchUpdateRows}
              onOpenQuickFill={() => setIsQuickFillOpen(true)}
              onPrint={handlePrint}
            />
          </div>
        )}

        {/* Tab 2: Calendar Master Database */}
        {currentTab === 'calendar' && (
          <CalendarManager
            calendar={calendar}
            onUpdateCalendar={handleCalendarUpdate}
          />
        )}

        {/* Tab 3: System Guide & Google Sheets Formula Comparison */}
        {currentTab === 'guide' && (
          <GuideTab />
        )}
      </main>

      {/* Screen-only Footer */}
      <footer className="no-print border-t border-slate-200 bg-white/90 backdrop-blur-xs py-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-slate-600">
            高雄市立中正高工 115 學年度第 1 學期實習教學及作業預定進度表工具
          </span>
          <div className="flex items-center gap-4 text-slate-600 font-semibold">
            <button
              type="button"
              onClick={() => setIsSheetsModalOpen(true)}
              className="hover:text-emerald-700 transition-colors"
            >
              Google 試算表公式對照
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={handlePrint}
              className="hover:text-blue-700 transition-colors"
            >
              列印 / 匯出 PDF
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <QuickFillModal
        isOpen={isQuickFillOpen}
        onClose={() => setIsQuickFillOpen(false)}
        plan={currentPlan}
        calendar={calendar}
        onBatchUpdateRows={handleBatchUpdateRows}
        onApplyRotation={handleApplyRotation}
        onApplySharedAbProgress={handleApplySharedAbProgress}
      />

      <ExportSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        plan={currentPlan}
        calendar={calendar}
      />
    </div>
  );
}
