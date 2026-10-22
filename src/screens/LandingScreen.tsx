'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useTravelStore } from '../store';
import { createClient } from '@/lib/supabase/client';
import { signInSchema, signUpSchema } from '@/lib/validators/auth';
import type { TripMapDestination, TripMapExtraSpot } from '@/components/map/TripMap';

const TripMap = dynamic(
  () => import('@/components/map/TripMap').then((mod) => mod.TripMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[380px] bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse flex flex-col items-center justify-center gap-2 text-slate-400">
        <span className="material-symbols-outlined text-3xl animate-spin">refresh</span>
        <span className="text-xs font-mono">Loading Map...</span>
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
  spots: TripMapExtraSpot[];
}

const SAMPLE_DESTINATIONS: SampleDestination[] = [
  {
    id: 'el-nido',
    name: 'El Nido, Palawan',
    region: 'MIMAROPA',
    country: 'Philippines',
    latitude: 11.1949,
    longitude: 119.4013,
    description: 'Limestone karst cliffs, hidden lagoons, and clear waters in Bacuit Bay.',
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
    latitude: 35.0116,
    longitude: 135.7681,
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
    latitude: 20.4485,
    longitude: 121.9708,
    description: 'Rolling hills, traditional stone houses, and coastal views.',
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
    latitude: 10.3157,
    longitude: 123.8854,
    description: 'Colonial heritage, mountain viewpoints, food culture, and waterfalls.',
    spots: [
      { id: 'spot-c1', name: "Magellan's Cross", categoryLabel: 'Historical Landmark', latitude: 10.2936, longitude: 123.9019, distanceMeters: 2800 },
      { id: 'spot-c2', name: 'Temple of Leah', categoryLabel: 'Highland Monument', latitude: 10.3702, longitude: 123.8703, distanceMeters: 7400 },
      { id: 'spot-c3', name: 'Sirao Flower Garden', categoryLabel: 'Botanical Garden', latitude: 10.4285, longitude: 123.8682, distanceMeters: 13500 },
    ],
  },
];

export const LandingScreen: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCurrentUser, darkMode, toggleDarkMode } = useTravelStore();

  // Auth State
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Interactive Destination State
  const [selectedDestId, setSelectedDestId] = useState<string>('el-nido');
  const [weatherInfo, setWeatherInfo] = useState<{
    temp: number;
    condition: string;
    humidity: number;
    wind: number;
  } | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  const activeDest = SAMPLE_DESTINATIONS.find((d) => d.id === selectedDestId) || SAMPLE_DESTINATIONS[0];

  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'idle') {
      setAuthErrorMessage('You have been signed out due to inactivity.');
    }
  }, [searchParams]);

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
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            role: profile?.role === 'admin' ? 'Lead Curator' : 'Traveler',
          });
        }

        setToastMessage('Signed in successfully.');
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
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
              role: 'Traveler',
            });
          }
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
              condition: data.current.weather_description || 'Sunny',
              humidity: Math.round(data.current.relative_humidity_2m ?? 75),
              wind: Math.round(data.current.wind_speed_10m ?? 12),
            });
          }
        }
      } catch {
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
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-sans transition-colors selection:bg-primary/20 selection:text-primary">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
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

      {/* Header */}
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

            <a
              href="#auth-section"
              onClick={() => setAuthMode('signin')}
              className="px-3.5 py-2 text-xs font-bold text-on-surface hover:text-primary rounded-xl transition-colors"
            >
              Sign In
            </a>

            <a
              href="#auth-section"
              onClick={() => setAuthMode('signup')}
              className="px-4 py-2 text-xs font-bold bg-primary hover:bg-primary-container text-on-primary rounded-xl shadow-xs transition-colors"
            >
              Create Account
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="auth-section" className="relative overflow-hidden pt-6 pb-12 sm:pt-10 sm:pb-16 md:pt-14 md:pb-20 border-b border-surface-container-high/60 dark:border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Column: Clear Value Proposition */}
            <div className="md:col-span-6 lg:col-span-7 space-y-5 text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-on-surface leading-tight">
                Plan your trips, simply.
              </h1>

              <p className="text-sm sm:text-base text-on-surface-variant font-medium leading-relaxed max-w-xl">
                Day-by-day itineraries, interactive Leaflet route maps, live weather forecasts, and expense tracking — all formatted in Philippine Pesos (₱).
              </p>

              {/* Clean Feature Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
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
                    <span>Maps & Weather</span>
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1">OpenStreetMap routes and live forecasts</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-container-low/70 dark:bg-slate-900/60 border border-surface-container-high/40 dark:border-slate-800">
                  <div className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">payments</span>
                    <span>Expenses (₱)</span>
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1">PHP budgeting with multi-currency rates</div>
                </div>
              </div>

              {/* Jump to Map Preview */}
              <div className="pt-2">
                <a
                  href="#interactive-map"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  <span>Preview destination map</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                </a>
              </div>
            </div>

            {/* Right Column: Sign In / Create Account Card */}
            <div className="md:col-span-6 lg:col-span-5 w-full">
              <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-3xl border border-surface-container-high dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-8 transition-colors">
                {/* Tabs */}
                <div className="flex items-center justify-between border-b border-surface-container-high/60 dark:border-slate-800 pb-3 mb-5">
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
                        id="hero-remember-me"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded-sm border-slate-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                      />
                      <label
                        htmlFor="hero-remember-me"
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
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Destination & Map Explorer */}
      <section id="interactive-map" className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center md:text-left mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-on-surface">
              Explore Destinations
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Select a location to inspect maps, local attractions, and current weather.
            </p>
          </div>

          {/* Destination Selector Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap justify-start sm:justify-end">
            {SAMPLE_DESTINATIONS.map((dest) => {
              const isSelected = dest.id === selectedDestId;
              return (
                <button
                  key={dest.id}
                  type="button"
                  onClick={() => setSelectedDestId(dest.id)}
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
          {/* Left Column: Destination Card & Live Weather */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-4">
            {/* Destination Highlight Card */}
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

            {/* Weather Card */}
            <div className="p-5 rounded-3xl bg-surface-container-lowest dark:bg-slate-900 border border-surface-container-high dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <span className="material-symbols-outlined text-[18px]">wb_sunny</span>
                  <span>Current Weather</span>
                </div>
                {isLoadingWeather && (
                  <span className="text-[10px] font-mono text-slate-400">Loading...</span>
                )}
              </div>

              {weatherInfo ? (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black font-display text-on-surface">
                      {weatherInfo.temp}°C
                    </span>
                    <span className="text-xs font-semibold text-on-surface-variant">
                      {weatherInfo.condition}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-on-surface-variant">
                    <span>Humidity: {weatherInfo.humidity}%</span>
                    <span>Wind: {weatherInfo.wind} km/h</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-on-surface-variant py-2">Loading weather...</div>
              )}
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

      {/* Footer */}
      <footer className="border-t border-surface-container-high/60 dark:border-slate-800 py-6 bg-surface dark:bg-slate-950 text-on-surface-variant text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="font-extrabold text-xs tracking-tight font-display text-on-surface">
            TRAVELMATE
          </div>
          <div className="text-[11px] text-slate-400">
            Weather data via Open-Meteo. Maps via OpenStreetMap.
          </div>
        </div>
      </footer>
    </div>
  );
};
