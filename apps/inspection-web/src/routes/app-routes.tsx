import { Navigate, Route, Routes } from 'react-router-dom';
import { MapPinned, Shapes, Users } from 'lucide-react';
import { AdminLayout } from '../layouts/admin-layout';
import { AppLayout } from '../layouts/app-layout';
import { AdminOverviewPage } from '../pages/admin-overview-page';
import { AdminAssetsPage } from '../pages/admin-assets-page';
import { AdminPlaceholderPage } from '../pages/admin-placeholder-page';
import { AssetsPage } from '../pages/assets-page';
import { DashboardPage } from '../pages/dashboard-page';
import { FindingsPage } from '../pages/findings-page';
import { LoginPage } from '../pages/login-page';
import { WorksPage } from '../pages/works-page';

type AppRoutesProps = {
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
};

export function AppRoutes({
  isAuthenticated,
  onLogin,
  onLogout,
}: AppRoutesProps) {
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={onLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AppLayout onLogout={onLogout} />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/works" element={<WorksPage />} />
        <Route path="/findings" element={<FindingsPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="assets" element={<AdminAssetsPage />} />
          <Route
            path="asset-types"
            element={
              <AdminPlaceholderPage
                title="Tipos de activos"
                description="Catálogo de tipos, nombres e iconos disponibles."
                icon={Shapes}
              />
            }
          />
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
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
