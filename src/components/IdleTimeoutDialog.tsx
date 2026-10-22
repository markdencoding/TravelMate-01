'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { IDLE_TIMEOUT_MS, COUNTDOWN_SECONDS } from '@/lib/constants/auth';
import { useTravelStore } from '@/store';

const STORAGE_KEY_LAST_ACTIVITY = 'travelmate_last_active_time';
const STORAGE_KEY_WARNING_DEADLINE = 'travelmate_warning_deadline';
const TOTAL_EXPIRY_MS = IDLE_TIMEOUT_MS + COUNTDOWN_SECONDS * 1000;

export const IdleTimeoutDialog: React.FC = () => {
  const router = useRouter();
  const { clearUserData } = useTravelStore();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(COUNTDOWN_SECONDS);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const lastInteractionThrottleRef = useRef<number>(0);
  const isSigningOutRef = useRef<boolean>(false);

  const getLastActiveTime = useCallback((): number => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {
      // localStorage may fail in some environments
    }
    return Date.now();
  }, []);

  const performSignOut = useCallback(async () => {
    if (isSigningOutRef.current) return;
    isSigningOutRef.current = true;

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Idle auto-logout error:', err);
    }

    clearUserData();
    try {
      localStorage.removeItem(STORAGE_KEY_LAST_ACTIVITY);
      localStorage.removeItem(STORAGE_KEY_WARNING_DEADLINE);
      sessionStorage.clear();
    } catch {}

    // Notify other tabs immediately
    channelRef.current?.postMessage({ type: 'SIGNED_OUT' });
    router.replace('/login?reason=idle');
  }, [router, clearUserData]);

  const checkSessionStatus = useCallback(() => {
    if (isSigningOutRef.current) return;

    const now = Date.now();
    const lastActive = getLastActiveTime();
    const elapsed = now - lastActive;

    // 1. Session completely expired (e.g. tab returned after being hidden or system woke from sleep)
    if (elapsed >= TOTAL_EXPIRY_MS) {
      performSignOut();
      return;
    }

    // 2. Inactivity threshold reached: within warning countdown period
    if (elapsed >= IDLE_TIMEOUT_MS) {
      const remainingMs = TOTAL_EXPIRY_MS - elapsed;
      const remainingSecs = Math.max(1, Math.ceil(remainingMs / 1000));
      setSecondsRemaining(remainingSecs);
      setShowWarning(true);
      return;
    }

    // 3. User is actively working: ensure warning dialog is closed
    setShowWarning(false);
  }, [getLastActiveTime, performSignOut]);

  const resetActivity = useCallback(() => {
    const now = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, String(now));
      localStorage.removeItem(STORAGE_KEY_WARNING_DEADLINE);
    } catch {}

    setShowWarning(false);
    setSecondsRemaining(COUNTDOWN_SECONDS);

    // Notify all other open tabs to dismiss warning and reset idle state
    channelRef.current?.postMessage({ type: 'RESET_IDLE', timestamp: now });
  }, []);

  // BroadcastChannel and Storage sync across multiple tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('travelmate_auth_channel');
      channelRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data?.type === 'RESET_IDLE' || event.data?.type === 'ACTIVITY_DETECTED') {
          setShowWarning(false);
          setSecondsRemaining(COUNTDOWN_SECONDS);
        } else if (event.data?.type === 'SIGNED_OUT') {
          isSigningOutRef.current = true;
          router.replace('/login?reason=idle');
        }
      };

      return () => {
        channel.close();
      };
    }
  }, [router]);

  // Synchronize across tabs using window storage event
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_LAST_ACTIVITY) {
        checkSessionStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [checkSessionStatus]);

  // Track user interaction (throttled to avoid performance impact)
  useEffect(() => {
    const handleUserInteraction = () => {
      const now = Date.now();
      if (now - lastInteractionThrottleRef.current < 2000) return;
      lastInteractionThrottleRef.current = now;

      // Update active timestamp
      try {
        localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, String(now));
      } catch {}

      // If warning was active, user interaction dismisses it and notifies other tabs
      if (showWarning) {
        setShowWarning(false);
        setSecondsRemaining(COUNTDOWN_SECONDS);
      }

      channelRef.current?.postMessage({ type: 'ACTIVITY_DETECTED', timestamp: now });
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, handleUserInteraction, { passive: true }));

    // Initialize activity timestamp on mount
    handleUserInteraction();

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleUserInteraction));
    };
  }, [showWarning]);

  // Tab visibility, focus, and back-forward cache resume handlers
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityOrResume = () => {
      if (document.visibilityState === 'visible') {
        checkSessionStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrResume);
    window.addEventListener('focus', checkSessionStatus);
    window.addEventListener('pageshow', checkSessionStatus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrResume);
      window.removeEventListener('focus', checkSessionStatus);
      window.removeEventListener('pageshow', checkSessionStatus);
    };
  }, [checkSessionStatus]);

  // Interval checks: 5s when normal, 1s when warning is visible (always deadline-calculated)
  useEffect(() => {
    const checkIntervalMs = showWarning ? 1000 : 5000;
    const intervalId = setInterval(() => {
      checkSessionStatus();
    }, checkIntervalMs);

    return () => clearInterval(intervalId);
  }, [showWarning, checkSessionStatus]);

  if (!showWarning) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="idle-dialog-title"
      aria-describedby="idle-dialog-desc"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 text-center animate-scale-up">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[28px]">timer</span>
        </div>

        <h2 id="idle-dialog-title" className="text-lg font-bold font-display text-slate-900 dark:text-white mb-2">
          Session Inactivity Warning
        </h2>

        <p id="idle-dialog-desc" className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          You have been idle for a while. For your security, your session will automatically terminate in{' '}
          <span className="font-mono font-bold text-amber-500 dark:text-amber-400 text-sm">
            {secondsRemaining}s
          </span>
          . Would you like to stay signed in?
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={performSignOut}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            Sign Out Now
          </button>
          <button
            type="button"
            onClick={resetActivity}
            className="py-2.5 px-5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Stay Signed In
          </button>
        </div>
      </div>
    </div>
  );
};
