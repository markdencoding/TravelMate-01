import { describe, it, expect } from 'vitest';
import {
  dbTripToUiTrip,
  uiTripToDbInsert,
  uiTripToDbUpdate,
} from '@/lib/mappers/trips';
import {
  dbActivityToUiActivity,
  uiActivityToDbInsert,
  timeStringToSqlTime,
  sqlTimeToDisplayTime,
} from '@/lib/mappers/activities';
import {
  dbExpenseToUiExpense,
  uiExpenseToDbInsert,
  normalizeExpenseCategory,
  dbPaymentStatusToUi,
  uiPaymentStatusToDb,
} from '@/lib/mappers/expenses';
import {
  dbProfileToUiUser,
  dbProfileToUiPreferences,
  uiProfileToDbUpdate,
} from '@/lib/mappers/profiles';
import type { DbTripRow, DbItineraryItemRow, DbExpenseRow, DbProfileRow } from '@/lib/types/database';

describe('Trip Mappers', () => {
  const sampleTripRow: DbTripRow = {
    id: 'trip-123',
    user_id: 'user-456',
    title: 'Kyoto Autumn Walk',
    destination_region: 'Kansai',
    country: 'Japan',
    start_date: '2026-10-12',
    end_date: '2026-10-20',
    budget_amount: 2500,
    budget: 2500,
    currency: 'USD',
    notes: 'Bring walking shoes',
    cover_image: 'https://example.com/cover.jpg',
    cover_image_alt: 'Fushimi Inari torii gates',
    cover_image_credit: 'Photo: Taro Yamada · CC BY-SA 4.0 · Wikimedia Commons',
    cover_image_credit_url: 'https://commons.wikimedia.org/wiki/File:Cover.jpg',
    privacy: 'collaborative',
    status: 'planned', // Stored in DB but must be overridden dynamically
    created_at: '2026-10-11T00:00:00Z',
    updated_at: '2026-10-11T00:00:00Z',
  };

  it('maps DbTripRow to UI Trip and computes fields correctly', () => {
    const uiTrip = dbTripToUiTrip(sampleTripRow, true);

    expect(uiTrip.id).toBe('trip-123');
    expect(uiTrip.title).toBe('Kyoto Autumn Walk');
    expect(uiTrip.budget).toBe(2500);
    expect(uiTrip.estimatedBudget).toBe(2500);
    expect(uiTrip.budgetCap).toBe(3125);
    expect(uiTrip.daysCount).toBe(9);
    expect(uiTrip.isBookmarked).toBe(true);
    expect(uiTrip.status).toBeDefined();
  });

  it('converts UI Trip Form Input to DbTripInsert payload without client status', () => {
    const insert = uiTripToDbInsert(
      {
        title: ' Hokkaido Winter ',
        startDate: '2026-12-01',
        endDate: '2026-12-08',
        budget: 3400,
        currency: 'usd',
      },
      'user-456'
    );

    expect(insert.user_id).toBe('user-456');
    expect(insert.title).toBe('Hokkaido Winter');
    expect(insert.budget_amount).toBe(3400);
    expect(insert.currency).toBe('PHP');
    expect((insert as any).status).toBeUndefined(); // Status is not written by client
  });

  it('converts UI Trip update correctly', () => {
    const update = uiTripToDbUpdate({
      title: 'Updated Title',
      budget: 1500,
      currency: 'jpy',
    });

    expect(update.title).toBe('Updated Title');
    expect(update.budget_amount).toBe(1500);
    expect(update.currency).toBe('PHP');
  });
});

describe('Activity Mappers', () => {
  it('converts 12h time to 24h SQL time and vice versa', () => {
    expect(timeStringToSqlTime('09:30 AM')).toBe('09:30:00');
    expect(timeStringToSqlTime('9:30 am')).toBe('09:30:00');
    expect(timeStringToSqlTime('02:15 PM')).toBe('14:15:00');
    expect(timeStringToSqlTime('12:00 PM')).toBe('12:00:00');
    expect(timeStringToSqlTime('12:00 AM')).toBe('00:00:00');
    expect(timeStringToSqlTime('14:00')).toBe('14:00:00');

    expect(sqlTimeToDisplayTime('09:30:00')).toBe('09:30 AM');
    expect(sqlTimeToDisplayTime('14:15:00')).toBe('02:15 PM');
  });

  it('maps DbItineraryItemRow to ScheduledActivity inheriting parent trip currency', () => {
    const row: DbItineraryItemRow = {
      id: 'act-1',
      trip_id: 'trip-123',
      destination_id: null,
      day_date: '2026-10-14',
      title: 'Tea Ceremony',
      description: 'Traditional Uji matcha',
      start_time: '10:00:00',
      end_time: '11:30:00',
      category: 'culture',
      location_name: 'Kennin-ji Temple',
      latitude: null,
      longitude: null,
      cost: 45,
      currency: 'EUR', // Row currency ignored in favor of parent trip
      booking_ref: 'CONF-8821',
      notes: 'Wear comfortable socks',
      order_index: 1,
      created_at: '2026-10-11T00:00:00Z',
      updated_at: '2026-10-11T00:00:00Z',
    };

    const uiActivity = dbActivityToUiActivity(row, '2026-10-12', 'JPY');

    expect(uiActivity.id).toBe('act-1');
    expect(uiActivity.dayNumber).toBe(3); // Oct 12 = Day 1, Oct 14 = Day 3
    expect(uiActivity.currency).toBe('JPY'); // Parent trip currency
    expect(uiActivity.location).toBe('Kennin-ji Temple');
    expect(uiActivity.confirmedRef).toBe('CONF-8821');
    expect(uiActivity.startTime).toBe('10:00 AM');
  });

  it('computes day_date from dayNumber when inserting an activity', () => {
    const trip = {
      id: 'trip-123',
      start_date: '2026-10-12',
      end_date: '2026-10-20',
      currency: 'USD',
    };

    const insert = uiActivityToDbInsert(
      {
        tripId: 'trip-123',
        dayNumber: 4,
        title: 'Bamboo Forest',
        category: 'sightseeing',
        startTime: '08:00 AM',
        endTime: '10:00 AM',
        cost: 20,
      },
      trip
    );

    expect(insert.trip_id).toBe('trip-123');
    expect(insert.day_date).toBe('2026-10-15'); // 12 + 3 days = 15
    expect(insert.currency).toBe('USD');
    expect(insert.start_time).toBe('08:00:00');
  });
});

describe('Expense Mappers', () => {
  it('normalizes category values (transit -> transport)', () => {
    expect(normalizeExpenseCategory('transit')).toBe('transport');
    expect(normalizeExpenseCategory('Transit')).toBe('transport');
    expect(normalizeExpenseCategory('food')).toBe('food');
    expect(normalizeExpenseCategory('invalid-cat')).toBe('misc');
  });

  it('maps payment status bidirectionally', () => {
    expect(uiPaymentStatusToDb('Paid in Full')).toBe('paid');
    expect(uiPaymentStatusToDb('Cash Reserved')).toBe('deposit');
    expect(uiPaymentStatusToDb('Planned / Estimated')).toBe('estimated');
    expect(uiPaymentStatusToDb('Pre-booked Online')).toBe('planned');

    expect(dbPaymentStatusToUi('paid')).toBe('Paid in Full');
    expect(dbPaymentStatusToUi('deposit')).toBe('Deposit / Cash Reserved');
    expect(dbPaymentStatusToUi('estimated')).toBe('Planned / Estimated');
  });

  it('converts UI expense insert inheriting parent trip currency', () => {
    const trip = {
      id: 'trip-123',
      start_date: '2026-10-12',
      currency: 'USD',
    };

    const insert = uiExpenseToDbInsert(
      {
        tripId: 'trip-123',
        title: 'Shinkansen Bullet Train',
        category: 'transit',
        amount: 140,
        dayNumber: 2,
        paymentStatus: 'Paid in Full',
      },
      trip
    );

    expect(insert.category).toBe('transport'); // Normalized
    expect(insert.currency).toBe('USD'); // Inherited
    expect(insert.payment_status).toBe('paid'); // Mapped
    expect(insert.expense_date).toBe('2026-10-13'); // Day 2
  });
});

describe('Profile Mappers', () => {
  const profileRow: DbProfileRow = {
    id: 'user-1',
    display_name: 'Avery Chen',
    email: 'avery@example.com',
    avatar_url: 'https://example.com/avatar.jpg',
    role: 'traveler',
    is_active: true,
    bio: 'Alpine wanderer',
    preferred_currency: 'EUR',
    date_format: 'YYYY-MM-DD',
    measurement_units: 'metric',
    time_format: '24',
    notifications_enabled: true,
    created_at: '2026-10-11T00:00:00Z',
    updated_at: '2026-10-11T00:00:00Z',
  };

  it('maps DbProfileRow to CurrentUser and UserPreferences', () => {
    const user = dbProfileToUiUser(profileRow);
    expect(user.name).toBe('Avery Chen');
    expect(user.email).toBe('avery@example.com');
    expect(user.role).toBe('Explorer');

    const prefs = dbProfileToUiPreferences(profileRow, { theme: 'dark' });
    expect(prefs.currency).toBe('EUR');
    expect(prefs.measurementUnits).toBe('metric');
    expect(prefs.theme).toBe('dark'); // Preserves local theme
  });

  it('creates clean DbProfileUpdate without touching role or is_active', () => {
    const update = uiProfileToDbUpdate({
      displayName: 'Avery C.',
      currency: 'gbp',
      measurementUnits: 'imperial',
    });

    expect(update.display_name).toBe('Avery C.');
    expect(update.preferred_currency).toBe('GBP');
    expect(update.measurement_units).toBe('imperial');
    expect((update as any).role).toBeUndefined();
    expect((update as any).is_active).toBeUndefined();
  });
});
