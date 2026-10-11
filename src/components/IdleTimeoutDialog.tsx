'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { IDLE_TIMEOUT_MS, COUNTDOWN_SECONDS } from '@/lib/constants/auth';

import { useTravelStore } from '@/store';

const STORAGE_KEY_LAST_ACTIVITY = 'travelmate_last_active_time';

export const IdleTimeoutDialog: React.FC = () => {
  const router = useRouter();
  const { clearUserData } = useTravelStore();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(COUNTDOWN_SECONDS);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const performSignOut = useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Idle auto-logout error:', err);
    }
    clearUserData();
    try {
      localStorage.removeItem(STORAGE_KEY_LAST_ACTIVITY);
      sessionStorage.clear();
    } catch {}
    // Notify other tabs
    channelRef.current?.postMessage({ type: 'SIGNED_OUT' });
    router.replace('/login?reason=idle');
  }, [router, clearUserData]);

  const resetActivity = useCallback(() => {
    const now = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, String(now));
    } catch {
      // localStorage may fail in private mode
    }
    if (showWarning) {
      setShowWarning(false);
      setSecondsRemaining(COUNTDOWN_SECONDS);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      channelRef.current?.postMessage({ type: 'RESET_IDLE' });
    }
  }, [showWarning]);

  // Set up BroadcastChannel for multi-tab sync
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('travelmate_auth_channel');
      channelRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data?.type === 'RESET_IDLE') {
          setShowWarning(false);
          setSecondsRemaining(COUNTDOWN_SECONDS);
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
        } else if (event.data?.type === 'SIGNED_OUT') {
          router.replace('/login?reason=idle');
        }
      };

      return () => {
        channel.close();
      };
    }
  }, [router]);

  // Track user activity listeners
  useEffect(() => {
    const handleUserInteraction = () => {
      // Only reset activity timestamp if the warning modal is not active
      if (!showWarning) {
        try {
          localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, String(Date.now()));
        } catch {
          // ignore
        }
      }
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, handleUserInteraction, { passive: true }));

    // Initialize activity timestamp
    handleUserInteraction();

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleUserInteraction));
    };
  }, [showWarning]);

  // Poll inactivity interval
  useEffect(() => {
    const checkIdleInterval = setInterval(() => {
      if (showWarning) return;

      let lastActive = Date.now();
      try {
        const stored = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);
        if (stored) lastActive = parseInt(stored, 10);
      } catch {
        // ignore
      }

      const elapsed = Date.now() - lastActive;
      if (elapsed >= IDLE_TIMEOUT_MS) {
        setShowWarning(true);
        setSecondsRemaining(COUNTDOWN_SECONDS);
      }
    }, 5000);

    return () => clearInterval(checkIdleInterval);
  }, [showWarning]);

  // Countdown timer while warning is visible
  useEffect(() => {
    if (!showWarning) return;

    countdownIntervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          performSignOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [showWarning, performSignOut]);

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
