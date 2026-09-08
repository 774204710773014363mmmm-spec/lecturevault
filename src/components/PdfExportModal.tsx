import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateLecturePdf } from '../services/pdfGenerator';
import { PhotoItem } from '../types';
import {
  FileText,
  Download,
  Eye,
  Check,
  Sparkles,
  Settings,
  BookOpen,
  Sliders,
  FileCheck,
  Layers
} from 'lucide-react';

const ALL_LECTURES_VALUE = 'ALL_LECTURES';

export const PdfExportModal: React.FC = () => {
  const {
    years,
    semesters,
    subjects,
    lectures,
    photos,
    selectedSubjectId,
    setSelectedSubjectId,
    selectedLectureId,
    setSelectedLectureId,
    settings,
    t
  } = useApp();

  const isDark = settings.theme === 'dark';

  const [quality, setQuality] = useState<'original' | 'compressed'>('original');
  const [pageSize, setPageSize] = useState<'A4' | 'Original'>(settings.pdfPageSize);
  const [includeHeader, setIncludeHeader] = useState<boolean>(settings.pdfHeader);
  const [includeFooterNumbers, setIncludeFooterNumbers] = useState<boolean>(settings.pdfFooterNumbers);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('');

  const currentSubject = subjects.find(sb => sb.id === selectedSubjectId) || subjects[0];
  
  // Sort lectures of subject by number or creation order
  const subjectLectures = lectures
    .filter(l => l.subjectId === (currentSubject?.id || ''))
    .sort((a, b) => (a.lectureNumber || 0) - (b.lectureNumber || 0) || a.createdAt - b.createdAt);

  const isAllLecturesSelected = selectedLectureId === ALL_LECTURES_VALUE;

  const currentLecture = subjectLectures.find(l => l.id === selectedLectureId) || subjectLectures[0];

  // Calculate target photos to export
  let targetPhotos: (PhotoItem & { lectureTitle?: string })[] = [];

  if (isAllLecturesSelected) {
    subjectLectures.forEach((lect) => {
      const lPhotos = photos
        .filter(p => p.lectureId === lect.id)
        .sort((a, b) => a.indexNumber - b.indexNumber)
        .map(p => ({ ...p, lectureTitle: lect.title }));
      targetPhotos.push(...lPhotos);
    });
  } else if (currentLecture) {
    const lPhotos = photos
      .filter(p => p.lectureId === currentLecture.id)
      .sort((a, b) => a.indexNumber - b.indexNumber)
      .map(p => ({ ...p, lectureTitle: currentLecture.title }));
    targetPhotos = lPhotos;
  }

  const handleGeneratePdf = async () => {
    if (targetPhotos.length === 0) {
      alert('الرجاء اختيار مادة أو محاضرة تحتوي على صور لتوليد ملف الـ PDF');
      return;
    }

    setIsGenerating(true);
    setProgress(10);

    try {
      const lectureTitleToPass = isAllLecturesSelected
        ? 'كامل المادة - جميع المحاضرات'
        : (currentLecture?.title || 'المحاضرة');

      const result = await generateLecturePdf(
        targetPhotos,
        {
          quality,
          pageSize,
          includeHeader,
          includeFooterNumbers,
          subjectName: currentSubject?.name || 'المادة',
          lectureTitle: lectureTitleToPass
        },
        (prog) => setProgress(prog)
      );

      setGeneratedPdfUrl(result.dataUrl);
      setPdfFileName(result.fileName);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء توليد ملف الـ PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!generatedPdfUrl) return;
    const a = document.createElement('a');
    a.href = generatedPdfUrl;
    a.download = pdfFileName || 'lecture.pdf';
    a.click();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      
      {/* Banner */}
      <div className={`p-6 rounded-2xl border ${
        isDark
          ? 'bg-[#0F172A] border-amber-500/30 shadow-2xl'
          : 'bg-gradient-to-r from-amber-50 via-white to-amber-100/50 border-amber-500/30 shadow-md'
      }`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B45309] text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-900/30">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {t('pdfExportTitle')}
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              تجميع صور المحاضرات بترتيب تسلسلي صارم وتحويلها لملف PDF جاهز للطباعة والمشاركة
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Step 1: Select Subject & Lecture */}
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'
          } space-y-4`}>
            <label className="block text-sm font-bold text-amber-400">
              اختر المادة والمحاضرة المراد تصديرها
            </label>

            <div>
              <span className="text-xs text-slate-400 font-bold block mb-1">المادة الدراسية:</span>
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setSelectedLectureId(ALL_LECTURES_VALUE);
                }}
                className={`w-full p-3.5 rounded-xl border text-sm font-bold ${
                  isDark ? 'bg-[#0B1221] border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {subjects.map((sb) => (
                  <option key={sb.id} value={sb.id}>
                    📚 {sb.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-bold block mb-1">المحاضرة المراد تصديرها:</span>
              <select
                value={selectedLectureId}
                onChange={(e) => setSelectedLectureId(e.target.value)}
                className={`w-full p-3.5 rounded-xl border text-sm font-bold ${
                  isDark ? 'bg-[#0B1221] border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value={ALL_LECTURES_VALUE} className="font-bold text-amber-400">
                  📚 كل المحاضرات (كامل المادة)
                </option>
                {subjectLectures.map((l) => (
                  <option key={l.id} value={l.id}>
                    📄 {l.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1E293B] border border-amber-500/20 text-xs font-bold text-amber-300 flex items-center justify-between">
              <span>{isAllLecturesSelected ? 'إجمالي جميع الصور بالمادة:' : 'عدد صور المحاضرة:'}</span>
              <span className="text-sm font-mono font-bold text-amber-400">
                {targetPhotos.length} صورة
              </span>
            </div>
          </div>

          {/* Step 2: Export Options */}
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'
          } space-y-4`}>
            <label className="block text-sm font-bold text-amber-400">
              {t('exportOptions')}
            </label>

            {/* Quality Selectors */}
            <div className="space-y-2">
              <label
                onClick={() => setQuality('original')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  quality === 'original'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                    : 'bg-[#0B1221] border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  quality === 'original' ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                }`}>
                  {quality === 'original' && <Check className="w-3.5 h-3.5 text-slate-950 font-bold" />}
                </div>
                <div>
                  <span className="text-xs font-bold block">{t('exportOriginalQuality')}</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">{t('exportOriginalDesc')}</span>
                </div>
              </label>

              <label
                onClick={() => setQuality('compressed')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  quality === 'compressed'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                    : 'bg-[#0B1221] border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  quality === 'compressed' ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                }`}>
                  {quality === 'compressed' && <Check className="w-3.5 h-3.5 text-slate-950 font-bold" />}
                </div>
                <div>
                  <span className="text-xs font-bold block">{t('exportCompressedQuality')}</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">{t('exportCompressedDesc')}</span>
                </div>
              </label>
            </div>

            {/* Toggles */}
            <div className="pt-2 space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-[#0B1221] border border-slate-800 text-xs font-bold text-slate-200 cursor-pointer">
                <span>{t('includeHeader')}</span>
                <input
                  type="checkbox"
                  checked={includeHeader}
                  onChange={(e) => setIncludeHeader(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#0B1221] border border-slate-800 text-xs font-bold text-slate-200 cursor-pointer">
                <span>{t('includeFooterNumbers')}</span>
                <input
                  type="checkbox"
                  checked={includeFooterNumbers}
                  onChange={(e) => setIncludeFooterNumbers(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
              </label>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGeneratePdf}
              disabled={isGenerating || targetPhotos.length === 0}
              className={`w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
                targetPhotos.length > 0
                  ? 'bg-gradient-to-r from-[#D4AF37] via-amber-500 to-[#B45309] text-white hover:scale-[1.01] active:scale-98 cursor-pointer shadow-amber-900/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <FileText className="w-5 h-5 text-white fill-white" />
              <span>{isGenerating ? `${t('pdfGenerating')} (${progress}%)` : t('generatePdf')}</span>
            </button>
          </div>

        </div>

        {/* Live Preview / Download Area Column */}
        <div className="lg:col-span-7">
          <div className={`p-6 rounded-2xl border h-full flex flex-col justify-between ${
            isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                <span>{t('previewPdf')}</span>
              </h3>

              {generatedPdfUrl && (
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 hover:scale-105 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>{t('downloadPdf')}</span>
                </button>
              )}
            </div>

            {/* PDF Render Container */}
            <div className="my-4 flex-1 min-h-[420px] bg-[#0B1221] rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center p-2">
              {isGenerating ? (
                <div className="text-center p-8 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                  <p className="text-sm font-bold text-amber-300">{t('pdfGenerating')}</p>
                  <p className="text-xs text-slate-400">تجميع الصور وترتيبها تسلسلياً...</p>
                </div>
              ) : generatedPdfUrl ? (
                <iframe
                  src={generatedPdfUrl}
                  title="PDF Live Preview"
                  className="w-full h-full min-h-[420px] rounded-xl border border-amber-500/30"
                />
              ) : (
                <div className="text-center p-8 text-slate-500">
                  <FileCheck className="w-16 h-16 mx-auto mb-3 text-amber-500/40" />
                  <p className="text-sm font-bold text-slate-300 mb-1">اضغط على "توليد ملف الـ PDF الآن"</p>
                  <p className="text-xs text-slate-500">ستظهر المعاينة الحية وزر التحميل مباشرة هنا</p>
                </div>
              )}
            </div>

            {generatedPdfUrl && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-300 flex items-center justify-between">
                <span>{t('pdfReady')}</span>
                <span className="text-slate-400 font-mono text-[11px]">{pdfFileName}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

