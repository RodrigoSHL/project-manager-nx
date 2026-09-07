import { z } from 'zod';

export const catalogItemSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'El código es obligatorio')
    .max(80, 'El código no puede superar 80 caracteres')
    .regex(
      /^[A-Z0-9]+(?:_[A-Z0-9]+)*$/,
      'Usa mayúsculas, números y guiones bajos'
    ),
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(160, 'El nombre no puede superar 160 caracteres'),
  description: z.string().trim().max(2000).nullable(),
  active: z.boolean(),
});

export type CatalogItemFormValue = z.infer<typeof catalogItemSchema>;

export function normalizeCatalogCode(value: string) {
  return value.toUpperCase().replace(/[\s-]+/g, '_');
}
