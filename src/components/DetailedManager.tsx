import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CameraCaptureModal } from './CameraCaptureModal';
import { ImageViewerModal } from './ImageViewerModal';
import { processImageDataUrl } from '../services/imageProcessor';
import {
  FolderTree,
  Camera,
  Image as ImageIcon,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Trash2,
  Maximize2,
  FileText,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { PhotoItem } from '../types';

export const DetailedManager: React.FC = () => {
  const {
    years,
    semesters,
    subjects,
    lectures,
    photos,
    selectedYearId,
    selectedSemesterId,
    selectedSubjectId,
    selectedLectureId,
    addPhotosToLecture,
    deletePhoto,
    reindexLecture,
    movePhotoIndex,
    setActiveTab,
    settings,
    t
  } = useApp();

  const isDark = settings.theme === 'dark';

  const currentYear = years.find(y => y.id === selectedYearId) || years[0];
  const currentSemester = semesters.find(s => s.id === selectedSemesterId) || semesters[0];
  const currentSubject = subjects.find(sb => sb.id === selectedSubjectId) || subjects[0];
  const currentLecture = lectures.find(l => l.id === selectedLectureId) || lectures[0];

  const lecturePhotos = photos
    .filter(p => p.lectureId === (currentLecture?.id || ''))
    .sort((a, b) => a.indexNumber - b.indexNumber);

  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [viewingPhoto, setViewingPhoto] = useState<PhotoItem | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [reindexToast, setReindexToast] = useState<boolean>(false);

  // Gallery Upload
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !currentLecture) return;

    setIsProcessing(true);
    const newPhotos: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string || '');
        reader.readAsDataURL(file);
      });

      if (dataUrl) {
        const processed = await processImageDataUrl(dataUrl, {
          applyEnhancer: settings.docEnhance,
          autoCrop: settings.autoCrop,
          resolution: settings.defaultResolution
        });
        newPhotos.push(processed);
      }
    }

    await addPhotosToLecture(currentLecture.id, newPhotos);
    setIsProcessing(false);
  };

  // Camera Capture
  const handleCapturedPhoto = async (dataUrl: string) => {
    if (!currentLecture) return;
    setIsProcessing(true);
    const processed = await processImageDataUrl(dataUrl, {
      applyEnhancer: settings.docEnhance,
      autoCrop: settings.autoCrop,
      resolution: settings.defaultResolution
    });
    await addPhotosToLecture(currentLecture.id, [processed]);
    setIsProcessing(false);
  };

  const handleManualReindex = async () => {
    if (!currentLecture) return;
    await reindexLecture(currentLecture.id);
    setReindexToast(true);
    setTimeout(() => setReindexToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Active Breadcrumb Header */}
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'
      } shadow-xl`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-500 mb-1">
              <span>{currentYear?.name || 'السنة الأولى'}</span>
              <span>/</span>
              <span>{currentSemester?.name || 'الترم الأول'}</span>
              <span>/</span>
              <span className="text-amber-400">{currentSubject?.name || 'المادة'}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-amber-500" />
              <span>{currentLecture ? currentLecture.title : 'اختر محاضرة من الشجرة الجانبية'}</span>
            </h2>
          </div>

          {currentLecture && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleManualReindex}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1E293B] text-slate-200 text-xs font-bold border border-slate-700 hover:border-amber-500/40 transition-all"
                title={t('reindexNotice')}
              >
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <span>{t('reindexButton')}</span>
              </button>

              <button
                onClick={() => setActiveTab('pdf_export')}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B45309] text-white text-xs font-bold shadow-xl shadow-amber-900/30 hover:scale-105 transition-transform"
              >
                <FileText className="w-4 h-4 text-white" />
                <span>تصدير الـ PDF</span>
              </button>
            </div>
          )}
        </div>

        {reindexToast && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
            {t('reindexDone')}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {!currentLecture ? (
        <div className={`p-12 text-center rounded-2xl border ${
          isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <FolderTree className="w-16 h-16 mx-auto mb-4 text-amber-500/30" />
          <h3 className="text-lg font-bold text-slate-300 mb-1">الرجاء اختيار محاضرة من الشجرة المجاورة</h3>
          <p className="text-xs text-slate-400">تستطيع التنقل بين السنوات والمواد والمحاضرات بسهولة</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Action Toolbar to Add Photos */}
          <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
            isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>إجمالي الصور بهذه المحاضرة: ({lecturePhotos.length}) صورة مرتبة تسلسلياً</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCamera(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span>{t('captureCamera')}</span>
              </button>

              <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E293B] text-slate-200 border border-slate-700 text-xs font-bold hover:bg-slate-800 cursor-pointer transition-colors">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>{t('uploadGallery')}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Photos Grid */}
          {lecturePhotos.length === 0 ? (
            <div className={`p-12 text-center rounded-2xl border ${
              isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <ImageIcon className="w-16 h-16 mx-auto mb-3 text-slate-600" />
              <p className="text-sm font-bold text-slate-300 mb-2">{t('noPhotosYet')}</p>
              <button
                onClick={() => setShowCamera(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B45309] text-white text-xs font-bold shadow-lg shadow-amber-900/30 hover:scale-105 transition-transform"
              >
                {t('addFirstPhotos')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {lecturePhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className={`group relative rounded-2xl overflow-hidden border transition-all ${
                    isDark
                      ? 'bg-[#0F172A] border-slate-800 hover:border-amber-500/50 shadow-xl'
                      : 'bg-white border-slate-200 hover:border-amber-500 shadow-md'
                  }`}
                >
                  {/* Photo Thumbnail */}
                  <div
                    onClick={() => setViewingPhoto(photo)}
                    className="aspect-[3/4] w-full overflow-hidden bg-slate-950 cursor-pointer relative"
                  >
                    <img
                      src={photo.dataUrl}
                      alt={photo.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity pointer-events-none" />

                    {/* Sequence Badge */}
                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-amber-400 px-2 py-0.5 rounded-md text-xs font-mono font-bold border border-amber-500/30 shadow-md">
                      {photo.fileName}
                    </div>

                    {/* Maximize Icon */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Maximize2 className="w-8 h-8 text-amber-400 drop-shadow-lg" />
                    </div>
                  </div>

                  {/* Card Controls */}
                  <div className="p-2 bg-[#0B1221] border-t border-slate-800 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => movePhotoIndex(photo.id, 'up')}
                        disabled={index === 0}
                        title={t('movePhotoUp')}
                        className="p-1.5 rounded-lg bg-[#1E293B] text-slate-300 hover:text-amber-400 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => movePhotoIndex(photo.id, 'down')}
                        disabled={index === lecturePhotos.length - 1}
                        title={t('movePhotoDown')}
                        className="p-1.5 rounded-lg bg-[#1E293B] text-slate-300 hover:text-amber-400 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(t('deletePhotoConfirm'))) {
                          deletePhoto(photo.id, currentLecture.id);
                        }
                      }}
                      title="حذف الصورة"
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/30 border border-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCaptureModal
          onClose={() => setShowCamera(false)}
          onCapture={handleCapturedPhoto}
        />
      )}

      {/* Full Screen Image Viewer Modal */}
      {viewingPhoto && (
        <ImageViewerModal
          photo={viewingPhoto}
          lectureTitle={currentLecture?.title || ''}
          onClose={() => setViewingPhoto(null)}
          onDelete={(id) => {
            if (currentLecture) {
              deletePhoto(id, currentLecture.id);
            }
          }}
        />
      )}

    </div>
  );
};
