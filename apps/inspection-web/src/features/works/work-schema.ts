import { z } from 'zod';

export const createWorkSchema = z.object({
  workTypeId: z.string().uuid('Selecciona un tipo de trabajo.'),
  title: z
    .string()
    .trim()
    .min(3, 'El título debe tener al menos 3 caracteres.'),
  executionDate: z.string().min(1, 'Selecciona la fecha de ejecución.'),
  responsible: z.string().trim().min(2, 'Ingresa el responsable.'),
  company: z.string().trim().optional(),
  status: z.enum(['DRAFT', 'IN_PROGRESS']),
  notes: z.string().trim().optional(),
});

export type CreateWorkFormValue = z.infer<typeof createWorkSchema>;
