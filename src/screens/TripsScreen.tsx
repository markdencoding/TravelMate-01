'use client';

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useTravelStore } from '../store';
import { Trip, TripStatus, TripDestination } from '../types';
import { formatCurrency } from '@/lib/currencies';
import { getAllUserDestinationsAction } from '@/app/actions/trips';
import { resolveTripDestinations } from '@/lib/destinations-helper';
import type { TripMapDestination } from '@/components/map/TripMap';

// Dynamic client-only Leaflet TripMap
const TripMap = dynamic(() => import('@/components/map/TripMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[540px] bg-surface-container flex flex-col items-center justify-center gap-2 text-on-surface-variant rounded-2xl border border-surface-container-high/60">
      <span className="material-symbols-outlined text-[36px] animate-spin text-primary">progress_activity</span>
      <span className="text-xs font-semibold">Loading all expeditions map...</span>
    </div>
  ),
});

interface TripsScreenProps {
  initialTrips?: Trip[];
}

export const TripsScreen: React.FC<TripsScreenProps> = ({ initialTrips }) => {
  const router = useRouter();
  const {
    trips,
    setTrips,
    setActiveTripId,
    openEditTripModal,
    toggleBookmarkTrip,
    setActiveTab,
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

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TripStatus>('all');
  const [sortBy, setSortBy] = useState('departure-soonest');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [selectedMapTripId, setSelectedMapTripId] = useState<string | null>(null);

  // Sync destinations across user's trips from database
  useEffect(() => {
    let isMounted = true;
    getAllUserDestinationsAction().then((res) => {
      if (!isMounted || !res.success || !res.data || res.data.length === 0) return;
      const grouped: Record<string, TripDestination[]> = {};
      res.data.forEach((d) => {
        if (!grouped[d.tripId]) grouped[d.tripId] = [];
        grouped[d.tripId].push(d);
      });

      setTrips((prevTrips) =>
        prevTrips.map((t) => {
          if (grouped[t.id] && (!t.destinationsData || t.destinationsData.length === 0)) {
            return { ...t, destinationsData: grouped[t.id] };
          }
          return t;
        })
      );
    });

    return () => {
      isMounted = false;
    };
  }, [setTrips]);

  // Filter & sort logic
  const filteredTrips = useMemo(() => {
    let result = [...trips];

    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.destinationRegion.toLowerCase().includes(q) ||
          t.country.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'departure-soonest') {
      result.sort((a, b) => a.startDate.localeCompare(b.startDate));
    } else if (sortBy === 'departure-latest') {
      result.sort((a, b) => b.startDate.localeCompare(a.startDate));
    } else if (sortBy === 'budget-high') {
      result.sort((a, b) => b.estimatedBudget - a.estimatedBudget);
    } else if (sortBy === 'duration') {
      result.sort((a, b) => b.daysCount - a.daysCount);
    }

    return result;
  }, [trips, statusFilter, searchQuery, sortBy]);

  const allFilteredDestinations = useMemo(() => {
    const list: TripMapDestination[] = [];
    filteredTrips.forEach((t) => {
      const tripDests = resolveTripDestinations(t);
      list.push(...tripDests);
    });
    return list;
  }, [filteredTrips]);

  const plannedCount = trips.filter((t) => t.status === 'planned').length;
  const ongoingCount = trips.filter((t) => t.status === 'ongoing').length;
  const completedCount = trips.filter((t) => t.status === 'completed').length;

  return (
    <div className="w-full flex flex-col gap-4 sm:gap-space-lg max-w-[1400px] mx-auto p-0 sm:px-space-md lg:px-space-lg py-1 sm:py-space-lg">
      {/* Breadcrumb and Top Utility Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-xs font-caption text-caption text-on-surface-variant">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              router.push('/dashboard');
            }}
            className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">home</span>
            <span>Home</span>
          </button>
          <span className="text-outline-variant font-caption">/</span>
          <span className="font-body-medium text-caption text-primary font-semibold">Trips</span>
        </div>

        {/* Sync Status */}
        <div className="flex items-center gap-space-sm self-start md:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-caption text-caption shadow-xs">
            <span className="w-2 h-2 rounded-full bg-surface-tint animate-pulse" />
            <span>All plans synchronized</span>
          </div>
          <span className="text-outline-variant font-caption hidden sm:inline">•</span>
          <div className="flex items-center gap-1 text-on-surface-variant font-caption text-caption hidden sm:flex">
            <span className="material-symbols-outlined text-[16px]">folder_special</span>
            <span>{trips.length} Active Expeditions</span>
          </div>
        </div>
      </div>

      {/* Screen Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
        <div className="max-w-2xl">
          <h1 className="font-page-title text-page-title text-on-surface tracking-tight font-bold">
            My Trips
          </h1>
          <p className="font-body text-body text-on-surface-variant mt-1">
            Organize, plan, and review all your past and upcoming adventures without commercial friction.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-space-sm w-full lg:w-auto">
          <button
            onClick={() => {
              setActiveTab('dossier');
              router.push('/dossier');
            }}
            className="flex-1 sm:flex-initial h-[40px] sm:h-[44px] px-3 sm:px-5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-button text-xs sm:text-button transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-xs cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">file_download</span>
            <span>Export Plans</span>
          </button>
          <button
            onClick={() => openEditTripModal()}
            className="flex-1 sm:flex-initial h-[40px] sm:h-[44px] px-3 sm:px-5 rounded-lg bg-secondary hover:bg-secondary-container text-on-secondary font-button text-xs sm:text-button transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-md hover:shadow-lg transform active:scale-95 cursor-pointer font-semibold"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">add</span>
            <span>Create New Trip</span>
          </button>
        </div>
      </div>

      {/* Comprehensive Planning Analytics Strip: 2-col on mobile, 4-col on lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-space-md w-full">
        <div className="w-full bg-surface-container-lowest p-3 sm:p-space-md rounded-2xl sm:rounded-xl shadow-xs sm:shadow-sm flex flex-col justify-between border border-surface-container-high/40">
          <div className="flex items-center justify-between text-on-surface-variant font-caption text-caption">
            <span className="font-badge uppercase tracking-wider text-badge font-bold">
              Scheduled Days
            </span>
            <span className="material-symbols-outlined text-primary text-[18px]">calendar_month</span>
          </div>
          <div className="mt-2">
            <span className="font-page-title text-page-title text-on-surface font-bold">
              {trips.reduce((acc, t) => acc + (t.daysCount || 0), 0)}
            </span>
            <span className="font-caption text-caption text-on-surface-variant ml-1">
              {trips.length > 0 ? `days across ${trips.length} ${trips.length === 1 ? 'trip' : 'trips'}` : 'days scheduled'}
            </span>
          </div>
        </div>

        <div className="w-full bg-surface-container-lowest p-3 sm:p-space-md rounded-2xl sm:rounded-xl shadow-xs sm:shadow-sm flex flex-col justify-between border border-surface-container-high/40">
          <div className="flex items-center justify-between text-on-surface-variant font-caption text-caption">
            <span className="font-badge uppercase tracking-wider text-badge font-bold">Active Log</span>
            <span className="material-symbols-outlined text-secondary text-[18px]">near_me</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1 truncate">
            {trips.length > 0 ? (
              <>
                <span className="font-page-title text-page-title text-secondary font-bold truncate">
                  {trips[0].destinationRegion || trips[0].title}
                </span>
                <span className="font-badge text-badge text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded-full font-bold shrink-0">
                  {trips[0].status?.toUpperCase() || 'PLANNED'}
                </span>
              </>
            ) : (
              <span className="font-caption text-caption text-on-surface-variant">
                No active expedition
              </span>
            )}
          </div>
        </div>

        <div className="w-full bg-surface-container-lowest p-3 sm:p-space-md rounded-2xl sm:rounded-xl shadow-xs sm:shadow-sm flex flex-col justify-between border border-surface-container-high/40">
          <div className="flex items-center justify-between text-on-surface-variant font-caption text-caption">
            <span className="font-badge uppercase tracking-wider text-badge font-bold">
              Planned Waypoints
            </span>
            <span className="material-symbols-outlined text-primary-container text-[18px]">pin_drop</span>
          </div>
          <div className="mt-2">
            <span className="font-page-title text-page-title text-on-surface font-bold">
              {trips.reduce((acc, t) => acc + (t.destinations?.length || (t.destinationRegion ? 1 : 0)), 0)}
            </span>
            <span className="font-caption text-caption text-on-surface-variant ml-1">
              curated locations
            </span>
          </div>
        </div>

        <div className="w-full bg-surface-container-lowest p-3 sm:p-space-md rounded-2xl sm:rounded-xl shadow-xs sm:shadow-sm flex flex-col justify-between border border-surface-container-high/40">
          <div className="flex items-center justify-between text-on-surface-variant font-caption text-caption">
            <span className="font-badge uppercase tracking-wider text-badge font-bold">
              Forecast Budget
            </span>
            <span className="material-symbols-outlined text-surface-tint text-[18px]">
              account_balance_wallet
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <span className="font-page-title text-page-title text-on-surface font-bold">
                {formatCurrency(trips.reduce((acc, t) => acc + (t.budget || t.estimatedBudget || 0), 0))}
              </span>
              <span className="font-caption text-caption text-on-surface-variant ml-1">total allocation</span>
            </div>
            <span className="bg-surface-container-low text-primary font-badge text-badge px-2 py-0.5 rounded-full font-bold">
              {trips.length > 0 ? 'Active' : '0% Target'}
            </span>
          </div>
        </div>
      </div>

      {/* Filtering, Status Tabs & Layout Controls */}
      <div className="bg-surface-container-lowest p-3.5 sm:p-space-md rounded-2xl sm:rounded-xl shadow-xs sm:shadow-sm flex flex-col gap-3 sm:gap-space-md border border-surface-container-high/40">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
          {/* Search Box */}
          <div className="relative flex-1 max-w-xl">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              className="w-full h-[44px] pl-11 pr-4 bg-surface rounded-lg font-body text-body text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary-container transition-all"
              id="tripsSearchInput"
              placeholder="Search trips by destination, country, or year..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Sorting & View Modes */}
          <div className="flex flex-wrap items-center gap-2 justify-between lg:justify-end w-full lg:w-auto">
            {/* Sort Control */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-surface px-2.5 sm:px-3 py-2 rounded-lg text-on-surface flex-1 sm:flex-initial min-w-0 max-w-full">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">sort</span>
              <label className="font-caption text-caption text-on-surface-variant hidden sm:inline shrink-0">
                Sort by:
              </label>
              <select
                className="bg-transparent font-body-medium text-xs sm:text-small text-on-surface focus:outline-none cursor-pointer truncate max-w-[170px] sm:max-w-none"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="departure-soonest">Departure (Soonest)</option>
                <option value="departure-latest">Departure (Latest)</option>
                <option value="budget-high">Budget (High to Low)</option>
                <option value="duration">Duration (Longest)</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-surface p-1 rounded-lg shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Grid View"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="List View"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">view_agenda</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-1.5 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Map View"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">map</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-surface-container-high/40 pt-2">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`h-[32px] px-3.5 rounded-full font-badge text-badge flex items-center gap-1.5 transition-all shadow-xs cursor-pointer font-bold ${
                statusFilter === 'all'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              <span>All Trips</span>
              <span className="px-1.5 py-0.2 rounded-full bg-primary-container text-primary-fixed text-[10px]">
                {trips.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('planned')}
              className={`h-[32px] px-3.5 rounded-full font-badge text-badge flex items-center gap-1.5 transition-all cursor-pointer font-bold ${
                statusFilter === 'planned'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              <span>Planned</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container-high text-on-surface-variant text-[10px]">
                {plannedCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ongoing')}
              className={`h-[32px] px-3.5 rounded-full font-badge text-badge flex items-center gap-1.5 transition-all cursor-pointer font-bold ${
                statusFilter === 'ongoing'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              <span>Ongoing</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container-high text-on-surface-variant text-[10px]">
                {ongoingCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`h-[32px] px-3.5 rounded-full font-badge text-badge flex items-center gap-1.5 transition-all cursor-pointer font-bold ${
                statusFilter === 'completed'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              <span>Completed</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container-high text-on-surface-variant text-[10px]">
                {completedCount}
              </span>
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-2 font-caption text-caption text-on-surface-variant">
            <span>Showing {filteredTrips.length} curated itineraries</span>
          </div>
        </div>
      </div>

      {/* Trips Grid / List / Map View */}
      {filteredTrips.length === 0 ? (
        <div className="bg-surface-container-lowest p-space-xl rounded-xl flex flex-col items-center justify-center text-center shadow-sm border border-surface-container-high/40 py-16 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-space-sm">
            <span className="material-symbols-outlined text-[32px]">travel_explore</span>
          </div>
          <h4 className="font-item-title text-item-title text-on-surface font-semibold text-lg">
            {searchQuery ? 'No trips matching search' : 'No trips planned yet'}
          </h4>
          <p className="font-body text-body text-on-surface-variant mt-1 max-w-sm">
            {searchQuery
              ? 'No itinerary records match your criteria. Clear applied filters or start a fresh expedition.'
              : 'Create your first expedition itinerary to begin planning destinations, budgets, and activities.'}
          </p>
          <div className="mt-space-md flex gap-space-sm">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="h-[36px] px-4 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-button text-caption transition-colors cursor-pointer font-semibold"
                type="button"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={() => openEditTripModal()}
              className="h-[36px] px-5 rounded-lg bg-secondary hover:bg-secondary-container text-on-secondary font-button text-caption shadow-sm cursor-pointer font-semibold flex items-center gap-1.5"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Create First Trip</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'map' ? (
        <div className="space-y-4 animate-fade-in">
          {/* Map Status Header & Legend */}
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container-high/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">pin_drop</span>
              <span className="font-item-title text-item-title text-on-surface font-bold">
                Expedition Waypoints Map
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-surface-container text-on-surface-variant font-mono">
                {allFilteredDestinations.length} pins across {filteredTrips.length} trips
              </span>
            </div>

            {/* Status Color Legend */}
            <div className="flex items-center gap-3 text-xs font-semibold text-on-surface-variant">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span>Planned</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                <span>Ongoing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                <span>Completed</span>
              </div>
            </div>
          </div>

          {/* Single Map showing all trips pins */}
          <div className="h-[580px] w-full rounded-2xl overflow-hidden shadow-sm border border-surface-container-high/60">
            <TripMap
              destinations={allFilteredDestinations}
              selectedDestinationId={selectedMapTripId}
              onSelectTrip={(tripId) => {
                setActiveTripId(tripId);
                router.push(`/trips/${tripId}`);
              }}
              onAddDestination={() => openEditTripModal()}
              showRouteLine={false}
              className="h-full w-full"
              emptyStateTitle="No destination pins for current filters"
              emptyStateDescription="Try adjusting status filters or adding waypoints to your expeditions."
            />
          </div>

          {/* Quick Trip Strip below the map */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {filteredTrips.map((trip) => {
              const tripDests = resolveTripDestinations(trip);
              const isSelected = selectedMapTripId === trip.id;
              return (
                <div
                  key={trip.id}
                  onClick={() => setSelectedMapTripId(trip.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-primary/5 border-primary shadow-xs ring-1 ring-primary/40'
                      : 'bg-surface-container-lowest border-surface-container-high/40 hover:border-primary/40 shadow-xs'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          trip.status === 'ongoing'
                            ? 'bg-secondary'
                            : trip.status === 'completed'
                            ? 'bg-slate-600'
                            : 'bg-primary'
                        }`}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant font-mono">
                        {trip.status}
                      </span>
                      <span className="text-outline-variant">•</span>
                      <span className="text-[11px] text-on-surface-variant">
                        {tripDests.length} waypoints
                      </span>
                    </div>
                    <h4 className="font-item-title text-sm text-on-surface font-bold truncate">
                      {trip.title}
                    </h4>
                    <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
                      {trip.country} • {trip.destinationRegion}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTripId(trip.id);
                      router.push(`/trips/${trip.id}`);
                    }}
                    className="h-8 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-button text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                  >
                    <span>Open</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg'
              : 'grid grid-cols-1 gap-space-md'
          }
        >
          {filteredTrips.map((trip) => (
          <article
            key={trip.id}
            className="bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group border border-surface-container-high/40"
          >
            {/* Media Header */}
            <div className="relative h-52 w-full overflow-hidden">
              {trip.coverImage ? (
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt={trip.coverImageAlt || trip.title}
                  src={trip.coverImage}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-container/80 via-surface-container-high to-surface-container relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-primary)_0%,_transparent_70%)] opacity-20" />
                  <span className="material-symbols-outlined text-[48px] text-primary/40 group-hover:scale-110 transition-transform duration-500">
                    explore
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-black/20" />

              {/* Cover Photo Credit Overlay */}
              {trip.coverImage && trip.coverImageCredit && (
                <div className="absolute bottom-2 right-2 max-w-[70%] z-10 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] text-white/90 truncate pointer-events-auto">
                  {trip.coverImageCreditUrl ? (
                    <a
                      href={trip.coverImageCreditUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="hover:underline"
                      title={trip.coverImageCredit}
                    >
                      {trip.coverImageCredit}
                    </a>
                  ) : (
                    <span>{trip.coverImageCredit}</span>
                  )}
                </div>
              )}

              {/* Status & Badge Overlays */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span
                  className={`px-2.5 py-0.5 rounded-full font-badge text-badge uppercase tracking-wider shadow-sm font-bold ${
                    trip.status === 'ongoing'
                      ? 'bg-secondary-container text-on-secondary flex items-center gap-1'
                      : trip.status === 'completed'
                      ? 'bg-surface-container-highest text-on-surface-variant'
                      : 'bg-primary-container text-primary-fixed'
                  }`}
                >
                  {trip.status === 'ongoing' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-on-secondary animate-ping" />
                  )}
                  {trip.status === 'ongoing'
                    ? 'Ongoing'
                    : trip.status === 'completed'
                    ? 'Completed'
                    : 'Planned'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-lowest/90 text-primary font-caption text-caption backdrop-blur-sm">
                  {trip.seasonTag || 'Expedition'}
                </span>
              </div>

              {/* Bookmark Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBookmarkTrip(trip.id);
                }}
                className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer ${
                  trip.isBookmarked
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-surface-container-lowest/80 hover:bg-surface-container-lowest text-on-surface'
                }`}
                title="Bookmark Trip"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">bookmark</span>
              </button>

              {/* Destination & Duration on Media */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-on-primary">
                <div className="flex items-center gap-1 font-caption text-caption drop-shadow-sm font-medium">
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                  <span>
                    {trip.country} • {trip.destinationRegion}
                  </span>
                </div>
                <span className="font-caption text-caption opacity-90 drop-shadow-sm">
                  {trip.daysCount} Days
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-space-md flex flex-col flex-1 justify-between gap-space-md">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3
                    onClick={() => {
                      setActiveTripId(trip.id);
                      setActiveTab('dossier');
                      router.push('/dossier');
                    }}
                    className="font-item-title text-item-title text-on-surface group-hover:text-primary transition-colors cursor-pointer font-semibold"
                  >
                    {trip.title}
                  </h3>
                  <button
                    onClick={() => openEditTripModal(trip)}
                    className="text-on-surface-variant hover:text-on-surface p-1 rounded cursor-pointer"
                    title="Edit trip"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </div>

                {/* Schedule & Duration */}
                <div className="flex items-center gap-2 mt-2 text-on-surface-variant font-caption text-caption">
                  <span className="material-symbols-outlined text-[16px] text-primary">date_range</span>
                  <span>{trip.dateRange}</span>
                  <span className="text-outline-variant">•</span>
                  <span>{trip.daysCount} Days</span>
                </div>

                {/* Budget Indicator */}
                <div className="mt-space-sm p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
                  <div>
                    <span className="font-caption text-caption text-on-surface-variant block">
                      {trip.status === 'completed' ? 'Actual Logged Spent' : 'Estimated Budget'}
                    </span>
                    <span className="font-body-medium text-body text-on-surface font-bold">
                      {formatCurrency(trip.estimatedBudget)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface-tint/15 text-primary font-badge text-badge font-bold shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-surface-tint shrink-0" />
                    <span className="truncate">{trip.status === 'completed' ? 'Reconciled' : 'Within Target'}</span>
                  </div>
                </div>

                {/* Summary Badges */}
                <div className="flex items-center gap-3 mt-3 font-caption text-caption text-on-surface-variant">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-surface-tint">
                      checklist
                    </span>
                    <span>{trip.activitiesCount} activities</span>
                  </div>
                  <span className="text-outline-variant">•</span>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-surface-tint">hotel</span>
                    <span>{trip.accommodationsCount} accommodations</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-space-xs flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveTripId(trip.id);
                    openEditTripModal(trip);
                  }}
                  className="flex-1 h-[40px] px-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-button text-caption flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
                  <span>Edit Itinerary</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTripId(trip.id);
                    setActiveTab('dossier');
                    router.push('/dossier');
                  }}
                  className="h-[40px] px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-button text-caption flex items-center justify-center transition-colors cursor-pointer"
                  title="View Full Trip Overview"
                  type="button"
                >
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedMapTripId(trip.id);
                    setViewMode('map');
                  }}
                  className="h-[40px] px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-button text-caption flex items-center justify-center transition-colors cursor-pointer"
                  title="Show trip on Map"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">map</span>
                </button>
              </div>
            </div>
          </article>
        ))}

        {/* Quick Draft Card */}
        <div
          onClick={() => openEditTripModal()}
          className="rounded-xl p-space-lg flex flex-col items-center justify-center text-center bg-surface-container-lowest/60 hover:bg-surface-container-lowest transition-all group cursor-pointer shadow-sm min-h-[360px] border border-dashed border-outline-variant hover:border-primary"
        >
          <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary transition-colors mb-space-sm shadow-xs">
            <span className="material-symbols-outlined text-[28px]">add_location_alt</span>
          </div>
          <h3 className="font-item-title text-item-title text-on-surface font-semibold">
            Plan Another Journey
          </h3>
          <p className="font-caption text-caption text-on-surface-variant mt-1 max-w-xs">
            Map dates, organize pins, pin stays, and manage estimates without spam or checkout flows.
          </p>
          <button
            onClick={() => openEditTripModal()}
            className="mt-space-md h-[38px] px-4 rounded-lg bg-secondary text-on-secondary font-button text-caption shadow-sm hover:bg-secondary-container transition-colors cursor-pointer font-semibold"
            type="button"
          >
            Start Drafting
          </button>
        </div>
      </div>
      )}

      {/* Interactive Map Explorer Overlay Banner */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col md:flex-row items-center justify-between gap-space-md border border-surface-container-high/40">
        <div className="flex items-center gap-space-md">
          <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">map</span>
          </div>
          <div>
            <h4 className="font-item-title text-item-title text-on-surface font-semibold">
              Geographic View Available
            </h4>
            <p className="font-body text-caption text-on-surface-variant">
              View all 38 itinerary waypoints rendered on an interactive global map projection.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setActiveTab('explore-map');
            router.push('/explore');
          }}
          className="w-full md:w-auto h-[40px] px-4 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-button text-caption flex items-center justify-center gap-2 transition-colors cursor-pointer"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">public</span>
          <span>Open World Map</span>
        </button>
      </div>
    </div>
  );
};
