import { useState } from 'react';
import { AppRoutes } from '../routes/app-routes';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <AppRoutes
      isAuthenticated={isAuthenticated}
      onLogin={() => setIsAuthenticated(true)}
      onLogout={() => setIsAuthenticated(false)}
    />
  );
}

export default App;
