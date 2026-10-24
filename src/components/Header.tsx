import React, { useState } from 'react';
import Link from 'next/link';
import { useTravelStore } from '../store';
import { NotificationsPopover } from './NotificationsPopover';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearch }) => {
  const {
    unreadNotificationsCount,
    setActiveTab,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
    currentUser,
  } = useTravelStore();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
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
              placeholder="Search trips, places, expenses..."
              type="text"
              value={searchVal}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Right Actions: Dark Mode Toggle, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
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
          <Link
            href="/settings"
            className="flex items-center gap-2 pl-1 cursor-pointer group"
            title="Open user profile"
          >
            <img
              alt={`${currentUser?.name || 'User'} avatar`}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700 group-hover:ring-primary transition-all"
              src={currentUser?.avatar || '/avatars/fox-explorer.svg'}
            />
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors leading-tight">
                {currentUser?.name || 'Traveler'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono leading-tight">
                {currentUser?.role || 'Traveler'}
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* Notifications Popover */}
      <NotificationsPopover isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
};
