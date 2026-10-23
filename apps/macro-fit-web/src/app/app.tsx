import React, { useState } from 'react';
import { Header } from '../components/Header';
import { PwaInstallBanner } from '../components/PwaInstallBanner';
import { PwaInstallModal } from '../components/PwaInstallModal';
import { DailyTrackerView } from '../components/DailyTrackerView';
import { ProductsView } from '../components/ProductsView';
import { NutritionPlanView } from '../components/NutritionPlanView';
import { CalculatorView } from '../components/CalculatorView';
import { ProfileSetup } from '../components/ProfileSetup';
import { useMacroStore } from '../hooks/useMacroStore';
import { usePwaInstall } from '../hooks/usePwaInstall';
import {
  BookOpen,
  Calculator,
  Download,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '../features/auth/auth-context';
import { CurrentUser } from '../features/auth/auth-session';
import { canImportLegacy } from '../features/auth/account-storage';
import { LoginPage } from '../pages/LoginPage';

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<RequireSession />} />
      </Routes>
    </AuthProvider>
  );
}

function RequireSession() {
  const auth = useAuth();
  const location = useLocation();
  if (auth.status === 'checking')
    return (
      <div
        role="status"
        className="min-h-dvh grid place-items-center text-slate-300"
      >
        Validando sesión…
      </div>
    );
  if (auth.status === 'unavailable')
    return (
      <main className="min-h-dvh grid place-items-center p-6">
        <div role="alert" className="max-w-sm space-y-4 text-center">
          <p>{auth.error}</p>
          <button
            onClick={auth.retry}
            className="rounded-xl bg-emerald-400 p-3 text-slate-950 font-semibold"
          >
            Reintentar conexión
          </button>
          <button
            onClick={auth.logout}
            className="block w-full text-sm text-slate-400"
          >
            Volver al login
          </button>
        </div>
      </main>
    );
  if (!auth.user || auth.status !== 'authenticated')
    return (
      <Navigate
        replace
        to={`/login?redirect=${encodeURIComponent(
          location.pathname + location.search + location.hash
        )}`}
      />
    );
  return (
    <MacroFitWorkspace
      key={auth.token}
      user={auth.user}
      onLogout={auth.logout}
    />
  );
}

export function MacroFitWorkspace({
  user,
  onLogout,
}: {
  user: CurrentUser;
  onLogout: () => void;
}) {
  const [activeTab, setActiveTab] = useState<
    'tracker' | 'calculator' | 'plan' | 'products'
  >('tracker');
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const {
    profile,
    goals,
    allFoods,
    allTemplates,
    selectedDate,
    setSelectedDate,
    dailyLog,
    consumedTotals,
    nutritionPlan,
    dayPlan,
    portionSummary,
    saveNutritionPlan,
    classifyMeal,
    saveProfileAndGoals,
    addMealEntry,
    addMultipleMealEntries,
    removeMealEntry,
    addWater,
    resetWater,
    addCustomFood,
    customFoods,
    saveProduct,
    deleteProduct,
    applyMealTemplate,
    saveMealAsTemplate,
    loading,
    saving,
    error,
    reload,
    legacyImported,
    importLegacy,
  } = useMacroStore(user.userId);

  const [legacyAvailable] = useState(() => canImportLegacy(user.userId));
  const [showImport, setShowImport] = useState(false);

  const {
    canInstall,
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
        setSelectedDate={(date) => {
          if (!saving) setSelectedDate(date);
        }}
        canInstall={canInstall}
        isStandalone={isStandalone}
        onOpenInstall={handleOpenInstall}
        userName={user.name}
        onLogout={onLogout}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200"
          >
            <p>{error}</p>
            <button
              onClick={reload}
              disabled={saving}
              className="mt-2 font-bold underline"
            >
              Actualizar registros
            </button>
          </div>
        )}
        {saving && (
          <p role="status" className="mb-3 text-sm text-emerald-300">
            Guardando en tu cuenta…
          </p>
        )}
        {loading && !error ? (
          <p role="status">Cargando tus registros…</p>
        ) : !dailyLog ? null : (
          <fieldset disabled={saving} className="min-w-0">
            {legacyAvailable && !legacyImported && (
              <section className="mb-5 rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-300">
                <p>
                  Hay registros locales de la versión anterior disponibles para
                  importar.
                </p>
                {!showImport ? (
                  <button
                    onClick={() => setShowImport(true)}
                    className="mt-2 font-semibold text-emerald-300"
                  >
                    Revisar importación de mis datos anteriores
                  </button>
                ) : (
                  <div className="mt-3 space-y-3">
                    <p>
                      Confirma que esos registros son tuyos para asociarlos a{' '}
                      {user.email}. Se guardarán en tu cuenta. La copia local
                      anterior se conserva como respaldo y deja de utilizarse
                      para el diario. Los días y las metas que ya existan en el
                      servidor no se reemplazan.
                    </p>
                    <p>
                      El perfil predeterminado y las comidas de ejemplo no se
                      importan. En los días que tenían ejemplos, el agua se
                      reinicia a cero porque antes también venía precargada.
                    </p>
                    <button
                      onClick={importLegacy}
                      className="rounded-lg bg-emerald-400 px-3 py-2 font-semibold text-slate-950"
                    >
                      Son mis datos, importar a esta cuenta
                    </button>
                    <button
                      onClick={() => setShowImport(false)}
                      className="ml-3 text-slate-400"
                    >
                      Ahora no
                    </button>
                  </div>
                )}
              </section>
            )}
            {activeTab === 'products' ? (
              <ProductsView
                foods={customFoods}
                onSave={saveProduct}
                onDelete={deleteProduct}
                onOpenPlan={() => setActiveTab('plan')}
              />
            ) : !profile || !goals ? (
              <ProfileSetup userName={user.name} onSave={saveProfileAndGoals} />
            ) : activeTab === 'plan' ? (
              <NutritionPlanView
                key={nutritionPlan?.version ?? 'new'}
                plan={nutritionPlan}
                foods={allFoods}
                onSave={saveNutritionPlan}
                onGoToTracker={() => setActiveTab('tracker')}
              />
            ) : activeTab === 'tracker' ? (
              <DailyTrackerView
                goals={goals}
                meals={dailyLog.meals}
                consumedTotals={consumedTotals}
                nutritionPlan={dayPlan}
                portionSummary={portionSummary}
                onClassifyMeal={classifyMeal}
                onOpenPlan={() => setActiveTab('plan')}
                waterIntakeMl={dailyLog.waterIntakeMl || 0}
                allFoods={allFoods}
                allTemplates={allTemplates}
                onAddMealEntry={addMealEntry}
                onAddMultipleMealEntries={addMultipleMealEntries}
                onRemoveMealEntry={removeMealEntry}
                onAddWater={addWater}
                onResetWater={resetWater}
                onSaveCustomFood={addCustomFood}
                onApplyTemplate={applyMealTemplate}
                onSaveCurrentAsTemplate={saveMealAsTemplate}
                onOpenCalculator={() => setActiveTab('calculator')}
              />
            ) : (
              <CalculatorView
                initialProfile={profile}
                initialPreset={goals.distributionPreset}
                onApplyPlan={saveProfileAndGoals}
                onGoToTracker={() => setActiveTab('tracker')}
              />
            )}
          </fieldset>
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
            activeTab === 'tracker'
              ? 'text-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span>Diario</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition ${
            activeTab === 'calculator'
              ? 'text-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calculator className="w-5 h-5" />
          <span>Calculadora</span>
        </button>

        <button
          onClick={() => setActiveTab('plan')}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold ${
            activeTab === 'plan' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Mi pauta</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold ${
            activeTab === 'products' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <Package className="w-5 h-5" />
          <span>Productos</span>
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
