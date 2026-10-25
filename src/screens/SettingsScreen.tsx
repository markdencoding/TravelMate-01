'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTravelStore } from '../store';
import { UserPreferences } from '../types';
import { getProfileAction, updateProfileAction } from '@/app/actions/profile';
import { createClient } from '@/lib/supabase/client';

const AVATAR_OPTIONS = [
  {
    id: 'fox',
    label: 'Fox Explorer',
    url: '/avatars/fox-explorer.svg',
  },
  {
    id: 'bear',
    label: 'Bear Trekker',
    url: '/avatars/bear-trekker.svg',
  },
  {
    id: 'panda',
    label: 'Panda Nomad',
    url: '/avatars/panda-nomad.svg',
  },
  {
    id: 'lion',
    label: 'Lion Voyager',
    url: '/avatars/lion-voyager.svg',
  },
  {
    id: 'koala',
    label: 'Koala Wanderer',
    url: '/avatars/koala-wanderer.svg',
  },
  {
    id: 'owl',
    label: 'Owl Pathfinder',
    url: '/avatars/owl-pathfinder.svg',
  },
  {
    id: 'rabbit',
    label: 'Rabbit Backpacker',
    url: '/avatars/rabbit-backpacker.svg',
  },
  {
    id: 'penguin',
    label: 'Penguin Navigator',
    url: '/avatars/penguin-navigator.svg',
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
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [customAvatarInput, setCustomAvatarInput] = useState('');

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
            const savedAvatar = typeof window !== 'undefined' ? localStorage.getItem('travelmate_avatar') : null;
            const finalAvatar =
              res.data.user.avatar && res.data.user.avatar !== '/avatars/fox-explorer.svg'
                ? res.data.user.avatar
                : (savedAvatar || res.data.user.avatar || '/avatars/fox-explorer.svg');

            setCurrentUser({
              ...res.data.user,
              avatar: finalAvatar,
            });
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

  const handleSelectAvatar = async (url: string) => {
    if (!url) return;
    const cleanUrl = url.trim();

    // 1. Instant optimistic update in local state & localStorage
    setCurrentUser((prev) => ({
      ...prev,
      avatar: cleanUrl,
    }));
    try {
      localStorage.setItem('travelmate_avatar', cleanUrl);
    } catch {}

    setToastMessage('Profile avatar updated successfully.');
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);

    // 2. Direct client-side Supabase update (instant authenticated JWT session)
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ avatar_url: cleanUrl })
          .eq('id', user.id);
      }
    } catch (e) {
      console.warn('Direct client-side avatar update:', e);
    }

    // 3. Server action persistence
    try {
      const res = await updateProfileAction({
        avatarUrl: cleanUrl,
      });
      if (res.success && res.data) {
        setCurrentUser(res.data.user);
      }
    } catch (err) {
      console.warn('Server action avatar update:', err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      alert('Selected image exceeds 2MB limit. Please select a smaller image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleSelectAvatar(dataUrl);
        setIsAvatarModalOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await updateProfileAction({
        displayName: userName,
        bio: bio,
        avatarUrl: currentUser.avatar,
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
          className={`pb-3 inline-flex items-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'general'
              ? 'text-primary border-b-2 border-primary font-bold'
              : 'hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px] shrink-0">person</span>
          <span>Profile & Account</span>
        </button>
        <button
          onClick={() => setActiveSubTab('preferences')}
          className={`pb-3 inline-flex items-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'preferences'
              ? 'text-primary border-b-2 border-primary font-bold'
              : 'hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px] shrink-0">tune</span>
          <span>Display & Regional</span>
        </button>
        <button
          onClick={() => setActiveSubTab('data')}
          className={`pb-3 inline-flex items-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'data'
              ? 'text-primary border-b-2 border-primary font-bold'
              : 'hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px] shrink-0">database</span>
          <span>Data & LocalStorage</span>
        </button>
        <button
          onClick={() => setActiveSubTab('security')}
          className={`pb-3 inline-flex items-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'security'
              ? 'text-primary border-b-2 border-primary font-bold'
              : 'hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px] shrink-0">shield</span>
          <span>Privacy & Security</span>
        </button>
      </div>

      {/* Tab 1: Profile & Account */}
      {activeSubTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 text-center">
            {/* Active Profile Avatar with Click-to-Change */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="relative group inline-block mx-auto rounded-full cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/20 transition-transform active:scale-95"
                title="Click to change your avatar"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 shadow-sm bg-surface-container-lowest transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 rounded-full bg-slate-950/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity">
                  <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                  <span>Change</span>
                </div>
                <span
                  className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full shadow-xs group-hover:bg-primary-dark transition-colors"
                  title="Change Avatar"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="mt-2 px-3 py-1 bg-surface-container hover:bg-surface-container-high text-primary rounded-full text-[11px] font-semibold inline-flex items-center justify-center gap-1 cursor-pointer transition-all hover:scale-105"
              >
                <span className="material-symbols-outlined text-[14px] shrink-0">photo_camera</span>
                <span>Change Avatar</span>
              </button>
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

            {/* Quick 1-Tap Vector Animal Travelers Grid */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-primary">pets</span>
                  Animal Travelers
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {AVATAR_OPTIONS.length} Vector Avatars
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Choose a vector animal traveler for your profile:
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
              {/* Profile Avatar Selection Row in Form */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <img
                    src={currentUser.avatar}
                    alt="Current avatar preview"
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 shadow-2xs"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Profile Avatar
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Choose from 8 animal travelers or upload custom
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                  <span>Select Avatar</span>
                </button>
              </div>

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

      {/* Avatar Selection Modal Dialog */}
      {isAvatarModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">pets</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                    Choose Your Avatar
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pick a vector animal traveler or upload custom artwork
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* 8 Vector Animal Travelers Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Vector Animal Travelers
                </span>
                <span className="text-[10px] text-primary font-medium">8 Options</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {AVATAR_OPTIONS.map((avatar) => {
                  const isSelected = currentUser.avatar === avatar.url;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => {
                        handleSelectAvatar(avatar.url);
                        setIsAvatarModalOpen(false);
                      }}
                      className={`flex flex-col items-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/10 ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-105'
                          : 'border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <img
                        src={avatar.url}
                        alt={avatar.label}
                        className="w-14 h-14 rounded-full object-cover shadow-2xs"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 text-center">
                        {avatar.label}
                      </span>
                      {isSelected ? (
                        <span className="mt-1 text-[10px] font-bold text-primary flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px]">check</span>
                          Selected
                        </span>
                      ) : (
                        <span className="mt-1 text-[10px] text-slate-400">Select</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upload from Device or Custom URL */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Custom Avatar or Upload
              </span>

              <div className="flex flex-col sm:flex-row gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="material-symbols-outlined text-[18px] text-primary">upload_file</span>
                  <span>Upload from Device (Max 2MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Custom Image URL */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Or paste image URL (https://...)"
                  value={customAvatarInput}
                  onChange={(e) => setCustomAvatarInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customAvatarInput.trim()) {
                      handleSelectAvatar(customAvatarInput.trim());
                      setCustomAvatarInput('');
                      setIsAvatarModalOpen(false);
                    }
                  }}
                  className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-dark cursor-pointer transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
