import React from 'react';
import { Droplet, Plus, RotateCcw } from 'lucide-react';

interface WaterTrackerCardProps {
  currentMl: number;
  targetMl: number;
  onAddWater: (ml: number) => void;
  onResetWater: () => void;
}

export const WaterTrackerCard: React.FC<WaterTrackerCardProps> = ({
  currentMl,
  targetMl,
  onAddWater,
  onResetWater,
}) => {
  const percent = Math.min(100, Math.round((currentMl / (targetMl || 2500)) * 100));
  const remainingMl = Math.max(0, targetMl - currentMl);

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Droplet className="w-4 h-4 fill-cyan-400/30" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">Hidratación Diaria</h4>
            <span className="text-[11px] text-slate-400">Meta recomendada: {targetMl} ml</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-cyan-400">{percent}%</span>
          {currentMl > 0 && (
            <button
              onClick={onResetWater}
              className="p-1 rounded text-slate-500 hover:text-slate-300 transition"
              title="Reiniciar agua de hoy"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <div className="text-xl font-extrabold text-white">
          {(currentMl / 1000).toFixed(2)} <span className="text-xs text-slate-400 font-normal">Litros</span>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          {remainingMl > 0 ? `Faltan ${(remainingMl / 1000).toFixed(2)} L` : '¡Meta de agua completada! 💧'}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden mb-3">
        <div
          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Quick Add Buttons */}
      <div className="flex gap-2 text-xs">
        <button
          onClick={() => onAddWater(250)}
          className="flex-1 py-1.5 px-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/50 text-cyan-300 font-semibold flex items-center justify-center gap-1 transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>250 ml (Vaso)</span>
        </button>
        <button
          onClick={() => onAddWater(500)}
          className="flex-1 py-1.5 px-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/50 text-cyan-300 font-semibold flex items-center justify-center gap-1 transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>500 ml (Botella)</span>
        </button>
        <button
          onClick={() => onAddWater(750)}
          className="hidden sm:flex flex-1 py-1.5 px-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/50 text-cyan-300 font-semibold items-center justify-center gap-1 transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>750 ml (Shaker)</span>
        </button>
      </div>
    </div>
  );
};
