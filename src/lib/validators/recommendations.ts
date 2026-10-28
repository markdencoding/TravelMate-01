import { z } from 'zod';
import { placeCategoryEnum } from './places';

export const recommendationCategoryFilterEnum = z.enum([
  'all',
  ...placeCategoryEnum.options,
]);

export type RecommendationCategoryFilter = z.infer<typeof recommendationCategoryFilterEnum>;

export const travelerRecommendationsQuerySchema = z.object({
  country: z
    .string()
    .trim()
    .max(80, 'Country filter must be 80 characters or fewer')
    .default('all'),
  category: recommendationCategoryFilterEnum.default('all'),
});

export type TravelerRecommendationsQuery = z.infer<typeof travelerRecommendationsQuerySchema>;

