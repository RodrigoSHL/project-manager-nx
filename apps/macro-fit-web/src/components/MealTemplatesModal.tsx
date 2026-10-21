import React, { useState } from 'react';
import { X, Sparkles, Zap, Plus, Check, Utensils, BookmarkPlus } from 'lucide-react';
import { FoodItem, MealEntry, MealTemplate, MealType } from '../types/nutrition';

interface MealTemplatesModalProps {
  isOpen: boolean;
  mealType: MealType | null;
  templates: MealTemplate[];
  allFoods: FoodItem[];
  currentMealEntries?: MealEntry[];
  onClose: () => void;
  onApplyTemplate: (template: MealTemplate, mealType?: MealType) => void;
  onSaveCurrentAsTemplate?: (name: string, description: string, mealType: MealType) => void;
}

export const MealTemplatesModal: React.FC<MealTemplatesModalProps> = ({
  isOpen,
  mealType,
  templates,
  allFoods,
  currentMealEntries = [],
  onClose,
  onApplyTemplate,
  onSaveCurrentAsTemplate,
}) => {
  const [selectedMealFilter, setSelectedMealFilter] = useState<string>(mealType || 'all');
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');

  if (!isOpen || !mealType) return null;

  const mealLabels: Record<MealType, string> = {
    breakfast: 'Comida 1: Desayuno',
    colacion_am: 'Colación Mañana',
    lunch: 'Comida 2: Almuerzo',
    colacion_pm: 'Colación Tarde',
    dinner: 'Comida 3: Cena',
    snacks: 'Snacks Extra',
  };

  const filteredTemplates = templates.filter((tpl) => {
    if (selectedMealFilter === 'all') return true;
    return tpl.mealType === selectedMealFilter;
  });

  // Calculate totals for a template
  const getTemplateTotals = (tpl: MealTemplate) => {
    return tpl.items.reduce(
      (acc, item) => {
        const food = allFoods.find((f) => f.id === item.foodId);
        if (!food) return acc;
        const ratio = item.amountGrams / food.servingSizeGrams;
        return {
          calories: acc.calories + Math.round(food.calories * ratio),
          protein: acc.protein + Number((food.protein * ratio).toFixed(1)),
          carbs: acc.carbs + Number((food.carbs * ratio).toFixed(1)),
          fat: acc.fat + Number((food.fat * ratio).toFixed(1)),
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const handleApply = (tpl: MealTemplate) => {
    onApplyTemplate(tpl, mealType);
    onClose();
  };

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim() || !onSaveCurrentAsTemplate) return;
    onSaveCurrentAsTemplate(newTemplateName.trim(), newTemplateDesc.trim(), mealType);
    setIsCreating(false);
    setNewTemplateName('');
    setNewTemplateDesc('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Combos y Comidas Habituales
              </h3>
              <p className="text-xs text-slate-400">
                Carga tu desayuno o almuerzo típico en <span className="text-emerald-400 font-semibold">{mealLabels[mealType]}</span> con 1 clic
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex gap-1.5 text-[11px]">
            <button
              onClick={() => setSelectedMealFilter(mealType)}
              className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                selectedMealFilter === mealType
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Para {mealLabels[mealType]}
            </button>
            <button
              onClick={() => setSelectedMealFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                selectedMealFilter === 'all'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Todos los Combos
            </button>
          </div>

          {currentMealEntries.length > 0 && onSaveCurrentAsTemplate && !isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:underline whitespace-nowrap"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Guardar actual como combo</span>
            </button>
          )}
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Create custom template form */}
          {isCreating && (
            <form onSubmit={handleSaveCurrent} className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 space-y-2.5 mb-3">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                <span>Guardar alimentos actuales como nuevo combo</span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="Nombre del combo (Ej: Mi Almuerzo Favorito)"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <input
                type="text"
                placeholder="Descripción opcional"
                value={newTemplateDesc}
                onChange={(e) => setNewTemplateDesc(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold"
                >
                  Guardar Combo
                </button>
              </div>
            </form>
          )}

          {/* Templates list */}
          {filteredTemplates.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No hay combos registrados para esta categoría.
            </div>
          ) : (
            filteredTemplates.map((tpl) => {
              const totals = getTemplateTotals(tpl);

              return (
                <div
                  key={tpl.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/50 transition flex flex-col justify-between gap-3 group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl select-none">{tpl.icon}</span>
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
                            {tpl.name}
                          </h4>
                          <span className="text-[10px] text-slate-400">{tpl.description}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-black text-white">{totals.calories} kcal</span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          P:{totals.protein.toFixed(0)}g • C:{totals.carbs.toFixed(0)}g • G:{totals.fat.toFixed(0)}g
                        </div>
                      </div>
                    </div>

                    {/* Items pills */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-900">
                      {tpl.items.map((item) => {
                        const food = allFoods.find((f) => f.id === item.foodId);
                        if (!food) return null;
                        return (
                          <span
                            key={item.foodId}
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300"
                          >
                            <span>{food.name}</span>
                            <span className="font-bold text-emerald-400 font-mono">({item.amountGrams}g)</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => handleApply(tpl)}
                    className="w-full py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cargar este combo a {mealLabels[mealType]}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
