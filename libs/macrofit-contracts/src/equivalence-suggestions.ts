import { z } from 'zod';
import { identifierSchema, pautaRuleSchema } from './schemas';

export const equivalenceSuggestionRequestSchema = z
  .object({
    productId: identifierSchema.optional(),
    dayPlanVersion: z.number().int().positive(),
    catalogPlanVersion: z.number().int().positive(),
    useAi: z.boolean(),
    mode: z.enum(['compare', 'estimate']).optional(),
    preparation: z.string().trim().max(800).optional(),
  })
  .strict()
  .refine(
    (input) => input.mode !== 'estimate' || input.useAi,
    'Pide la propuesta con IA de forma explícita'
  );
export type EquivalenceSuggestionRequest = z.infer<
  typeof equivalenceSuggestionRequestSchema
>;

export const productSuggestionRequestSchema = z
  .object({
    catalogPlanVersion: z.number().int().positive().nullable(),
    useAi: z.boolean(),
    mode: z.enum(['compare', 'estimate']).optional(),
  })
  .strict()
  .refine(
    (input) => input.mode !== 'estimate' || input.useAi,
    'Pide la propuesta con IA de forma explícita'
  );
export type ProductSuggestionRequest = z.infer<
  typeof productSuggestionRequestSchema
>;
export const equivalenceSuggestionsSchema = z
  .object({
    status: z.enum(['suggestions', 'insufficient']),
    source: z.enum(['saved', 'ai', 'reference']),
    message: z.string().min(1).max(1000),
    missingInfo: z.array(z.string().min(1).max(500)).max(5),
    suggestions: z
      .array(
        z
          .object({
            key: z.string().min(1).max(120),
            origin: z.enum(['day', 'catalog', 'estimate']),
            match: z.enum(['exact', 'related', 'ai', 'estimated']),
            confidence: z.enum(['high', 'medium', 'low']),
            explanation: z.string().min(1).max(800),
            uncertainty: z.string().max(800),
            rule: pautaRuleSchema,
            evidence: z
              .object({
                method: z.enum(['reference', 'model']),
                assumptions: z.array(z.string().min(1).max(500)).max(5),
                sources: z
                  .array(
                    z
                      .object({
                        title: z.string().min(1).max(200),
                        url: z.string().url().startsWith('https://').max(1000),
                      })
                      .strict()
                  )
                  .max(3),
              })
              .strict()
              .optional(),
          })
          .strict()
      )
      .max(5),
    basis: z
      .object({
        mealId: identifierSchema.nullable(),
        productId: identifierSchema.nullable(),
        dayPlanVersion: z.number().int().positive().nullable(),
        catalogPlanVersion: z.number().int().positive().nullable(),
      })
      .strict(),
  })
  .strict()
  .refine((result) =>
    result.status === 'suggestions'
      ? result.suggestions.length > 0
      : result.suggestions.length === 0
  )
  .refine(
    (result) =>
      result.suggestions.every(
        (suggestion) =>
          suggestion.origin !== 'estimate' ||
          (suggestion.match === 'estimated' &&
            suggestion.confidence !== 'high' &&
            !!suggestion.evidence &&
            suggestion.evidence.assumptions.length > 0)
      ),
    'Las propuestas nuevas requieren fundamento y supuestos explícitos'
  );
export type EquivalenceSuggestions = z.infer<
  typeof equivalenceSuggestionsSchema
>;
