import React, { useState, useMemo } from 'react';
import { X, Search, PlusCircle, Check, Sparkles } from 'lucide-react';
import { FoodItem, MealType } from '../types/nutrition';

interface FoodSelectorModalProps {
  isOpen: boolean;
  mealType: MealType | null;
  foods: FoodItem[];
  onClose: () => void;
  onAddFood: (mealType: MealType, food: FoodItem, amountGrams: number) => void;
  onOpenCreateCustom: () => void;
}

export const FoodSelectorModal: React.FC<FoodSelectorModalProps> = ({
  isOpen,
  mealType,
  foods,
  onClose,
  onAddFood,
  onOpenCreateCustom,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [portionGrams, setPortionGrams] = useState<number>(100);

  // Filter foods
  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' ||
        (selectedCategory === 'custom' ? food.isCustom : food.category === selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [foods, searchTerm, selectedCategory]);

  if (!isOpen || !mealType) return null;

  const mealLabels: Record<MealType, string> = {
    breakfast: 'Desayuno',
    lunch: 'Almuerzo',
    dinner: 'Cena',
    snacks: 'Snacks / Colaciones',
  };

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setPortionGrams(food.servingSizeGrams || 100);
  };

  const handleConfirmAdd = () => {
    if (!selectedFood || portionGrams <= 0) return;
    onAddFood(mealType, selectedFood, portionGrams);
    onClose();
    setSelectedFood(null);
  };

  // Preview macros based on current portionGrams
  const previewRatio = selectedFood ? portionGrams / selectedFood.servingSizeGrams : 1;
  const previewCalories = selectedFood ? Math.round(selectedFood.calories * previewRatio) : 0;
  const previewProtein = selectedFood ? (selectedFood.protein * previewRatio).toFixed(1) : '0';
  const previewCarbs = selectedFood ? (selectedFood.carbs * previewRatio).toFixed(1) : '0';
  const previewFat = selectedFood ? (selectedFood.fat * previewRatio).toFixed(1) : '0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">
              Agregar a <span className="text-emerald-400">{mealLabels[mealType]}</span>
            </h3>
            <p className="text-xs text-slate-400">Selecciona un alimento de la base o ajusta la porción</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Categories */}
        <div className="p-4 border-b border-slate-800/80 space-y-3 bg-slate-950/40">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar pollo, arroz, avena, huevo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Category Badges */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'protein', label: 'Proteínas' },
              { id: 'carbs', label: 'Carbohidratos' },
              { id: 'fats', label: 'Grasas' },
              { id: 'fruits_veggies', label: 'Frutas/Verduras' },
              { id: 'dairy', label: 'Lácteos' },
              { id: 'custom', label: '⭐ Mis Alimentos' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Foods List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredFoods.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <p>No se encontraron alimentos con "{searchTerm}".</p>
              <button
                onClick={onOpenCreateCustom}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/20 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Crear este alimento personalizado</span>
              </button>
            </div>
          ) : (
            filteredFoods.map((food) => {
              const isSelected = selectedFood?.id === food.id;
              return (
                <div
                  key={food.id}
                  onClick={() => handleSelectFood(food)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500'
                      : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{food.name}</span>
                      {food.isCustom && (
                        <span className="text-[10px] px-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Personalizado
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Base {food.servingUnit} • {food.calories} kcal
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-mono">
                      <span className="text-emerald-400">P: {food.protein}g</span>
                      <span>•</span>
                      <span className="text-amber-400">C: {food.carbs}g</span>
                      <span>•</span>
                      <span className="text-rose-400">G: {food.fat}g</span>
                    </div>
                  </div>

                  <div className="flex items-center">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 font-semibold">Elegir</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Portion Adjuster and Action footer */}
        {selectedFood ? (
          <div className="p-4 border-t border-slate-800 bg-slate-950/90 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Ajustar gramos a consumir:</span>
              <div className="flex items-center gap-1.5">
                {[50, 100, 150, 200].map((grams) => (
                  <button
                    key={grams}
                    onClick={() => setPortionGrams(grams)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                      portionGrams === grams
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {grams}g
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="1"
                  max="2000"
                  value={portionGrams}
                  onChange={(e) => setPortionGrams(Math.max(1, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500">gramos</span>
              </div>

              {/* Dynamic Preview Pill */}
              <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-right">
                <div className="text-sm font-extrabold text-white leading-none">{previewCalories} kcal</div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  P:{previewProtein}g • C:{previewCarbs}g • G:{previewFat}g
                </div>
              </div>
            </div>

            <button
              onClick={handleConfirmAdd}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition shadow-md shadow-emerald-500/20 active:scale-[0.98]"
            >
              Registrar {portionGrams}g ({previewCalories} kcal) en {mealLabels[mealType]}
            </button>
          </div>
        ) : (
          <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">¿No encuentras lo que buscas?</span>
            <button
              onClick={onOpenCreateCustom}
              className="flex items-center gap-1.5 text-emerald-400 font-semibold hover:underline"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Crear Alimento Personalizado</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
