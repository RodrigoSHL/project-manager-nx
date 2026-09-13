import { ConceptCatalogProvider } from '../features/concepts/concept-catalog-context';
import { FormTemplateCatalogProvider } from '../features/form-templates/form-template-catalog-context';
import { WorkCatalogProvider } from '../features/works/work-catalog-context';
import { AuthProvider } from '../features/auth/auth-context';
import { AppRoutes } from '../routes/app-routes';
import { TenantAccessProvider } from '../features/tenants/tenant-access-context';

export function App() {
  return (
    <AuthProvider>
      <TenantAccessProvider>
        <ConceptCatalogProvider>
          <FormTemplateCatalogProvider>
            <WorkCatalogProvider>
              <AppRoutes />
            </WorkCatalogProvider>
          </FormTemplateCatalogProvider>
        </ConceptCatalogProvider>
      </TenantAccessProvider>
    </AuthProvider>
  );
}

export default App;
