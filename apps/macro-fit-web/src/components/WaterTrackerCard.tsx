import React from 'react';
import { Droplet, Plus, RotateCcw } from 'lucide-react';

interface WaterTrackerCardProps {
  currentMl: number;
  targetMl: number;
  isMinimum?: boolean;
  onAddWater: (ml: number) => void;
  onResetWater: () => void;
}

export const WaterTrackerCard: React.FC<WaterTrackerCardProps> = ({
  currentMl,
  targetMl,
  isMinimum = false,
  onAddWater,
  onResetWater,
}) => {
  const percent = Math.min(
    100,
    Math.round((currentMl / (targetMl || 2500)) * 100)
  );
  const remainingMl = Math.max(0, targetMl - currentMl);

  return (
    <section
      aria-label="Agua del día"
      className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-3 sm:p-4 shadow-sm"
    >
      <div className="flex items-center justify-between mb-1.5 sm:mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Droplet className="w-4 h-4 fill-cyan-400/30" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">
              Hidratación Diaria
            </h4>
            <span className="text-[10px] sm:text-[11px] text-slate-400">
              Meta seleccionada: {isMinimum ? '> ' : ''}
              {targetMl} ml
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right sm:hidden">
            <p className="text-base font-bold tabular-nums text-cyan-300">
              {(currentMl / 1000).toFixed(2)}{' '}
              <span className="text-xs font-normal">L</span>
            </p>
            <p className="text-[10px] text-slate-400">
              {remainingMl > 0
                ? `Faltan ${(remainingMl / 1000).toFixed(2)} L`
                : isMinimum && currentMl === targetMl
                ? 'Supera esta cantidad'
                : 'Meta completada'}
            </p>
          </div>
          <span className="hidden text-xs font-extrabold text-cyan-400 sm:inline">
            {percent}%
          </span>
          {currentMl > 0 && (
            <button
              onClick={onResetWater}
              className="grid size-10 place-items-center rounded text-slate-500 hover:text-slate-300 transition"
              title="Reiniciar agua de hoy"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="hidden items-baseline justify-between mb-2 sm:flex">
        <div className="text-lg sm:text-xl font-extrabold tabular-nums text-white">
          {(currentMl / 1000).toFixed(2)}{' '}
          <span className="text-xs text-slate-400 font-normal">L</span>
        </div>
        <div className="max-w-[65%] text-right text-[10px] sm:text-xs text-slate-400 font-medium">
          {remainingMl > 0
            ? `Faltan ${(remainingMl / 1000).toFixed(2)} L`
            : isMinimum && currentMl === targetMl
            ? 'La pauta indica superar esta cantidad'
            : 'Meta de agua completada'}
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className="w-full bg-slate-800 rounded-full h-1 sm:h-2.5 overflow-hidden mb-2 sm:mb-3"
        aria-hidden="true"
      >
        <div
          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Quick Add Buttons */}
      <div className="flex gap-2 text-xs">
        <button
          onClick={() => onAddWater(250)}
          className="min-h-10 flex-1 py-1.5 px-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/50 text-cyan-300 font-semibold flex items-center justify-center gap-1 transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>
            250 ml<span className="hidden sm:inline"> (Vaso)</span>
          </span>
        </button>
        <button
          onClick={() => onAddWater(500)}
          className="min-h-10 flex-1 py-1.5 px-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/50 text-cyan-300 font-semibold flex items-center justify-center gap-1 transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>
            500 ml<span className="hidden sm:inline"> (Botella)</span>
          </span>
        </button>
        <button
          onClick={() => onAddWater(750)}
          className="hidden min-h-10 sm:flex flex-1 py-1.5 px-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/50 text-cyan-300 font-semibold items-center justify-center gap-1 transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>750 ml (Shaker)</span>
        </button>
      </div>
    </section>
  );
};
