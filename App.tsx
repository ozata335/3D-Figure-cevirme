import React, { useState } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ResultViewer } from './components/ResultViewer';
import { generateFigurineImage } from './services/geminiService';
import { AppState } from './types';
import { Wand2, Sparkles, Info, Gift, AlertTriangle } from 'lucide-react';

const FIGURINE_PROMPT = `Create a 1/7 scale commercialized figurine of the characters in the picture, in a realistic style, in a real environment. The figurine is placed on a computer desk. The figurine has a round transparent acrylic base, with no text on the base. The content on the computer screen is a 3D modeling process of this figurine. Next to the computer screen is a toy packaging box, designed in a style reminiscent of high-quality collectible figures, printed with original artwork. The packaging features two-dimensional flat illustrations.`;

const MAX_USAGE_LIMIT = 3;
const STORAGE_KEY = 'figur_atolyesi_usage_count';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  
  const [usageCount, setUsageCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const handleImageSelect = (file: File | null) => {
    setSelectedImage(file);
    // Reset state if user changes image, but keep it IDLE unless we were already showing a result
    if (appState !== AppState.IDLE && file) {
       setAppState(AppState.IDLE);
       setResultImage(null);
       setResultText(null);
    }
  };

  const handleGenerate = async () => {
    if (usageCount >= MAX_USAGE_LIMIT) {
      setAppState(AppState.ERROR);
      setResultText("Üzgünüz, bu uygulama kişi başı en fazla 3 kez kullanılabilir. Hakkınız dolmuştur.");
      setResultImage(null);
      return;
    }

    if (!selectedImage) return;

    setAppState(AppState.GENERATING);
    setResultImage(null);
    setResultText(null);

    try {
      const result = await generateFigurineImage(selectedImage, FIGURINE_PROMPT);
      
      setResultImage(result.imageUrl || null);
      setResultText(result.text || null);

      if (result.imageUrl) {
        setAppState(AppState.SUCCESS);
        const newCount = usageCount + 1;
        setUsageCount(newCount);
        localStorage.setItem(STORAGE_KEY, newCount.toString());
      } else {
        setAppState(AppState.ERROR);
      }
    } catch (error: any) {
      console.error("Generation error", error);
      setResultText(error.message || "Unknown error occurred");
      setAppState(AppState.ERROR);
    }
  };

  const remainingRights = Math.max(0, MAX_USAGE_LIMIT - usageCount);
  const isButtonDisabled = !selectedImage || appState === AppState.GENERATING;

  const renderButtonContent = () => (
    appState === AppState.GENERATING ? (
      <>
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <span>Oluşturuluyor...</span>
      </>
    ) : (
      <>
        <Wand2 size={20} />
        <span>Hemen 3D ye Çevir</span>
      </>
    )
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Special Banner */}
      <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white shadow-lg relative z-50">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center space-x-2 text-sm md:text-base font-bold tracking-wide">
          <Gift size={18} className="animate-bounce" />
          <span>Ankara Çocuk Etkinlikler Takipçilerine Özel</span>
          <Gift size={18} className="animate-bounce" />
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg shadow-lg shadow-indigo-900/50">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Figür Atölyesi
            </h1>
          </div>
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-400">
             <span className="flex items-center space-x-1 hover:text-indigo-400 transition-colors cursor-help" title="Gemini 2.5 Kullanılıyor">
                <Info size={16} />
                <span>Gemini 2.5 ile güçlendirilmiştir</span>
             </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 pb-32 lg:pb-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Input */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-200 flex items-center space-x-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-xs border border-slate-700">1</span>
                <span>Kaynak Resim</span>
              </h2>
              {selectedImage && appState === AppState.IDLE && (
                 <span className="text-xs text-indigo-400 animate-pulse font-medium">Oluşturmaya hazır</span>
              )}
            </div>

            <div className="bg-slate-900 rounded-2xl p-1 border border-slate-800 shadow-xl">
              <ImageUploader 
                onImageSelected={handleImageSelect} 
                selectedImage={selectedImage} 
                disabled={appState === AppState.GENERATING}
              />
            </div>

            {/* Prompt Display (Read Only) */}
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/50">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Yapılandırma</h3>
              <p className="text-sm text-slate-400 leading-relaxed italic border-l-2 border-indigo-500/30 pl-3">
                "1/7 ölçekli ticarileştirilmiş figür oluştur... gerçekçi stil... bilgisayar masası üzerinde..."
              </p>
            </div>

            <div className="space-y-3">
              {/* Desktop Button - Hidden on mobile */}
              <button
                onClick={handleGenerate}
                disabled={isButtonDisabled}
                className={`hidden lg:flex w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 items-center justify-center space-x-2
                  ${isButtonDisabled
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98]'
                  }
                `}
              >
                {renderButtonContent()}
              </button>
              
              {/* Usage Limit Indicator */}
              <div className="mt-2">
                {remainingRights === 0 ? (
                   <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-xl flex items-center justify-center text-red-400 space-x-2">
                      <AlertTriangle size={20} />
                      <span className="font-bold text-lg">Kullanım hakkınız doldu</span>
                   </div>
                ) : (
                  <div className="relative overflow-hidden rounded-xl bg-slate-900 border border-slate-800 p-4 flex items-center justify-between group hover:border-indigo-500/30 transition-colors">
                     <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     
                     <div className="flex flex-col">
                        <span className="text-slate-400 text-sm font-medium">Kalan Kullanım Hakkı</span>
                        <span className="text-xs text-slate-500">Maksimum {MAX_USAGE_LIMIT} kez</span>
                     </div>

                     <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 border-2 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)] relative z-10">
                        <span className={`text-2xl font-black ${
                          remainingRights === 1 ? 'text-red-500' : 
                          remainingRights === 2 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {remainingRights}
                        </span>
                     </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-200 flex items-center space-x-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-xs border border-slate-700">2</span>
                <span>3D Çıktı</span>
              </h2>
              {appState === AppState.SUCCESS && (
                 <span className="px-2 py-1 rounded-md bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                   Tamamlandı
                 </span>
              )}
            </div>

            <div className="bg-slate-900 rounded-2xl p-1 border border-slate-800 shadow-xl min-h-[400px]">
               <ResultViewer 
                 appState={appState} 
                 resultImage={resultImage} 
                 resultText={resultText}
                 onRetry={() => setAppState(AppState.IDLE)}
               />
            </div>
            
            <div className="flex items-start space-x-3 text-xs text-slate-500 bg-slate-900/30 p-4 rounded-lg">
               <Info size={14} className="mt-0.5 flex-shrink-0" />
               <p>
                 Oluşturulan görüntü, yüklediğiniz fotoğrafın yapay zeka yorumudur. "Ticarileştirilmiş figür" estetiğine uyması için akrilik taban, ambalaj kutusu ve bilgisayar ekranı arka planı gibi detaylar otomatik olarak eklenir.
               </p>
            </div>
          </div>

        </div>
      </main>

      {/* Mobile Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 z-50 lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.5)] flex flex-col gap-2">
        {!selectedImage && (
            <div className="text-center text-xs text-indigo-400 font-medium animate-pulse mb-1 flex items-center justify-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span>Lütfen önce yukarıdan fotoğraf seçin</span>
            </div>
        )}
        <button
          onClick={handleGenerate}
          disabled={isButtonDisabled}
          className={`w-full py-3.5 px-6 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 flex items-center justify-center space-x-2
            ${isButtonDisabled
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-75'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-900/50 active:scale-[0.98]'
            }
          `}
        >
          {renderButtonContent()}
        </button>
      </div>

    </div>
  );
};

export default App;