'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTravelStore } from '../store';
import { WeatherForecastWidget } from '../components/WeatherForecastWidget';
import { ActivitySwipeCard } from '../components/ActivitySwipeCard';

import { Trip } from '../types';
import { formatCurrency } from '@/lib/currencies';

interface DashboardScreenProps {
  initialTrips?: Trip[];
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ initialTrips }) => {
  const router = useRouter();
  const {
    trips,
    setTrips,
    activeTrip,
    activities,
    expenses,
    reminders,
    toggleReminder,
    openEditTripModal,
    setActiveTab,
    currentUser,
    deleteActivity,
  } = useTravelStore();

  React.useEffect(() => {
    if (initialTrips !== undefined && initialTrips.length > 0) {
      setTrips((prevTrips) => {
        const initialIds = new Set(initialTrips.map((t) => t.id));
        const newlyAdded = prevTrips.filter((t) => !initialIds.has(t.id));
        return [...newlyAdded, ...initialTrips];
      });
    }
  }, [initialTrips, setTrips]);

  const pendingRemindersCount = reminders.filter((r) => !r.completed).length;

  // Dynamic Metrics
  const activeCurrency = activeTrip?.currency || 'PHP';
  const totalBudget = activeTrip ? (activeTrip.budget || activeTrip.estimatedBudget || 0) : 0;
  const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const budgetRatio = totalBudget > 0 ? Math.min((totalExpenses / totalBudget) * 100, 100) : 0;
  const bufferAmount = Math.max(totalBudget - totalExpenses, 0);

  // Next trip calculation
  const nextTrip = trips[0] || null;
  const daysUntilNext = React.useMemo(() => {
    if (!nextTrip?.startDate) return 0;
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const start = new Date(nextTrip.startDate);
      start.setHours(0, 0, 0, 0);
      const diffTime = start.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch {
      return 0;
    }
  }, [nextTrip]);

  // Category breakdown for donut preview
  const categoryExpenses = React.useMemo(() => {
    const cats: Record<string, number> = {
      food: 0,
      activities: 0,
      lodging: 0,
      transport: 0,
    };
    expenses.forEach((e) => {
      const cat = e.category?.toLowerCase() || 'activities';
      if (cat in cats) {
        cats[cat] += e.amount || 0;
      } else {
        cats.activities += e.amount || 0;
      }
    });
    return cats;
  }, [expenses]);

  return (
    <div className="w-full flex flex-col gap-4 sm:gap-space-lg max-w-[1400px] mx-auto p-0 sm:px-space-md lg:px-space-lg py-1 sm:py-space-lg">
      {/* Top Bar / Breadcrumb & Actions Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-space-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-on-surface-variant font-caption text-caption">
            <span>Home</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="font-body-medium text-primary font-semibold">Dashboard</span>
          </div>
          <h1 className="font-display text-xl sm:text-2xl lg:text-display font-extrabold text-on-surface tracking-tight">
            Welcome back, {currentUser?.name?.split(' ')[0] || 'Traveler'}! ✨
          </h1>
          <p className="font-body text-xs sm:text-body text-on-surface-variant">
            {trips.length > 0
              ? `You have ${trips.length} upcoming ${trips.length === 1 ? 'trip' : 'trips'}. Here is your travel planning overview.`
              : 'Your travel planner is ready. Create your first trip to begin planning.'}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-space-sm w-full sm:w-auto">
          <button
            onClick={() => {
              setActiveTab('dossier');
              router.push('/dossier');
            }}
            className="flex-1 sm:flex-initial h-10 px-3 sm:px-space-md bg-surface-container-lowest hover:bg-surface-container-low text-primary font-button text-xs sm:text-button rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer border border-surface-container-high/60"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">picture_as_pdf</span>
            <span className="truncate">Export Itinerary</span>
          </button>
          <button
            onClick={() => openEditTripModal()}
            className="flex-1 sm:flex-initial h-10 px-3.5 sm:px-space-md bg-secondary hover:bg-secondary-container text-on-secondary font-button text-xs sm:text-button rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-95 font-bold"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">add</span>
            <span>New Trip</span>
          </button>
        </div>
      </div>

      {/* Key Stat Cards: Vertically stacked on mobile, 3-column grid on desktop/tablet */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-space-md w-full">
        {/* Stat 1: Upcoming Trips */}
        <div
          onClick={() => {
            setActiveTab('trips');
            router.push('/trips');
          }}
          className="w-full bg-surface-container-lowest rounded-2xl p-4 sm:p-space-md shadow-xs flex flex-col justify-between gap-space-sm relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer border border-surface-container-high/40"
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-semibold">
                Upcoming Trips
              </span>
              <span className="font-page-title text-page-title text-on-surface mt-1">
                {trips.length} Planned
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined text-[22px]">explore</span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs pt-space-xs">
            {nextTrip ? (
              <>
                <span className="bg-surface-container-high text-primary font-badge text-badge px-2 py-0.5 rounded-full font-bold truncate max-w-[200px]">
                  NEXT: {nextTrip.dateRange || nextTrip.startDate || 'UPCOMING'}
                </span>
                <span className="font-caption text-caption text-on-surface-variant truncate">
                  • {nextTrip.destinationRegion || nextTrip.title}
                </span>
              </>
            ) : (
              <span className="font-caption text-caption text-on-surface-variant">
                No trips scheduled yet
              </span>
            )}
          </div>
        </div>

        {/* Stat 2: Estimated Budget */}
        <div
          onClick={() => {
            setActiveTab('expenses');
            router.push('/expenses');
          }}
          className="w-full bg-surface-container-lowest rounded-2xl p-4 sm:p-space-md shadow-xs flex flex-col justify-between gap-space-sm relative group hover:shadow-md transition-shadow cursor-pointer border border-surface-container-high/40"
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-semibold">
                Estimated Budget Used
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-page-title text-page-title text-on-surface font-bold">
                  {formatCurrency(totalExpenses)}
                </span>
                <span className="font-body text-body text-on-surface-variant">
                  / {formatCurrency(totalBudget)}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary-container group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined text-[22px]">savings</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 pt-space-xs">
            <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
              <div
                className="h-full bg-primary-container rounded-full transition-all"
                style={{ width: `${budgetRatio}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="bg-surface-variant text-primary font-badge text-badge px-2 py-0.5 rounded-full font-bold">
                {totalBudget === 0 ? 'NO BUDGET SET' : budgetRatio >= 100 ? 'BUDGET REACHED' : 'WITHIN BUDGET'}
              </span>
              <span className="font-caption text-caption text-on-surface-variant font-medium">
                {formatCurrency(bufferAmount)} buffer
              </span>
            </div>
          </div>
        </div>

        {/* Stat 3: Days Until Next Trip */}
        <div
          onClick={() => {
            setActiveTab('calendar');
            router.push('/calendar');
          }}
          className="w-full bg-surface-container-lowest rounded-2xl p-4 sm:p-space-md shadow-xs flex flex-col justify-between gap-space-sm relative group hover:shadow-md transition-shadow cursor-pointer border border-surface-container-high/40"
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-semibold">
                Days Until Next Trip
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-page-title text-page-title text-secondary font-bold">
                  {daysUntilNext}
                </span>
                <span className="font-item-title text-item-title text-on-surface">Days to departure</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
              <span className="material-symbols-outlined text-[22px]">luggage</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-space-xs">
            {nextTrip ? (
              <>
                <div className="flex items-center gap-1.5 truncate">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
                  </span>
                  <span className="font-caption text-caption text-on-surface truncate">
                    Itinerary active
                  </span>
                </div>
                <span className="font-badge text-badge text-secondary font-bold tracking-wide uppercase truncate max-w-[140px]">
                  {nextTrip.destinations?.join(' / ') || nextTrip.destinationRegion || nextTrip.title}
                </span>
              </>
            ) : (
              <span className="font-caption text-caption text-on-surface-variant">
                No departures on calendar
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Featured "Next Trip" Card & Bento Section */}
      {trips.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-space-xl shadow-xs flex flex-col items-center justify-center text-center border border-surface-container-high/50 py-12 sm:py-16 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-space-sm">
            <span className="material-symbols-outlined text-[32px]">flight_takeoff</span>
          </div>
          <h3 className="font-item-title text-item-title text-on-surface font-semibold text-lg">
            No trips planned yet
          </h3>
          <p className="font-body text-body text-on-surface-variant mt-1 max-w-sm">
            Create your first expedition itinerary to begin planning destinations, budgets, and activities.
          </p>
          <button
            onClick={() => openEditTripModal()}
            className="mt-space-md h-[40px] px-5 rounded-xl bg-secondary hover:bg-secondary-container text-on-secondary font-button text-caption shadow-sm cursor-pointer font-semibold flex items-center gap-1.5"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Create First Trip</span>
          </button>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-space-lg shadow-xs flex flex-col gap-4 sm:gap-space-lg relative overflow-hidden border border-surface-container-high/50">
          {/* Header row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
            <div className="flex flex-col sm:flex-row sm:items-center gap-space-md">
              <div className="w-16 h-16 rounded-xl bg-surface-container shrink-0 overflow-hidden shadow-sm flex items-center justify-center">
                {activeTrip.coverImage ? (
                  <img
                    className="w-full h-full object-cover"
                    alt={activeTrip.title}
                    src={activeTrip.coverImage}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-container via-surface-container-high to-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px] text-primary/60">explore</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <span className="bg-primary-container text-on-primary font-badge text-badge px-2.5 py-0.5 rounded-full font-bold">
                    {activeTrip.status?.toUpperCase() || 'PLANNED'}
                  </span>
                  <span className="bg-surface-variant text-primary font-badge text-badge px-2.5 py-0.5 rounded-full font-bold">
                    {activeTrip.destinationRegion?.toUpperCase() || activeTrip.country?.toUpperCase() || 'EXPEDITION'}
                  </span>
                  <span className="font-caption text-caption text-on-surface-variant">
                    {activeTrip.dateRange || `${activeTrip.startDate} – ${activeTrip.endDate}`} ({activeTrip.daysCount || 1} Days)
                  </span>
                </div>
                <h2 className="font-page-title text-page-title text-on-surface">
                  {activeTrip.title}
                </h2>
                {activeTrip.coverImage && activeTrip.coverImageCredit && (
                  <div className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[13px] opacity-70">photo_camera</span>
                    <span>
                      {activeTrip.coverImageCreditUrl ? (
                        <a
                          href={activeTrip.coverImageCreditUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline text-primary"
                        >
                          {activeTrip.coverImageCredit}
                        </a>
                      ) : (
                        activeTrip.coverImageCredit
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-space-xs flex-wrap">
              <button
                onClick={() => {
                  setActiveTab('explore-map');
                  router.push('/explore');
                }}
                className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-button text-caption flex items-center gap-1 transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">map</span>
                <span>View Map Route</span>
              </button>
              <button
                onClick={() => openEditTripModal(activeTrip)}
                className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-button text-caption flex items-center gap-1 transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>Edit Trip</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('dossier');
                  router.push('/dossier');
                }}
                className="h-9 px-4 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-button text-caption flex items-center gap-1.5 transition-colors cursor-pointer"
                type="button"
              >
                <span>Open Full Itinerary</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* 5-Day Weather Forecast Component for Currently Selected Destination */}
          <WeatherForecastWidget
            onExploreRouteClick={() => {
              setActiveTab('explore-map');
              router.push('/explore');
            }}
          />

          {/* Middle Split: Route Thumbnail + Budget Indicator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
            {/* Route Map Preview */}
            <div
              onClick={() => {
                setActiveTab('explore-map');
                router.push('/explore');
              }}
              className="lg:col-span-6 rounded-xl relative overflow-hidden group min-h-[160px] flex flex-col justify-end p-space-md cursor-pointer shadow-xs"
              style={
                activeTrip.coverImage
                  ? {
                      backgroundImage: `url('${activeTrip.coverImage}')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              {!activeTrip.coverImage && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary-container/70 via-surface-container-high to-surface-container flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-primary)_0%,_transparent_70%)] opacity-25" />
                  <span className="material-symbols-outlined text-[56px] text-primary/30 group-hover:scale-105 transition-transform">
                    explore
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/90 via-inverse-surface/40 to-transparent group-hover:from-inverse-surface/95 transition-all" />
              <div className="relative z-10 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary-container" />
                  <span className="font-badge text-badge text-on-primary tracking-wide font-bold">
                    ROUTE ACTIVE
                  </span>
                </div>
                <h3 className="font-item-title text-item-title text-on-primary font-semibold">
                  {activeTrip.destinations?.join(' ➔ ') || activeTrip.destinationRegion || activeTrip.title}
                </h3>
                <p className="font-caption text-caption text-surface-dim">
                  {activeTrip.description || 'Active expedition itinerary'}
                </p>
              </div>
            </div>

            {/* Budget Multi-segment Rail */}
            <div
              onClick={() => {
                setActiveTab('expenses');
                router.push('/expenses');
              }}
              className="lg:col-span-6 bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between gap-space-md cursor-pointer hover:bg-surface-container transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    account_balance_wallet
                  </span>
                  <span className="font-item-title text-item-title text-on-surface font-semibold">
                    Budget Allocation
                  </span>
                </div>
                <span className="font-body-medium text-small text-primary font-semibold">
                  {formatCurrency(totalExpenses)} / {formatCurrency(totalBudget)}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="w-full h-3 rounded-full bg-surface-container flex overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: totalBudget > 0 ? `${Math.min((categoryExpenses.transport / totalBudget) * 100, 100)}%` : '0%',
                    }}
                    title={`Transport (${formatCurrency(categoryExpenses.transport)})`}
                  />
                  <div
                    className="h-full bg-secondary"
                    style={{
                      width: totalBudget > 0 ? `${Math.min((categoryExpenses.food / totalBudget) * 100, 100)}%` : '0%',
                    }}
                    title={`Food (${formatCurrency(categoryExpenses.food)})`}
                  />
                  <div
                    className="h-full bg-surface-tint"
                    style={{
                      width: totalBudget > 0 ? `${Math.min((categoryExpenses.activities / totalBudget) * 100, 100)}%` : '0%',
                    }}
                    title={`Activities (${formatCurrency(categoryExpenses.activities)})`}
                  />
                  <div
                    className="h-full bg-primary-container"
                    style={{
                      width: totalBudget > 0 ? `${Math.min((categoryExpenses.lodging / totalBudget) * 100, 100)}%` : '0%',
                    }}
                    title={`Accommodation (${formatCurrency(categoryExpenses.lodging)})`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-y-1 text-caption font-caption text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span>Transport: {formatCurrency(categoryExpenses.transport)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    <span>Food: {formatCurrency(categoryExpenses.food)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-surface-tint" />
                    <span>Activities: {formatCurrency(categoryExpenses.activities)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary-container" />
                    <span>Lodging: {formatCurrency(categoryExpenses.lodging)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="font-caption text-caption text-on-surface-variant">Allocated categories</span>
                <span className="font-badge text-badge text-primary-container font-bold">
                  {budgetRatio.toFixed(1)}% COMMITTED
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Chronological Upcoming Activities Timeline (7 cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-4 sm:p-space-lg shadow-xs flex flex-col gap-space-md border border-surface-container-high/40">
          <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high/40">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[22px]">schedule</span>
              <h3 className="font-section-title text-section-title text-on-surface">
                Upcoming Scheduled Activities
              </h3>
            </div>
            <span className="bg-surface-container text-on-surface font-badge text-badge px-2.5 py-1 rounded-full font-bold">
              {activities.length} TOTAL
            </span>
          </div>

          {activities.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center text-on-surface-variant text-caption gap-2">
              <span className="material-symbols-outlined text-[32px] text-outline">event_busy</span>
              <p>No activities scheduled yet.</p>
              {trips.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('calendar');
                    router.push('/calendar');
                  }}
                  className="text-primary font-semibold hover:underline cursor-pointer"
                >
                  + Add activity in calendar
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Full-width Activity Swipe Cards */}
              <div className="flex md:hidden flex-col gap-2">
                {activities.slice(0, 4).map((act) => {
                  const dotColor =
                    act.category === 'activities'
                      ? 'bg-[#7C3AED]'
                      : act.category === 'food'
                      ? 'bg-[#D97706]'
                      : 'bg-[#0284C7]';
                  const badgeStyle =
                    act.category === 'activities'
                      ? 'bg-purple-100 text-[#7C3AED] dark:bg-purple-950/60 dark:text-purple-300'
                      : act.category === 'food'
                      ? 'bg-amber-100 text-[#D97706] dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-sky-100 text-[#0284C7] dark:bg-sky-950/60 dark:text-sky-300';

                  return (
                    <ActivitySwipeCard
                      key={act.id}
                      id={act.id}
                      title={act.title}
                      time={act.time}
                      duration={act.duration}
                      location={act.location}
                      category={act.category}
                      badgeStyle={badgeStyle}
                      dotColor={dotColor}
                      onEdit={() => openEditTripModal(activeTrip)}
                      onDelete={() => deleteActivity(act.id)}
                    />
                  );
                })}
              </div>

              {/* Desktop Timeline */}
              <div className="hidden md:flex flex-col relative pl-4">
                <div className="absolute left-7 top-4 bottom-6 w-[2px] bg-surface-container" />

                {activities.slice(0, 3).map((act, index) => {
                  const dotColor =
                    act.category === 'activities'
                      ? 'bg-[#7C3AED]'
                      : act.category === 'food'
                      ? 'bg-[#D97706]'
                      : 'bg-[#0284C7]';
                  const badgeStyle =
                    act.category === 'activities'
                      ? 'bg-purple-100 text-[#7C3AED]'
                      : act.category === 'food'
                      ? 'bg-amber-100 text-[#D97706]'
                      : 'bg-sky-100 text-[#0284C7]';

                  return (
                    <div key={act.id || index} className="flex items-start gap-space-md py-space-sm relative group">
                      <div className="w-6 h-6 rounded-full bg-surface-container-lowest flex items-center justify-center shrink-0 z-10 shadow-sm mt-1">
                        <span className={`w-3 h-3 rounded-full ${dotColor}`} />
                      </div>
                      <div className="flex-1 bg-surface-container-low rounded-xl p-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm group-hover:bg-surface-container transition-colors shadow-xs">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className={`font-badge text-badge px-2 py-0.5 rounded-full font-bold uppercase ${badgeStyle}`}>
                              {act.category}
                            </span>
                            <span className="font-caption text-caption text-on-surface-variant font-medium">
                              {act.time}
                            </span>
                          </div>
                          <h4 className="font-item-title text-item-title text-on-surface mt-1 font-semibold">
                            {act.title}
                          </h4>
                          <div className="flex items-center gap-1 text-on-surface-variant font-caption text-caption">
                            <span className="material-symbols-outlined text-[16px]">location_on</span>
                            <span>{act.location}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-caption text-caption text-on-surface-variant bg-surface-container-lowest px-2.5 py-1 rounded-md shadow-xs">
                            {act.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Right Column: Reminders + Category Analytics (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-space-lg">
          {/* Travel Reminders Checklist */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-space-lg shadow-xs flex flex-col gap-space-md border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-[22px]">checklist</span>
                <h3 className="font-section-title text-section-title text-on-surface">Travel Reminders</h3>
              </div>
              <span className="font-caption text-caption text-on-surface-variant">
                {pendingRemindersCount} pending
              </span>
            </div>

            <div className="flex flex-col gap-space-sm" id="reminders-list">
              {reminders.length === 0 ? (
                <div className="py-4 text-center text-on-surface-variant text-caption">
                  No pending reminders
                </div>
              ) : (
                reminders.map((rem) => (
                  <label
                    key={rem.id}
                    className={`flex items-start gap-space-sm p-2.5 rounded-lg cursor-pointer transition-colors group ${
                      rem.completed ? 'hover:bg-surface-container-low' : 'bg-surface-container-low'
                    }`}
                  >
                    <input
                      checked={rem.completed}
                      onChange={() => toggleReminder(rem.id)}
                      className="mt-0.5 w-[18px] h-[18px] rounded border-outline-variant text-primary focus:ring-0 accent-primary cursor-pointer"
                      type="checkbox"
                    />
                    <div className="flex flex-col">
                      <span
                        className={`font-body-medium text-body text-on-surface ${
                          rem.completed ? 'line-through opacity-70 group-hover:opacity-90' : 'font-medium'
                        }`}
                      >
                        {rem.title}
                      </span>
                      <span className="font-caption text-caption text-on-surface-variant">
                        {rem.subtitle}
                      </span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Category Breakdown Chart Preview */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-space-lg shadow-xs flex flex-col gap-space-md border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[22px]">pie_chart</span>
                <h3 className="font-section-title text-section-title text-on-surface">
                  Expense Categories
                </h3>
              </div>
              <span className="font-caption text-caption text-on-surface-variant">Est. Distribution</span>
            </div>

            <div className="flex items-center justify-between gap-space-md">
              {/* SVG Donut */}
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-surface-container"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  {totalExpenses > 0 && (
                    <>
                      {/* Food */}
                      <path
                        className="text-secondary"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray={`${Math.round((categoryExpenses.food / totalExpenses) * 100)}, 100`}
                        strokeWidth="4"
                      />
                      {/* Activities */}
                      <path
                        className="text-primary-container"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray={`${Math.round((categoryExpenses.activities / totalExpenses) * 100)}, 100`}
                        strokeDashoffset={`-${Math.round((categoryExpenses.food / totalExpenses) * 100)}`}
                        strokeWidth="4"
                      />
                      {/* Transport */}
                      <path
                        className="text-primary"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray={`${Math.round((categoryExpenses.transport / totalExpenses) * 100)}, 100`}
                        strokeDashoffset={`-${Math.round(((categoryExpenses.food + categoryExpenses.activities) / totalExpenses) * 100)}`}
                        strokeWidth="4"
                      />
                      {/* Accommodation */}
                      <path
                        className="text-surface-variant"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray={`${Math.round((categoryExpenses.lodging / totalExpenses) * 100)}, 100`}
                        strokeDashoffset={`-${Math.round(((categoryExpenses.food + categoryExpenses.activities + categoryExpenses.transport) / totalExpenses) * 100)}`}
                        strokeWidth="4"
                      />
                    </>
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-page-title text-small text-on-surface font-bold">
                    {formatCurrency(totalExpenses, { maximumFractionDigits: 0 })}
                  </span>
                  <span className="font-caption text-[10px] text-on-surface-variant uppercase font-semibold">
                    Total
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex items-center justify-between text-caption">
                  <span className="flex items-center gap-1.5 text-on-surface font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary" /> Food
                  </span>
                  <span className="font-semibold text-on-surface">
                    {totalExpenses > 0 ? `${Math.round((categoryExpenses.food / totalExpenses) * 100)}%` : '0%'} ({formatCurrency(categoryExpenses.food)})
                  </span>
                </div>
                <div className="flex items-center justify-between text-caption">
                  <span className="flex items-center gap-1.5 text-on-surface font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-container" /> Activities
                  </span>
                  <span className="font-semibold text-on-surface">
                    {totalExpenses > 0 ? `${Math.round((categoryExpenses.activities / totalExpenses) * 100)}%` : '0%'} ({formatCurrency(categoryExpenses.activities)})
                  </span>
                </div>
                <div className="flex items-center justify-between text-caption">
                  <span className="flex items-center gap-1.5 text-on-surface font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-surface-variant" /> Lodging
                  </span>
                  <span className="font-semibold text-on-surface">
                    {totalExpenses > 0 ? `${Math.round((categoryExpenses.lodging / totalExpenses) * 100)}%` : '0%'} ({formatCurrency(categoryExpenses.lodging)})
                  </span>
                </div>
                <div className="flex items-center justify-between text-caption">
                  <span className="flex items-center gap-1.5 text-on-surface font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Transport
                  </span>
                  <span className="font-semibold text-on-surface">
                    {totalExpenses > 0 ? `${Math.round((categoryExpenses.transport / totalExpenses) * 100)}%` : '0%'} ({formatCurrency(categoryExpenses.transport)})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
