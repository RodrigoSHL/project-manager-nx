import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Database,
  LoaderCircle,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Search,
} from 'lucide-react';
import { CatalogTenantSelector } from '../components/catalog-tenant-selector';
import { Button } from '../components/ui/button';
import { ConceptForm } from '../features/concepts/components/concept-form';
import {
  conceptTypeLabels,
  conceptTypes,
} from '../features/concepts/concept-schema';
import type {
  Concept,
  ConceptFormValue,
  ConceptType,
} from '../features/concepts/models';
import { useConceptCatalog } from '../features/concepts/use-concept-catalog';
import { useReferenceCatalog } from '../features/catalogs/use-reference-catalog';

type ActiveFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

export function AdminConceptsPage() {
  const referenceCatalog = useReferenceCatalog();
  const conceptCatalog = useConceptCatalog(
    referenceCatalog.tenantId,
    referenceCatalog.assetTypes
  );
  const [editing, setEditing] = useState<Concept | null | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ConceptType | 'ALL'>('ALL');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('ALL');

  useEffect(() => {
    setEditing(undefined);
    setSearchQuery('');
    setTypeFilter('ALL');
    setActiveFilter('ALL');
  }, [referenceCatalog.tenantId]);

  const filteredConcepts = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('es');
    return conceptCatalog.concepts.filter((concept) => {
      const matchesQuery =
        !query ||
        concept.name.toLocaleLowerCase('es').includes(query) ||
        concept.code.toLocaleLowerCase('es').includes(query);
      const matchesType = typeFilter === 'ALL' || concept.type === typeFilter;
      const matchesStatus =
        activeFilter === 'ALL' ||
        (activeFilter === 'ACTIVE' ? concept.active : !concept.active);
      return matchesQuery && matchesType && matchesStatus;
    });
  }, [activeFilter, conceptCatalog.concepts, searchQuery, typeFilter]);

  async function saveConcept(value: ConceptFormValue) {
    if (editing) await conceptCatalog.updateConcept(editing.id, value);
    else await conceptCatalog.createConcept(value);
    setEditing(undefined);
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Conceptos</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Define variables, estados y características que podrán reutilizarse
            en distintos tipos de activo.
          </p>
        </div>
        <Button type="button" onClick={() => setEditing(null)}>
          <Plus /> Nuevo concepto
        </Button>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <CatalogTenantSelector
          tenants={referenceCatalog.tenants}
          tenantId={referenceCatalog.tenantId}
          onChange={referenceCatalog.selectTenant}
        />
        <p className="mt-3 text-xs text-slate-500">
          Los conceptos se guardan en PostgreSQL y permanecen aislados por
          empresa.
        </p>
      </div>

      {conceptCatalog.error ? (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span className="flex items-center gap-2">
            <AlertCircle className="size-5" /> {conceptCatalog.error}
          </span>
          <Button variant="outline" onClick={() => void conceptCatalog.retry()}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {editing !== undefined ? (
        <div className="mt-5">
          <ConceptForm
            concept={editing}
            options={conceptCatalog.options}
            onCancel={() => setEditing(undefined)}
            onSubmit={saveConcept}
          />
        </div>
      ) : null}

      <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900">
                Catálogo de conceptos
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {filteredConcepts.length} de {conceptCatalog.concepts.length}{' '}
                registros visibles
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
              <Database className="size-3.5" /> PostgreSQL
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(12rem,1fr)_11rem_11rem]">
            <label className="relative block">
              <span className="sr-only">Buscar conceptos</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar por código o nombre..."
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label>
              <span className="sr-only">Filtrar por tipo</span>
              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value as ConceptType | 'ALL')
                }
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                <option value="ALL">Todos los tipos</option>
                {conceptTypes.map((type) => (
                  <option key={type} value={type}>
                    {conceptTypeLabels[type]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="sr-only">Filtrar por estado</span>
              <select
                value={activeFilter}
                onChange={(event) =>
                  setActiveFilter(event.target.value as ActiveFilter)
                }
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                <option value="ALL">Todos los estados</option>
                <option value="ACTIVE">Activos</option>
                <option value="INACTIVE">Inactivos</option>
              </select>
            </label>
          </div>
        </div>

        <div className="hidden grid-cols-[minmax(12rem,1.3fr)_minmax(10rem,1fr)_8rem_6rem_5rem] gap-4 border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
          <span>Concepto</span>
          <span>Código</span>
          <span>Tipo</span>
          <span>Unidad</span>
          <span className="text-right">Acciones</span>
        </div>

        {conceptCatalog.isLoading ? (
          <div className="grid min-h-40 place-items-center">
            <LoaderCircle className="size-6 animate-spin text-slate-500" />
          </div>
        ) : filteredConcepts.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No hay conceptos que coincidan con los filtros.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredConcepts.map((concept) => {
              const optionCount = conceptCatalog.options.filter(
                (option) => option.conceptId === concept.id && option.active
              ).length;
              return (
                <article
                  key={concept.id}
                  className="grid min-w-0 gap-3 px-4 py-4 md:grid-cols-[minmax(12rem,1.3fr)_minmax(10rem,1fr)_8rem_6rem_5rem] md:items-center md:gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <h4 className="truncate text-sm font-semibold text-slate-900">
                        {concept.name}
                      </h4>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${
                          concept.active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {concept.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                      {concept.description ?? 'Sin descripción.'}
                    </p>
                  </div>
                  <span className="truncate font-mono text-xs text-slate-600">
                    {concept.code}
                  </span>
                  <span className="text-sm text-slate-700">
                    {conceptTypeLabels[concept.type]}
                    {concept.type === 'DIGITAL' ? (
                      <span className="block text-xs text-slate-500">
                        {optionCount} opciones
                      </span>
                    ) : null}
                  </span>
                  <span className="text-sm text-slate-600">
                    {concept.unit ?? '—'}
                  </span>
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${concept.name}`}
                      title="Editar"
                      onClick={() => setEditing(concept)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`${
                        concept.active ? 'Desactivar' : 'Activar'
                      } ${concept.name}`}
                      title={concept.active ? 'Desactivar' : 'Activar'}
                      onClick={() =>
                        void conceptCatalog
                          .setConceptActive(concept.id, !concept.active)
                          .catch(() => undefined)
                      }
                    >
                      {concept.active ? <Power /> : <RotateCcw />}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
