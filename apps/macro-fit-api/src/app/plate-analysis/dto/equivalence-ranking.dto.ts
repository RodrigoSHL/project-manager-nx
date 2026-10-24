import { z } from 'zod';

export type EquivalenceRankingInput = {
  food: { name: string; brand?: string };
  references: Array<{
    key: string;
    name: string;
    aliases: string[];
    unit: string;
    free: boolean;
  }>;
};
// The model can select existing references, never invent a quantity or group.
export const equivalenceRankingSchema = z
  .object({
    candidates: z
      .array(
        z
          .object({
            key: z.string().min(1).max(120),
            confidence: z.enum(['medium', 'low']),
            explanation: z.string().min(1).max(800),
            uncertainty: z.string().min(1).max(800),
          })
          .strict()
      )
      .max(5),
    missingInfo: z.array(z.string().min(1).max(500)).max(5),
  })
  .strict()
  .refine(
    (result) =>
      new Set(result.candidates.map((item) => item.key)).size ===
      result.candidates.length
  );
export type EquivalenceRanking = z.infer<typeof equivalenceRankingSchema>;
