import React, { useState, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ResultViewer } from './components/ResultViewer';
import { generateFigurineImage } from './services/geminiService';
import { AppState } from './types';
import { Wand2, Sparkles, Clock, RefreshCw, Timer, Info, Lightbulb, ArrowRight } from 'lucide-react';

const FIGURINE_PROMPT = `Create a 1/7 scale commercialized figurine of the characters in the picture, in a realistic style, in a real environment. The figurine is placed on a computer desk. The figurine has a round transparent acrylic base, with no text on the base. The content on the computer screen is a 3D modeling process of this figurine. Next to the computer screen is a toy packaging box, designed in a style reminiscent of high-quality collectible figures, printed with original artwork. The packaging features two-dimensional flat illustrations.`;

// Buraya örnek olarak göstermek istediğiniz görselin URL'sini koyabilirsiniz.
const EXAMPLE_IMAGE_URL = "/resim.webp";

const MAX_USAGE_LIMIT = 3;
const STORAGE_KEY = 'figur_atolyesi_usage_count';
const COOLDOWN_STORAGE_KEY = 'figur_atolyesi_cooldown_end';
const RESET_TIME_KEY = 'figur_atolyesi_reset_time';
const COOLDOWN_DURATION_MS = 30000; // 30 seconds
const RESET_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);

  const [usageCount, setUsageCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  // Cooldown State (30 sec between generations)
  const [cooldownEndTime, setCooldownEndTime] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(COOLDOWN_STORAGE_KEY);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  // Reset Countdown State (When limit reached)
  const [timeToReset, setTimeToReset] = useState<number>(0);

  // 6-Hour Reset Logic Check
  useEffect(() => {
    const checkResetTime = () => {
      const now = Date.now();
      const storedResetTime = localStorage.getItem(RESET_TIME_KEY);

      // If no reset time exists, set one for the future
      if (!storedResetTime) {
        const nextReset = now + RESET_DURATION_MS;
        localStorage.setItem(RESET_TIME_KEY, nextReset.toString());
        return;
      }

      // If current time is past the reset time
      if (now > parseInt(storedResetTime, 10)) {
        // Reset usage count
        setUsageCount(0);
        localStorage.setItem(STORAGE_KEY, '0');

        // Set next reset time (now + 6 hours)
        const nextReset = now + RESET_DURATION_MS;
        localStorage.setItem(RESET_TIME_KEY, nextReset.toString());
      }
    };

    checkResetTime();
  }, []);

  // Handle Cooldown Timer (Short term 30s)
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const remaining = Math.ceil((cooldownEndTime - now) / 1000);
      return remaining > 0 ? remaining : 0;
    };

    setCooldownSeconds(calculateTimeLeft());

    if (cooldownEndTime > Date.now()) {
      const interval = setInterval(() => {
        const remaining = calculateTimeLeft();
        setCooldownSeconds(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [cooldownEndTime]);

  // Handle Reset Countdown Timer (Long term 6h) - Only runs when limit reached
  useEffect(() => {
    if (usageCount >= MAX_USAGE_LIMIT) {
      const updateResetTimer = () => {
        const storedResetTime = localStorage.getItem(RESET_TIME_KEY);
        if (storedResetTime) {
          const diff = parseInt(storedResetTime, 10) - Date.now();
          setTimeToReset(Math.max(0, diff));
        }
      };

      updateResetTimer(); // Initial call
      const interval = setInterval(updateResetTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [usageCount]);

  // Format milliseconds to HH:MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Clean up object URL when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageSelect = (file: File | null) => {
    setSelectedImage(file);

    // Generate Preview URL immediately here
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    // Reset state if user changes image, but keep it IDLE unless we were already showing a result
    if (appState !== AppState.IDLE && file) {
      setAppState(AppState.IDLE);
      setResultImage(null);
      setResultText(null);
    }
  };

  const handleGenerate = async () => {
    if (usageCount >= MAX_USAGE_LIMIT) {
      // Normally disabled button prevents this, but just in case
      return;
    }

    // Cooldown Check
    if (Date.now() < cooldownEndTime) {
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

        // Increment Usage
        const newCount = usageCount + 1;
        setUsageCount(newCount);
        localStorage.setItem(STORAGE_KEY, newCount.toString());

        // Set Cooldown
        const nextCooldown = Date.now() + COOLDOWN_DURATION_MS;
        setCooldownEndTime(nextCooldown);
        localStorage.setItem(COOLDOWN_STORAGE_KEY, nextCooldown.toString());
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
  const isCooldownActive = cooldownSeconds > 0;
  const isLimitReached = usageCount >= MAX_USAGE_LIMIT;
  const isButtonDisabled = !selectedImage || appState === AppState.GENERATING || isCooldownActive || isLimitReached;

  // Custom Cooldown UI Component (Short wait)
  const CooldownTimerDisplay = () => {
    const percentage = (cooldownSeconds / (COOLDOWN_DURATION_MS / 1000)) * 100;

    return (
      <div className="w-full relative h-14 bg-slate-900 rounded-xl border border-amber-500/30 overflow-hidden flex items-center justify-center shadow-lg">
        <div
          className="absolute left-0 top-0 bottom-0 bg-amber-600/20 transition-all duration-1000 ease-linear"
          style={{ width: `${percentage}%` }}
        />
        <div className="relative z-10 flex items-center space-x-3 animate-pulse">
          <Clock size={24} className="text-amber-500" />
          <div className="flex flex-col items-start leading-none">
            <span className="text-xs text-amber-500/80 uppercase tracking-wider font-bold">Bir sonraki işlem için</span>
            <span className="text-xl font-bold text-amber-400 font-mono">Bekleyiniz: {cooldownSeconds}</span>
          </div>
        </div>
      </div>
    );
  };

  // Custom Reset Timer UI Component (Long wait when limit reached)
  const ResetTimerDisplay = ({ mobile = false }: { mobile?: boolean }) => {
    return (
      <div className={`w-full relative bg-red-950/30 rounded-xl border border-red-500/30 flex items-center justify-center text-red-200 ${mobile ? 'h-14' : 'p-4'}`}>
        <div className="flex items-center space-x-3">
          <Timer size={mobile ? 20 : 24} className="text-red-400" />
          <div className="flex flex-col items-start leading-none">
            <span className={`uppercase tracking-wider font-bold text-red-400/70 ${mobile ? 'text-[10px]' : 'text-xs'}`}>
              Yeni Haklar İçin Kalan Süre
            </span>
            <span className={`${mobile ? 'text-lg' : 'text-xl'} font-bold text-red-100 font-mono`}>
              {formatTime(timeToReset)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderButtonContent = () => {
    if (appState === AppState.GENERATING) {
      return (
        <>
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Oluşturuluyor...</span>
        </>
      );
    }

    return (
      <>
        <Wand2 size={20} />
        <span>Hemen 3D ye Çevir</span>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto p-4 md:p-8 pb-32 md:pb-8">

        {/* Header */}
        <header className="text-center mb-8 pt-4">
          <div className="inline-flex items-center justify-center space-x-3 mb-4">
            <div className="inline-flex items-center justify-center px-3 py-1 bg-indigo-500/10 rounded-full ring-1 ring-indigo-500/30">
              <Sparkles className="w-4 h-4 text-indigo-400 mr-2" />
              <span className="text-indigo-300 font-semibold tracking-wide uppercase text-xs">Yapay Zeka</span>
            </div>
            <div className="inline-flex items-center justify-center px-3 py-1 bg-emerald-500/10 rounded-full ring-1 ring-emerald-500/30">
              <span className="text-emerald-300 font-semibold tracking-wide uppercase text-xs">ÜCRETSİZ</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-indigo-200 to-slate-400 bg-clip-text text-transparent mb-4 drop-shadow-lg">
            Figür Atölyesi
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            <span className="text-indigo-400 font-medium">Ankara Çocuk Etkinlikler</span> takipçilerine özel, tamamen ücretsiz.
            <br className="hidden md:block" />
            Her 6 saatte bir yenilenen 3 kullanım hakkı ile fotoğraflarınızı figürlere dönüştürün.
          </p>
        </header>

        {/* Example Showcase Section */}
        <div className="w-full max-w-4xl mx-auto mb-12 bg-gradient-to-r from-slate-900/60 to-indigo-950/30 rounded-2xl border border-slate-800/60 overflow-hidden shadow-xl">
          <div className="flex flex-col md:flex-row items-center">
            {/* Text Info */}
            <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-white mb-3 flex items-center">
                <Wand2 className="w-5 h-5 text-indigo-400 mr-2" />
                Nasıl Görünecek?
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Yüklediğiniz fotoğrafları; tıpkı yandaki örnekte olduğu gibi, detaylı paket tasarımı, akrilik standı ve gerçekçi dokusuyla sanki bir mağaza vitrinindeymiş gibi 3D koleksiyon figürüne dönüştürüyoruz.
              </p>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start space-x-3">
                <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-amber-200 font-semibold text-xs uppercase tracking-wider mb-1">En İyi Sonuç İçin İpucu</h4>
                  <p className="text-xs text-amber-200/70 leading-relaxed">
                    <strong>Ayakta (boydan)</strong> çekilmiş ve <strong>arka planı sade/karışık olmayan</strong> fotoğraflar yüklediğinizde yapay zeka çok daha net ve estetik modeller üretir.
                  </p>
                </div>
              </div>
            </div>

            {/* Example Image */}
            <div className="w-full md:w-2/5 relative h-64 md:h-auto md:self-stretch bg-slate-900">
              <img
                src={EXAMPLE_IMAGE_URL}
                alt="Örnek Figür Çıktısı"
                className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
              />
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md border border-white/10 shadow-lg">
                ÖRNEK SONUÇ
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent md:bg-gradient-to-l"></div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">

          {/* Left Column: Input */}
          <div className="flex flex-col space-y-6">
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <span className="w-1 h-6 bg-indigo-500 rounded-full mr-3"></span>
                  Fotoğraf Yükle
                </h2>
                {selectedImage && (
                  <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20">
                    Seçildi
                  </span>
                )}
              </div>

              <ImageUploader
                onImageSelected={handleImageSelect}
                selectedImage={selectedImage}
                previewUrl={previewUrl}
                disabled={appState === AppState.GENERATING}
              />

              {/* Action Area (Desktop) */}
              <div className="hidden md:block mt-6">
                {/* Usage Limit Display */}
                <div className="mb-4 bg-slate-800/40 rounded-xl p-2 border border-slate-700/50">
                  <div className="flex items-center gap-4">
                    {/* Number Box */}
                    <div className={`
                            w-16 h-16 flex-shrink-0 rounded-lg flex flex-col items-center justify-center border shadow-inner transition-colors
                            ${remainingRights > 1
                        ? 'bg-slate-800 border-emerald-500/30 text-emerald-400'
                        : remainingRights === 1
                          ? 'bg-slate-800 border-amber-500/30 text-amber-400'
                          : 'bg-slate-800 border-red-500/30 text-red-400'}
                        `}>
                      <span className="text-3xl font-bold leading-none">{remainingRights}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider opacity-70 mt-1">Kalan</span>
                    </div>

                    {/* Text Details */}
                    <div className="flex-grow">
                      <h4 className="text-sm font-semibold text-slate-200 mb-1">Kullanım Hakkınız</h4>
                      <div className="flex space-x-1 mb-2">
                        {[...Array(MAX_USAGE_LIMIT)].map((_, i) => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < remainingRights ? (remainingRights > 1 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-slate-700'}`} />
                        ))}
                      </div>
                      <div className="flex items-center text-[11px] text-slate-400">
                        <RefreshCw size={12} className="mr-1.5 text-indigo-400" />
                        <span>Haklarınız her 6 saatte bir yenilenir</span>
                      </div>
                    </div>
                  </div>
                </div>

                {isLimitReached ? (
                  <ResetTimerDisplay />
                ) : isCooldownActive ? (
                  <CooldownTimerDisplay />
                ) : (
                  <button
                    onClick={handleGenerate}
                    disabled={isButtonDisabled}
                    className={`
                        w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all transform duration-200
                        flex items-center justify-center space-x-3
                        ${isButtonDisabled
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-[1.02] hover:shadow-indigo-500/25 active:scale-95'}
                        `}
                  >
                    {renderButtonContent()}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Result */}
          <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between md:hidden mb-2">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <span className="w-1 h-6 bg-indigo-500 rounded-full mr-3"></span>
                3D Çıktı
              </h2>
            </div>

            {/* Result Component */}
            <ResultViewer
              appState={appState}
              resultImage={resultImage}
              resultText={resultText}
              onRetry={() => setAppState(AppState.IDLE)}
            />
          </div>

        </div>
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 p-4 z-50 safe-area-pb">
        {isLimitReached ? (
          <ResetTimerDisplay mobile />
        ) : isCooldownActive ? (
          <CooldownTimerDisplay />
        ) : (
          <div className="flex items-center gap-3">
            {/* Compact Usage Counter for Mobile */}
            <div className={`flex flex-col items-center justify-center rounded-lg px-3 py-1 border min-w-[60px]
                    ${remainingRights > 0 ? 'bg-slate-800 border-slate-700' : 'bg-red-900/20 border-red-900/50'}
                `}>
              <span className={`text-xl font-bold ${remainingRights > 0 ? 'text-white' : 'text-red-400'}`}>{remainingRights}</span>
              <span className="text-[9px] text-slate-400 uppercase">Hak</span>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isButtonDisabled}
              className={`
                        flex-grow py-3 px-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center space-x-2
                        ${isButtonDisabled
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white active:scale-95'}
                    `}
            >
              {!selectedImage ? (
                <span className="animate-pulse">👆 Önce Fotoğraf Seçin</span>
              ) : renderButtonContent()}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;