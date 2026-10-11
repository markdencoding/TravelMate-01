import { z } from 'zod';
import { EXPENSE_CATEGORIES } from '@/lib/constants/categories';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const expenseBaseSchema = z.object({
  tripId: z.string().uuid().or(z.string().min(1)),
  title: z
    .string()
    .trim()
    .min(1, 'Expense title is required')
    .max(120, 'Title cannot exceed 120 characters'),
  category: z
    .string()
    .trim()
    .transform((val) => (val.toLowerCase() === 'transit' ? 'transport' : val.toLowerCase()))
    .pipe(z.enum(EXPENSE_CATEGORIES))
    .default('food'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a valid number' })
    .min(0, 'Amount must be non-negative'),
  dayNumber: z.number().int().min(1).optional().default(1),
  expenseDate: z.string().regex(DATE_REGEX).optional(),
  paymentStatus: z.string().trim().optional().default('estimated'),
  notes: z.string().trim().optional().default(''),
  description: z.string().trim().optional().default(''),
  itineraryItemId: z.string().uuid().nullable().optional(),
});

export const expenseSchema = expenseBaseSchema;
export type ExpenseInput = z.input<typeof expenseSchema>;

export const expenseUpdateSchema = expenseBaseSchema.partial().extend({
  id: z.string().uuid().or(z.string().min(1)),
});
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>;
