import React, { useState } from 'react';
import { ArrowRight, ImageOff, Package } from 'lucide-react';
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
  const action = reviewing
    ? 'Cargando ficha…'
    : existing
    ? 'Editar mi producto'
    : 'Revisar e importar';
  const repeatedBrand =
    product.brand?.trim().toLocaleLowerCase('es') ===
    name.trim().toLocaleLowerCase('es');
  return (
    <li
      className="@container rounded-xl border border-slate-700 bg-slate-950/30 p-3"
      aria-label={`${name} · ${product.barcode}`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 @min-[54rem]:grid-cols-[minmax(0,1.15fr)_minmax(18rem,1fr)_auto] @min-[54rem]:items-center @min-[54rem]:gap-x-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-700 bg-white @min-[36rem]:h-20 @min-[36rem]:w-16">
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
              <h4
                className="line-clamp-2 break-words text-sm font-semibold @min-[36rem]:text-base"
                title={name}
              >
                {name}
              </h4>
              {preview?.quantity && (
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-200">
                  Envase: {preview.quantity}
                </span>
              )}
            </div>
            {!repeatedBrand && (
              <p className="mt-0.5 text-xs text-slate-400">
                {product.brand || 'Marca no informada'}
              </p>
            )}
            {preview?.description && preview.description !== name && (
              <p
                className="mt-1 line-clamp-1 text-xs text-slate-300"
                title={preview.description}
              >
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
        <div className="order-3 col-span-2 min-w-0 border-t border-slate-800 pt-2 @min-[54rem]:order-2 @min-[54rem]:col-span-1 @min-[54rem]:border-t-0 @min-[54rem]:pt-0">
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
            <dl className="mt-1.5 grid grid-cols-4 gap-1.5">
              {macros.map(([label, value, unit]) => (
                <div
                  key={label}
                  className="min-w-0 rounded-lg bg-slate-900 px-1.5 py-1"
                >
                  <dt
                    className="text-[10px] text-slate-400 @min-[18rem]:text-[11px]"
                    aria-label={label}
                    title={label}
                  >
                    {label === 'Carbohidratos' ? 'Carbos' : label}
                  </dt>
                  <dd className="break-words text-xs font-semibold leading-5 tabular-nums text-slate-200 @min-[54rem]:text-sm">
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
          aria-label={action}
          title={action}
          className="order-2 flex min-h-10 items-center justify-center gap-1.5 self-start rounded-lg bg-slate-800 px-2.5 py-2 text-xs font-semibold text-emerald-300 disabled:opacity-50 @min-[36rem]:px-3 @min-[36rem]:text-sm @min-[54rem]:order-3 @min-[54rem]:self-center"
        >
          <span className="hidden @min-[36rem]:inline">{action}</span>
          <span className="@min-[36rem]:hidden">
            {reviewing ? 'Cargando…' : existing ? 'Editar' : 'Revisar'}
          </span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
