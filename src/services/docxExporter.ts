import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType, WidthType, ShadingType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

export interface StudentData {
  id: string;
  name: string;
  [key: string]: any;
}

export interface SubjectData {
  id: string;
  name: string;
  instructorTitle?: string;
  instructorName?: string;
  maxGrade?: number;
}

export async function exportGradesToDocx(
  students: StudentData[],
  subjects: SubjectData[],
  batchGrades: Record<string, Record<string, number>>,
  titleName: string = 'كشف درجات ونتائج الطلاب - مرتب حسب الترتيب الأكاديمي'
) {
  const maxScore = subjects.length * 100;

  // Calculate scores and percentages for sorting
  const processedStudents = students.map(st => {
    let total = 0;
    const stGrades = batchGrades[st.id] || {};
    subjects.forEach(sub => {
      const sc = stGrades[sub.id];
      if (sc !== undefined && sc !== null && !isNaN(sc)) {
        total += sc;
      }
    });
    const pct = maxScore > 0 ? Number(((total / maxScore) * 100).toFixed(1)) : 0;
    return {
      student: st,
      stGrades,
      total,
      pct,
    };
  });

  // Sort students automatically from highest to lowest score
  processedStudents.sort((a, b) => b.total - a.total);

  // Headers: الترتيب, اسم الطالب, Subject 1, Subject 2..., المجموع (MaxScore), النسبة, التقدير
  const headers = [
    'الترتيب',
    'اسم الطالب',
    ...subjects.map(s => s.name),
    `المجموع (${maxScore})`,
    'النسبة',
    'التقدير'
  ];

  // Header row cells
  const headerRowCells = headers.map((headerText) => {
    return new TableCell({
      shading: {
        fill: '1F4E78', // Dark Navy
        type: ShadingType.CLEAR,
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: '1F4E78' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: '1F4E78' },
        left: { style: BorderStyle.SINGLE, size: 1, color: '1F4E78' },
        right: { style: BorderStyle.SINGLE, size: 1, color: '1F4E78' },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          bidirectional: true,
          children: [
            new TextRun({
              text: headerText,
              bold: true,
              color: 'FFFFFF',
              font: 'Arial',
              size: 20, // 10pt
            }),
          ],
        }),
      ],
    });
  });

  const tableRows = [
    new TableRow({
      tableHeader: true,
      children: headerRowCells,
    }),
  ];

  // Fill student data rows (sorted automatically)
  processedStudents.forEach((item, idx) => {
    const rank = idx + 1; // Rank number: 1, 2, 3...
    const { student: st, stGrades, total, pct } = item;

    const subjectCells = subjects.map(sub => {
      const sc = stGrades[sub.id];
      const hasVal = sc !== undefined && sc !== null && !isNaN(sc);
      return new TableCell({
        shading: {
          fill: rank % 2 === 0 ? 'F2F4F7' : 'FFFFFF',
          type: ShadingType.CLEAR,
        },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
          left: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
          right: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            children: [
              new TextRun({
                text: hasVal ? String(sc) : '-',
                bold: hasVal,
                color: hasVal ? '0F172A' : '94A3B8',
                font: 'Arial',
                size: 19, // 9.5pt
              }),
            ],
          }),
        ],
      });
    });

    let gradeStr = 'راسب (F)';
    let gradeColor = '991B1B'; // Red

    if (pct >= 90) { gradeStr = 'ممتاز (A)'; gradeColor = '166534'; }
    else if (pct >= 80) { gradeStr = 'جيد جداً (B)'; gradeColor = '3730A3'; }
    else if (pct >= 70) { gradeStr = 'جيد (C)'; gradeColor = '854D0E'; }
    else if (pct >= 60) { gradeStr = 'مقبول (D)'; gradeColor = '9A3412'; }

    const bgCol = rank % 2 === 0 ? 'F2F4F7' : 'FFFFFF';

    const rowCells = [
      // Rank Number (Bold)
      new TableCell({
        shading: { fill: bgCol, type: ShadingType.CLEAR },
        borders: { top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' }, left: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' }, right: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' } },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            children: [new TextRun({ text: String(rank), bold: true, color: '1F4E78', font: 'Arial', size: 19 })],
          }),
        ],
      }),
      // Name
      new TableCell({
        shading: { fill: bgCol, type: ShadingType.CLEAR },
        borders: { top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' }, left: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' }, right: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' } },
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            children: [new TextRun({ text: st.name, bold: true, color: '0F172A', font: 'Arial', size: 19 })],
          }),
        ],
      }),
      // Subjects
      ...subjectCells,
      // Total
      new TableCell({
        shading: { fill: bgCol, type: ShadingType.CLEAR },
        borders: { top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' }, left: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' }, right: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' } },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            children: [new TextRun({ text: String(total), bold: true, color: '0F172A', font: 'Arial', size: 19 })],
          }),
        ],
      }),
      // Percentage
      new TableCell({
        shading: { fill: bgCol, type: ShadingType.CLEAR },
        borders: { top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' }, left: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' }, right: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' } },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            children: [new TextRun({ text: `${pct}%`, bold: true, color: '047857', font: 'Arial', size: 19 })],
          }),
        ],
      }),
      // Grade / Status
      new TableCell({
        shading: { fill: bgCol, type: ShadingType.CLEAR },
        borders: { top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' }, left: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' }, right: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' } },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            children: [new TextRun({ text: gradeStr, bold: true, color: gradeColor, font: 'Arial', size: 19 })],
          }),
        ],
      }),
    ];

    tableRows.push(new TableRow({ children: rowCells }));
  });

  const table = new Table({
    alignment: AlignmentType.CENTER,
    visuallyRightToLeft: true,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: titleName,
                bold: true,
                size: 36, // 18pt
                color: '1F4E78',
                font: 'Arial',
              }),
            ],
          }),
          // Subtitle
          new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: `إجمالي الطلاب: ${processedStudents.length}  |  تم الترتيب آلياً من الأول إلى الأخير`,
                size: 20, // 10pt
                color: '646464',
                font: 'Arial',
              }),
            ],
          }),
          // Table
          table,
          // Footer note
          new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { before: 400 },
            children: [
              new TextRun({
                text: 'تم التوثيق رسمياً بواسطة تطبيق منسق المحاضرات الأكاديمي',
                size: 18, // 9pt
                italics: true,
                color: '808080',
                font: 'Arial',
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `كشف_الدرجات_المرتب_${new Date().toISOString().slice(0, 10)}.docx`;
  saveAs(blob, fileName);
}
