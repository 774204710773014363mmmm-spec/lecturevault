import React from 'react';
import { useApp } from '../context/AppContext';
import { HardDrive } from 'lucide-react';

export const StorageWidget: React.FC = () => {
  const { storageStats, settings, t } = useApp();
  const isDark = settings.theme === 'dark';

  const percentage = Math.min((storageStats.totalMB / 500) * 100, 100);

  return (
    <div className="fixed bottom-6 left-6 z-20 hidden md:flex flex-col items-end">
      <div className={`p-4 rounded-2xl shadow-2xl backdrop-blur-xl w-64 border transition-all ${
        isDark
          ? 'bg-[#1E293B]/90 border-amber-500/30 text-slate-200'
          : 'bg-white/90 border-amber-500/40 text-slate-800 shadow-amber-500/10'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              {t('storageUsage')}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-amber-400">
            {storageStats.totalMB} MB
          </span>
        </div>

        <div className="w-full h-2 bg-slate-900/80 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B45309] transition-all duration-500"
            style={{ width: `${Math.max(percentage, 4)}%` }}
          />
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <span>{storageStats.photoCount} {t('photosCount')}</span>
          <span>{storageStats.lectureCount} محاضرة</span>
        </div>
      </div>
    </div>
  );
};
