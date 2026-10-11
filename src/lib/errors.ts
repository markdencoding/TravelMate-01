/**
 * Maps PostgreSQL and Supabase errors (check constraints, triggers, RLS, foreign keys)
 * to user-friendly messages for toasts and form errors.
 */

export interface DbErrorLike {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

export function formatDatabaseError(error: unknown, fallbackMessage = 'An unexpected error occurred'): string {
  if (!error) return fallbackMessage;

  const err = error as DbErrorLike;
  const msg = (err.message || '').toLowerCase();
  const code = err.code || '';

  // Trigger: Date contraction guard
  if (msg.includes('contraction') || msg.includes('guard_trip_date_changes') || msg.includes('past existing activity')) {
    return 'Cannot shorten trip dates because existing scheduled activities fall outside the new date range. Move or delete those activities first.';
  }

  // Trigger: Activity date within trip date range
  if (msg.includes('validate_itinerary_item_dates') || msg.includes('day_date must fall within')) {
    return 'Activity date must fall between the trip start date and end date.';
  }

  // Check constraint: check_trip_dates
  if (msg.includes('check_trip_dates') || (msg.includes('end_date') && msg.includes('start_date'))) {
    return 'Trip end date cannot be earlier than the start date.';
  }

  // Check constraint: check_item_times
  if (msg.includes('check_item_times') || (msg.includes('end_time') && msg.includes('start_time'))) {
    return 'Activity end time cannot be earlier than start time.';
  }

  // Trigger / Check: Self-promotion / Unauthorized privilege escalation
  if (code === 'P0001' && (msg.includes('unauthorized') || msg.includes('administrator'))) {
    return 'Permission denied: Only active administrators can modify roles or account activation status.';
  }

  // RLS / Insufficient privilege
  if (code === '42501' || msg.includes('permission denied') || msg.includes('row-level security')) {
    return 'You do not have permission to modify or access this record.';
  }

  // Unique constraint violation
  if (code === '23505' || msg.includes('unique constraint') || msg.includes('already exists')) {
    return 'A record with these unique details already exists.';
  }

  // Foreign key violation
  if (code === '23503' || msg.includes('foreign key constraint')) {
    return 'Referenced record was not found or belongs to another journey.';
  }

  // Negative amount check
  if (msg.includes('amount >= 0') || msg.includes('cost >= 0') || msg.includes('budget_amount >= 0')) {
    return 'Monetary amounts cannot be negative.';
  }

  // Return clean message if available without raw SQL metadata
  if (err.message && !err.message.includes('CONTEXT:')) {
    return err.message;
  }

  return fallbackMessage;
}
