import { z } from 'zod';

export const photoQuerySchema = z.object({
  query: z
    .string()
    .trim()
    .min(2, { message: 'Query must be at least 2 characters long' })
    .max(100, { message: 'Query cannot exceed 100 characters' }),
  country: z
    .string()
    .trim()
    .max(100, { message: 'Country cannot exceed 100 characters' })
    .optional()
    .default(''),
});

export type PhotoQueryInput = z.infer<typeof photoQuerySchema>;

export interface PhotoSuggestion {
  id: string;
  thumbUrl: string;
  coverUrl: string;
  alt: string;
  creator: string;
  licenseName: string;
  licenseUrl: string;
  filePageUrl: string;
}

export interface PhotosApiResponse {
  success: boolean;
  data: PhotoSuggestion[];
  total: number;
  error?: {
    code: 'invalid_query' | 'unauthorized' | 'rate_limit_exceeded' | 'provider_down' | 'no_photos_found';
    message: string;
  };
}

/**
 * Strips HTML tags from strings returned by MediaWiki APIs (e.g. in Artist fields).
 */
export function stripHtml(input: string): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Checks whether a license string is a recognized free license.
 * Public Domain, CC0, CC BY (all versions), CC BY-SA (all versions).
 */
export function isFreeLicense(license: string): boolean {
  if (!license) return false;
  const l = license.toLowerCase().replace(/-/g, ' ').trim();

  // Public domain indicators
  if (
    l.includes('public domain') ||
    l.includes('pd') ||
    l.includes('cc0') ||
    l === 'pd' ||
    l === 'cc 0' ||
    l.startsWith('cc0')
  ) {
    return true;
  }

  // Creative Commons BY and BY-SA indicators
  if (l.includes('cc by') || l.includes('attribution')) {
    // Disallow Non-Commercial (NC) and No-Derivatives (ND)
    if (l.includes('nc') || l.includes('noncommercial') || l.includes('nd') || l.includes('noderivs')) {
      return false;
    }
    return true;
  }

  return false;
}

/**
 * Excludes non-photo files such as maps, flags, diagrams, icons, logos, stamps, coats of arms.
 */
export function isExcludedNonPhoto(title: string, description = ''): boolean {
  const combined = `${title} ${description}`.toLowerCase();
  const excludeKeywords = [
    'flag',
    'coat of arms',
    'coat_of_arms',
    'blason',
    'wappen',
    'escudo',
    'map',
    'karte',
    'plan',
    'locator',
    'location',
    'diagram',
    'chart',
    'logo',
    'icon',
    'symbol',
    'seal',
    'stamp',
    'currency',
    'coin',
    'banknote',
    'portrait',
    'signature',
    'poster',
    'graph',
    'table',
    'schematic',
    'drawing',
    'sketch',
  ];

  return excludeKeywords.some((kw) => {
    // Word boundary or underscore match
    const regex = new RegExp(`(^|[^a-z0-9])${kw}([^a-z0-9]|$)`, 'i');
    return regex.test(combined);
  });
}
