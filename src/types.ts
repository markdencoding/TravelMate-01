export type TabType =
  | 'dashboard'
  | 'trips'
  | 'explore-map'
  | 'expenses'
  | 'calendar'
  | 'settings'
  | 'admin'
  | 'dossier'
  | 'auth';

export type TripStatus = 'planned' | 'ongoing' | 'completed';

export interface Trip {
  id: string;
  title: string;
  destinationRegion: string;
  country: string;
  dateRange: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  status: TripStatus;
  statusLabel?: string;
  seasonTag?: string;
  estimatedBudget: number;
  budget?: number;
  currency: string;
  budgetCap: number;
  actualSpent?: number;
  reconciled?: boolean;
  activitiesCount: number;
  accommodationsCount: number;
  waypointsCount?: number;
  trailSegmentsCount?: number;
  refugiosCount?: number;
  journalItemsCount?: number;
  distanceKm?: number;
  coverImage: string;
  coverImageAlt: string;
  routeLabel?: string;
  routeSummary?: string;
  isBookmarked?: boolean;
  notes?: string;
  description?: string;
  destinations?: string[];
  privacy?: 'collaborative' | 'private';
  collaborators?: string[];
}

export type ActivityCategory =
  | 'activities'
  | 'food'
  | 'transport'
  | 'lodging'
  | 'photo'
  | 'nature'
  | 'culture'
  | 'sightseeing'
  | 'dining'
  | 'leisure';

export interface ScheduledActivity {
  id: string;
  tripId: string;
  dayNumber: number;
  time: string;
  startTime?: string;
  endTime?: string;
  date?: string;
  title: string;
  location: string;
  category: ActivityCategory;
  duration: string;
  cost?: number;
  currency?: string;
  costText?: string;
  description?: string;
  notes?: string;
  confirmedRef?: string;
}

export type ExpenseCategory =
  | 'food'
  | 'activities'
  | 'transport'
  | 'lodging'
  | 'misc'
  | 'dining'
  | 'sightseeing';

export interface ExpenseItem {
  id: string;
  tripId: string;
  title: string;
  subtitle: string;
  category: ExpenseCategory;
  paymentStatus: string;
  costUsd: number;
  costJpy: number;
  amount?: number;
  dateStr: string;
  dayLabel: string;
  dayNumber: number;
  notes: string;
}

export interface ReminderItem {
  id: string;
  tripId: string;
  title: string;
  subtitle: string;
  completed: boolean;
}

export interface PlacePOI {
  id: string;
  numberTag: string;
  name: string;
  ward: string;
  category: 'attractions' | 'food' | 'nature' | 'culture';
  categoryLabel: string;
  rating: number;
  reviewCount: string;
  timing: string;
  image: string;
  imageAlt: string;
  isSaved?: boolean;
  pinnedInMap?: boolean;
  pinCoordinates: { xPercent: number; yPercent: number };
  weatherText?: string;
  tempC?: number;
  bestVisitTime?: string;
  description?: string;
}

export interface NotificationAlert {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  type: 'budget' | 'weather' | 'document' | 'waypoint' | 'completed';
  unread: boolean;
  group: 'today' | 'earlier';
  actionTarget?: TabType;
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  codeId: string;
  role: 'CURATOR / ADMIN' | 'EXPLORER' | 'ADMIN' | 'GUEST' | 'CURATOR' | 'admin' | 'editor' | 'viewer';
  status: 'ACTIVE' | 'DISABLED' | 'PENDING' | 'active' | 'disabled' | 'pending';
  tripsCount: number;
  lastActive: string;
  deviceInfo: string;
  avatarUrl?: string;
  avatar?: string;
  initials?: string;
  isSuperAdmin?: boolean;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  currency: 'USD' | 'EUR' | 'JPY' | 'GBP' | string;
  tempUnit?: 'C' | 'F';
  distUnit?: 'km' | 'mi';
  timeFormat?: '24' | '12';
  measurementUnits?: 'metric' | 'imperial';
  dateFormat?: string;
  notificationsEnabled?: boolean;
  offlineSync?: boolean;
  notifications?: {
    tripDeparture: boolean;
    budgetOverrun: boolean;
    weatherAdvisory: boolean;
    productUpdates: boolean;
  };
}

export interface CurrentUser {
  name: string;
  email: string;
  avatar: string;
  role: string;
}

export interface HourlyWeatherPoint {
  time: string;
  tempC: number;
  icon: string;
  condition: string;
}

export interface DailyWeatherForecast {
  date: string;
  dayName: string;
  dayLabel: string;
  condition: string;
  conditionDescription: string;
  icon: string;
  highC: number;
  lowC: number;
  precipitationPercent: number;
  humidity: number;
  windSpeedKmh: number;
  uvIndex: number;
  clothingTip: string;
  hourlyPreview: HourlyWeatherPoint[];
}

export interface DestinationWeatherResponse {
  destination: string;
  country: string;
  currentTempC: number;
  feelsLikeC: number;
  currentCondition: string;
  currentIcon: string;
  humidity: number;
  windKmh: number;
  uvIndex: number;
  airQuality: string;
  forecast: DailyWeatherForecast[];
  expeditionInsight: string;
  sunrise: string;
  sunset: string;
  lastUpdated: string;
}
