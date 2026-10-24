import React, { useState } from 'react';
import { ImageOff, Package } from 'lucide-react';
import { ProductSearchItem } from '../types/nutrition';

const number = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 });

export function ProductSearchResult({
  product,
  existing,
  busy,
  reviewing,
  onReview,
}: {
  product: ProductSearchItem;
  existing: boolean;
  busy: boolean;
  reviewing: boolean;
  onReview: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const preview = product.preview;
  const macros = [
    ['Energía', product.calories, 'kcal'],
    ['Proteínas', product.protein, 'g'],
    ['Carbohidratos', product.carbs, 'g'],
    ['Grasas', product.fat, 'g'],
  ] as const;
  const count = macros.filter(([, value]) => value !== null).length;
  const name = product.name || 'Producto sin nombre';
  return (
    <li
      className="relative rounded-xl border border-slate-700 bg-slate-950/30 p-3 sm:p-4"
      aria-label={`${name} · ${product.barcode}`}
    >
      <div className="flex items-start gap-3 sm:gap-4 sm:pr-44">
        <div className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-700 bg-white sm:h-24 sm:w-20">
          {preview?.imageUrl && !imageFailed ? (
            <img
              src={preview.imageUrl}
              alt={`Envase de ${name}`}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="flex flex-col items-center gap-1 text-center text-[10px] text-slate-600">
              {imageFailed ? (
                <ImageOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Package className="h-5 w-5" aria-hidden="true" />
              )}
              Sin imagen
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h4 className="break-words font-semibold">{name}</h4>
            {preview?.quantity && (
              <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-200">
                Envase: {preview.quantity}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-slate-400">
            {product.brand || 'Marca no informada'}
          </p>
          {preview?.description && preview.description !== name && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-300">
              {preview.description}
            </p>
          )}
          {!!preview?.categories.length && (
            <p
              className="mt-1 line-clamp-1 text-xs text-slate-400"
              title={preview.categories.join(' · ')}
            >
              {preview.categories.join(' · ')}
            </p>
          )}
          <p className="mt-1 break-all text-xs text-slate-500">
            Código:{' '}
            {product.source.url ? (
              <a
                href={product.source.url}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
                aria-label={`Ver ficha de ${name} en Open Food Facts (${product.barcode})`}
              >
                {product.barcode}
              </a>
            ) : (
              product.barcode
            )}
          </p>
        </div>
      </div>
      <div className="mt-3 border-t border-slate-800 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
          <p className={count === 4 ? 'text-emerald-300' : 'text-amber-300'}>
            {count === 4
              ? 'Macros disponibles'
              : count
              ? `Ficha incompleta · ${count}/4 valores`
              : 'Sin macros en la vista previa'}
          </p>
          {count > 0 && (
            <p className="text-slate-400">
              {product.referenceUnit
                ? `Por ${product.referenceAmount} ${product.referenceUnit}`
                : 'Por 100 · confirma si es g o ml'}
            </p>
          )}
        </div>
        {count > 0 && (
          <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {macros.map(([label, value, unit]) => (
              <div key={label} className="rounded-lg bg-slate-900 px-2 py-1.5">
                <dt className="text-[11px] text-slate-400">{label}</dt>
                <dd className="text-sm font-medium text-slate-200">
                  {value === null
                    ? 'Sin dato'
                    : `${number.format(value)} ${unit}`}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <button
        disabled={busy}
        onClick={onReview}
        className="mt-3 w-full rounded-lg bg-slate-800 px-3 py-2.5 text-sm font-semibold text-emerald-300 disabled:opacity-50 sm:absolute sm:right-4 sm:top-4 sm:mt-0 sm:w-auto"
      >
        {reviewing
          ? 'Cargando ficha…'
          : existing
          ? 'Editar mi producto'
          : 'Revisar e importar'}
      </button>
    </li>
  );
}
