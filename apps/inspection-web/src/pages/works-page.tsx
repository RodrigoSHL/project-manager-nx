import { EmptyState } from '../components/empty-state';
import { PageHeader } from '../components/page-header';

export function WorksPage() {
  return (
    <>
      <PageHeader
        title="Trabajos"
        description="Espacio reservado para las inspecciones y trabajos sobre activos."
      />
      <EmptyState
        title="Página de trabajos"
        description="Todavía no hay listados, estados ni formularios."
      />
    </>
  );
}
