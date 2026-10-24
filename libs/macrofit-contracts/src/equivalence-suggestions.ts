import { z } from 'zod';
import { identifierSchema, pautaRuleSchema } from './schemas';

export const equivalenceSuggestionRequestSchema = z
  .object({
    productId: identifierSchema.optional(),
    dayPlanVersion: z.number().int().positive(),
    catalogPlanVersion: z.number().int().positive(),
    useAi: z.boolean(),
  })
  .strict();
export type EquivalenceSuggestionRequest = z.infer<
  typeof equivalenceSuggestionRequestSchema
>;

export const productSuggestionRequestSchema = z
  .object({
    catalogPlanVersion: z.number().int().positive().nullable(),
    useAi: z.boolean(),
  })
  .strict();
export type ProductSuggestionRequest = z.infer<
  typeof productSuggestionRequestSchema
>;
export const equivalenceSuggestionsSchema = z
  .object({
    status: z.enum(['suggestions', 'insufficient']),
    source: z.enum(['saved', 'ai']),
    message: z.string().min(1).max(1000),
    missingInfo: z.array(z.string().min(1).max(500)).max(5),
    suggestions: z
      .array(
        z
          .object({
            key: z.string().min(1).max(120),
            origin: z.enum(['day', 'catalog']),
            match: z.enum(['exact', 'related', 'ai']),
            confidence: z.enum(['high', 'medium', 'low']),
            explanation: z.string().min(1).max(800),
            uncertainty: z.string().max(800),
            rule: pautaRuleSchema,
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
  );
export type EquivalenceSuggestions = z.infer<
  typeof equivalenceSuggestionsSchema
>;
