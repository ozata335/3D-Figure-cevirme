import React from 'react';
import { Download, RefreshCcw, AlertCircle, Box, Loader2 } from 'lucide-react';
import { AppState } from '../types';

interface ResultViewerProps {
  appState: AppState;
  resultImage: string | null;
  resultText: string | null;
  onRetry: () => void;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({ appState, resultImage, resultText, onRetry }) => {
  
  const handleDownload = () => {
    if (resultImage) {
      // Create a canvas to add watermark
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.crossOrigin = "anonymous";
      img.src = resultImage;
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          // Draw the generated image
          ctx.drawImage(img, 0, 0);
          
          // Configure Watermark
          // Calculate sizes relative to image size
          const fontSize = Math.max(20, img.width * 0.03); 
          const iconSize = fontSize * 1.2;
          const margin = img.width * 0.02;
          
          ctx.font = `bold ${fontSize}px 'Inter', sans-serif`;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          
          const text = "ankaracocuketkinlikler";
          
          // Measure text to position icon
          const textMetrics = ctx.measureText(text);
          const textWidth = textMetrics.width;
          
          // Position (Bottom Right)
          const x = img.width - margin;
          const y = img.height - margin - (fontSize / 2); 
          
          // Text Position
          const textX = x;
          const textY = y;

          // Icon Position (Left of text)
          const iconX = textX - textWidth - iconSize - (fontSize * 0.4);
          const iconY = textY - (iconSize / 2);

          // Common Style
          ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
          ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
          ctx.lineWidth = iconSize * 0.08;

          // Draw Text
          ctx.fillText(text, textX, textY);

          // Draw Instagram Icon (Camera Glyph)
          // 1. Outer Rounded Rect
          const r = iconSize * 0.25; // corner radius
          ctx.beginPath();
          ctx.moveTo(iconX + r, iconY);
          ctx.lineTo(iconX + iconSize - r, iconY);
          ctx.quadraticCurveTo(iconX + iconSize, iconY, iconX + iconSize, iconY + r);
          ctx.lineTo(iconX + iconSize, iconY + iconSize - r);
          ctx.quadraticCurveTo(iconX + iconSize, iconY + iconSize, iconX + iconSize - r, iconY + iconSize);
          ctx.lineTo(iconX + r, iconY + iconSize);
          ctx.quadraticCurveTo(iconX, iconY + iconSize, iconX, iconY + iconSize - r);
          ctx.lineTo(iconX, iconY + r);
          ctx.quadraticCurveTo(iconX, iconY, iconX + r, iconY);
          ctx.stroke();

          // 2. Inner Circle
          ctx.beginPath();
          ctx.arc(iconX + iconSize/2, iconY + iconSize/2, iconSize * 0.25, 0, Math.PI * 2);
          ctx.stroke();

          // 3. Flash Dot (Top Right)
          ctx.beginPath();
          ctx.arc(iconX + iconSize * 0.8, iconY + iconSize * 0.2, iconSize * 0.06, 0, Math.PI * 2);
          ctx.fill();
          
          // Convert to download link
          const dataUrl = canvas.toDataURL('image/png');
          
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `figur-atolyesi-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      };
    }
  };

  if (appState === AppState.IDLE) {
    return (
      <div className="w-full h-full min-h-[300px] md:min-h-[400px] flex flex-col items-center justify-center rounded-xl border-2 border-slate-800 bg-slate-900/50 text-slate-500 p-8">
        <div className="p-6 bg-slate-800/50 rounded-full mb-6">
          <Box size={48} className="opacity-50" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Dönüştürmeye Hazır</h3>
        <p className="text-center max-w-sm">
          1/7 ölçekli koleksiyon figürüne dönüştürmek için soldan bir resim yükleyin.
        </p>
      </div>
    );
  }

  if (appState === AppState.GENERATING) {
    return (
      <div className="w-full h-full min-h-[300px] md:min-h-[400px] flex flex-col items-center justify-center rounded-xl border-2 border-indigo-500/30 bg-slate-900/50 p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-500/5 animate-pulse"></div>
        <Loader2 size={48} className="text-indigo-400 animate-spin mb-6 relative z-10" />
        <h3 className="text-xl font-semibold text-indigo-300 mb-2 relative z-10">Model Şekillendiriliyor...</h3>
        <p className="text-indigo-200/60 text-center max-w-sm relative z-10 animate-pulse">
          Gerçekçi dokular, akrilik taban ve paket tasarımı uygulanıyor...
        </p>
      </div>
    );
  }

  if (appState === AppState.ERROR) {
    return (
      <div className="w-full h-full min-h-[300px] md:min-h-[400px] flex flex-col items-center justify-center rounded-xl border-2 border-red-900/50 bg-red-950/20 text-red-200 p-8">
        <AlertCircle size={48} className="mb-4 text-red-400" />
        <h3 className="text-lg font-semibold mb-2">Oluşturma Başarısız</h3>
        <p className="text-center text-red-300/70 mb-6 max-w-sm">
          {resultText || "Yapay zeka modeliyle iletişim kurulurken beklenmeyen bir hata oluştu."}
        </p>
        <button
          onClick={onRetry}
          className="flex items-center space-x-2 px-6 py-2 bg-red-900/50 hover:bg-red-800 border border-red-700 rounded-lg transition-colors"
        >
          <RefreshCcw size={18} />
          <span>Tekrar Dene</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="relative flex-grow w-full min-h-[300px] md:min-h-[400px] rounded-xl border-2 border-indigo-500/50 bg-slate-900 overflow-hidden group shadow-2xl shadow-indigo-900/20 select-none">
        
        {resultImage ? (
          <div className="absolute inset-0 w-full h-full">
            
            {/* Result Image Only */}
            <img 
              src={resultImage} 
              alt="Generated" 
              className="absolute inset-0 w-full h-full object-contain bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-900"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500">
            <p>Görüntü verisi döndürülmedi.</p>
          </div>
        )}
        
        {/* Overlay Actions - Always visible */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent flex justify-center space-x-4 pointer-events-none">
           <button
            onClick={handleDownload}
            className="pointer-events-auto flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-lg shadow-indigo-900/50 transition-all hover:scale-105 active:scale-95 z-40"
          >
            <Download size={18} />
            <span>İndir</span>
          </button>
        </div>
      </div>
      
      {resultText && !resultImage && (
         <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700 text-sm text-slate-300">
            <span className="font-semibold text-indigo-400 block mb-1">Model Notu:</span>
            {resultText}
         </div>
      )}
    </div>
  );
};