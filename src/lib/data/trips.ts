import { createClient } from '@/lib/supabase/server';
import { dbTripToUiTrip } from '@/lib/mappers/trips';
import type { DbTripRow } from '@/lib/types/database';
import type { Trip } from '@/types';

export { dbTripToUiTrip, type DbTripRow };

/**
 * Server-side query: fetch all trips for the authenticated user.
 */
export async function getTrips(): Promise<{ data: Trip[]; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: [], error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    const mappedTrips = (data as DbTripRow[]).map((r) => dbTripToUiTrip(r));
    return { data: mappedTrips, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch trips';
    return { data: [], error: message };
  }
}

/**
 * Server-side query: fetch a single trip by ID for the authenticated user.
 */
export async function getTripById(
  tripId: string
): Promise<{ data: Trip | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (error || !data) {
      return { data: null, error: error?.message || 'Trip not found' };
    }

    return { data: dbTripToUiTrip(data as DbTripRow), error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch trip';
    return { data: null, error: message };
  }
}
