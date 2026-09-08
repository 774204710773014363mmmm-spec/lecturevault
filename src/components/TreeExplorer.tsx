import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ChevronDown,
  ChevronLeft,
  Folder,
  FolderOpen,
  BookOpen,
  FileImage,
  Plus,
  Trash2,
  Calendar
} from 'lucide-react';

export const TreeExplorer: React.FC = () => {
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
    settings,
    t
  } = useApp();

  const isDark = settings.theme === 'dark';

  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({ [selectedYearId]: true });
  const [expandedSemesters, setExpandedSemesters] = useState<Record<string, boolean>>({ [selectedSemesterId]: true });
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({ [selectedSubjectId]: true });

  const [showAddModal, setShowAddModal] = useState<'year' | 'semester' | 'subject' | 'lecture' | null>(null);
  const [modalInputName, setModalInputName] = useState<string>('');

  const toggleYear = (id: string) => {
    setExpandedYears(prev => ({ ...prev, [id]: !prev[id] }));
    setSelectedYearId(id);
  };

  const toggleSemester = (id: string) => {
    setExpandedSemesters(prev => ({ ...prev, [id]: !prev[id] }));
    setSelectedSemesterId(id);
  };

  const toggleSubject = (id: string) => {
    setExpandedSubjects(prev => ({ ...prev, [id]: !prev[id] }));
    setSelectedSubjectId(id);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalInputName.trim()) return;

    if (showAddModal === 'year') {
      const y = await addNewYear(modalInputName);
      setSelectedYearId(y.id);
    } else if (showAddModal === 'semester') {
      const s = await addNewSemester(selectedYearId, modalInputName);
      setSelectedSemesterId(s.id);
    } else if (showAddModal === 'subject') {
      const sb = await addNewSubject(selectedSemesterId, modalInputName);
      setSelectedSubjectId(sb.id);
    } else if (showAddModal === 'lecture') {
      const l = await addNewLecture(selectedSubjectId, modalInputName);
      setSelectedLectureId(l.id);
    }

    setModalInputName('');
    setShowAddModal(null);
  };

  return (
    <div className={`p-5 rounded-2xl border ${
      isDark ? 'bg-[#0F172A] border-slate-800 text-slate-200' : 'bg-white border-slate-200'
    } shadow-xl flex flex-col gap-4`}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5 text-amber-500" />
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t('academicYears')}
          </h3>
        </div>

        <button
          onClick={() => setShowAddModal('year')}
          className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-bold flex items-center gap-1 transition-colors"
          title={t('addYear')}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>سنة جديدة</span>
        </button>
      </div>

      {/* Tree View */}
      <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
        {years.map((year) => {
          const isYearExpanded = !!expandedYears[year.id];
          const yearSemesters = semesters.filter(s => s.yearId === year.id);

          return (
            <div key={year.id} className="space-y-1">
              {/* Year Node */}
              <div
                onClick={() => toggleYear(year.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs font-bold transition-all ${
                  selectedYearId === year.id
                    ? 'bg-slate-800/80 text-amber-400 border-r-2 border-amber-500'
                    : 'text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>{year.name}</span>
                </div>
                {isYearExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4 rtl:rotate-180" />}
              </div>

              {/* Semesters under Year */}
              {isYearExpanded && (
                <div className="mr-3 pr-2 border-r border-slate-800 space-y-1 my-1">
                  
                  {/* Add Semester Button */}
                  <button
                    onClick={() => {
                      setSelectedYearId(year.id);
                      setShowAddModal('semester');
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-500/80 hover:text-amber-400 py-1 px-2"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{t('addSemester')}</span>
                  </button>

                  {yearSemesters.map((sem) => {
                    const isSemExpanded = !!expandedSemesters[sem.id];
                    const semSubjects = subjects.filter(sb => sb.semesterId === sem.id);

                    return (
                      <div key={sem.id} className="space-y-1">
                        {/* Semester Node */}
                        <div
                          onClick={() => toggleSemester(sem.id)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs font-medium transition-colors ${
                            selectedSemesterId === sem.id
                              ? 'bg-slate-800 text-amber-300'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                            <span>{sem.name}</span>
                          </div>
                          {isSemExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />}
                        </div>

                        {/* Subjects under Semester */}
                        {isSemExpanded && (
                          <div className="mr-3 pr-2 border-r border-slate-800 space-y-1 my-1">
                            
                            <button
                              onClick={() => {
                                setSelectedSemesterId(sem.id);
                                setShowAddModal('subject');
                              }}
                              className="flex items-center gap-1 text-[10px] font-bold text-amber-500/80 hover:text-amber-400 py-1 px-2"
                            >
                              <Plus className="w-3 h-3" />
                              <span>{t('addSubject')}</span>
                            </button>

                            {semSubjects.map((subj) => {
                              const isSubjExpanded = !!expandedSubjects[subj.id];
                              const subjLectures = lectures.filter(l => l.subjectId === subj.id);

                              return (
                                <div key={subj.id} className="space-y-1">
                                  {/* Subject Node */}
                                  <div
                                    onClick={() => toggleSubject(subj.id)}
                                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs font-semibold group transition-colors ${
                                      selectedSubjectId === subj.id
                                        ? 'bg-[#1E293B] text-white border border-amber-500/20 shadow-inner'
                                        : 'text-slate-400 hover:bg-slate-800'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <BookOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                      <span className="truncate">{subj.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                        selectedSubjectId === subj.id
                                          ? 'bg-amber-500/20 text-amber-500 font-mono'
                                          : 'bg-slate-700 text-slate-400 font-mono'
                                      }`}>
                                        {subjLectures.length < 10 ? `٠${subjLectures.length}` : subjLectures.length}
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (confirm(`حذف المادة "${subj.name}" وكافة المحاضرات المندرجة تحتها؟`)) {
                                            deleteSubject(subj.id);
                                          }
                                        }}
                                        className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                                        title="حذف المادة"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                      {isSubjExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />}
                                    </div>
                                  </div>

                                  {/* Lectures under Subject */}
                                  {isSubjExpanded && (
                                    <div className="mr-3 pr-2 border-r border-slate-800 space-y-1 my-1">
                                      
                                      <button
                                        onClick={() => {
                                          setSelectedSubjectId(subj.id);
                                          setShowAddModal('lecture');
                                        }}
                                        className="flex items-center gap-1 text-[10px] font-bold text-amber-500/80 hover:text-amber-400 py-1 px-2"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>{t('addLecture')}</span>
                                      </button>

                                      {subjLectures.map((lect) => {
                                        const lectPhotosCount = photos.filter(p => p.lectureId === lect.id).length;
                                        const isSelected = selectedLectureId === lect.id;

                                        return (
                                          <div
                                            key={lect.id}
                                            onClick={() => setSelectedLectureId(lect.id)}
                                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs font-medium group transition-all ${
                                              isSelected
                                                ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-300 border border-amber-500/40 shadow-sm'
                                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2 truncate">
                                              <FileImage className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                              <span className="truncate">{lect.title}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/40 text-amber-400 border border-amber-500/20">
                                                {lectPhotosCount}
                                              </span>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (confirm(`حذف المحاضرة "${lect.title}" وصورها؟`)) {
                                                    deleteLecture(lect.id);
                                                  }
                                                }}
                                                className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                                                title="حذف المحاضرة"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                </div>
                              );
                            })}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Add Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleAddSubmit} className="bg-slate-900 border border-amber-500/40 p-6 rounded-3xl w-full max-w-md space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-amber-400">
              {showAddModal === 'year' && t('addYear')}
              {showAddModal === 'semester' && t('addSemester')}
              {showAddModal === 'subject' && t('addSubject')}
              {showAddModal === 'lecture' && t('addLecture')}
            </h4>

            <input
              type="text"
              value={modalInputName}
              onChange={(e) => setModalInputName(e.target.value)}
              placeholder="أدخل الاسم بوضوح..."
              autoFocus
              required
              className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 text-sm font-medium focus:border-amber-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400"
              >
                إضافة
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
