import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Award, Plus, Save, FileSpreadsheet, FileText, CheckCircle2, AlertCircle, Users, Edit3, Trash2, UserCheck, Eye, Download, X, Printer, Image as ImageIcon, FileCode } from 'lucide-react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { StudentNode } from '../types';
import { exportGradesToDocx } from '../services/docxExporter';

export const GradesTab: React.FC = () => {
  const {
    subjects,
    students,
    batchGrades,
    addOrUpdateStudent,
    deleteStudent,
    updateBatchGrades,
    settings
  } = useApp();

  const isDark = settings.theme === 'dark';

  const [subTab, setSubTab] = useState<'students' | 'view'>('students');

  // Student Form State
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    return students.length > 0 ? students[0].id : '';
  });

  // Local grades for the currently selected student
  const [studentScores, setStudentScores] = useState<Record<string, number>>({});
  const [saveMsg, setSaveMsg] = useState(false);
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [exportedImageUrl, setExportedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const pdfTableRef = useRef<HTMLDivElement>(null);

  // Sync selected student grades when dropdown changes
  React.useEffect(() => {
    if (selectedStudentId && batchGrades[selectedStudentId]) {
      setStudentScores({ ...batchGrades[selectedStudentId] });
    } else {
      setStudentScores({});
    }
  }, [selectedStudentId, batchGrades]);

  // Keep selectedStudentId valid
  React.useEffect(() => {
    if (!selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;

    const id = editingStudentId || Date.now().toString();
    await addOrUpdateStudent({
      id,
      name: studentName.trim()
    });

    if (!editingStudentId) {
      setSelectedStudentId(id);
    }

    setStudentName('');
    setEditingStudentId(null);
  };

  const handleEditStudent = (st: StudentNode) => {
    setEditingStudentId(st.id);
    setStudentName(st.name);
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm('هل تريد حذف هذا الطالب وكافة درجاته المسجلة؟')) {
      await deleteStudent(id);
      if (selectedStudentId === id) {
        setSelectedStudentId(students.find(s => s.id !== id)?.id || '');
      }
    }
  };

  const handleScoreChange = (subjId: string, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setStudentScores(prev => ({ ...prev, [subjId]: Math.min(100, Math.max(0, num)) }));
    } else {
      setStudentScores(prev => {
        const copy = { ...prev };
        delete copy[subjId];
        return copy;
      });
    }
  };

  const handleSaveStudentGrades = async () => {
    if (!selectedStudentId) return;

    const newBatchGrades = {
      ...batchGrades,
      [selectedStudentId]: { ...studentScores }
    };

    await updateBatchGrades(newBatchGrades);
    setSaveMsg(true);
    setTimeout(() => setSaveMsg(false), 3000);
  };

  // Export full batch to Excel (.xlsx) with elegant table formatting & RTL support
  const exportBatchToExcel = () => {
    if (students.length === 0) {
      alert('لا توجد بيانات للطلاب للتصدير!');
      return;
    }

    const rows: (string | number)[][] = [];

    // Row 1: Main Title Banner
    rows.push(['كشف درجات ونتائج الطلاب - منسق المحاضرات الأكاديمي']);

    // Row 2: Metadata Info Row
    const dateStr = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    rows.push([`تاريخ التصدير: ${dateStr}   |   إجمالي الطلاب: ${students.length}   |   عدد المواد الدراسية: ${subjects.length}`]);

    // Row 3: Blank Separator Row
    rows.push([]);

    // Row 4: Table Headers Row
    const headers: string[] = ['ت', 'اسم الطالب'];
    subjects.forEach(s => {
      const inst = [s.instructorTitle, s.instructorName].filter(Boolean).join(' ');
      headers.push(inst ? `${s.name} (${inst})` : s.name);
    });
    headers.push('المجموع الكلي', 'النسبة المئوية', 'التقدير العام');
    rows.push(headers);

    // Rows 5..N: Student Data Rows
    const subjectTotals: number[] = new Array(subjects.length).fill(0);
    const subjectCounts: number[] = new Array(subjects.length).fill(0);
    let classTotalSum = 0;
    let classTotalCount = 0;

    students.forEach((st, idx) => {
      const row: (string | number)[] = [idx + 1, st.name];
      let total = 0;
      const stGrades = batchGrades[st.id] || {};

      subjects.forEach((s, subIdx) => {
        const score = stGrades[s.id];
        if (score !== undefined && score !== null && !isNaN(score)) {
          total += score;
          subjectTotals[subIdx] += score;
          subjectCounts[subIdx] += 1;
          row.push(score);
        } else {
          row.push('-');
        }
      });

      const maxScore = subjects.length * 100;
      const pct = maxScore > 0 ? Number(((total / maxScore) * 100).toFixed(1)) : 0;

      if (subjects.length > 0) {
        classTotalSum += pct;
        classTotalCount += 1;
      }

      let gradeStr = 'راسب';
      if (pct >= 90) gradeStr = 'ممتاز (A)';
      else if (pct >= 80) gradeStr = 'جيد جداً (B)';
      else if (pct >= 70) gradeStr = 'جيد (C)';
      else if (pct >= 60) gradeStr = 'مقبول (D)';

      row.push(`${total} / ${maxScore}`, `${pct}%`, gradeStr);
      rows.push(row);
    });

    // Row N+1: Blank Row
    rows.push([]);

    // Row N+2: Class Summary Row (متوسط درجات الدفعة)
    const summaryRow: (string | number)[] = ['-', 'متوسط درجات الدفعة'];
    subjects.forEach((_, subIdx) => {
      const count = subjectCounts[subIdx];
      if (count > 0) {
        const avg = Number((subjectTotals[subIdx] / count).toFixed(1));
        summaryRow.push(avg);
      } else {
        summaryRow.push('-');
      }
    });

    const classAvgPct = classTotalCount > 0 ? Number((classTotalSum / classTotalCount).toFixed(1)) : 0;
    let classAvgGrade = 'راسب';
    if (classAvgPct >= 90) classAvgGrade = 'ممتاز (A)';
    else if (classAvgPct >= 80) classAvgGrade = 'جيد جداً (B)';
    else if (classAvgPct >= 70) classAvgGrade = 'جيد (C)';
    else if (classAvgPct >= 60) classAvgGrade = 'مقبول (D)';

    summaryRow.push('-', `${classAvgPct}%`, classAvgGrade);
    rows.push(summaryRow);

    // Build Worksheet & Apply RTL + Column Widths
    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    // Enable Right-To-Left (RTL) for Arabic layout
    worksheet['!views'] = [{ RTL: true }];

    // Auto-calculate column widths for pristine visual formatting
    const colWidths = rows.reduce<number[]>((acc, row) => {
      row.forEach((cell, i) => {
        const cellStr = cell !== null && cell !== undefined ? cell.toString() : '';
        const len = Math.max(cellStr.length * 1.25, 8);
        acc[i] = Math.max(acc[i] || 8, len);
      });
      return acc;
    }, []);

    // Set precise minimum widths for guaranteed neat display
    colWidths[0] = 6;  // 'ت'
    colWidths[1] = Math.max(colWidths[1] || 25, 25); // 'اسم الطالب'
    for (let i = 2; i < 2 + subjects.length; i++) {
      colWidths[i] = Math.max(colWidths[i] || 20, 20); // Subject Columns
    }
    colWidths[2 + subjects.length] = 16; // 'المجموع الكلي'
    colWidths[3 + subjects.length] = 15; // 'النسبة المئوية'
    colWidths[4 + subjects.length] = 16; // 'التقدير العام'

    worksheet['!cols'] = colWidths.map(w => ({ wch: Math.ceil(w) }));

    const workbook = XLSX.utils.book_new();
    if (!workbook.Workbook) workbook.Workbook = {};
    if (!workbook.Workbook.Views) workbook.Workbook.Views = [{}];
    workbook.Workbook.Views[0] = { RTL: true };

    XLSX.utils.book_append_sheet(workbook, worksheet, 'كشف الدرجات الأكاديمي');

    const fileName = `كشف_درجات_الدفعة_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Export full batch to Word (.docx) report with RTL & dark navy headers
  const handleExportDocx = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (students.length === 0) {
      alert('لا توجد بيانات للطلاب للتصدير!');
      return;
    }
    setIsExportingDocx(true);
    try {
      await exportGradesToDocx(
        students,
        subjects,
        batchGrades,
        'كشف درجات ونتائج الطلاب - الدفعة الأكاديمية'
      );
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إنشاء مستند Word!');
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Export full batch as a high-res PNG image
  const exportBatchToImage = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (students.length === 0) {
      alert('لا توجد بيانات للطلاب للتصدير!');
      return;
    }
    if (!pdfTableRef.current) return;

    setIsGeneratingImage(true);
    try {
      await new Promise(res => setTimeout(res, 250));

      const canvas = await html2canvas(pdfTableRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      setExportedImageUrl(imgData);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء استخراج صورة الكشف!');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleOpenPdfPreview = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (students.length === 0) {
      alert('لا توجد بيانات للطلاب للتصدير!');
      return;
    }
    setShowPdfPreviewModal(true);
  };

  const handleTriggerPrint = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (students.length === 0) {
      alert('لا توجد بيانات للطلاب للتصدير!');
      return;
    }
    window.print();
  };

  const handleDownloadPdfFile = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!pdfTableRef.current) return;

    setIsExportingPdf(true);
    try {
      await new Promise(res => setTimeout(res, 200));

      const canvas = await html2canvas(pdfTableRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const isLandscape = subjects.length > 3;
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth - 16;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 8;

      pdf.addImage(imgData, 'PNG', 8, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 16);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 8;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 8, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      pdf.save(`كشف_درجات_الدفعة_${dateStr}.pdf`);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تحميل ملف الـ PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-amber-500/20 shadow-md'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-xl shrink-0">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">كشف وحساب درجات الطلاب والدفعات</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                رصد نتائج الطلاب لكل مادة، حساب النسب المئوية، والتصدير المباشر لملف Excel (.xlsx)
              </p>
            </div>
          </div>

          {/* Sub Nav */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/60 border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setSubTab('students')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === 'students'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              إدارة الطلاب والرصد
            </button>
            <button
              onClick={() => setSubTab('view')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === 'view'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              معاينة الكشف والتصدير
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: STUDENTS MANAGEMENT & GRADES RECORDING */}
      {subTab === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Add / Edit Student & Student List */}
          <div className="space-y-6">
            
            {/* Form: Add/Edit Student */}
            <div className={`p-6 rounded-3xl border ${
              isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200 shadow-md'
            } space-y-4`}>
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base border-b border-slate-800 pb-3">
                <Users className="w-5 h-5" />
                <span>{editingStudentId ? 'تعديل اسم الطالب' : 'إضافة طالب جديد'}</span>
              </div>

              <form onSubmit={handleSaveStudent} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="اسم الطالب..."
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{editingStudentId ? '💾 حفظ الاسم' : '+ إضافة طالب'}</span>
                  </button>

                  {editingStudentId && (
                    <button
                      type="button"
                      onClick={() => { setEditingStudentId(null); setStudentName(''); }}
                      className="px-3 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      إلغاء
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List of Registered Students */}
            <div className={`p-6 rounded-3xl border ${
              isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200 shadow-md'
            } space-y-3`}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-white">قائمة الطلاب المسجلين</h3>
                <span className="text-xs text-amber-400 font-bold">العدد: {students.length}</span>
              </div>

              {students.length === 0 ? (
                <p className="text-center py-4 text-xs text-slate-400">لا يوجد طلاب مسجلون بعد.</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {students.map((st, idx) => (
                    <div
                      key={st.id}
                      className={`flex items-center justify-between p-3 rounded-xl border ${
                        selectedStudentId === st.id
                          ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                          : isDark ? 'bg-slate-900/60 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <button
                        onClick={() => setSelectedStudentId(st.id)}
                        className="text-right flex-1 font-semibold text-xs truncate"
                      >
                        <span className="text-slate-400 ml-1.5">{idx + 1}.</span> {st.name}
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEditStudent(st)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-blue-400"
                          title="تعديل"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(st.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-red-400"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Grade Input per Subject for Selected Student */}
          <div className={`lg:col-span-2 p-6 rounded-3xl border ${
            isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200 shadow-md'
          } space-y-6`}>
            
            <div className="space-y-2 border-b border-slate-800 pb-4">
              <label className="block text-xs font-semibold text-slate-400">اختر الطالب المراد رصد درجاته:</label>
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className={`w-full p-3 rounded-2xl border text-sm font-bold focus:outline-none focus:border-amber-500 ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {students.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>

            {!selectedStudentId || subjects.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm border border-dashed border-slate-800 rounded-2xl">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                يرجى إضافة طلاب ومواد أولاً لبدء رصد الدرجات.
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {subjects.map(s => {
                  const inst = [s.instructorTitle, s.instructorName].filter(Boolean).join(' ');
                  const currentScore = studentScores[s.id] !== undefined ? studentScores[s.id] : '';

                  return (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border ${
                        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-2">
                          <span>{s.name}</span>
                          {s.code && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {s.code}
                            </span>
                          )}
                        </div>
                        {inst && <p className="text-xs text-slate-400 mt-0.5">المدرس: {inst}</p>}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="من 100"
                          value={currentScore}
                          onChange={e => handleScoreChange(s.id, e.target.value)}
                          className={`w-28 px-3 py-2 text-center rounded-xl text-sm font-bold border focus:outline-none focus:border-amber-500 ${
                            isDark ? 'bg-slate-950 border-slate-700 text-amber-400' : 'bg-white border-slate-300 text-amber-700'
                          }`}
                        />
                        <span className="text-xs font-semibold text-slate-400">/ 100</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedStudentId && subjects.length > 0 && (
              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={handleSaveStudentGrades}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/30 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>💾 حفظ درجات الطالب</span>
                </button>

                {saveMsg && (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 animate-pulse">
                    <CheckCircle2 className="w-4 h-4" />
                    تم حفظ درجات الطالب بنجاح!
                  </span>
                )}
              </div>
            )}

          </div>

        </div>
      )}

      {/* SUB-TAB 2: BATCH SHEET PREVIEW & EXCEL EXPORT */}
      {subTab === 'view' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-3xl border overflow-x-auto ${
            isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200 shadow-md'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-bold text-lg text-white">كشف درجات الدفعة كاملة</h3>
                <p className="text-xs text-slate-400 mt-1">عرض ومقارنة نتائج جميع الطلاب عبر كافة المواد الدراسية</p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={exportBatchToImage}
                  disabled={isGeneratingImage}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>{isGeneratingImage ? 'جاري استخراج الصورة...' : '🖼️ تصدير كصورة (PNG)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportDocx}
                  disabled={isExportingDocx}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-700 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-sm shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  <span>{isExportingDocx ? 'جاري التصدير...' : '📄 تصدير Word (.docx)'}</span>
                </button>

                <button
                  type="button"
                  onClick={exportBatchToExcel}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all shrink-0 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>📊 تصدير Excel</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerPrint}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-md transition-all shrink-0 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>🖨️ طباعة الكشف</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenPdfPreview}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-sm shadow-md transition-all shrink-0 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>معاينة الكشف</span>
                </button>
              </div>
            </div>

            {students.length === 0 || subjects.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-sm">لا توجد بيانات طلاب أو مواد كافية لبناء الكشف.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-center text-sm border-collapse">
                  <thead>
                    <tr className={`border-b text-xs font-bold text-amber-400 ${
                      isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-slate-100'
                    }`}>
                      <th className="p-3 border border-slate-800">#</th>
                      <th className="p-3 border border-slate-800 text-right min-w-[150px]">اسم الطالب</th>
                      {subjects.map(s => {
                        const inst = [s.instructorTitle, s.instructorName].filter(Boolean).join(' ');
                        return (
                          <th key={s.id} className="p-3 border border-slate-800 min-w-[120px]">
                            {s.name}
                            {inst && <div className="text-[10px] text-slate-400 font-normal">{inst}</div>}
                          </th>
                        );
                      })}
                      <th className="p-3 border border-slate-800 min-w-[100px]">المجموع</th>
                      <th className="p-3 border border-slate-800 min-w-[100px]">النسبة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {students.map((st, i) => {
                      let total = 0;
                      const stGrades = batchGrades[st.id] || {};
                      const maxScore = subjects.length * 100;

                      return (
                        <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 border border-slate-800 font-bold text-slate-400">{i + 1}</td>
                          <td className="p-3 border border-slate-800 font-bold text-right text-white">{st.name}</td>
                          {subjects.map(sub => {
                            const sc = stGrades[sub.id];
                            if (sc !== undefined && sc !== null && !isNaN(sc)) {
                              total += sc;
                              return (
                                <td key={sub.id} className="p-3 border border-slate-800 font-semibold text-amber-300">
                                  {sc}
                                </td>
                              );
                            }
                            return <td key={sub.id} className="p-3 border border-slate-800 text-slate-500">-</td>;
                          })}
                          <td className="p-3 border border-slate-800 font-bold text-amber-400">
                            {total} / {maxScore}
                          </td>
                          <td className="p-3 border border-slate-800 font-bold text-emerald-400">
                            {maxScore > 0 ? ((total / maxScore) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Printable HTML Template for PDF Generation and Printing */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none">
        <div
          ref={pdfTableRef}
          className="printable-area"
          style={{
            width: subjects.length > 3 ? '1100px' : '820px',
            backgroundColor: '#FFFFFF',
            color: '#0F172A',
            padding: '36px',
            fontFamily: 'sans-serif',
            boxSizing: 'border-box'
          }}
          dir="rtl"
        >
          {/* Header Banner */}
          <div style={{ borderBottom: '3px solid #0F172A', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>كشف درجات ونتائج الطلاب - الدفعة الأكاديمية</h1>
              <p style={{ fontSize: '13px', color: '#475569', margin: '6px 0 0 0' }}>صادر رسمياً عن تطبيق منسق المحاضرات الأكاديمي</p>
            </div>
            <div style={{ textAlign: 'left', fontSize: '12px', color: '#334155', lineHeight: '1.7' }}>
              <div>تاريخ التصدير: {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div>عدد الطلاب: {students.length} | عدد المواد: {subjects.length}</div>
            </div>
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0F172A', color: '#FFFFFF', fontWeight: 'bold' }}>
                <th style={{ padding: '10px 6px', border: '1px solid #1E293B', width: '36px' }}>#</th>
                <th style={{ padding: '10px 12px', border: '1px solid #1E293B', textAlign: 'right', minWidth: '160px' }}>اسم الطالب</th>
                {subjects.map(s => {
                  const inst = [s.instructorTitle, s.instructorName].filter(Boolean).join(' ');
                  return (
                    <th key={s.id} style={{ padding: '10px 8px', border: '1px solid #1E293B' }}>
                      <div style={{ fontSize: '13px' }}>{s.name}</div>
                      {inst && <div style={{ fontSize: '10px', color: '#CBD5E1', fontWeight: 'normal' }}>{inst}</div>}
                    </th>
                  );
                })}
                <th style={{ padding: '10px 6px', border: '1px solid #1E293B', backgroundColor: '#1E293B', width: '90px' }}>المجموع</th>
                <th style={{ padding: '10px 6px', border: '1px solid #1E293B', backgroundColor: '#1E293B', width: '70px' }}>النسبة</th>
                <th style={{ padding: '10px 6px', border: '1px solid #1E293B', backgroundColor: '#1E293B', width: '95px' }}>التقدير</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st, i) => {
                let total = 0;
                const stGrades = batchGrades[st.id] || {};
                const maxScore = subjects.length * 100;

                subjects.forEach(sub => {
                  const sc = stGrades[sub.id];
                  if (sc !== undefined && sc !== null && !isNaN(sc)) {
                    total += sc;
                  }
                });

                const pct = maxScore > 0 ? Number(((total / maxScore) * 100).toFixed(1)) : 0;
                let gradeStr = 'راسب';
                let gradeBg = '#FEE2E2';
                let gradeColor = '#991B1B';

                if (pct >= 90) { gradeStr = 'ممتاز (A)'; gradeBg = '#DCFCE7'; gradeColor = '#166534'; }
                else if (pct >= 80) { gradeStr = 'جيد جداً (B)'; gradeBg = '#E0E7FF'; gradeColor = '#3730A3'; }
                else if (pct >= 70) { gradeStr = 'جيد (C)'; gradeBg = '#FEF9C3'; gradeColor = '#854D0E'; }
                else if (pct >= 60) { gradeStr = 'مقبول (D)'; gradeBg = '#FFEDD5'; gradeColor = '#9A3412'; }

                const isEven = i % 2 === 0;

                return (
                  <tr key={st.id} style={{ backgroundColor: isEven ? '#FFFFFF' : '#F8FAFC' }}>
                    <td style={{ padding: '9px 6px', border: '1px solid #CBD5E1', fontWeight: 'bold', color: '#64748B' }}>{i + 1}</td>
                    <td style={{ padding: '9px 12px', border: '1px solid #CBD5E1', fontWeight: 'bold', textAlign: 'right', color: '#0F172A' }}>{st.name}</td>
                    {subjects.map(sub => {
                      const sc = stGrades[sub.id];
                      const hasVal = sc !== undefined && sc !== null && !isNaN(sc);
                      return (
                        <td key={sub.id} style={{ padding: '9px 6px', border: '1px solid #CBD5E1', fontWeight: 'bold', color: hasVal ? '#0F172A' : '#94A3B8' }}>
                          {hasVal ? sc : '-'}
                        </td>
                      );
                    })}
                    <td style={{ padding: '9px 6px', border: '1px solid #CBD5E1', fontWeight: 'bold', color: '#0F172A', backgroundColor: isEven ? '#F1F5F9' : '#E2E8F0' }}>
                      {total} / {maxScore}
                    </td>
                    <td style={{ padding: '9px 6px', border: '1px solid #CBD5E1', fontWeight: 'bold', color: '#047857' }}>
                      {pct}%
                    </td>
                    <td style={{ padding: '7px 4px', border: '1px solid #CBD5E1' }}>
                      <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', backgroundColor: gradeBg, color: gradeColor }}>
                        {gradeStr}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer Watermark */}
          <div style={{ marginTop: '24px', paddingTop: '12px', borderTop: '1px solid #E2E8F0', textAlign: 'center', fontSize: '11px', color: '#94A3B8' }}>
            تم التوثيق والتصدير أوتوماتيكياً بواسطة تطبيق منسق المحاضرات الأكاديمي
          </div>
        </div>
      </div>

      {/* Modal for PDF Preview & Direct Download */}
      {showPdfPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-5xl max-h-[90vh] flex flex-col p-6 rounded-3xl border shadow-2xl space-y-4 ${
            isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                <Eye className="w-5 h-5 text-amber-400" />
                <span>معاينة كشف درجات الطلاب (جاهز للطباعة والتصدير)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPdfPreviewModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Printable Paper Preview */}
            <div className="flex-1 overflow-auto rounded-2xl bg-slate-900 border border-slate-800 p-4 custom-scrollbar">
              <div
                className="bg-white text-slate-900 rounded-xl p-8 shadow-2xl mx-auto max-w-full"
                dir="rtl"
                style={{ fontFamily: 'sans-serif' }}
              >
                {/* Header Banner */}
                <div style={{ borderBottom: '3px solid #0F172A', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>كشف درجات ونتائج الطلاب - الدفعة الأكاديمية</h1>
                    <p style={{ fontSize: '12px', color: '#475569', margin: '4px 0 0 0' }}>صادر رسمياً عن تطبيق منسق المحاضرات الأكاديمي</p>
                  </div>
                  <div style={{ textAlign: 'left', fontSize: '11px', color: '#334155', lineHeight: '1.6' }}>
                    <div>التاريخ: {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <div>عدد الطلاب: {students.length} | عدد المواد: {subjects.length}</div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0F172A', color: '#FFFFFF', fontWeight: 'bold' }}>
                        <th style={{ padding: '8px 6px', border: '1px solid #1E293B', width: '32px' }}>#</th>
                        <th style={{ padding: '8px 10px', border: '1px solid #1E293B', textAlign: 'right', minWidth: '150px' }}>اسم الطالب</th>
                        {subjects.map(s => {
                          const inst = [s.instructorTitle, s.instructorName].filter(Boolean).join(' ');
                          return (
                            <th key={s.id} style={{ padding: '8px 6px', border: '1px solid #1E293B' }}>
                              <div style={{ fontSize: '12px' }}>{s.name}</div>
                              {inst && <div style={{ fontSize: '10px', color: '#CBD5E1', fontWeight: 'normal' }}>{inst}</div>}
                            </th>
                          );
                        })}
                        <th style={{ padding: '8px 6px', border: '1px solid #1E293B', backgroundColor: '#1E293B', width: '80px' }}>المجموع</th>
                        <th style={{ padding: '8px 6px', border: '1px solid #1E293B', backgroundColor: '#1E293B', width: '65px' }}>النسبة</th>
                        <th style={{ padding: '8px 6px', border: '1px solid #1E293B', backgroundColor: '#1E293B', width: '90px' }}>التقدير</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((st, i) => {
                        let total = 0;
                        const stGrades = batchGrades[st.id] || {};
                        const maxScore = subjects.length * 100;

                        subjects.forEach(sub => {
                          const sc = stGrades[sub.id];
                          if (sc !== undefined && sc !== null && !isNaN(sc)) {
                            total += sc;
                          }
                        });

                        const pct = maxScore > 0 ? Number(((total / maxScore) * 100).toFixed(1)) : 0;
                        let gradeStr = 'راسب';
                        let gradeBg = '#FEE2E2';
                        let gradeColor = '#991B1B';

                        if (pct >= 90) { gradeStr = 'ممتاز (A)'; gradeBg = '#DCFCE7'; gradeColor = '#166534'; }
                        else if (pct >= 80) { gradeStr = 'جيد جداً (B)'; gradeBg = '#E0E7FF'; gradeColor = '#3730A3'; }
                        else if (pct >= 70) { gradeStr = 'جيد (C)'; gradeBg = '#FEF9C3'; gradeColor = '#854D0E'; }
                        else if (pct >= 60) { gradeStr = 'مقبول (D)'; gradeBg = '#FFEDD5'; gradeColor = '#9A3412'; }

                        const isEven = i % 2 === 0;

                        return (
                          <tr key={st.id} style={{ backgroundColor: isEven ? '#FFFFFF' : '#F8FAFC' }}>
                            <td style={{ padding: '8px 6px', border: '1px solid #CBD5E1', fontWeight: 'bold', color: '#64748B' }}>{i + 1}</td>
                            <td style={{ padding: '8px 10px', border: '1px solid #CBD5E1', fontWeight: 'bold', textAlign: 'right', color: '#0F172A' }}>{st.name}</td>
                            {subjects.map(sub => {
                              const sc = stGrades[sub.id];
                              const hasVal = sc !== undefined && sc !== null && !isNaN(sc);
                              return (
                                <td key={sub.id} style={{ padding: '8px 6px', border: '1px solid #CBD5E1', fontWeight: 'bold', color: hasVal ? '#0F172A' : '#94A3B8' }}>
                                  {hasVal ? sc : '-'}
                                </td>
                              );
                            })}
                            <td style={{ padding: '8px 6px', border: '1px solid #CBD5E1', fontWeight: 'bold', color: '#0F172A', backgroundColor: isEven ? '#F1F5F9' : '#E2E8F0' }}>
                              {total} / {maxScore}
                            </td>
                            <td style={{ padding: '8px 6px', border: '1px solid #CBD5E1', fontWeight: 'bold', color: '#047857' }}>
                              {pct}%
                            </td>
                            <td style={{ padding: '6px 4px', border: '1px solid #CBD5E1' }}>
                              <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', backgroundColor: gradeBg, color: gradeColor }}>
                                {gradeStr}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #E2E8F0', textAlign: 'center', fontSize: '10px', color: '#94A3B8' }}>
                  تم التوثيق أوتوماتيكياً بواسطة تطبيق منسق المحاضرات الأكاديمي
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 shrink-0">
              <span className="text-xs text-slate-400">اختر طريقة الحفظ أو الطباعة:</span>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportDocx}
                  disabled={isExportingDocx}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-700 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-sm shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  <span>{isExportingDocx ? 'جاري التصدير...' : '📄 ملف Word (.docx)'}</span>
                </button>

                <button
                  type="button"
                  onClick={exportBatchToImage}
                  disabled={isGeneratingImage}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>{isGeneratingImage ? 'جاري الاستخراج...' : '🖼️ استخراج صورة HD'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerPrint}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>🖨️ طباعة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPdfPreviewModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-sm transition-all cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Image Export (PNG) */}
      {exportedImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className={`w-full max-w-5xl max-h-[92vh] flex flex-col p-6 rounded-3xl border shadow-2xl space-y-4 ${
            isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-base">
                <ImageIcon className="w-5 h-5 text-blue-400" />
                <span>صورة كشف الدرجات (عالية الدقة HD)</span>
              </div>
              <button
                type="button"
                onClick={() => setExportedImageUrl(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction Tip */}
            <div className="p-3 rounded-xl bg-blue-950/50 border border-blue-800/60 text-blue-200 text-xs flex items-center gap-2 shrink-0">
              <span>💡</span>
              <span>يمكنك الضغط على زر <b>تحميل الصورة</b> بالأسفل، أو النقر بالزر الأيمن (أو الضغط المطوّل على الجوال) وحفظ الصورة بوضوح تام.</span>
            </div>

            {/* Image Container */}
            <div className="flex-1 overflow-auto rounded-2xl bg-slate-900 border border-slate-800 p-4 flex items-center justify-center custom-scrollbar">
              <img
                src={exportedImageUrl}
                alt="كشف الدرجات الأكاديمي"
                className="max-w-full h-auto rounded-xl shadow-2xl border border-slate-700 bg-white"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 shrink-0">
              <span className="text-xs text-slate-400">صيغة الصورة: PNG عالي الدقة</span>
              <div className="flex items-center gap-3">
                <a
                  href={exportedImageUrl}
                  download={`كشف_درجات_الدفعة_${new Date().toISOString().slice(0, 10)}.png`}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>📥 تحميل الصورة (PNG)</span>
                </a>
                <button
                  type="button"
                  onClick={() => setExportedImageUrl(null)}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
