import React from 'react';
import { Download, Sparkles, Smartphone, CheckCircle2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getTodayDateString } from '../hooks/useMacroStore';

interface HeaderProps {
  activeTab: 'tracker' | 'calculator';
  setActiveTab: (tab: 'tracker' | 'calculator') => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  canInstall: boolean;
  isStandalone: boolean;
  onOpenInstall: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedDate,
  setSelectedDate,
  canInstall,
  isStandalone,
  onOpenInstall,
}) => {
  const todayStr = getTodayDateString();
  const isToday = selectedDate === todayStr;

  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${yr}-${mo}-${day}`);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${yr}-${mo}-${day}`);
  };

  const formattedDate = new Intl.DateTimeFormat('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(selectedDate + 'T12:00:00'));

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-[#090d16]/85 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-indigo-500 p-[1.5px] shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
                <span className="font-extrabold text-base bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  M
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-lg tracking-tight text-white leading-none">
                  Macro<span className="text-emerald-400">Fit</span>
                </h1>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none mt-1">
                Calculadora & Contador Diario
              </p>
            </div>
          </div>

          {/* Mobile Install button (visible on mobile next to brand) */}
          <div className="sm:hidden flex items-center gap-1.5">
            {canInstall && (
              <button
                onClick={onOpenInstall}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar</span>
              </button>
            )}
            {isStandalone && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-500/30 px-2 py-1 rounded-md">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                App
              </span>
            )}
          </div>
        </div>

        {/* Date Selector (Only in Tracker Tab) */}
        {activeTab === 'tracker' && (
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-2 py-1 shadow-inner">
            <button
              onClick={handlePrevDay}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Día anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold capitalize text-slate-200">
                {isToday ? `Hoy (${formattedDate})` : formattedDate}
              </span>
            </div>
            <button
              onClick={handleNextDay}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Día siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {!isToday && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="text-[11px] font-medium text-emerald-400 hover:underline px-1 ml-1"
              >
                Hoy
              </button>
            )}
          </div>
        )}

        {/* Navigation Tabs & Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('tracker')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'tracker'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Diario de Macros
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'calculator'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Calculadora TDEE
            </button>
          </div>

          {/* Desktop Install Button */}
          <div className="hidden sm:flex items-center gap-2">
            {canInstall && (
              <button
                onClick={onOpenInstall}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Instalar App</span>
              </button>
            )}
            {isStandalone && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1.5 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Modo App PWA</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
