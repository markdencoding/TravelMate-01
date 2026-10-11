import { z } from 'zod';
import { ACTIVITY_CATEGORIES } from '@/lib/constants/categories';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const activityBaseSchema = z.object({
  tripId: z.string().uuid().or(z.string().min(1)),
  dayNumber: z.number().int().min(1).default(1),
  date: z.string().regex(DATE_REGEX).optional(),
  title: z
    .string()
    .trim()
    .min(1, 'Activity title is required')
    .max(120, 'Title cannot exceed 120 characters'),
  location: z.string().trim().optional().default(''),
  category: z.enum(ACTIVITY_CATEGORIES).default('sightseeing'),
  startTime: z.string().trim().optional(),
  endTime: z.string().trim().optional(),
  cost: z
    .number({ invalid_type_error: 'Cost must be a valid number' })
    .min(0, 'Cost must be non-negative')
    .default(0),
  notes: z.string().trim().optional().default(''),
  description: z.string().trim().optional().default(''),
  confirmedRef: z.string().trim().optional().default(''),
});

export const activitySchema = activityBaseSchema;
export type ActivityInput = z.input<typeof activitySchema>;

export const activityUpdateSchema = activityBaseSchema.partial().extend({
  id: z.string().uuid().or(z.string().min(1)),
});
export type ActivityUpdateInput = z.infer<typeof activityUpdateSchema>;
