import React, { useCallback, useState } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { DiaryDatePicker } from '../components/DiaryDatePicker';
import { ProfileView, SettingsView } from '../components/AccountViews';
import { WorkspaceSection } from '../components/workspace-navigation';
import { PwaInstallModal } from '../components/PwaInstallModal';
import { PwaUpdatePrompt } from '../components/PwaUpdatePrompt';
import { DailyTrackerView } from '../components/DailyTrackerView';
import { FoodGuideView } from '../features/food-guide/FoodGuideView';
import { ProductsView } from '../components/ProductsView';
import { NutritionPlanView } from '../components/NutritionPlanView';
import { CalculatorView } from '../components/CalculatorView';
import { ProfileSetup } from '../components/ProfileSetup';
import { useMacroStore } from '../hooks/useMacroStore';
import { usePwaInstall } from '../hooks/usePwaInstall';
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
      <PwaUpdatePrompt />
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
  const [activeTab, setActiveTab] = useState<WorkspaceSection>('tracker');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const navigate = (section: WorkspaceSection) => {
    setActiveTab(section);
    setSidebarOpen(false);
  };
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
    classifyProduct,
    classifyMealEquivalence,
    suggestEquivalences,
    saveProfileAndGoals,
    addMealEntry,
    addMultipleMealEntries,
    removeMealEntry,
    updateMealQuantity,
    addWater,
    resetWater,
    addCustomFood,
    customFoods,
    saveProduct,
    saveProductEquivalence,
    suggestProductEquivalence,
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
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      <a
        href="#workspace-content"
        className="sr-only z-50 rounded-lg bg-emerald-400 p-3 text-slate-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Saltar al contenido
      </a>
      <Sidebar
        activeSection={activeTab}
        onNavigate={navigate}
        open={sidebarOpen}
        onClose={closeSidebar}
        isStandalone={isStandalone}
        canInstall={canInstall}
        onInstall={() => {
          closeSidebar();
          handleOpenInstall();
        }}
      />
      <div className="min-w-0 lg:ml-64">
        <Header
          section={activeTab}
          user={user}
          sidebarOpen={sidebarOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenProfile={() => navigate('profile')}
          onLogout={onLogout}
        />
        <main
          id="workspace-content"
          className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-7 sm:py-8"
        >
          {(activeTab === 'tracker' || activeTab === 'food-guide') && (
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {activeTab === 'food-guide'
                    ? '¿Qué puedo comer?'
                    : 'Tu diario'}
                </h2>
                <p className="mt-1.5 text-sm text-slate-400">
                  {activeTab === 'food-guide'
                    ? 'Dos análisis para comparar tus próximas opciones de comida.'
                    : 'Tus comidas, tus metas y tu progreso diario.'}
                </p>
              </div>
              <DiaryDatePicker
                date={selectedDate}
                onChange={setSelectedDate}
                disabled={saving}
              />
            </div>
          )}
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
                    Hay registros locales de la versión anterior disponibles
                    para importar.
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
                        para el diario. Los días y las metas que ya existan en
                        el servidor no se reemplazan.
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
                  plan={nutritionPlan}
                  onSaveEquivalence={saveProductEquivalence}
                  onSuggestEquivalence={suggestProductEquivalence}
                  onDelete={deleteProduct}
                  onOpenPlan={() => setActiveTab('plan')}
                />
              ) : activeTab === 'profile' ? (
                <ProfileView
                  user={user}
                  profile={profile}
                  goals={goals}
                  onEdit={() => navigate('calculator')}
                />
              ) : activeTab === 'settings' ? (
                <SettingsView
                  onNavigate={navigate}
                  canInstall={canInstall}
                  isStandalone={isStandalone}
                  onInstall={handleOpenInstall}
                />
              ) : !profile || !goals ? (
                <ProfileSetup
                  userName={user.name}
                  onSave={saveProfileAndGoals}
                />
              ) : activeTab === 'plan' ? (
                <NutritionPlanView
                  key={nutritionPlan?.version ?? 'new'}
                  plan={nutritionPlan}
                  foods={allFoods}
                  onSave={saveNutritionPlan}
                  onGoToTracker={() => setActiveTab('tracker')}
                />
              ) : activeTab === 'food-guide' ? (
                <FoodGuideView
                  key={selectedDate}
                  date={selectedDate}
                  goals={goals}
                  meals={dailyLog.meals}
                  foods={allFoods}
                  plan={dayPlan}
                  onOpenPlan={() => navigate('plan')}
                  onOpenProducts={() => navigate('products')}
                  onOpenDiary={() => navigate('tracker')}
                  onAddMeal={addMealEntry}
                />
              ) : activeTab === 'tracker' ? (
                <DailyTrackerView
                  key={selectedDate}
                  onOpenFoodGuide={() => navigate('food-guide')}
                  goals={goals}
                  meals={dailyLog.meals}
                  consumedTotals={consumedTotals}
                  nutritionPlan={dayPlan}
                  portionSummary={portionSummary}
                  onClassifyMeal={classifyMeal}
                  catalogPlan={nutritionPlan}
                  products={customFoods}
                  onClassifyProduct={classifyProduct}
                  onClassifyMealEquivalence={classifyMealEquivalence}
                  onSuggestEquivalences={suggestEquivalences}
                  onOpenProducts={() => navigate('products')}
                  onOpenPlan={() => setActiveTab('plan')}
                  waterIntakeMl={dailyLog.waterIntakeMl || 0}
                  allFoods={allFoods}
                  allTemplates={allTemplates}
                  onAddMealEntry={addMealEntry}
                  onAddMultipleMealEntries={addMultipleMealEntries}
                  onRemoveMealEntry={removeMealEntry}
                  onUpdateMealQuantity={updateMealQuantity}
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
      </div>

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
    </div>
  );
}

export default App;
