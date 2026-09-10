import type { WorkSeedCatalog } from './work-reference-loader';
import type { WorkTemplateSnapshot } from './models';

export function createTemplateSnapshot(
  workId: string,
  tenantId: string,
  templateId: string,
  catalog: WorkSeedCatalog
): WorkTemplateSnapshot {
  const template = catalog.templates.find(
    (item) => item.id === templateId && item.tenantId === tenantId
  );
  if (!template) throw new Error('La plantilla no pertenece a esta empresa.');

  const concepts = new Map(
    catalog.concepts
      .filter((item) => item.tenantId === tenantId)
      .map((item) => [item.id, item])
  );

  const sections = catalog.sections
    .filter(
      (section) =>
        section.tenantId === tenantId && section.formTemplateId === template.id
    )
    .sort((a, b) => a.order - b.order)
    .map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      order: section.order,
      items: catalog.items
        .filter(
          (item) => item.tenantId === tenantId && item.sectionId === section.id
        )
        .sort((a, b) => a.order - b.order)
        .map((item) => {
          const concept = item.conceptId
            ? concepts.get(item.conceptId)
            : undefined;
          return {
            id: item.id,
            type: item.type,
            order: item.order,
            title: item.title,
            description: item.description,
            required: item.required,
            concept: concept
              ? {
                  id: concept.id,
                  code: concept.code,
                  name: concept.name,
                  description: concept.description,
                  type: concept.type,
                  unit: concept.unit,
                  options: catalog.options
                    .filter(
                      (option) =>
                        option.tenantId === tenantId &&
                        option.conceptId === concept.id &&
                        option.active
                    )
                    .sort((a, b) => a.order - b.order)
                    .map(({ id, label, value, order }) => ({
                      id,
                      label,
                      value,
                      order,
                    })),
                }
              : undefined,
          };
        }),
    }));

  return {
    workId,
    tenantId,
    formTemplateId: template.id,
    formTemplateVersion: template.version,
    name: template.name,
    sections,
  };
}
