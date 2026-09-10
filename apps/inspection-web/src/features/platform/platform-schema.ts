import { z } from 'zod';

export const platformTenantSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'El código es obligatorio')
    .max(50, 'El código no puede superar 50 caracteres')
    .regex(
      /^[A-Z0-9]+(?:_[A-Z0-9]+)*$/,
      'Usa mayúsculas, números y guiones bajos'
    ),
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(160, 'El nombre no puede superar 160 caracteres'),
  active: z.boolean(),
});

export type PlatformTenantFormValue = z.infer<typeof platformTenantSchema>;

export function normalizeTenantCode(value: string) {
  return value.toUpperCase().replace(/[\s-]+/g, '_');
}
