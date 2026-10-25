import { z } from 'zod';
import {
  FoodItem,
  NutritionPlan,
  pautaRuleSchema,
} from '@project-manager/macrofit-contracts';

// Only nutrition facts and plan references are sent, never account/profile data.
export type EquivalenceProposalFood = Pick<
  FoodItem,
  'id' | 'name' | 'brand'
> & { preparation?: string } & Partial<
    Pick<
      FoodItem,
      | 'servingSizeGrams'
      | 'quantityUnit'
      | 'calories'
      | 'protein'
      | 'carbs'
      | 'fat'
    >
  >;
export type EquivalenceProposalInput = {
  source?: 'product' | 'recorded-meal';
  food: Omit<EquivalenceProposalFood, 'id'>;
  targets: NutritionPlan['targets'];
  references: Array<
    Pick<
      NutritionPlan['rules'][number],
      'name' | 'referenceAmount' | 'unit' | 'contributions' | 'free'
    >
  >;
};

export const equivalenceProposalSchema = z
  .object({
    proposal: z
      .object({
        referenceAmount: z.number().finite().positive().max(20000),
        unit: z.enum(['g', 'ml', 'unit', 'scoop', 'cup']),
        free: z.boolean(),
        contributions: z
          .array(
            z
              .object({
                group: z.enum([
                  'protein',
                  'carbs',
                  'fats',
                  'dairy',
                  'fruits',
                  'veggies',
                  'supplements',
                ]),
                portions: z.number().finite().positive().max(1000),
              })
              .strict()
          )
          .max(7),
        confidence: z.enum(['medium', 'low']),
        explanation: z.string().trim().min(1).max(800),
        uncertainty: z.string().trim().min(1).max(800),
        assumptions: z.array(z.string().trim().min(1).max(500)).min(1).max(5),
      })
      .strict()
      .nullable(),
    missingInfo: z.array(z.string().trim().min(1).max(500)).max(5),
  })
  .strict()
  .refine((result) => {
    if (!result.proposal) return result.missingInfo.length > 0;
    return pautaRuleSchema.safeParse({
      referenceAmount: result.proposal.referenceAmount,
      unit: result.proposal.unit,
      free: result.proposal.free,
      contributions: result.proposal.contributions,
      id: 'estimate',
      name: 'Estimate',
      foodIds: [],
      aliases: [],
      notes: '',
    }).success;
  });
export type EquivalenceProposal = z.infer<typeof equivalenceProposalSchema>;
