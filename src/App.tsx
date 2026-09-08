import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { QuickAddModal } from './components/QuickAddModal';
import { CardExplorer } from './components/CardExplorer';
import { InstructorsSummary } from './components/InstructorsSummary';
import { GradesTab } from './components/GradesTab';
import { PdfExportModal } from './components/PdfExportModal';
import { SmartSyncModal } from './components/SmartSyncModal';
import { SettingsModal } from './components/SettingsModal';
import { DesktopShortcutModal } from './components/DesktopShortcutModal';
import { LockScreen } from './components/LockScreen';
import { StorageWidget } from './components/StorageWidget';

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab, isLocked, lockAppNow, settings } = useApp();

  // Desktop Keyboard Hotkeys Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          setActiveTab('quick_add');
        } else if (e.key.toLowerCase() === 'e') {
          e.preventDefault();
          setActiveTab('pdf_export');
        } else if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          setActiveTab('settings');
        } else if (e.key.toLowerCase() === 'l') {
          e.preventDefault();
          if (settings.hasPasswordSet) {
            lockAppNow();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab, settings.hasPasswordSet, lockAppNow]);

  if (isLocked) {
    return <LockScreen />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 relative ${
      settings.theme === 'dark' ? 'bg-[#020617] text-slate-200' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Header Bar */}
      <Header />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        {activeTab === 'quick_add' && <QuickAddModal />}

        {activeTab === 'explorer' && <CardExplorer />}

        {activeTab === 'instructors' && <InstructorsSummary />}

        {activeTab === 'grades' && <GradesTab />}

        {activeTab === 'pdf_export' && <PdfExportModal />}
        {activeTab === 'sync' && <SmartSyncModal />}
        {activeTab === 'settings' && <SettingsModal />}
        {activeTab === 'shortcuts' && <DesktopShortcutModal />}
      </main>

      {/* Floating Immersive Storage Indicator */}
      <StorageWidget />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
