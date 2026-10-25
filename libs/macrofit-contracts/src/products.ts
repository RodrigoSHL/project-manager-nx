import { z } from 'zod';

export const barcodeSchema = z
  .string()
  .regex(/^\d{8,14}$/, 'Usa un código de barras de 8 a 14 dígitos.');
export const webSourceSchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    url: z
      .string()
      .max(2048)
      .url()
      .refine((value) => {
        try {
          const url = new URL(value);
          return url.protocol === 'https:' && !url.username && !url.password;
        } catch {
          return false;
        }
      }, 'La fuente debe usar HTTPS.'),
  })
  .strict();
const originalProductSourceSchema = z
  .object({
    kind: z.enum(['manual', 'open_food_facts', 'label']),
    url: z
      .string()
      .regex(/^https:\/\/world\.openfoodfacts\.org\/product\/\d{8,14}$/)
      .optional(),
  })
  .strict();
export const productSourceSchema = z.union([
  originalProductSourceSchema,
  z
    .object({
      kind: z.literal('web_search'),
      sources: z.array(webSourceSchema).min(1).max(5),
    })
    .strict(),
]);

// A draft deliberately distinguishes missing values from a declared zero.
export const productDraftSchema = z
  .object({
    name: z.string().trim().max(200).nullable(),
    brand: z.string().trim().max(150).nullable(),
    barcode: barcodeSchema.nullable(),
    referenceAmount: z.number().finite().positive().max(20000).nullable(),
    referenceUnit: z.enum(['g', 'ml', 'unit', 'scoop', 'cup']).nullable(),
    calories: z.number().finite().min(0).max(100000).nullable(),
    protein: z.number().finite().min(0).max(20000).nullable(),
    carbs: z.number().finite().min(0).max(20000).nullable(),
    fat: z.number().finite().min(0).max(20000).nullable(),
    fiber: z.number().finite().min(0).max(20000).nullable(),
    warnings: z.array(z.string().trim().min(1).max(500)).max(20),
    source: productSourceSchema,
  })
  .strict();
// Search metadata is a preview, not part of a saved food or label transcription.
export const productPreviewSchema = z
  .object({
    description: z.string().trim().max(300).nullable(),
    quantity: z.string().trim().max(100).nullable(),
    categories: z.array(z.string().trim().min(1).max(100)).max(3),
    imageUrl: z
      .string()
      .max(500)
      .regex(
        /^https:\/\/images\.openfoodfacts\.org\/images\/products\/[a-zA-Z0-9_./-]+\.(?:jpg|jpeg|png|webp)$/
      )
      .nullable(),
  })
  .strip();
export const productSearchItemSchema = productDraftSchema
  .extend({
    preview: productPreviewSchema.optional(),
  })
  .strip();
export const productSearchSchema = z
  .object({
    products: z.array(productSearchItemSchema).max(12),
  })
  .strip();
export type ProductDraft = z.infer<typeof productDraftSchema>;
export type ProductSource = z.infer<typeof productSourceSchema>;
export type ProductSearchItem = z.infer<typeof productSearchItemSchema>;

export const webProductSearchInputSchema = z
  .object({
    query: z.string().trim().min(2).max(100),
  })
  .strict();
export const webProductSearchSchema = z
  .object({
    products: z.array(productSearchItemSchema).max(5),
    message: z.string().max(1000),
    // Provider search suggestions are displayed in a scriptless sandbox.
    searchSuggestions: z.string().max(100000).nullable(),
  })
  .strict();
export type WebProductSearch = z.infer<typeof webProductSearchSchema>;
