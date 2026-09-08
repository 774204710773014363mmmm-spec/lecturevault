import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Zap,
  FolderTree,
  FileText,
  RefreshCw,
  Settings as SettingsIcon,
  Monitor,
  Lock,
  Moon,
  Sun,
  Globe,
  GraduationCap,
  Smartphone,
  Award
} from 'lucide-react';
import { ActiveTab } from '../types';

export const Header: React.FC = () => {
  const { settings, updateSettings, activeTab, setActiveTab, lockAppNow, t } = useApp();

  const isDark = settings.theme === 'dark';

  const navItems: { id: ActiveTab; labelKey: keyof typeof import('../i18n/translations').translations.ar; icon: React.ReactNode; isHighlight?: boolean }[] = [
    { id: 'quick_add', labelKey: 'quickAdd', icon: <Zap className="w-5 h-5" />, isHighlight: true },
    { id: 'explorer', labelKey: 'treeExplorer', icon: <FolderTree className="w-5 h-5" /> },
    { id: 'instructors', labelKey: 'instructorsLog', icon: <GraduationCap className="w-5 h-5 text-emerald-400" /> },
    { id: 'grades', labelKey: 'gradesTab', icon: <Award className="w-5 h-5 text-amber-400" /> },
    { id: 'pdf_export', labelKey: 'pdfExport', icon: <FileText className="w-5 h-5" /> },
    { id: 'sync', labelKey: 'smartSync', icon: <RefreshCw className="w-5 h-5" /> },
    { id: 'settings', labelKey: 'settings', icon: <SettingsIcon className="w-5 h-5" /> },
    { id: 'shortcuts', labelKey: 'desktopShortcuts', icon: <Smartphone className="w-5 h-5 text-emerald-400" /> },
  ];

  const toggleTheme = () => {
    updateSettings({ theme: isDark ? 'light' : 'dark' });
  };

  const toggleLanguage = () => {
    updateSettings({ language: settings.language === 'ar' ? 'en' : 'ar' });
  };

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-md border-b ${
      isDark ? 'bg-[#020617]/85 border-slate-800 text-slate-100' : 'bg-white/90 border-amber-500/30 text-slate-800'
    } transition-colors duration-300 shadow-xl`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => setActiveTab('explorer')}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B45309] flex items-center justify-center shadow-lg shadow-amber-900/30 shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {t('appName')}
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-amber-500 uppercase tracking-widest font-semibold opacity-70 hidden sm:block">
                ORGANIZER PRO v2.4
              </p>
            </div>
          </div>

          {/* Controls Right */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Download APK / App Installation Button */}
            <button
              onClick={() => setActiveTab('shortcuts')}
              title="تحميل وتثبيت تطبيق الأندرويد APK"
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:scale-105 transition-all"
            >
              <Smartphone className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="hidden md:inline">تحميل APK / الجوال</span>
            </button>

            {/* Passcode Lock Button */}
            {settings.hasPasswordSet && (
              <button
                onClick={lockAppNow}
                title="قفل التطبيق بكلمة السر"
                className={`p-2.5 rounded-full border transition-all ${
                  isDark
                    ? 'bg-[#0F172A] border-slate-700 text-amber-400 hover:text-white hover:border-amber-500/50'
                    : 'bg-slate-100 border-amber-500/40 text-amber-700 hover:bg-amber-50'
                }`}
              >
                <Lock className="w-5 h-5" />
              </button>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={isDark ? t('lightMode') : t('darkMode')}
              className={`p-2.5 rounded-full border transition-all ${
                isDark
                  ? 'bg-[#0F172A] border-slate-700 text-slate-400 hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Language Switch */}
            <button
              onClick={toggleLanguage}
              title="تغيير اللغة (Arabic / English)"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-all ${
                isDark
                  ? 'bg-[#0F172A] border-slate-700 text-slate-300 hover:border-amber-500/40 hover:text-amber-400'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-amber-500/40'
              }`}
            >
              <Globe className="w-4 h-4 text-amber-400" />
              <span>{settings.language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Quick Add CTA Button */}
            <button
              onClick={() => setActiveTab('quick_add')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B45309] text-white font-bold text-sm shadow-xl shadow-amber-900/30 hover:scale-105 transition-transform"
            >
              <Zap className="w-4 h-4 text-white fill-white" />
              <span className="hidden sm:inline">{t('quickAdd')}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center gap-1.5 sm:gap-2 py-2.5 overflow-x-auto no-scrollbar border-t border-slate-800/80">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? isDark
                      ? 'bg-[#1E293B] text-amber-400 border border-amber-500/30 shadow-inner'
                      : 'bg-amber-500/10 text-amber-700 border border-amber-500/30 shadow-sm'
                    : isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-[#0F172A]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className={isActive ? 'text-amber-400' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

