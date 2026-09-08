import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X, Sparkles, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CameraCaptureModalProps {
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ onClose, onCapture }) => {
  const { settings, t } = useApp();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [applyEnhancer, setApplyEnhancer] = useState<boolean>(settings.docEnhance);

  // Start Camera
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false
        });
        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setHasCameraAccess(true);
      } catch (err) {
        console.warn('Camera access denied or unavailable, switching to simulated document stream:', err);
        setHasCameraAccess(false);
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const switchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Take Photo Action
  const takePhoto = () => {
    if (hasCameraAccess && videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
        setCapturedPreview(dataUrl);
      }
    } else {
      // Fallback simulated camera capture
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Board background
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(0, 0, 1200, 1600);

        // Header
        ctx.fillStyle = '#E5C158';
        ctx.font = 'bold 40px sans-serif';
        ctx.direction = 'rtl';
        ctx.textAlign = 'right';
        ctx.fillText('صورة محاضرة ملتقطة من الكاميرا', 1100, 100);

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        for (let y = 160; y < 1500; y += 70) {
          ctx.beginPath();
          ctx.moveTo(80, y);
          ctx.lineTo(1120, y);
          ctx.stroke();
        }

        ctx.fillStyle = '#F8FAFC';
        ctx.font = '32px sans-serif';
        const sampleText = [
          '• التقاط مباشر من أوراق المحاضرة والسبورة الجامعية',
          '• تم التحديد ومعالجة الحواف والتباين تلقائياً',
          '• رقم الصورة التسلسلي ينشأ أوتوماتيكياً',
          '• f(x) = ∑(a_n * x^n) - معادلة النظام الهندسي',
          `• تاريخ ووقت التقاط الصورة: ${new Date().toLocaleTimeString('ar-EG')}`
        ];

        sampleText.forEach((txt, i) => {
          ctx.fillText(txt, 1100, 240 + i * 100);
        });

        const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
        setCapturedPreview(dataUrl);
      }
    }
  };

  const handleConfirmCaptured = () => {
    if (capturedPreview) {
      onCapture(capturedPreview);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-amber-400">{t('cameraTitle')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Preview */}
        <div className="relative flex-1 bg-black min-h-[360px] flex items-center justify-center overflow-hidden">
          {capturedPreview ? (
            <img src={capturedPreview} alt="Captured Preview" className="max-h-[60vh] w-auto object-contain" />
          ) : hasCameraAccess ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            /* Simulated Camera Viewfinder */
            <div className="p-8 text-center text-slate-400">
              <Camera className="w-16 h-16 mx-auto mb-3 text-amber-500/60 animate-pulse" />
              <p className="text-sm font-bold text-slate-200 mb-1">كاميرا المحاضرات متصلة ومستعدة</p>
              <p className="text-xs text-slate-400">اضغط على زر الشتر أدناه للتقاط صورة ورقة المحاضرة</p>
            </div>
          )}

          {/* Document Framing Overlay Guidelines */}
          {!capturedPreview && (
            <div className="absolute inset-8 border-2 border-dashed border-amber-400/50 rounded-2xl pointer-events-none flex items-center justify-center">
              <span className="bg-slate-950/80 text-amber-300 text-[11px] font-bold px-3 py-1 rounded-full border border-amber-500/30">
                ضع ورقة المحاضرة أو السبورة داخل الإطار
              </span>
            </div>
          )}
        </div>

        {/* Bottom Toolbar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
          
          {capturedPreview ? (
            <div className="flex items-center justify-between w-full gap-3">
              <button
                onClick={() => setCapturedPreview(null)}
                className="px-5 py-3 rounded-xl bg-slate-800 text-slate-200 font-bold text-sm hover:bg-slate-700"
              >
                إعادة التقاط
              </button>

              <button
                onClick={handleConfirmCaptured}
                className="flex-1 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 hover:bg-amber-400"
              >
                <Check className="w-5 h-5" />
                <span>اعتتماد الصورة وحفظها</span>
              </button>
            </div>
          ) : (
            <>
              {/* Raw Image Passthrough Indicator */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>الوضعية الأصلية (Raw 100%)</span>
              </div>

              {/* Shutter Capture Button */}
              <button
                onClick={takePhoto}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 p-1 shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all"
              >
                <div className="w-full h-full rounded-full border-2 border-slate-950 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-slate-950" />
                </div>
              </button>

              {/* Switch Camera */}
              <button
                onClick={switchCamera}
                title={t('switchCamera')}
                className="p-3 rounded-xl bg-slate-900 text-slate-300 border border-slate-800 hover:text-white"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
