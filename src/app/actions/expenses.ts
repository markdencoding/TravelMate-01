'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  expenseSchema,
  expenseUpdateSchema,
  type ExpenseInput,
  type ExpenseUpdateInput,
} from '@/lib/validators/expense';
import {
  dbExpenseToUiExpense,
  uiExpenseToDbInsert,
  uiExpenseToDbUpdate,
} from '@/lib/mappers/expenses';
import { formatDatabaseError } from '@/lib/errors';
import type { DbExpenseRow, DbTripRow } from '@/lib/types/database';
import type { ExpenseItem } from '@/types';
import type { ActionResponse } from './trips';

/**
 * Server-side query: get expenses for a trip.
 */
export async function getExpensesForTrip(
  tripId: string
): Promise<{ data: ExpenseItem[]; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .select('id, start_date, currency')
      .eq('id', tripId)
      .single();

    if (tripErr || !trip) {
      return { data: [], error: 'Trip not found or access denied.' };
    }

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', tripId)
      .order('expense_date', { ascending: true });

    if (error) {
      return { data: [], error: formatDatabaseError(error) };
    }

    const expenses = (data as DbExpenseRow[]).map((r) =>
      dbExpenseToUiExpense(r, trip.start_date)
    );

    return { data: expenses, error: null };
  } catch (err) {
    return { data: [], error: formatDatabaseError(err) };
  }
}

/**
 * Server Action: Create an expense item.
 */
export async function createExpenseAction(
  rawInput: ExpenseInput
): Promise<ActionResponse<ExpenseItem>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'You must be signed in to add an expense.' };
    }

    const validation = expenseSchema.safeParse(rawInput);
    if (!validation.success) {
      const flattened = validation.error.flatten();
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Validation failed',
        fieldErrors: flattened.fieldErrors,
      };
    }

    const valid = validation.data;

    // Fetch parent trip to enforce single-currency rule
    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .select('id, start_date, currency')
      .eq('id', valid.tripId)
      .eq('user_id', user.id)
      .single();

    if (tripErr || !trip) {
      return { success: false, error: 'Trip not found or access denied.' };
    }

    const insertPayload = uiExpenseToDbInsert(valid, trip as DbTripRow);

    const { data, error } = await supabase
      .from('expenses')
      .insert(insertPayload)
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: formatDatabaseError(error, 'Failed to create expense.') };
    }

    revalidatePath('/expenses');
    revalidatePath('/dossier');

    return {
      success: true,
      data: dbExpenseToUiExpense(data as DbExpenseRow, trip.start_date),
    };
  } catch (err) {
    return { success: false, error: formatDatabaseError(err) };
  }
}

/**
 * Server Action: Update an expense.
 */
export async function updateExpenseAction(
  rawInput: ExpenseUpdateInput,
  tripStartDate?: string
): Promise<ActionResponse<ExpenseItem>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'You must be signed in to update an expense.' };
    }

    const validation = expenseUpdateSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Validation failed',
      };
    }

    const { id, ...fields } = validation.data;
    const updatePayload = uiExpenseToDbUpdate(fields, tripStartDate);

    const { data, error } = await supabase
      .from('expenses')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: formatDatabaseError(error, 'Failed to update expense.') };
    }

    revalidatePath('/expenses');

    return {
      success: true,
      data: dbExpenseToUiExpense(data as DbExpenseRow, tripStartDate || ''),
    };
  } catch (err) {
    return { success: false, error: formatDatabaseError(err) };
  }
}

/**
 * Server Action: Delete an expense.
 */
export async function deleteExpenseAction(
  expenseId: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'You must be signed in to delete an expense.' };
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) {
      return { success: false, error: formatDatabaseError(error, 'Failed to delete expense.') };
    }

    revalidatePath('/expenses');
    return { success: true };
  } catch (err) {
    return { success: false, error: formatDatabaseError(err) };
  }
}
