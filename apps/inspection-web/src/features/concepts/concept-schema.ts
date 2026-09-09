import { z } from 'zod';

export const conceptTypes = ['ANALOG', 'DIGITAL', 'TEXT', 'HIDDEN'] as const;

const conceptOptionSchema = z.object({
  value: z.string().trim().min(1, 'Cada opción necesita un valor.'),
  label: z.string().trim().min(1, 'Cada opción necesita una etiqueta.'),
  order: z.number().int().min(1, 'El orden debe comenzar en 1.'),
  active: z.boolean(),
});

export const conceptSchema = z
  .object({
    code: z.string().trim().min(1, 'Ingresa un código.').max(80),
    name: z.string().trim().min(1, 'Ingresa un nombre.').max(160),
    description: z.string().trim().max(2000).nullable().optional(),
    type: z.enum(conceptTypes),
    unit: z.string().trim().max(30).nullable().optional(),
    active: z.boolean(),
    options: z.array(conceptOptionSchema),
  })
  .superRefine((value, context) => {
    if (value.type === 'DIGITAL' && value.options.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Un concepto digital necesita al menos una opción.',
      });
    }

    const normalizedValues = value.options.map((option) =>
      normalizeConceptCode(option.value)
    );
    if (new Set(normalizedValues).size !== normalizedValues.length) {
      context.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Los valores de las opciones no pueden repetirse.',
      });
    }
  })
  .transform((value) => ({
    ...value,
    code: normalizeConceptCode(value.code),
    description: value.description?.trim() || null,
    unit: value.type === 'ANALOG' ? value.unit?.trim() || null : null,
    options:
      value.type === 'DIGITAL'
        ? value.options
            .map((option) => ({
              ...option,
              value: normalizeConceptCode(option.value),
              label: option.label.trim(),
            }))
            .sort((a, b) => a.order - b.order)
        : [],
  }));

export function normalizeConceptCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

export const conceptTypeLabels = {
  ANALOG: 'Analógico',
  DIGITAL: 'Digital',
  TEXT: 'Texto',
  HIDDEN: 'Oculto',
} as const;
