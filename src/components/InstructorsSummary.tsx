import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GraduationCap, BookOpen, Plus, CheckCircle2, AlertCircle, Trash2, Edit3, UserCheck } from 'lucide-react';
import { SubjectNode } from '../types';

export const InstructorsSummary: React.FC = () => {
  const { subjects, lectures, selectedSemesterId, addNewSubject, updateSubject, deleteSubject, settings } = useApp();
  const isDark = settings.theme === 'dark';

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subjName, setSubjName] = useState('');
  const [subjCode, setSubjCode] = useState('');
  const [instructorTitle, setInstructorTitle] = useState('دكتور');
  const [instructorName, setInstructorName] = useState('');
  const [msg, setMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjName.trim() || !instructorName.trim()) {
      alert('يرجى كتابة اسم المادة والمدرس');
      return;
    }

    if (editingId) {
      const existing = subjects.find(s => s.id === editingId);
      if (existing) {
        await updateSubject({
          ...existing,
          name: subjName.trim(),
          code: subjCode.trim() || undefined,
          instructorTitle,
          instructorName: instructorName.trim()
        });
        setMsg('تم تعديل بيانات المادة والمدرس بنجاح');
      }
    } else {
      await addNewSubject(
        selectedSemesterId,
        subjName.trim(),
        subjCode.trim() || undefined,
        instructorTitle,
        instructorName.trim()
      );
      setMsg('تم حفظ المادة والمدرس بنجاح');
    }

    resetForm();
    setTimeout(() => setMsg(''), 3000);
  };

  const handleEdit = (sub: SubjectNode) => {
    setEditingId(sub.id);
    setSubjName(sub.name);
    setSubjCode(sub.code || '');
    setInstructorTitle(sub.instructorTitle || 'دكتور');
    setInstructorName(sub.instructorName || '');
  };

  const resetForm = () => {
    setEditingId(null);
    setSubjName('');
    setSubjCode('');
    setInstructorName('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('تنبيه: سيتم حذف المادة ومحاضراتها وجميع درجات الطلاب المرتبطة بها! هل أنت متأكد؟')) {
      await deleteSubject(id);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title Header */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-amber-500/20 shadow-md'
      }`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-xl shrink-0">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">سجل حضور وحصص الدكاترة والمهندسين</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              يتم احتساب عدد المحاضرات المنعقدة والغياب أوتوماتيكياً بناءً على ما يتم إدخاله في قسم المحاضرات.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* 1. List of Instructors and Stats (Top Section) */}
        <div className={`p-6 rounded-3xl border ${
          isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200 shadow-md'
        } space-y-4`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
              <UserCheck className="w-5 h-5" />
              <span>قائمة المدرسين والمواد المسجلة</span>
            </div>
            <span className="text-xs text-slate-400">عدد المواد: {subjects.length}</span>
          </div>

          {subjects.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm border border-dashed border-slate-800 rounded-2xl">
              <AlertCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              لا توجد مواد مسجلة حالياً. يمكنك إضافة مادة ومدرس جديدة من النموذج أدناه.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
              {subjects.map(s => {
                const subjectLectures = lectures.filter(l => l.subjectId === s.id);
                const cancelledCount = subjectLectures.filter(l => l.isCancelled).length;
                const heldCount = subjectLectures.length - cancelledCount;
                const instStr = `${s.instructorTitle || 'دكتور'} / ${s.instructorName || 'غير محدد'}`;

                return (
                  <div
                    key={s.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isDark ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-base text-white">{instStr}</h3>
                            {s.code && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {s.code}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-amber-400 font-semibold mt-1">مادة: {s.name}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEdit(s)}
                            className="p-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(s.id)}
                            className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/60 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                        الحصص: {heldCount}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
                        الغياب: {cancelledCount}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        الإجمالي: {subjectLectures.length}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Form: Add or Edit Subject & Instructor (Bottom Section) */}
        <div className={`p-6 rounded-3xl border ${
          isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200 shadow-md'
        } space-y-4`}>
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-base border-b border-slate-800 pb-3">
            <BookOpen className="w-5 h-5" />
            <span>{editingId ? 'تعديل بيانات المادة والمدرس' : 'إضافة مادة ومدرس جديد'}</span>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم المادة:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: خرسانة مسلحة"
                  value={subjName}
                  onChange={e => setSubjName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-emerald-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">رمز المادة (اختياري):</label>
                <input
                  type="text"
                  placeholder="مثال: CE201"
                  value={subjCode}
                  onChange={e => setSubjCode(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-emerald-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">الصفة / اللقب:</label>
                <select
                  value={instructorTitle}
                  onChange={e => setInstructorTitle(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-emerald-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="دكتور">دكتور</option>
                  <option value="دكتورة">دكتورة</option>
                  <option value="مهندس">مهندس</option>
                  <option value="مهندسة">مهندسة</option>
                  <option value="أستاذ">أستاذ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم المدرس:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: خالد"
                  value={instructorName}
                  onChange={e => setInstructorName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-emerald-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-slate-950 font-bold text-sm shadow-lg transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{editingId ? '💾 حفظ التعديلات' : '+ حفظ المادة والمدرس'}</span>
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold text-xs cursor-pointer"
                >
                  إلغاء التعديل
                </button>
              )}
            </div>

            {msg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{msg}</span>
              </div>
            )}
          </form>
        </div>

      </div>
    </div>
  );
};
