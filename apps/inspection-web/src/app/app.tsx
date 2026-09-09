import { useState } from 'react';
import { ConceptCatalogProvider } from '../features/concepts/concept-catalog-context';
import { FormTemplateCatalogProvider } from '../features/form-templates/form-template-catalog-context';
import { AppRoutes } from '../routes/app-routes';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <ConceptCatalogProvider>
      <FormTemplateCatalogProvider>
        <AppRoutes
          isAuthenticated={isAuthenticated}
          onLogin={() => setIsAuthenticated(true)}
          onLogout={() => setIsAuthenticated(false)}
        />
      </FormTemplateCatalogProvider>
    </ConceptCatalogProvider>
  );
}

export default App;
