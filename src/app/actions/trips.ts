'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { tripSchema, tripUpdateSchema, type TripInput, type TripUpdateInput } from '@/lib/validators/trip';
import { dbTripToUiTrip, uiTripToDbInsert, uiTripToDbUpdate } from '@/lib/mappers/trips';
import { formatDatabaseError } from '@/lib/errors';
import type { DbTripRow } from '@/lib/types/database';
import type { Trip } from '@/types';

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Server Action: Create a new trip with Zod validation, mapping layer, and error translation.
 */
export async function createTripAction(
  rawInput: TripInput
): Promise<ActionResponse<Trip>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be signed in to create a trip.',
      };
    }

    const validation = tripSchema.safeParse(rawInput);
    if (!validation.success) {
      const flattened = validation.error.flatten();
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Validation failed',
        fieldErrors: flattened.fieldErrors,
      };
    }

    const insertPayload = uiTripToDbInsert(validation.data, user.id);

    let { data, error } = await supabase
      .from('trips')
      .insert(insertPayload)
      .select()
      .single();

    if (error && (error.message?.includes('cover_image_credit') || error.code === '42703')) {
      const fallbackPayload = { ...insertPayload };
      delete (fallbackPayload as any).cover_image_credit;
      delete (fallbackPayload as any).cover_image_credit_url;
      const retry = await supabase.from('trips').insert(fallbackPayload).select().single();
      data = retry.data;
      error = retry.error;
    }

    if (error || !data) {
      return {
        success: false,
        error: formatDatabaseError(error, 'Failed to create trip'),
      };
    }

    const createdTrip = data as DbTripRow;

    // Atomically persist child destinations
    const destItems = validation.data.destinations || [];
    if (destItems.length > 0) {
      const destInserts = destItems.map((d, index) => ({
        trip_id: createdTrip.id,
        name: d.name.trim(),
        country: d.country?.trim() || createdTrip.country || '',
        latitude: d.latitude ?? 0,
        longitude: d.longitude ?? 0,
        order_index: index,
      }));

      const { error: destErr } = await supabase.from('destinations').insert(destInserts);
      if (destErr) {
        console.warn('Failed to insert trip destinations:', destErr);
      }
    }

    revalidatePath('/trips');
    revalidatePath('/dashboard');

    return {
      success: true,
      data: dbTripToUiTrip(createdTrip),
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: formatDatabaseError(err, 'An unexpected error occurred while creating trip'),
    };
  }
}

/**
 * Server Action: Update an existing trip with Zod validation, mapping layer, and error translation.
 */
export async function updateTripAction(
  rawInput: TripUpdateInput
): Promise<ActionResponse<Trip>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be signed in to update a trip.',
      };
    }

    const validation = tripUpdateSchema.safeParse(rawInput);
    if (!validation.success) {
      const flattened = validation.error.flatten();
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Validation failed',
        fieldErrors: flattened.fieldErrors,
      };
    }

    const { id, ...fields } = validation.data;
    const updatePayload = uiTripToDbUpdate(fields);

    let { data, error } = await supabase
      .from('trips')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error && (error.message?.includes('cover_image_credit') || error.code === '42703')) {
      const fallbackPayload = { ...updatePayload };
      delete (fallbackPayload as any).cover_image_credit;
      delete (fallbackPayload as any).cover_image_credit_url;
      const retry = await supabase
        .from('trips')
        .update(fallbackPayload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error || !data) {
      return {
        success: false,
        error: formatDatabaseError(error, 'Failed to update trip or trip not found'),
      };
    }

    const updatedTrip = data as DbTripRow;

    // Sync child destinations if provided
    if (validation.data.destinations !== undefined) {
      const destItems = validation.data.destinations;
      await supabase.from('destinations').delete().eq('trip_id', id);

      if (destItems.length > 0) {
        const destInserts = destItems.map((d, index) => ({
          trip_id: id,
          name: d.name.trim(),
          country: d.country?.trim() || updatedTrip.country || '',
          latitude: d.latitude ?? 0,
          longitude: d.longitude ?? 0,
          order_index: index,
        }));
        const { error: destErr } = await supabase.from('destinations').insert(destInserts);
        if (destErr) {
          console.warn('Failed to update trip destinations:', destErr);
        }
      }
    }

    revalidatePath('/trips');
    revalidatePath(`/trips/${id}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      data: dbTripToUiTrip(updatedTrip),
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: formatDatabaseError(err, 'An unexpected error occurred while updating trip'),
    };
  }
}

/**
 * Server Action: Fetch real destinations for a trip.
 */
export async function getDestinationsForTripAction(
  tripId: string
): Promise<{ success: boolean; data: any[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('destinations')
      .select('id, name, country, latitude, longitude, order_index')
      .eq('trip_id', tripId)
      .order('order_index', { ascending: true });

    if (error) {
      return { success: false, data: [], error: formatDatabaseError(error) };
    }

    const items = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      country: row.country || '',
      latitude: Number(row.latitude) || 0,
      longitude: Number(row.longitude) || 0,
      orderIndex: row.order_index,
    }));

    return { success: true, data: items };
  } catch (err) {
    return { success: false, data: [], error: formatDatabaseError(err) };
  }
}

/**
 * Server Action: Fetch all destinations across all trips for the authenticated user.
 */
export async function getAllUserDestinationsAction(): Promise<{
  success: boolean;
  data: Array<{
    id: string;
    tripId: string;
    name: string;
    country: string;
    latitude: number;
    longitude: number;
    orderIndex: number;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, data: [], error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('destinations')
      .select('id, trip_id, name, country, latitude, longitude, order_index, trips!inner(user_id)')
      .eq('trips.user_id', user.id)
      .order('order_index', { ascending: true });

    if (error) {
      return { success: false, data: [], error: formatDatabaseError(error) };
    }

    const items = (data || []).map((row: any) => ({
      id: row.id,
      tripId: row.trip_id,
      name: row.name,
      country: row.country || '',
      latitude: Number(row.latitude) || 0,
      longitude: Number(row.longitude) || 0,
      orderIndex: row.order_index ?? 0,
    }));

    return { success: true, data: items };
  } catch (err) {
    return { success: false, data: [], error: formatDatabaseError(err) };
  }
}

/**
 * Server Action: Delete a trip ensuring user ownership.
 */
export async function deleteTripAction(
  tripId: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be signed in to delete a trip.',
      };
    }

    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId)
      .eq('user_id', user.id);

    if (error) {
      return {
        success: false,
        error: formatDatabaseError(error, 'Failed to delete trip'),
      };
    }

    revalidatePath('/trips');
    revalidatePath('/dashboard');

    return {
      success: true,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: formatDatabaseError(err, 'An unexpected error occurred while deleting trip'),
    };
  }
}
