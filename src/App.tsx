/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TravelStoreProvider, useTravelStore } from './store';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { EditTripModal } from './components/EditTripModal';
import { BottomNav } from './components/BottomNav';
import { MobileTopAppBar } from './components/MobileTopAppBar';
import { QuickActionsSheet } from './components/QuickActionsSheet';
import { MoreMenuSheet } from './components/MoreMenuSheet';
import { NotificationsPopover } from './components/NotificationsPopover';

import { DashboardScreen } from './screens/DashboardScreen';
import { TripsScreen } from './screens/TripsScreen';
import { ExploreMapScreen } from './screens/ExploreMapScreen';
import { ExpensesScreen } from './screens/ExpensesScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { AdminScreen } from './screens/AdminScreen';
import { DossierScreen } from './screens/DossierScreen';
import { AuthScreen } from './screens/AuthScreen';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    darkMode,
    toggleDarkMode,
    resetToSampleData,
    isSidebarCollapsed,
    openEditTripModal,
    activeTrip,
  } = useTravelStore();

  const [showResetToast, setShowResetToast] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const handleQuickReset = () => {
    resetToSampleData();
    setShowResetToast(true);
    setTimeout(() => setShowResetToast(false), 2500);
  };

  const handleQuickActionSelect = (action: 'trip' | 'activity' | 'expense') => {
    if (action === 'trip') {
      openEditTripModal();
    } else if (action === 'activity') {
      setActiveTab('trips');
    } else if (action === 'expense') {
      setActiveTab('expenses');
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-white text-slate-900'
      }`}
    >
      {/* Toast Notification for Quick Reset */}
      {showResetToast && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-fade-in border border-slate-700">
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">
            refresh
          </span>
          <span>Sample Kyoto expedition dataset restored successfully!</span>
        </div>
      )}

      {/* Global Edit Trip Modal (Bottom Sheet on mobile, centered on desktop) */}
      <EditTripModal />

      {/* Mobile Quick Actions Bottom Sheet */}
      <QuickActionsSheet
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onSelectAction={handleQuickActionSelect}
      />

      {/* Mobile "More" Menu Bottom Sheet */}
      <MoreMenuSheet
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
        onOpenNotifications={() => setIsNotifOpen(true)}
      />

      {/* Notifications Popover / Sheet */}
      <NotificationsPopover
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />

      {activeTab === 'auth' ? (
        // Fullscreen view for Auth
        <div className="min-h-screen flex flex-col justify-center bg-slate-50 dark:bg-slate-950 p-4">
          <AuthScreen />
        </div>
      ) : (
        <div className="flex h-screen overflow-hidden">
          {/* Desktop Left Sidebar (1024px and up strictly keeps current left sidebar; NO hamburger, drawer, or sidebar below 1024px) */}
          <div
            className={`hidden lg:flex shrink-0 transition-all duration-300 z-40 ${
              isSidebarCollapsed ? 'w-20' : 'w-64'
            }`}
          >
            <Sidebar />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Desktop Top Header Navbar (lg:flex) */}
            <Header onSearch={(q) => console.log('Search:', q)} />

            {/* Mobile & Tablet Slim Top App Bar (below 1024px) */}
            <MobileTopAppBar
              onOpenNotifications={() => setIsNotifOpen(true)}
              onSearchSubmit={(q) => console.log('Search:', q)}
              onOpenTripActions={() => openEditTripModal(activeTrip)}
            />

            {/* Scrollable Viewport with safe-area padding for docked bottom navigation bar */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 bg-slate-50/50 dark:bg-slate-950 transition-colors">
              <div className="max-w-7xl mx-auto">
                {activeTab === 'dashboard' && <DashboardScreen />}
                {activeTab === 'trips' && <TripsScreen />}
                {activeTab === 'explore-map' && <ExploreMapScreen />}
                {activeTab === 'expenses' && <ExpensesScreen />}
                {activeTab === 'calendar' && <CalendarScreen />}
                {activeTab === 'settings' && <SettingsScreen />}
                {activeTab === 'admin' && <AdminScreen />}
                {activeTab === 'dossier' && <DossierScreen />}
              </div>
            </main>
          </div>
        </div>
      )}

      {/* Fixed Edge-to-Edge Docked Mobile Bottom Navigation (below 1024px) */}
      <BottomNav
        onOpenQuickAction={() => setIsQuickActionOpen(true)}
        onOpenMore={() => setIsMoreMenuOpen(true)}
      />

      {/* Floating Sample Data Reset & Navigation Helper (Quick Dock) */}
      {activeTab !== 'auth' && (
        <aside
          aria-label="Expedition quick controls"
          className="fixed bottom-4 right-4 z-40 hidden sm:flex items-center gap-1.5 bg-white/95 dark:bg-slate-800/95 text-slate-800 dark:text-white backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-slate-200 dark:border-slate-700/60 text-xs transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
            {darkMode ? 'Dark Theme' : 'Light Theme'}
          </span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <button
            onClick={toggleDarkMode}
            className="hover:text-amber-600 dark:hover:text-amber-300 transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            title="Toggle theme"
          >
            <span className="material-symbols-outlined text-[13px]">
              {darkMode ? 'light_mode' : 'dark_mode'}
            </span>
            <span>{darkMode ? 'Light' : 'Dark'}</span>
          </button>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <button
            onClick={handleQuickReset}
            className="hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            title="Reset data to pristine sample state"
          >
            <span className="material-symbols-outlined text-[13px]">restart_alt</span>
            Reset Data
          </button>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <button
            onClick={() => setActiveTab('dossier')}
            className="hover:text-teal-600 dark:hover:text-teal-300 transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            title="Open printable travel dossier"
          >
            <span className="material-symbols-outlined text-[13px]">description</span>
            Dossier
          </button>
        </aside>
      )}
    </div>
  );
};

export default function App() {
  return (
    <TravelStoreProvider>
      <MainLayout />
    </TravelStoreProvider>
  );
}
