import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function AlarmPopup({ isOpen, onClose, title, message }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Phát âm thanh báo động
      if (audioRef.current) {
        audioRef.current.play().catch(err => {
          console.warn('Không thể phát âm thanh:', err);
        });
      }

      const timer = setTimeout(() => {
        onClose();
      }, 30000);

      return () => {
        clearTimeout(timer);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
   
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
       
        <div 
          className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 animate-pulse"
          onClick={(e) => e.stopPropagation()}
        >
     
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-600 animate-bounce" />
              <h2 className="text-2xl font-bold text-red-600">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <p className="text-gray-700 text-lg mb-6">{message}</p>

          <button
            onClick={onClose}
            className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Đã hiểu
          </button>
        </div>
      </div>

      <audio
        ref={audioRef}
        loop
        preload="auto"
      >

        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77+eeTQ8MUKfj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBlou+/nnk0PDFCn4/C2YxwGOJHX8sx5LAUkd8fw3ZBAC" type="audio/wav" />
      </audio>
    </>
  );
}

