import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { createLecturePackageZip, parseLecturePackageZip } from '../services/zipSync';
import {
  RefreshCw,
  UploadCloud,
  Download,
  Package,
  CheckCircle,
  FileArchive,
  ArrowRight,
  BookOpen
} from 'lucide-react';

export const SmartSyncModal: React.FC = () => {
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
    importPackageData,
    exportBackup,
    importBackup,
    setActiveTab,
    settings,
    t
  } = useApp();

  const isDark = settings.theme === 'dark';

  const [exportLectureId, setExportLectureId] = useState<string>(selectedLectureId || (lectures[0]?.id || ''));
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExportFullBackup = async () => {
    try {
      const jsonStr = await exportBackup();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `جامعة_نسخة_احتياطية_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تصدير النسخة الاحتياطية.');
    }
  };

  const handleImportFullBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const content = evt.target?.result as string;
        const success = await importBackup(content);
        if (success) {
          alert('تمت استعادة كافة بيانات النظام والدرجات بنجاح!');
        } else {
          alert('ملف النسخة الاحتياطية غير صالح.');
        }
      } catch (err) {
        alert('حدث خطأ أثناء قراءة الملف.');
      }
    };
    reader.readAsText(file);
  };

  // Handle Package Export
  const handleExportZip = async () => {
    const targetLecture = lectures.find(l => l.id === exportLectureId);
    if (!targetLecture) {
      alert('الرجاء اختيار محاضرة لتصديرها');
      return;
    }

    const lecturePhotos = photos.filter(p => p.lectureId === targetLecture.id);
    if (lecturePhotos.length === 0) {
      alert('المحاضرة المختارة لا تحتوي على صور لتصديرها');
      return;
    }

    const targetSubject = subjects.find(s => s.id === targetLecture.subjectId);
    const targetSemester = semesters.find(s => s.id === targetSubject?.semesterId);
    const targetYear = years.find(y => y.id === targetSemester?.yearId);

    setIsExporting(true);

    try {
      const zipBlob = await createLecturePackageZip(
        targetYear?.name || 'السنة الأولى',
        targetSemester?.name || 'الفصل الدراسي الأول',
        targetSubject?.name || 'المادة',
        targetLecture.lectureNumber,
        targetLecture.title,
        lecturePhotos
      );

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${targetSubject?.name || 'المادة'}_${targetLecture.title}.lecture.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إنشاء حزمة المحاضرة');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Package Import
  const handleImportZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const zipFile = files[0];
    setIsImporting(true);
    setImportStatus(null);

    try {
      const parsed = await parseLecturePackageZip(zipFile);
      const newLect = await importPackageData(parsed.metadata, parsed.photos);

      setImportStatus(`تم استيراد المحاضرة "${newLect.title}" بنجاح مع (${parsed.photos.length}) صورة ووضعها أوتوماتيكياً تحت مادة "${parsed.metadata.subjectName}"!`);
      setSelectedLectureId(newLect.id);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'فشل استيراد الحزمة. تأكد من أن الملف هو حزمة تصدير صالحة من التطبيق (.zip)');
    } finally {
      setIsImporting(false);
    }
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
            <RefreshCw className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {t('syncTitle')}
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              تصدير واستيراد حزم المحاضرات بالكامل (.zip) لنقلها بين الكمبيوتر والجوال مع التوزيع الشجري التلقائي بدون تدخل يدوي
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Export Card */}
        <div className={`p-6 rounded-2xl border ${
          isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'
        } space-y-5 shadow-xl flex flex-col justify-between`}>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-amber-400">{t('exportPackage')}</h3>
                <p className="text-xs text-slate-400">{t('exportPackageDesc')}</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                {t('selectLectureToExport')}
              </label>
              <select
                value={exportLectureId}
                onChange={(e) => setExportLectureId(e.target.value)}
                className={`w-full p-3.5 rounded-xl border text-sm font-bold ${
                  isDark ? 'bg-[#0B1221] border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {lectures.map((l) => (
                  <option key={l.id} value={l.id}>
                    📄 {l.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleExportZip}
            disabled={isExporting || lectures.length === 0}
            className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B45309] text-white font-bold text-sm shadow-xl shadow-amber-900/30 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-98 transition-all"
          >
            <Download className="w-5 h-5 text-white" />
            <span>{isExporting ? 'جاري تجهيز الحزمة المضغوطة...' : t('downloadPackageZip')}</span>
          </button>
        </div>

        {/* Import Card */}
        <div className={`p-6 rounded-2xl border ${
          isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'
        } space-y-5 shadow-xl flex flex-col justify-between`}>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-400">{t('importPackage')}</h3>
                <p className="text-xs text-slate-400">{t('importPackageDesc')}</p>
              </div>
            </div>

            <label className="border-2 border-dashed border-emerald-500/40 rounded-2xl p-8 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-500/5 transition-all block bg-[#0B1221]/50">
              <FileArchive className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
              <span className="text-sm font-bold text-slate-200 mb-1">{t('uploadPackageZip')}</span>
              <span className="text-xs text-slate-400">ملفات الحزم المعززة بـ metadata.json</span>
              <input
                type="file"
                accept=".zip,.lecture"
                onChange={handleImportZip}
                className="hidden"
              />
            </label>
          </div>

          {isImporting && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold text-center">
              {t('importingNotice')}
            </div>
          )}

          {importStatus && (
            <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{importStatus}</span>
              </div>
              <button
                onClick={() => setActiveTab('explorer')}
                className="w-full mt-2 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1"
              >
                <span>معاينة المحاضرة الآن</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Full Database JSON Backup / Restore Section */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200 shadow-xl'
      } space-y-6 mt-8`}>
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">النسخ الاحتياطي الشامل للنظام والدرجات (JSON)</h3>
            <p className="text-xs text-slate-400">تصدير واستعادة جميع بيانات التطبيق والسنوات والمواد والدرجات والطلاب دفعة واحدة</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleExportFullBackup}
            className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg transition-all"
          >
            <Download className="w-5 h-5" />
            <span>💾 تصدير نسخة احتياطية كاملة (.json)</span>
          </button>

          <label className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg cursor-pointer transition-all">
            <UploadCloud className="w-5 h-5" />
            <span>📥 استعادة نسخة احتياطية من ملف (.json)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFullBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
