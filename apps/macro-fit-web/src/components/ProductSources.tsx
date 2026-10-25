import { ProductSource } from '../types/nutrition';

export function ProductSources({ source }: { source: ProductSource }) {
  if (source.kind !== 'web_search') return null;
  return (
    <div className="mt-2 text-xs text-slate-400">
      <p>Búsqueda web con IA · fuentes consultadas:</p>
      <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
        {source.sources.map((item) => (
          <li key={item.url} className="min-w-0 max-w-full">
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="inline-block max-w-full truncate text-teal-300 underline underline-offset-2"
              title={item.title}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SearchSuggestions({ html }: { html: string | null }) {
  if (!html) return null;
  return (
    <iframe
      title="Sugerencias de Google Search"
      sandbox="allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="no-referrer"
      className="mt-3 h-32 w-full rounded-lg border-0 bg-white"
      srcDoc={`<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; font-src https:; base-uri 'none'; form-action 'none'"><meta name="viewport" content="width=device-width,initial-scale=1">${html}`}
    />
  );
}
