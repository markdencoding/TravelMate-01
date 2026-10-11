export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  baseRateToUsd: number; // 1 USD = X Currency units
  precision: number;
  sampleItems?: { amount: number; label: string }[];
}

export const SHARED_CURRENCIES: Record<string, CurrencyInfo> = {
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    flag: '🇺🇸',
    baseRateToUsd: 1.0,
    precision: 2,
    sampleItems: [
      { amount: 5, label: 'Coffee & treat' },
      { amount: 20, label: 'Casual Lunch' },
      { amount: 65, label: 'Nice Dinner' },
      { amount: 150, label: 'City Hotel' },
    ],
  },
  PHP: {
    code: 'PHP',
    name: 'Philippine Peso',
    symbol: '₱',
    flag: '🇵🇭',
    baseRateToUsd: 58.2,
    precision: 2,
    sampleItems: [
      { amount: 180, label: 'Halo-halo snack' },
      { amount: 450, label: 'Seafood lunch' },
      { amount: 1600, label: 'Island hopping tour' },
      { amount: 4500, label: 'Beach resort stay' },
    ],
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    flag: '🇪🇺',
    baseRateToUsd: 0.925,
    precision: 2,
    sampleItems: [
      { amount: 4, label: 'Espresso & brioche' },
      { amount: 18, label: 'Trattoria lunch' },
      { amount: 50, label: 'Full course dinner' },
      { amount: 95, label: 'Regional rail pass' },
      { amount: 180, label: 'Seaside hotel' },
    ],
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    flag: '🇯🇵',
    baseRateToUsd: 154.2,
    precision: 0,
    sampleItems: [
      { amount: 500, label: 'Konbini snack' },
      { amount: 1500, label: 'Ramen & Gyoza' },
      { amount: 5000, label: 'Izakaya dinner' },
      { amount: 14000, label: 'Shinkansen ticket' },
      { amount: 28000, label: 'Ryokan with onsen' },
    ],
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    flag: '🇬🇧',
    baseRateToUsd: 0.785,
    precision: 2,
    sampleItems: [
      { amount: 4.5, label: 'Flat white' },
      { amount: 16, label: 'Pub meal' },
      { amount: 45, label: 'Bistro dinner' },
      { amount: 75, label: 'Highland tour' },
      { amount: 160, label: 'Stone cottage B&B' },
    ],
  },
  AUD: {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    flag: '🇦🇺',
    baseRateToUsd: 1.53,
    precision: 2,
    sampleItems: [
      { amount: 5.5, label: 'Flat white' },
      { amount: 25, label: 'Cafe lunch' },
      { amount: 80, label: 'Dinner' },
    ],
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    flag: '🇨🇦',
    baseRateToUsd: 1.39,
    precision: 2,
    sampleItems: [
      { amount: 6, label: 'Coffee' },
      { amount: 22, label: 'Casual meal' },
      { amount: 70, label: 'Dinner' },
    ],
  },
  SGD: {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    flag: '🇸🇬',
    baseRateToUsd: 1.34,
    precision: 2,
    sampleItems: [
      { amount: 5, label: 'Hawker meal' },
      { amount: 25, label: 'Bistro lunch' },
      { amount: 75, label: 'Rooftop dinner' },
    ],
  },
  HKD: {
    code: 'HKD',
    name: 'Hong Kong Dollar',
    symbol: 'HK$',
    flag: '🇭🇰',
    baseRateToUsd: 7.78,
    precision: 2,
    sampleItems: [
      { amount: 35, label: 'Dim sum basket' },
      { amount: 85, label: 'Cha chaan teng lunch' },
      { amount: 320, label: 'Victoria peak tram' },
    ],
  },
  KRW: {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    flag: '🇰🇷',
    baseRateToUsd: 1390,
    precision: 0,
    sampleItems: [
      { amount: 5000, label: 'Street snack' },
      { amount: 12000, label: 'Bibimbap lunch' },
      { amount: 40000, label: 'KBBQ dinner' },
    ],
  },
  CNY: {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    flag: '🇨🇳',
    baseRateToUsd: 7.24,
    precision: 2,
    sampleItems: [
      { amount: 25, label: 'Dumpling lunch' },
      { amount: 90, label: 'Tea ceremony' },
      { amount: 220, label: 'Bullet train ticket' },
    ],
  },
  TWD: {
    code: 'TWD',
    name: 'New Taiwan Dollar',
    symbol: 'NT$',
    flag: '🇹🇼',
    baseRateToUsd: 32.5,
    precision: 0,
    sampleItems: [
      { amount: 75, label: 'Boba milk tea' },
      { amount: 180, label: 'Night market snacks' },
      { amount: 650, label: 'Hot spring entry' },
    ],
  },
  THB: {
    code: 'THB',
    name: 'Thai Baht',
    symbol: '฿',
    flag: '🇹🇭',
    baseRateToUsd: 34.6,
    precision: 0,
    sampleItems: [
      { amount: 80, label: 'Pad Thai street stall' },
      { amount: 250, label: 'Cafe lunch' },
      { amount: 900, label: 'Seafood dinner' },
    ],
  },
  VND: {
    code: 'VND',
    name: 'Vietnamese Dong',
    symbol: '₫',
    flag: '🇻🇳',
    baseRateToUsd: 25400,
    precision: 0,
    sampleItems: [
      { amount: 45000, label: 'Banh mi & iced coffee' },
      { amount: 120000, label: 'Pho lunch set' },
      { amount: 450000, label: 'Ha Long bay cruise day' },
    ],
  },
  IDR: {
    code: 'IDR',
    name: 'Indonesian Rupiah',
    symbol: 'Rp',
    flag: '🇮🇩',
    baseRateToUsd: 15850,
    precision: 0,
    sampleItems: [
      { amount: 35000, label: 'Nasi goreng warung' },
      { amount: 150000, label: 'Beach club meal' },
      { amount: 450000, label: 'Traditional spa treatment' },
    ],
  },
  MYR: {
    code: 'MYR',
    name: 'Malaysian Ringgit',
    symbol: 'RM',
    flag: '🇲🇾',
    baseRateToUsd: 4.45,
    precision: 2,
    sampleItems: [
      { amount: 12, label: 'Nasi lemak breakfast' },
      { amount: 35, label: 'Hawker centre feast' },
      { amount: 120, label: 'Twin towers entry' },
    ],
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    flag: '🇮🇳',
    baseRateToUsd: 84.4,
    precision: 2,
    sampleItems: [
      { amount: 150, label: 'Chai & samosas' },
      { amount: 450, label: 'Thali lunch' },
      { amount: 1800, label: 'Palace guide tour' },
    ],
  },
  AED: {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'AED',
    flag: '🇦🇪',
    baseRateToUsd: 3.67,
    precision: 2,
    sampleItems: [
      { amount: 25, label: 'Karak chai & pastry' },
      { amount: 80, label: 'Marina lunch' },
      { amount: 250, label: 'Desert safari entry' },
    ],
  },
  SAR: {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: 'SAR',
    flag: '🇸🇦',
    baseRateToUsd: 3.75,
    precision: 2,
    sampleItems: [
      { amount: 25, label: 'Arabic coffee & dates' },
      { amount: 75, label: 'Traditional kabsa' },
      { amount: 280, label: 'Historical tour pass' },
    ],
  },
  CHF: {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
    flag: '🇨🇭',
    baseRateToUsd: 0.885,
    precision: 2,
    sampleItems: [
      { amount: 6, label: 'Coffee' },
      { amount: 30, label: 'Fondue lunch' },
      { amount: 90, label: 'Mountain pass' },
    ],
  },
  NZD: {
    code: 'NZD',
    name: 'New Zealand Dollar',
    symbol: 'NZ$',
    flag: '🇳🇿',
    baseRateToUsd: 1.68,
    precision: 2,
    sampleItems: [
      { amount: 6, label: 'Flat white' },
      { amount: 26, label: 'Cafe brunch' },
      { amount: 85, label: 'Vineyard tour' },
    ],
  },
  BRL: {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    flag: '🇧🇷',
    baseRateToUsd: 5.75,
    precision: 2,
    sampleItems: [
      { amount: 15, label: 'Acai bowl' },
      { amount: 60, label: 'Churrascaria meal' },
      { amount: 180, label: 'Sugarloaf cable car' },
    ],
  },
  MXN: {
    code: 'MXN',
    name: 'Mexican Peso',
    symbol: 'Mex$',
    flag: '🇲🇽',
    baseRateToUsd: 20.3,
    precision: 2,
    sampleItems: [
      { amount: 90, label: 'Street tacos & agua fresca' },
      { amount: 280, label: 'Cantina lunch' },
      { amount: 850, label: 'Cenote excursion pass' },
    ],
  },
  ZAR: {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    flag: '🇿🇦',
    baseRateToUsd: 18.1,
    precision: 2,
    sampleItems: [
      { amount: 45, label: 'Rooibos tea & rusk' },
      { amount: 190, label: 'Cape seafood plate' },
      { amount: 650, label: 'Table Mountain tramway' },
    ],
  },
  SEK: {
    code: 'SEK',
    name: 'Swedish Krona',
    symbol: 'kr',
    flag: '🇸🇪',
    baseRateToUsd: 10.9,
    precision: 2,
    sampleItems: [
      { amount: 55, label: 'Fika cinnamon bun & brew' },
      { amount: 160, label: 'Smorgasbord lunch' },
      { amount: 450, label: 'Archipelago ferry pass' },
    ],
  },
  NOK: {
    code: 'NOK',
    name: 'Norwegian Krone',
    symbol: 'kr',
    flag: '🇳🇴',
    baseRateToUsd: 11.0,
    precision: 2,
    sampleItems: [
      { amount: 60, label: 'Nordic coffee' },
      { amount: 220, label: 'Fjord salmon meal' },
      { amount: 550, label: 'Scenic train ticket' },
    ],
  },
  DKK: {
    code: 'DKK',
    name: 'Danish Krone',
    symbol: 'kr',
    flag: '🇩🇰',
    baseRateToUsd: 6.9,
    precision: 2,
    sampleItems: [
      { amount: 45, label: 'Wienerbrod pastry' },
      { amount: 140, label: 'Smorrebrod plate' },
      { amount: 390, label: 'Canal tour pass' },
    ],
  },
  PLN: {
    code: 'PLN',
    name: 'Polish Zloty',
    symbol: 'zł',
    flag: '🇵🇱',
    baseRateToUsd: 4.08,
    precision: 2,
    sampleItems: [
      { amount: 22, label: 'Pierogi plate' },
      { amount: 55, label: 'Old town dinner' },
      { amount: 150, label: 'Castle museum ticket' },
    ],
  },
  TRY: {
    code: 'TRY',
    name: 'Turkish Lira',
    symbol: '₺',
    flag: '🇹🇷',
    baseRateToUsd: 34.3,
    precision: 2,
    sampleItems: [
      { amount: 85, label: 'Turkish coffee & baklava' },
      { amount: 320, label: 'Bosphorus kebab lunch' },
      { amount: 1100, label: 'Historical bath entry' },
    ],
  },
  ILS: {
    code: 'ILS',
    name: 'Israeli Shekel',
    symbol: '₪',
    flag: '🇮🇱',
    baseRateToUsd: 3.72,
    precision: 2,
    sampleItems: [
      { amount: 28, label: 'Falafel pita' },
      { amount: 85, label: 'Shakshuka breakfast' },
      { amount: 240, label: 'Dead Sea transport' },
    ],
  },
  EGP: {
    code: 'EGP',
    name: 'Egyptian Pound',
    symbol: 'E£',
    flag: '🇪🇬',
    baseRateToUsd: 49.2,
    precision: 2,
    sampleItems: [
      { amount: 80, label: 'Koshary bowl' },
      { amount: 280, label: 'Nile view dinner' },
      { amount: 950, label: 'Pyramids guided pass' },
    ],
  },
  QAR: {
    code: 'QAR',
    name: 'Qatari Riyal',
    symbol: 'QR',
    flag: '🇶🇦',
    baseRateToUsd: 3.64,
    precision: 2,
    sampleItems: [
      { amount: 25, label: 'Souq tea & snacks' },
      { amount: 85, label: 'Corniche dining' },
      { amount: 260, label: 'Museum of Islamic Art tour' },
    ],
  },
  KWD: {
    code: 'KWD',
    name: 'Kuwaiti Dinar',
    symbol: 'KD',
    flag: '🇰🇼',
    baseRateToUsd: 0.307,
    precision: 3,
    sampleItems: [
      { amount: 2.5, label: 'Specialty espresso' },
      { amount: 7, label: 'Traditional machboos' },
      { amount: 22, label: 'Kuwait Towers pass' },
    ],
  },
  BHD: {
    code: 'BHD',
    name: 'Bahraini Dinar',
    symbol: 'BD',
    flag: '🇧🇭',
    baseRateToUsd: 0.376,
    precision: 3,
    sampleItems: [
      { amount: 2, label: 'Chai karak set' },
      { amount: 8, label: 'Seafood grill' },
      { amount: 24, label: 'Fort heritage pass' },
    ],
  },
  OMR: {
    code: 'OMR',
    name: 'Omani Rial',
    symbol: 'OMR',
    flag: '🇴🇲',
    baseRateToUsd: 0.385,
    precision: 3,
    sampleItems: [
      { amount: 2.5, label: 'Omani halwa & coffee' },
      { amount: 7.5, label: 'Muttrah souq lunch' },
      { amount: 28, label: 'Wadi Shab canyon trek' },
    ],
  },
  CZK: {
    code: 'CZK',
    name: 'Czech Koruna',
    symbol: 'Kč',
    flag: '🇨🇿',
    baseRateToUsd: 23.5,
    precision: 0,
    sampleItems: [
      { amount: 95, label: 'Trdelnik pastry' },
      { amount: 290, label: 'Traditional goulash' },
      { amount: 750, label: 'Prague castle circuit' },
    ],
  },
  HUF: {
    code: 'HUF',
    name: 'Hungarian Forint',
    symbol: 'Ft',
    flag: '🇭🇺',
    baseRateToUsd: 378,
    precision: 0,
    sampleItems: [
      { amount: 1800, label: 'Langos street food' },
      { amount: 4800, label: 'Paprikash lunch' },
      { amount: 11000, label: 'Thermal bath full day' },
    ],
  },
  CLP: {
    code: 'CLP',
    name: 'Chilean Peso',
    symbol: 'CLP$',
    flag: '🇨🇱',
    baseRateToUsd: 955,
    precision: 0,
    sampleItems: [
      { amount: 3500, label: 'Empanada snack' },
      { amount: 15000, label: 'Patagonian lunch' },
      { amount: 45000, label: 'Asado dinner' },
    ],
  },
  COP: {
    code: 'COP',
    name: 'Colombian Peso',
    symbol: 'COL$',
    flag: '🇨🇴',
    baseRateToUsd: 4400,
    precision: 0,
    sampleItems: [
      { amount: 15000, label: 'Bandeja paisa' },
      { amount: 45000, label: 'Coffee plantation tour' },
      { amount: 120000, label: 'Cartagena boat transfer' },
    ],
  },
  PEN: {
    code: 'PEN',
    name: 'Peruvian Sol',
    symbol: 'S/.',
    flag: '🇵🇪',
    baseRateToUsd: 3.78,
    precision: 2,
    sampleItems: [
      { amount: 18, label: 'Ceviche plate' },
      { amount: 45, label: 'Lomo saltado dinner' },
      { amount: 160, label: 'Sacred Valley ticket' },
    ],
  },
  ARS: {
    code: 'ARS',
    name: 'Argentine Peso',
    symbol: '$',
    flag: '🇦🇷',
    baseRateToUsd: 995,
    precision: 0,
    sampleItems: [
      { amount: 4500, label: 'Medialunas & coffee' },
      { amount: 18000, label: 'Bife de chorizo steak' },
      { amount: 55000, label: 'Tango show evening' },
    ],
  },
};

export const CURRENCY_LIST: CurrencyInfo[] = Object.values(SHARED_CURRENCIES);

export function getCurrencyInfo(codeOrRaw: string): CurrencyInfo {
  if (!codeOrRaw) return SHARED_CURRENCIES.USD;
  // Handle formats like "USD ($)", "USD", "JPY (¥)", etc.
  const extracted = codeOrRaw.trim().slice(0, 3).toUpperCase();
  return SHARED_CURRENCIES[extracted] || SHARED_CURRENCIES.USD;
}

export function formatCurrencyValue(amount: number, code: string): string {
  const info = getCurrencyInfo(code);
  const rounded = info.precision === 0 ? Math.round(amount) : amount;
  return `${info.symbol}${rounded.toLocaleString('en-US', {
    minimumFractionDigits: info.precision,
    maximumFractionDigits: info.precision,
  })}`;
}

/**
 * Standard shared currency formatter across TravelMate.
 * Formats all primary amounts strictly in Philippine pesos (PHP, ₱) via Intl.NumberFormat ('en-PH').
 */
export function formatCurrency(
  amount: number,
  options?: { maximumFractionDigits?: number; minimumFractionDigits?: number }
): string {
  const minDigits = options?.minimumFractionDigits ?? (options?.maximumFractionDigits === 0 ? 0 : 2);
  const maxDigits = options?.maximumFractionDigits ?? 2;
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  }).format(num);
}

