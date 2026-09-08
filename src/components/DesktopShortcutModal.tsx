import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Monitor, Smartphone, Download, CheckCircle, Keyboard, ExternalLink, Sparkles, ShieldCheck, Github, Play, Check, Copy, FileCode, Layers } from 'lucide-react';

export const DesktopShortcutModal: React.FC = () => {
  const { settings, t } = useApp();
  const isDark = settings.theme === 'dark';
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);
  const [showWorkflowCode, setShowWorkflowCode] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('لتثبيت التطبيق فوراً على جهازك:\n\n1. اضغط على القائمة (⋮) أعلى متصفحك\n2. اختر "تثبيت التطبيق" أو "الإضافة إلى الشاشة الرئيسية"');
    }
  };

  const currentAppUrl = window.location.href.split('?')[0];
  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(currentAppUrl)}`;

  const workflowCode = `name: Build Android APK

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build-apk:
    name: Build Android APK
    runs-on: ubuntu-latest

    steps:
      - name: 📥 استيراد الكود (Checkout Repository)
        uses: actions/checkout@v4

      - name: ☕ إعداد بيئة جافا (Setup Java 17)
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: 📱 إعداد بيئة أندرويد (Setup Android SDK)
        uses: android-actions/setup-android@v3

      - name: 🟢 إعداد Node.js (Setup Node.js)
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: 📦 تثبيت حزم المشروع (Install Dependencies)
        run: npm install

      - name: 🏗️ بناء واجهة التطبيق (Build Web Assets)
        run: npm run build

      - name: 🔄 مزامنة منصة أندرويد عبر Capacitor
        run: |
          if [ ! -d "android" ]; then
            npx cap add android
          fi
          npx cap sync android

      - name: 🔑 منح صلاحيات التنفيذ لـ Gradle
        run: chmod +x android/gradlew

      - name: ⚙️ بناء ملف التطبيق APK
        run: |
          cd android
          ./gradlew assembleDebug --stacktrace

      - name: 📤 رفع ملف الـ APK وتجهيزه للتحميل
        uses: actions/upload-artifact@v4
        with:
          name: LectureVault-Android-APK
          path: android/app/build/outputs/apk/debug/app-debug.apk
          retention-days: 30`;

  const handleCopyWorkflow = () => {
    navigator.clipboard.writeText(workflowCode);
    setCopiedWorkflow(true);
    setTimeout(() => setCopiedWorkflow(false), 2500);
  };

  const downloadWindowsShortcutScript = () => {
    const batScript = `@echo off
echo Creating Desktop Shortcut for UniLecture Organizer...
set SCRIPT="%TEMP%\\CreateShortcut.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = "%USERPROFILE%\\Desktop\\منسق المحاضرات الجامعية.url" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "${currentAppUrl}" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%
cscript //nologo %SCRIPT%
del %SCRIPT%
echo Desktop shortcut created successfully!
pause
`;
    const blob = new Blob([batScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'إنشاء_اختصار_سطح_المكتب.bat';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadUrlShortcut = () => {
    const urlContent = `[InternetShortcut]\nURL=${currentAppUrl}\nIconIndex=0`;
    const blob = new Blob([urlContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'منسق_المحاضرات_الجامعية.url';
    a.click();
    URL.revokeObjectURL(url);
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
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              تحويل وتثبيت التطبيق (Android APK & GitHub Actions)
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              بناء تلقائي لملف APK جاهز للتثبيت عبر GitHub Actions، أو تثبيت سريع كـ WebAPK واختصار سطح المكتب
            </p>
          </div>
        </div>
      </div>

      {/* GitHub Actions APK Automated Builder Card */}
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-[#0F172A] border-purple-500/40 shadow-2xl' : 'bg-white border-purple-300 shadow-xl'
      } space-y-5 relative overflow-hidden`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Github className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-purple-300">تحويل وبناء APK عبر منصة GitHub آلياً</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                  GitHub Actions CI/CD
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                تم تجهيز وضبط ملف البناء التلقائي <code className="text-amber-400 font-mono">.github/workflows/build-apk.yml</code> داخل مشروعك
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={handleCopyWorkflow}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedWorkflow ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedWorkflow ? 'تم نسخ الكود ✓' : 'نسخ ملف Workflow'}</span>
            </button>
            <button
              onClick={() => setShowWorkflowCode(!showWorkflowCode)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileCode className="w-4 h-4 text-amber-400" />
              <span>{showWorkflowCode ? 'إخفاء الكود' : 'عرض الكود'}</span>
            </button>
          </div>
        </div>

        {/* Step-by-Step GitHub Guide */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          <div className="p-4 rounded-xl bg-[#0B1221] border border-purple-900/40 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600/30 text-purple-300 font-bold text-xs flex items-center justify-center">1</div>
            <h4 className="text-xs font-bold text-slate-200">تصدير المشروع إلى GitHub</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              من قائمة الإعدادات العلوية في AI Studio اضغط على <strong className="text-slate-200">Export to GitHub</strong> أو قم برفع الملفات إلى مستودعك (Repository).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0B1221] border border-purple-900/40 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600/30 text-purple-300 font-bold text-xs flex items-center justify-center">2</div>
            <h4 className="text-xs font-bold text-slate-200">فتح تبويب Actions</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              في صفحة المستودع على GitHub، اضغط على تبويب <strong className="text-purple-300">Actions</strong> في القائمة العلوية.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0B1221] border border-purple-900/40 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600/30 text-purple-300 font-bold text-xs flex items-center justify-center">3</div>
            <h4 className="text-xs font-bold text-slate-200">تشغيل البناء الآلي (Build)</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              اختر <strong className="text-slate-200">Build Android APK</strong> واضغط على <span className="text-emerald-400 font-bold">Run workflow</span> (أو سيعمل تلقائياً عند أول Push).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0B1221] border border-purple-900/40 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600/30 text-emerald-300 font-bold text-xs flex items-center justify-center">4</div>
            <h4 className="text-xs font-bold text-emerald-300">تحميل الـ APK وتثبيته</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              بمجرد انتهاء البناء، ستجد ملف <strong className="text-emerald-400 font-mono">LectureVault-Android-APK</strong> في قسم Artifacts جاهزاً للتنزيل والتثبيت على هاتفك.
            </p>
          </div>

        </div>

        {/* Collapsible Workflow Code Viewer */}
        {showWorkflowCode && (
          <div className="p-4 rounded-xl bg-[#070B14] border border-slate-800 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
              <span className="font-mono text-purple-400">.github/workflows/build-apk.yml</span>
              <button onClick={handleCopyWorkflow} className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 text-[11px]">
                {copiedWorkflow ? 'تم النسخ' : 'نسخ النص'}
              </button>
            </div>
            <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto p-2 leading-relaxed max-h-60 overflow-y-auto">
              {workflowCode}
            </pre>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Android APK & PWA Direct Install */}
        <div className={`p-6 rounded-2xl border ${
          isDark ? 'bg-[#0F172A] border-amber-500/30' : 'bg-white border-amber-500/30'
        } space-y-5 shadow-xl flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-400">تطبيق أندرويد الجوال (APK / WebAPK)</h3>
                  <p className="text-[11px] text-slate-400 font-medium">جاهز للتثبيت والتنزيل المباشر</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                PWA READY
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              التطبيق مجهز بنظام WebAPK الأصلي ومكتمل المكونات. عند التثبيت ينزل كتطبيق أندرويد مستقل بأيقونته وشاشته الكاملة بدون شريط متصفح!
            </p>

            <div className="p-4 rounded-xl bg-[#0B1221] border border-slate-800 space-y-2 text-xs font-semibold text-slate-300 mb-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>طريقتان للحصول على التطبيق:</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400 text-[11px] pr-2">
                <li><strong className="text-slate-200">التثبيت المباشر بنقرة زر:</strong> بالضغط على الزر أدناه ليتم تثبيته فوراً على هاتفك.</li>
                <li><strong className="text-slate-200">تحميل ملف APK مستقل:</strong> عبر خدمة PWABuilder الرسمية من مايكروسوفت لتنزيل ملف .apk مباشر.</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleInstallPwa}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-98 transition-all"
            >
              <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
              <span>{isInstalled ? 'التطبيق مثبت بالفعل على جهازك ✓' : 'تثبيت التطبيق على الجوال الآن (One-Click APK)'}</span>
            </button>

            <a
              href={pwaBuilderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-xl bg-[#0B1221] text-amber-400 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all text-center"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>تحميل ملف .APK عبر PWABuilder</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Windows Desktop Shortcut */}
        <div className={`p-6 rounded-2xl border ${
          isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'
        } space-y-5 shadow-xl flex flex-col justify-between`}>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-amber-400">{t('windowsExeGuide')}</h3>
                <p className="text-[11px] text-slate-400 font-medium">سطح المكتب والكمبيوتر</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {t('windowsExeDesc')}
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={downloadWindowsShortcutScript}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B45309] text-white font-bold text-xs shadow-xl shadow-amber-900/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-98 transition-all"
            >
              <Download className="w-4 h-4 text-white" />
              <span>تنزيل السكريبت الآلي لإنشاء الاختصار (.bat)</span>
            </button>

            <button
              onClick={downloadUrlShortcut}
              className="w-full py-3.5 rounded-xl bg-[#0B1221] text-slate-200 border border-slate-800 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
            >
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <span>تنزيل اختصار الإنترنت المباشر (.url)</span>
            </button>
          </div>
        </div>

      </div>

      {/* Desktop Keyboard Hotkeys */}
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'
      } space-y-4 shadow-xl`}>
        <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-amber-400" />
          <span>{t('keyboardShortcutsHeader')}</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold">
          <div className="p-3 rounded-xl bg-[#0B1221] border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">الإضافة السريعة</span>
            <kbd className="px-2 py-1 rounded bg-[#1E293B] text-amber-400 font-mono text-[11px] border border-slate-700">Ctrl + N</kbd>
          </div>
          <div className="p-3 rounded-xl bg-[#0B1221] border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">تصدير PDF</span>
            <kbd className="px-2 py-1 rounded bg-[#1E293B] text-amber-400 font-mono text-[11px] border border-slate-700">Ctrl + E</kbd>
          </div>
          <div className="p-3 rounded-xl bg-[#0B1221] border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">الإعدادات</span>
            <kbd className="px-2 py-1 rounded bg-[#1E293B] text-amber-400 font-mono text-[11px] border border-slate-700">Ctrl + S</kbd>
          </div>
          <div className="p-3 rounded-xl bg-[#0B1221] border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">قفل التطبيق</span>
            <kbd className="px-2 py-1 rounded bg-[#1E293B] text-amber-400 font-mono text-[11px] border border-slate-700">Ctrl + L</kbd>
          </div>
        </div>
      </div>

    </div>
  );
};
