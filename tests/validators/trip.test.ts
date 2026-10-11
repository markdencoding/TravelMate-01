import { describe, expect, it } from 'vitest';
import { tripSchema, tripUpdateSchema } from '../../src/lib/validators/trip';

describe('tripSchema validator', () => {
  const validTrip = {
    title: 'Alpine High Route',
    destinationRegion: 'Chamonix to Zermatt',
    country: 'Switzerland',
    startDate: '2026-07-10',
    endDate: '2026-07-22',
    budget: 3400,
    currency: 'CHF',
    notes: 'Haute Route hut reservations required',
  };

  it('passes with valid trip payload', () => {
    const result = tripSchema.safeParse(validTrip);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Alpine High Route');
      expect(result.data.budget).toBe(3400);
      expect(result.data.status).toBe('planned');
    }
  });

  it('fails when title is empty', () => {
    const result = tripSchema.safeParse({
      ...validTrip,
      title: '   ',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Trip title is required');
    }
  });

  it('fails when dates are not ISO YYYY-MM-DD', () => {
    const result = tripSchema.safeParse({
      ...validTrip,
      startDate: '10/07/2026',
    });
    expect(result.success).toBe(false);
  });

  it('fails when endDate is before startDate (TM-3 requirement)', () => {
    const result = tripSchema.safeParse({
      ...validTrip,
      startDate: '2026-07-22',
      endDate: '2026-07-10',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const dateIssue = result.error.issues.find((issue) => issue.path.includes('endDate'));
      expect(dateIssue).toBeDefined();
      expect(dateIssue?.message).toBe('End date cannot be before start date');
    }
  });

  it('passes for single-day trip where startDate === endDate', () => {
    const result = tripSchema.safeParse({
      ...validTrip,
      startDate: '2026-07-10',
      endDate: '2026-07-10',
    });
    expect(result.success).toBe(true);
  });

  it('fails when budget is negative', () => {
    const result = tripSchema.safeParse({
      ...validTrip,
      budget: -100,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const budgetIssue = result.error.issues.find((issue) => issue.path.includes('budget'));
      expect(budgetIssue?.message).toContain('non-negative');
    }
  });

  it('accepts zero budget and sets default values for optional fields', () => {
    const result = tripSchema.safeParse({
      title: 'Backyard Campout',
      startDate: '2026-08-01',
      endDate: '2026-08-02',
      budget: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe('PHP');
      expect(result.data.destinationRegion).toBe('');
      expect(result.data.country).toBe('');
      expect(result.data.notes).toBe('');
      expect(result.data.destinations).toEqual([]);
    }
  });

  it('enforces maximum title length of 60 characters', () => {
    const sixtyChars = 'A'.repeat(60);
    const sixtyOneChars = 'A'.repeat(61);

    const validResult = tripSchema.safeParse({
      ...validTrip,
      title: sixtyChars,
    });
    expect(validResult.success).toBe(true);

    const invalidResult = tripSchema.safeParse({
      ...validTrip,
      title: sixtyOneChars,
    });
    expect(invalidResult.success).toBe(false);
    if (!invalidResult.success) {
      expect(invalidResult.error.issues[0].message).toContain('60 characters');
    }
  });

  it('validates destinations array with destinationItemSchema', () => {
    const tripWithDests = {
      ...validTrip,
      destinations: [
        {
          name: 'Kyoto Imperial Palace',
          country: 'Japan',
          latitude: 35.0254,
          longitude: 135.7621,
          orderIndex: 0,
        },
      ],
    };

    const res = tripSchema.safeParse(tripWithDests);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.destinations).toHaveLength(1);
      expect(res.data.destinations[0].name).toBe('Kyoto Imperial Palace');
    }

    const invalidCoordsTrip = {
      ...validTrip,
      destinations: [
        {
          name: 'Invalid Pole',
          latitude: 105.0, // > 90
          longitude: 135.0,
        },
      ],
    };
    expect(tripSchema.safeParse(invalidCoordsTrip).success).toBe(false);
  });
});

describe('tripUpdateSchema validator', () => {
  it('validates partial updates with id', () => {
    const result = tripUpdateSchema.safeParse({
      id: 'd9b23b32-6bfb-4835-a6e3-549488a03c30',
      title: 'Updated Title',
      budget: 4500,
    });
    expect(result.success).toBe(true);
  });
});
