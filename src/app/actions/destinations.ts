'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  addDestinationSchema,
  AddDestinationInput,
  DestinationItem,
} from '@/lib/validators/destination';
import { formatDatabaseError } from '@/lib/errors';
import type { ActionResponse } from './trips';

/**
 * Server Action: Add a destination to a trip with ownership verification,
 * Zod validation, and duplicate prevention.
 */
export async function addDestinationAction(
  rawInput: AddDestinationInput
): Promise<ActionResponse<DestinationItem>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      if (process.env.NODE_ENV === 'production') {
        return {
          success: false,
          error: 'You must be signed in to add destinations.',
        };
      }
    }

    const validation = addDestinationSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Invalid destination input',
      };
    }

    const { tripId, name, country, latitude, longitude } = validation.data;

    // 1. Ownership check: verify user owns this trip
    let tripQuery = supabase
      .from('trips')
      .select('id')
      .eq('id', tripId);

    if (user) {
      tripQuery = tripQuery.eq('user_id', user.id);
    }

    const { data: trip, error: tripError } = await tripQuery.single();


    if (tripError || !trip) {
      return {
        success: false,
        error: 'Trip not found or unauthorized.',
      };
    }

    // 2. Duplicate check: prevent adding the exact same place twice to this trip
    // Compare matching name or near-identical coordinates (< 0.0005 deg ~= 50 meters)
    const { data: existingDestinations, error: checkError } = await supabase
      .from('destinations')
      .select('id, name, latitude, longitude')
      .eq('trip_id', tripId);

    if (checkError) {
      return {
        success: false,
        error: formatDatabaseError(checkError, 'Failed to check existing destinations'),
      };
    }

    const isDuplicate = existingDestinations?.some((dest) => {
      const nameMatches = dest.name.trim().toLowerCase() === name.trim().toLowerCase();
      const coordsMatch =
        dest.latitude !== null &&
        dest.longitude !== null &&
        Math.abs(Number(dest.latitude) - latitude) < 0.0005 &&
        Math.abs(Number(dest.longitude) - longitude) < 0.0005;
      return nameMatches || coordsMatch;
    });

    if (isDuplicate) {
      return {
        success: false,
        error: `"${name}" is already added to this trip.`,
      };
    }

    // 3. Determine order_index (highest existing index + 1)
    const nextOrderIndex = existingDestinations && existingDestinations.length > 0
      ? Math.max(...existingDestinations.map((d: any) => d.order_index ?? 0)) + 1
      : 0;

    // 4. Insert into destinations table
    const { data: inserted, error: insertError } = await supabase
      .from('destinations')
      .insert({
        trip_id: tripId,
        name,
        country,
        latitude,
        longitude,
        order_index: nextOrderIndex,
      })
      .select()
      .single();

    if (insertError || !inserted) {
      return {
        success: false,
        error: formatDatabaseError(insertError, 'Failed to save destination'),
      };
    }

    revalidatePath('/explore');
    revalidatePath('/trips');
    revalidatePath(`/trips/${tripId}`);

    const destinationItem: DestinationItem = {
      id: inserted.id,
      tripId: inserted.trip_id,
      name: inserted.name,
      country: inserted.country || '',
      latitude: Number(inserted.latitude),
      longitude: Number(inserted.longitude),
      orderIndex: inserted.order_index,
      arrivalDate: inserted.arrival_date,
      departureDate: inserted.departure_date,
      createdAt: inserted.created_at,
    };

    return {
      success: true,
      data: destinationItem,
    };
  } catch (err: any) {
    console.error('addDestinationAction unexpected error:', err);
    return {
      success: false,
      error: 'An unexpected error occurred while saving destination.',
    };
  }
}
