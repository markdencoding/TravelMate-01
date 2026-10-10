import React, { useState, useEffect } from 'react';
import { useTravelStore } from '../store';
import { TabType } from '../types';
import { BottomSheet } from './BottomSheet';

interface BottomNavProps {
  onOpenQuickAction: () => void;
  onOpenMore: () => void;
  onOpenAddExpense?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  onOpenQuickAction,
  onOpenMore,
}) => {
  const { activeTab, setActiveTab } = useTravelStore();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Detect virtual keyboard opening (screen height resize > 150px)
  useEffect(() => {
    let initialHeight = window.innerHeight;
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      if (initialHeight - currentHeight > 150) {
        setIsKeyboardOpen(true);
      } else {
        setIsKeyboardOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hide on auth screen or when virtual keyboard is open
  if (activeTab === 'auth' || isKeyboardOpen) {
    return null;
  }

  // 5 slots: Home, Trips, centered "+" button, Explore, More
  const isHomeActive = activeTab === 'dashboard';
  const isTripsActive = activeTab === 'trips';
  const isExploreActive = activeTab === 'explore-map';
  const isMoreActive = ['expenses', 'calendar', 'settings', 'admin', 'dossier'].includes(activeTab);

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden pointer-events-auto"
    >
      <div className="relative w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.4)] pb-safe">
        <div className="h-16 px-3 flex items-center justify-around relative">
          {/* Tab 1: Home */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="flex-1 flex flex-col items-center justify-center py-1 transition-all group cursor-pointer"
            aria-label="Home Dashboard"
          >
            <div
              className={`relative px-3 py-1 rounded-full flex items-center justify-center transition-all ${
                isHomeActive ? 'bg-teal-50 dark:bg-teal-950/60' : ''
              }`}
            >
              <span
                className={`material-symbols-outlined text-[24px] transition-transform duration-200 ${
                  isHomeActive
                    ? 'text-teal-600 dark:text-teal-400 font-bold scale-110'
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                }`}
                style={{
                  fontVariationSettings: isHomeActive ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                home
              </span>
            </div>
            <span
              className={`text-[11px] font-medium tracking-tight mt-0.5 leading-none transition-colors ${
                isHomeActive
                  ? 'text-teal-600 dark:text-teal-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Home
            </span>
          </button>

          {/* Tab 2: Trips */}
          <button
            type="button"
            onClick={() => setActiveTab('trips')}
            className="flex-1 flex flex-col items-center justify-center py-1 transition-all group cursor-pointer"
            aria-label="My Trips"
          >
            <div
              className={`relative px-3 py-1 rounded-full flex items-center justify-center transition-all ${
                isTripsActive ? 'bg-teal-50 dark:bg-teal-950/60' : ''
              }`}
            >
              <span
                className={`material-symbols-outlined text-[24px] transition-transform duration-200 ${
                  isTripsActive
                    ? 'text-teal-600 dark:text-teal-400 font-bold scale-110'
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                }`}
                style={{
                  fontVariationSettings: isTripsActive ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                luggage
              </span>
            </div>
            <span
              className={`text-[11px] font-medium tracking-tight mt-0.5 leading-none transition-colors ${
                isTripsActive
                  ? 'text-teal-600 dark:text-teal-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Trips
            </span>
          </button>

          {/* Center Slot: Raised 56px Coral "+" Action Button */}
          <div className="flex-1 flex flex-col items-center justify-center relative -mt-5">
            <button
              type="button"
              onClick={onOpenQuickAction}
              className="w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-rose-500/35 border-4 border-white dark:border-slate-900 transition-all cursor-pointer"
              aria-label="Quick Actions"
            >
              <span className="material-symbols-outlined text-[30px] font-bold">add</span>
            </button>
            <span className="text-[11px] font-medium tracking-tight text-slate-500 dark:text-slate-400 mt-1 leading-none">
              Create
            </span>
          </div>

          {/* Tab 3: Explore */}
          <button
            type="button"
            onClick={() => setActiveTab('explore-map')}
            className="flex-1 flex flex-col items-center justify-center py-1 transition-all group cursor-pointer"
            aria-label="Explore Map"
          >
            <div
              className={`relative px-3 py-1 rounded-full flex items-center justify-center transition-all ${
                isExploreActive ? 'bg-teal-50 dark:bg-teal-950/60' : ''
              }`}
            >
              <span
                className={`material-symbols-outlined text-[24px] transition-transform duration-200 ${
                  isExploreActive
                    ? 'text-teal-600 dark:text-teal-400 font-bold scale-110'
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                }`}
                style={{
                  fontVariationSettings: isExploreActive ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                map
              </span>
            </div>
            <span
              className={`text-[11px] font-medium tracking-tight mt-0.5 leading-none transition-colors ${
                isExploreActive
                  ? 'text-teal-600 dark:text-teal-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Explore
            </span>
          </button>

          {/* Tab 4: More */}
          <button
            type="button"
            onClick={onOpenMore}
            className="flex-1 flex flex-col items-center justify-center py-1 transition-all group cursor-pointer"
            aria-label="More Features and Settings"
          >
            <div
              className={`relative px-3 py-1 rounded-full flex items-center justify-center transition-all ${
                isMoreActive ? 'bg-teal-50 dark:bg-teal-950/60' : ''
              }`}
            >
              <span
                className={`material-symbols-outlined text-[24px] transition-transform duration-200 ${
                  isMoreActive
                    ? 'text-teal-600 dark:text-teal-400 font-bold scale-110'
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                }`}
                style={{
                  fontVariationSettings: isMoreActive ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                grid_view
              </span>
            </div>
            <span
              className={`text-[11px] font-medium tracking-tight mt-0.5 leading-none transition-colors ${
                isMoreActive
                  ? 'text-teal-600 dark:text-teal-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              More
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
};
