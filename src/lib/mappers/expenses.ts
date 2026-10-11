import type {
  DbExpenseRow,
  DbExpenseInsert,
  DbExpenseUpdate,
  DbTripRow,
} from '@/lib/types/database';
import type { ExpenseItem, ExpenseCategory } from '@/types';
import { addDays, parseISO, format, differenceInDays } from 'date-fns';

/**
 * Normalizes UI category input to database check constraint category.
 * Translates legacy UI 'transit' to database 'transport'.
 */
export function normalizeExpenseCategory(cat: string): ExpenseCategory {
  const lower = cat.toLowerCase();
  if (lower === 'transit') return 'transport';
  const valid: ExpenseCategory[] = [
    'food',
    'activities',
    'transport',
    'lodging',
    'misc',
    'dining',
    'sightseeing',
  ];
  return valid.includes(lower as ExpenseCategory) ? (lower as ExpenseCategory) : 'misc';
}

/**
 * Maps database payment_status check constraint to human-friendly UI label.
 */
export function dbPaymentStatusToUi(status: string): string {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'Paid in Full';
    case 'deposit':
      return 'Deposit / Cash Reserved';
    case 'planned':
      return 'Pre-booked Online';
    case 'reconciled':
      return 'Reconciled';
    case 'estimated':
    default:
      return 'Planned / Estimated';
  }
}

/**
 * Maps UI payment status string to database check constraint payment_status.
 */
export function uiPaymentStatusToDb(uiStatus?: string): string {
  if (!uiStatus) return 'estimated';
  const lower = uiStatus.toLowerCase();
  if (lower.includes('paid')) return 'paid';
  if (lower.includes('deposit') || lower.includes('cash reserved')) return 'deposit';
  if (lower.includes('pre-booked') || lower.includes('online')) return 'planned';
  if (lower.includes('reconcil')) return 'reconciled';
  return 'estimated';
}

/**
 * Maps a Supabase expenses table row to the frontend ExpenseItem interface.
 */
export function dbExpenseToUiExpense(
  row: DbExpenseRow,
  tripStartDate: string,
  exchangeRateToJpy = 154.2
): ExpenseItem {
  let dayNumber = 1;
  let dayLabel = 'Day 1';
  let dateStr = row.expense_date;

  try {
    const tripStart = parseISO(tripStartDate);
    const expDate = parseISO(row.expense_date);
    const diff = differenceInDays(expDate, tripStart);
    dayNumber = Math.max(1, diff + 1);
    dayLabel = `Day ${dayNumber}`;
    dateStr = format(expDate, 'MMM d');
  } catch {}

  const amountNum = Number(row.amount) || 0;
  const isJpy = row.currency === 'JPY';
  const costUsd = isJpy ? Number((amountNum / exchangeRateToJpy).toFixed(2)) : amountNum;
  const costJpy = isJpy ? amountNum : Math.round(amountNum * exchangeRateToJpy);

  return {
    id: row.id,
    tripId: row.trip_id,
    title: row.title,
    subtitle: row.description || `${row.category.toUpperCase()} expense`,
    category: row.category as ExpenseCategory,
    paymentStatus: dbPaymentStatusToUi(row.payment_status),
    costUsd,
    costJpy,
    amount: amountNum,
    dateStr,
    dayLabel,
    dayNumber,
    notes: row.notes || '',
  };
}

export interface UiExpenseFormInput {
  tripId: string;
  title: string;
  category: string;
  amount: number;
  dayNumber?: number;
  expenseDate?: string;
  paymentStatus?: string;
  notes?: string;
  description?: string;
  itineraryItemId?: string | null;
}

/**
 * Converts UI expense form inputs into a Supabase DbExpenseInsert payload.
 * Enforces parent trip currency and category constraints.
 */
export function uiExpenseToDbInsert(
  input: UiExpenseFormInput,
  trip: Pick<DbTripRow, 'id' | 'start_date' | 'currency'>
): DbExpenseInsert {
  let calculatedDate = input.expenseDate;
  if (!calculatedDate) {
    try {
      const start = parseISO(trip.start_date);
      const targetDate = addDays(start, Math.max(0, (input.dayNumber || 1) - 1));
      calculatedDate = format(targetDate, 'yyyy-MM-dd');
    } catch {
      calculatedDate = trip.start_date;
    }
  }

  return {
    trip_id: trip.id,
    title: input.title.trim(),
    category: normalizeExpenseCategory(input.category),
    amount: Number(input.amount || 0),
    currency: trip.currency,
    expense_date: calculatedDate,
    payment_status: uiPaymentStatusToDb(input.paymentStatus),
    notes: input.notes?.trim() || '',
    description: input.description?.trim() || '',
    itinerary_item_id: input.itineraryItemId || null,
  };
}

/**
 * Converts UI expense updates into DbExpenseUpdate.
 */
export function uiExpenseToDbUpdate(
  input: Partial<UiExpenseFormInput>,
  tripStartDate?: string
): DbExpenseUpdate {
  const payload: DbExpenseUpdate = {};

  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.category !== undefined) payload.category = normalizeExpenseCategory(input.category);
  if (input.amount !== undefined) payload.amount = Number(input.amount);
  if (input.notes !== undefined) payload.notes = input.notes.trim();
  if (input.description !== undefined) payload.description = input.description.trim();
  if (input.paymentStatus !== undefined) payload.payment_status = uiPaymentStatusToDb(input.paymentStatus);
  if (input.itineraryItemId !== undefined) payload.itinerary_item_id = input.itineraryItemId;

  if (input.expenseDate) {
    payload.expense_date = input.expenseDate;
  } else if (input.dayNumber !== undefined && tripStartDate) {
    try {
      const start = parseISO(tripStartDate);
      const targetDate = addDays(start, Math.max(0, input.dayNumber - 1));
      payload.expense_date = format(targetDate, 'yyyy-MM-dd');
    } catch {}
  }

  return payload;
}
