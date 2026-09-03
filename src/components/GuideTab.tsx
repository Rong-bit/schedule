import React from 'react';
import { BookOpen, CheckCircle, FileSpreadsheet, Printer, Sparkles, Calendar, Layers } from 'lucide-react';

export const GuideTab: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(15,23,42,0.05)] p-6 sm:p-8 space-y-8 text-slate-800 max-w-4xl mx-auto">
      {/* Introduction */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>技術型高中專用設計</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 font-sans">
          高工實習教學及作業預定進度表 — 系統設計與操作指引
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          本系統專為解決高工實習課老師填寫教學進度表時的痛點設計。完全比照高雄市立中正高工公版格式，老師只要專注填寫每週的「實習課程進度」，其餘（週次 1~21、起訖日期、學校重要行事、實習分組輪調）皆由系統自動連動帶出，並可直接輸出標準 A4 公版文件或匯入 Google 試算表！
        </p>
      </div>

      {/* 3 Simple Steps */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-sans">
          <Layers className="w-4 h-4 text-blue-700" />
          <span>老師三步驟快速完成進度表</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="w-6 h-6 rounded-md bg-blue-700 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
              1
            </div>
            <h4 className="font-bold text-slate-900 text-sm">確認班級與課程表頭</h4>
            <p className="text-slate-600 leading-relaxed">
              點擊「修改表頭」，填入授課班級（如：資訊二甲）、實習課程名稱（如：微處理機實習）、任課教師與節數。
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="w-6 h-6 rounded-md bg-blue-700 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
              2
            </div>
            <h4 className="font-bold text-slate-900 text-sm">填寫預定實習課程進度</h4>
            <p className="text-slate-600 leading-relaxed">
              在表格中央的「預定實習課程進度」欄位直接輸入，或點擊「快速填寫」貼上半學期進度：系統會略過放假／段考／自訂工作，並讓 A、B 兩組同序位顯示相同課程。
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="w-6 h-6 rounded-md bg-blue-700 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
              3
            </div>
            <h4 className="font-bold text-slate-900 text-sm">直接列印或匯出試算表</h4>
            <p className="text-slate-600 leading-relaxed">
              點擊「列印 / 匯出 PDF」即可產出精準 A4 單頁公版排版；亦可複製 TSV 格式直接貼上至 Google 試算表。
            </p>
          </div>
        </div>
      </div>

      {/* Google Calendar sync tip */}
      <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 space-y-2">
        <div className="font-bold flex items-center gap-1.5 text-sm text-indigo-950 font-sans">
          <Calendar className="w-4 h-4 text-indigo-700" />
          <span>同步中正高工 Google 日曆到備註欄</span>
        </div>
        <p className="leading-relaxed text-indigo-900/90">
          切換到「行事曆主檔」分頁，可一鍵從學校公開 Google 日曆（教務處、學務處、實習處、國定假日等）同步行程。系統會依各週起訖日期寫入「學校行事備註」，並自動帶入教學進度表的備註欄（G 欄）。建議勾選「僅同步重要行事」，避免備註過於冗長。
        </p>
      </div>

      {/* Google Sheets Architecture & Formula Comparison */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-sans">
          <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
          <span>Google 試算表（Google Sheets）雙表架構與公式對照</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          若學校習慣以 Google Sheets 協同作業，您可在試算表中建立兩個工作表，即可達成與本網頁相同的自動化效果：
        </p>

        <div className="space-y-3 text-xs">
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2">
            <div className="font-bold text-slate-900">
              工作表 1：【行事曆主檔】（教學組或科主任一次填好）
            </div>
            <p className="text-slate-600 text-[11px]">
              欄位依序為：A欄（週次 1~21）、B欄（開始日期）、C欄（結束日期）、D欄（日期區間文字）、E欄（學校行事與備註）。
            </p>
            <div className="bg-slate-900 text-slate-200 p-2.5 rounded-lg font-mono text-[11px] border border-slate-800">
              D2 欄日期區間公式：=TEXT(B2,"m/d(aaa)")&"-"&TEXT(C2,"m/d(aaa)")
            </div>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2">
            <div className="font-bold text-slate-900">
              工作表 2：【教學進度表】（供老師填寫與列印）
            </div>
            <ul className="space-y-2 text-slate-700">
              <li className="flex flex-col gap-1">
                <span className="font-semibold text-slate-800">
                  起訖日期（B欄）：自動從行事曆抓取對應週次區間
                </span>
                <code className="bg-slate-900 text-emerald-400 p-2 rounded-lg font-mono text-[11px] border border-slate-800">
                  =VLOOKUP(A6, 行事曆主檔!$A:$E, 4, FALSE)
                </code>
              </li>
              <li className="flex flex-col gap-1">
                <span className="font-semibold text-slate-800">
                  分組組別（D欄）：每 2 週自動輪調（A組、B組輪換）
                </span>
                <code className="bg-slate-900 text-amber-400 p-2 rounded-lg font-mono text-[11px] border border-slate-800">
                  =IF(MOD(INT((A6-1)/2),2)=0, "A", "B")
                </code>
              </li>
              <li className="flex flex-col gap-1">
                <span className="font-semibold text-slate-800">
                  備註欄（G欄）：自動帶入學校重大行事（如段考、放假、開學日等）
                </span>
                <code className="bg-slate-900 text-blue-400 p-2 rounded-lg font-mono text-[11px] border border-slate-800">
                  =IFNA(VLOOKUP(A6, 行事曆主檔!$A:$E, 5, FALSE), "")
                </code>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Printing Tips */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-2">
        <div className="font-bold flex items-center gap-1.5 text-sm text-blue-950 font-sans">
          <Printer className="w-4 h-4 text-blue-700" />
          <span>🖨️ 列印與輸出 PDF 建議設定</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-blue-900 font-medium">
          <li><strong>目標印表機</strong>：可選擇實體印表機或「另存為 PDF」。</li>
          <li><strong>紙張方向</strong>：A4 直向（Portrait），系統已自動優化 21 週的列印字級與邊框。</li>
          <li><strong>邊界</strong>：建議選擇「預設」或「基本」。</li>
          <li><strong>選項</strong>：請務必勾選「背景圖形」，以確保表頭灰色背景正確印出。</li>
        </ul>
      </div>
    </div>
  );
};
