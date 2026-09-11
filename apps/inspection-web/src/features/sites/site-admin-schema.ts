import { z } from 'zod';

export const siteAdminSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'El código es obligatorio')
    .max(40, 'El código no puede superar 40 caracteres')
    .regex(
      /^[A-Z0-9]+(?:_[A-Z0-9]+)*$/,
      'Usa mayúsculas, números y guiones bajos'
    ),
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(160, 'El nombre no puede superar 160 caracteres'),
  type: z.enum(['MINE', 'PLANT', 'SITE']),
  active: z.boolean(),
});

export type SiteAdminFormValue = z.infer<typeof siteAdminSchema>;

export function normalizeSiteCode(value: string) {
  return value.toUpperCase().replace(/[\s-]+/g, '_');
}
