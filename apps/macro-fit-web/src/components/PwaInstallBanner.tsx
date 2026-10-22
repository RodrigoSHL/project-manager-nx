import React, { useState } from 'react';
import { Smartphone, X, Download } from 'lucide-react';

interface PwaInstallBannerProps {
  canInstall: boolean;
  onOpenInstall: () => void;
}

export const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({ canInstall, onOpenInstall }) => {
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-b border-emerald-500/20 px-4 py-2.5">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="text-slate-200">
            <span className="font-semibold text-white">¿Quieres instalar MacroFit en tu pantalla de inicio?</span>{' '}
            <span className="hidden sm:inline text-slate-400">Úsala a pantalla completa y sin gastar internet.</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenInstall}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-slate-400 hover:text-white transition rounded-md"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
