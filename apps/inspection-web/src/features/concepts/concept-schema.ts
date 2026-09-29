import { z } from 'zod';

export const conceptTypes = ['ANALOG', 'DIGITAL', 'TEXT', 'HIDDEN'] as const;

const conceptOptionSchema = z.object({
  value: z.string().trim().min(1, 'Cada opción necesita un valor.'),
  label: z.string().trim().min(1, 'Cada opción necesita una etiqueta.'),
  order: z.number().int().min(1, 'El orden debe comenzar en 1.'),
  active: z.boolean(),
  generatesFinding: z.boolean().optional(),
  suggestedSeverityId: z.string().uuid().nullable().optional(),
});

export const conceptSchema = z
  .object({
    code: z.string().trim().min(1, 'Ingresa un código.').max(80),
    name: z.string().trim().min(1, 'Ingresa un nombre.').max(160),
    description: z.string().trim().max(2000).nullable().optional(),
    type: z.enum(conceptTypes),
    unit: z.string().trim().max(30).nullable().optional(),
    minValue: z.number().finite().nullable().optional(),
    maxValue: z.number().finite().nullable().optional(),
    outOfRangeSeverityId: z.string().uuid().nullable().optional(),
    active: z.boolean(),
    options: z.array(conceptOptionSchema),
  })
  .superRefine((value, context) => {
    if (
      value.type === 'ANALOG' &&
      value.minValue != null &&
      value.maxValue != null &&
      value.minValue > value.maxValue
    ) {
      context.addIssue({
        code: 'custom',
        path: ['maxValue'],
        message: 'El máximo debe ser mayor o igual al mínimo.',
      });
    }
    if (
      value.type === 'ANALOG' &&
      value.outOfRangeSeverityId &&
      value.minValue == null &&
      value.maxValue == null
    ) {
      context.addIssue({
        code: 'custom',
        path: ['outOfRangeSeverityId'],
        message: 'Define un límite antes de sugerir una severidad.',
      });
    }
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
    minValue: value.type === 'ANALOG' ? value.minValue ?? null : null,
    maxValue: value.type === 'ANALOG' ? value.maxValue ?? null : null,
    outOfRangeSeverityId:
      value.type === 'ANALOG' ? value.outOfRangeSeverityId ?? null : null,
    options:
      value.type === 'DIGITAL'
        ? value.options
            .map((option) => ({
              ...option,
              value: normalizeConceptCode(option.value),
              label: option.label.trim(),
              generatesFinding: option.generatesFinding ?? false,
              suggestedSeverityId: option.generatesFinding
                ? option.suggestedSeverityId ?? null
                : null,
            }))
            .sort((a, b) => a.order - b.order)
        : [],
  }));

export function normalizeConceptCode(value: string) {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_');
}

export function suggestConceptCode(value: string) {
  return normalizeConceptCode(value).replace(/^_+|_+$/g, '');
}

export const conceptTypeLabels = {
  ANALOG: 'Analógico',
  DIGITAL: 'Digital',
  TEXT: 'Texto',
  HIDDEN: 'Oculto',
} as const;
