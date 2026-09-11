import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { MapPinned, Users } from 'lucide-react';
import { AdminLayout } from '../layouts/admin-layout';
import { AppLayout } from '../layouts/app-layout';
import { AdminOverviewPage } from '../pages/admin-overview-page';
import { AdminAssetsPage } from '../pages/admin-assets-page';
import { AdminAssetTypesPage } from '../pages/admin-asset-types-page';
import { AdminWorkTypesPage } from '../pages/admin-work-types-page';
import { AdminConceptsPage } from '../pages/admin-concepts-page';
import { AdminPlaceholderPage } from '../pages/admin-placeholder-page';
import { AssetsPage } from '../pages/assets-page';
import { DashboardPage } from '../pages/dashboard-page';
import { FindingsPage } from '../pages/findings-page';
import { LoginPage } from '../pages/login-page';
import { WorksPage } from '../pages/works-page';
import { NewWorkPage } from '../pages/new-work-page';
import { WorkDetailPage } from '../pages/work-detail-page';
import { PlatformLayout } from '../layouts/platform-layout';
import { PlatformTenantsPage } from '../pages/platform-tenants-page';
import { useAuth } from '../features/auth/auth-context';
import {
  canAccessOperation,
  isGlobalAdmin,
} from '../features/auth/auth-storage';
import { Button } from '../components/ui/button';
import type { ReactNode } from 'react';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/platform/login"
        element={<Navigate to="/login?redirect=/platform/tenants" replace />}
      />

      <Route element={<RequireAuthentication />}>
        <Route element={<RequireOperationAccess />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/works" element={<WorksPage />} />
            <Route path="/works/new" element={<NewWorkPage />} />
            <Route path="/works/:id" element={<WorkDetailPage />} />
            <Route path="/findings" element={<FindingsPage />} />
            <Route element={<RequireGlobalAdmin />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverviewPage />} />
                <Route path="assets" element={<AdminAssetsPage />} />
                <Route path="asset-types" element={<AdminAssetTypesPage />} />
                <Route path="work-types" element={<AdminWorkTypesPage />} />
                <Route path="concepts" element={<AdminConceptsPage />} />
                <Route
                  path="sites"
                  element={
                    <AdminPlaceholderPage
                      title="Sitios y faenas"
                      description="Ubicaciones organizacionales de cada tenant."
                      icon={MapPinned}
                    />
                  }
                />
                <Route
                  path="users"
                  element={
                    <AdminPlaceholderPage
                      title="Usuarios y permisos"
                      description="Personas, roles y accesos del sistema."
                      icon={Users}
                    />
                  }
                />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route element={<RequireGlobalAdmin />}>
          <Route path="/platform" element={<PlatformLayout />}>
            <Route index element={<Navigate to="tenants" replace />} />
            <Route path="tenants" element={<PlatformTenantsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function RequireAuthentication() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === 'checking') {
    return <SessionMessage message="Verificando sesión…" />;
  }
  if (auth.status === 'unavailable') {
    return (
      <SessionMessage message="No pudimos validar tu sesión.">
        <Button onClick={auth.retry}>Reintentar</Button>
      </SessionMessage>
    );
  }
  if (auth.status !== 'authenticated') {
    const redirect = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirect)}`}
        replace
      />
    );
  }
  return <Outlet />;
}

function RequireOperationAccess() {
  const auth = useAuth();
  return canAccessOperation(auth.user) ? (
    <Outlet />
  ) : (
    <Navigate to="/login?reason=forbidden" replace />
  );
}

function RequireGlobalAdmin() {
  const auth = useAuth();
  return isGlobalAdmin(auth.user) ? (
    <Outlet />
  ) : (
    <Navigate to="/dashboard" replace />
  );
}

function SessionMessage({
  message,
  children,
}: {
  message: string;
  children?: ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <div className="space-y-4 text-center">
        <p className="text-sm font-medium text-slate-600">{message}</p>
        {children}
      </div>
    </main>
  );
}
