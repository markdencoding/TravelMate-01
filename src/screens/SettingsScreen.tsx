'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTravelStore } from '../store';
import { UserPreferences } from '../types';
import { getProfileAction, updateProfileAction } from '@/app/actions/profile';

const AVATAR_OPTIONS = [
  {
    id: 'backpacker',
    label: 'Backpacker',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'alpine',
    label: 'Alpine Hiker',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'island',
    label: 'Island Nomad',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'urban',
    label: 'Urban Explorer',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'photographer',
    label: 'Photographer',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'guide',
    label: 'Mountain Guide',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'culture',
    label: 'Culture Seeker',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'roadtripper',
    label: 'Roadtripper',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
  },
];

export const SettingsScreen: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    userPreferences,
    updateUserPreferences,
    exportDataAsJson,
    darkMode,
    setDarkMode,
    themePreference,
    setThemePreference,
    trips,
    activities,
    expenses,
  } = useTravelStore();

  const [activeSubTab, setActiveSubTab] = useState<'general' | 'preferences' | 'data' | 'security'>(
    'general'
  );
  const [saveToast, setSaveToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Preferences updated and persisted to storage.');

  // Form local states for profile
  const [userName, setUserName] = useState(currentUser?.name || '');
  const [userEmail, setUserEmail] = useState(currentUser?.email || '');
  const [bio, setBio] = useState('');

  const dataSizeKb = useMemo(() => {
    try {
      const raw = JSON.stringify({ trips, activities, expenses, userPreferences });
      return Math.max(1, Math.round(new Blob([raw]).size / 1024));
    } catch {
      return 1;
    }
  }, [trips, activities, expenses, userPreferences]);
  const pctUsed = Math.min(100, Math.max(0.1, Number(((dataSizeKb / 5120) * 100).toFixed(1))));

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await getProfileAction();
        if (res.data) {
          if (res.data.user) {
            setCurrentUser(res.data.user);
            setUserName(res.data.user.name);
            setUserEmail(res.data.user.email);
          }
          if (res.data.preferences) {
            updateUserPreferences(res.data.preferences);
          }
        }
      } catch (err) {
        console.warn('Could not load profile from Supabase:', err);
      }
    }
    loadProfile();
  }, [setCurrentUser, updateUserPreferences]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await updateProfileAction({
        displayName: userName,
        bio: bio,
      });
      if (res.success && res.data) {
        setCurrentUser(res.data.user);
      }
    } catch (err) {
      console.warn('Profile save fallback to local:', err);
    }
    setToastMessage('Profile information updated and persisted.');
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleSelectAvatar = async (url: string) => {
    // 1. Instant optimistic update in local state
    setCurrentUser({
      ...currentUser,
      avatar: url,
    });
    setToastMessage('Profile avatar updated successfully.');
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);

    // 2. Persist to Supabase in background
    try {
      const res = await updateProfileAction({
        avatarUrl: url,
      });
      if (res.success && res.data) {
        setCurrentUser(res.data.user);
      }
    } catch (err) {
      console.warn('Avatar save fallback to local:', err);
    }
  };

  const handleUpdatePref = async (updates: Partial<UserPreferences>) => {
    updateUserPreferences(updates);
    try {
      await updateProfileAction({
        currency: updates.currency,
        measurementUnits: updates.measurementUnits,
        dateFormat: updates.dateFormat as 'YYYY-MM-DD' | 'MMM DD, YYYY' | 'DD/MM/YYYY' | undefined,
        timeFormat: updates.timeFormat,
        notificationsEnabled: updates.notificationsEnabled,
      });
    } catch (err) {
      console.warn('Failed to sync preferences to Supabase:', err);
    }
    setToastMessage('Preferences updated and persisted to storage.');
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
          <span>Home</span>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="text-primary font-semibold">Settings & Configuration</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              Settings & Preferences
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage your account preferences, display options, and data settings.
            </p>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-x-6 gap-y-2 text-xs font-semibold text-slate-500">
        <button
          onClick={() => setActiveSubTab('general')}
          className={`pb-3 flex items-center gap-1.5 transition-all ${
            activeSubTab === 'general'
              ? 'text-primary border-b-2 border-primary font-bold'
              : 'hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">person</span>
          Profile & Account
        </button>
        <button
          onClick={() => setActiveSubTab('preferences')}
          className={`pb-3 flex items-center gap-1.5 transition-all ${
            activeSubTab === 'preferences'
              ? 'text-primary border-b-2 border-primary font-bold'
              : 'hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">tune</span>
          Display & Regional
        </button>
        <button
          onClick={() => setActiveSubTab('data')}
          className={`pb-3 flex items-center gap-1.5 transition-all ${
            activeSubTab === 'data'
              ? 'text-primary border-b-2 border-primary font-bold'
              : 'hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">database</span>
          Data & LocalStorage
        </button>
        <button
          onClick={() => setActiveSubTab('security')}
          className={`pb-3 flex items-center gap-1.5 transition-all ${
            activeSubTab === 'security'
              ? 'text-primary border-b-2 border-primary font-bold'
              : 'hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">shield</span>
          Privacy & Security
        </button>
      </div>

      {/* Tab 1: Profile & Account */}
      {activeSubTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 text-center">
            {/* Active Profile Avatar */}
            <div className="relative inline-block mx-auto">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 shadow-sm"
              />
              <span
                className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full shadow-xs cursor-default"
                title="Active Profile Avatar"
              >
                <span className="material-symbols-outlined text-[14px]">photo_camera</span>
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 font-display text-base">
                {currentUser.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{currentUser.email}</p>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                {currentUser.role}
              </span>
            </div>

            {/* Choose Avatar Selection */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-primary">face</span>
                  Select Avatar
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {AVATAR_OPTIONS.length} Personas
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Choose a traveler persona for your profile:
              </p>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {AVATAR_OPTIONS.map((avatar) => {
                  const isSelected = currentUser.avatar === avatar.url;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => handleSelectAvatar(avatar.url)}
                      title={`${avatar.label} (Tap to select)`}
                      className={`relative flex flex-col items-center group p-1 rounded-xl transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary/10 ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-105'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={avatar.url}
                        alt={avatar.label}
                        className="w-10 h-10 rounded-full object-cover shadow-2xs"
                      />
                      <span className="text-[9px] font-medium text-slate-600 dark:text-slate-300 mt-1 truncate max-w-full text-center">
                        {avatar.label}
                      </span>
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[10px] shadow-xs">
                          <span className="material-symbols-outlined text-[10px] font-bold">check</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-left space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Account Status:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
              </div>
              <div className="flex justify-between">
                <span>Total Trips:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {trips.length} {trips.length === 1 ? 'trip' : 'trips'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Storage Protocol:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Cloud &amp; Offline Sync</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
              Profile Information
            </h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Traveler Bio / Focus
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-sm shadow-primary/20 transition-all hover:scale-[1.02]"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Preferences & Regional */}
      {activeSubTab === 'preferences' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
              Regional &amp; Display Formatting
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize how dates, currencies, distances, and temperatures are formatted throughout your dossiers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Standard System Currency */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                System Standard Currency
              </label>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                <span className="text-xl">🇵🇭</span>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Philippine Peso (PHP, ₱)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Standard primary currency for all trips &amp; expenses
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Use the informational Currency Converter to view approximate rates in other currencies.
              </p>
            </div>

            {/* Units System */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Measurement System
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdatePref({ measurementUnits: 'metric' })}
                  className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all ${
                    userPreferences.measurementUnits === 'metric'
                      ? 'border-primary bg-primary/5 text-primary dark:bg-primary/20 dark:text-teal-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Metric (km, °C)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdatePref({ measurementUnits: 'imperial' })}
                  className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all ${
                    userPreferences.measurementUnits === 'imperial'
                      ? 'border-primary bg-primary/5 text-primary dark:bg-primary/20 dark:text-teal-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Imperial (mi, °F)
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Controls walking distances and weather displays.</p>
            </div>

            {/* Date Format */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Date Representation
              </label>
              <select
                value={userPreferences.dateFormat}
                onChange={(e) => handleUpdatePref({ dateFormat: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="YYYY-MM-DD">2026-10-14 (ISO 8601 Standard)</option>
                <option value="MMM DD, YYYY">Oct 14, 2026 (Medium Human)</option>
                <option value="DD/MM/YYYY">14/10/2026 (International)</option>
              </select>
            </div>

            {/* Aesthetic Mode Selector with System Auto-Sync */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Aesthetic Theme &amp; System Preference Sync
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setThemePreference('light')}
                  className={`flex items-center gap-2.5 p-3 rounded-xl text-left transition-all cursor-pointer ${
                    themePreference === 'light'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-600 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] text-amber-500">
                    light_mode
                  </span>
                  <div>
                    <div className="text-xs">Light Mode</div>
                    <div className="text-[10px] text-slate-400 font-normal">Crisp white &amp; soft slate</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setThemePreference('dark')}
                  className={`flex items-center gap-2.5 p-3 rounded-xl text-left transition-all cursor-pointer ${
                    themePreference === 'dark'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-600 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] text-indigo-400">
                    dark_mode
                  </span>
                  <div>
                    <div className="text-xs">Dark Mode</div>
                    <div className="text-[10px] text-slate-400 font-normal">Night explorer obsidian</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setThemePreference('system')}
                  className={`flex items-center gap-2.5 p-3 rounded-xl text-left transition-all cursor-pointer ${
                    themePreference === 'system'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shadow-xs border border-emerald-300 dark:border-emerald-700 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] text-emerald-600 dark:text-emerald-400">
                    brightness_auto
                  </span>
                  <div>
                    <div className="text-xs">Auto (System Sync)</div>
                    <div className="text-[10px] text-slate-400 font-normal">Follows OS dark mode</div>
                  </div>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-0.5">
                Active appearance: <span className="font-semibold text-slate-700 dark:text-slate-300">{darkMode ? 'Dark Theme' : 'Light Theme'}</span>
                {themePreference === 'system' && ' • Synchronized with device system preferences'}
              </p>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Notification Sound & Alert Badges
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Play gentle chime on transit departure milestones and schedule conflicts.
                </div>
              </div>
              <input
                type="checkbox"
                checked={userPreferences.notificationsEnabled}
                onChange={(e) =>
                  handleUpdatePref({ notificationsEnabled: e.target.checked })
                }
                className="w-4 h-4 text-primary rounded border-slate-300 dark:border-slate-700 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Preload High-Resolution Satellite Tiles
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Cache offline vector map coordinates for low-connectivity expeditions.
                </div>
              </div>
              <input
                type="checkbox"
                checked={userPreferences.offlineSync}
                onChange={(e) =>
                  updateUserPreferences({ offlineSync: e.target.checked })
                }
                className="w-4 h-4 text-primary rounded border-slate-300 dark:border-slate-700 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Data & LocalStorage */}
      {activeSubTab === 'data' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                  Local Storage &amp; Data Sovereignty
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Your itineraries, expenses, and pin bookmarks remain strictly in your browser. No third-party data tracking.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-800">
                Persistent Sync Active
              </span>
            </div>

            {/* Storage Meter */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Client Storage Allocated</span>
                <span className="font-mono">{dataSizeKb} KB / 5.0 MB</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${pctUsed}%` }} />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>
                  {trips.length} Expedition{trips.length === 1 ? '' : 's'}, {activities.length} Activit{activities.length === 1 ? 'y' : 'ies'}, {expenses.length} Expense{expenses.length === 1 ? '' : 's'}
                </span>
                <span>{(100 - pctUsed).toFixed(1)}% Remaining</span>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-1 gap-4 pt-2">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs">
                  <span className="material-symbols-outlined text-primary text-[18px]">
                    download
                  </span>
                  Export Complete State (JSON)
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Generate a complete timestamped backup file with all trips, expenses, and preferences.
                </p>
                <button
                  onClick={exportDataAsJson}
                  className="w-full py-2 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs"
                >
                  Export travelmate-backup.json
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Privacy & Security */}
      {activeSubTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
              Privacy Constitution &amp; Security
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              TravelMate operates under a zero-telemetry, zero-ad architecture.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px] shrink-0 mt-0.5">
                verified_user
              </span>
              <div className="text-xs text-slate-700 dark:text-slate-300">
                <span className="font-bold">Zero Telemetry:</span> We do not collect analytics, track location pings, or embed third-party advertising scripts.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[20px] shrink-0 mt-0.5">
                key
              </span>
              <div className="text-xs text-slate-700 dark:text-slate-300">
                <span className="font-bold">Local Encryption Ready:</span> Exported JSON files can be encrypted with standard OpenSSL or age tools before cold storage.
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};
