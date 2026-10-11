import { z } from 'zod';

const CURRENCY_REGEX = /^[A-Z]{3}$/;

export const profileUpdateSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(100, 'Display name cannot exceed 100 characters')
    .optional(),
  bio: z
    .string()
    .trim()
    .max(500, 'Bio cannot exceed 500 characters')
    .optional(),
  avatarUrl: z.string().url().or(z.string().trim()).optional(),
  currency: z
    .string()
    .trim()
    .transform((val) => val.toUpperCase())
    .refine((val) => CURRENCY_REGEX.test(val), {
      message: 'Currency must be a 3-letter uppercase code (e.g. USD, EUR, JPY)',
    })
    .optional(),
  measurementUnits: z.enum(['metric', 'imperial']).optional(),
  dateFormat: z
    .enum(['YYYY-MM-DD', 'MMM DD, YYYY', 'DD/MM/YYYY'])
    .optional(),
  timeFormat: z.enum(['12', '24']).optional(),
  notificationsEnabled: z.boolean().optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
