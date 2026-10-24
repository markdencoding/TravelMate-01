'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
import { createClient } from '@/lib/supabase/client';

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
  setTrips: React.Dispatch<React.SetStateAction<Trip[]>>;
  addTrip: (trip: Omit<Trip, 'id'> | Trip) => void;
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
  clearUserData: () => void;
  resetToSampleData: () => void;
  exportDataAsJson: () => void;
}

const THEME_STORAGE_KEY = 'travelmate_theme';
const SIDEBAR_STORAGE_KEY = 'travelmate_sidebar_collapsed';

const DEFAULT_CURRENT_USER: CurrentUser = {
  name: 'Traveler',
  email: '',
  avatar: '/avatars/fox-explorer.svg',
  role: 'Traveler',
};

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  currency: 'PHP',
  measurementUnits: 'metric',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '12',
  notificationsEnabled: true,
};

const EMPTY_TRIP: Trip = {
  id: '',
  title: 'No Trip Selected',
  destinationRegion: '',
  country: '',
  destinations: [],
  startDate: '',
  endDate: '',
  dateRange: '',
  status: 'planned',
  daysCount: 0,
  budget: 0,
  estimatedBudget: 0,
  budgetCap: 0,
  activitiesCount: 0,
  accommodationsCount: 0,
  currency: 'PHP',
  coverImage: '',
  coverImageAlt: '',
  coverImageCredit: '',
  coverImageCreditUrl: '',
  seasonTag: 'Trip',
  description: '',
  routeSummary: '',
  isBookmarked: false,
};

const TravelStoreContext = createContext<TravelStoreContextType | null>(null);

export const TravelStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [activeTripId, setActiveTripId] = useState<string>('');

  // Clean up legacy localStorage keys on startup
  useEffect(() => {
    try {
      const allowedKeys = new Set([
        THEME_STORAGE_KEY,
        SIDEBAR_STORAGE_KEY,
        'travelmate_last_activity',
        'travelmate_last_active_time',
      ]);
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('travelmate_') || key.startsWith('sb-zaloxunzttzhyvojhxnx')) && !allowedKeys.has(key)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {
      // ignore
    }
  }, []);

  // Theme preference: 'system' (default), 'light', or 'dark'
  const [themePreference, setThemePreferenceState] = useState<'system' | 'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'system' || saved === 'light' || saved === 'dark') {
        return saved;
      }
      return 'system';
    } catch {
      return 'system';
    }
  });

  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Synchronize initial dark mode state safely after client mount to prevent SSR hydration mismatch
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark') {
        setDarkMode(true);
      } else if (saved === 'light') {
        setDarkMode(false);
      } else if (typeof window !== 'undefined' && window.matchMedia) {
        setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
    } catch {}
  }, []);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Listen to system dark mode preference change
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

  const setThemePreference = (pref: 'system' | 'light' | 'dark') => {
    setThemePreferenceState(pref);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, pref);
    } catch (e) {
      console.warn('Theme preference storage failed', e);
    }

    if (pref === 'system') {
      const isSysDark =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(isSysDark);
    } else if (pref === 'dark') {
      setDarkMode(true);
    } else {
      setDarkMode(false);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarCollapsed));
    } catch (e) {
      console.warn('Sidebar storage sync failed', e);
    }
  }, [isSidebarCollapsed]);

  const toggleSidebarCollapsed = () => setIsSidebarCollapsed((prev) => !prev);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setThemePreference(nextDark ? 'dark' : 'light');
  };

  // Domain state starts clean (empty) for real Supabase usage
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activities, setActivities] = useState<ScheduledActivity[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [places, setPlaces] = useState<PlacePOI[]>([]);
  const [notifications, setNotifications] = useState<NotificationAlert[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser>(DEFAULT_CURRENT_USER);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  // Sync current user from real Supabase session & profiles on startup
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && isMounted) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url, role')
            .eq('id', user.id)
            .single();

          if (isMounted) {
            setCurrentUser({
              name:
                profile?.display_name ||
                (user.user_metadata?.full_name as string) ||
                (user.user_metadata?.name as string) ||
                user.email?.split('@')[0] ||
                'Traveler',
              email: user.email || '',
              avatar:
                profile?.avatar_url ||
                (user.user_metadata?.avatar_url as string) ||
                DEFAULT_CURRENT_USER.avatar,
              role: profile?.role === 'admin' ? 'Lead Curator' : 'Traveler',
            });
          }
        }
      } catch (err) {
        console.warn('Could not load user profile in store:', err);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const clearUserData = useCallback(() => {
    setTrips([]);
    setActivities([]);
    setExpenses([]);
    setReminders([]);
    setPlaces([]);
    setNotifications([]);
    setActiveTripId('');
    setCurrentUser(DEFAULT_CURRENT_USER);
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  // Listen to auth changes: clear cache/store when signed out or when active user changes
  useEffect(() => {
    let currentAuthUserId: string | null = null;
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId = session?.user?.id ?? null;
      if (event === 'SIGNED_OUT' || !session) {
        clearUserData();
        currentAuthUserId = null;
      } else if (newUserId && currentAuthUserId && newUserId !== currentAuthUserId) {
        clearUserData();
        currentAuthUserId = newUserId;
      } else if (newUserId) {
        currentAuthUserId = newUserId;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [clearUserData]);

  // Modal State
  const [isEditTripModalOpen, setIsEditTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  // Derived Active Trip guaranteed non-null
  const activeTrip: Trip =
    trips.find((t) => t.id === activeTripId) ||
    trips[0] ||
    EMPTY_TRIP;

  // Actions
  const addTrip = (tripData: Omit<Trip, 'id'> | Trip) => {
    const id = 'id' in tripData && tripData.id ? tripData.id : `trip-${Date.now()}`;
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
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTrip = (id: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
    if (activeTripId === id) {
      const remaining = trips.filter((t) => t.id !== id);
      if (remaining.length > 0) {
        setActiveTripId(remaining[0].id);
      } else {
        setActiveTripId('');
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

    const newActivity: ScheduledActivity = {
      id: `act-${Date.now()}`,
      tripId,
      dayNumber,
      time: '02:00 PM',
      startTime: '02:00 PM',
      endTime: '04:00 PM',
      title: place.name,
      location: place.ward || place.name,
      category: 'activities',
      duration: '2h',
      cost: 0,
      description: place.description || '',
      notes: place.description || '',
    };
    setActivities((prev) => [...prev, newActivity]);
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
      prev.map((u) => (u.id === id ? { ...u, status: u.status === 'ACTIVE' || u.status === 'active' ? 'DISABLED' : 'ACTIVE' } : u))
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
    setEditingTrip(trip || null);
    setIsEditTripModalOpen(true);
  };

  // Demo reset removed: domain state is derived exclusively from Supabase
  const resetToSampleData = () => {};

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
        setTrips,
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
        clearUserData,
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
