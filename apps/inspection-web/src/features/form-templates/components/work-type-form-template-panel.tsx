import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ClipboardList,
  Eye,
  FileText,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import type { AssetType } from '../../asset-types/models';
import type {
  AssetTypeConcept,
  Concept,
  ConceptOption,
} from '../../concepts/models';
import { conceptTypeLabels } from '../../concepts/concept-schema';
import type { WorkType } from '../../work-types/models';
import type { useFormTemplateCatalog } from '../use-form-template-catalog';
import { useCompatibleConcepts } from '../use-compatible-concepts';
import type { FormItem } from '../models';
import { FormItemForm } from './form-item-form';
import { FormSectionForm } from './form-section-form';
import { FormTemplateForm } from './form-template-form';
import { FormTemplatePreview } from './form-template-preview';

type FormCatalog = ReturnType<typeof useFormTemplateCatalog>;

type Editor =
  | { kind: 'template' }
  | { kind: 'section'; sectionId?: string }
  | { kind: 'item'; sectionId: string; itemId?: string }
  | null;

type WorkTypeFormTemplatePanelProps = {
  tenantId: string;
  workType: WorkType;
  assetTypes: AssetType[];
  concepts: Concept[];
  conceptOptions: ConceptOption[];
  assetTypeConcepts: AssetTypeConcept[];
  catalog: FormCatalog;
};

export function WorkTypeFormTemplatePanel({
  tenantId,
  workType,
  assetTypes,
  concepts,
  conceptOptions,
  assetTypeConcepts,
  catalog,
}: WorkTypeFormTemplatePanelProps) {
  const [editor, setEditor] = useState<Editor>(null);
  const [preview, setPreview] = useState(false);
  const template = catalog.templates.find(
    (item) => item.workTypeId === workType.id
  );
  const sections = useMemo(
    () =>
      catalog.sections
        .filter((section) => section.formTemplateId === template?.id)
        .sort(byOrder),
    [catalog.sections, template?.id]
  );
  const items = useMemo(
    () =>
      catalog.items
        .filter((item) =>
          sections.some((section) => section.id === item.sectionId)
        )
        .sort(byOrder),
    [catalog.items, sections]
  );
  const conceptById = useMemo(
    () => new Map(concepts.map((concept) => [concept.id, concept])),
    [concepts]
  );
  const compatibleConcepts = useCompatibleConcepts({
    tenantId,
    workTypeId: workType.id,
    assetTypes,
    concepts,
    relations: assetTypeConcepts,
  });

  useEffect(() => {
    setEditor(null);
    setPreview(false);
  }, [tenantId, workType.id]);

  if (preview && template) {
    return (
      <FormTemplatePreview
        template={template}
        sections={sections}
        items={items}
        concepts={concepts}
        options={conceptOptions}
        onClose={() => setPreview(false)}
      />
    );
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">
            <ClipboardList className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500">
              Formulario asociado
            </p>
            <h3 className="mt-0.5 truncate font-semibold text-slate-950">
              {workType.name}
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Configura la estructura que se utilizará en una ejecución futura.
            </p>
          </div>
          {template ? (
            <span
              className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                template.active
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              v{template.version} · {template.active ? 'Activa' : 'Inactiva'}
            </span>
          ) : null}
        </div>
      </header>

      <div className="p-4 sm:p-5">
        {!template ? (
          editor?.kind === 'template' ? (
            <FormTemplateForm
              onCancel={() => setEditor(null)}
              onSubmit={(input) => {
                catalog.createTemplate(workType, input);
                setEditor(null);
              }}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <FileText className="mx-auto size-8 text-slate-400" />
              <h4 className="mt-3 font-semibold text-slate-900">
                Este tipo de trabajo no tiene formulario
              </h4>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                Crea una plantilla vacía y luego agrega sus secciones y
                elementos.
              </p>
              <Button
                type="button"
                className="mt-4"
                onClick={() => setEditor({ kind: 'template' })}
              >
                <Plus /> Crear formulario
              </Button>
            </div>
          )
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-slate-50 p-4">
              <div className="min-w-0">
                <h4 className="font-semibold text-slate-950">
                  {template.name}
                </h4>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {template.description ?? 'Sin descripción.'}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Editar formulario"
                  aria-label="Editar formulario"
                  onClick={() => setEditor({ kind: 'template' })}
                >
                  <Pencil />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreview(true)}
                >
                  <Eye /> Vista previa
                </Button>
              </div>
            </div>

            {editor?.kind === 'template' ? (
              <div className="mt-4">
                <FormTemplateForm
                  template={template}
                  onCancel={() => setEditor(null)}
                  onSubmit={(input) => {
                    catalog.updateTemplate(template.id, input);
                    setEditor(null);
                  }}
                />
              </div>
            ) : null}

            <div className="mt-5 grid gap-4">
              {sections.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  Agrega la primera sección del formulario.
                </p>
              ) : null}

              {sections.map((section, sectionIndex) => {
                const sectionItems = items
                  .filter((item) => item.sectionId === section.id)
                  .sort(byOrder);
                return (
                  <article
                    key={section.id}
                    className="overflow-hidden rounded-xl border border-slate-200"
                  >
                    <header className="flex flex-wrap items-start gap-3 bg-slate-50 p-3 sm:flex-nowrap sm:p-4">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-900 text-sm font-semibold text-white">
                        {section.order}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h5 className="font-semibold text-slate-900">
                          {section.title}
                        </h5>
                        {section.description ? (
                          <p className="mt-0.5 text-xs leading-5 text-slate-500">
                            {section.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="ml-11 flex shrink-0 items-center sm:ml-0">
                        <OrderActions
                          label="sección"
                          disableUp={sectionIndex === 0}
                          disableDown={sectionIndex === sections.length - 1}
                          onUp={() =>
                            catalog.moveSection(template.id, section.id, -1)
                          }
                          onDown={() =>
                            catalog.moveSection(template.id, section.id, 1)
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Editar sección"
                          aria-label={`Editar ${section.title}`}
                          onClick={() =>
                            setEditor({
                              kind: 'section',
                              sectionId: section.id,
                            })
                          }
                        >
                          <Pencil />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:bg-red-50"
                          title="Eliminar sección"
                          aria-label={`Eliminar ${section.title}`}
                          onClick={() => {
                            if (
                              window.confirm(
                                `¿Eliminar la sección ${section.title} y sus elementos?`
                              )
                            ) {
                              catalog.deleteSection(section.id);
                            }
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </header>

                    {editor?.kind === 'section' &&
                    editor.sectionId === section.id ? (
                      <div className="border-t border-slate-200 p-3 sm:p-4">
                        <FormSectionForm
                          section={section}
                          onCancel={() => setEditor(null)}
                          onSubmit={(input) => {
                            catalog.updateSection(section.id, input);
                            setEditor(null);
                          }}
                        />
                      </div>
                    ) : null}

                    <div className="divide-y divide-slate-100 px-3 sm:px-4">
                      {sectionItems.length === 0 ? (
                        <p className="py-4 text-sm text-slate-400">
                          Esta sección todavía no tiene elementos.
                        </p>
                      ) : null}
                      {sectionItems.map((item, itemIndex) => (
                        <FormItemRow
                          key={item.id}
                          item={item}
                          concept={conceptById.get(item.conceptId ?? '')}
                          disableUp={itemIndex === 0}
                          disableDown={itemIndex === sectionItems.length - 1}
                          onUp={() => catalog.moveItem(section.id, item.id, -1)}
                          onDown={() =>
                            catalog.moveItem(section.id, item.id, 1)
                          }
                          onEdit={() =>
                            setEditor({
                              kind: 'item',
                              sectionId: section.id,
                              itemId: item.id,
                            })
                          }
                          onDelete={() =>
                            catalog.deleteItem(section.id, item.id)
                          }
                        />
                      ))}
                    </div>

                    {editor?.kind === 'item' &&
                    editor.sectionId === section.id ? (
                      <div className="border-t border-slate-200 p-3 sm:p-4">
                        <FormItemForm
                          item={catalog.items.find(
                            (item) => item.id === editor.itemId
                          )}
                          preferredConcepts={compatibleConcepts.preferred}
                          otherConcepts={compatibleConcepts.others}
                          usesFallback={compatibleConcepts.usesFallback}
                          conceptsLoading={compatibleConcepts.isLoading}
                          onCancel={() => setEditor(null)}
                          onSubmit={(input) => {
                            if (editor.itemId) {
                              catalog.updateItem(editor.itemId, input);
                            } else {
                              catalog.createItem(section.id, input);
                            }
                            setEditor(null);
                          }}
                        />
                      </div>
                    ) : (
                      <div className="border-t border-slate-200 p-3 sm:px-4">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            setEditor({ kind: 'item', sectionId: section.id })
                          }
                        >
                          <Plus /> Agregar elemento
                        </Button>
                      </div>
                    )}
                  </article>
                );
              })}

              {editor?.kind === 'section' && !editor.sectionId ? (
                <FormSectionForm
                  onCancel={() => setEditor(null)}
                  onSubmit={(input) => {
                    catalog.createSection(template.id, input);
                    setEditor(null);
                  }}
                />
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => setEditor({ kind: 'section' })}
                >
                  <Plus /> Agregar sección
                </Button>
              )}
            </div>

            {compatibleConcepts.error ? (
              <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                No se pudo calcular la recomendación de conceptos:{' '}
                {compatibleConcepts.error}
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

function FormItemRow({
  item,
  concept,
  disableUp,
  disableDown,
  onUp,
  onDown,
  onEdit,
  onDelete,
}: {
  item: FormItem;
  concept?: Concept;
  disableUp: boolean;
  disableDown: boolean;
  onUp: () => void;
  onDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 py-3">
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-lg ${
          item.type === 'TASK'
            ? 'bg-blue-50 text-blue-700'
            : 'bg-amber-50 text-amber-700'
        }`}
      >
        {item.type === 'TASK' ? (
          <ListChecks className="size-4" />
        ) : (
          <FileText className="size-4" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-medium text-slate-800">
            {item.type === 'TASK'
              ? item.title
              : concept?.name ?? 'Concepto no disponible'}
          </p>
          {item.required ? (
            <span className="shrink-0 text-xs font-semibold text-red-600">
              Obligatorio
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {item.type === 'TASK'
            ? 'Tarea'
            : concept
            ? `Concepto · ${conceptTypeLabels[concept.type]}${
                concept.unit ? ` · ${concept.unit}` : ''
              }`
            : 'Referencia inválida'}
        </p>
      </div>
      <OrderActions
        label="elemento"
        disableUp={disableUp}
        disableDown={disableDown}
        onUp={onUp}
        onDown={onDown}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        title="Editar elemento"
        aria-label="Editar elemento"
        onClick={onEdit}
      >
        <Pencil />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-red-600 hover:bg-red-50"
        title="Eliminar elemento"
        aria-label="Eliminar elemento"
        onClick={onDelete}
      >
        <Trash2 />
      </Button>
    </div>
  );
}

function OrderActions({
  label,
  disableUp,
  disableDown,
  onUp,
  onDown,
}: {
  label: string;
  disableUp: boolean;
  disableDown: boolean;
  onUp: () => void;
  onDown: () => void;
}) {
  return (
    <div className="flex shrink-0 gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 min-h-8"
        disabled={disableUp}
        title={`Subir ${label}`}
        aria-label={`Subir ${label}`}
        onClick={onUp}
      >
        <ArrowUp />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 min-h-8"
        disabled={disableDown}
        title={`Bajar ${label}`}
        aria-label={`Bajar ${label}`}
        onClick={onDown}
      >
        <ArrowDown />
      </Button>
    </div>
  );
}

function byOrder(a: { order: number }, b: { order: number }) {
  return a.order - b.order;
}
