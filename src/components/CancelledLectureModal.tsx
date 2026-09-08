import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, X, CheckCircle2, Image as ImageIcon } from 'lucide-react';

interface CancelledLectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubjectId?: string;
}

export const CancelledLectureModal: React.FC<CancelledLectureModalProps> = ({
  isOpen,
  onClose,
  defaultSubjectId
}) => {
  const { subjects, lectures, addNewLecture, addPhotosToLecture, setActiveTab, setSelectedLectureId } = useApp();

  const [selectedSubjectId, setSelectedSubjectId] = useState(defaultSubjectId || (subjects[0]?.id || ''));
  const [reason, setReason] = useState('غياب المدرس');
  const [customReason, setCustomReason] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  const subjectLectures = lectures.filter(l => l.subjectId === currentSubject?.id);
  const nextNum = subjectLectures.length + 1;
  const finalReason = reason === 'أخرى' ? (customReason.trim() || 'سبب غير محدد') : reason;
  const instructorText = [currentSubject?.instructorTitle, currentSubject?.instructorName].filter(Boolean).join(' ') || 'غير محدد';
  const currentDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const generateCardImage = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 800, 1000);

    // Red outer border
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 16;
    ctx.strokeRect(30, 30, 740, 940);

    // Header Alert Box
    ctx.fillStyle = '#FEF2F2';
    ctx.fillRect(60, 60, 680, 180);
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 3;
    ctx.strokeRect(60, 60, 680, 180);

    ctx.fillStyle = '#DC2626';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('تنبيه: لم تُعقد المحاضرة', 400, 130);

    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 30px Arial, sans-serif';
    ctx.fillText(currentSubject?.name || 'مادة دراسية', 400, 190);

    // Details List
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 26px Arial, sans-serif';
    ctx.textAlign = 'right';

    ctx.fillText(`رقم المحاضرة:  ${nextNum}`, 700, 340);
    ctx.fillText(`المدرس:  ${instructorText}`, 700, 420);
    ctx.fillText(`التاريخ:  ${currentDate}`, 700, 500);
    ctx.fillText(`السبب:  ${finalReason}`, 700, 580);

    // Divider
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 860);
    ctx.lineTo(720, 860);
    ctx.stroke();

    // Footer Watermark
    ctx.fillStyle = '#64748B';
    ctx.font = '20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('تم التوثيق أوتوماتيكياً بواسطة تطبيق منسق المحاضرات', 400, 910);

    return canvas.toDataURL('image/png');
  };

  const handleGenerateAndSave = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!currentSubject) {
      alert('يرجى اختيار مادة دراسية أولاً');
      return;
    }

    setIsGenerating(true);

    try {
      const imageDataUrl = generateCardImage();

      // Create new cancelled lecture
      const lectTitle = `محاضرة ${nextNum} - ملغاة (${finalReason})`;
      const newLect = await addNewLecture(currentSubject.id, lectTitle, true, finalReason);
      if (imageDataUrl) {
        await addPhotosToLecture(newLect.id, [imageDataUrl]);
      }

      setSuccessMsg('تم إنشاء بطاقة المحاضرة الملغاة وإضافتها للمادة بنجاح!');
      setTimeout(() => {
        setSuccessMsg('');
        setIsGenerating(false);
        onClose();
        setSelectedLectureId(newLect.id);
        setActiveTab('explorer');
      }, 1000);

    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      alert('حدث خطأ أثناء إنشاء البطاقة، يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg p-6 bg-[#0F172A] border border-slate-800 rounded-3xl shadow-2xl text-slate-100 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">تسجيل محاضرة ملغاة</h3>
              <p className="text-xs text-slate-400">توليد بطاقة توثيق رسمية للمحاضرة التي لم تُعقد</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">اختر المادة الدراسية:</label>
            <select
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.code ? `(${s.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">سبب عدم الانعقاد:</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="غياب المدرس">غياب المدرس</option>
              <option value="إجازة رسمية">إجازة رسمية</option>
              <option value="تأجيل بطلب من الدفعة">تأجيل بطلب من الدفعة</option>
              <option value="تعارض في القاعات">تعارض في القاعات</option>
              <option value="أخرى">أخرى (كتابة سبب مخصص)</option>
            </select>
          </div>

          {reason === 'أخرى' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">السبب المخصص:</label>
              <input
                type="text"
                placeholder="اكتب السبب هنا..."
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleGenerateAndSave}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
            <span>{isGenerating ? 'جاري إنشاء البطاقة...' : 'إنشاء البطاقة والحفظ'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all cursor-pointer"
          >
            إلغاء
          </button>
        </div>

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

      </div>
    </div>
  );
};
