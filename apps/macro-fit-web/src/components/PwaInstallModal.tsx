import React from 'react';
import {
  X,
  Smartphone,
  Share2,
  PlusSquare,
  CheckCircle2,
  Zap,
  WifiOff,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPromptInstall: () => void;
  isIos: boolean;
  isStandalone: boolean;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  isOpen,
  onClose,
  onPromptInstall,
  isIos,
  isStandalone,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">
              Instalar MacroFit en tu Móvil
            </h3>
            <p className="text-xs text-slate-400">
              {isIos ? 'Optimizado para iPhone / iPad' : 'Aplicación Web Progresiva (PWA)'}
            </p>
          </div>
        </div>

        {/* App Advantages */}
        <div className="space-y-2.5 mb-6 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex items-start gap-2.5">
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 mt-0.5">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Acceso instantáneo desde pantalla de inicio</p>
              <p className="text-[11px] text-slate-400">Sin necesidad de entrar a la tienda de apps ni recordar la URL.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 mt-0.5">
              <WifiOff className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Funciona 100% Offline</p>
              <p className="text-[11px] text-slate-400">Registra tus comidas en el gimnasio o en el avión sin consumir datos.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="p-1 rounded-md bg-amber-500/10 text-amber-400 mt-0.5">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Experiencia nativa sin marcos</p>
              <p className="text-[11px] text-slate-400">Pantalla completa, fluida y con microinteracciones táctiles.</p>
            </div>
          </div>
        </div>

        {/* Instructions depending on platform */}
        {isIos ? (
          <div className="space-y-3 mb-6">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Pasos para instalar en iOS (Safari):
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">
                  1
                </div>
                <div className="flex items-center gap-1.5 text-slate-200">
                  <span>Toca el botón</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-700 text-white font-medium text-[11px]">
                    <Share2 className="w-3 h-3 text-cyan-400" /> Compartir
                  </span>
                  <span>en la barra inferior de Safari.</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">
                  2
                </div>
                <div className="flex items-center gap-1.5 text-slate-200">
                  <span>Desliza y selecciona</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-700 text-white font-medium text-[11px]">
                    <PlusSquare className="w-3 h-3 text-emerald-400" /> Agregar a pantalla de inicio
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">
                  3
                </div>
                <div className="flex items-center gap-1.5 text-slate-200">
                  <span>Confirma pulsando</span>
                  <span className="font-semibold text-emerald-400">"Agregar"</span>
                  <span>en la esquina superior derecha.</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
            >
              Entendido, gracias
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => {
                onPromptInstall();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 transition active:scale-[0.98]"
            >
              <Smartphone className="w-4 h-4 text-slate-950" />
              <span>Instalar MacroFit Ahora</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
            <p className="text-center text-[11px] text-slate-400">
              Se creará un acceso directo nativo en tu dispositivo con icono y caché offline.
            </p>
          </div>
        )}

        {isStandalone && (
          <div className="mt-4 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>¡Ya estás ejecutando MacroFit como App instalada!</span>
          </div>
        )}
      </div>
    </div>
  );
};
