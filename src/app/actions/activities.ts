'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  activitySchema,
  activityUpdateSchema,
  type ActivityInput,
  type ActivityUpdateInput,
} from '@/lib/validators/activity';
import {
  dbActivityToUiActivity,
  uiActivityToDbInsert,
  uiActivityToDbUpdate,
} from '@/lib/mappers/activities';
import { formatDatabaseError } from '@/lib/errors';
import type { DbItineraryItemRow, DbTripRow } from '@/lib/types/database';
import type { ScheduledActivity } from '@/types';
import type { ActionResponse } from './trips';

/**
 * Server-side query: get activities for a trip.
 */
export async function getActivitiesForTrip(
  tripId: string
): Promise<{ data: ScheduledActivity[]; error: string | null }> {
  try {
    const supabase = await createClient();

    // Verify trip exists and fetch its start_date & currency
    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .select('id, start_date, end_date, currency')
      .eq('id', tripId)
      .single();

    if (tripErr || !trip) {
      return { data: [], error: 'Trip not found or access denied.' };
    }

    const { data, error } = await supabase
      .from('itinerary_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('day_date', { ascending: true })
      .order('order_index', { ascending: true });

    if (error) {
      return { data: [], error: formatDatabaseError(error) };
    }

    const activities = (data as DbItineraryItemRow[]).map((r) =>
      dbActivityToUiActivity(r, trip.start_date, trip.currency)
    );

    return { data: activities, error: null };
  } catch (err) {
    return { data: [], error: formatDatabaseError(err) };
  }
}

/**
 * Server Action: Create an itinerary activity.
 */
export async function createActivityAction(
  rawInput: ActivityInput
): Promise<ActionResponse<ScheduledActivity>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'You must be signed in to add an activity.' };
    }

    const validation = activitySchema.safeParse(rawInput);
    if (!validation.success) {
      const flattened = validation.error.flatten();
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Validation failed',
        fieldErrors: flattened.fieldErrors,
      };
    }

    const valid = validation.data;

    // Fetch parent trip to enforce currency and dates
    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .select('id, start_date, end_date, currency')
      .eq('id', valid.tripId)
      .eq('user_id', user.id)
      .single();

    if (tripErr || !trip) {
      return { success: false, error: 'Trip not found or you do not have permission.' };
    }

    const insertPayload = uiActivityToDbInsert(valid, trip as DbTripRow);

    const { data, error } = await supabase
      .from('itinerary_items')
      .insert(insertPayload)
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: formatDatabaseError(error, 'Failed to create activity.') };
    }

    revalidatePath('/calendar');
    revalidatePath(`/trips/${valid.tripId}`);

    return {
      success: true,
      data: dbActivityToUiActivity(data as DbItineraryItemRow, trip.start_date, trip.currency),
    };
  } catch (err) {
    return { success: false, error: formatDatabaseError(err) };
  }
}

/**
 * Server Action: Update an activity.
 */
export async function updateActivityAction(
  rawInput: ActivityUpdateInput,
  tripStartDate?: string,
  tripCurrency = 'USD'
): Promise<ActionResponse<ScheduledActivity>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'You must be signed in to update an activity.' };
    }

    const validation = activityUpdateSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Validation failed',
      };
    }

    const { id, ...fields } = validation.data;
    const updatePayload = uiActivityToDbUpdate(fields, tripStartDate);

    const { data, error } = await supabase
      .from('itinerary_items')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: formatDatabaseError(error, 'Failed to update activity.') };
    }

    revalidatePath('/calendar');

    return {
      success: true,
      data: dbActivityToUiActivity(data as DbItineraryItemRow, tripStartDate || '', tripCurrency),
    };
  } catch (err) {
    return { success: false, error: formatDatabaseError(err) };
  }
}

/**
 * Server Action: Delete an activity.
 */
export async function deleteActivityAction(
  activityId: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'You must be signed in to delete an activity.' };
    }

    const { error } = await supabase
      .from('itinerary_items')
      .delete()
      .eq('id', activityId);

    if (error) {
      return { success: false, error: formatDatabaseError(error, 'Failed to delete activity.') };
    }

    revalidatePath('/calendar');
    return { success: true };
  } catch (err) {
    return { success: false, error: formatDatabaseError(err) };
  }
}
