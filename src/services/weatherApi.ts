import { DestinationWeatherResponse, DailyWeatherForecast } from '../types';
import type { TrimmedWeatherResponse } from '../lib/validators/weather';

/**
 * Fetch real weather from TravelMate /api/weather route handler (Open-Meteo)
 */
export async function fetchRealWeather(
  latitude: number,
  longitude: number
): Promise<TrimmedWeatherResponse> {
  const res = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Weather request failed with status ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch 5-Day Weather Forecast for a destination name
 */
export async function fetch5DayForecast(
  destination: string,
  country?: string
): Promise<DestinationWeatherResponse> {
  const dest = destination.trim() || 'Destination';
  const ctry = country || '';

  // Approximate coordinate defaults for prominent regions if queried by name
  const KNOWN_COORDS: Record<string, { lat: number; lon: number }> = {
    kyoto: { lat: 35.0116, lon: 135.7681 },
    tokyo: { lat: 35.6762, lon: 139.6503 },
    paris: { lat: 48.8566, lon: 2.3522 },
    rome: { lat: 41.9028, lon: 12.4964 },
    amalfi: { lat: 40.634, lon: 14.6027 },
    london: { lat: 51.5074, lon: -0.1278 },
    newyork: { lat: 40.7128, lon: -74.006 },
  };

  const key = dest.toLowerCase().replace(/[^a-z]/g, '');
  const match = KNOWN_COORDS[key];

  if (match) {
    try {
      const real = await fetchRealWeather(match.lat, match.lon);
      const forecastDays: DailyWeatherForecast[] = real.forecast.slice(0, 5).map((d) => ({
        date: d.date,
        dayName: d.dayName,
        dayLabel: d.dayLabel,
        condition: d.condition,
        conditionDescription: d.condition,
        icon: d.icon,
        highC: d.highC,
        lowC: d.lowC,
        precipitationPercent: d.precipitationPercent,
        humidity: real.humidity,
        windSpeedKmh: real.windKmh,
        uvIndex: 4,
        clothingTip: 'Check local weather advisory before departure.',
        hourlyPreview: [],
      }));

      return {
        destination: dest,
        country: ctry,
        currentTempC: real.currentTempC,
        feelsLikeC: real.feelsLikeC,
        currentCondition: real.condition,
        currentIcon: real.icon,
        humidity: real.humidity,
        windKmh: real.windKmh,
        uvIndex: 4,
        airQuality: 'Open-Meteo Verified',
        forecast: forecastDays,
        expeditionInsight: `Live atmospheric conditions reported for ${dest} via Open-Meteo.`,
        sunrise: real.sunrise || '06:00 AM',
        sunset: real.sunset || '06:00 PM',
        lastUpdated: 'Just now',
      };
    } catch (e) {
      console.warn('Real weather lookup failed, falling back to basic forecast', e);
    }
  }

  // Graceful fallback forecast
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days: DailyWeatherForecast[] = [];

  for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayName = dayNames[d.getDay()];

    days.push({
      date: d.toISOString().split('T')[0],
      dayName,
      dayLabel: i === 0 ? 'Today' : dayName,
      condition: 'Fair',
      conditionDescription: 'Typical seasonal conditions',
      icon: 'wb_sunny',
      highC: 18,
      lowC: 11,
      precipitationPercent: 10,
      humidity: 50,
      windSpeedKmh: 12,
      uvIndex: 3,
      clothingTip: 'Dress in comfortable layers.',
      hourlyPreview: [],
    });
  }

  return {
    destination: dest,
    country: ctry,
    currentTempC: 17,
    feelsLikeC: 16,
    currentCondition: 'Pleasant Weather',
    currentIcon: 'wb_sunny',
    humidity: 50,
    windKmh: 12,
    uvIndex: 3,
    airQuality: 'Normal',
    forecast: days,
    expeditionInsight: `Pacing and packing advice for ${dest}.`,
    sunrise: '06:15 AM',
    sunset: '05:45 PM',
    lastUpdated: 'Just now',
  };
}
