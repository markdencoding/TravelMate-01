import type {
  DbItineraryItemRow,
  DbItineraryItemInsert,
  DbItineraryItemUpdate,
  DbTripRow,
} from '@/lib/types/database';
import type { ScheduledActivity, ActivityCategory } from '@/types';
import { addDays, parseISO, format, differenceInDays } from 'date-fns';

/**
 * Converts a 12-hour or arbitrary time string to 24-hour 'HH:mm:ss' format.
 * Returns null if input is empty or invalid.
 */
export function timeStringToSqlTime(timeStr?: string | null): string | null {
  if (!timeStr || !timeStr.trim()) return null;
  const s = timeStr.trim();

  // Already 24h format HH:mm or HH:mm:ss
  if (/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(s)) {
    return s.length === 5 ? `${s}:00` : s;
  }

  // 12h format e.g. "09:00 AM" or "9:30 pm"
  const match = s.match(/^(\d{1,2}):([0-5]\d)\s*(am|pm)?$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const modifier = match[3]?.toLowerCase();

    if (modifier === 'pm' && hours < 12) hours += 12;
    if (modifier === 'am' && hours === 12) hours = 0;

    const paddedH = hours.toString().padStart(2, '0');
    return `${paddedH}:${minutes}:00`;
  }

  return null;
}

/**
 * Converts 24h SQL time '09:00:00' to display format '09:00 AM'.
 */
export function sqlTimeToDisplayTime(sqlTime?: string | null): string {
  if (!sqlTime) return '';
  const parts = sqlTime.split(':');
  if (parts.length < 2) return sqlTime;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  const paddedH = hours.toString().padStart(2, '0');
  return `${paddedH}:${minutes} ${ampm}`;
}

/**
 * Maps a database itinerary_items row to the frontend ScheduledActivity model.
 * Currency is strictly inherited from the parent trip.
 */
export function dbActivityToUiActivity(
  row: DbItineraryItemRow,
  tripStartDate: string,
  tripCurrency = 'USD'
): ScheduledActivity {
  let dayNumber = 1;
  try {
    const tripStart = parseISO(tripStartDate);
    const itemDate = parseISO(row.day_date);
    const diff = differenceInDays(itemDate, tripStart);
    dayNumber = Math.max(1, diff + 1);
  } catch {}

  const startTimeDisplay = sqlTimeToDisplayTime(row.start_time);
  const endTimeDisplay = sqlTimeToDisplayTime(row.end_time);

  return {
    id: row.id,
    tripId: row.trip_id,
    dayNumber,
    time: startTimeDisplay || '09:00 AM',
    startTime: startTimeDisplay,
    endTime: endTimeDisplay,
    date: row.day_date,
    title: row.title,
    location: row.location_name || '',
    category: row.category as ActivityCategory,
    duration: startTimeDisplay && endTimeDisplay ? `${startTimeDisplay} - ${endTimeDisplay}` : '2h',
    cost: Number(row.cost) || 0,
    currency: tripCurrency,
    description: row.description || '',
    notes: row.notes || '',
    confirmedRef: row.booking_ref || '',
  };
}

export interface UiActivityFormInput {
  tripId: string;
  dayNumber: number;
  date?: string;
  title: string;
  location?: string;
  category: ActivityCategory;
  startTime?: string;
  endTime?: string;
  cost?: number;
  notes?: string;
  description?: string;
  confirmedRef?: string;
  orderIndex?: number;
}

/**
 * Converts UI activity form inputs into a Supabase DbItineraryItemInsert payload.
 * Enforces parent trip currency and date boundaries.
 */
export function uiActivityToDbInsert(
  input: UiActivityFormInput,
  trip: Pick<DbTripRow, 'id' | 'start_date' | 'end_date' | 'currency'>
): DbItineraryItemInsert {
  let calculatedDate = input.date;
  if (!calculatedDate) {
    try {
      const start = parseISO(trip.start_date);
      const targetDate = addDays(start, Math.max(0, input.dayNumber - 1));
      calculatedDate = format(targetDate, 'yyyy-MM-dd');
    } catch {
      calculatedDate = trip.start_date;
    }
  }

  return {
    trip_id: trip.id,
    day_date: calculatedDate,
    title: input.title.trim(),
    location_name: input.location?.trim() || '',
    category: input.category,
    start_time: timeStringToSqlTime(input.startTime),
    end_time: timeStringToSqlTime(input.endTime),
    cost: Number(input.cost || 0),
    currency: trip.currency,
    notes: input.notes?.trim() || '',
    description: input.description?.trim() || '',
    booking_ref: input.confirmedRef?.trim() || '',
    order_index: input.orderIndex ?? 0,
  };
}

/**
 * Converts UI activity updates to DbItineraryItemUpdate.
 */
export function uiActivityToDbUpdate(
  input: Partial<UiActivityFormInput>,
  tripStartDate?: string
): DbItineraryItemUpdate {
  const payload: DbItineraryItemUpdate = {};

  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.location !== undefined) payload.location_name = input.location.trim();
  if (input.category !== undefined) payload.category = input.category;
  if (input.cost !== undefined) payload.cost = Number(input.cost);
  if (input.notes !== undefined) payload.notes = input.notes.trim();
  if (input.description !== undefined) payload.description = input.description.trim();
  if (input.confirmedRef !== undefined) payload.booking_ref = input.confirmedRef.trim();
  if (input.orderIndex !== undefined) payload.order_index = input.orderIndex;

  if (input.startTime !== undefined) {
    payload.start_time = timeStringToSqlTime(input.startTime);
  }
  if (input.endTime !== undefined) {
    payload.end_time = timeStringToSqlTime(input.endTime);
  }

  if (input.date) {
    payload.day_date = input.date;
  } else if (input.dayNumber !== undefined && tripStartDate) {
    try {
      const start = parseISO(tripStartDate);
      const targetDate = addDays(start, Math.max(0, input.dayNumber - 1));
      payload.day_date = format(targetDate, 'yyyy-MM-dd');
    } catch {}
  }

  return payload;
}
