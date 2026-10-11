import { describe, it, expect } from 'vitest';
import {
  photoQuerySchema,
  stripHtml,
  isFreeLicense,
  isExcludedNonPhoto,
} from '@/lib/validators/photos';
import { dbTripToUiTrip, uiTripToDbInsert, uiTripToDbUpdate } from '@/lib/mappers/trips';
import type { DbTripRow } from '@/lib/types/database';

describe('Photo Query Validator & Filter Suite', () => {
  describe('photoQuerySchema', () => {
    it('validates legitimate destination search queries', () => {
      const res = photoQuerySchema.safeParse({ query: 'Kyoto', country: 'Japan' });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.query).toBe('Kyoto');
        expect(res.data.country).toBe('Japan');
      }
    });

    it('trims whitespace and allows optional empty country', () => {
      const res = photoQuerySchema.safeParse({ query: '  Boracay  ', country: '   ' });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.query).toBe('Boracay');
        expect(res.data.country).toBe('');
      }
    });

    it('rejects queries shorter than 2 characters or longer than 100 characters', () => {
      expect(photoQuerySchema.safeParse({ query: 'a' }).success).toBe(false);
      expect(photoQuerySchema.safeParse({ query: '   ' }).success).toBe(false);
      expect(photoQuerySchema.safeParse({ query: 'x'.repeat(101) }).success).toBe(false);
    });
  });

  describe('stripHtml helper', () => {
    it('strips HTML tags and unescapes common HTML entities', () => {
      const input = '<a href="https://example.com/user">Jane &amp; &quot;Bob&quot;</a> <span class="credit">&#039;Photographer&#039;</span>';
      const clean = stripHtml(input);
      expect(clean).toBe(`Jane & "Bob" 'Photographer'`);
    });

    it('handles empty or malformed strings gracefully', () => {
      expect(stripHtml('')).toBe('');
      expect(stripHtml('Direct Author Name')).toBe('Direct Author Name');
    });
  });

  describe('isFreeLicense checker', () => {
    it('accepts public domain and Creative Commons BY and BY-SA licenses', () => {
      expect(isFreeLicense('Public domain')).toBe(true);
      expect(isFreeLicense('PD')).toBe(true);
      expect(isFreeLicense('CC0')).toBe(true);
      expect(isFreeLicense('CC0 1.0 Universal')).toBe(true);
      expect(isFreeLicense('CC BY 4.0')).toBe(true);
      expect(isFreeLicense('CC BY-SA 4.0')).toBe(true);
      expect(isFreeLicense('CC-BY-SA-3.0')).toBe(true);
      expect(isFreeLicense('cc by-sa 2.0')).toBe(true);
    });

    it('rejects proprietary, fair use, non-commercial (NC), and no-derivatives (ND) licenses', () => {
      expect(isFreeLicense('All Rights Reserved')).toBe(false);
      expect(isFreeLicense('Fair use')).toBe(false);
      expect(isFreeLicense('CC BY-NC 4.0')).toBe(false);
      expect(isFreeLicense('CC BY-NC-SA 3.0')).toBe(false);
      expect(isFreeLicense('CC BY-ND 4.0')).toBe(false);
      expect(isFreeLicense('')).toBe(false);
    });
  });

  describe('isExcludedNonPhoto filter', () => {
    it('excludes flags, maps, logos, diagrams, coins, and coats of arms', () => {
      expect(isExcludedNonPhoto('Flag of Kyoto Prefecture.svg')).toBe(true);
      expect(isExcludedNonPhoto('Coat of arms of Japan.png')).toBe(true);
      expect(isExcludedNonPhoto('Map showing Boracay Island in the Philippines.jpg')).toBe(true);
      expect(isExcludedNonPhoto('Tokyo Metro rail transit locator map.png')).toBe(true);
      expect(isExcludedNonPhoto('Palawan Department of Tourism Logo.png')).toBe(true);
      expect(isExcludedNonPhoto('Philippine 100 peso banknote obverse.jpg')).toBe(true);
      expect(isExcludedNonPhoto('Diagram of Mount Fuji crater geological structure.png')).toBe(true);
    });

    it('keeps scenic landscapes and real photos of destinations', () => {
      expect(isExcludedNonPhoto('Kinkaku-ji golden pavilion reflected in pond Kyoto.jpg')).toBe(false);
      expect(isExcludedNonPhoto('White Beach sunset with outrigger paraw boats Boracay.jpg')).toBe(false);
      expect(isExcludedNonPhoto('Limestone karst cliffs of El Nido Palawan.jpg')).toBe(false);
      expect(isExcludedNonPhoto('Snowy summit of Mount Fuji viewed from Lake Kawaguchi.jpg')).toBe(false);
      expect(isExcludedNonPhoto('Eiffel tower illumination at dusk in Paris.jpg')).toBe(false);
    });
  });

  describe('No cover and credit persistence in trip mappers', () => {
    it('maps an empty cover without falling back to a hardcoded Unsplash image', () => {
      const mockDbRow: DbTripRow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: 'user-1',
        title: 'Boracay Island Getaway',
        destination_region: 'Boracay',
        country: 'Philippines',
        start_date: '2026-11-01',
        end_date: '2026-11-05',
        budget_amount: 35000,
        budget: 35000,
        currency: 'PHP',
        notes: 'Sunset sailing',
        cover_image: '',
        cover_image_alt: '',
        cover_image_credit: '',
        cover_image_credit_url: '',
        privacy: 'collaborative',
        status: 'planned',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const uiTrip = dbTripToUiTrip(mockDbRow);
      expect(uiTrip.coverImage).toBe('');
      expect(uiTrip.coverImageCredit).toBe('');
    });

    it('preserves cover_image_credit and cover_image_credit_url in inserts and updates', () => {
      const insert = uiTripToDbInsert(
        {
          title: 'Kyoto Autumn Tour',
          startDate: '2026-10-15',
          endDate: '2026-10-20',
          coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/example.jpg',
          coverImageAlt: 'Kinkaku-ji temple',
          coverImageCredit: 'Photo: Jane Doe · CC BY-SA 4.0 · Wikimedia Commons',
          coverImageCreditUrl: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
        },
        'user-1'
      );

      expect(insert.cover_image).toBe('https://upload.wikimedia.org/wikipedia/commons/thumb/example.jpg');
      expect(insert.cover_image_credit).toBe('Photo: Jane Doe · CC BY-SA 4.0 · Wikimedia Commons');
      expect(insert.cover_image_credit_url).toBe('https://commons.wikimedia.org/wiki/File:Example.jpg');

      const update = uiTripToDbUpdate({
        coverImage: '',
        coverImageCredit: '',
        coverImageCreditUrl: '',
      });
      expect(update.cover_image).toBe('');
      expect(update.cover_image_credit).toBe('');
      expect(update.cover_image_credit_url).toBe('');
    });
  });
});
