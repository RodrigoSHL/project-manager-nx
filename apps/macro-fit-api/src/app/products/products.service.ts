import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ProductDraft,
  ProductSearchItem,
  productDraftSchema,
  productPreviewSchema,
} from '@project-manager/macrofit-contracts';

const fields =
  'code,product_name,product_name_es,product_name_en,generic_name,generic_name_es,brands,quantity,categories,nutriments,product_quantity_unit,serving_quantity_unit,image_front_small_url,image_small_url';
const cleanText = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) || null : null;

export function normalizeProduct(value: unknown): ProductDraft | null {
  if (!value || typeof value !== 'object') return null;
  const p = value as Record<string, unknown>;
  const code =
    typeof p.code === 'string' && /^\d{8,14}$/.test(p.code) ? p.code : null;
  if (!code) return null;
  const nutrients =
    p.nutriments && typeof p.nutriments === 'object'
      ? (p.nutriments as Record<string, unknown>)
      : {};
  const read = (name: string, max: number) => {
    if (nutrients[`${name}_modifier`]) return null;
    const n = nutrients[`${name}_100g`];
    return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= max
      ? n
      : null;
  };
  const units = [p.product_quantity_unit, p.serving_quantity_unit].filter(
    (u) => u === 'g' || u === 'ml'
  );
  const unit =
    units.length && units.every((u) => u === units[0])
      ? (units[0] as 'g' | 'ml')
      : null;
  const draft: ProductDraft = {
    name:
      cleanText(p.product_name_es, 200) ??
      cleanText(p.product_name, 200) ??
      cleanText(p.product_name_en, 200),
    brand: cleanText(
      Array.isArray(p.brands)
        ? p.brands
            .filter((brand) => typeof brand === 'string')
            .slice(0, 10)
            .join(', ')
        : p.brands,
      150
    ),
    barcode: code,
    referenceAmount: 100,
    referenceUnit: unit,
    calories: read('energy-kcal', 1000),
    protein: read('proteins', 100),
    carbs: read('carbohydrates', 100),
    fat: read('fat', 100),
    fiber: read('fiber', 100),
    warnings: [
      'Datos de Open Food Facts para el producto tal como se vende. Revisa la etiqueta, la unidad y los valores antes de guardar.',
    ],
    source: {
      kind: 'open_food_facts',
      url: `https://world.openfoodfacts.org/product/${code}`,
    },
  };
  if (!unit)
    draft.warnings.push(
      'No se pudo confirmar si los valores corresponden a 100 g o 100 ml. Selecciona la unidad indicada en tu etiqueta.'
    );
  if (
    [draft.calories, draft.protein, draft.carbs, draft.fat].some(
      (v) => v === null
    )
  )
    draft.warnings.push(
      'La ficha está incompleta. Completa los valores faltantes manualmente o con una foto de la etiqueta.'
    );
  return productDraftSchema.parse(draft);
}

export function normalizeSearchProduct(
  value: unknown
): ProductSearchItem | null {
  const draft = normalizeProduct(value);
  if (!draft) return null;
  const p = value as Record<string, unknown>;
  const imageUrl =
    [p.image_front_small_url, p.image_small_url].find(
      (url) =>
        productPreviewSchema.shape.imageUrl.safeParse(url).success &&
        typeof url === 'string'
    ) ?? null;
  const categories =
    cleanText(p.categories, 1000)
      ?.split(',')
      .map((category) => category.trim().slice(0, 100))
      .filter(Boolean)
      .slice(-3) ?? [];
  return {
    ...draft,
    preview: productPreviewSchema.parse({
      description:
        cleanText(p.generic_name_es, 300) ?? cleanText(p.generic_name, 300),
      quantity: cleanText(p.quantity, 100),
      categories,
      imageUrl,
    }),
  };
}

@Injectable()
export class ProductsService {
  private readonly cache = new Map<
    string,
    { expires: number; value: { products: ProductSearchItem[] } }
  >();
  private readonly pending = new Map<
    string,
    Promise<{ products: ProductSearchItem[] }>
  >();
  private window = Date.now();
  private searches = 0;
  private barcodes = 0;

  async search(raw: unknown) {
    if (
      typeof raw !== 'string' ||
      raw.trim().length < 2 ||
      raw.trim().length > 100
    )
      throw new BadRequestException(
        'Busca por nombre o código de barras usando entre 2 y 100 caracteres.'
      );
    const query = raw.trim();
    const barcode = /^\d{8,14}$/.test(query);
    const terms = query
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (terms.length < 2)
      throw new BadRequestException(
        'Escribe el nombre de un producto o su código de barras.'
      );
    const key = query.toLocaleLowerCase('es');
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) return cached.value;
    const existing = this.pending.get(key);
    if (existing) return existing;
    if (Date.now() - this.window >= 60000) {
      this.window = Date.now();
      this.searches = 0;
      this.barcodes = 0;
    }
    // Stay below OFF's per-IP limits, including simultaneous requests.
    if (
      (barcode ? this.barcodes >= 12 : this.searches >= 8) ||
      this.pending.size >= 2
    )
      throw new HttpException(
        'Hay muchas búsquedas en curso. Espera un minuto o ingresa el producto manualmente.',
        429
      );
    if (barcode) this.barcodes++;
    else this.searches++;
    const url = new URL(
      barcode ? `/api/v2/product/${query}.json` : '/search',
      barcode
        ? 'https://world.openfoodfacts.org'
        : 'https://search.openfoodfacts.org'
    );
    // One bounded request supplies comparison previews. The UI still fetches
    // the current record by barcode before importing; index data can be stale.
    url.searchParams.set('fields', fields);
    if (!barcode) {
      for (const [name, value] of Object.entries({
        q: terms,
        boost_phrase: 'true',
        langs: 'es,en',
        page_size: '12',
      }))
        url.searchParams.set(name, value);
    }
    const task = this.fetchProducts(url, barcode);
    this.pending.set(key, task);
    try {
      const result = await task;
      const oldest = this.cache.keys().next().value;
      if (this.cache.size >= 100 && oldest !== undefined)
        this.cache.delete(oldest);
      this.cache.set(key, { expires: Date.now() + 300000, value: result });
      return result;
    } finally {
      this.pending.delete(key);
    }
  }

  private async fetchProducts(
    url: URL,
    barcode: boolean
  ): Promise<{ products: ProductSearchItem[] }> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'MacroFit/1.0 (https://macrofit.atomdev.cl)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(12000),
        redirect: 'error',
      });
      if (barcode && response.status === 404) return { products: [] };
      if (!response.ok)
        throw new ServiceUnavailableException(
          'Open Food Facts no está disponible. Puedes ingresar el producto manualmente o leer su etiqueta.'
        );
      const reader = response.body?.getReader();
      if (!reader)
        throw new BadGatewayException(
          'Open Food Facts entregó una respuesta vacía.'
        );
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const part = await reader.read();
          if (part.done) break;
          size += part.value.byteLength;
          if (size > 2 * 1024 * 1024) {
            await reader.cancel();
            throw new BadGatewayException(
              'La respuesta de Open Food Facts es demasiado grande.'
            );
          }
          chunks.push(part.value);
        }
      } finally {
        reader.releaseLock();
      }
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch {
        throw new BadGatewayException(
          'Open Food Facts entregó una respuesta inválida.'
        );
      }
      if (!data || typeof data !== 'object' || Array.isArray(data))
        throw new BadGatewayException(
          'Open Food Facts entregó una respuesta inválida.'
        );
      if (barcode && data.status === 0) return { products: [] };
      if (data.timed_out === true)
        throw new GatewayTimeoutException(
          'La búsqueda de Open Food Facts agotó su tiempo. Intenta con el código de barras o ingresa el producto manualmente.'
        );
      if (
        barcode
          ? !data.product || typeof data.product !== 'object'
          : !Array.isArray(data.hits)
      )
        throw new BadGatewayException(
          'Open Food Facts entregó una respuesta inválida.'
        );
      const rows = barcode
        ? [data.product]
        : (data.hits as unknown[]).slice(0, 12);
      return {
        products: rows
          .map(normalizeSearchProduct)
          .filter((p): p is ProductSearchItem => p !== null),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        ['AbortError', 'TimeoutError'].includes(String(error.name))
      )
        throw new GatewayTimeoutException(
          'La búsqueda tardó demasiado. Puedes ingresar el producto manualmente o leer su etiqueta.'
        );
      throw new ServiceUnavailableException(
        'No fue posible conectar con Open Food Facts. Puedes ingresar el producto manualmente o leer su etiqueta.'
      );
    }
  }
}
