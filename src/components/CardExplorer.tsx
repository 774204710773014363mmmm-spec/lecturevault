import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { CameraCaptureModal } from './CameraCaptureModal';
import { ImageViewerModal } from './ImageViewerModal';
import { CancelledLectureModal } from './CancelledLectureModal';
import { processImageDataUrl } from '../services/imageProcessor';
import { PhotoItem, YearNode, SemesterNode, SubjectNode, LectureNode } from '../types';
import {
  GraduationCap,
  Calendar,
  BookOpen,
  FileImage,
  Plus,
  Trash2,
  ArrowRight,
  Camera,
  Image as ImageIcon,
  RefreshCw,
  Maximize2,
  FileText,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Layers,
  ChevronLeft,
  LayoutGrid,
  FolderPlus,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export type NavLevel = 'years' | 'semesters' | 'subjects' | 'lectures' | 'gallery';

export const CardExplorer: React.FC = () => {
  const {
    years,
    semesters,
    subjects,
    lectures,
    photos,
    selectedYearId,
    setSelectedYearId,
    selectedSemesterId,
    setSelectedSemesterId,
    selectedSubjectId,
    setSelectedSubjectId,
    selectedLectureId,
    setSelectedLectureId,
    addNewYear,
    addNewSemester,
    addNewSubject,
    addNewLecture,
    deleteSubject,
    deleteLecture,
    addPhotosToLecture,
    deletePhoto,
    reindexLecture,
    movePhotoIndex,
    setActiveTab,
    settings,
    t
  } = useApp();

  const isDark = settings.theme === 'dark';

  // Local Navigation State
  const [navLevel, setNavLevel] = useState<NavLevel>('years');

  // Selected Entities
  const currentYear = years.find(y => y.id === selectedYearId) || years[0];
  const currentSemester = semesters.find(s => s.id === selectedSemesterId) || semesters[0];
  const currentSubject = subjects.find(sb => sb.id === selectedSubjectId) || subjects[0];
  const currentLecture = lectures.find(l => l.id === selectedLectureId) || lectures[0];

  // Modal dialog states for adding items
  const [showAddModal, setShowAddModal] = useState<'year' | 'semester' | 'subject' | 'lecture' | null>(null);
  const [addInputName, setAddInputName] = useState<string>('');
  const [addInstructorTitle, setAddInstructorTitle] = useState<string>('دكتور');
  const [addInstructorName, setAddInstructorName] = useState<string>('');
  const [showCancelledModal, setShowCancelledModal] = useState<boolean>(false);

  // Gallery states
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [viewingPhoto, setViewingPhoto] = useState<PhotoItem | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [reindexToast, setReindexToast] = useState<boolean>(false);

  // Sync selected values if entity lists update
  useEffect(() => {
    if (!selectedYearId && years.length > 0) setSelectedYearId(years[0].id);
  }, [years, selectedYearId, setSelectedYearId]);

  // Gallery photos for current lecture
  const lecturePhotos = photos
    .filter(p => p.lectureId === (currentLecture?.id || ''))
    .sort((a, b) => a.indexNumber - b.indexNumber);

  // Navigation Helpers
  const goToYears = () => {
    setNavLevel('years');
  };

  const goToSemesters = (yearId?: string) => {
    if (yearId) setSelectedYearId(yearId);
    setNavLevel('semesters');
  };

  const goToSubjects = (semesterId?: string) => {
    if (semesterId) setSelectedSemesterId(semesterId);
    setNavLevel('subjects');
  };

  const goToLectures = (subjectId?: string) => {
    if (subjectId) setSelectedSubjectId(subjectId);
    setNavLevel('lectures');
  };

  const goToGallery = (lectureId?: string) => {
    if (lectureId) setSelectedLectureId(lectureId);
    setNavLevel('gallery');
  };

  // Back Navigation Handler
  const handleBack = () => {
    if (navLevel === 'gallery') setNavLevel('lectures');
    else if (navLevel === 'lectures') setNavLevel('subjects');
    else if (navLevel === 'subjects') setNavLevel('semesters');
    else if (navLevel === 'semesters') setNavLevel('years');
  };

  // Add Item Handler
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addInputName.trim()) return;

    if (showAddModal === 'year') {
      const y = await addNewYear(addInputName);
      setSelectedYearId(y.id);
      goToSemesters(y.id);
    } else if (showAddModal === 'semester') {
      const parentYearId = currentYear?.id || years[0]?.id;
      if (parentYearId) {
        const s = await addNewSemester(parentYearId, addInputName);
        setSelectedSemesterId(s.id);
        goToSubjects(s.id);
      }
    } else if (showAddModal === 'subject') {
      const parentSemId = currentSemester?.id || semesters[0]?.id;
      if (parentSemId) {
        const sb = await addNewSubject(
          parentSemId,
          addInputName,
          undefined,
          addInstructorTitle,
          addInstructorName
        );
        setSelectedSubjectId(sb.id);
        goToLectures(sb.id);
      }
    } else if (showAddModal === 'lecture') {
      const parentSubjId = currentSubject?.id || subjects[0]?.id;
      if (parentSubjId) {
        const l = await addNewLecture(parentSubjId, addInputName);
        setSelectedLectureId(l.id);
        goToGallery(l.id);
      }
    }

    setAddInputName('');
    setShowAddModal(null);
  };

  // Upload/Camera logic
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !currentLecture) return;

    setIsProcessing(true);
    const newPhotos: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve((ev.target?.result as string) || '');
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

  // Motion variants for page transitions
  const pageVariants = {
    initial: { opacity: 0, y: 12, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -12, scale: 0.98 }
  };

  return (
    <div className="space-y-6">

      {/* Top Header & Breadcrumb Bar */}
      <div className={`p-5 rounded-2xl border ${
        isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'
      } shadow-xl`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Breadcrumbs & Back Button */}
          <div className="flex items-center gap-3">
            {navLevel !== 'years' && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B45309] text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="العودة للشاشة السابقة"
              >
                <ArrowRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                <span>رجوع</span>
              </button>
            )}

            {/* Breadcrumb Path */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <button
                onClick={goToYears}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                  navLevel === 'years'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                <span>السنوات الدراسية</span>
              </button>

              {navLevel !== 'years' && currentYear && (
                <>
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-600 rtl:rotate-0 ltr:rotate-180" />
                  <button
                    onClick={() => goToSemesters()}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      navLevel === 'semesters'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{currentYear.name}</span>
                  </button>
                </>
              )}

              {(navLevel === 'subjects' || navLevel === 'lectures' || navLevel === 'gallery') && currentSemester && (
                <>
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-600 rtl:rotate-0 ltr:rotate-180" />
                  <button
                    onClick={() => goToSubjects()}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      navLevel === 'subjects'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{currentSemester.name}</span>
                  </button>
                </>
              )}

              {(navLevel === 'lectures' || navLevel === 'gallery') && currentSubject && (
                <>
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-600 rtl:rotate-0 ltr:rotate-180" />
                  <button
                    onClick={() => goToLectures()}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      navLevel === 'lectures'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{currentSubject.name}</span>
                  </button>
                </>
              )}

              {navLevel === 'gallery' && currentLecture && (
                <>
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-600 rtl:rotate-0 ltr:rotate-180" />
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {currentLecture.title}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Button for Current Level */}
          <div className="flex items-center gap-2">
            {navLevel === 'years' && (
              <button
                onClick={() => setShowAddModal('year')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B45309] text-white text-xs font-bold shadow-lg shadow-amber-900/20 hover:scale-105 transition-transform cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة سنة جديدة</span>
              </button>
            )}

            {navLevel === 'semesters' && (
              <button
                onClick={() => setShowAddModal('semester')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B45309] text-white text-xs font-bold shadow-lg shadow-amber-900/20 hover:scale-105 transition-transform cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة ترم جديد</span>
              </button>
            )}

            {navLevel === 'subjects' && (
              <button
                onClick={() => setShowAddModal('subject')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B45309] text-white text-xs font-bold shadow-lg shadow-amber-900/20 hover:scale-105 transition-transform cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مادة جديدة</span>
              </button>
            )}

            {navLevel === 'lectures' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCancelledModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>تسجيل محاضرة ملغاة</span>
                </button>
                <button
                  onClick={() => setShowAddModal('lecture')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B45309] text-white text-xs font-bold shadow-lg shadow-amber-900/20 hover:scale-105 transition-transform cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة محاضرة جديدة</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Dynamic Content Views */}
      <AnimatePresence mode="wait">
        
        {/* ==================== 1. YEARS SCREEN ==================== */}
        {navLevel === 'years' && (
          <motion.div
            key="years-view"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-amber-400" />
                  <span>السنوات الدراسية والأكاديمية</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">اختر السنة الدراسية للوصول إلى الأترام والمواد الخاصة بها</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {years.map((year) => {
                const yearSemesters = semesters.filter(s => s.yearId === year.id);
                const semIds = yearSemesters.map(s => s.id);
                const yearSubjs = subjects.filter(sb => semIds.includes(sb.semesterId));
                const subjIds = yearSubjs.map(sb => sb.id);
                const yearLects = lectures.filter(l => subjIds.includes(l.subjectId));

                return (
                  <div
                    key={year.id}
                    onClick={() => goToSemesters(year.id)}
                    className={`group relative p-6 rounded-2xl border transition-all cursor-pointer ${
                      isDark
                        ? 'bg-[#0F172A] border-slate-800 hover:border-amber-500/60 shadow-xl hover:shadow-2xl hover:shadow-amber-900/20'
                        : 'bg-white border-slate-200 hover:border-amber-500 shadow-md hover:shadow-xl'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B45309] text-white flex items-center justify-center shadow-lg shadow-amber-900/30 group-hover:scale-110 transition-transform">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[#1E293B] text-amber-400 border border-amber-500/30">
                        {yearSemesters.length} أترام
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                      {year.name}
                    </h3>

                    <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>{yearSubjs.length} مادة دراسية</span>
                      <span>{yearLects.length} محاضرة</span>
                    </div>
                  </div>
                );
              })}

              {/* Add New Year Card */}
              <div
                onClick={() => setShowAddModal('year')}
                className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-amber-500/5 transition-all group min-h-[160px]"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-slate-300 group-hover:text-amber-400">إضافة سنة دراسية جديدة</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ==================== 2. SEMESTERS SCREEN ==================== */}
        {navLevel === 'semesters' && (
          <motion.div
            key="semesters-view"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-6 h-6 text-amber-400" />
                  <span>الأترام والفصول الدراسية - ({currentYear?.name})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">اختر الترم الدراسي لعرض المواد المسجلة فيه</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {semesters
                .filter(s => s.yearId === currentYear?.id)
                .map((sem) => {
                  const semSubjs = subjects.filter(sb => sb.semesterId === sem.id);
                  const subjIds = semSubjs.map(sb => sb.id);
                  const semLects = lectures.filter(l => subjIds.includes(l.subjectId));

                  return (
                    <div
                      key={sem.id}
                      onClick={() => goToSubjects(sem.id)}
                      className={`group relative p-6 rounded-2xl border transition-all cursor-pointer ${
                        isDark
                          ? 'bg-[#0F172A] border-slate-800 hover:border-amber-500/60 shadow-xl hover:shadow-2xl hover:shadow-amber-900/20'
                          : 'bg-white border-slate-200 hover:border-amber-500 shadow-md hover:shadow-xl'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[#1E293B] text-amber-400 border border-amber-500/30">
                          {semSubjs.length} مواد
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                        {sem.name}
                      </h3>

                      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <span>إجمالي المحاضرات:</span>
                        <span className="font-mono text-amber-400 font-bold">{semLects.length} محاضرة</span>
                      </div>
                    </div>
                  );
                })}

              {/* Add New Semester Card */}
              <div
                onClick={() => setShowAddModal('semester')}
                className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-amber-500/5 transition-all group min-h-[160px]"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-slate-300 group-hover:text-amber-400">إضافة ترم دراسي جديد</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ==================== 3. SUBJECTS SCREEN ==================== */}
        {navLevel === 'subjects' && (
          <motion.div
            key="subjects-view"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-amber-400" />
                  <span>المواد الدراسية - ({currentSemester?.name})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">اختر المادة لعرض محاضراتها وتصفح الصور المسجلة</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {subjects
                .filter(sb => sb.semesterId === currentSemester?.id)
                .map((subj) => {
                  const subjLects = lectures.filter(l => l.subjectId === subj.id);

                  return (
                    <div
                      key={subj.id}
                      onClick={() => goToLectures(subj.id)}
                      className={`group relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isDark
                          ? 'bg-[#0F172A] border-slate-800 hover:border-amber-500/60 shadow-xl hover:shadow-2xl hover:shadow-amber-900/20'
                          : 'bg-white border-slate-200 hover:border-amber-500 shadow-md hover:shadow-xl'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B45309] text-white flex items-center justify-center shadow-md">
                            <BookOpen className="w-5 h-5" />
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`حذف المادة "${subj.name}" وكافة المحاضرات والصور التابعة لها؟`)) {
                                deleteSubject(subj.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="حذف المادة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <h3 className="text-base font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">
                          {subj.name}
                        </h3>
                        {subj.code && (
                          <span className="text-[11px] font-mono font-bold text-amber-400/80 block mb-3">
                            {subj.code}
                          </span>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <span>المحاضرات:</span>
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-[#1E293B] text-amber-400 border border-amber-500/20">
                          {subjLects.length} محاضرة
                        </span>
                      </div>
                    </div>
                  );
                })}

              {/* Add New Subject Card */}
              <div
                onClick={() => setShowAddModal('subject')}
                className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-amber-500/5 transition-all group min-h-[150px]"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-300 group-hover:text-amber-400">إضافة مادة دراسية جديدة</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ==================== 4. LECTURES SCREEN ==================== */}
        {navLevel === 'lectures' && (
          <motion.div
            key="lectures-view"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileImage className="w-6 h-6 text-amber-400" />
                  <span>محاضرات مادة: ({currentSubject?.name})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">اضغط على كارت المحاضرة لاستعراض معلماتها وصورها والتحكم بها</p>
              </div>

              <button
                onClick={() => setShowCancelledModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>⚠️ محاضرة لم تُعقد (بطاقة ملغاة)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {lectures
                .filter(l => l.subjectId === currentSubject?.id)
                .map((lect) => {
                  const lectPhotos = photos.filter(p => p.lectureId === lect.id);
                  const firstPhoto = lectPhotos[0]?.dataUrl;

                  return (
                    <div
                      key={lect.id}
                      onClick={() => goToGallery(lect.id)}
                      className={`group relative rounded-2xl border overflow-hidden transition-all cursor-pointer flex flex-col justify-between ${
                        isDark
                          ? 'bg-[#0F172A] border-slate-800 hover:border-amber-500/60 shadow-xl hover:shadow-2xl hover:shadow-amber-900/20'
                          : 'bg-white border-slate-200 hover:border-amber-500 shadow-md hover:shadow-xl'
                      }`}
                    >
                      {/* Top Thumbnail Preview */}
                      <div className="h-32 w-full bg-[#0B1221] relative overflow-hidden flex items-center justify-center">
                        {firstPhoto ? (
                          <img
                            src={firstPhoto}
                            alt={lect.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex flex-col items-center text-slate-600 gap-1">
                            <FileImage className="w-8 h-8" />
                            <span className="text-[10px]">لا يوجد صور بعد</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent opacity-90" />
                        
                        <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-amber-400 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border border-amber-500/30">
                          {lectPhotos.length} صورة
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`حذف المحاضرة "${lect.title}" وكافة صورها؟`)) {
                              deleteLecture(lect.id);
                            }
                          }}
                          className="absolute top-2 left-2 p-1.5 rounded-lg bg-red-600/80 text-white hover:bg-red-600 transition-colors"
                          title="حذف المحاضرة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Card Info */}
                      <div className="p-4 space-y-2">
                        <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                          {lect.title}
                        </h3>

                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>تاريخ التنسيق: {new Date(lect.createdAt).toLocaleDateString('ar-EG')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {/* Add New Lecture Card */}
              <div
                onClick={() => setShowAddModal('lecture')}
                className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-amber-500/5 transition-all group min-h-[180px]"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-300 group-hover:text-amber-400">إضافة محاضرة جديدة</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ==================== 5. GALLERY SCREEN ==================== */}
        {navLevel === 'gallery' && (
          <motion.div
            key="gallery-view"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Gallery Top Toolbar */}
            <div className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'
            } shadow-xl`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-amber-500" />
                    <span>{currentLecture?.title || 'معرض الصور للمحاضرة'}</span>
                  </h2>
                  <p className="text-xs text-amber-400/90 font-semibold mt-1">
                    إجمالي الصور المرقّمة تسلسلياً: ({lecturePhotos.length}) صورة
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setShowCamera(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>التقاط كاميرا</span>
                  </button>

                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E293B] text-slate-200 border border-slate-700 text-xs font-bold hover:bg-slate-800 cursor-pointer transition-colors">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>رفع من المعرض</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={handleManualReindex}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1E293B] text-slate-200 text-xs font-bold border border-slate-700 hover:border-amber-500/40 transition-all cursor-pointer"
                    title={t('reindexNotice')}
                  >
                    <RefreshCw className="w-4 h-4 text-amber-400" />
                    <span>إعادة ترقيم تسلسلي</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('pdf_export')}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B45309] text-white text-xs font-bold shadow-xl shadow-amber-900/30 hover:scale-105 transition-transform cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-white" />
                    <span>تصدير PDF</span>
                  </button>
                </div>
              </div>

              {reindexToast && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('reindexDone')}</span>
                </div>
              )}
            </div>

            {/* Photos Grid */}
            {lecturePhotos.length === 0 ? (
              <div className={`p-12 text-center rounded-2xl border ${
                isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <ImageIcon className="w-16 h-16 mx-auto mb-3 text-slate-600" />
                <p className="text-sm font-bold text-slate-300 mb-3">{t('noPhotosYet')}</p>
                <button
                  onClick={() => setShowCamera(true)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B45309] text-white text-xs font-bold shadow-lg shadow-amber-900/30 hover:scale-105 transition-transform cursor-pointer"
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
                    {/* Thumbnail */}
                    <div
                      onClick={() => setViewingPhoto(photo)}
                      className="aspect-[3/4] w-full overflow-hidden bg-slate-950 cursor-pointer relative"
                    >
                      <img
                        src={photo.dataUrl}
                        alt={photo.fileName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity pointer-events-none" />

                      <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-amber-400 px-2 py-0.5 rounded-md text-xs font-mono font-bold border border-amber-500/30 shadow-md">
                        {photo.fileName}
                      </div>

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
                          className="p-1.5 rounded-lg bg-[#1E293B] text-slate-300 hover:text-amber-400 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => movePhotoIndex(photo.id, 'down')}
                          disabled={index === lecturePhotos.length - 1}
                          title={t('movePhotoDown')}
                          className="p-1.5 rounded-lg bg-[#1E293B] text-slate-300 hover:text-amber-400 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(t('deletePhotoConfirm'))) {
                            deletePhoto(photo.id, currentLecture?.id || '');
                          }
                        }}
                        title="حذف الصورة"
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/30 border border-red-500/20 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

      {/* Add Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleAddSubmit} className="bg-[#0F172A] border border-amber-500/40 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-amber-400">
              {showAddModal === 'year' && 'إضافة سنة دراسية جديدة'}
              {showAddModal === 'semester' && `إضافة ترم دراسي جديد (${currentYear?.name})`}
              {showAddModal === 'subject' && `إضافة مادة جديدة (${currentSemester?.name})`}
              {showAddModal === 'lecture' && `إضافة محاضرة جديدة (${currentSubject?.name})`}
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">الاسم:</label>
              <input
                type="text"
                value={addInputName}
                onChange={(e) => setAddInputName(e.target.value)}
                placeholder="أدخل الاسم بوضوح..."
                autoFocus
                required
                className="w-full p-3 rounded-xl bg-[#0B1221] border border-slate-800 text-slate-100 text-sm font-medium focus:border-amber-500 focus:outline-none"
              />
            </div>

            {showAddModal === 'subject' && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">الصفة / اللقب:</label>
                  <select
                    value={addInstructorTitle}
                    onChange={(e) => setAddInstructorTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#0B1221] border border-slate-800 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="دكتور">دكتور</option>
                    <option value="دكتورة">دكتورة</option>
                    <option value="مهندس">مهندس</option>
                    <option value="مهندسة">مهندسة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">اسم المدرس:</label>
                  <input
                    type="text"
                    value={addInstructorName}
                    onChange={(e) => setAddInstructorName(e.target.value)}
                    placeholder="مثال: خالد"
                    className="w-full p-2.5 rounded-xl bg-[#0B1221] border border-slate-800 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(null)}
                className="px-4 py-2 rounded-xl bg-[#0B1221] text-slate-300 text-xs font-bold border border-slate-800"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B45309] text-white text-xs font-bold shadow-md cursor-pointer"
              >
                إضافة وحفظ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cancelled Lecture Modal */}
      <CancelledLectureModal
        isOpen={showCancelledModal}
        onClose={() => setShowCancelledModal(false)}
        defaultSubjectId={currentSubject?.id}
      />

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
