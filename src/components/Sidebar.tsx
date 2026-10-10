import React, { useState } from 'react';
import { useTravelStore } from '../store';
import { TabType } from '../types';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    openEditTripModal,
    unreadNotificationsCount,
    resetToSampleData,
    currentUser,
    darkMode,
    themePreference,
    setThemePreference,
    toggleDarkMode,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
  } = useTravelStore();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const navItems: { id: TabType; label: string; icon: string; secure?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'trips', label: 'Trips', icon: 'luggage' },
    { id: 'explore-map', label: 'Explore / Map', icon: 'map' },
    { id: 'expenses', label: 'Expenses', icon: 'payments' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar_today' },
    { id: 'dossier', label: 'Dossier PDF', icon: 'description' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
    { id: 'admin', label: 'Admin', icon: 'admin_panel_settings', secure: true },
  ];

  return (
    <aside
      className={`no-print h-full flex flex-col justify-between p-3.5 border-r transition-all duration-300 select-none bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-xs ${
        isSidebarCollapsed ? 'w-20 items-center' : 'w-64'
      }`}
    >
      {/* Top Section: Logo, Collapse Button, New Trip, Navigation */}
      <div className="flex flex-col gap-4 w-full">
        {/* Header: Logo and Collapse/Expand Toggle */}
        <div className="flex items-center justify-between w-full px-1">
          <div
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2.5 cursor-pointer group ${
              isSidebarCollapsed ? 'justify-center w-full' : ''
            }`}
            title="TravelMate Atelier"
          >
            <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">explore</span>
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col leading-tight">
                <span className="font-extrabold text-sm tracking-tight font-display text-slate-900 dark:text-white">
                  TravelMate
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-wider uppercase">
                  Atelier
                </span>
              </div>
            )}
          </div>

          {/* Minimize / Expand Toggle Button */}
          {!isSidebarCollapsed && (
            <button
              onClick={toggleSidebarCollapsed}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Minimize sidebar to icon rail"
              aria-label="Minimize sidebar"
            >
              <span className="material-symbols-outlined text-[18px]">
                keyboard_double_arrow_left
              </span>
            </button>
          )}
        </div>

        {/* Floating Expand Button when Collapsed */}
        {isSidebarCollapsed && (
          <button
            onClick={toggleSidebarCollapsed}
            className="w-10 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer mx-auto"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <span className="material-symbols-outlined text-[18px]">
              keyboard_double_arrow_right
            </span>
          </button>
        )}

        {/* Primary CTA: New Trip Button */}
        {isSidebarCollapsed ? (
          <button
            onClick={() => openEditTripModal()}
            className="w-11 h-11 bg-primary hover:bg-primary-dark text-white rounded-xl flex items-center justify-center shadow-sm shadow-primary/25 transition-transform hover:scale-105 active:scale-95 cursor-pointer mx-auto"
            title="Plan New Expedition"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">add</span>
          </button>
        ) : (
          <button
            onClick={() => openEditTripModal()}
            className="w-full h-10 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-primary/25 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>New Expedition</span>
          </button>
        )}

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 w-full pt-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <div key={item.id} className="relative group/nav w-full">
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center rounded-xl transition-all cursor-pointer ${
                    isSidebarCollapsed
                      ? 'justify-center h-10 px-0'
                      : 'justify-between px-3 py-2 text-left'
                  } ${
                    isActive
                      ? 'bg-primary text-white font-bold shadow-xs shadow-primary/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                  type="button"
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px] shrink-0">
                      {item.icon}
                    </span>
                    {!isSidebarCollapsed && (
                      <span className="text-xs font-semibold">{item.label}</span>
                    )}
                  </div>

                  {!isSidebarCollapsed && item.secure && (
                    <span
                      className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      SECURE
                    </span>
                  )}

                  {/* Notification Dot in collapsed mode */}
                  {isSidebarCollapsed && item.id === 'dashboard' && unreadNotificationsCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-2" />
                  )}
                </button>

                {/* Floating Tooltip Pill for Collapsed Mode */}
                {isSidebarCollapsed && (
                  <div className="hidden group-hover/nav:flex absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-semibold rounded-lg shadow-xl z-50 whitespace-nowrap pointer-events-none items-center gap-1.5 animate-fade-in">
                    <span>{item.label}</span>
                    {item.secure && (
                      <span className="text-[9px] text-amber-400 font-mono">SECURE</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Dark Mode Toggle, Alerts, Profile */}
      <div className="w-full flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        {/* Dark Mode & System Auto-Sync Switcher */}
        {isSidebarCollapsed ? (
          <button
            type="button"
            onClick={() => {
              if (themePreference === 'system') setThemePreference('light');
              else if (themePreference === 'light') setThemePreference('dark');
              else setThemePreference('system');
            }}
            className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={`Current Theme: ${themePreference === 'system' ? 'Auto (System Sync)' : darkMode ? 'Dark Mode' : 'Light Mode'} (Click to cycle)`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                darkMode ? 'text-amber-400' : 'text-amber-600'
              }`}
            >
              {themePreference === 'system' ? 'brightness_auto' : darkMode ? 'dark_mode' : 'light_mode'}
            </span>
          </button>
        ) : (
          <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 shadow-2xs gap-0.5">
            <button
              type="button"
              onClick={() => setThemePreference('light')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                themePreference === 'light'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Force Light Mode (Crisp White)"
            >
              <span className="material-symbols-outlined text-[14px] text-amber-500">light_mode</span>
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => setThemePreference('dark')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                themePreference === 'dark'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Force Dark Mode (Night Explorer)"
            >
              <span className="material-symbols-outlined text-[14px] text-indigo-400">
                dark_mode
              </span>
              <span>Dark</span>
            </button>
            <button
              type="button"
              onClick={() => setThemePreference('system')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                themePreference === 'system'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Auto-sync with Device / System Theme"
            >
              <span className="material-symbols-outlined text-[14px]">
                brightness_auto
              </span>
              <span>Auto</span>
            </button>
          </div>
        )}

        {/* User Profile Card */}
        <div className="relative w-full">
          {isSidebarCollapsed ? (
            <div
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center cursor-pointer group"
              title={`${currentUser?.name || 'Alex Morgan'} (${currentUser?.role || 'Curator'})`}
            >
              <img
                alt={currentUser?.name || 'Curator Profile'}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700 group-hover:ring-primary transition-all"
                src={
                  currentUser?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                }
              />
            </div>
          ) : (
            <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
              <div
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
              >
                <img
                  alt={currentUser?.name || 'Curator'}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                  src={
                    currentUser?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                  }
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {currentUser?.name || 'Alex Morgan'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                    {currentUser?.role || 'Lead Curator'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
                title="Account options"
              >
                <span className="material-symbols-outlined text-[18px]">more_vert</span>
              </button>
            </div>
          )}

          {/* Profile Dropdown Popover */}
          {isProfileMenuOpen && (
            <div
              className={`absolute bottom-full mb-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 flex flex-col gap-1 z-50 text-xs font-medium text-slate-700 dark:text-slate-200 ${
                isSidebarCollapsed ? 'left-full ml-2 w-48' : 'left-0 right-0'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setActiveTab('settings');
                  setIsProfileMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-xl transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">settings</span>
                <span>Settings &amp; Theme</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('dossier');
                  setIsProfileMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-xl transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                <span>Printable Dossier</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  resetToSampleData();
                  setIsProfileMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span>Reset Sample Data</span>
              </button>
              <div className="h-px bg-slate-100 dark:bg-slate-700 my-0.5" />
              <button
                type="button"
                onClick={() => {
                  setActiveTab('auth');
                  setIsProfileMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-left text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-xl transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>Switch / Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
