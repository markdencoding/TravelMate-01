import React, { useState, useEffect } from 'react';
import { useTravelStore } from '../store';
import { fetch5DayForecast } from '../services/weatherApi';
import { DestinationWeatherResponse, DailyWeatherForecast } from '../types';

interface WeatherForecastWidgetProps {
  className?: string;
  onExploreRouteClick?: () => void;
}

export const WeatherForecastWidget: React.FC<WeatherForecastWidgetProps> = ({
  className = '',
  onExploreRouteClick,
}) => {
  const { activeTrip, userPreferences } = useTravelStore();

  // Unit preference (°C vs °F)
  const defaultUnit = userPreferences.measurementUnits === 'imperial' || userPreferences.tempUnit === 'F' ? 'F' : 'C';
  const [unit, setUnit] = useState<'C' | 'F'>(defaultUnit);

  // Multiple destination selector if trip has multiple
  const destinationOptions = activeTrip?.destinations && activeTrip.destinations.length > 0
    ? activeTrip.destinations
    : [activeTrip?.destinationRegion || 'Kyoto'];

  const [selectedDestination, setSelectedDestination] = useState<string>(
    destinationOptions[0] || 'Kyoto'
  );

  // Sync destination if trip changes
  useEffect(() => {
    if (activeTrip?.destinations && activeTrip.destinations.length > 0) {
      setSelectedDestination(activeTrip.destinations[0]);
    } else {
      setSelectedDestination(activeTrip?.destinationRegion || 'Kyoto');
    }
  }, [activeTrip?.id, activeTrip?.destinationRegion]);

  // Weather data state
  const [weatherData, setWeatherData] = useState<DestinationWeatherResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  // Fetch forecast function
  const loadForecast = async (dest: string, showRefreshSpinner = false) => {
    if (showRefreshSpinner) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const data = await fetch5DayForecast(dest, activeTrip?.country);
      setWeatherData(data);
    } catch (err) {
      console.error('Failed to load forecast', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadForecast(selectedDestination);
    setSelectedDayIndex(0);
  }, [selectedDestination]);

  // Temp converter helper
  const formatTemp = (celsius: number): string => {
    if (unit === 'F') {
      const f = Math.round((celsius * 9) / 5 + 32);
      return `${f}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  const selectedDay: DailyWeatherForecast | null =
    weatherData && weatherData.forecast[selectedDayIndex]
      ? weatherData.forecast[selectedDayIndex]
      : null;

  return (
    <div
      className={`bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 p-5 sm:p-6 shadow-sm flex flex-col gap-5 relative overflow-hidden transition-all ${className}`}
    >
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-container-high/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">thermostat</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-item-title text-base sm:text-lg font-bold text-on-surface font-display">
                5-Day Expedition Weather
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                Radar Active
              </span>
            </div>
            <p className="text-caption text-xs text-on-surface-variant">
              Atmospheric pacing & clothing recommendations for{' '}
              <span className="font-semibold text-on-surface">
                {weatherData?.destination || selectedDestination}, {activeTrip?.country || 'Japan'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Destination Selector Tabs if more than 1 destination in trip */}
          {destinationOptions.length > 1 && (
            <div className="flex bg-surface-container p-0.5 rounded-xl border border-surface-container-high/50 text-xs font-semibold">
              {destinationOptions.map((dest) => (
                <button
                  key={dest}
                  onClick={() => setSelectedDestination(dest)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedDestination === dest
                      ? 'bg-surface-container-lowest text-primary font-bold shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {dest}
                </button>
              ))}
            </div>
          )}

          {/* Unit Toggle (°C / °F) */}
          <div className="flex bg-surface-container p-0.5 rounded-xl border border-surface-container-high/50 text-xs font-semibold">
            <button
              onClick={() => setUnit('C')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                unit === 'C'
                  ? 'bg-surface-container-lowest text-on-surface font-bold shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              °C
            </button>
            <button
              onClick={() => setUnit('F')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                unit === 'F'
                  ? 'bg-surface-container-lowest text-on-surface font-bold shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              °F
            </button>
          </div>

          {/* Refresh / Re-sync Mock API Button */}
          <button
            onClick={() => loadForecast(selectedDestination, true)}
            disabled={isRefreshing || loading}
            className="p-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            title="Refresh 5-Day Radar"
          >
            <span
              className={`material-symbols-outlined text-[18px] ${
                isRefreshing ? 'animate-spin text-primary' : ''
              }`}
            >
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4 animate-pulse py-4">
          <div className="h-20 bg-surface-container rounded-2xl" />
          <div className="grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-28 bg-surface-container rounded-xl" />
            ))}
          </div>
        </div>
      ) : weatherData ? (
        <>
          {/* Current Day Live Overview Hero Card */}
          <div className="bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low rounded-2xl p-4 sm:p-5 border border-surface-container-high/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-surface-container-lowest flex items-center justify-center text-primary shadow-xs shrink-0 border border-surface-container-high/30">
                <span className="material-symbols-outlined text-[34px]">
                  {weatherData.currentIcon}
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold text-on-surface font-display tracking-tight">
                    {formatTemp(weatherData.currentTempC)}
                  </span>
                  <span className="text-xs font-medium text-on-surface-variant">
                    Feels like {formatTemp(weatherData.feelsLikeC)}
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-on-surface mt-0.5 flex items-center gap-1.5">
                  <span>{weatherData.currentCondition}</span>
                  <span className="text-on-surface-variant font-normal">•</span>
                  <span className="text-emerald-700 font-semibold">{weatherData.airQuality}</span>
                </div>
              </div>
            </div>

            {/* Micro-metrics Pills */}
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs text-on-surface-variant">
              <div className="flex items-center gap-1 bg-surface-container-lowest px-2.5 py-1.5 rounded-xl border border-surface-container-high/40 shadow-xs">
                <span className="material-symbols-outlined text-primary text-[16px]">water_drop</span>
                <div>
                  <span className="text-[10px] text-on-surface-variant block uppercase font-bold">Humidity</span>
                  <span className="font-bold text-on-surface">{weatherData.humidity}%</span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-surface-container-lowest px-2.5 py-1.5 rounded-xl border border-surface-container-high/40 shadow-xs">
                <span className="material-symbols-outlined text-secondary text-[16px]">air</span>
                <div>
                  <span className="text-[10px] text-on-surface-variant block uppercase font-bold">Wind</span>
                  <span className="font-bold text-on-surface">
                    {unit === 'F' ? `${Math.round(weatherData.windKmh * 0.621371)} mph` : `${weatherData.windKmh} km/h`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-surface-container-lowest px-2.5 py-1.5 rounded-xl border border-surface-container-high/40 shadow-xs">
                <span className="material-symbols-outlined text-amber-500 text-[16px]">sunny</span>
                <div>
                  <span className="text-[10px] text-on-surface-variant block uppercase font-bold">UV Index</span>
                  <span className="font-bold text-on-surface">{weatherData.uvIndex} / 10</span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-surface-container-lowest px-2.5 py-1.5 rounded-xl border border-surface-container-high/40 shadow-xs">
                <span className="material-symbols-outlined text-orange-400 text-[16px]">wb_twilight</span>
                <div>
                  <span className="text-[10px] text-on-surface-variant block uppercase font-bold">Sun Times</span>
                  <span className="font-mono text-[11px] font-semibold text-on-surface">
                    {weatherData.sunrise} – {weatherData.sunset}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 5-Day Day-by-Day Forecast Track */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              <span>5-Day Outlook (Tap day for hourly trajectory)</span>
              <span className="text-[11px] font-normal lowercase">Updated {weatherData.lastUpdated}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
              {weatherData.forecast.map((day, idx) => {
                const isSelected = selectedDayIndex === idx;

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`rounded-xl p-3 sm:p-3.5 flex flex-col justify-between items-center text-center transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-primary/10 border-primary ring-2 ring-primary/30 shadow-sm scale-[1.02]'
                        : 'bg-surface-container-low hover:bg-surface-container border-surface-container-high/40'
                    }`}
                  >
                    {/* Day label & date */}
                    <div>
                      <div className="flex items-center gap-1 justify-center">
                        <span
                          className={`text-xs font-bold font-display ${
                            isSelected ? 'text-primary' : 'text-on-surface'
                          }`}
                        >
                          {day.dayLabel}
                        </span>
                        {idx === 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </div>
                      <span className="text-[11px] text-on-surface-variant font-mono">
                        {day.date.split('-').slice(1).join('/')}
                      </span>
                    </div>

                    {/* Condition Icon */}
                    <div className="my-2.5">
                      <span
                        className={`material-symbols-outlined text-[28px] ${
                          day.icon === 'wb_sunny'
                            ? 'text-amber-500'
                            : day.icon === 'rainy'
                            ? 'text-sky-600'
                            : day.icon === 'air'
                            ? 'text-secondary'
                            : 'text-primary'
                        }`}
                      >
                        {day.icon}
                      </span>
                      <div className="text-[11px] font-medium text-on-surface line-clamp-1 max-w-[90px] mx-auto mt-0.5">
                        {day.condition}
                      </div>
                    </div>

                    {/* Temp Bar & High/Low */}
                    <div className="w-full space-y-1">
                      <div className="flex items-baseline justify-between w-full text-xs font-bold">
                        <span className="text-on-surface">{formatTemp(day.highC)}</span>
                        <span className="text-on-surface-variant font-normal text-[11px]">
                          {formatTemp(day.lowC)}
                        </span>
                      </div>

                      {/* Visual gradient range bar */}
                      <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 to-amber-500 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(30, (day.highC / 30) * 100))}%`,
                          }}
                        />
                      </div>

                      {/* Rain chance badge */}
                      <div className="flex items-center justify-center gap-1 text-[10px] text-sky-700 font-semibold pt-0.5">
                        <span className="material-symbols-outlined text-[12px]">water_drop</span>
                        <span>{day.precipitationPercent}%</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Hourly Deep-Dive & Expedition Briefing */}
          {selectedDay && (
            <div className="bg-surface-container-low rounded-xl p-4 border border-surface-container-high/40 space-y-3 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-container-high/30 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider font-display">
                    {selectedDay.dayName} Details ({selectedDay.date})
                  </span>
                  <span className="text-xs text-on-surface-variant">•</span>
                  <span className="text-xs font-semibold text-on-surface">
                    {selectedDay.conditionDescription}
                  </span>
                </div>
                <div className="text-[11px] text-on-surface-variant font-medium">
                  Wind: {selectedDay.windSpeedKmh} km/h • Humidity: {selectedDay.humidity}%
                </div>
              </div>

              {/* Hourly preview pills */}
              <div className="grid grid-cols-5 gap-2">
                {selectedDay.hourlyPreview.map((hr) => (
                  <div
                    key={hr.time}
                    className="bg-surface-container-lowest rounded-lg p-2 text-center flex flex-col items-center gap-1 shadow-xs border border-surface-container-high/30"
                  >
                    <span className="text-[10px] font-mono text-on-surface-variant font-semibold">
                      {hr.time}
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      {hr.icon}
                    </span>
                    <span className="text-xs font-bold text-on-surface">{formatTemp(hr.tempC)}</span>
                    <span className="text-[10px] text-on-surface-variant line-clamp-1">{hr.condition}</span>
                  </div>
                ))}
              </div>

              {/* Expedition Clothing Advisory */}
              <div className="flex items-start gap-2.5 bg-surface-container-lowest rounded-xl p-3 border border-surface-container-high/40 text-xs">
                <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">
                  checkroom
                </span>
                <div className="flex-1">
                  <span className="font-bold text-on-surface">Packing Recommendation: </span>
                  <span className="text-on-surface-variant">{selectedDay.clothingTip}</span>
                </div>
                {onExploreRouteClick && (
                  <button
                    onClick={onExploreRouteClick}
                    className="text-primary hover:text-primary-dark font-bold underline shrink-0 cursor-pointer"
                  >
                    Check Route Spots
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Regional Expedition Insight Banner */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
              nature_people
            </span>
            <div className="text-xs text-on-surface leading-relaxed">
              <span className="font-bold text-primary">Atelier Weather Briefing: </span>
              {weatherData.expeditionInsight}
            </div>
          </div>
        </>
      ) : (
        <div className="p-8 text-center text-on-surface-variant text-xs">
          Unable to retrieve meteorology for this destination.
        </div>
      )}
    </div>
  );
};
