'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTravelStore } from '../store';
import { formatCurrency } from '@/lib/currencies';
import type { TripMapDestination, TripMapExtraSpot } from '@/components/map/TripMap';

const TripMap = dynamic(
  () => import('@/components/map/TripMap').then((mod) => mod.TripMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[380px] bg-slate-100 dark:bg-slate-850 rounded-2xl animate-pulse flex flex-col items-center justify-center gap-2 text-slate-400">
        <span className="material-symbols-outlined text-3xl animate-spin">refresh</span>
        <span className="text-xs font-mono">Initializing Interactive Atlas...</span>
      </div>
    ),
  }
);

interface SampleDestination {
  id: string;
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  description: string;
  coverImage: string;
  spots: TripMapExtraSpot[];
  itinerary: {
    day: number;
    title: string;
    activities: {
      time: string;
      title: string;
      location: string;
      category: 'nature' | 'culture' | 'food' | 'transport';
      costPhp: number;
    }[];
  }[];
}

const SAMPLE_DESTINATIONS: SampleDestination[] = [
  {
    id: 'el-nido',
    name: 'El Nido, Palawan',
    region: 'MIMAROPA',
    country: 'Philippines',
    latitude: 11.1949,
    longitude: 119.4013,
    description: 'Towering limestone karst cliffs, hidden lagoons, and crystalline emerald waters in Bacuit Bay.',
    coverImage: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80',
    spots: [
      { id: 'spot-1', name: 'Big Lagoon', categoryLabel: 'Nature / Lagoon', latitude: 11.1528, longitude: 119.3175, distanceMeters: 4200 },
      { id: 'spot-2', name: 'Nacpan Beach', categoryLabel: 'Beach / Scenic', latitude: 11.3197, longitude: 119.4244, distanceMeters: 14000 },
      { id: 'spot-3', name: 'Secret Lagoon', categoryLabel: 'Nature Reserve', latitude: 11.1442, longitude: 119.2994, distanceMeters: 5100 },
    ],
    itinerary: [
      {
        day: 1,
        title: 'Arrival & Bacuit Bay Sunset',
        activities: [
          { time: '11:00 AM', title: 'Lio Airport Arrival & Van Transfer', location: 'El Nido Town', category: 'transport', costPhp: 450 },
          { time: '02:00 PM', title: 'Check-in & Town Promenade', location: 'Calle Hama', category: 'culture', costPhp: 0 },
          { time: '05:30 PM', title: 'Las Cabañas Sunset & Cocktails', location: 'Marimegmeg Beach', category: 'food', costPhp: 850 },
        ],
      },
      {
        day: 2,
        title: 'Tour A: Lagoons & Snorkeling',
        activities: [
          { time: '08:30 AM', title: 'Board Outrigger Boat Tour A', location: 'El Nido Port', category: 'nature', costPhp: 1400 },
          { time: '10:30 AM', title: 'Big Lagoon Kayak Navigation', location: 'Big Lagoon', category: 'nature', costPhp: 350 },
          { time: '01:00 PM', title: 'Grilled Seafood Beach Lunch', location: 'Shimizu Island', category: 'food', costPhp: 0 },
          { time: '03:30 PM', title: 'Seven Commandos Beach Break', location: 'Bacuit Bay', category: 'nature', costPhp: 200 },
        ],
      },
      {
        day: 3,
        title: 'Nacpan Twin Beach & Inland Scenic',
        activities: [
          { time: '09:00 AM', title: 'Scooter Ride to Northern Beaches', location: 'Nacpan Highway', category: 'transport', costPhp: 600 },
          { time: '11:30 AM', title: 'Twin Beach Panorama Hike', location: 'Calitang Beach', category: 'nature', costPhp: 100 },
          { time: '02:00 PM', title: 'Local Palawan Claypot Dinner', location: 'El Nido Grill', category: 'food', costPhp: 650 },
        ],
      },
    ],
  },
  {
    id: 'kyoto',
    name: 'Kyoto Ancient Capital',
    region: 'Kansai',
    country: 'Japan',
    latitude: 35.0116,
    longitude: 135.7681,
    description: 'Serene Zen rock gardens, vermilion torii gates, imperial palaces, and atmospheric tea houses.',
    coverImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    spots: [
      { id: 'spot-k1', name: 'Fushimi Inari Taisha', categoryLabel: 'Historic Shrine', latitude: 34.9671, longitude: 135.7727, distanceMeters: 4800 },
      { id: 'spot-k2', name: 'Arashiyama Bamboo Grove', categoryLabel: 'Nature / Landmark', latitude: 35.0170, longitude: 135.6713, distanceMeters: 8900 },
      { id: 'spot-k3', name: 'Kinkaku-ji (Golden Pavilion)', categoryLabel: 'Buddhist Temple', latitude: 35.0394, longitude: 135.7292, distanceMeters: 5200 },
    ],
    itinerary: [
      {
        day: 1,
        title: 'Arrival & Gion Lanterns',
        activities: [
          { time: '01:00 PM', title: 'Haruka Express into Kyoto Station', location: 'Shimogyo Ward', category: 'transport', costPhp: 1200 },
          { time: '03:30 PM', title: 'Kiyomizu-dera Wooden Stage', location: 'Higashiyama', category: 'culture', costPhp: 400 },
          { time: '07:00 PM', title: 'Gion Evening Kaiseki Tasting', location: 'Hanamikoji Dori', category: 'food', costPhp: 2800 },
        ],
      },
      {
        day: 2,
        title: 'Torii Gates & Bamboo Paths',
        activities: [
          { time: '07:00 AM', title: 'Early Morning Fushimi Inari Ascent', location: 'Fushimi', category: 'culture', costPhp: 0 },
          { time: '11:30 AM', title: 'Nishiki Market Street Food Walk', location: 'Nakagyo Ward', category: 'food', costPhp: 1100 },
          { time: '03:00 PM', title: 'Arashiyama Bamboo & Monkey Park', location: 'Ukyo Ward', category: 'nature', costPhp: 750 },
        ],
      },
      {
        day: 3,
        title: 'Golden Zen & Philosopher’s Walk',
        activities: [
          { time: '09:00 AM', title: 'Kinkaku-ji Golden Pavilion', location: 'Kita Ward', category: 'culture', costPhp: 500 },
          { time: '01:30 PM', title: 'Philosopher’s Path Canal Stroll', location: 'Sakyo Ward', category: 'nature', costPhp: 0 },
          { time: '05:00 PM', title: 'Matcha Tea Ceremony Workshop', location: 'Sanjo', category: 'culture', costPhp: 1600 },
        ],
      },
    ],
  },
  {
    id: 'batanes',
    name: 'Batanes Archipelago',
    region: 'Cagayan Valley',
    country: 'Philippines',
    latitude: 20.4485,
    longitude: 121.9708,
    description: 'Windswept rolling hills, traditional Ivatan stone houses, and breathtaking Pacific Ocean cliffs.',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    spots: [
      { id: 'spot-b1', name: 'Basco Lighthouse', categoryLabel: 'Historic Lighthouse', latitude: 20.4578, longitude: 121.9689, distanceMeters: 1200 },
      { id: 'spot-b2', name: 'Marlboro Hills (Racuh A Payaman)', categoryLabel: 'Scenic Pasture', latitude: 20.4182, longitude: 121.9835, distanceMeters: 6200 },
      { id: 'spot-b3', name: 'Honesty Coffee Shop', categoryLabel: 'Heritage Landmark', latitude: 20.3702, longitude: 121.9281, distanceMeters: 9800 },
    ],
    itinerary: [
      {
        day: 1,
        title: 'North Batan Landscapes',
        activities: [
          { time: '09:00 AM', title: 'Basco Airport Welcoming', location: 'Basco Town', category: 'transport', costPhp: 250 },
          { time: '02:00 PM', title: 'Naidi Hills & Basco Lighthouse', location: 'Basco', category: 'culture', costPhp: 150 },
          { time: '05:30 PM', title: 'Sunset at Vayang Rolling Hills', location: 'North Batan', category: 'nature', costPhp: 0 },
        ],
      },
      {
        day: 2,
        title: 'South Batan Heritage & Cliffs',
        activities: [
          { time: '08:30 AM', title: 'Chawa Viewdeck Coastline', location: 'Mahatao', category: 'nature', costPhp: 100 },
          { time: '11:30 AM', title: 'Honesty Coffee Shop Visit', location: 'Ivana', category: 'culture', costPhp: 200 },
          { time: '02:30 PM', title: 'Marlboro Hills Grazing Panorama', location: 'Mahatao', category: 'nature', costPhp: 150 },
        ],
      },
      {
        day: 3,
        title: 'Sabtang Island Outrigger Voyage',
        activities: [
          { time: '06:30 AM', title: 'Faluwa Boat to Sabtang Port', location: 'Ivana Port', category: 'transport', costPhp: 350 },
          { time: '09:30 AM', title: 'Chavayan Ivatan Stone Village', location: 'Sabtang', category: 'culture', costPhp: 200 },
          { time: '01:00 PM', title: 'Morong Beach & Nakabuang Arch', location: 'Sabtang Coast', category: 'nature', costPhp: 150 },
        ],
      },
    ],
  },
  {
    id: 'cebu',
    name: 'Cebu Queen City & Highlands',
    region: 'Central Visayas',
    country: 'Philippines',
    latitude: 10.3157,
    longitude: 123.8854,
    description: 'Vibrant urban heritage, mountain temples, lechon delicacies, and gateway to southern waterfalls.',
    coverImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
    spots: [
      { id: 'spot-c1', name: "Magellan's Cross", categoryLabel: 'Historical Landmark', latitude: 10.2936, longitude: 123.9019, distanceMeters: 2800 },
      { id: 'spot-c2', name: 'Temple of Leah', categoryLabel: 'Highland Monument', latitude: 10.3702, longitude: 123.8703, distanceMeters: 7400 },
      { id: 'spot-c3', name: 'Sirao Flower Garden', categoryLabel: 'Botanical / Scenic', latitude: 10.4285, longitude: 123.8682, distanceMeters: 13500 },
    ],
    itinerary: [
      {
        day: 1,
        title: 'Heritage Core & Port History',
        activities: [
          { time: '10:00 AM', title: 'Fort San Pedro & Plaza Independencia', location: 'Pier Area', category: 'culture', costPhp: 75 },
          { time: '01:00 PM', title: 'Original Carcar Lechon Feast', location: 'Cebu City Center', category: 'food', costPhp: 550 },
          { time: '03:30 PM', title: "Basilica Minore del Sto. Niño", location: 'Downtown Cebu', category: 'culture', costPhp: 0 },
        ],
      },
      {
        day: 2,
        title: 'Busay Mountain Ridge & Highlands',
        activities: [
          { time: '09:00 AM', title: 'Temple of Leah Classical Vista', location: 'Busay', category: 'culture', costPhp: 150 },
          { time: '12:00 PM', title: 'Sirao Garden Little Amsterdam', location: 'Transcentral Hwy', category: 'nature', costPhp: 100 },
          { time: '06:00 PM', title: 'Tops Lookout Skyline Dining', location: 'Busay Hills', category: 'food', costPhp: 850 },
        ],
      },
      {
        day: 3,
        title: 'Southern Daytrip: Waterfalls & Reefs',
        activities: [
          { time: '06:00 AM', title: 'South Bus Terminal to Badian', location: 'Cebu City', category: 'transport', costPhp: 320 },
          { time: '09:30 AM', title: 'Kawasan Multi-Tier Falls Swim', location: 'Badian', category: 'nature', costPhp: 250 },
          { time: '03:00 PM', title: 'Moalboal Sardine Run Snorkel', location: 'Panagsama Beach', category: 'nature', costPhp: 500 },
        ],
      },
    ],
  },
];

export const LandingScreen: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTravelStore();

  const [selectedDestId, setSelectedDestId] = useState<string>('el-nido');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [targetBudget, setTargetBudget] = useState<number>(45000);
  const [rates, setRates] = useState<Record<string, number>>({ USD: 0.0158, JPY: 2.496, EUR: 0.0151, SGD: 0.0215 });
  const [weatherInfo, setWeatherInfo] = useState<{
    temp: number;
    condition: string;
    humidity: number;
    wind: number;
  } | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  const activeDest = SAMPLE_DESTINATIONS.find((d) => d.id === selectedDestId) || SAMPLE_DESTINATIONS[0];

  // Fetch real weather for selected destination
  useEffect(() => {
    let isCancelled = false;
    async function loadWeather() {
      setIsLoadingWeather(true);
      try {
        const res = await fetch(`/api/weather?latitude=${activeDest.latitude}&longitude=${activeDest.longitude}`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.current) {
            setWeatherInfo({
              temp: Math.round(data.current.temperature_2m ?? 28),
              condition: data.current.weather_description || 'Sunny & Pleasant',
              humidity: Math.round(data.current.relative_humidity_2m ?? 75),
              wind: Math.round(data.current.wind_speed_10m ?? 12),
            });
          }
        }
      } catch {
        // Fallback default
        if (!isCancelled) {
          setWeatherInfo({ temp: 28, condition: 'Partly Cloudy', humidity: 76, wind: 14 });
        }
      } finally {
        if (!isCancelled) setIsLoadingWeather(false);
      }
    }

    loadWeather();
    return () => {
      isCancelled = true;
    };
  }, [activeDest.latitude, activeDest.longitude]);

  // Fetch live exchange rates
  useEffect(() => {
    async function loadRates() {
      try {
        const res = await fetch('/api/exchange-rates');
        if (res.ok) {
          const data = await res.json();
          if (data.rates) {
            setRates({
              USD: data.rates.USD || 0.0158,
              JPY: data.rates.JPY || 2.496,
              EUR: data.rates.EUR || 0.0151,
              SGD: data.rates.SGD || 0.0215,
            });
          }
        }
      } catch {
        // keep defaults
      }
    }
    loadRates();
  }, []);

  const mapDestinations: TripMapDestination[] = [
    {
      id: activeDest.id,
      name: activeDest.name,
      country: activeDest.country,
      latitude: activeDest.latitude,
      longitude: activeDest.longitude,
      orderIndex: 0,
    },
  ];

  const currentItineraryDay = activeDest.itinerary.find((d) => d.day === selectedDay) || activeDest.itinerary[0];
  const dayTotalCost = currentItineraryDay.activities.reduce((sum, a) => sum + a.costPhp, 0);

  return (
    <div className="min-h-screen bg-surface text-on-surface transition-colors selection:bg-primary-container selection:text-on-primary-container font-sans">
      {/* Top Floating Glass Navigation */}
      <header className="sticky top-0 z-40 bg-surface/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-surface-container-high/60 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-xs group-hover:bg-primary-container transition-colors">
              <span className="material-symbols-outlined text-[20px]">explore</span>
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight font-display text-on-surface">
                TRAVELMATE
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono uppercase tracking-widest text-on-surface-variant font-semibold">
                Curated Trip Atelier
              </span>
            </div>
          </Link>

          {/* Quick Nav Anchors */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-on-surface-variant">
            <a href="#interactive-map" className="hover:text-primary transition-colors">
              Live Map Explorer
            </a>
            <a href="#itinerary-demo" className="hover:text-primary transition-colors">
              Itinerary Simulator
            </a>
            <a href="#budget-demo" className="hover:text-primary transition-colors">
              PHP Budget & Rates
            </a>
            <a href="#features" className="hover:text-primary transition-colors">
              Capabilities
            </a>
          </nav>

          {/* Actions & Theme */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              suppressHydrationWarning
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-9 h-9 rounded-xl bg-surface-container-lowest dark:bg-slate-800 border border-surface-container-high dark:border-slate-700 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              <span suppressHydrationWarning className="material-symbols-outlined text-[19px]">
                {darkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <Link
              href="/login"
              className="px-3.5 py-2 text-xs font-bold text-on-surface hover:text-primary rounded-xl transition-colors"
            >
              Sign In
            </Link>

            <Link
              href="/login"
              className="px-4 py-2 text-xs font-bold bg-primary hover:bg-primary-container text-on-primary rounded-xl shadow-xs transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-surface-container-high/40 dark:border-slate-800/60">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20 mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Interactive Trip Architecture • Zero Noise, Zero Ads</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-display tracking-tight text-on-surface max-w-4xl mx-auto leading-tight">
            Plan with intentionality. Every temple, hidden cove, and budget line item.
          </h1>

          <p className="mt-5 text-sm sm:text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto font-medium leading-relaxed">
            TravelMate unifies visual day-by-day itineraries, interactive Leaflet route maps, live Open-Meteo weather forecasts, and Philippine Peso expense tracking into one elegant atelier.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="px-6 py-3.5 rounded-2xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <span>Start Planning Your Trip</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
            <a
              href="#interactive-map"
              className="px-6 py-3.5 rounded-2xl bg-surface-container-lowest dark:bg-slate-800 text-on-surface hover:text-primary font-bold text-sm border border-surface-container-high dark:border-slate-700 shadow-xs hover:border-primary/40 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">travel_explore</span>
              <span>Test Interactive Demo</span>
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-surface-container-high/60 dark:border-slate-800">
            <div className="p-3 rounded-2xl bg-surface-container-low/70 dark:bg-slate-900/60">
              <div className="text-2xl font-black font-display text-primary">₱0</div>
              <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Free to Plan</div>
            </div>
            <div className="p-3 rounded-2xl bg-surface-container-low/70 dark:bg-slate-900/60">
              <div className="text-2xl font-black font-display text-primary">100%</div>
              <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Ad-Free Workspace</div>
            </div>
            <div className="p-3 rounded-2xl bg-surface-container-low/70 dark:bg-slate-900/60">
              <div className="text-2xl font-black font-display text-primary">Live</div>
              <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Weather & Exchange</div>
            </div>
            <div className="p-3 rounded-2xl bg-surface-container-low/70 dark:bg-slate-900/60">
              <div className="text-2xl font-black font-display text-primary">PHP (₱)</div>
              <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Native Base Currency</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: Interactive Destination & Map Explorer */}
      <section id="interactive-map" className="py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center md:text-left mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
              <span className="material-symbols-outlined text-[16px]">map</span>
              <span>Live Feature Sandbox</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-on-surface">
              Interactive Destination & Map Explorer
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Select a featured expedition below to inspect real Leaflet maps, geocoordinates, and top local attractions.
            </p>
          </div>

          {/* Destination Selector Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {SAMPLE_DESTINATIONS.map((dest) => {
              const isSelected = dest.id === selectedDestId;
              return (
                <button
                  key={dest.id}
                  type="button"
                  onClick={() => {
                    setSelectedDestId(dest.id);
                    setSelectedDay(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-on-primary shadow-xs ring-2 ring-primary/20'
                      : 'bg-surface-container-low dark:bg-slate-800 text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isSelected ? 'check_circle' : 'location_on'}
                  </span>
                  <span>{dest.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Map Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Destination Card & Live Weather (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Destination Highlight Card */}
            <div className="p-5 rounded-3xl bg-surface-container-lowest dark:bg-slate-900 border border-surface-container-high dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant mb-2">
                  <span className="uppercase tracking-wider font-mono text-[10px] text-primary font-bold">
                    {activeDest.region} • {activeDest.country}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Verified Route
                  </span>
                </div>

                <h3 className="text-xl font-black font-display text-on-surface">
                  {activeDest.name}
                </h3>
                <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                  {activeDest.description}
                </p>
              </div>

              {/* Geo Coordinates Pin */}
              <div className="mt-4 pt-3 border-t border-surface-container-high/60 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-on-surface-variant">
                <span>LAT: {activeDest.latitude.toFixed(4)}° N</span>
                <span>LON: {activeDest.longitude.toFixed(4)}° E</span>
              </div>
            </div>

            {/* Live Weather Forecast Widget */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-primary/10 via-surface-container-lowest to-surface-container-low dark:from-slate-900 dark:to-slate-850 border border-primary/20 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <span className="material-symbols-outlined text-[18px]">wb_sunny</span>
                  <span>Live Open-Meteo Weather</span>
                </div>
                {isLoadingWeather && (
                  <span className="text-[10px] font-mono text-slate-400 animate-pulse">Syncing...</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-black font-display text-on-surface">
                    {weatherInfo ? `${weatherInfo.temp}°C` : '28°C'}
                  </div>
                  <div className="text-xs font-semibold text-on-surface-variant capitalize mt-0.5">
                    {weatherInfo ? weatherInfo.condition : 'Fair Skies'}
                  </div>
                </div>
                <div className="text-right text-[11px] font-mono text-on-surface-variant space-y-1">
                  <div>Humidity: {weatherInfo ? `${weatherInfo.humidity}%` : '74%'}</div>
                  <div>Wind: {weatherInfo ? `${weatherInfo.wind} km/h` : '12 km/h'}</div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                Live forecast data retrieved from Open-Meteo public API with zero key delays.
              </p>
            </div>

            {/* Nearby Attraction POIs */}
            <div className="p-5 rounded-3xl bg-surface-container-lowest dark:bg-slate-900 border border-surface-container-high dark:border-slate-800 shadow-sm flex-1">
              <div className="text-xs font-bold text-on-surface mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">attractions</span>
                  <span>Curated Nearby Attractions</span>
                </span>
                <span className="text-[10px] font-mono text-on-surface-variant">Geoapify POIs</span>
              </div>

              <div className="space-y-2">
                {activeDest.spots.map((spot, idx) => (
                  <div
                    key={spot.id}
                    className="p-2.5 rounded-xl bg-surface-container-low dark:bg-slate-800/80 border border-surface-container-high/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-on-surface leading-tight">{spot.name}</div>
                        <div className="text-[10px] text-on-surface-variant">{spot.categoryLabel}</div>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 font-semibold">
                      {(spot.distanceMeters ? (spot.distanceMeters / 1000).toFixed(1) : '1.5')} km
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Real Leaflet Map (8 cols) */}
          <div className="lg:col-span-8 h-[440px] sm:h-[520px] rounded-3xl overflow-hidden border border-surface-container-high dark:border-slate-800 shadow-sm relative">
            <TripMap
              destinations={mapDestinations}
              extraSpots={activeDest.spots}
              className="w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* SECTION 2: Interactive Day-by-Day Itinerary Simulator */}
      <section id="itinerary-demo" className="py-16 md:py-20 bg-surface-container-low/50 dark:bg-slate-900/50 border-y border-surface-container-high/60 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>Visual Day Planner</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-on-surface">
              Interactive Itinerary Simulator
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-2">
              Switch through days to preview structured, time-blocked travel activities. In TravelMate, every activity synchronizes with your map and expense forecast.
            </p>
          </div>

          {/* Day Tabs */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {activeDest.itinerary.map((dayItem) => {
              const isSelected = dayItem.day === selectedDay;
              return (
                <button
                  key={dayItem.day}
                  type="button"
                  onClick={() => setSelectedDay(dayItem.day)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-lowest dark:bg-slate-800 text-on-surface-variant hover:text-on-surface border border-surface-container-high dark:border-slate-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">event</span>
                  <span>Day {dayItem.day}</span>
                </button>
              );
            })}
          </div>

          {/* Itinerary Schedule Card */}
          <div className="max-w-4xl mx-auto bg-surface-container-lowest dark:bg-slate-900 rounded-3xl border border-surface-container-high dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-container-high dark:border-slate-800 mb-6 gap-2">
              <div>
                <span className="text-[10px] font-mono text-primary uppercase font-bold tracking-wider">
                  Day {currentItineraryDay.day} Focus
                </span>
                <h3 className="text-lg font-black font-display text-on-surface">
                  {currentItineraryDay.title}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-on-surface-variant font-mono uppercase">Est. Day Spend</span>
                <div className="text-base font-black font-display text-primary">
                  {formatCurrency(dayTotalCost)}
                </div>
              </div>
            </div>

            {/* Activities Timeline */}
            <div className="space-y-4">
              {currentItineraryDay.activities.map((activity, idx) => {
                const badgeColor =
                  activity.category === 'nature'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : activity.category === 'culture'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                    : activity.category === 'food'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-surface-container-low dark:bg-slate-800/60 border border-surface-container-high/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="px-2 py-1 rounded-lg bg-surface-container-lowest dark:bg-slate-800 text-[11px] font-mono font-bold text-on-surface-variant border border-surface-container-high/80 dark:border-slate-700 whitespace-nowrap">
                        {activity.time}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-on-surface">{activity.title}</div>
                        <div className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">pin_drop</span>
                          <span>{activity.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto w-full sm:w-auto">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${badgeColor}`}>
                        {activity.category}
                      </span>
                      <span className="font-mono text-xs font-bold text-on-surface">
                        {activity.costPhp === 0 ? 'Complimentary' : formatCurrency(activity.costPhp)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Live Currency & Budget Estimator */}
      <section id="budget-demo" className="py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <span className="material-symbols-outlined text-[16px]">payments</span>
            <span>Financial Atelier</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-on-surface">
            Live PHP Budget & Multi-Currency Converter
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-2">
            Every budget in TravelMate is calibrated to Philippine Pesos (₱, PHP) with real-time live exchange rate conversions from European Central Bank & Frankfurter feeds.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Interactive Budget Slider (7 cols) */}
          <div className="md:col-span-7 p-6 sm:p-8 rounded-3xl bg-surface-container-lowest dark:bg-slate-900 border border-surface-container-high dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Trip Target Budget
              </div>
              <div className="text-3xl sm:text-4xl font-black font-display text-primary">
                {formatCurrency(targetBudget, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-1">
                Approx. {formatCurrency(Math.round(targetBudget / 7), { maximumFractionDigits: 0 })} / day (7-day itinerary)
              </div>

              {/* Slider */}
              <div className="mt-6">
                <input
                  type="range"
                  min={15000}
                  max={250000}
                  step={5000}
                  value={targetBudget}
                  onChange={(e) => setTargetBudget(Number(e.target.value))}
                  className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] font-mono text-on-surface-variant mt-2">
                  <span>₱15,000 (Local Weekend)</span>
                  <span>₱100,000</span>
                  <span>₱250,000 (International Long-Haul)</span>
                </div>
              </div>

              {/* Category Breakdown Bar */}
              <div className="mt-6 pt-5 border-t border-surface-container-high dark:border-slate-800">
                <div className="text-xs font-bold text-on-surface mb-2">Estimated Allocation Model</div>
                <div className="h-3 w-full rounded-full overflow-hidden flex shadow-inner">
                  <div style={{ width: '38%' }} className="bg-primary" title="Lodging (38%)" />
                  <div style={{ width: '25%' }} className="bg-secondary" title="Food (25%)" />
                  <div style={{ width: '22%' }} className="bg-[#7C3AED]" title="Activities (22%)" />
                  <div style={{ width: '15%' }} className="bg-primary-container" title="Transit (15%)" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-semibold text-on-surface-variant mt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span>Lodging: {formatCurrency(targetBudget * 0.38, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    <span>Food: {formatCurrency(targetBudget * 0.25, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                    <span>Tours: {formatCurrency(targetBudget * 0.22, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary-container" />
                    <span>Transit: {formatCurrency(targetBudget * 0.15, { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Multi-Currency Conversion Card (5 cols) */}
          <div className="md:col-span-5 p-6 sm:p-8 rounded-3xl bg-surface-container-lowest dark:bg-slate-900 border border-surface-container-high dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">currency_exchange</span>
                  <span>Live Foreign Equivalence</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">ECB Live</span>
              </div>

              <div className="space-y-3">
                {/* JPY */}
                <div className="p-3 rounded-2xl bg-surface-container-low dark:bg-slate-800/80 border border-surface-container-high/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-on-surface">JPY (Japanese Yen)</span>
                  </div>
                  <div className="text-right font-mono font-bold text-xs text-primary">
                    ¥{Math.round(targetBudget * (rates.JPY || 2.496)).toLocaleString()}
                  </div>
                </div>

                {/* USD */}
                <div className="p-3 rounded-2xl bg-surface-container-low dark:bg-slate-800/80 border border-surface-container-high/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-on-surface">USD (US Dollar)</span>
                  </div>
                  <div className="text-right font-mono font-bold text-xs text-primary">
                    ${(targetBudget * (rates.USD || 0.0158)).toFixed(2)}
                  </div>
                </div>

                {/* EUR */}
                <div className="p-3 rounded-2xl bg-surface-container-low dark:bg-slate-800/80 border border-surface-container-high/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-on-surface">EUR (Euro)</span>
                  </div>
                  <div className="text-right font-mono font-bold text-xs text-primary">
                    €{(targetBudget * (rates.EUR || 0.0151)).toFixed(2)}
                  </div>
                </div>

                {/* SGD */}
                <div className="p-3 rounded-2xl bg-surface-container-low dark:bg-slate-800/80 border border-surface-container-high/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-on-surface">SGD (Singapore Dollar)</span>
                  </div>
                  <div className="text-right font-mono font-bold text-xs text-primary">
                    S${(targetBudget * (rates.SGD || 0.0215)).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 mt-4 leading-tight">
              Rates updated live via Frankfurter API. TravelMate converts automatically during multi-currency expense entry.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: Core Capabilities Bento Grid */}
      <section id="features" className="py-16 md:py-20 bg-surface-container-low/40 dark:bg-slate-900/40 border-t border-surface-container-high/60 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
              <span className="material-symbols-outlined text-[16px]">diamond</span>
              <span>Architectural Strengths</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-on-surface">
              Engineered for Modern Travelers
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-2">
              Everything you need to orchestrate unforgettable journeys without subscription paywalls or clutter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-surface-container-lowest dark:bg-slate-900 border border-surface-container-high dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[22px]">calendar_month</span>
              </div>
              <h3 className="text-base font-bold text-on-surface font-display mb-1">
                Visual Day-by-Day Timelines
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Effortlessly organize flights, tours, meals, and free time into clean daily schedule cards with category tags.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-surface-container-lowest dark:bg-slate-900 border border-surface-container-high dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[22px]">route</span>
              </div>
              <h3 className="text-base font-bold text-on-surface font-display mb-1">
                Interactive Leaflet Maps
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Connect destinations with route polylines and inspect top attractions directly on OpenStreetMap tiles.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-surface-container-lowest dark:bg-slate-900 border border-surface-container-high dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[22px]">cloud</span>
              </div>
              <h3 className="text-base font-bold text-on-surface font-display mb-1">
                Live Open-Meteo Weather
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                View 7-day temperature forecasts and atmospheric alerts for your exact dates before you pack your bags.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-surface-container-lowest dark:bg-slate-900 border border-surface-container-high dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[22px]">pie_chart</span>
              </div>
              <h3 className="text-base font-bold text-on-surface font-display mb-1">
                Smart Expense Analytics
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Track category variances, daily burn rates, and multi-currency outlays strictly consolidated in Philippine Pesos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-white">
              Ready to orchestrate your next journey?
            </h2>
            <p className="text-xs sm:text-sm text-slate-100 mt-3 font-medium">
              Start building your personalized travel itinerary, map routes, and budget in seconds. No credit card required.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className="px-6 py-3.5 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <span>Create Free Traveler Account</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
              <Link
                href="/login"
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all"
              >
                Sign In to Existing Trip
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-container-high/60 dark:border-slate-800 py-8 bg-surface dark:bg-slate-950 text-on-surface-variant text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs tracking-tight font-display text-on-surface">TRAVELMATE</span>
            <span>• Curated Trip Architecture</span>
          </div>
          <div className="text-[11px] text-slate-400 text-center sm:text-right">
            Weather via Open-Meteo. Maps & POIs via OpenStreetMap & Geoapify. Currencies via ECB & Frankfurter.
          </div>
        </div>
      </footer>
    </div>
  );
};
