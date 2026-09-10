import { useState } from 'react';
import { ConceptCatalogProvider } from '../features/concepts/concept-catalog-context';
import { FormTemplateCatalogProvider } from '../features/form-templates/form-template-catalog-context';
import { WorkCatalogProvider } from '../features/works/work-catalog-context';
import { PlatformAuthProvider } from '../features/platform/platform-auth-context';
import { AppRoutes } from '../routes/app-routes';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <PlatformAuthProvider>
      <ConceptCatalogProvider>
        <FormTemplateCatalogProvider>
          <WorkCatalogProvider>
            <AppRoutes
              isAuthenticated={isAuthenticated}
              onLogin={() => setIsAuthenticated(true)}
              onLogout={() => setIsAuthenticated(false)}
            />
          </WorkCatalogProvider>
        </FormTemplateCatalogProvider>
      </ConceptCatalogProvider>
    </PlatformAuthProvider>
  );
}

export default App;
