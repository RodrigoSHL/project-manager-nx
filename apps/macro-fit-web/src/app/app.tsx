import React, { useState } from 'react';
import { Header } from '../components/Header';
import { PwaInstallBanner } from '../components/PwaInstallBanner';
import { PwaInstallModal } from '../components/PwaInstallModal';
import { DailyTrackerView } from '../components/DailyTrackerView';
import { CalculatorView } from '../components/CalculatorView';
import { useMacroStore } from '../hooks/useMacroStore';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { BookOpen, Calculator, Download, CheckCircle2 } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'tracker' | 'calculator'>('tracker');
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const {
    profile,
    goals,
    allFoods,
    selectedDate,
    setSelectedDate,
    dailyLog,
    consumedTotals,
    consumedPortions,
    saveProfileAndGoals,
    addMealEntry,
    removeMealEntry,
    addWater,
    resetWater,
    addCustomFood,
  } = useMacroStore();

  const {
    canInstall,
    isInstalled,
    isStandalone,
    isIos,
    showIosGuide,
    setShowIosGuide,
    promptInstall,
  } = usePwaInstall();

  // Si showIosGuide se activa por el hook, abrimos el modal
  const handleOpenInstall = () => {
    setIsInstallModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-300 pb-16 sm:pb-8">
      {/* PWA Mobile Prompt Banner */}
      <PwaInstallBanner
        canInstall={canInstall}
        onOpenInstall={handleOpenInstall}
      />

      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        canInstall={canInstall}
        isStandalone={isStandalone}
        onOpenInstall={handleOpenInstall}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'tracker' ? (
          <DailyTrackerView
            goals={goals}
            meals={dailyLog.meals}
            consumedTotals={consumedTotals}
            consumedPortions={consumedPortions}
            waterIntakeMl={dailyLog.waterIntakeMl || 0}
            allFoods={allFoods}
            onAddMealEntry={addMealEntry}
            onRemoveMealEntry={removeMealEntry}
            onAddWater={addWater}
            onResetWater={resetWater}
            onSaveCustomFood={addCustomFood}
            onOpenCalculator={() => setActiveTab('calculator')}
          />
        ) : (
          <CalculatorView
            initialProfile={profile}
            initialPreset={goals.distributionPreset}
            onApplyPlan={(newProfile, newGoals) => {
              saveProfileAndGoals(newProfile, newGoals);
            }}
            onGoToTracker={() => setActiveTab('tracker')}
          />
        )}
      </main>

      {/* PWA Installation Modal (Android / iOS Safari Guide) */}
      <PwaInstallModal
        isOpen={isInstallModalOpen || showIosGuide}
        onClose={() => {
          setIsInstallModalOpen(false);
          setShowIosGuide(false);
        }}
        onPromptInstall={promptInstall}
        isIos={isIos}
        isStandalone={isStandalone}
      />

      {/* Mobile Bottom Tab Bar (App-like thumb navigation for mobile screens) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 border-t border-slate-800/80 backdrop-blur-lg px-6 py-2 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('tracker')}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition ${
            activeTab === 'tracker' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span>Diario</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition ${
            activeTab === 'calculator' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calculator className="w-5 h-5" />
          <span>Calculadora</span>
        </button>

        {canInstall && (
          <button
            onClick={handleOpenInstall}
            className="flex flex-col items-center gap-1 text-[11px] font-semibold text-emerald-400 transition animate-bounce-subtle"
          >
            <Download className="w-5 h-5" />
            <span>Instalar</span>
          </button>
        )}

        {isStandalone && (
          <div className="flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-500">
            <CheckCircle2 className="w-5 h-5 text-emerald-400/80" />
            <span>PWA Activa</span>
          </div>
        )}
      </nav>
    </div>
  );
}

export default App;
