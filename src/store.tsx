import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Trip,
  ScheduledActivity,
  ExpenseItem,
  ReminderItem,
  PlacePOI,
  NotificationAlert,
  AdminUserRecord,
  UserPreferences,
  CurrentUser,
  TabType,
} from './types';
import {
  INITIAL_TRIPS,
  INITIAL_SCHEDULED_ACTIVITIES,
  INITIAL_EXPENSES,
  INITIAL_REMINDERS,
  INITIAL_PLACES,
  INITIAL_NOTIFICATIONS,
  INITIAL_ADMIN_USERS,
  INITIAL_PREFERENCES,
} from './mockData';

interface TravelStoreContextType {
  // Navigation
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  // Active Trip
  activeTripId: string;
  setActiveTripId: (id: string) => void;
  activeTrip: Trip;

  // Trips
  trips: Trip[];
  addTrip: (trip: Omit<Trip, 'id'>) => void;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  toggleBookmarkTrip: (id: string) => void;

  // Activities
  activities: ScheduledActivity[];
  addActivity: (activity: Omit<ScheduledActivity, 'id'>) => void;
  deleteActivity: (id: string) => void;

  // Expenses
  expenses: ExpenseItem[];
  addExpense: (expense: Omit<ExpenseItem, 'id'>) => void;
  deleteExpense: (id: string) => void;

  // Reminders
  reminders: ReminderItem[];
  toggleReminder: (id: string) => void;

  // Places & Explore
  places: PlacePOI[];
  toggleSavePlace: (id: string) => void;
  addPlaceToTrip: (placeId: string, tripId: string, dayNumber: number) => void;

  // Notifications
  notifications: NotificationAlert[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  unreadNotificationsCount: number;

  // Admin Users
  adminUsers: AdminUserRecord[];
  toggleAdminUserStatus: (id: string) => void;
  updateAdminUserRole: (id: string, role: AdminUserRecord['role']) => void;
  deleteAdminUser: (id: string) => void;

  // Current User
  currentUser: CurrentUser;
  setCurrentUser: (user: CurrentUser) => void;

  // Preferences
  preferences: UserPreferences;
  userPreferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  updateUserPreferences: (updates: Partial<UserPreferences>) => void;

  // Dark Mode & Theme
  darkMode: boolean;
  themePreference: 'system' | 'light' | 'dark';
  setThemePreference: (pref: 'system' | 'light' | 'dark') => void;
  setDarkMode: (val: boolean) => void;
  toggleDarkMode: () => void;

  // Sidebar Minimization
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (val: boolean) => void;
  toggleSidebarCollapsed: () => void;

  // Modal states
  isEditTripModalOpen: boolean;
  setIsEditTripModalOpen: (open: boolean) => void;
  editingTrip: Trip | null;
  openEditTripModal: (trip?: Trip) => void;

  // Reset & Export
  resetToSampleData: () => void;
  exportDataAsJson: () => void;
}

const STORAGE_KEY = 'travelmate_store_v1';

const DEFAULT_CURRENT_USER: CurrentUser = {
  name: 'Alex Morgan',
  email: 'alex.morgan@curator.travel',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  role: 'Lead Atelier Curator',
};

const TravelStoreContext = createContext<TravelStoreContextType | null>(null);

export const TravelStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [activeTripId, setActiveTripId] = useState<string>('kyoto-tokyo');

  // Theme preference: 'system' (default with auto-sync), 'light', or 'dark'
  const [themePreference, setThemePreferenceState] = useState<'system' | 'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_theme_preference`);
      if (saved === 'system' || saved === 'light' || saved === 'dark') {
        return saved;
      }
      return 'system';
    } catch {
      return 'system';
    }
  });

  // Compute initial dark mode based on preference or system
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const savedPref = localStorage.getItem(`${STORAGE_KEY}_theme_preference`);
      if (savedPref === 'dark') return true;
      if (savedPref === 'light') return false;
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return false;
    } catch {
      return false;
    }
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_sidebar_collapsed`);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Listen to system dark mode preference change when preference is 'system'
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (themePreference === 'system') {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [themePreference]);

  // Synchronize root HTML class and color-scheme attribute with dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [darkMode]);

  // Save theme preference and update dark mode accordingly
  const setThemePreference = (pref: 'system' | 'light' | 'dark') => {
    setThemePreferenceState(pref);
    try {
      localStorage.setItem(`${STORAGE_KEY}_theme_preference`, pref);
    } catch (e) {
      console.warn('Theme preference storage failed', e);
    }

    if (pref === 'system') {
      const isSysDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(isSysDark);
    } else if (pref === 'dark') {
      setDarkMode(true);
    } else {
      setDarkMode(false);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_sidebar_collapsed`, String(isSidebarCollapsed));
    } catch (e) {
      console.warn('Sidebar storage sync failed', e);
    }
  }, [isSidebarCollapsed]);

  const toggleSidebarCollapsed = () => setIsSidebarCollapsed((prev) => !prev);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setThemePreference(nextDark ? 'dark' : 'light');
  };

  // Load from local storage or use defaults
  const [trips, setTrips] = useState<Trip[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_trips`);
      if (saved) {
        const parsed: Trip[] = JSON.parse(saved);
        return parsed.map((t) => ({
          ...t,
          budget: t.budget ?? t.estimatedBudget,
          destinations: t.destinations ?? [t.destinationRegion],
          description: t.description ?? t.routeSummary ?? t.notes ?? '',
        }));
      }
      return INITIAL_TRIPS.map((t) => ({
        ...t,
        budget: t.budget ?? t.estimatedBudget,
        destinations: t.destinations ?? [t.destinationRegion],
        description: t.description ?? t.routeSummary ?? t.notes ?? '',
      }));
    } catch {
      return INITIAL_TRIPS;
    }
  });

  const [activities, setActivities] = useState<ScheduledActivity[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_activities`);
      if (saved) {
        const parsed: ScheduledActivity[] = JSON.parse(saved);
        return parsed.map((a) => ({
          ...a,
          startTime: a.startTime ?? a.time,
          endTime: a.endTime ?? '12:00 PM',
          notes: a.notes ?? a.description ?? '',
          cost: a.cost ?? 0,
        }));
      }
      return INITIAL_SCHEDULED_ACTIVITIES.map((a) => ({
        ...a,
        startTime: a.startTime ?? a.time,
        endTime: a.endTime ?? '12:00 PM',
        notes: a.notes ?? a.description ?? '',
        cost: a.cost ?? 0,
      }));
    } catch {
      return INITIAL_SCHEDULED_ACTIVITIES;
    }
  });

  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_expenses`);
      if (saved) {
        const parsed: ExpenseItem[] = JSON.parse(saved);
        return parsed.map((e) => ({
          ...e,
          amount: e.amount ?? e.costJpy ?? e.costUsd ?? 0,
        }));
      }
      return INITIAL_EXPENSES.map((e) => ({
        ...e,
        amount: e.amount ?? e.costJpy ?? e.costUsd ?? 0,
      }));
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [reminders, setReminders] = useState<ReminderItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_reminders`);
      return saved ? JSON.parse(saved) : INITIAL_REMINDERS;
    } catch {
      return INITIAL_REMINDERS;
    }
  });

  const [places, setPlaces] = useState<PlacePOI[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_places`);
      return saved ? JSON.parse(saved) : INITIAL_PLACES;
    } catch {
      return INITIAL_PLACES;
    }
  });

  const [notifications, setNotifications] = useState<NotificationAlert[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_notifs`);
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_users`);
      if (saved) {
        const parsed: AdminUserRecord[] = JSON.parse(saved);
        return parsed.map((u) => ({
          ...u,
          avatar: u.avatar ?? u.avatarUrl ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        }));
      }
      return INITIAL_ADMIN_USERS.map((u) => ({
        ...u,
        avatar: u.avatar ?? u.avatarUrl ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      }));
    } catch {
      return INITIAL_ADMIN_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<CurrentUser>(DEFAULT_CURRENT_USER);

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_prefs`);
      return saved ? JSON.parse(saved) : INITIAL_PREFERENCES;
    } catch {
      return INITIAL_PREFERENCES;
    }
  });

  // Modal State
  const [isEditTripModalOpen, setIsEditTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_trips`, JSON.stringify(trips));
    } catch (e) {
      console.warn('Storage sync failed', e);
    }
  }, [trips]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_activities`, JSON.stringify(activities));
    } catch (e) {
      console.warn('Storage sync failed', e);
    }
  }, [activities]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_expenses`, JSON.stringify(expenses));
    } catch (e) {
      console.warn('Storage sync failed', e);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_reminders`, JSON.stringify(reminders));
    } catch (e) {
      console.warn('Storage sync failed', e);
    }
  }, [reminders]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_places`, JSON.stringify(places));
    } catch (e) {
      console.warn('Storage sync failed', e);
    }
  }, [places]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_notifs`, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Storage sync failed', e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(adminUsers));
    } catch (e) {
      console.warn('Storage sync failed', e);
    }
  }, [adminUsers]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_prefs`, JSON.stringify(preferences));
    } catch (e) {
      console.warn('Storage sync failed', e);
    }
  }, [preferences]);

  // Derived Active Trip guaranteed non-null
  const activeTrip: Trip =
    trips.find((t) => t.id === activeTripId) ||
    trips[0] ||
    INITIAL_TRIPS[0];

  // Actions
  const addTrip = (tripData: Omit<Trip, 'id'>) => {
    const id = `trip-${Date.now()}`;
    const newTrip: Trip = {
      ...tripData,
      id,
      budget: tripData.budget ?? tripData.estimatedBudget,
      destinations: tripData.destinations ?? [tripData.destinationRegion],
      description: tripData.description ?? tripData.routeSummary ?? '',
    };
    setTrips((prev) => [newTrip, ...prev]);
    setActiveTripId(id);
  };

  const updateTrip = (id: string, updates: Partial<Trip>) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteTrip = (id: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
    if (activeTripId === id) {
      const remaining = trips.filter((t) => t.id !== id);
      if (remaining.length > 0) {
        setActiveTripId(remaining[0].id);
      }
    }
  };

  const toggleBookmarkTrip = (id: string) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isBookmarked: !t.isBookmarked } : t))
    );
  };

  const addActivity = (actData: Omit<ScheduledActivity, 'id'>) => {
    const newAct: ScheduledActivity = {
      ...actData,
      id: `act-${Date.now()}`,
      time: actData.time || actData.startTime || '09:00 AM',
      startTime: actData.startTime || actData.time || '09:00 AM',
      endTime: actData.endTime || '10:30 AM',
      cost: actData.cost ?? 0,
      notes: actData.notes || actData.description || '',
    };
    setActivities((prev) => [...prev, newAct]);
  };

  const deleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  const addExpense = (expData: Omit<ExpenseItem, 'id'>) => {
    const newExp: ExpenseItem = {
      ...expData,
      id: `exp-${Date.now()}`,
      amount: expData.amount ?? expData.costJpy ?? expData.costUsd ?? 0,
    };
    setExpenses((prev) => [newExp, ...prev]);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const toggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  };

  const toggleSavePlace = (id: string) => {
    setPlaces((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isSaved: !p.isSaved } : p))
    );
  };

  const addPlaceToTrip = (placeId: string, tripId: string, dayNumber: number) => {
    const place = places.find((p) => p.id === placeId);
    if (!place) return;

    addActivity({
      tripId,
      dayNumber,
      time: place.timing.split(' - ')[0] || '10:00 AM',
      startTime: place.timing.split(' - ')[0] || '10:00 AM',
      endTime: place.timing.split(' - ')[1] || '12:00 PM',
      title: place.name,
      location: place.ward,
      category: place.category === 'food' ? 'food' : 'activities',
      duration: '2h',
      cost: 0,
      description: place.description,
      notes: place.description,
    });

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'Place Added to Itinerary',
        message: `${place.name} was scheduled for Day ${dayNumber}.`,
        timeAgo: 'Just now',
        type: 'waypoint',
        unread: true,
        group: 'today',
        actionTarget: 'calendar',
      },
      ...prev,
    ]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const toggleAdminUserStatus = (id: string) => {
    setAdminUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const nextStatus = u.status === 'ACTIVE' || u.status === 'active' ? 'DISABLED' : 'ACTIVE';
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const updateAdminUserRole = (id: string, role: AdminUserRecord['role']) => {
    setAdminUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role } : u))
    );
  };

  const deleteAdminUser = (id: string) => {
    setAdminUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  };

  const openEditTripModal = (trip?: Trip) => {
    setEditingTrip(trip || activeTrip || null);
    setIsEditTripModalOpen(true);
  };

  const resetToSampleData = () => {
    localStorage.removeItem(`${STORAGE_KEY}_trips`);
    localStorage.removeItem(`${STORAGE_KEY}_activities`);
    localStorage.removeItem(`${STORAGE_KEY}_expenses`);
    localStorage.removeItem(`${STORAGE_KEY}_reminders`);
    localStorage.removeItem(`${STORAGE_KEY}_places`);
    localStorage.removeItem(`${STORAGE_KEY}_notifs`);
    localStorage.removeItem(`${STORAGE_KEY}_users`);
    localStorage.removeItem(`${STORAGE_KEY}_prefs`);
    setTrips(INITIAL_TRIPS);
    setActivities(INITIAL_SCHEDULED_ACTIVITIES);
    setExpenses(INITIAL_EXPENSES);
    setReminders(INITIAL_REMINDERS);
    setPlaces(INITIAL_PLACES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAdminUsers(INITIAL_ADMIN_USERS);
    setPreferences(INITIAL_PREFERENCES);
    setActiveTripId('kyoto-tokyo');
  };

  const exportDataAsJson = () => {
    const dataToExport = {
      trips,
      activities,
      expenses,
      reminders,
      places,
      preferences,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `travelmate-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const unreadNotificationsCount = notifications.filter((n) => n.unread).length;

  return (
    <TravelStoreContext.Provider
      value={{
        activeTab,
        setActiveTab,
        activeTripId,
        setActiveTripId,
        activeTrip,
        trips,
        addTrip,
        updateTrip,
        deleteTrip,
        toggleBookmarkTrip,
        activities,
        addActivity,
        deleteActivity,
        expenses,
        addExpense,
        deleteExpense,
        reminders,
        toggleReminder,
        places,
        toggleSavePlace,
        addPlaceToTrip,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        dismissNotification,
        clearAllNotifications,
        unreadNotificationsCount,
        adminUsers,
        toggleAdminUserStatus,
        updateAdminUserRole,
        deleteAdminUser,
        currentUser,
        setCurrentUser,
        preferences,
        userPreferences: preferences,
        updatePreferences,
        updateUserPreferences: updatePreferences,
        darkMode,
        setDarkMode,
        themePreference,
        setThemePreference,
        toggleDarkMode,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebarCollapsed,
        isEditTripModalOpen,
        setIsEditTripModalOpen,
        editingTrip,
        openEditTripModal,
        resetToSampleData,
        exportDataAsJson,
      }}
    >
      {children}
    </TravelStoreContext.Provider>
  );
};

export const useTravelStore = (): TravelStoreContextType => {
  const ctx = useContext(TravelStoreContext);
  if (!ctx) throw new Error('useTravelStore must be used within TravelStoreProvider');
  return ctx;
};
