import { differenceInCalendarDays, eachDayOfInterval, format, isValid, parseISO } from 'date-fns';

/**
 * Validates whether end date is greater than or equal to start date.
 */
export function isValidDateRange(startDate: string, endDate: string): boolean {
  if (!startDate || !endDate) return false;
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  if (!isValid(start) || !isValid(end)) return false;
  return endDate >= startDate;
}

/**
 * Calculates total inclusive days between start date and end date.
 * e.g. 2026-10-12 to 2026-10-14 = 3 days.
 */
export function calculateDaysCount(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 1;
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  if (!isValid(start) || !isValid(end)) return 1;

  const diff = differenceInCalendarDays(end, start);
  return diff >= 0 ? diff + 1 : 1;
}

/**
 * Formats a start and end date into human-readable range.
 * e.g. "Oct 12 – Oct 24, 2026"
 */
export function formatDateRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return '';
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  if (!isValid(start) || !isValid(end)) {
    return `${startDate} – ${endDate}`;
  }

  const startYear = format(start, 'yyyy');
  const endYear = format(end, 'yyyy');

  if (startYear === endYear) {
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  }

  return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
}

/**
 * Returns an array of YYYY-MM-DD strings for each day in interval.
 */
export function getDatesBetween(startDate: string, endDate: string): string[] {
  if (!startDate || !endDate) return [];
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  if (!isValid(start) || !isValid(end) || end < start) return [];

  const days = eachDayOfInterval({ start, end });
  return days.map((day) => format(day, 'yyyy-MM-dd'));
}
