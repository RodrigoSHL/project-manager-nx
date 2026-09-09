import { useState } from 'react';
import { ConceptCatalogProvider } from '../features/concepts/concept-catalog-context';
import { AppRoutes } from '../routes/app-routes';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <ConceptCatalogProvider>
      <AppRoutes
        isAuthenticated={isAuthenticated}
        onLogin={() => setIsAuthenticated(true)}
        onLogout={() => setIsAuthenticated(false)}
      />
    </ConceptCatalogProvider>
  );
}

export default App;
