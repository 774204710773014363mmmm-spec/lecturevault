import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Unlock, Key, ShieldCheck, AlertCircle, HelpCircle } from 'lucide-react';

export const LockScreen: React.FC = () => {
  const { unlockApp, resetPasswordWithSecurityAnswer, settings, t } = useApp();

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Recovery State
  const [showRecoveryModal, setShowRecoveryModal] = useState<boolean>(false);
  const [securityAnswerInput, setSecurityAnswerInput] = useState<string>('');
  const [newRecoveryPin, setNewRecoveryPin] = useState<string>('');
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const success = unlockApp(enteredPin);
    if (!success) {
      setErrorMessage(t('wrongPasswordAlert'));
      setEnteredPin(''); // Immediate input reset without freeze
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    if (!newRecoveryPin.trim()) {
      setRecoveryError('الرجاء إدخال كلمة سر جديدة');
      return;
    }

    const success = resetPasswordWithSecurityAnswer(securityAnswerInput, newRecoveryPin);
    if (!success) {
      setRecoveryError(t('wrongSecurityAnswer'));
    } else {
      setShowRecoveryModal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-2xl">
      <div className="relative w-full max-w-md bg-[#0F172A] border border-amber-500/30 rounded-2xl p-8 shadow-2xl text-center space-y-6">
        
        {/* Lock Icon Badge */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B45309] text-white flex items-center justify-center shadow-lg shadow-amber-900/30">
          <Lock className="w-8 h-8 text-white" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {t('appIsLocked')}
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            {t('enterPasswordToUnlock')}
          </p>
        </div>

        {/* Pin Form */}
        <form onSubmit={handleUnlockSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value)}
              placeholder="••••••••"
              autoFocus
              required
              className="w-full text-center tracking-widest text-2xl p-4 rounded-xl bg-[#0B1221] border border-slate-800 text-amber-400 font-mono focus:border-amber-500 focus:outline-none shadow-inner"
            />
          </div>

          {/* Smooth Wrong Password Alert */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold flex items-center justify-center gap-2 animate-bounce">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] via-amber-500 to-[#B45309] text-white font-bold text-base shadow-xl shadow-amber-900/30 hover:scale-[1.01] active:scale-98 transition-all cursor-pointer"
          >
            {t('unlockButton')}
          </button>
        </form>

        {/* Forgot Password Link */}
        <button
          onClick={() => setShowRecoveryModal(true)}
          className="text-xs text-amber-400/80 hover:text-amber-300 underline underline-offset-4 font-bold"
        >
          {t('forgotPassword')}
        </button>

      </div>

      {/* Security Question Recovery Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <form onSubmit={handleRecoverySubmit} className="bg-[#0F172A] border border-amber-500/40 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl text-right">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              <span>{t('resetWithSecurityQuestion')}</span>
            </div>

            <p className="text-xs text-slate-300 font-medium">
              سؤال الأمان: <span className="text-amber-300 font-bold">{settings.securityQuestion}</span>
            </p>

            <input
              type="text"
              value={securityAnswerInput}
              onChange={(e) => setSecurityAnswerInput(e.target.value)}
              placeholder="إجابة سؤال الأمان (مثال: أزرق)"
              required
              className="w-full p-3.5 rounded-xl bg-[#0B1221] border border-slate-800 text-slate-100 text-sm font-medium focus:border-amber-500"
            />

            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold">كلمة السر الجديدة:</span>
              <input
                type="password"
                value={newRecoveryPin}
                onChange={(e) => setNewRecoveryPin(e.target.value)}
                placeholder="أدخل كلمة السر الجديدة"
                required
                className="w-full p-3.5 rounded-xl bg-[#0B1221] border border-slate-800 text-amber-400 text-sm font-mono focus:border-amber-500"
              />
            </div>

            {recoveryError && (
              <p className="text-xs text-red-400 font-bold">{recoveryError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRecoveryModal(false)}
                className="px-4 py-2 rounded-xl bg-[#0B1221] text-slate-300 text-xs font-bold border border-slate-800"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B45309] text-white text-xs font-bold shadow-md"
              >
                {t('resetPasswordNow')}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
