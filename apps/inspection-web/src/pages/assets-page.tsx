import { EmptyState } from '../components/empty-state';
import { PageHeader } from '../components/page-header';

export function AssetsPage() {
  return (
    <>
      <PageHeader
        title="Activos"
        description="Aquí construiremos el árbol de subestaciones y sus activos en una próxima etapa."
      />
      <EmptyState
        title="Página de activos"
        description="La navegación ya funciona. Todavía no hay árbol, datos ni formularios."
      />
    </>
  );
}
