import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  X,
  Upload,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle,
  AlertCircle,
  Utensils,
  Maximize2,
} from 'lucide-react';
import { MealType, PlateAnalysisResponse } from '../types/nutrition';
import { analyzePlateImage } from '../utils/plateAnalysisApi';

interface PlateCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMealType?: MealType;
  onAnalysisSuccess: (
    analysis: PlateAnalysisResponse,
    imageUrl: string,
    targetMeal: MealType
  ) => void;
}

export const PlateCameraModal: React.FC<PlateCameraModalProps> = ({
  isOpen,
  onClose,
  defaultMealType = 'lunch',
  onAnalysisSuccess,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const [targetMeal, setTargetMeal] = useState<MealType>(defaultMealType);
  const [plateType, setPlateType] = useState<'plato_extendido' | 'plato_hondo' | 'bowl'>('plato_extendido');
  const [userHints, setUserHints] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultMealType) {
      setTargetMeal(defaultMealType);
    }
  }, [defaultMealType]);

  // Start Camera Stream
  const startCamera = async (mode: 'environment' | 'user') => {
    setCameraError(null);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La cámara no está soportada en este navegador. Usa la opción de subir foto.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError('No se pudo acceder a la cámara directa. Puedes subir una foto desde tu galería o archivos.');
    }
  };

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera(facingMode);
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, capturedImage, facingMode]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedBlob(blob);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCapturedBlob(file);
    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedBlob(null);
    setAnalysisError(null);
    startCamera(facingMode);
  };

  const handleStartAnalysis = async () => {
    if (!capturedBlob) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await analyzePlateImage(capturedBlob, {
        hints: userHints.trim(),
        plateTypeHint: plateType,
      });

      setIsAnalyzing(false);
      onAnalysisSuccess(result, capturedImage || '', targetMeal);
      onClose();
    } catch (err: any) {
      setIsAnalyzing(false);
      setAnalysisError(
        err.message || 'Error al conectar con el servicio de análisis de plato. Intenta nuevamente.'
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Escanear Plato con IA</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Gemini Vision
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Identificación de ingredientes y estimación de gramaje
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport / Camera / Image Preview */}
        <div className="relative w-full aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
          {!capturedImage ? (
            <>
              {/* Live Video */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Guía Visual Overlay Requerida: Círculo punteado con mensaje de ángulo */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Dotted semi-transparent circular guide (standard 25cm plate) */}
                <div className="relative w-[72%] max-w-[320px] aspect-square rounded-full border-2 border-dashed border-emerald-400/80 shadow-[0_0_25px_rgba(52,211,153,0.3)] flex items-center justify-center animate-pulse">
                  {/* Subtle crosshair center mark */}
                  <div className="w-2 h-2 rounded-full bg-emerald-400/80" />
                  <div className="absolute top-2 text-[10px] tracking-widest uppercase font-mono text-emerald-300 font-semibold bg-black/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    25 cm Ø
                  </div>
                </div>

                {/* Instruction banner overlay */}
                <div className="absolute bottom-3 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-emerald-500/40 text-center max-w-[90%] shadow-lg">
                  <p className="text-xs font-medium text-emerald-300 flex items-center justify-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Centra el plato dentro del círculo a 45° o vista cenital</span>
                  </p>
                </div>
              </div>

              {/* Camera Switch button */}
              <button
                type="button"
                onClick={() =>
                  setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                }
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm border border-slate-700 transition shadow"
                title="Cambiar cámara"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {cameraError && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center">
                  <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
                  <p className="text-xs text-slate-300 max-w-sm mb-4">{cameraError}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Seleccionar Foto de la Galería</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedImage}
                alt="Plato capturado"
                className="w-full h-full object-contain"
              />

              {/* Scanner Radar Animation while Analyzing */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-6">
                  <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-ping" />
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-[2px] animate-spin">
                      <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                        <Sparkles className="w-7 h-7 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    Analizando plato con Gemini Vision...
                  </h3>
                  <p className="text-xs text-slate-400 text-center max-w-xs">
                    Descomponiendo ingredientes individuales y calculando densidad por 100g.
                  </p>
                </div>
              )}
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Configuration Controls (Meal target, Plate Type, User Hints) */}
        <div className="p-4 space-y-3.5 bg-slate-900 border-t border-slate-800 overflow-y-auto">
          {/* Destination Meal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Registrar en tiempo de comida:
              </label>
              <select
                value={targetMeal}
                onChange={(e) => setTargetMeal(e.target.value as MealType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="breakfast">🌅 Desayuno</option>
                <option value="colacion_am">🍏 Colación Mañana</option>
                <option value="lunch">☀️ Almuerzo</option>
                <option value="colacion_pm">🥪 Colación Tarde</option>
                <option value="dinner">🌙 Cena</option>
                <option value="snacks">🍎 Snacks / Libre</option>
              </select>
            </div>

            {/* Plate Type Pistas */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Tipo de plato / recipiente:
              </label>
              <select
                value={plateType}
                onChange={(e) => setPlateType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="plato_extendido">🍽️ Plato Extendido (25 cm est.)</option>
                <option value="plato_hondo">🍲 Plato Hondo</option>
                <option value="bowl">🥣 Bowl Pequeño</option>
              </select>
            </div>
          </div>

          {/* User Hints input */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1 flex items-center justify-between">
              <span>Pistas opcionales para la IA:</span>
              <span className="text-[10px] text-slate-500 font-normal">
                Ej: "lomo saltado sin freír", "pechuga a la plancha"
              </span>
            </label>
            <input
              type="text"
              value={userHints}
              onChange={(e) => setUserHints(e.target.value)}
              placeholder="Ingredientes clave o preparación (ej: sin aceite, con quinoa, cazuela...)"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {analysisError && (
            <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{analysisError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            {!capturedImage ? (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>Subir Foto</span>
                </button>
                <button
                  type="button"
                  onClick={handleCapture}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capturar Plato</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={isAnalyzing}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Repetir Foto</span>
                </button>
                <button
                  type="button"
                  onClick={handleStartAnalysis}
                  disabled={isAnalyzing}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>{isAnalyzing ? 'Analizando...' : 'Analizar Plato con IA'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
