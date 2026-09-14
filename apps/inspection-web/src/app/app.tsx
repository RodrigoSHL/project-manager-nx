import { ConceptCatalogProvider } from '../features/concepts/concept-catalog-context';
import { FormTemplateCatalogProvider } from '../features/form-templates/form-template-catalog-context';
import { WorkCatalogProvider } from '../features/works/work-catalog-context';
import { AuthProvider } from '../features/auth/auth-context';
import { AppRoutes } from '../routes/app-routes';
import { TenantAccessProvider } from '../features/tenants/tenant-access-context';
import { OfflineProvider } from '../features/offline/offline-context';

export function App() {
  return (
    <AuthProvider>
      <OfflineProvider>
        <TenantAccessProvider>
          <ConceptCatalogProvider>
            <FormTemplateCatalogProvider>
              <WorkCatalogProvider>
                <AppRoutes />
              </WorkCatalogProvider>
            </FormTemplateCatalogProvider>
          </ConceptCatalogProvider>
        </TenantAccessProvider>
      </OfflineProvider>
    </AuthProvider>
  );
}

export default App;
