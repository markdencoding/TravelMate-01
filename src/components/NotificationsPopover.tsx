import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTravelStore } from '../store';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const {
    notifications,
    markAllNotificationsRead,
    dismissNotification,
    clearAllNotifications,
    unreadNotificationsCount,
    setActiveTab,
  } = useTravelStore();

  const [activeSubTab, setActiveSubTab] = useState<'all' | 'unread'>('all');

  if (!isOpen) return null;

  const displayedNotifications =
    activeSubTab === 'unread'
      ? notifications.filter((n) => n.unread)
      : notifications;

  const todayList = displayedNotifications.filter((n) => n.group === 'today');
  const earlierList = displayedNotifications.filter((n) => n.group === 'earlier');

  return (
    <>
      {/* Backdrop Scrim */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-on-surface/15 backdrop-blur-[2px] transition-opacity duration-200"
      />

      {/* Floating Panel on desktop/tablet, Bottom Sheet on mobile */}
      <div className="fixed inset-x-0 bottom-0 md:bottom-auto md:inset-x-auto md:top-14 md:right-6 lg:right-28 z-50 w-full md:w-[420px] max-h-[85vh] bg-surface-container-lowest rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden border-t md:border border-surface-container-high/80 animate-in slide-in-from-bottom md:zoom-in-95 duration-200">
        {/* Glow Bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-surface-tint to-secondary" />

        {/* Mobile Drag Indicator */}
        <div className="md:hidden pt-2.5 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="p-space-md pb-space-sm flex items-center justify-between bg-surface-container-lowest">
          <div className="flex items-center gap-2.5">
            <h2 className="font-section-title text-section-title text-on-surface">Notifications</h2>
            {unreadNotificationsCount > 0 ? (
              <span className="bg-secondary text-on-secondary font-badge text-badge px-2 py-0.5 rounded-full tracking-wide shadow-sm">
                {unreadNotificationsCount} UNREAD
              </span>
            ) : (
              <span className="bg-surface-container-high text-on-surface-variant font-badge text-badge px-2 py-0.5 rounded-full">
                0 UNREAD
              </span>
            )}
          </div>
          <button
            onClick={markAllNotificationsRead}
            className="text-primary hover:text-surface-tint font-button text-caption hover:underline transition-colors flex items-center gap-1 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">done_all</span>
            <span>Mark all as read</span>
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="px-space-md flex items-center gap-space-md bg-surface-container-lowest border-b border-surface-container-high/50">
          <button
            onClick={() => setActiveSubTab('all')}
            className={`relative pb-2.5 font-button text-body-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'all' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            <span>All</span>
            <span className="font-caption text-caption text-on-surface-variant bg-surface-container-high px-1.5 py-0.2 rounded-full">
              {notifications.length}
            </span>
            {activeSubTab === 'all' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('unread')}
            className={`relative pb-2.5 font-button text-body-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'unread' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            <span>Unread</span>
            <span className="font-caption text-caption text-secondary font-semibold bg-secondary-fixed/50 px-1.5 py-0.2 rounded-full">
              {unreadNotificationsCount}
            </span>
            {activeSubTab === 'unread' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        </div>

        {/* Notification Scroll Area */}
        <div className="flex flex-col p-space-md gap-space-md max-h-[460px] overflow-y-auto">
          {displayedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary-fixed/40 text-primary flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-[28px]">notifications_none</span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-section-title text-item-title text-on-surface">
                  {notifications.length === 0 ? 'No notifications yet' : 'You’re all caught up!'}
                </p>
                <p className="font-body text-caption text-on-surface-variant max-w-[280px]">
                  {notifications.length === 0
                    ? 'Important alerts, weather updates, and itinerary reminders will appear here.'
                    : 'No unread alerts — you’re fully up to date for your upcoming travels.'}
                </p>
              </div>
              {notifications.length > 0 && activeSubTab === 'unread' && (
                <button
                  type="button"
                  onClick={() => setActiveSubTab('all')}
                  className="mt-1 h-8 px-3 bg-surface-container-high text-primary hover:bg-surface-variant font-button text-caption rounded-lg transition-colors cursor-pointer"
                >
                  View All History
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Today Group */}
              {todayList.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="font-badge text-badge text-outline uppercase tracking-wider">
                      Today
                    </span>
                    <span className="font-caption text-caption text-outline">
                      {todayList.length} alerts
                    </span>
                  </div>

                  {todayList.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex flex-col gap-2.5 p-3.5 rounded-xl transition-all duration-150 ${
                        notif.unread
                          ? 'bg-surface-container-low'
                          : 'bg-surface-container-lowest hover:bg-surface-container-low opacity-90'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                            notif.type === 'budget'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-sky-100 text-sky-700'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {notif.type === 'budget' ? 'account_balance_wallet' : 'partly_cloudy_day'}
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-item-title text-small text-on-surface">
                              {notif.title}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="font-caption text-caption text-outline">
                                {notif.timeAgo}
                              </span>
                              {notif.unread && (
                                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                              )}
                            </div>
                          </div>
                          <p className="font-body text-small text-on-surface-variant mt-0.5 leading-snug">
                            {notif.message}
                          </p>
                        </div>
                      </div>

                      {/* Quick Actions if budget alert */}
                      {notif.type === 'budget' && (
                        <div className="flex items-center gap-2 pl-12">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('expenses');
                              router.push('/expenses');
                              onClose();
                            }}
                            className="h-7 px-3 bg-primary hover:bg-primary-container text-on-primary font-button text-caption rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>View Expenses</span>
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => dismissNotification(notif.id)}
                            className="h-7 px-2.5 bg-surface-container-high hover:bg-surface-variant text-on-surface-variant hover:text-on-surface font-button text-caption rounded-lg transition-colors cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Earlier Group */}
              {earlierList.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between px-1 pt-1">
                    <span className="font-badge text-badge text-outline uppercase tracking-wider">
                      Earlier This Week
                    </span>
                    <span className="font-caption text-caption text-outline">
                      {earlierList.length} items
                    </span>
                  </div>

                  {earlierList.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 p-3.5 rounded-xl transition-all duration-150 ${
                        notif.unread
                          ? 'bg-surface-container-low'
                          : 'bg-surface-container-lowest hover:bg-surface-container-low opacity-90'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                          notif.type === 'document'
                            ? 'bg-purple-100 text-purple-700'
                            : notif.type === 'waypoint'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {notif.type === 'document'
                            ? 'confirmation_number'
                            : notif.type === 'waypoint'
                            ? 'pin_drop'
                            : 'check_circle'}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-item-title text-small text-on-surface">
                            {notif.title}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-caption text-caption text-outline">
                              {notif.timeAgo}
                            </span>
                            {notif.unread && (
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                        </div>
                        <p className="font-body text-small text-on-surface-variant mt-0.5 leading-snug">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Panel Footer */}
        <div className="p-space-md pt-2.5 bg-surface-container-low/70 flex items-center justify-between border-t border-surface-container-high/60">
          <button
            type="button"
            onClick={() => {
              setActiveTab('settings');
              router.push('/settings');
              onClose();
            }}
            className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary font-button text-caption transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Notification Settings</span>
          </button>
          <button
            type="button"
            onClick={clearAllNotifications}
            className="text-secondary hover:text-on-secondary-container font-button text-caption hover:underline transition-colors cursor-pointer"
          >
            Clear all notifications
          </button>
        </div>
      </div>
    </>
  );
};
