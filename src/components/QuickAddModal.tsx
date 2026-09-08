import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CameraCaptureModal } from './CameraCaptureModal';
import { CancelledLectureModal } from './CancelledLectureModal';
import { processImageDataUrl } from '../services/imageProcessor';
import {
  Zap,
  BookOpen,
  Plus,
  Camera,
  Image as ImageIcon,
  CheckCircle,
  FileText,
  ArrowRight,
  AlertTriangle,
  Folder,
  Calendar,
  Layers,
  Sparkles,
  Trash2,
  ListFilter,
  Check,
  Search
} from 'lucide-react';

export const QuickAddModal: React.FC = () => {
  const {
    years,
    semesters,
    subjects,
    lectures,
    settings,
    quickAddPhotos,
    addNewSubject,
    setSelectedYearId,
    setSelectedSemesterId,
    setSelectedSubjectId,
    setSelectedLectureId,
    setActiveTab,
    t
  } = useApp();

  const isDark = settings.theme === 'dark';

  // Selected Location Hierarchy
  const [selectedYearIdLocal, setSelectedYearIdLocal] = useState<string>(
    settings.currentYearId || (years[0]?.id ?? 'year-1')
  );
  const [selectedSemIdLocal, setSelectedSemIdLocal] = useState<string>(
    settings.currentSemesterId || 'sem-1'
  );
  const [selectedSubjId, setSelectedSubjId] = useState<string>('');

  // Mode: standard hierarchical selection vs quick direct all-subjects search
  const [useDirectSubjectSelect, setUseDirectSubjectSelect] = useState<boolean>(false);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState<string>('');

  // Custom lecture title option
  const [customLectureTitle, setCustomLectureTitle] = useState<string>('');

  // New Subject Inline Form
  const [showNewSubjectInput, setShowNewSubjectInput] = useState<boolean>(false);
  const [newSubjectName, setNewSubjectName] = useState<string>('');
  const [newSubjectCode, setNewSubjectCode] = useState<string>('');
  const [newInstructorTitle, setNewInstructorTitle] = useState<string>('دكتور');
  const [newInstructorName, setNewInstructorName] = useState<string>('');

  // Photos & Modals State
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [showCancelledModal, setShowCancelledModal] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [createdLectureInfo, setCreatedLectureInfo] = useState<{
    id: string;
    title: string;
    photoCount: number;
    subjectName: string;
    yearName: string;
    semesterName: string;
  } | null>(null);

  // Sync Year selection
  useEffect(() => {
    if (years.length > 0) {
      if (!selectedYearIdLocal || !years.some(y => y.id === selectedYearIdLocal)) {
        const defaultYear = years.find(y => y.id === settings.currentYearId) || years[0];
        setSelectedYearIdLocal(defaultYear.id);
      }
    }
  }, [years, settings.currentYearId]);

  // Semesters for currently chosen year
  const yearSemesters = useMemo(() => {
    return semesters.filter(s => s.yearId === selectedYearIdLocal);
  }, [semesters, selectedYearIdLocal]);

  // Sync Semester selection when year changes or semesters load
  useEffect(() => {
    if (yearSemesters.length > 0) {
      if (!selectedSemIdLocal || !yearSemesters.some(s => s.id === selectedSemIdLocal)) {
        const defaultSem = yearSemesters.find(s => s.id === settings.currentSemesterId) || yearSemesters[0];
        setSelectedSemIdLocal(defaultSem.id);
      }
    } else {
      setSelectedSemIdLocal('');
    }
  }, [yearSemesters, selectedYearIdLocal, settings.currentSemesterId]);

  // Subjects under current chosen semester
  const termSubjects = useMemo(() => {
    return subjects.filter(s => s.semesterId === selectedSemIdLocal);
  }, [subjects, selectedSemIdLocal]);

  // Sync Subject selection when semester changes or subjects load
  useEffect(() => {
    if (termSubjects.length > 0) {
      if (!selectedSubjId || !termSubjects.some(s => s.id === selectedSubjId)) {
        setSelectedSubjId(termSubjects[0].id);
        setShowNewSubjectInput(false);
      }
    } else {
      // If no subjects in this semester, clear and prompt to create
      if (!useDirectSubjectSelect) {
        setSelectedSubjId('');
        setShowNewSubjectInput(true);
      }
    }
  }, [termSubjects, selectedSemIdLocal, useDirectSubjectSelect]);

  // Current active nodes details for UI display
  const currentYearObj = years.find(y => y.id === selectedYearIdLocal) || years[0];
  const currentSemObj = semesters.find(s => s.id === selectedSemIdLocal) || yearSemesters[0];
  const currentSubjObj = subjects.find(s => s.id === selectedSubjId);

  // All subjects with full path for direct switcher
  const allSubjectsWithPath = useMemo(() => {
    return subjects.map(sub => {
      const sem = semesters.find(s => s.id === sub.semesterId);
      const yr = years.find(y => y.id === sem?.yearId);
      return {
        ...sub,
        semesterName: sem?.name || 'فصل غير محدد',
        yearName: yr?.name || 'سنة غير محددة',
        yearId: yr?.id,
        semesterId: sem?.id
      };
    });
  }, [subjects, semesters, years]);

  // Filtered direct subjects
  const filteredDirectSubjects = useMemo(() => {
    if (!subjectSearchQuery.trim()) return allSubjectsWithPath;
    const q = subjectSearchQuery.toLowerCase();
    return allSubjectsWithPath.filter(
      s => s.name.toLowerCase().includes(q) ||
           (s.code && s.code.toLowerCase().includes(q)) ||
           (s.instructorName && s.instructorName.toLowerCase().includes(q)) ||
           s.yearName.toLowerCase().includes(q) ||
           s.semesterName.toLowerCase().includes(q)
    );
  }, [allSubjectsWithPath, subjectSearchQuery]);

  // Next Lecture Number calculation for preview
  const subjectLectures = useMemo(() => {
    return lectures.filter(l => l.subjectId === selectedSubjId);
  }, [lectures, selectedSubjId]);
  const nextLectureNumber = subjectLectures.length + 1;
  const autoLectureTitle = `المحاضرة ${nextLectureNumber}`;

  // Handle direct subject selection
  const handleSelectDirectSubject = (sub: typeof allSubjectsWithPath[0]) => {
    setSelectedSubjId(sub.id);
    if (sub.yearId) setSelectedYearIdLocal(sub.yearId);
    if (sub.semesterId) setSelectedSemIdLocal(sub.semesterId);
    setShowNewSubjectInput(false);
  };

  // Handle New Subject Quick Add
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) {
      alert('الرجاء إدخال اسم المادة');
      return;
    }

    // Ensure semester is available
    let targetSemId = selectedSemIdLocal;
    if (!targetSemId) {
      if (yearSemesters.length > 0) {
        targetSemId = yearSemesters[0].id;
      } else if (semesters.length > 0) {
        targetSemId = semesters[0].id;
      } else {
        alert('الرجاء التأكد من وجود فصول دراسية في النظام');
        return;
      }
    }

    try {
      const newSubj = await addNewSubject(
        targetSemId,
        newSubjectName.trim(),
        newSubjectCode.trim() || undefined,
        newInstructorTitle,
        newInstructorName.trim() || undefined
      );

      setSelectedSubjId(newSubj.id);
      setNewSubjectName('');
      setNewSubjectCode('');
      setNewInstructorName('');
      setShowNewSubjectInput(false);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إضافة المادة');
    }
  };

  // Handle Gallery Upload
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

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
        // Apply document enhancer filter if turned on in settings
        const processed = await processImageDataUrl(dataUrl, {
          applyEnhancer: settings.docEnhance,
          autoCrop: settings.autoCrop,
          resolution: settings.defaultResolution
        });
        newPhotos.push(processed);
      }
    }

    setUploadedPhotos((prev) => [...prev, ...newPhotos]);
    setIsProcessing(false);
    // Reset file input value so user can pick the same file again if desired
    e.target.value = '';
  };

  // Handle Camera Capture
  const handleCapturedPhoto = async (dataUrl: string) => {
    setIsProcessing(true);
    const processed = await processImageDataUrl(dataUrl, {
      applyEnhancer: settings.docEnhance,
      autoCrop: settings.autoCrop,
      resolution: settings.defaultResolution
    });
    setUploadedPhotos((prev) => [...prev, processed]);
    setIsProcessing(false);
  };

  // Finalize & Create Lecture
  const handleSaveLecture = async () => {
    if (!selectedSubjId) {
      alert('الرجاء اختيار المادة الدراسية أولاً من القائمة');
      return;
    }
    if (uploadedPhotos.length === 0) {
      alert('الرجاء إضافة صورة واحدة على الأقل للمحاضرة عبر الكاميرا أو المعرض');
      return;
    }

    setIsProcessing(true);
    try {
      const finalTitle = customLectureTitle.trim() || autoLectureTitle;
      const createdLect = await quickAddPhotos(selectedSubjId, uploadedPhotos, finalTitle);

      // Find subject and context details
      const sub = subjects.find(s => s.id === selectedSubjId);
      const sem = semesters.find(s => s.id === sub?.semesterId);
      const yr = years.find(y => y.id === sem?.yearId);

      // Sync active context pointers
      if (yr) setSelectedYearId(yr.id);
      if (sem) setSelectedSemesterId(sem.id);
      setSelectedSubjectId(selectedSubjId);
      setSelectedLectureId(createdLect.id);

      setCreatedLectureInfo({
        id: createdLect.id,
        title: createdLect.title,
        photoCount: uploadedPhotos.length,
        subjectName: sub?.name || 'المادة',
        yearName: yr?.name || 'السنة الدراسية',
        semesterName: sem?.name || 'الفصل الدراسي'
      });
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ وتخزين المحاضرة');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setUploadedPhotos([]);
    setCustomLectureTitle('');
    setCreatedLectureInfo(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Banner */}
      <div
        className={`p-6 rounded-2xl border ${
          isDark
            ? 'bg-[#0F172A] border-amber-500/30 shadow-2xl'
            : 'bg-gradient-to-r from-amber-50 via-white to-amber-100/50 border-amber-500/30 shadow-md'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B45309] text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-900/30">
              <Zap className="w-6 h-6 fill-white text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {t('quickAdd')}
              </h2>
              <p className="text-sm text-slate-400 font-medium">
                التقط أو ارفع صور المحاضرة وسيتم ترقيمها وحفظها فوراً في المادة المحددة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setUseDirectSubjectSelect(!useDirectSubjectSelect)}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <ListFilter className="w-4 h-4 text-amber-400" />
            <span>{useDirectSubjectSelect ? 'تبديل للاختيار الهرمي (سنة/ترم)' : 'بحث سريع في جميع المواد'}</span>
          </button>
        </div>

        {/* Selected Path Breadcrumb Banner */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Folder className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-bold text-slate-400">مكان الحفظ المحدد:</span>
            <div className="flex items-center gap-1.5 flex-wrap font-bold">
              <span className="bg-[#1E293B] text-slate-200 px-2 py-0.5 rounded border border-slate-700">
                {currentYearObj?.name || 'السنة الأولى'}
              </span>
              <span className="text-amber-500">❯</span>
              <span className="bg-[#1E293B] text-slate-200 px-2 py-0.5 rounded border border-slate-700">
                {currentSemObj?.name || 'الترم الأول'}
              </span>
              <span className="text-amber-500">❯</span>
              <span className="bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded border border-amber-500/40">
                {currentSubjObj?.name ? `📚 ${currentSubjObj.name}` : '⚠️ لم يتم اختيار مادة بعد'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Success State Screen */}
      {createdLectureInfo ? (
        <div
          className={`p-8 rounded-2xl border text-center ${
            isDark ? 'bg-[#0F172A] border-emerald-500/40' : 'bg-white border-emerald-500/40'
          } shadow-2xl animate-fadeIn space-y-6`}
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-950/50">
            <CheckCircle className="w-10 h-10" />
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-emerald-400 mb-2">
              {t('lectureCreatedSuccess')}
            </h3>
            <p className="text-lg font-bold text-slate-200">
              تمت إضافة ({createdLectureInfo.photoCount}) صور بنجاح إلى: <span className="text-amber-400 font-extrabold">{createdLectureInfo.title}</span>
            </p>
            <div className="mt-2 text-xs text-slate-400 flex items-center justify-center gap-2">
              <span>{createdLectureInfo.yearName}</span>
              <span>•</span>
              <span>{createdLectureInfo.semesterName}</span>
              <span>•</span>
              <span className="text-amber-300 font-bold">{createdLectureInfo.subjectName}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('explorer')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-sm shadow-xl shadow-amber-950/50 transition-all cursor-pointer"
            >
              <span>{t('viewLectureNow')}</span>
              <ArrowRight className="w-5 h-5 rtl:rotate-180" />
            </button>

            <button
              onClick={() => setActiveTab('pdf_export')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1E293B] text-amber-300 hover:bg-slate-800 font-bold text-sm border border-amber-500/30 transition-all cursor-pointer"
            >
              <FileText className="w-5 h-5 text-amber-400" />
              <span>{t('exportToPdfNow')}</span>
            </button>

            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-xl bg-[#0B1221] hover:bg-slate-900 text-slate-300 border border-slate-800 text-sm font-bold transition-all cursor-pointer"
            >
              ⚡ إضافة محاضرة أخرى جديدة
            </button>
          </div>
        </div>
      ) : (
        /* Main Quick Add Form */
        <div className="space-y-6">
          
          {/* STEP 1: SELECT LOCATION & SUBJECT */}
          <div
            className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'
            } space-y-4`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <label className="text-base font-bold text-amber-400 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span>1. تحديد المادة الدراسية ومكان الحفظ</span>
              </label>

              {!showNewSubjectInput && (
                <button
                  type="button"
                  onClick={() => setShowNewSubjectInput(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة مادة جديدة هنا</span>
                </button>
              )}
            </div>

            {/* Direct Subject Finder Mode */}
            {useDirectSubjectSelect ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={subjectSearchQuery}
                    onChange={(e) => setSubjectSearchQuery(e.target.value)}
                    placeholder="ابحث عن اسم المادة، الكود، أو اسم الدكتور في كافة الفصول..."
                    className={`w-full pr-10 pl-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      isDark
                        ? 'bg-[#0B1221] border-slate-700 text-slate-100 placeholder-slate-500 focus:border-amber-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                    }`}
                  />
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 p-1 rounded-xl bg-[#0B1221] border border-slate-800">
                  {filteredDirectSubjects.length > 0 ? (
                    filteredDirectSubjects.map((sub) => {
                      const isSelected = sub.id === selectedSubjId;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleSelectDirectSubject(sub)}
                          className={`w-full text-right p-3 rounded-xl flex items-center justify-between gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold'
                              : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                              <span>📚 {sub.name}</span>
                              {sub.code && (
                                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                                  {sub.code}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {sub.yearName} ❯ {sub.semesterName}
                              {sub.instructorName && ` • (${sub.instructorTitle || 'دكتور'} ${sub.instructorName})`}
                            </div>
                          </div>
                          {isSelected && <Check className="w-5 h-5 text-amber-400 shrink-0" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400">
                      لا توجد مواد مطابقة للبحث. يمكنك تبديل الوضع أو إضافة مادة جديدة.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Standard Hierarchical Selectors (Year -> Semester -> Subject) */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Year Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>السنة الدراسية:</span>
                    </label>
                    <select
                      value={selectedYearIdLocal}
                      onChange={(e) => setSelectedYearIdLocal(e.target.value)}
                      className={`w-full p-3 rounded-xl border text-xs font-bold transition-all ${
                        isDark
                          ? 'bg-[#0B1221] border-slate-700 text-slate-100 focus:border-amber-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                      }`}
                    >
                      {years.map((y) => (
                        <option key={y.id} value={y.id}>
                          📅 {y.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Semester Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>الفصل / الترم الدراسي:</span>
                    </label>
                    <select
                      value={selectedSemIdLocal}
                      onChange={(e) => setSelectedSemIdLocal(e.target.value)}
                      className={`w-full p-3 rounded-xl border text-xs font-bold transition-all ${
                        isDark
                          ? 'bg-[#0B1221] border-slate-700 text-slate-100 focus:border-amber-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                      }`}
                    >
                      {yearSemesters.map((s) => (
                        <option key={s.id} value={s.id}>
                          🏷️ {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subject Selector or New Subject Form */}
                {!showNewSubjectInput ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                      <span>المادة الدراسية:</span>
                    </label>

                    {termSubjects.length > 0 ? (
                      <select
                        value={selectedSubjId}
                        onChange={(e) => setSelectedSubjId(e.target.value)}
                        className={`w-full p-3.5 rounded-xl border text-sm font-bold transition-all ${
                          isDark
                            ? 'bg-[#0B1221] border-amber-500/40 text-amber-300 focus:border-amber-400 shadow-inner'
                            : 'bg-slate-50 border-amber-400 text-slate-900 focus:border-amber-500'
                        }`}
                      >
                        {termSubjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            📚 {s.name} {s.code ? `(${s.code})` : ''} {s.instructorName ? `[${s.instructorTitle || 'د.'} ${s.instructorName}]` : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="text-xs text-amber-300">
                          ⚠️ لا توجد مواد مضافة في هذا الفصل حتى الآن. اضغط لإضافة المادة الأولى:
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowNewSubjectInput(true)}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold text-xs shadow transition-all cursor-pointer"
                        >
                          + إضافة مادة جديدة الآن
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Inline Create Subject Form */
                  <form onSubmit={handleCreateSubject} className="p-4 rounded-xl bg-[#0B1221] border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-amber-400">
                        ➕ إضافة مادة جديدة إلى ({currentSemObj?.name || 'الترم الحالي'})
                      </span>
                      {termSubjects.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowNewSubjectInput(false)}
                          className="text-xs text-slate-400 hover:text-slate-200"
                        >
                          إلغاء والعودة للقائمة
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">اسم المادة:</label>
                        <input
                          type="text"
                          value={newSubjectName}
                          onChange={(e) => setNewSubjectName(e.target.value)}
                          placeholder="مثال: هندسة البرمجيات"
                          required
                          className={`w-full p-2.5 rounded-xl border text-xs ${
                            isDark ? 'bg-[#070B14] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">رمز / كود المادة (اختياري):</label>
                        <input
                          type="text"
                          value={newSubjectCode}
                          onChange={(e) => setNewSubjectCode(e.target.value)}
                          placeholder="مثال: CS204"
                          className={`w-full p-2.5 rounded-xl border text-xs ${
                            isDark ? 'bg-[#070B14] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">اللقب الأكاديمي للمدرس:</label>
                        <select
                          value={newInstructorTitle}
                          onChange={(e) => setNewInstructorTitle(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border text-xs ${
                            isDark ? 'bg-[#070B14] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        >
                          <option value="دكتور">دكتور</option>
                          <option value="دكتورة">دكتورة</option>
                          <option value="بروفيسور">بروفيسور</option>
                          <option value="أستاذ">أستاذ</option>
                          <option value="أستاذة">أستاذة</option>
                          <option value="مهندس">مهندس</option>
                          <option value="مهندسة">مهندسة</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">اسم المدرس / الدكتور (اختياري):</label>
                        <input
                          type="text"
                          value={newInstructorName}
                          onChange={(e) => setNewInstructorName(e.target.value)}
                          placeholder="مثال: د. محمد علي"
                          className={`w-full p-2.5 rounded-xl border text-xs ${
                            isDark ? 'bg-[#070B14] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B45309] text-white font-bold text-xs shadow hover:opacity-95 transition-opacity cursor-pointer"
                    >
                      ✓ حفظ المادة واعتمادها فوراً للإضافة السريعة
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Lecture Name & Numbering Details */}
            {selectedSubjId && (
              <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#0B1221] border border-amber-500/20 text-xs text-amber-300 font-bold flex items-center justify-between">
                  <span>الترقيم التلقائي:</span>
                  <span className="text-amber-400 font-mono text-sm font-black underline">
                    {autoLectureTitle}
                  </span>
                </div>

                <div>
                  <input
                    type="text"
                    value={customLectureTitle}
                    onChange={(e) => setCustomLectureTitle(e.target.value)}
                    placeholder={`عنوان مخصص (افتراضي: ${autoLectureTitle})`}
                    className={`w-full p-2.5 rounded-xl border text-xs font-medium ${
                      isDark
                        ? 'bg-[#0B1221] border-slate-700 text-slate-100 placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: CAPTURE OR UPLOAD PHOTOS */}
          <div
            className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'
            } space-y-4`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <label className="text-base font-bold text-amber-400 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                <span>2. {t('addPhotosForLecture')}</span>
              </label>

              {uploadedPhotos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setUploadedPhotos([])}
                  className="flex items-center gap-1 text-xs text-rose-400 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>مسح جميع الصور ({uploadedPhotos.length})</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Camera Button */}
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 to-amber-600/10 hover:from-amber-500/25 hover:to-amber-600/20 border border-amber-500/40 text-amber-300 font-bold transition-all shadow-lg active:scale-98 cursor-pointer"
              >
                <Camera className="w-6 h-6 text-amber-400" />
                <span className="text-sm font-black">{t('captureCamera')}</span>
              </button>

              {/* Gallery File Input */}
              <label className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-[#1E293B] hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold transition-all shadow-lg cursor-pointer active:scale-98">
                <ImageIcon className="w-6 h-6 text-amber-400" />
                <span className="text-sm font-black">{t('uploadGallery')}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Cancelled Lecture Shortcut */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowCancelledModal(true)}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs transition-all cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>⚠️ المحاضرة لم تُعقد؟ اضغط هنا لتوثيقها كمحاضرة ملغاة</span>
              </button>
            </div>

            {/* Uploaded Photos Grid Preview */}
            {uploadedPhotos.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>تم تجهيز ({uploadedPhotos.length}) صورة للترقيم والحفظ</span>
                  </span>
                  <span className="text-amber-400 font-mono text-[11px]">
                    الترقيم التلقائي: (001.jpg, 002.jpg...)
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-80 overflow-y-auto p-3 bg-[#0B1221] rounded-2xl border border-slate-800">
                  {uploadedPhotos.map((url, idx) => {
                    const formattedNum =
                      idx + 1 < 10
                        ? `00${idx + 1}`
                        : idx + 1 < 100
                        ? `0${idx + 1}`
                        : `${idx + 1}`;
                    return (
                      <div
                        key={idx}
                        className="relative group aspect-[3/4] rounded-xl overflow-hidden border border-amber-500/30 bg-black shadow-md"
                      >
                        <img
                          src={url}
                          alt={`Photo ${idx}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 right-1 bg-black/85 text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border border-amber-500/40">
                          {formattedNum}.jpg
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setUploadedPhotos((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          className="absolute bottom-1 left-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-md text-[10px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          حذف
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* FINAL SUBMIT BUTTON */}
          <button
            type="button"
            onClick={handleSaveLecture}
            disabled={isProcessing || uploadedPhotos.length === 0 || !selectedSubjId}
            className={`w-full py-5 rounded-2xl text-white font-black text-lg shadow-xl shadow-amber-950/60 flex items-center justify-center gap-3 transition-all ${
              uploadedPhotos.length > 0 && selectedSubjId
                ? 'bg-gradient-to-r from-[#D4AF37] via-amber-500 to-[#B45309] hover:scale-[1.01] active:scale-98 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Zap className="w-6 h-6 fill-white text-white" />
            <span>
              {isProcessing
                ? 'جاري ترقيم الصور وحفظ المحاضرة في قاعدة البيانات...'
                : !selectedSubjId
                ? 'الرجاء اختيار المادة لحفظ المحاضرة'
                : uploadedPhotos.length === 0
                ? 'الرجاء إضافة صور للمحاضرة عبر الكاميرا أو المعرض'
                : `💾 حفظ المحاضرة وتخزين (${uploadedPhotos.length}) صورة في ${currentSubjObj?.name || 'المادة'}`}
            </span>
          </button>

        </div>
      )}

      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCaptureModal
          onClose={() => setShowCamera(false)}
          onCapture={handleCapturedPhoto}
        />
      )}

      {/* Cancelled Lecture Modal */}
      <CancelledLectureModal
        isOpen={showCancelledModal}
        onClose={() => setShowCancelledModal(false)}
        defaultSubjectId={selectedSubjId}
      />

    </div>
  );
};
