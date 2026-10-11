import { z } from 'zod';

/**
 * ISO 8601 Date regex: YYYY-MM-DD
 */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 3-letter uppercase ISO currency code
 */
const CURRENCY_REGEX = /^[A-Z]{3}$/;

export const destinationItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Destination name cannot be empty'),
  country: z.string().trim().optional().default(''),
  latitude: z.number().min(-90).max(90).optional().default(0),
  longitude: z.number().min(-180).max(180).optional().default(0),
  orderIndex: z.number().optional().default(0),
});

export type DestinationItem = z.infer<typeof destinationItemSchema>;

export const tripBaseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Trip title is required')
    .max(60, 'Title cannot exceed 60 characters'),
  destinations: z.array(destinationItemSchema).optional().default([]),
  destinationRegion: z.string().trim().optional().default(''),
  country: z.string().trim().optional().default(''),
  startDate: z
    .string()
    .regex(DATE_REGEX, 'Start date must be formatted as YYYY-MM-DD'),
  endDate: z
    .string()
    .regex(DATE_REGEX, 'End date must be formatted as YYYY-MM-DD'),
  budget: z
    .number({ invalid_type_error: 'Budget must be a valid number' })
    .min(0, 'Budget must be non-negative')
    .optional(),
  budgetAmount: z
    .number({ invalid_type_error: 'Budget amount must be a valid number' })
    .min(0, 'Budget amount must be non-negative')
    .optional(),
  currency: z
    .string()
    .trim()
    .transform((val) => val.toUpperCase())
    .refine((val) => CURRENCY_REGEX.test(val), {
      message: 'Currency must be a 3-letter uppercase code (e.g. PHP, USD, EUR)',
    })
    .default('PHP'),
  notes: z.string().trim().optional().default(''),
  coverImage: z.string().url().or(z.string().trim()).optional().default(''),
  coverImageAlt: z.string().trim().optional().default(''),
  coverImageCredit: z.string().trim().optional().default(''),
  coverImageCreditUrl: z.string().url().or(z.string().trim()).optional().default(''),
  privacy: z.enum(['collaborative', 'private']).optional().default('collaborative'),
  status: z.enum(['planned', 'ongoing', 'completed']).optional().default('planned'),
});

export const tripSchema = tripBaseSchema.refine(
  (data) => {
    // TM-3: End date cannot be before start date
    return data.endDate >= data.startDate;
  },
  {
    message: 'End date cannot be before start date',
    path: ['endDate'],
  }
);

export type TripInput = z.input<typeof tripSchema>;

export const tripUpdateSchema = tripBaseSchema
  .partial()
  .extend({
    id: z.string().uuid().or(z.string().min(1)),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date cannot be before start date',
      path: ['endDate'],
    }
  );

export type TripUpdateInput = z.input<typeof tripUpdateSchema>;
