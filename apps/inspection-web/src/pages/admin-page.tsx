import { EmptyState } from '../components/empty-state';
import { PageHeader } from '../components/page-header';

export function AdminPage() {
  return (
    <>
      <PageHeader
        title="Administración"
        description="Espacio reservado para la configuración futura del sistema."
      />
      <EmptyState
        title="Página de administración"
        description="Todavía no hay catálogos, usuarios ni permisos."
      />
    </>
  );
}
