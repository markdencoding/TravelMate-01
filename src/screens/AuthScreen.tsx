'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTravelStore } from '../store';
import { createClient } from '@/lib/supabase/client';
import { signInSchema, signUpSchema } from '@/lib/validators/auth';

export const AuthScreen: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCurrentUser, darkMode, toggleDarkMode } = useTravelStore();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'idle') {
      setErrorMessage('You have been signed out due to inactivity.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const supabase = createClient();
    const redirectTo = searchParams.get('redirectTo') || '/dashboard';

    if (mode === 'signin') {
      const validation = signInSchema.safeParse({ email, password });
      if (!validation.success) {
        setErrorMessage(validation.error.errors[0]?.message || 'Please check your inputs.');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrorMessage('Invalid email or password. Please try again.');
          setIsLoading(false);
          return;
        }

        if (data?.user) {
          // Check if user is active in profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url, role, is_active')
            .eq('id', data.user.id)
            .single();

          if (profile && profile.is_active === false) {
            await supabase.auth.signOut();
            setErrorMessage('Your account is deactivated. Please contact an administrator.');
            setIsLoading(false);
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

        setToastMessage('Authenticated successfully. Redirecting to expedition atelier...');
        router.push(redirectTo);
        router.refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Authentication service error';
        setErrorMessage(msg);
        setIsLoading(false);
      }
    } else {
      // Sign Up
      const validation = signUpSchema.safeParse({ name, email, password });
      if (!validation.success) {
        setErrorMessage(validation.error.errors[0]?.message || 'Please check your inputs.');
        setIsLoading(false);
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
          setErrorMessage(error.message);
          setIsLoading(false);
          return;
        }

        if (data.session) {
          setToastMessage('Account created successfully. Welcome to TravelMate!');
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
          setIsLoading(false);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Authentication service error';
        setErrorMessage(msg);
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center p-4 animate-fade-in">
      {/* Top Bar Theme Toggle */}
      <div className="absolute top-2 right-4 z-20">
        <button
          type="button"
          suppressHydrationWarning
          onClick={toggleDarkMode}
          aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
          className="w-10 h-10 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-primary transition-colors cursor-pointer"
        >
          <span suppressHydrationWarning className="material-symbols-outlined text-[20px]">
            {darkMode ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-4xl w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 transition-colors">
        {/* Left Visual Column (5 cols) */}
        <div className="md:col-span-5 relative bg-slate-900 p-8 flex flex-col justify-between text-white overflow-hidden min-h-[340px]">
          {/* Background image overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />

          {/* Brand header */}
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white shadow-xs">
                <span className="material-symbols-outlined text-[18px]">explore</span>
              </div>
              <span className="font-extrabold text-base tracking-tight font-display text-white">
                TRAVELMATE
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-300 uppercase tracking-widest mt-1">
              Curated Trip Architecture
            </p>
          </div>

          {/* Inspirational Quote */}
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 text-emerald-300 backdrop-blur-xs border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Ad-Free Atelier
            </div>
            <p className="text-sm font-medium text-slate-200 leading-relaxed font-serif italic">
              “Plan with intentionality. Every temple visit, winding alley, and budget line item
              orchestrated without noise.”
            </p>
            <div className="text-[11px] font-mono text-slate-400">
              Kyoto Autumn • Expedition TRP-8492
            </div>
          </div>
        </div>

        {/* Right Form Column (7 cols) */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-between">
          <div>
            {/* Form Mode Tabs */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-6">
              <div className="flex gap-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMessage(null);
                  }}
                  className={`pb-1 transition-all cursor-pointer ${
                    mode === 'signin'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage(null);
                  }}
                  className={`pb-1 transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display">
                {mode === 'signin' ? 'Sign in to your account' : 'Create an account'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Access your synced itineraries, expense ledgers, and printable travel dossiers.
              </p>
            </div>

            {/* Inline Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-medium animate-fade-in">
                <span className="material-symbols-outlined text-[18px] text-rose-500 shrink-0">
                  error
                </span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <Link
                      href="/reset-password"
                      className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                    >
                      Forgot?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signin' ? 'Enter your password' : 'At least 8 characters'}
                    className="w-full px-3.5 py-2.5 pr-11 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer min-w-[44px] min-h-[44px]"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-slate-300 dark:border-slate-600 focus:ring-primary"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Keep me signed in
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>
                  {isLoading
                    ? mode === 'signin'
                      ? 'Signing in...'
                      : 'Creating account...'
                    : mode === 'signin'
                    ? 'Sign In'
                    : 'Create Account'}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
