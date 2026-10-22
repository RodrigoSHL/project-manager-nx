import React, { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { FoodItem } from '../types/nutrition';

interface CustomFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveFood: (food: Omit<FoodItem, 'id' | 'isCustom'>) => void;
}

export const CustomFoodModal: React.FC<CustomFoodModalProps> = ({
  isOpen,
  onClose,
  onSaveFood,
}) => {
  const [name, setName] = useState('');
  const [servingSizeGrams, setServingSizeGrams] = useState<number>(100);
  const [protein, setProtein] = useState<number>(0);
  const [carbs, setCarbs] = useState<number>(0);
  const [fat, setFat] = useState<number>(0);
  const [category, setCategory] = useState<FoodItem['category']>('protein');

  if (!isOpen) return null;

  // Auto-calculated calories from macros (4 kcal/g protein, 4 kcal/g carbs, 9 kcal/g fat)
  const calculatedCalories = Math.round(protein * 4 + carbs * 4 + fat * 9);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveFood({
      name: name.trim(),
      servingUnit: `${servingSizeGrams}g`,
      servingSizeGrams,
      calories: calculatedCalories,
      protein: Number(protein),
      carbs: Number(carbs),
      fat: Number(fat),
      category,
    });

    onClose();
    setName('');
    setProtein(0);
    setCarbs(0);
    setFat(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl p-5 text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Nuevo Alimento Personalizado</h3>
            <p className="text-xs text-slate-400">Se guardará permanentemente en tu catálogo offline</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre del Alimento o Producto
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Pan de Masa Madre, Barra de Proteína..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Porción Base (g)
              </label>
              <input
                type="number"
                min="1"
                required
                value={servingSizeGrams}
                onChange={(e) => setServingSizeGrams(Math.max(1, Number(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Categoría Principal
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodItem['category'])}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="protein">Proteína</option>
                <option value="carbs">Carbohidratos</option>
                <option value="fats">Grasas</option>
                <option value="fruits_veggies">Frutas / Verduras</option>
                <option value="dairy">Lácteos</option>
                <option value="snacks">Snacks</option>
              </select>
            </div>
          </div>

          {/* Macros per serving */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Macronutrientes por porción ({servingSizeGrams}g):
            </span>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-emerald-400 mb-1">
                  Proteína (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={protein}
                  onChange={(e) => setProtein(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-400 mb-1">
                  Carbos (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={carbs}
                  onChange={(e) => setCarbs(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-rose-400 mb-1">
                  Grasa (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={fat}
                  onChange={(e) => setFat(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Auto calculated calories badge */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Calorías calculadas:</span>
              <span className="font-extrabold text-white bg-slate-800 px-2.5 py-1 rounded-md text-emerald-300 font-mono">
                {calculatedCalories} kcal
              </span>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Guardar Alimento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
