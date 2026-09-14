import { ConceptCatalogProvider } from '../features/concepts/concept-catalog-context';
import { FormTemplateCatalogProvider } from '../features/form-templates/form-template-catalog-context';
import { WorkCatalogProvider } from '../features/works/work-catalog-context';
import { AuthProvider } from '../features/auth/auth-context';
import { AppRoutes } from '../routes/app-routes';
import { TenantAccessProvider } from '../features/tenants/tenant-access-context';
import { OfflineProvider } from '../features/offline/offline-context';
import { ConnectivityProvider } from '../features/connectivity/connectivity-context';
import { PwaUpdatePrompt } from '../features/pwa/pwa-update-prompt';

export function App() {
  return (
    <ConnectivityProvider>
      <AuthProvider>
        <OfflineProvider>
          <TenantAccessProvider>
            <ConceptCatalogProvider>
              <FormTemplateCatalogProvider>
                <WorkCatalogProvider>
                  <AppRoutes />
                  <PwaUpdatePrompt />
                </WorkCatalogProvider>
              </FormTemplateCatalogProvider>
            </ConceptCatalogProvider>
          </TenantAccessProvider>
        </OfflineProvider>
      </AuthProvider>
    </ConnectivityProvider>
  );
}

export default App;
