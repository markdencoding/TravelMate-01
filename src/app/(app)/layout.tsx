'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTravelStore } from '@/store';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { EditTripModal } from '@/components/EditTripModal';
import { BottomNav } from '@/components/BottomNav';
import { MobileTopAppBar } from '@/components/MobileTopAppBar';
import { QuickActionsSheet } from '@/components/QuickActionsSheet';
import { MoreMenuSheet } from '@/components/MoreMenuSheet';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { IdleTimeoutDialog } from '@/components/IdleTimeoutDialog';
import { createClient } from '@/lib/supabase/client';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const {
    darkMode,
    isSidebarCollapsed,
    openEditTripModal,
    activeTrip,
  } = useTravelStore();

  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // 5. Handle back-forward cache (bfcache) check on pageshow
  useEffect(() => {
    const handlePageShow = async (event: PageTransitionEvent) => {
      if (event.persisted) {
        try {
          const supabase = createClient();
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) {
            window.location.replace('/login');
          }
        } catch {
          window.location.replace('/login');
        }
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const handleQuickActionSelect = (action: 'trip' | 'activity' | 'expense') => {
    if (action === 'trip') {
      openEditTripModal();
    } else if (action === 'activity') {
      router.push('/calendar');
    } else if (action === 'expense') {
      router.push('/expenses');
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-white text-slate-900'
      }`}
    >
      {/* Idle Session Warning Dialog */}
      <IdleTimeoutDialog />

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
            onOpenTripActions={() => openEditTripModal(activeTrip.id ? activeTrip : undefined)}
          />

          {/* Scrollable Viewport with safe-area padding for docked bottom navigation bar */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 bg-slate-50/50 dark:bg-slate-950 transition-colors">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>

      {/* Fixed Edge-to-Edge Docked Mobile Bottom Navigation (below 1024px) */}
      <BottomNav
        onOpenQuickAction={() => setIsQuickActionOpen(true)}
        onOpenMore={() => setIsMoreMenuOpen(true)}
      />

      {/* Floating Status & Navigation Helper (Quick Dock) */}
      <aside
        aria-label="Expedition quick controls"
        className="fixed bottom-4 right-4 z-40 hidden sm:flex items-center gap-1.5 bg-white/95 dark:bg-slate-800/95 text-slate-800 dark:text-white backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-slate-200 dark:border-slate-700/60 text-xs transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
          {darkMode ? 'Dark Theme' : 'Light Theme'}
        </span>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <button
          onClick={() => router.push('/dossier')}
          className="hover:text-teal-600 dark:hover:text-teal-300 transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
          title="Open printable travel dossier"
        >
          <span className="material-symbols-outlined text-[13px]">description</span>
          Dossier
        </button>
      </aside>
    </div>
  );
}
