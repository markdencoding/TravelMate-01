import React, { useState } from 'react';
import { useTravelStore } from '../store';
import { TabType } from '../types';

interface MobileTopAppBarProps {
  onOpenNotifications: () => void;
  onSearchSubmit?: (query: string) => void;
  onOpenTripActions?: () => void;
}

export const MobileTopAppBar: React.FC<MobileTopAppBarProps> = ({
  onOpenNotifications,
  onSearchSubmit,
  onOpenTripActions,
}) => {
  const {
    activeTab,
    setActiveTab,
    unreadNotificationsCount,
    trips,
    activeTripId,
    openEditTripModal,
  } = useTravelStore();

  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeTrip = trips.find((t) => t.id === activeTripId);

  // Determine if detail page
  const isDetailPage = activeTab === 'dossier' || (activeTab === 'trips' && Boolean(activeTrip));

  // Title calculation based on current tab
  const getPageTitle = (tab: TabType) => {
    switch (tab) {
      case 'dashboard':
        return 'Home';
      case 'trips':
        return 'Expeditions';
      case 'explore-map':
        return 'Explore & Map';
      case 'expenses':
        return 'Expenses & Budget';
      case 'calendar':
        return 'Calendar';
      case 'dossier':
        return activeTrip ? activeTrip.title : 'Trip Dossier';
      case 'settings':
        return 'Settings';
      case 'admin':
        return 'Admin Panel';
      default:
        return 'TravelMate';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(searchQuery);
    }
  };

  const handleBack = () => {
    if (activeTab === 'dossier') {
      setActiveTab('trips');
    } else {
      setActiveTab('dashboard');
    }
  };

  return (
    <header className="sticky top-0 z-30 lg:hidden w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors shadow-2xs">
      {/* Full width expandable search mode */}
      {isSearchActive ? (
        <form
          onSubmit={handleSearchSubmit}
          className="h-14 px-4 flex items-center gap-2 animate-in fade-in duration-150"
        >
          <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
          <input
            autoFocus
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trips, places, expenses..."
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsSearchActive(false);
              setSearchQuery('');
            }}
            className="text-xs font-semibold text-teal-600 dark:text-teal-400 px-2 py-1 rounded-lg"
          >
            Cancel
          </button>
        </form>
      ) : (
        /* Slim Top App Bar */
        <div className="h-14 px-4 flex items-center justify-between">
          {/* Left: Back button (if detail) or Title */}
          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
            {activeTab !== 'dashboard' && (
              <button
                type="button"
                onClick={handleBack}
                className="p-1.5 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                aria-label="Go back"
              >
                <span className="material-symbols-outlined text-[22px]">arrow_back</span>
              </button>
            )}

            <div className="flex flex-col min-w-0">
              <h1 className="font-display font-extrabold text-base sm:text-lg text-slate-900 dark:text-white truncate tracking-tight">
                {getPageTitle(activeTab)}
              </h1>
              {activeTab === 'dashboard' && (
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono font-bold uppercase tracking-wider">
                  Kyoto &amp; Tokyo Atelier
                </span>
              )}
            </div>
          </div>

          {/* Right Action Icons: Search, Notifications, More Options */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Search Icon Trigger */}
            <button
              type="button"
              onClick={() => setIsSearchActive(true)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Search"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
            </button>

            {/* Notification Bell with Badge */}
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {unreadNotificationsCount > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {/* Trip Detail Action Menu */}
            {isDetailPage && (
              <button
                type="button"
                onClick={() => {
                  if (onOpenTripActions) {
                    onOpenTripActions();
                  } else {
                    openEditTripModal(activeTrip);
                  }
                }}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Trip actions"
              >
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
