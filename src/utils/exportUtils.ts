import { CalendarWeek, SyllabusPlan } from '../types';

/**
 * Generates TSV text for the Syllabus Sheet, which can be directly pasted into Google Sheets or Excel.
 */
export function generateSyllabusTSV(plan: SyllabusPlan, useFormulas: boolean = false): string {
  const { meta, rows } = plan;
  const lines: string[] = [];

  // School header rows（對齊中正高工公版）
  lines.push(`${meta.schoolShortName} ${meta.academicYear} 學年度第 ${meta.semester} 學期實習教學及作業預定進度表\t\t\t\t\t\t`);
  lines.push(`授課班級：${meta.className}\t實習課程名稱：${meta.courseName}\t\t\t\t\t`);
  lines.push(`實習任課教師：${meta.mainTeacher}\t分組任課教師：${meta.coTeacher || ''}\t\t\t\t\t`);
  lines.push(`科主任簽章：\t\t\t\t\t\t`);
  lines.push(''); // Empty separator

  // Table Headers
  lines.push(['週次', '起訖日期', '預定實習課程進度', '分組組別', '指定作業', '日常考查', '備註'].join('\t'));

  // Rows
  rows.forEach((row, index) => {
    const rowNumber = index + 6; // If headers occupy first 5 rows
    const dateCell = useFormulas
      ? `=VLOOKUP(A${rowNumber}, 行事曆主檔!$A:$E, 4, FALSE)`
      : row.dateRangeText;

    const groupCell = useFormulas && meta.groupPattern === 'alternate-2'
      ? `=IF(MOD(INT((A${rowNumber}-1)/2),2)=0, "${meta.groupA_name}", "${meta.groupB_name}")`
      : row.group;

    const noteCell = useFormulas
      ? `=IFNA(VLOOKUP(A${rowNumber}, 行事曆主檔!$A:$E, 5, FALSE), "")`
      : [row.schoolNote, row.customNote].filter(Boolean).join('；');

    lines.push([
      row.week.toString(),
      dateCell,
      escapeTsv(row.courseProgress),
      groupCell,
      escapeTsv(row.assignment),
      escapeTsv(row.assessment),
      escapeTsv(noteCell),
    ].join('\t'));
  });

  lines.push('');
  lines.push('附註\t\t\t\t\t\t');

  return lines.join('\n');
}

/**
 * Generates TSV text for the Calendar Master Sheet.
 */
export function generateCalendarTSV(calendar: CalendarWeek[]): string {
  const lines: string[] = [];
  lines.push(['週次', '開始日期', '結束日期', '日期區間文字', '學校行事與備註'].join('\t'));

  calendar.forEach((cal) => {
    lines.push([
      cal.week.toString(),
      cal.startDate,
      cal.endDate,
      cal.dateRangeText,
      escapeTsv(cal.schoolEvent),
    ].join('\t'));
  });

  return lines.join('\n');
}

function escapeTsv(str: string): string {
  if (!str) return '';
  // Clean newlines and tabs
  return str.replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  } else {
    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return Promise.resolve(successful);
  }
}

export function downloadCSV(filename: string, content: string) {
  // Add BOM for Excel UTF-8 recognition
  const bom = '\uFEFF';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
