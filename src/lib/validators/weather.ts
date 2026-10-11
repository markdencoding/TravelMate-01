import { z } from 'zod';

export const weatherQuerySchema = z.object({
  lat: z.coerce
    .number({ invalid_type_error: 'Latitude must be a valid number' })
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  lon: z.coerce
    .number({ invalid_type_error: 'Longitude must be a valid number' })
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
});

export interface WeatherDayForecast {
  date: string;
  dayName: string;
  dayLabel: string;
  condition: string;
  icon: string;
  highC: number;
  lowC: number;
  precipitationPercent: number;
}

export interface TrimmedWeatherResponse {
  currentTempC: number;
  feelsLikeC: number;
  humidity: number;
  windKmh: number;
  condition: string;
  icon: string;
  weatherCode: number;
  sunrise?: string;
  sunset?: string;
  forecast: WeatherDayForecast[];
}

/**
 * Maps WMO Weather Interpretation Codes (0-99) to human-readable condition text & Material Symbols icon
 * Reference: Open-Meteo WMO Weather interpretation codes
 */
export function mapWmoCode(code: number): { condition: string; icon: string } {
  if (code === 0) {
    return { condition: 'Clear Sky', icon: 'wb_sunny' };
  }
  if (code === 1) {
    return { condition: 'Mainly Clear', icon: 'wb_sunny' };
  }
  if (code === 2) {
    return { condition: 'Partly Cloudy', icon: 'partly_cloudy_day' };
  }
  if (code === 3) {
    return { condition: 'Overcast', icon: 'cloud' };
  }
  if (code === 45 || code === 48) {
    return { condition: 'Foggy', icon: 'foggy' };
  }
  if (code >= 51 && code <= 55) {
    return { condition: 'Drizzle', icon: 'grain' };
  }
  if (code >= 56 && code <= 57) {
    return { condition: 'Freezing Drizzle', icon: 'weather_snowy' };
  }
  if (code >= 61 && code <= 65) {
    return { condition: 'Rain', icon: 'rainy' };
  }
  if (code >= 66 && code <= 67) {
    return { condition: 'Freezing Rain', icon: 'weather_snowy' };
  }
  if (code >= 71 && code <= 77) {
    return { condition: 'Snow Fall', icon: 'ac_unit' };
  }
  if (code >= 80 && code <= 82) {
    return { condition: 'Rain Showers', icon: 'rainy' };
  }
  if (code >= 85 && code <= 86) {
    return { condition: 'Snow Showers', icon: 'ac_unit' };
  }
  if (code >= 95 && code <= 99) {
    return { condition: 'Thunderstorm', icon: 'thunderstorm' };
  }
  return { condition: 'Fair', icon: 'wb_sunny' };
}
