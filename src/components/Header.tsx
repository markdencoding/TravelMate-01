import React, { useState } from 'react';
import { useTravelStore } from '../store';
import { NotificationsPopover } from './NotificationsPopover';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearch }) => {
  const {
    unreadNotificationsCount,
    setActiveTab,
    darkMode,
    themePreference,
    setThemePreference,
    toggleDarkMode,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
    currentUser,
  } = useTravelStore();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <>
      <header className="no-print hidden lg:flex sticky top-0 z-30 h-16 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xs border-b border-slate-200/80 dark:border-slate-800 items-center justify-between px-4 sm:px-6 transition-colors duration-200">
        {/* Left Side: Collapse Toggle & Search Bar */}
        <div className="flex items-center gap-3">
          {/* Desktop Sidebar Toggle Button */}
          <button
            onClick={toggleSidebarCollapsed}
            className="hidden md:flex p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isSidebarCollapsed ? 'Expand Sidebar (256px)' : 'Minimize Sidebar to Icon Rail (80px)'}
            aria-label="Toggle sidebar width"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isSidebarCollapsed ? 'menu' : 'menu_open'}
            </span>
          </button>

          {/* Search Bar */}
          <div className="relative w-64 sm:w-80 md:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[18px]">
              search
            </span>
            <input
              className="w-full h-9 pl-9 pr-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-2xs transition-all"
              placeholder="Search expeditions, temples, bookings..."
              type="text"
              value={searchVal}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Right Actions: Dark Mode Toggle, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Selector Popover & Button */}
          <div className="relative">
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/70 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all cursor-pointer shadow-2xs"
              title={`Theme: ${themePreference === 'system' ? 'Auto (System Sync)' : darkMode ? 'Dark Mode' : 'Light Mode'}`}
              aria-label="Theme selector"
            >
              <span className={`material-symbols-outlined text-[18px] ${
                darkMode ? 'text-amber-400' : 'text-amber-600'
              }`}>
                {themePreference === 'system' ? 'brightness_auto' : darkMode ? 'dark_mode' : 'light_mode'}
              </span>
              <span className="hidden sm:inline text-xs font-semibold">
                {themePreference === 'system' ? 'Auto' : darkMode ? 'Dark' : 'Light'}
              </span>
              <span className="material-symbols-outlined text-[14px] text-slate-400">
                arrow_drop_down
              </span>
            </button>

            {/* Theme Dropdown Menu */}
            {isThemeMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsThemeMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-50 flex flex-col gap-1 animate-fade-in text-xs">
                  <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                    Appearance Mode
                  </div>
                  <button
                    onClick={() => {
                      setThemePreference('light');
                      setIsThemeMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                      themePreference === 'light'
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px] text-amber-500">light_mode</span>
                    <span>Light (Crisp White)</span>
                  </button>
                  <button
                    onClick={() => {
                      setThemePreference('dark');
                      setIsThemeMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                      themePreference === 'dark'
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px] text-indigo-400">dark_mode</span>
                    <span>Dark (Night Explorer)</span>
                  </button>
                  <button
                    onClick={() => {
                      setThemePreference('system');
                      setIsThemeMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                      themePreference === 'system'
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px] text-emerald-500">brightness_auto</span>
                    <div className="flex flex-col text-left">
                      <span>Auto (System Sync)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Matches device theme</span>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Notifications Trigger */}
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            aria-label="Notifications"
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            type="button"
            title={`${unreadNotificationsCount} notifications`}
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {unreadNotificationsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* User Profile Lockup */}
          <div
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-2 pl-1 cursor-pointer group"
            title="Open curator profile"
          >
            <img
              alt={`${currentUser?.name || 'Curator'} avatar`}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700 group-hover:ring-primary transition-all"
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
            />
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors leading-tight">
                {currentUser?.name || 'Alex Morgan'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono leading-tight">
                {currentUser?.role || 'Lead Curator'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Popover */}
      <NotificationsPopover isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
};
