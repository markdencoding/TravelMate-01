'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTravelStore } from '../store';
import { BottomSheet } from './BottomSheet';

interface MoreMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNotifications: () => void;
}

export const MoreMenuSheet: React.FC<MoreMenuSheetProps> = ({
  isOpen,
  onClose,
  onOpenNotifications,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    currentUser,
    unreadNotificationsCount,
    darkMode,
    themePreference,
    setThemePreference,
  } = useTravelStore();

  const handleNav = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="TravelMate" subtitle="Navigation & System Controls">
      <div className="flex flex-col gap-5 pb-4">
        {/* User Avatar, Name and Email Card */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60">
          <img
            src={
              currentUser?.avatar ||
              '/avatars/fox-explorer.svg'
            }
            alt={currentUser?.name || 'User avatar'}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-teal-500/30"
          />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
              {currentUser?.name || 'Traveler'}
            </span>
            {currentUser?.email && (
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {currentUser.email}
              </span>
            )}
            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono font-semibold uppercase mt-0.5">
              {currentUser?.role || 'Traveler'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleNav('/settings')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-colors"
            title="Account Settings"
          >
            <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
          </button>
        </div>

        {/* Light / Dark / System Theme Switcher */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
              Theme & Appearance
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {themePreference === 'system' ? 'System Sync' : darkMode ? 'Night Mode' : 'Light Mode'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setThemePreference('light')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                !darkMode
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] text-amber-500">light_mode</span>
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => setThemePreference('dark')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                darkMode
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] text-indigo-400">dark_mode</span>
              <span>Dark</span>
            </button>
          </div>
        </div>

        {/* 2-Column Grid of Large Rounded Tiles: Expenses, Calendar, Notifications, Settings, Profile */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono px-1">
            Explore Features
          </span>
          <div className="grid grid-cols-2 gap-3">
            {/* Tile 1: Expenses */}
            <button
              type="button"
              onClick={() => handleNav('/expenses')}
              className={`flex flex-col items-start p-4 rounded-2xl border transition-all text-left group cursor-pointer ${
                pathname === '/expenses'
                  ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500/50 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">payments</span>
              </div>
              <span className="font-display font-bold text-sm text-slate-900 dark:text-white">
                Expenses
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Currency & budget logs
              </span>
            </button>

            {/* Tile 2: Calendar */}
            <button
              type="button"
              onClick={() => handleNav('/calendar')}
              className={`flex flex-col items-start p-4 rounded-2xl border transition-all text-left group cursor-pointer ${
                pathname === '/calendar'
                  ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500/50 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">calendar_today</span>
              </div>
              <span className="font-display font-bold text-sm text-slate-900 dark:text-white">
                Calendar
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Timeline & departure view
              </span>
            </button>

            {/* Tile 3: Notifications (with unread badge) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNotifications();
              }}
              className="flex flex-col items-start p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left group cursor-pointer relative"
            >
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-3.5 right-3.5 bg-rose-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                  {unreadNotificationsCount} new
                </span>
              )}
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">notifications</span>
              </div>
              <span className="font-display font-bold text-sm text-slate-900 dark:text-white">
                Notifications
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Alerts & weather updates
              </span>
            </button>

            {/* Tile 4: Dossier PDF */}
            <button
              type="button"
              onClick={() => handleNav('/dossier')}
              className={`flex flex-col items-start p-4 rounded-2xl border transition-all text-left group cursor-pointer ${
                pathname === '/dossier'
                  ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500/50 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">description</span>
              </div>
              <span className="font-display font-bold text-sm text-slate-900 dark:text-white">
                Travel Dossier
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Printable PDF booklet
              </span>
            </button>

            {/* Tile 5: Settings */}
            <button
              type="button"
              onClick={() => handleNav('/settings')}
              className={`col-span-2 flex items-center gap-3.5 p-4 rounded-2xl border transition-all text-left group cursor-pointer ${
                pathname === '/settings'
                  ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500/50 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">settings</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  Settings
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Curator preferences & system configuration
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
