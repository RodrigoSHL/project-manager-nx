import { z } from 'zod';

export const barcodeSchema = z
  .string()
  .regex(/^\d{8,14}$/, 'Usa un código de barras de 8 a 14 dígitos.');
export const productSourceSchema = z
  .object({
    kind: z.enum(['manual', 'open_food_facts', 'label']),
    url: z
      .string()
      .regex(/^https:\/\/world\.openfoodfacts\.org\/product\/\d{8,14}$/)
      .optional(),
  })
  .strict();

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
export const productSearchSchema = z
  .object({
    products: z.array(productDraftSchema).max(12),
  })
  .strict();
export type ProductDraft = z.infer<typeof productDraftSchema>;
export type ProductSource = z.infer<typeof productSourceSchema>;
