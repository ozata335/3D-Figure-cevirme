import React, { useCallback, useState } from 'react';
import { Upload, X, ShieldCheck } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (file: File | null) => void;
  selectedImage: File | null;
  previewUrl: string | null;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, selectedImage, previewUrl, disabled }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        processFile(file);
      }
    }
  }, [disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    onImageSelected(file);
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageSelected(null);
  };

  return (
    <div className="w-full flex flex-col">
      <div
        className={`relative flex-grow flex flex-col items-center justify-center w-full min-h-[300px] md:min-h-[400px] rounded-xl border-2 border-dashed transition-all duration-300 overflow-hidden group
          ${dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('file-upload')?.click()}
      >
        {previewUrl ? (
          <>
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="absolute inset-0 w-full h-full object-contain p-4" 
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="text-white font-medium">Değiştirmek için tıklayın</p>
            </div>
            <button 
              onClick={clearImage}
              disabled={disabled}
              className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full shadow-lg transition-transform hover:scale-110 z-10"
            >
              <X size={20} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className={`p-4 rounded-full mb-4 ${dragActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700/50 text-slate-400'}`}>
              <Upload size={32} />
            </div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">
              Referans Fotoğraf Yükle
            </h3>
            <p className="text-sm text-slate-400 max-w-xs">
              Resmi buraya sürükleyin veya seçmek için tıklayın
            </p>
            <p className="text-xs text-slate-500 mt-4">
              JPG, PNG, WEBP desteklenir
            </p>
          </div>
        )}
        
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleChange}
          disabled={disabled}
        />
      </div>

      {/* Privacy Note */}
      <div className="mt-3 flex items-start space-x-2 px-2">
        <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-slate-400 leading-tight">
          <span className="text-slate-300 font-semibold">Güvenlik Notu:</span> Yüklediğiniz fotoğraflar sadece anlık işlem için kullanılır ve işlem bittikten sonra sistemden silinir. Asla kaydedilmez veya paylaşılmaz.
        </p>
      </div>
    </div>
  );
};
