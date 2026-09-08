import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Globe,
  Camera,
  Crop,
  Sparkles,
  FileText,
  HardDrive,
  Trash2,
  Lock,
  Key,
  ShieldCheck,
  Check,
  AlertCircle
} from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const {
    settings,
    updateSettings,
    years,
    semesters,
    storageStats,
    refreshStorageStats,
    changePassword,
    wipeAllData,
    t
  } = useApp();

  const isDark = settings.theme === 'dark';

  // Toggle Switches State Handlers
  const toggleTheme = () => updateSettings({ theme: isDark ? 'light' : 'dark' });
  const toggleLanguage = () => updateSettings({ language: settings.language === 'ar' ? 'en' : 'ar' });
  const toggleAutoCrop = () => updateSettings({ autoCrop: !settings.autoCrop });
  const toggleDocEnhance = () => updateSettings({ docEnhance: !settings.docEnhance });
  const togglePdfHeader = () => updateSettings({ pdfHeader: !settings.pdfHeader });
  const togglePdfFooterNumbers = () => updateSettings({ pdfFooterNumbers: !settings.pdfFooterNumbers });

  // Clear Cache Toast
  const [clearCacheToast, setClearCacheToast] = useState<boolean>(false);

  // Wipe / Reset Database State
  const [wipeStep, setWipeStep] = useState<'idle' | 'warning' | 'success' | 'cancelled' | 'error'>('idle');
  const [isWiping, setIsWiping] = useState<boolean>(false);

  const handleConfirmWipe = async () => {
    setIsWiping(true);
    try {
      const res = await wipeAllData();
      if (res) {
        setWipeStep('success');
      } else {
        setWipeStep('error');
      }
    } catch (err) {
      console.error(err);
      setWipeStep('error');
    } finally {
      setIsWiping(false);
    }
  };

  const handleClearCache = async () => {
    // Clear temporary blob caches
    if ('caches' in window) {
      const keys = await caches.keys();
      for (const k of keys) {
        await caches.delete(k);
      }
    }
    await refreshStorageStats();
    setClearCacheToast(true);
    setTimeout(() => setClearCacheToast(false), 3000);
  };

  // Change Password Screen State inside Settings
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [oldPinInput, setOldPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [securityAnswerInput, setSecurityAnswerInput] = useState<string>(settings.securityAnswer || '');
  const [passwordStatusMsg, setPasswordStatusMsg] = useState<{ isError: boolean; text: string } | null>(null);

  const handleSavePasswordSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatusMsg(null);

    if (!newPinInput.trim()) {
      setPasswordStatusMsg({ isError: true, text: 'الرجاء إدخال كلمة سر جديدة' });
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setPasswordStatusMsg({ isError: true, text: t('passwordMismatchAlert') });
      return;
    }

    if (!securityAnswerInput.trim()) {
      setPasswordStatusMsg({ isError: true, text: 'الرجاء إدخال إجابة سؤال الأمان الإجباري' });
      return;
    }

    const res = changePassword(oldPinInput, newPinInput);
    if (!res.success) {
      setPasswordStatusMsg({ isError: true, text: t(res.messageKey as any || 'oldPasswordIncorrect') });
      return;
    }

    // Update security question answer
    updateSettings({
      hasPasswordSet: true,
      securityQuestion: 'ما هو لونك المفضل؟',
      securityAnswer: securityAnswerInput.trim()
    });

    setPasswordStatusMsg({ isError: false, text: t('savePasswordSuccess') });
    setOldPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setTimeout(() => setShowChangePasswordModal(false), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* Banner */}
      <div className={`p-6 rounded-2xl border ${
        isDark
          ? 'bg-[#0F172A] border-amber-500/30 shadow-2xl'
          : 'bg-gradient-to-r from-amber-50 via-white to-amber-100/50 border-amber-500/30 shadow-md'
      }`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B45309] text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-900/30">
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {t('settingsTitle')}
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              تخصيص المظهر، مفاتيح الكاميرا، معالجة الصور، خيارات الـ PDF، وقفل التطبيق بكلمة سر
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Section 1: Appearance & Language */}
        <div className={`p-6 rounded-2xl border ${
          isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'
        } space-y-4 shadow-xl`}>
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-400" />
            <span>{t('appearanceAndLang')}</span>
          </h3>

          {/* Theme Toggle Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B1221] border border-slate-800">
            <div className="flex items-center gap-2">
              {isDark ? <Moon className="w-5 h-5 text-amber-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
              <span className="text-xs font-bold text-slate-200">{t('themeMode')}</span>
            </div>
            <button
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full p-1 transition-colors relative ${
                isDark ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                isDark ? 'translate-x-0 rtl:-translate-x-6' : 'translate-x-6 rtl:translate-x-0'
              }`} />
            </button>
          </div>

          {/* Language Toggle Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B1221] border border-slate-800">
            <span className="text-xs font-bold text-slate-200">{t('language')}</span>
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-bold"
            >
              {settings.language === 'ar' ? 'العربية (RTL)' : 'English (LTR)'}
            </button>
          </div>
        </div>

        {/* Section 2: Quick Add Configuration */}
        <div className={`p-6 rounded-2xl border ${
          isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'
        } space-y-4 shadow-xl`}>
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-amber-400" />
            <span>{t('quickAddPreset')}</span>
          </h3>

          <div className="space-y-3">
            <div>
              <span className="text-xs text-slate-400 font-bold block mb-1">{t('currentYearSelect')}</span>
              <select
                value={settings.currentYearId}
                onChange={(e) => updateSettings({ currentYearId: e.target.value })}
                className={`w-full p-3 rounded-xl border text-xs font-bold ${
                  isDark ? 'bg-[#0B1221] border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {years.map((y) => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-bold block mb-1">{t('currentSemesterSelect')}</span>
              <select
                value={settings.currentSemesterId}
                onChange={(e) => updateSettings({ currentSemesterId: e.target.value })}
                className={`w-full p-3 rounded-xl border text-xs font-bold ${
                  isDark ? 'bg-[#0B1221] border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Camera & Image Processing */}
        <div className={`p-6 rounded-2xl border ${
          isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'
        } space-y-4 shadow-xl`}>
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-400" />
            <span>{t('cameraAndImageSettings')}</span>
          </h3>

          {/* Auto-Crop Toggle Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B1221] border border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-200 block">{t('autoCrop')}</span>
              <span className="text-[10px] text-slate-400 block">{t('autoCropDesc')}</span>
            </div>
            <button
              onClick={toggleAutoCrop}
              className={`w-12 h-6 rounded-full p-1 transition-colors relative ${
                settings.autoCrop ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                settings.autoCrop ? 'translate-x-0 rtl:-translate-x-6' : 'translate-x-6 rtl:translate-x-0'
              }`} />
            </button>
          </div>

          {/* Doc Enhancer Filter Toggle Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B1221] border border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-200 block">{t('docEnhanceFilter')}</span>
              <span className="text-[10px] text-slate-400 block">{t('docEnhanceDesc')}</span>
            </div>
            <button
              onClick={toggleDocEnhance}
              className={`w-12 h-6 rounded-full p-1 transition-colors relative ${
                settings.docEnhance ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                settings.docEnhance ? 'translate-x-0 rtl:-translate-x-6' : 'translate-x-6 rtl:translate-x-0'
              }`} />
            </button>
          </div>

          {/* Default Resolution */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B1221] border border-slate-800">
            <span className="text-xs font-bold text-slate-200">{t('defaultResolution')}</span>
            <select
              value={settings.defaultResolution}
              onChange={(e) => updateSettings({ defaultResolution: e.target.value as 'high' | 'medium' })}
              className={`p-1.5 rounded-xl border text-xs font-bold ${
                isDark ? 'bg-[#0B1221] border-slate-800 text-amber-400' : 'bg-slate-50 border-slate-300 text-amber-600'
              }`}
            >
              <option value="high">{t('resHigh')}</option>
              <option value="medium">{t('resMedium')}</option>
            </select>
          </div>
        </div>

        {/* Section 4: PDF Defaults */}
        <div className={`p-6 rounded-2xl border ${
          isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'
        } space-y-4 shadow-xl`}>
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>{t('pdfDefaultSettings')}</span>
          </h3>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B1221] border border-slate-800">
            <span className="text-xs font-bold text-slate-200">{t('pdfPageSize')}</span>
            <select
              value={settings.pdfPageSize}
              onChange={(e) => updateSettings({ pdfPageSize: e.target.value as 'A4' | 'Original' })}
              className={`p-1.5 rounded-xl border text-xs font-bold ${
                isDark ? 'bg-[#0B1221] border-slate-800 text-amber-400' : 'bg-slate-50 border-slate-300 text-amber-600'
              }`}
            >
              <option value="A4">{t('pageSizeA4')}</option>
              <option value="Original">{t('pageSizeOriginal')}</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B1221] border border-slate-800">
            <span className="text-xs font-bold text-slate-200">{t('includeHeader')}</span>
            <button
              onClick={togglePdfHeader}
              className={`w-12 h-6 rounded-full p-1 transition-colors relative ${
                settings.pdfHeader ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                settings.pdfHeader ? 'translate-x-0 rtl:-translate-x-6' : 'translate-x-6 rtl:translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B1221] border border-slate-800">
            <span className="text-xs font-bold text-slate-200">{t('includeFooterNumbers')}</span>
            <button
              onClick={togglePdfFooterNumbers}
              className={`w-12 h-6 rounded-full p-1 transition-colors relative ${
                settings.pdfFooterNumbers ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                settings.pdfFooterNumbers ? 'translate-x-0 rtl:-translate-x-6' : 'translate-x-6 rtl:translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Section 5: Storage & App Lock */}
        <div className={`md:col-span-2 p-6 rounded-2xl border ${
          isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'
        } space-y-6 shadow-xl`}>
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-amber-400" />
            <span>{t('storageAndLock')}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Storage Usage Bar */}
            <div className="p-4 rounded-xl bg-[#0B1221] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>{t('storageUsage')}</span>
                <span className="text-amber-400 font-mono">{storageStats.totalMB} MB</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5">
                <div
                  style={{ width: `${Math.min((storageStats.totalMB / 500) * 100, 100)}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B45309]"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                يغطي ({storageStats.photoCount}) صورة موزعة على ({storageStats.lectureCount}) محاضرة
              </p>
            </div>

            {/* Clear Cache Button */}
            <div className="p-4 rounded-xl bg-[#0B1221] border border-slate-800 flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-200 block">{t('clearCache')}</span>
                <span className="text-[10px] text-slate-400 block">{t('clearCacheDesc')}</span>
              </div>
              <button
                onClick={handleClearCache}
                className="px-4 py-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold hover:bg-red-600/30 shrink-0"
              >
                مسح الذاكرة
              </button>
            </div>
          </div>

          {clearCacheToast && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
              {t('clearCacheSuccess')}
            </div>
          )}

          {/* App Lock & Password Change Section */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">{t('appLockSection')}</span>
                  <span className="text-[10px] text-slate-400 block">
                    حماية المحاضرات والملفات برمز مرور سري وسؤال الأمان الإجباري
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowChangePasswordModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B45309] text-white text-xs font-bold hover:scale-105 transition-transform shadow-lg shadow-amber-900/20"
              >
                {settings.hasPasswordSet ? t('changePasswordButton') : 'إعداد كلمة السر والقفل لأول مرة'}
              </button>
            </div>
          </div>

          {/* Wipe All Data / Reset Database Section */}
          <div className="pt-4 border-t border-red-900/40 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-red-950/20 border border-red-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-red-300 block">⚙️ إدارة البيانات والإعدادات العامة</span>
                  <span className="text-xs text-slate-400 block">
                    تصفير وحذف كافة السجلات، الطلاب، المواد، الدرجات، والمدرسين وإعادة البدء من الرقم (1)
                  </span>
                </div>
              </div>

              <button
                onClick={() => setWipeStep('warning')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-red-950/50 transition-all shrink-0 cursor-pointer"
              >
                ⚠️ حذف جميع البيانات
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Wipe All Data Confirmation / Status Modal */}
      {wipeStep !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0F172A] border border-red-500/40 p-6 sm:p-8 rounded-2xl w-full max-w-lg space-y-6 shadow-2xl">
            
            {/* STEP 1: WARNING */}
            {wipeStep === 'warning' && (
              <>
                <div className="flex items-center gap-3 text-red-400 font-bold text-lg border-b border-red-900/50 pb-3">
                  <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                  <span>⚠️ تنبيه هام جداً!</span>
                </div>

                <div className="space-y-4 text-slate-200 text-sm leading-relaxed">
                  <p className="font-bold text-slate-100">
                    هل أنت متأكد من رغبتك في حذف <span className="text-red-400 font-extrabold underline">جميع البيانات</span>؟
                  </p>

                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-amber-400 block mb-1">سيتم مسح:</span>
                    <ul className="space-y-1.5 text-xs text-slate-300 font-medium">
                      <li className="flex items-center gap-2">
                        <span className="text-red-400">•</span> قائمة الطلاب بالكامل
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-red-400">•</span> جميع الدرجات والسجلات
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-red-400">•</span> قائمة المواد والمدرسين
                      </li>
                    </ul>
                  </div>

                  <p className="text-xs text-red-400 font-bold italic bg-red-950/40 p-3 rounded-xl border border-red-800/40">
                    ❗ هذا الإجراء لا يمكن التراجع عنه مطلقاً.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setWipeStep('cancelled')}
                    disabled={isWiping}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
                  >
                    ❌ إلغاء العملية
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmWipe}
                    disabled={isWiping}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-red-900/40 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isWiping ? 'جاري الحذف...' : '🚨 نعم، احذف الكل نهائياً'}
                  </button>
                </div>
              </>
            )}

            {/* STEP 2: SUCCESS */}
            {wipeStep === 'success' && (
              <>
                <div className="flex items-center gap-3 text-emerald-400 font-bold text-lg border-b border-emerald-900/50 pb-3">
                  <Check className="w-6 h-6 text-emerald-400 shrink-0" />
                  <span>✅ تم الحذف بنجاح!</span>
                </div>

                <div className="space-y-3 text-slate-200 text-sm">
                  <p className="font-bold text-slate-100 leading-relaxed">
                    تم مسح جميع الطلاب، الدرجات، المواد، والمدرسين وتصفير العدادات تماماً.
                  </p>
                  <p className="text-xs text-emerald-400 font-medium bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-800/40">
                    يمكنك الآن البدء بإضافة بيانات جديدة بدءاً من الرقم (1).
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setWipeStep('idle')}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
                  >
                    🔙 العودة للإعدادات
                  </button>
                </div>
              </>
            )}

            {/* STEP 3: CANCELLED */}
            {wipeStep === 'cancelled' && (
              <>
                <div className="flex items-center gap-3 text-amber-400 font-bold text-lg border-b border-amber-900/50 pb-3">
                  <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0" />
                  <span>🔒 تم إلغاء عملية الحذف.</span>
                </div>

                <div className="py-2 text-slate-200 text-sm">
                  <p className="font-medium text-slate-300">
                    بياناتك سليمة ولم يتم تغيير أي شيء.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setWipeStep('idle')}
                    className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
                  >
                    🔙 العودة للإعدادات
                  </button>
                </div>
              </>
            )}

            {/* STEP 4: ERROR */}
            {wipeStep === 'error' && (
              <>
                <div className="flex items-center gap-3 text-red-400 font-bold text-lg border-b border-red-900/50 pb-3">
                  <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                  <span>❌ حدث خطأ أثناء محاولة مسح البيانات!</span>
                </div>

                <div className="py-2 text-slate-300 text-sm">
                  <p>يرجى المحاولة لاحقاً أو إعادة تشغيل الصفحة.</p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setWipeStep('idle')}
                    className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
                  >
                    🔙 العودة للإعدادات
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* Change Password Screen Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <form onSubmit={handleSavePasswordSettings} className="bg-[#0F172A] border border-amber-500/40 p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-base pb-2 border-b border-slate-800">
              <Key className="w-5 h-5" />
              <span>شاشة إعداد وتغيير كلمة السر (App Passcode Settings)</span>
            </div>

            {settings.hasPasswordSet && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('oldPasswordLabel')}:</label>
                <input
                  type="password"
                  value={oldPinInput}
                  onChange={(e) => setOldPinInput(e.target.value)}
                  placeholder="أدخل كلمة السر الحالية"
                  required
                  className="w-full p-3 rounded-xl bg-[#0B1221] border border-slate-800 text-amber-400 text-sm font-mono"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('newPasswordLabel')}:</label>
                <input
                  type="password"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="كلمة السر الجديدة"
                  required
                  className="w-full p-3 rounded-xl bg-[#0B1221] border border-slate-800 text-amber-400 text-sm font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('confirmNewPasswordLabel')}:</label>
                <input
                  type="password"
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  placeholder="إعادة إدخال الجديدة"
                  required
                  className="w-full p-3 rounded-xl bg-[#0B1221] border border-slate-800 text-amber-400 text-sm font-mono"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1E293B] border border-amber-500/20 space-y-2">
              <span className="text-xs font-bold text-amber-400 block">{t('securityQuestionLabel')}:</span>
              <p className="text-xs text-amber-300 font-bold">{t('securityQuestionVal')}</p>
              <input
                type="text"
                value={securityAnswerInput}
                onChange={(e) => setSecurityAnswerInput(e.target.value)}
                placeholder={t('securityAnswerLabel')}
                required
                className="w-full p-3 rounded-xl bg-[#0B1221] border border-slate-800 text-slate-100 text-xs font-medium"
              />
            </div>

            {passwordStatusMsg && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                passwordStatusMsg.isError ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {passwordStatusMsg.isError ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                <span>{passwordStatusMsg.text}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(false)}
                className="px-4 py-2 rounded-xl bg-[#0B1221] text-slate-300 text-xs font-bold border border-slate-800"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B45309] text-white text-xs font-bold shadow-md"
              >
                حفظ كلمة السر والإعدادات
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
