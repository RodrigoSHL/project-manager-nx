import { EmptyState } from '../components/empty-state';
import { PageHeader } from '../components/page-header';

export function FindingsPage() {
  return (
    <>
      <PageHeader
        title="Hallazgos"
        description="Espacio reservado para las condiciones detectadas durante una inspección."
      />
      <EmptyState
        title="Página de hallazgos"
        description="Todavía no hay hallazgos, filtros ni niveles de criticidad."
      />
    </>
  );
}
