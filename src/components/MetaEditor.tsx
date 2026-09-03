import React, { useState } from 'react';
import { PlanMetadata, GroupRotationPattern } from '../types';
import { 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Clock, 
  CalendarDays,
  Sparkles
} from 'lucide-react';

interface MetaEditorProps {
  meta: PlanMetadata;
  onChange: (updated: Partial<PlanMetadata>) => void;
  onApplyRotation: (pattern: GroupRotationPattern, nameA?: string, nameB?: string) => void;
}

const COMMON_DEPARTMENTS = ['資訊科', '電子科', '電機科', '機械科', '製圖科', '冷凍科', '化工科', '建築科'];

export const MetaEditor: React.FC<MetaEditorProps> = ({
  meta,
  onChange,
  onApplyRotation,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="no-print bg-white rounded-2xl border border-slate-200/90 shadow-xs mb-6 overflow-hidden transition-all">
      {/* Modern Control Deck Summary */}
      <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/90 to-white border-b border-slate-200/80">
        
        {/* Left Side: Course & Class Highlight */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-md">
              表頭基本設定
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-sans tracking-tight">
              {meta.className || '未設定班級'}・{meta.courseName || '未設定科目'}
            </h2>
          </div>

          {/* Key Metric Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              <span>授課教師：</span>
              <strong className="text-slate-900 font-medium">{meta.mainTeacher || '無'}</strong>
              {meta.coTeacher && (
                <span className="text-slate-400">（分組：{meta.coTeacher}）</span>
              )}
            </div>

            {/* Course Day of Week & Period chip */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
              <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
              <span>上課時間：</span>
              <strong className="text-blue-700 font-bold">{meta.courseDayOfWeek || '星期四'}</strong>
              {meta.coursePeriod && (
                <span className="text-slate-500 font-medium">（{meta.coursePeriod}）</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>每週：</span>
              <strong className="text-slate-900 font-medium">{meta.weeklyHours} 節</strong>
              <span className="text-slate-300">/</span>
              <strong className="text-slate-900 font-medium">{meta.credits} 學分</strong>
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>分組：</span>
              <span className="font-semibold text-blue-700">
                {meta.groupPattern === 'none' && '全班 (不分組)'}
                {meta.groupPattern === 'alternate-2' && '每 2 週輪調 (A/B公版)'}
                {meta.groupPattern === 'alternate-1' && '每 1 週輪調 (單雙週)'}
                {meta.groupPattern === 'alternate-3' && '每 3 週輪調'}
                {meta.groupPattern === 'custom' && '自訂設定'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action & Expand Trigger */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          {/* Quick Day of Week select dropdown */}
          <div className="flex items-center gap-1.5 text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
            <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-500 font-medium">上課星期:</span>
            <select
              id="quick-day-of-week-select"
              aria-label="實習課上課星期快速設定"
              value={meta.courseDayOfWeek || '星期四'}
              onChange={(e) => onChange({ courseDayOfWeek: e.target.value })}
              className="font-bold text-blue-700 bg-transparent focus:outline-hidden cursor-pointer"
            >
              <option value="星期一">星期一 (週一)</option>
              <option value="星期二">星期二 (週二)</option>
              <option value="星期三">星期三 (週三)</option>
              <option value="星期四">星期四 (週四)</option>
              <option value="星期五">星期五 (週五)</option>
            </select>
          </div>

          {/* Quick Rotation dropdown */}
          <div className="flex items-center gap-1.5 text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">輪調規則:</span>
            <select
              id="rotation-select"
              aria-label="分組輪調規則"
              value={meta.groupPattern}
              onChange={(e) => {
                const pat = e.target.value as GroupRotationPattern;
                onChange({ groupPattern: pat });
                onApplyRotation(pat, meta.groupA_name, meta.groupB_name);
              }}
              className="font-bold text-blue-700 bg-transparent focus:outline-hidden cursor-pointer"
            >
              <option value="alternate-2">每 2 週輪調 (中正高工公版標準)</option>
              <option value="alternate-1">每 1 週輪調 (單雙週交替)</option>
              <option value="alternate-3">每 3 週輪調</option>
              <option value="none">全班上課 (不分組)</option>
              <option value="custom">自訂個別週次</option>
            </select>
          </div>

          <button
            id="toggle-meta-details-btn"
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>{isExpanded ? '收合設定欄位' : '完整修改表頭'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Interactive Form Panels */}
      {isExpanded && (
        <div className="p-5 sm:p-6 bg-white space-y-6 border-t border-slate-200/80 text-xs animate-in fade-in duration-150">
          
          {/* Quick Department Presets */}
          <div className="flex items-center gap-2 flex-wrap pb-3 border-b border-slate-100">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              科別快速帶入：
            </span>
            {COMMON_DEPARTMENTS.map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => {
                  const currentClass = meta.className || '';
                  if (!currentClass.includes(dept)) {
                    onChange({
                      className: `${dept}二年甲班`,
                      departmentDirector: `${dept}主任`
                    });
                  }
                }}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 font-medium transition-colors text-[11px]"
              >
                {dept}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Panel 1: School & Term */}
            <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200/70">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <GraduationCap className="w-4 h-4 text-blue-700" />
                <span>學校與學期基本設定</span>
              </div>

              <div>
                <label htmlFor="input-school-name" className="block font-medium text-slate-600 mb-1">
                  學校完整全銜
                </label>
                <input
                  id="input-school-name"
                  type="text"
                  value={meta.schoolName || ''}
                  onChange={(e) => onChange({ schoolName: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden transition-all"
                  placeholder="高雄市立中正高級工業職業學校"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="input-academic-year" className="block font-medium text-slate-600 mb-1">
                    學年度
                  </label>
                  <input
                    id="input-academic-year"
                    type="text"
                    value={meta.academicYear}
                    onChange={(e) => onChange({ academicYear: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-center focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden transition-all"
                    placeholder="115"
                  />
                </div>
                <div>
                  <label htmlFor="select-semester" className="block font-medium text-slate-600 mb-1">
                    學期
                  </label>
                  <select
                    id="select-semester"
                    value={meta.semester}
                    onChange={(e) => onChange({ semester: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden transition-all"
                  >
                    <option value="1">第 1 學期</option>
                    <option value="2">第 2 學期</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="input-form-date" className="block font-medium text-slate-600 mb-1">
                  填表日期
                </label>
                <input
                  id="input-form-date"
                  type="text"
                  value={meta.formDate}
                  onChange={(e) => onChange({ formDate: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden transition-all"
                  placeholder="例如：115 年 8 月 30 日"
                />
              </div>
            </div>

            {/* Panel 2: Course & Class */}
            <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200/70">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <BookOpen className="w-4 h-4 text-blue-700" />
                <span>授課班級與實習科目</span>
              </div>

              <div>
                <label htmlFor="input-class-name" className="block font-medium text-slate-600 mb-1">
                  授課班級
                </label>
                <input
                  id="input-class-name"
                  type="text"
                  value={meta.className}
                  onChange={(e) => onChange({ className: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden transition-all"
                  placeholder="例如：資訊科二年甲班"
                />
              </div>

              <div>
                <label htmlFor="input-course-name" className="block font-medium text-slate-600 mb-1">
                  實習課程名稱
                </label>
                <input
                  id="input-course-name"
                  type="text"
                  value={meta.courseName}
                  onChange={(e) => onChange({ courseName: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden transition-all"
                  placeholder="例如：微處理機實習"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="input-weekly-hours" className="block font-medium text-slate-600 mb-1">
                    每週節數
                  </label>
                  <input
                    id="input-weekly-hours"
                    type="text"
                    value={meta.weeklyHours}
                    onChange={(e) => onChange({ weeklyHours: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden transition-all"
                    placeholder="3"
                  />
                </div>
                <div>
                  <label htmlFor="input-credits" className="block font-medium text-slate-600 mb-1">
                    學分數
                  </label>
                  <input
                    id="input-credits"
                    type="text"
                    value={meta.credits}
                    onChange={(e) => onChange({ credits: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden transition-all"
                    placeholder="3"
                  />
                </div>
              </div>

              {/* 實習課上課星期與節次設定 */}
              <div className="pt-2 border-t border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                    <span>實習課上課星期</span>
                  </label>
                  <span className="text-[11px] font-bold text-blue-700">
                    目前：{meta.courseDayOfWeek || '星期四'}
                  </span>
                </div>

                {/* 快速按鈕切換 */}
                <div className="grid grid-cols-5 gap-1">
                  {['星期一', '星期二', '星期三', '星期四', '星期五'].map((day) => {
                    const isSelected = (meta.courseDayOfWeek || '星期四') === day;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => onChange({ courseDayOfWeek: day })}
                        className={`py-1 text-center rounded-md font-bold text-xs transition-all border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        {day.replace('星期', '週')}
                      </button>
                    );
                  })}
                </div>

                {/* 星期文字與節次輸入 */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <label htmlFor="input-day-of-week" className="block text-[11px] text-slate-500 mb-1">
                      星期自訂名稱
                    </label>
                    <input
                      id="input-day-of-week"
                      type="text"
                      value={meta.courseDayOfWeek || '星期四'}
                      onChange={(e) => onChange({ courseDayOfWeek: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden transition-all text-xs"
                      placeholder="星期四"
                    />
                  </div>
                  <div>
                    <label htmlFor="input-course-period" className="block text-[11px] text-slate-500 mb-1">
                      上課節次（選填）
                    </label>
                    <input
                      id="input-course-period"
                      type="text"
                      value={meta.coursePeriod || ''}
                      onChange={(e) => onChange({ coursePeriod: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden transition-all text-xs"
                      placeholder="例如：第 5~7 節"
                    />
                  </div>
                </div>

                {/* 常用節次快速填入標籤 */}
                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                  <span className="text-[10px] text-slate-400">常用節次：</span>
                  {['第 5~7 節', '第 1~4 節', '第 5~8 節', '第 1~3 節', '第 2~4 節'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => onChange({ coursePeriod: slot })}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-600 transition-colors cursor-pointer"
                    >
                      {slot}
                    </button>
                  ))}
                </div>

                {/* 智慧連動進度提示 */}
                <div className="text-[11px] bg-blue-50/80 border border-blue-200/70 text-blue-900 rounded-lg p-2 leading-relaxed mt-1">
                  <span className="font-bold text-blue-950">⚡ 星期進度連動：</span>
                  已設定上課為「<strong>{meta.courseDayOfWeek || '星期四'}</strong>」，若當日遇國定假日（如 9/25 中秋、10/9 國慶）或段考，進度表該欄位會<strong>自動帶入放假或段考，並以紅字突顯</strong>！
                </div>
              </div>
            </div>

            {/* Panel 3: Teachers & Groups */}
            <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200/70">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Users className="w-4 h-4 text-blue-700" />
                <span>任課教師與分組規劃</span>
              </div>

              <div>
                <label htmlFor="input-main-teacher" className="block font-medium text-slate-600 mb-1">
                  實習任課教師
                </label>
                <input
                  id="input-main-teacher"
                  type="text"
                  value={meta.mainTeacher}
                  onChange={(e) => onChange({ mainTeacher: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden transition-all"
                  placeholder="例如：陳銘智 老師"
                />
              </div>

              <div>
                <label htmlFor="input-co-teacher" className="block font-medium text-slate-600 mb-1">
                  分組任課教師（可留空）
                </label>
                <input
                  id="input-co-teacher"
                  type="text"
                  value={meta.coTeacher}
                  onChange={(e) => onChange({ coTeacher: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden transition-all"
                  placeholder="例如：林志豪 老師"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="input-group-a-name" className="block font-medium text-slate-600 mb-1">
                    第 1 組別名稱
                  </label>
                  <input
                    id="input-group-a-name"
                    type="text"
                    value={meta.groupA_name}
                    onChange={(e) => {
                      onChange({ groupA_name: e.target.value });
                      onApplyRotation(meta.groupPattern, e.target.value, meta.groupB_name);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold text-blue-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden transition-all"
                    placeholder="A組"
                  />
                </div>
                <div>
                  <label htmlFor="input-group-b-name" className="block font-medium text-slate-600 mb-1">
                    第 2 組別名稱
                  </label>
                  <input
                    id="input-group-b-name"
                    type="text"
                    value={meta.groupB_name}
                    onChange={(e) => {
                      onChange({ groupB_name: e.target.value });
                      onApplyRotation(meta.groupPattern, meta.groupA_name, e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold text-purple-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden transition-all"
                    placeholder="B組"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
