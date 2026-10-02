import { z } from 'zod';

export const formTemplateSchema = z.object({
  name: z.string().trim().min(1, 'Ingresa el nombre del formulario.').max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  active: z.boolean(),
});

export const formSectionSchema = z.object({
  title: z.string().trim().min(1, 'Ingresa el título de la sección.').max(160),
  description: z.string().trim().max(1000).nullable().optional(),
});

export const formItemSchema = z
  .object({
    type: z.enum(['CONCEPT', 'TASK']),
    title: z.string().trim().max(160).nullable().optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    conceptId: z.string().uuid().nullable().optional(),
    required: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.type === 'TASK' && !value.title?.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['title'],
        message: 'La tarea necesita un título.',
      });
    }
    if (value.type === 'CONCEPT' && !value.conceptId) {
      context.addIssue({
        code: 'custom',
        path: ['conceptId'],
        message: 'Selecciona un concepto.',
      });
    }
  })
  .transform((value) => ({
    ...value,
    title: value.type === 'TASK' ? value.title?.trim() || null : null,
    description: value.description?.trim() || null,
    conceptId: value.type === 'CONCEPT' ? value.conceptId : null,
  }));
