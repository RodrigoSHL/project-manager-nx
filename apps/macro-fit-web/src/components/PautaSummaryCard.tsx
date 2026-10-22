import React, { useState } from 'react';
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Beef,
  Wheat,
  Droplets,
  Milk,
  Apple,
  Salad,
  CheckCircle,
  Lightbulb,
  ExternalLink,
  Info,
} from 'lucide-react';
import { PautaPortionsTarget } from '../types/nutrition';

interface PautaSummaryCardProps {
  targets: PautaPortionsTarget;
  consumed: {
    protein: number;
    carbs: number;
    fats: number;
    dairy: number;
    fruits: number;
  };
}

export const PautaSummaryCard: React.FC<PautaSummaryCardProps> = ({ targets, consumed }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const groups = [
    {
      id: 'protein',
      name: 'Proteínas',
      icon: Beef,
      color: 'emerald',
      bgBadge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      consumed: consumed.protein,
      target: targets.protein,
      unit: 'porciones',
      example: '50g pollo/carne = 1 | 1 scoop = 2 | 3 claras = 1',
    },
    {
      id: 'carbs',
      name: 'Carbohidratos',
      icon: Wheat,
      color: 'amber',
      bgBadge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      consumed: consumed.carbs,
      target: targets.carbs,
      unit: 'porciones',
      example: '¾ taza arroz/fideos = 1 | ½ taza avena = 1 | ½ marraqueta = 1',
    },
    {
      id: 'fats',
      name: 'Grasas',
      icon: Droplets,
      color: 'rose',
      bgBadge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      consumed: consumed.fats,
      target: targets.fats,
      unit: 'porciones',
      example: '4 cditas aceite oliva = 1 | 3 cdas palta = 1 | 24 almendras = 1',
    },
    {
      id: 'dairy',
      name: 'Lácteos',
      icon: Milk,
      color: 'blue',
      bgBadge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      consumed: consumed.dairy,
      target: targets.dairy,
      unit: 'porciones',
      example: '1 yogurt = 1 | 1 taza leche = 1 | 60g quesillo = 1',
    },
    {
      id: 'fruits',
      name: 'Frutas',
      icon: Apple,
      color: 'purple',
      bgBadge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      consumed: consumed.fruits,
      target: targets.fruits,
      unit: 'porciones',
      example: '1 manzana/pera = 1 | ½ plátano = 1 | 1 taza frutillas = 1',
    },
  ];

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-emerald-950/20 border border-emerald-500/30 p-4 sm:p-5 shadow-lg relative overflow-hidden">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white">Cumplimiento Pauta Clínica MEDS</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Nutricionista F. Fluxá
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Control diario por grupos de alimentos intercambiables
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-slate-200 transition self-start sm:self-auto"
        >
          <span>{isExpanded ? 'Ocultar Pauta & Tips' : 'Ver Pauta & Tips'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Grid de las 5 porciones de la Pauta */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-3.5">
        {groups.map((group) => {
          const Icon = group.icon;
          const pct = Math.min(100, Math.round((group.consumed / (group.target || 1)) * 100));
          const isComplete = group.consumed >= group.target;

          return (
            <div
              key={group.id}
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-200">{group.name}</span>
                  </div>
                  {isComplete && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                </div>

                <div className="flex items-baseline gap-1 my-1">
                  <span className="text-lg font-black text-white">{group.consumed.toFixed(1)}</span>
                  <span className="text-[11px] text-slate-400 font-semibold">/ {group.target} porc</span>
                </div>
              </div>

              <div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1.5">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 mt-1 truncate" title={group.example}>
                  {group.example}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Verduras Libre Notice */}
      <div className="mt-3 px-3 py-2 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Salad className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-300">Verduras y Hojas Verdes:</span>
          <span className="text-emerald-400 font-bold uppercase text-[11px]">Libre Consumo</span>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Lechuga, espinaca, apio, pepino, pimentón (comer al inicio)
        </span>
      </div>

      {/* Expanded Reference: Tabla 2 y Tips */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-4 animate-in fade-in duration-200">
          {/* Tabla 2: Distribución sugerida por tiempos de comida */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ejemplo de Distribución Diaria Recomendada (Tabla 2)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-1">1. Desayuno</span>
                <ul className="text-[11px] text-slate-300 space-y-0.5">
                  <li>• 1 Carbohidrato (½ tza avena)</li>
                  <li>• 2 Proteína (1 scoop whey)</li>
                  <li>• ½ Grasa (1.5 cda palta)</li>
                  <li>• 1 Lácteo (1 yogurt)</li>
                </ul>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="font-bold text-cyan-400 block mb-1">2. Colación AM</span>
                <ul className="text-[11px] text-slate-300 space-y-0.5">
                  <li>• 1 Fruta entera a elección</li>
                  <li>• 1 Lácteo (1 tza leche / yogurt)</li>
                </ul>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="font-bold text-amber-400 block mb-1">3. Almuerzo</span>
                <ul className="text-[11px] text-slate-300 space-y-0.5">
                  <li>• Verduras (libre)</li>
                  <li>• 4 Proteína (200g pollo)</li>
                  <li>• 1 Carbohidrato (¾ tza arroz)</li>
                  <li>• 1 Grasa (4 cditas aceite oliva)</li>
                  <li>• 1 Fruta entera</li>
                </ul>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="font-bold text-cyan-400 block mb-1">4. Colación PM</span>
                <ul className="text-[11px] text-slate-300 space-y-0.5">
                  <li>• 1 Fruta entera</li>
                  <li>• 1 Carbohidrato (½ tza avena)</li>
                  <li>• 1 Lácteo (1 yogurt proteico)</li>
                </ul>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="font-bold text-rose-400 block mb-1">5. Cena</span>
                <ul className="text-[11px] text-slate-300 space-y-0.5">
                  <li>• Verduras (libre)</li>
                  <li>• 4 Proteína (200g vacuno/pollo)</li>
                  <li>• 1 Carbohidrato (¾ tza fideos)</li>
                  <li>• ½ Grasa (2 cditas aceite)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Tips de la Nutricionista Fernanda Fluxá */}
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Tips Clave de la Pauta Alimentaria:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
              <p>
                🥗 <strong className="text-white">Control de glicemia:</strong> Inicia las comidas con verduras antes de los carbohidratos para evitar picos de azúcar y camina 10-15 min después de comer.
              </p>
              <p>
                🍎 <strong className="text-white">Fruta entera:</strong> Prefiere la fruta entera con piel en vez de jugos o triturados para conservar la fibra.
              </p>
              <p>
                ⏱️ <strong className="text-white">Saciedad:</strong> Come sin pantallas (sin celular ni TV) y tómate al menos 20 minutos por comida principal.
              </p>
              <p>
                ⚖️ <strong className="text-white">Pesaje en cocido:</strong> Las carnes, arroz, fideos y papas se pesan ya cocidos y listos para servir en el plato.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
