import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Trash2, Sparkles } from 'lucide-react';
import { PhotoItem } from '../types';

interface ImageViewerModalProps {
  photo: PhotoItem;
  lectureTitle: string;
  onClose: () => void;
  onDelete: (photoId: string) => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  photo,
  lectureTitle,
  onClose,
  onDelete
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.3, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleDownloadSingle = () => {
    const a = document.createElement('a');
    a.href = photo.dataUrl;
    a.download = photo.fileName;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-900 border border-amber-500/30 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
          <div>
            <h3 className="text-base font-bold text-amber-400">
              {photo.fileName} ({lectureTitle})
            </h3>
            <p className="text-xs text-slate-400">
              التسلسل الرقمي التلقائي: {photo.indexNumber}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRotate}
              title="تدوير الصورة 90 درجة"
              className="p-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700"
            >
              <RotateCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleZoomIn}
              title="تكبير"
              className="p-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={handleZoomOut}
              title="تصغير"
              className="p-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownloadSingle}
              title="تنزيل هذه الصورة"
              className="p-2 rounded-xl bg-slate-800 text-amber-400 hover:bg-slate-700"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                if (confirm('حذف هذه الصورة؟')) {
                  onDelete(photo.id);
                  onClose();
                }
              }}
              title="حذف الصورة"
              className="p-2 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Canvas Container */}
        <div className="flex-1 bg-black flex items-center justify-center p-4 overflow-auto">
          <img
            src={photo.dataUrl}
            alt={photo.fileName}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease-out'
            }}
            className="max-h-full max-w-full object-contain rounded-lg shadow-xl"
          />
        </div>

      </div>
    </div>
  );
};
