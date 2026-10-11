/**
 * Database CHECK constraint aligned payment status constants.
 */

export const PAYMENT_STATUSES = [
  'paid',
  'deposit',
  'estimated',
  'planned',
  'reconciled',
] as const;

export type DbPaymentStatus = (typeof PAYMENT_STATUSES)[number];
