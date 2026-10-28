'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useTravelStore } from '../store';
import { createClient } from '@/lib/supabase/client';
import { signInSchema, signUpSchema } from '@/lib/validators/auth';
import type { TripMapDestination, TripMapExtraSpot } from '@/components/map/TripMap';
import { CurrencyConverter } from '@/components/CurrencyConverter';
import { RecommendedDestinationsSection } from '@/components/RecommendedDestinationsSection';
import type { TravelerDestinationRecommendation } from '@/lib/recommendations';

const TripMap = dynamic(
  () => import('@/components/map/TripMap').then((mod) => mod.TripMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[380px] bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse flex flex-col items-center justify-center gap-2 text-slate-400">
        <span className="material-symbols-outlined text-3xl animate-spin">refresh</span>
        <span className="text-xs font-mono">Loading Interactive Map...</span>
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
  currency: string;
  clothingTip: string;
  description: string;
  spots: TripMapExtraSpot[];
}

const SAMPLE_DESTINATIONS: SampleDestination[] = [
  {
    id: 'el-nido',
    name: 'El Nido, Palawan',
    region: 'MIMAROPA',
    country: 'Philippines',
    currency: 'PHP',
    latitude: 11.1949,
    longitude: 119.4013,
    clothingTip: 'Light breathable linen, water sandals, dry bag, and high-SPF reef-safe sunscreen for island boat tours.',
    description: 'Limestone karst cliffs, hidden lagoons, and crystal waters in Bacuit Bay.',
    spots: [
      { id: 'spot-1', name: 'Big Lagoon', categoryLabel: 'Nature / Lagoon', latitude: 11.1528, longitude: 119.3175, distanceMeters: 4200 },
      { id: 'spot-2', name: 'Nacpan Beach', categoryLabel: 'Beach', latitude: 11.3197, longitude: 119.4244, distanceMeters: 14000 },
      { id: 'spot-3', name: 'Secret Lagoon', categoryLabel: 'Nature Reserve', latitude: 11.1442, longitude: 119.2994, distanceMeters: 5100 },
    ],
  },
  {
    id: 'kyoto',
    name: 'Kyoto',
    region: 'Kansai',
    country: 'Japan',
    currency: 'JPY',
    latitude: 35.0116,
    longitude: 135.7681,
    clothingTip: 'Comfortable walking shoes for temple stairs, slip-on shoes for tatami mats, and layered jacket for cool evenings.',
    description: 'Historic temples, rock gardens, vermilion torii gates, and traditional tea houses.',
    spots: [
      { id: 'spot-k1', name: 'Fushimi Inari Taisha', categoryLabel: 'Historic Shrine', latitude: 34.9671, longitude: 135.7727, distanceMeters: 4800 },
      { id: 'spot-k2', name: 'Arashiyama Bamboo Grove', categoryLabel: 'Nature', latitude: 35.0170, longitude: 135.6713, distanceMeters: 8900 },
      { id: 'spot-k3', name: 'Kinkaku-ji (Golden Pavilion)', categoryLabel: 'Buddhist Temple', latitude: 35.0394, longitude: 135.7292, distanceMeters: 5200 },
    ],
  },
  {
    id: 'batanes',
    name: 'Batanes',
    region: 'Cagayan Valley',
    country: 'Philippines',
    currency: 'PHP',
    latitude: 20.4485,
    longitude: 121.9708,
    clothingTip: 'Windbreaker jacket for seaside cliffs, sturdy trekking footwear, and camera strap for high-wind pasture vistas.',
    description: 'Rolling hills, traditional stone houses, and breathtaking coastal cliffs.',
    spots: [
      { id: 'spot-b1', name: 'Basco Lighthouse', categoryLabel: 'Lighthouse', latitude: 20.4578, longitude: 121.9689, distanceMeters: 1200 },
      { id: 'spot-b2', name: 'Marlboro Hills', categoryLabel: 'Scenic Pasture', latitude: 20.4182, longitude: 121.9835, distanceMeters: 6200 },
      { id: 'spot-b3', name: 'Honesty Coffee Shop', categoryLabel: 'Heritage Site', latitude: 20.3702, longitude: 121.9281, distanceMeters: 9800 },
    ],
  },
  {
    id: 'cebu',
    name: 'Cebu',
    region: 'Central Visayas',
    country: 'Philippines',
    currency: 'PHP',
    latitude: 10.3157,
    longitude: 123.8854,
    clothingTip: 'Casual summer apparel, quick-dry activewear for mountain viewpoints, and swimwear for waterfalls.',
    description: 'Colonial heritage, highland viewpoints, rich food culture, and waterfalls.',
    spots: [
      { id: 'spot-c1', name: "Magellan's Cross", categoryLabel: 'Historical Landmark', latitude: 10.2936, longitude: 123.9019, distanceMeters: 2800 },
      { id: 'spot-c2', name: 'Temple of Leah', categoryLabel: 'Highland Monument', latitude: 10.3702, longitude: 123.8703, distanceMeters: 7400 },
      { id: 'spot-c3', name: 'Sirao Flower Garden', categoryLabel: 'Botanical Garden', latitude: 10.4285, longitude: 123.8682, distanceMeters: 13500 },
    ],
  },
];

interface DayForecastItem {
  date: string;
  dayName: string;
  dayLabel: string;
  condition: string;
  icon: string;
  highC: number;
  lowC: number;
  precipitationPercent: number;
}

export const LandingScreen: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setCurrentUser, darkMode, toggleDarkMode } = useTravelStore();

  // Auth Modal State (open if on /login or requested via URL query)
  const isDirectLoginRoute = pathname === '/login';
  const [isDismissed, setIsDismissed] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(
    !isDismissed && (isDirectLoginRoute || searchParams.get('auth') !== null || searchParams.get('reason') !== null)
  );
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Destination & Live Weather State
  const [selectedDestId, setSelectedDestId] = useState<string>('el-nido');
  const [weatherInfo, setWeatherInfo] = useState<{
    currentTempC: number;
    feelsLikeC: number;
    condition: string;
    icon: string;
    humidity: number;
    windKmh: number;
    forecast: DayForecastItem[];
  } | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  const [customPreviewDest, setCustomPreviewDest] = useState<SampleDestination | null>(null);
  const activeDest =
    (customPreviewDest && customPreviewDest.id === selectedDestId ? customPreviewDest : null) ||
    SAMPLE_DESTINATIONS.find((d) => d.id === selectedDestId) ||
    SAMPLE_DESTINATIONS[0];

  const handlePreviewRecommendedDestination = (rec: TravelerDestinationRecommendation) => {
    setCustomPreviewDest({
      id: rec.id,
      name: rec.name,
      region: rec.region,
      country: rec.country,
      latitude: rec.latitude,
      longitude: rec.longitude,
      currency: rec.currency,
      clothingTip: rec.clothingTip,
      description: rec.summary,
      spots: rec.spots,
    });
    setSelectedDestId(rec.id);
    if (typeof document !== 'undefined') {
      document.getElementById('interactive-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePlanRecommendedDestination = (rec: TravelerDestinationRecommendation) => {
    setCustomPreviewDest({
      id: rec.id,
      name: rec.name,
      region: rec.region,
      country: rec.country,
      latitude: rec.latitude,
      longitude: rec.longitude,
      currency: rec.currency,
      clothingTip: rec.clothingTip,
      description: rec.summary,
      spots: rec.spots,
    });
    setSelectedDestId(rec.id);
    try {
      sessionStorage.setItem(
        'travelmate_recommended_dest',
        JSON.stringify({
          name: rec.name,
          country: rec.country,
          latitude: rec.latitude,
          longitude: rec.longitude,
        })
      );
    } catch {}
    handleOpenAuthModal('signup');
  };

  const handleOpenAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthErrorMessage(null);
    setIsDismissed(false);
    setIsAuthModalOpen(true);
  };

  const handleCloseAuthModal = React.useCallback(() => {
    setIsDismissed(true);
    setIsAuthModalOpen(false);
    setAuthErrorMessage(null);
    try {
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/');
      }
    } catch {}
    if (pathname === '/login' || searchParams.get('reason') || searchParams.get('auth')) {
      router.replace('/');
    }
  }, [pathname, searchParams, router]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseAuthModal();
      }
    };
    if (isAuthModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, handleCloseAuthModal]);

  // Handle idle logout query param
  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'idle' && !isDismissed) {
      setAuthErrorMessage('You have been signed out due to inactivity.');
      setIsAuthModalOpen(true);
      setAuthMode('signin');
    }
  }, [searchParams, isDismissed]);

  // Auth submission handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthErrorMessage(null);

    const supabase = createClient();
    const redirectTo = searchParams.get('redirectTo') || '/dashboard';

    if (authMode === 'signin') {
      const validation = signInSchema.safeParse({ email, password });
      if (!validation.success) {
        setAuthErrorMessage(validation.error.errors[0]?.message || 'Please check your inputs.');
        setIsAuthLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setAuthErrorMessage('Invalid email or password. Please try again.');
          setIsAuthLoading(false);
          return;
        }

        if (data?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url, role, is_active')
            .eq('id', data.user.id)
            .single();

          if (profile && profile.is_active === false) {
            await supabase.auth.signOut();
            setAuthErrorMessage('Your account is deactivated. Please contact an administrator.');
            setIsAuthLoading(false);
            return;
          }

          setCurrentUser({
            name:
              profile?.display_name ||
              (data.user.user_metadata?.full_name as string) ||
              (data.user.user_metadata?.name as string) ||
              email.trim().split('@')[0],
            email: data.user.email || email.trim(),
            avatar:
              profile?.avatar_url ||
              (data.user.user_metadata?.avatar_url as string) ||
              '/avatars/fox-explorer.svg',
            role: profile?.role === 'admin' ? 'Lead Curator' : 'Traveler',
          });
        }

        const now = Date.now();
        try {
          localStorage.setItem('travelmate_last_active_time', String(now));
          document.cookie = `travelmate_last_active=${now}; path=/; max-age=604800; SameSite=Lax`;
        } catch {}

        setToastMessage('Signed in successfully.');
        setIsAuthModalOpen(false);
        router.push(redirectTo);
        router.refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Authentication service error';
        setAuthErrorMessage(msg);
        setIsAuthLoading(false);
      }
    } else {
      // Sign Up
      const validation = signUpSchema.safeParse({ name, email, password });
      if (!validation.success) {
        setAuthErrorMessage(validation.error.errors[0]?.message || 'Please check your inputs.');
        setIsAuthLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
          },
        });

        if (error) {
          setAuthErrorMessage(error.message);
          setIsAuthLoading(false);
          return;
        }

        if (data.session) {
          setToastMessage('Account created successfully.');
          if (data.user) {
            setCurrentUser({
              name: name.trim() || email.trim().split('@')[0],
              email: data.user.email || email.trim(),
              avatar:
                '/avatars/fox-explorer.svg',
              role: 'Traveler',
            });
          }
          setIsAuthModalOpen(false);
          router.push('/dashboard');
          router.refresh();
        } else {
          setToastMessage(
            'Confirmation link sent! Please check your email to activate your account.'
          );
          setIsAuthLoading(false);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Authentication service error';
        setAuthErrorMessage(msg);
        setIsAuthLoading(false);
      }
    }
  };

  // Fetch real Open-Meteo weather for selected destination
  useEffect(() => {
    let isCancelled = false;
    async function loadWeather() {
      setIsLoadingWeather(true);
      try {
        const res = await fetch(`/api/weather?lat=${activeDest.latitude}&lon=${activeDest.longitude}`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data) {
            setWeatherInfo({
              currentTempC: Math.round(data.currentTempC ?? 28),
              feelsLikeC: Math.round(data.feelsLikeC ?? data.currentTempC ?? 28),
              condition: data.condition || 'Sunny',
              icon: data.icon || 'wb_sunny',
              humidity: Math.round(data.humidity ?? 75),
              windKmh: Math.round(data.windKmh ?? 12),
              forecast: data.forecast || [],
            });
          }
        } else {
          throw new Error('Weather API returned error status');
        }
      } catch {
        if (!isCancelled) {
          // Reliable regional default fallback
          setWeatherInfo({
            currentTempC: activeDest.country === 'Japan' ? 18 : 29,
            feelsLikeC: activeDest.country === 'Japan' ? 17 : 32,
            condition: activeDest.country === 'Japan' ? 'Clear Skies' : 'Tropical Fair',
            icon: 'wb_sunny',
            humidity: activeDest.country === 'Japan' ? 58 : 78,
            windKmh: 14,
            forecast: [
              { date: 'Day 1', dayName: 'Today', dayLabel: 'Day 1', condition: 'Sunny', icon: 'wb_sunny', highC: activeDest.country === 'Japan' ? 20 : 31, lowC: activeDest.country === 'Japan' ? 12 : 24, precipitationPercent: 10 },
              { date: 'Day 2', dayName: 'Tomorrow', dayLabel: 'Day 2', condition: 'Partly Cloudy', icon: 'partly_cloudy_day', highC: activeDest.country === 'Japan' ? 19 : 30, lowC: activeDest.country === 'Japan' ? 11 : 25, precipitationPercent: 20 },
              { date: 'Day 3', dayName: 'Day 3', dayLabel: 'Day 3', condition: 'Fair', icon: 'wb_sunny', highC: activeDest.country === 'Japan' ? 21 : 31, lowC: activeDest.country === 'Japan' ? 13 : 24, precipitationPercent: 15 },
              { date: 'Day 4', dayName: 'Day 4', dayLabel: 'Day 4', condition: 'Scattered Clouds', icon: 'cloud', highC: activeDest.country === 'Japan' ? 18 : 29, lowC: activeDest.country === 'Japan' ? 10 : 24, precipitationPercent: 30 },
              { date: 'Day 5', dayName: 'Day 5', dayLabel: 'Day 5', condition: 'Clear', icon: 'wb_sunny', highC: activeDest.country === 'Japan' ? 22 : 32, lowC: activeDest.country === 'Japan' ? 14 : 25, precipitationPercent: 10 },
            ],
          });
        }
      } finally {
        if (!isCancelled) setIsLoadingWeather(false);
      }
    }

    loadWeather();
    return () => {
      isCancelled = true;
    };
  }, [activeDest.latitude, activeDest.longitude, activeDest.country]);

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

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-sans transition-colors selection:bg-primary/20 selection:text-primary w-full max-w-full overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-[calc(100vw-2.5rem)] px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-surface/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-surface-container-high/60 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-xs">
              <span className="material-symbols-outlined text-[20px]">explore</span>
            </div>
            <span className="font-extrabold text-base tracking-tight font-display text-on-surface">
              TRAVELMATE
            </span>
          </Link>

          {/* Nav Links & Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-on-surface-variant mr-2">
              <a href="#recommended-destinations" className="hover:text-primary transition-colors">
                Recommended
              </a>
              <a href="#interactive-map" className="hover:text-primary transition-colors">
                Destinations &amp; Maps
              </a>
              <a href="#weather-section" className="hover:text-primary transition-colors">
                Live Weather
              </a>
              <a href="#currency-section" className="hover:text-primary transition-colors">
                Currency Converter
              </a>
            </div>

            {/* Dark / Light Mode Toggle */}
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

            {/* Sign In Trigger Button */}
            <button
              type="button"
              onClick={() => handleOpenAuthModal('signin')}
              className="px-3.5 py-2 text-xs font-bold text-on-surface hover:text-primary rounded-xl transition-colors cursor-pointer"
            >
              Sign In
            </button>

            {/* Create Account Trigger Button */}
            <button
              type="button"
              onClick={() => handleOpenAuthModal('signup')}
              className="px-4 py-2 text-xs font-bold bg-primary hover:bg-primary-container text-on-primary rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section: Clean, Uncluttered, No Embedded Auth Card */}
      <section className="relative overflow-x-clip pt-8 pb-12 sm:pt-14 sm:pb-18 md:pt-16 md:pb-22 border-b border-surface-container-high/60 dark:border-slate-800 w-full max-w-full">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Clear Value Proposition & Primary Call-to-Actions */}
            <div className="lg:col-span-7 space-y-5 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <span className="material-symbols-outlined text-[15px]">verified</span>
                <span>Curated Trip Architecture for Explorers</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-on-surface leading-tight">
                Plan your trips, simply.
              </h1>

              <p className="text-sm sm:text-base text-on-surface-variant font-medium leading-relaxed max-w-xl">
                Day-by-day itineraries, interactive route maps, live Open-Meteo weather forecasts, and expense tracking — all formatted in Philippine Pesos (₱).
              </p>

              {/* Action Buttons: Open Auth Modal on Click */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenAuthModal('signup')}
                  className="px-5 py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Start Planning Free</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAuthModal('signin')}
                  className="px-5 py-3 rounded-xl bg-surface-container-lowest dark:bg-slate-800 border border-surface-container-high dark:border-slate-700 text-on-surface hover:text-primary font-bold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  <span>Sign In</span>
                </button>

                <a
                  href="#interactive-map"
                  className="px-3 py-3 text-xs sm:text-sm font-bold text-primary hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Explore Live Tools</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                </a>
              </div>

              {/* Feature Highlights Bento Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                <div className="p-3.5 rounded-2xl bg-surface-container-low/70 dark:bg-slate-900/60 border border-surface-container-high/40 dark:border-slate-800">
                  <div className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">calendar_today</span>
                    <span>Itineraries</span>
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1">Day-by-day schedules with activity tags</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-container-low/70 dark:bg-slate-900/60 border border-surface-container-high/40 dark:border-slate-800">
                  <div className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">map</span>
                    <span>Maps &amp; Weather</span>
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1">OpenStreetMap routes &amp; Open-Meteo radars</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-container-low/70 dark:bg-slate-900/60 border border-surface-container-high/40 dark:border-slate-800">
                  <div className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">payments</span>
                    <span>Expenses (₱)</span>
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1">PHP budgeting with multi-currency rates</div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Trip Architecture Snapshot Card */}
            <div className="lg:col-span-5 w-full">
              <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-3xl border border-surface-container-high dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-7 transition-colors">
                <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/60 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-on-surface">Live Expedition Dossier</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                    Sample Plan
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-black font-display text-on-surface">
                        El Nido Bacuit Expedition
                      </h3>
                      <p className="text-xs text-on-surface-variant">5 Days • Palawan, Philippines</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-slate-400">Total Budget</div>
                      <div className="text-base font-black font-display text-primary">₱38,500</div>
                    </div>
                  </div>

                  {/* Micro Itinerary Track */}
                  <div className="mt-4 space-y-2">
                    <div className="p-2.5 rounded-xl bg-surface-container-low dark:bg-slate-800/80 border border-surface-container-high/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">D1</span>
                        <span className="font-semibold text-on-surface">Lio Beach Arrival &amp; Sunset Chill</span>
                      </div>
                      <span className="text-[11px] font-mono text-on-surface-variant">₱1,200</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-surface-container-low dark:bg-slate-800/80 border border-surface-container-high/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">D2</span>
                        <span className="font-semibold text-on-surface">Big Lagoon &amp; Secret Beach Kayak</span>
                      </div>
                      <span className="text-[11px] font-mono text-on-surface-variant">₱3,800</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-surface-container-low dark:bg-slate-800/80 border border-surface-container-high/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">D3</span>
                        <span className="font-semibold text-on-surface">Nacpan Twin Beach Motorbike Ride</span>
                      </div>
                      <span className="text-[11px] font-mono text-on-surface-variant">₱2,400</span>
                    </div>
                  </div>

                  {/* Card Action */}
                  <button
                    type="button"
                    onClick={() => handleOpenAuthModal('signup')}
                    className="w-full mt-4 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Create Your Custom Trip</span>
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <RecommendedDestinationsSection
        activeDestinationId={selectedDestId}
        onPreviewDestination={handlePreviewRecommendedDestination}
        onPlanTrip={handlePlanRecommendedDestination}
      />

      {/* SECTION 2: Interactive Destination & Leaflet Map Explorer */}
      <section id="interactive-map" className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full max-w-full overflow-x-clip">
        <div className="text-center md:text-left mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
              <span className="material-symbols-outlined text-[16px]">explore</span>
              <span>Destination Intelligence</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-on-surface">
              Explore Destinations
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Select a location to inspect interactive routes, local attractions, and current coordinates.
            </p>
          </div>

          {/* Destination Selector Chips */}
          <div className="w-full sm:w-auto max-w-full flex flex-wrap items-center gap-2 py-1 justify-start sm:justify-end">
            {SAMPLE_DESTINATIONS.map((dest) => {
              const isSelected = dest.id === selectedDestId;
              return (
                <button
                  key={dest.id}
                  type="button"
                  onClick={() => {
                    setCustomPreviewDest(null);
                    setSelectedDestId(dest.id);
                  }}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 touch-manipulation whitespace-nowrap min-h-[42px] ${
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Destination Card & Key Attractions */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-4">
            <div className="p-5 rounded-3xl bg-surface-container-lowest dark:bg-slate-900 border border-surface-container-high dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono font-semibold text-primary">
                  {activeDest.region} • {activeDest.country}
                </span>

                <h3 className="text-lg font-black font-display text-on-surface mt-1">
                  {activeDest.name}
                </h3>
                <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                  {activeDest.description}
                </p>
              </div>

              {/* Key Attractions */}
              <div className="mt-4 pt-3 border-t border-surface-container-high/60 dark:border-slate-800/80">
                <div className="text-[11px] font-bold text-on-surface mb-2">Key Attractions</div>
                <div className="space-y-1.5">
                  {activeDest.spots.length === 0 && (
                    <div className="p-2.5 rounded-xl bg-surface-container-low dark:bg-slate-800/80 border border-surface-container-high/60 dark:border-slate-700/60 text-xs text-on-surface-variant">
                      Map centered on {activeDest.name} ({activeDest.latitude.toFixed(2)}°, {activeDest.longitude.toFixed(2)}°).
                    </div>
                  )}
                  {activeDest.spots.map((spot, idx) => (
                    <div
                      key={spot.id}
                      className="p-2 rounded-xl bg-surface-container-low dark:bg-slate-800/80 border border-surface-container-high/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-on-surface">{spot.name}</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant">{spot.categoryLabel}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Climate Note */}
            <div className="p-4 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/20 text-xs text-on-surface flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                checkroom
              </span>
              <div>
                <span className="font-bold text-primary">Packing Note: </span>
                <span className="text-on-surface-variant">{activeDest.clothingTip}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Real Leaflet Map */}
          <div className="md:col-span-7 lg:col-span-8 min-h-[380px] sm:min-h-[440px] rounded-3xl overflow-hidden border border-surface-container-high dark:border-slate-800 shadow-sm relative">
            <TripMap
              destinations={mapDestinations}
              extraSpots={activeDest.spots}
              className="w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* SECTION 3: Live Weather Radar & Forecast (Brought Back!) */}
      <section id="weather-section" className="py-12 md:py-16 bg-surface-container-low/40 dark:bg-slate-900/40 border-t border-surface-container-high/60 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
              <span className="material-symbols-outlined text-[16px]">thermostat</span>
              <span>Live Meteorology</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-on-surface">
              Live Weather Radar &amp; 5-Day Outlook
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-2">
              Real-time atmospheric forecasts via Open-Meteo with humidity, wind speed, precipitation probability, and clothing packing recommendations for {activeDest.name}.
            </p>
          </div>

          {/* Weather Content Card */}
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-surface-container-high dark:border-slate-800 shadow-sm flex flex-col gap-6">
            {/* Current Conditions Bar */}
            <div className="bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-800/80 rounded-2xl p-4 sm:p-5 border border-surface-container-high/40 dark:border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-surface-container-lowest dark:bg-slate-900 flex items-center justify-center text-primary shadow-xs shrink-0 border border-surface-container-high/30">
                  <span className="material-symbols-outlined text-[34px]">
                    {weatherInfo?.icon || 'wb_sunny'}
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-on-surface font-display tracking-tight">
                      {weatherInfo ? `${weatherInfo.currentTempC}°C` : '28°C'}
                    </span>
                    <span className="text-xs font-medium text-on-surface-variant">
                      Feels like {weatherInfo ? `${weatherInfo.feelsLikeC}°C` : '30°C'}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-on-surface mt-0.5 flex items-center gap-1.5">
                    <span>{weatherInfo?.condition || 'Fair Skies'}</span>
                    <span className="text-on-surface-variant font-normal">•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{activeDest.name}</span>
                  </div>
                </div>
              </div>

              {/* Weather Metrics */}
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs text-on-surface-variant">
                <div className="flex items-center gap-1.5 bg-surface-container-lowest dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-surface-container-high/40 dark:border-slate-700/60 shadow-xs">
                  <span className="material-symbols-outlined text-primary text-[16px]">water_drop</span>
                  <div>
                    <span className="text-[10px] text-on-surface-variant block uppercase font-bold">Humidity</span>
                    <span className="font-bold text-on-surface">{weatherInfo?.humidity ?? 75}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-surface-container-lowest dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-surface-container-high/40 dark:border-slate-700/60 shadow-xs">
                  <span className="material-symbols-outlined text-secondary text-[16px]">air</span>
                  <div>
                    <span className="text-[10px] text-on-surface-variant block uppercase font-bold">Wind</span>
                    <span className="font-bold text-on-surface">{weatherInfo?.windKmh ?? 12} km/h</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-surface-container-lowest dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-surface-container-high/40 dark:border-slate-700/60 shadow-xs">
                  <span className="material-symbols-outlined text-amber-500 text-[16px]">wb_sunny</span>
                  <div>
                    <span className="text-[10px] text-on-surface-variant block uppercase font-bold">UV Status</span>
                    <span className="font-bold text-on-surface">Moderate</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5-Day Outlook Track */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">
                <span>5-Day Outlook for {activeDest.name}</span>
                {isLoadingWeather && (
                  <span className="text-[11px] font-mono text-primary animate-pulse">Syncing Open-Meteo...</span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {(weatherInfo?.forecast && weatherInfo.forecast.length > 0
                  ? weatherInfo.forecast
                  : [
                      { date: 'Day 1', dayName: 'Today', dayLabel: 'Day 1', condition: 'Sunny', icon: 'wb_sunny', highC: 31, lowC: 24, precipitationPercent: 10 },
                      { date: 'Day 2', dayName: 'Tomorrow', dayLabel: 'Day 2', condition: 'Partly Cloudy', icon: 'partly_cloudy_day', highC: 30, lowC: 25, precipitationPercent: 20 },
                      { date: 'Day 3', dayName: 'Day 3', dayLabel: 'Day 3', condition: 'Clear', icon: 'wb_sunny', highC: 31, lowC: 24, precipitationPercent: 15 },
                      { date: 'Day 4', dayName: 'Day 4', dayLabel: 'Day 4', condition: 'Scattered Showers', icon: 'rainy', highC: 29, lowC: 24, precipitationPercent: 40 },
                      { date: 'Day 5', dayName: 'Day 5', dayLabel: 'Day 5', condition: 'Sunny', icon: 'wb_sunny', highC: 32, lowC: 25, precipitationPercent: 10 },
                    ]
                ).map((day, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl p-3.5 bg-surface-container-low dark:bg-slate-800/60 border border-surface-container-high/40 dark:border-slate-700/60 flex flex-col justify-between items-center text-center"
                  >
                    <div className="text-xs font-bold text-on-surface font-display">{day.dayLabel}</div>
                    <div className="my-2">
                      <span className="material-symbols-outlined text-[26px] text-primary">
                        {day.icon}
                      </span>
                      <div className="text-[11px] font-medium text-on-surface line-clamp-1 mt-0.5">
                        {day.condition}
                      </div>
                    </div>
                    <div className="w-full space-y-1">
                      <div className="flex items-baseline justify-between w-full text-xs font-bold">
                        <span className="text-on-surface">{day.highC}°C</span>
                        <span className="text-on-surface-variant font-normal text-[11px]">{day.lowC}°C</span>
                      </div>
                      <div className="flex items-center justify-center gap-1 text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
                        <span className="material-symbols-outlined text-[12px]">water_drop</span>
                        <span>{day.precipitationPercent}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Live Currency & Budget Converter (Brought Back!) */}
      <section id="currency-section" className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <span className="material-symbols-outlined text-[16px]">currency_exchange</span>
            <span>Financial Atelier</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-on-surface">
            Live PHP Budget &amp; Multi-Currency Converter
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-2">
            Every budget in TravelMate is calibrated to Philippine Pesos (₱, PHP) with real-time live exchange rate conversions from European Central Bank &amp; Frankfurter feeds.
          </p>
        </div>

        {/* Embedded Full Currency Converter Component */}
        <CurrencyConverter
          homeCurrency="PHP"
          destinationCurrency={activeDest.currency === 'PHP' ? 'USD' : activeDest.currency}
          className="shadow-sm"
        />
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-container-high/60 dark:border-slate-800 py-6 bg-surface dark:bg-slate-950 text-on-surface-variant text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="font-extrabold text-xs tracking-tight font-display text-on-surface">
            TRAVELMATE • Curated Trip Architecture
          </div>
          <div className="text-[11px] text-slate-400">
            Weather via Open-Meteo. Maps via OpenStreetMap. Currencies via ECB &amp; Frankfurter.
          </div>
        </div>
      </footer>

      {/* MODAL DIALOG: Sign In & Create Account Popup */}
      {isAuthModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={authMode === 'signin' ? 'Sign In to TravelMate' : 'Create Free Account'}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseAuthModal();
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto cursor-pointer"
        >
          {/* Backdrop Dismiss Trigger */}
          <div
            className="fixed inset-0 pointer-events-none"
            aria-hidden="true"
          />

          {/* Modal Container Card */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-surface-container-lowest dark:bg-slate-900 rounded-3xl border border-surface-container-high dark:border-slate-800 shadow-2xl p-6 sm:p-8 z-10 animate-in zoom-in-95 duration-200 my-8 cursor-default"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={handleCloseAuthModal}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center z-20 shadow-2xs"
              title="Close modal"
              aria-label="Close dialog"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-between border-b border-surface-container-high/60 dark:border-slate-800 pb-3 mb-5 pr-8">
              <div className="flex gap-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setAuthErrorMessage(null);
                  }}
                  className={`pb-1 transition-all cursor-pointer ${
                    authMode === 'signin'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthErrorMessage(null);
                  }}
                  className={`pb-1 transition-all cursor-pointer ${
                    authMode === 'signup'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider">
                {authMode === 'signin' ? 'Welcome Back' : 'Get Started'}
              </span>
            </div>

            {/* Header Title */}
            <div className="mb-5">
              <h2 className="text-xl font-black text-on-surface font-display">
                {authMode === 'signin' ? 'Sign in to TravelMate' : 'Create your free account'}
              </h2>
              <p className="text-xs text-on-surface-variant mt-1">
                {authMode === 'signin'
                  ? 'Access your itineraries, maps, and travel dossiers.'
                  : 'Build your custom itineraries with real-time maps and budgets.'}
              </p>
            </div>

            {/* Error Banner */}
            {authErrorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-error/10 text-error border border-error/20 text-xs font-medium flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">error</span>
                <span>{authErrorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low dark:bg-slate-800 border border-surface-container-high dark:border-slate-700 text-xs text-on-surface placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="traveler@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low dark:bg-slate-800 border border-surface-container-high dark:border-slate-700 text-xs text-on-surface placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-on-surface">
                    Password
                  </label>
                  {authMode === 'signin' && (
                    <Link
                      href="/reset-password"
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-surface-container-low dark:bg-slate-800 border border-surface-container-high dark:border-slate-700 text-xs text-on-surface placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {authMode === 'signin' && (
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="modal-remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-sm border-slate-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                  />
                  <label
                    htmlFor="modal-remember-me"
                    className="text-xs text-on-surface-variant font-medium cursor-pointer"
                  >
                    Keep me signed in
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isAuthLoading ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{authMode === 'signin' ? 'Sign In' : 'Create Free Account'}</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </>
                )}
              </button>

              {/* Mode Switcher Link at Bottom */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                    setAuthErrorMessage(null);
                  }}
                  className="text-xs text-on-surface-variant hover:text-primary font-semibold transition-colors cursor-pointer"
                >
                  {authMode === 'signin'
                    ? "Don't have an account? Create Free Account"
                    : 'Already have an account? Sign In'}
                </button>
              </div>

              {/* Dismiss / Continue browsing without signing in */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleCloseAuthModal}
                  className="text-xs text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary font-medium transition-colors cursor-pointer hover:underline"
                >
                  Close &amp; continue browsing without signing in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
