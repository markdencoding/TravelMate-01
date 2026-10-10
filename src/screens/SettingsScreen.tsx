import React, { useState } from 'react';
import { useTravelStore } from '../store';

export const SettingsScreen: React.FC = () => {
  const {
    currentUser,
    userPreferences,
    updateUserPreferences,
    resetToSampleData,
    exportDataAsJson,
    darkMode,
    setDarkMode,
    themePreference,
    setThemePreference,
  } = useTravelStore();

  const [activeSubTab, setActiveSubTab] = useState<'general' | 'preferences' | 'data' | 'security'>(
    'general'
  );
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Form local states for profile
  const [userName, setUserName] = useState(currentUser.name);
  const [userEmail, setUserEmail] = useState(currentUser.email);
  const [bio, setBio] = useState('Passionate about Kyoto architecture, tea ceremonies, and alpine trekking.');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleResetData = () => {
    resetToSampleData();
    setShowResetConfirm(false);
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
          <span>Preferences updated and persisted to storage.</span>
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
              Configure your expedition atelier, localization standards, offline caches, and data sovereignty.
            </p>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold text-slate-500">
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
            <div className="relative inline-block mx-auto">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 shadow-sm"
              />
              <span className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full shadow-xs cursor-pointer hover:bg-primary-dark">
                <span className="material-symbols-outlined text-[14px]">edit</span>
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
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-left space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Account Created:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">January 2024</span>
              </div>
              <div className="flex justify-between">
                <span>Total Expeditions:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">5 trips</span>
              </div>
              <div className="flex justify-between">
                <span>Storage Protocol:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Client-Side First</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
              Curator Information
            </h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Traveler Bio / Focus
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
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
            {/* Preferred Currency */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Primary Currency
              </label>
              <select
                value={userPreferences.currency}
                onChange={(e) => updateUserPreferences({ currency: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="JPY">JPY (¥) - Japanese Yen</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="CAD">CAD ($) - Canadian Dollar</option>
              </select>
              <p className="text-[11px] text-slate-400">Used for budgeting calculations and default expense entries.</p>
            </div>

            {/* Units System */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Measurement System
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateUserPreferences({ measurementUnits: 'metric' })}
                  className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all ${
                    userPreferences.measurementUnits === 'metric'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Metric (km, °C)
                </button>
                <button
                  type="button"
                  onClick={() => updateUserPreferences({ measurementUnits: 'imperial' })}
                  className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all ${
                    userPreferences.measurementUnits === 'imperial'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Imperial (mi, °F)
                </button>
              </div>
              <p className="text-[11px] text-slate-400">Controls walking distances and weather displays.</p>
            </div>

            {/* Date Format */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Date Representation
              </label>
              <select
                value={userPreferences.dateFormat}
                onChange={(e) => updateUserPreferences({ dateFormat: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
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
                Active appearance: <span className="font-semibold text-slate-700 dark:text-slate-300">{darkMode ? 'Dark Theme (Night Explorer)' : 'Light Theme (Paper Atelier - Crisp White)'}</span>
                {themePreference === 'system' && ' • Synchronized with device system preferences'}
              </p>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Notification Sound & Alert Badges
                </div>
                <div className="text-[11px] text-slate-500">
                  Play gentle chime on transit departure milestones and schedule conflicts.
                </div>
              </div>
              <input
                type="checkbox"
                checked={userPreferences.notificationsEnabled}
                onChange={(e) =>
                  updateUserPreferences({ notificationsEnabled: e.target.checked })
                }
                className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Preload High-Resolution Satellite Tiles
                </div>
                <div className="text-[11px] text-slate-500">
                  Cache offline vector map coordinates for low-connectivity expeditions.
                </div>
              </div>
              <input
                type="checkbox"
                checked={userPreferences.offlineSync}
                onChange={(e) =>
                  updateUserPreferences({ offlineSync: e.target.checked })
                }
                className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
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
                <span className="font-mono">148 KB / 5.0 MB</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '3.2%' }} />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>5 Expeditions, 24 Activities, 12 Expenses</span>
                <span>96.8% Remaining</span>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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

              <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
                  <span className="material-symbols-outlined text-rose-600 dark:text-rose-400 text-[18px]">
                    restart_alt
                  </span>
                  One-Click Sample Data Reset
                </div>
                <p className="text-[11px] text-rose-600 dark:text-rose-400">
                  Reset the app to pristine state with the Kyoto, Amalfi, and Patagonia sample journeys.
                </p>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                >
                  Reset to Curated Defaults
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

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">warning</span>
            </div>
            <div className="text-center">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Reset Local Dataset?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This will overwrite any newly drafted expenses or itinerary edits with the baseline Kyoto expedition template.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white transition-colors"
              >
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
