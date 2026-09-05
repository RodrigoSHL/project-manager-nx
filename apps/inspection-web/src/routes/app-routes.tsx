import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../layouts/app-layout';
import { AdminPage } from '../pages/admin-page';
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
        <Route path="/admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
