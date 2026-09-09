import { ArrowLeft, ClipboardCheck, Eye } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import type { Concept, ConceptOption } from '../../concepts/models';
import type { FormItem, FormSection, FormTemplate } from '../models';

type FormTemplatePreviewProps = {
  template: FormTemplate;
  sections: FormSection[];
  items: FormItem[];
  concepts: Concept[];
  options: ConceptOption[];
  onClose: () => void;
};

export function FormTemplatePreview({
  template,
  sections,
  items,
  concepts,
  options,
  onClose,
}: FormTemplatePreviewProps) {
  const conceptById = new Map(concepts.map((concept) => [concept.id, concept]));

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-slate-700 shadow-sm ring-1 ring-slate-200">
              <Eye className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Vista previa · no guarda respuestas
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-950">
                {template.name}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Versión {template.version}
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={onClose}>
            <ArrowLeft /> Volver al editor
          </Button>
        </div>
      </header>

      <div className="grid gap-6 p-4 sm:p-6">
        {[...sections].sort(byOrder).map((section) => {
          const visibleItems = items
            .filter((item) => item.sectionId === section.id)
            .sort(byOrder)
            .filter(
              (item) =>
                item.type === 'TASK' ||
                conceptById.get(item.conceptId ?? '')?.type !== 'HIDDEN'
            );
          return (
            <section key={section.id}>
              <div className="border-b border-slate-200 pb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Sección {section.order}
                </p>
                <h4 className="mt-1 font-semibold text-slate-950">
                  {section.title}
                </h4>
                {section.description ? (
                  <p className="mt-1 text-sm text-slate-500">
                    {section.description}
                  </p>
                ) : null}
              </div>

              {visibleItems.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">
                  Sin elementos visibles en esta sección.
                </p>
              ) : (
                <div className="mt-4 grid gap-5">
                  {visibleItems.map((item) => {
                    if (item.type === 'TASK') {
                      return (
                        <label
                          key={item.id}
                          className="flex items-start gap-3 rounded-lg border border-slate-200 p-3"
                        >
                          <input
                            type="checkbox"
                            disabled
                            className="mt-0.5 size-5"
                          />
                          <span>
                            <span className="text-sm font-medium text-slate-800">
                              {item.title}
                              {item.required ? ' *' : ''}
                            </span>
                            <span className="mt-0.5 block text-xs text-slate-500">
                              {item.description ?? 'Actividad por confirmar.'}
                            </span>
                          </span>
                        </label>
                      );
                    }

                    const concept = conceptById.get(item.conceptId ?? '');
                    if (!concept) return null;
                    return (
                      <PreviewConcept
                        key={item.id}
                        item={item}
                        concept={concept}
                        options={options.filter(
                          (option) =>
                            option.conceptId === concept.id && option.active
                        )}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <footer className="flex items-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 sm:px-6">
        <ClipboardCheck className="size-4" /> Esta pantalla representa la futura
        ejecución, pero todos los controles están deshabilitados.
      </footer>
    </section>
  );
}

function PreviewConcept({
  item,
  concept,
  options,
}: {
  item: FormItem;
  concept: Concept;
  options: ConceptOption[];
}) {
  const label = `${concept.name}${item.required ? ' *' : ''}`;

  if (concept.type === 'DIGITAL') {
    return (
      <fieldset>
        <legend className="text-sm font-medium text-slate-800">{label}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {options.sort(byOrder).map((option) => (
            <label
              key={option.id}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-600"
            >
              <input type="radio" disabled name={`preview-${item.id}`} />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (concept.type === 'TEXT') {
    return (
      <label className="block text-sm font-medium text-slate-800">
        {label}
        <textarea
          disabled
          placeholder="Respuesta de texto"
          className="mt-2 min-h-20 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
        />
      </label>
    );
  }

  return (
    <label className="block text-sm font-medium text-slate-800">
      {label}
      <span className="mt-2 flex items-center gap-2">
        <input
          disabled
          type="number"
          placeholder="Valor"
          className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm sm:max-w-56"
        />
        {concept.unit ? (
          <span className="text-sm text-slate-500">{concept.unit}</span>
        ) : null}
      </span>
    </label>
  );
}

function byOrder(a: { order: number }, b: { order: number }) {
  return a.order - b.order;
}
