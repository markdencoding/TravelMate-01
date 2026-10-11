'use client';

import React, { useState, useMemo } from 'react';
import { useTravelStore } from '../store';
import { ScheduledActivity, ActivityCategory } from '../types';
import { createActivityAction, deleteActivityAction } from '@/app/actions/activities';
import { formatCurrency } from '@/lib/currencies';

export const CalendarScreen: React.FC = () => {
  const {
    activeTrip,
    trips,
    setActiveTripId,
    activities,
    addActivity,
    deleteActivity,
    openEditTripModal,
  } = useTravelStore();

  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (activeTrip?.startDate) {
      const d = new Date(activeTrip.startDate);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCategory, setNewCategory] = useState<ActivityCategory>('sightseeing');
  const [newStartTime, setNewStartTime] = useState('09:00 AM');
  const [newEndTime, setNewEndTime] = useState('11:00 AM');
  const [newCost, setNewCost] = useState('0');
  const [newNotes, setNewNotes] = useState('');

  // Total trip days
  const totalDays = useMemo(() => {
    if (!activeTrip?.startDate || !activeTrip?.endDate) return 1;
    const s = new Date(activeTrip.startDate);
    const e = new Date(activeTrip.endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
    return Math.max(1, Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  }, [activeTrip]);

  const selectedDayDateStr = useMemo(() => {
    if (!activeTrip?.startDate) return `Day ${selectedDayNumber}`;
    const d = new Date(activeTrip.startDate);
    if (isNaN(d.getTime())) return `Day ${selectedDayNumber}`;
    d.setDate(d.getDate() + (selectedDayNumber - 1));
    return d.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' });
  }, [activeTrip, selectedDayNumber]);

  // Month navigation
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Filter activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (filterCategory !== 'all' && act.category !== filterCategory) return false;
      return true;
    });
  }, [activities, filterCategory]);

  const activitiesForSelectedDay = useMemo(() => {
    return filteredActivities.filter((act) => act.dayNumber === selectedDayNumber);
  }, [filteredActivities, selectedDayNumber]);

  // Dynamic calendar dates generation for currentDate
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      dateNumber: number;
      isCurrentMonth: boolean;
      isTripDay: boolean;
      tripDayNum?: number;
      hasConflict?: boolean;
      activityCount: number;
      isToday?: boolean;
    }> = [];

    // Preceding month days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        dateNumber: daysInPrevMonth - i,
        isCurrentMonth: false,
        isTripDay: false,
        activityCount: 0,
      });
    }

    const today = new Date();
    const isThisYearMonth = today.getFullYear() === year && today.getMonth() === month;

    // Parse active trip date range
    let tripStart: Date | null = null;
    let tripEnd: Date | null = null;
    if (activeTrip?.startDate && activeTrip?.endDate) {
      const s = new Date(activeTrip.startDate);
      const e = new Date(activeTrip.endDate);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        tripStart = new Date(s.getFullYear(), s.getMonth(), s.getDate());
        tripEnd = new Date(e.getFullYear(), e.getMonth(), e.getDate());
      }
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const thisDate = new Date(year, month, d);
      let isTrip = false;
      let tripDayNum: number | undefined = undefined;

      if (tripStart && tripEnd && thisDate >= tripStart && thisDate <= tripEnd) {
        isTrip = true;
        const diffMs = thisDate.getTime() - tripStart.getTime();
        tripDayNum = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
      }

      const dayActs = tripDayNum ? activities.filter((a) => a.dayNumber === tripDayNum) : [];

      days.push({
        dateNumber: d,
        isCurrentMonth: true,
        isTripDay: isTrip,
        tripDayNum: tripDayNum,
        hasConflict: false,
        activityCount: dayActs.length,
        isToday: isThisYearMonth && today.getDate() === d,
      });
    }

    // Trailing month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        dateNumber: i,
        isCurrentMonth: false,
        isTripDay: false,
        activityCount: 0,
      });
    }

    return days;
  }, [currentDate, activeTrip, activities]);

  const handlePrevMonth = () => {
    const prev = new Date(currentDate);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const parsedCost = parseFloat(newCost) || 0;
    const tripId = activeTrip?.id || 'kyoto-tokyo';

    addActivity({
      tripId,
      dayNumber: selectedDayNumber,
      time: newStartTime,
      startTime: newStartTime,
      endTime: newEndTime,
      duration: '2h',
      title: newTitle.trim(),
      location: newLocation.trim() || 'Kyoto City',
      category: newCategory,
      cost: parsedCost,
      currency: activeTrip?.currency || 'JPY',
      notes: newNotes.trim(),
    });

    setNewTitle('');
    setNewLocation('');
    setNewNotes('');
    setShowAddModal(false);

    try {
      await createActivityAction({
        tripId,
        dayNumber: selectedDayNumber,
        title: newTitle.trim(),
        location: newLocation.trim() || 'Kyoto City',
        category: newCategory,
        startTime: newStartTime,
        endTime: newEndTime,
        cost: parsedCost,
        notes: newNotes.trim(),
      });
    } catch (err) {
      console.warn('Backend sync fallback for activity creation:', err);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    deleteActivity(id);
    try {
      await deleteActivityAction(id);
    } catch (err) {
      console.warn('Backend sync fallback for activity deletion:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <span>Home</span>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span>Itinerary</span>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-primary font-semibold">Master Calendar</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
              Schedule & Timeline
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Synchronized calendar matrix with transit pacing, weather warnings, and schedule conflicts.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Active Trip Selector */}
          {trips.length > 0 && (
            <select
              value={activeTrip?.id || ''}
              onChange={(e) => setActiveTripId(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            >
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => {
              if (trips.length === 0) {
                openEditTripModal();
                return;
              }
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-sm shadow-primary/20 transition-all hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            {trips.length === 0 ? 'Create Trip' : 'Add Event'}
          </button>

          <button
            onClick={() => openEditTripModal()}
            className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors shadow-xs"
            title="Edit Trip Settings"
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
          </button>
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="bg-surface-container-lowest p-space-xl rounded-xl flex flex-col items-center justify-center text-center shadow-sm border border-surface-container-high/40 py-16 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-space-sm">
            <span className="material-symbols-outlined text-[32px]">calendar_month</span>
          </div>
          <h4 className="font-item-title text-item-title text-on-surface font-semibold text-lg">
            No expeditions scheduled
          </h4>
          <p className="font-body text-body text-on-surface-variant mt-1 max-w-sm">
            Create your first trip to view schedule timelines, pacing warnings, and daily itineraries on the calendar.
          </p>
          <button
            onClick={() => openEditTripModal()}
            className="mt-space-md h-[40px] px-5 rounded-lg bg-secondary hover:bg-secondary-container text-on-secondary font-button text-caption shadow-sm cursor-pointer font-semibold flex items-center gap-1.5"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>+ Create First Trip</span>
          </button>
        </div>
      ) : (
      /* Main Calendar Matrix and Sidebar Day Dossier Layout */
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Calendar View (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            {/* Month & Nav Buttons */}
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display min-w-[160px]">
                {monthName}
              </h2>
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 transition-all"
                  aria-label="Previous month"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                <button
                  onClick={() => setCurrentDate(new Date('2026-10-15'))}
                  className="px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all"
                >
                  Today
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 transition-all"
                  aria-label="Next month"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>

            {/* View Mode & Filters */}
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs font-medium">
                <span className="px-3 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold shadow-xs">
                  Month
                </span>
              </div>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="sightseeing">Sightseeing</option>
                <option value="food">Dining / Food</option>
                <option value="transport">Transport</option>
                <option value="lodging">Lodging</option>
                <option value="culture">Culture</option>
              </select>
            </div>
          </div>

          {/* Month Grid */}
          <div className="overflow-hidden">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 text-center border-b border-slate-100 dark:border-slate-800 pb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                <div
                  key={d}
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    i === 0 || i === 6 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Month Day Cells */}
            <div className="grid grid-cols-7 border-l border-t border-slate-100 dark:border-slate-800 mt-2">
              {calendarDays.map((cell, idx) => {
                const isSelected = cell.tripDayNum === selectedDayNumber;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (cell.tripDayNum) {
                        setSelectedDayNumber(cell.tripDayNum);
                      }
                    }}
                    className={`min-h-[85px] sm:min-h-[96px] p-1.5 border-r border-b border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-all cursor-pointer ${
                      !cell.isCurrentMonth
                        ? 'bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600'
                        : cell.isTripDay
                        ? isSelected
                          ? 'bg-primary/10 ring-2 ring-primary ring-inset z-10'
                          : 'bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {/* Top Row: Date Number and Badges */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          cell.isToday
                            ? 'bg-primary text-white shadow-xs'
                            : cell.isTripDay
                            ? 'text-primary font-extrabold'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {cell.dateNumber}
                      </span>

                      {cell.tripDayNum && (
                        <span
                          className={`text-[10px] font-semibold px-1 rounded uppercase tracking-wider ${
                            isSelected
                              ? 'bg-primary text-white'
                              : 'bg-primary/20 text-primary-dark dark:bg-primary/30 dark:text-primary-light'
                          }`}
                        >
                          D{cell.tripDayNum}
                        </span>
                      )}
                    </div>

                    {/* Middle: Activities Preview */}
                    <div className="space-y-1 my-1">
                      {cell.isTripDay && (
                        <>
                          {/* Desktop/Tablet text labels */}
                          <div className="hidden sm:block space-y-1">
                            {activities
                              .filter((a) => a.dayNumber === cell.tripDayNum)
                              .slice(0, 2)
                              .map((act) => (
                                <div
                                  key={act.id}
                                  className={`text-[10px] px-1 py-0.5 rounded truncate font-medium flex items-center gap-1 ${
                                    act.category === 'dining' || act.category === 'food'
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                      : act.category === 'transport'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                      : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                                  }`}
                                >
                                  <span className="w-1 h-1 rounded-full bg-current shrink-0" />
                                  <span className="truncate">{act.title}</span>
                                </div>
                              ))}

                            {cell.activityCount > 2 && (
                              <span className="text-[9px] text-slate-500 font-medium pl-1">
                                +{cell.activityCount - 2} more
                              </span>
                            )}
                          </div>

                          {/* Mobile dot indicator strip */}
                          <div className="flex sm:hidden items-center gap-1 flex-wrap pt-0.5">
                            {activities
                              .filter((a) => a.dayNumber === cell.tripDayNum)
                              .slice(0, 3)
                              .map((act) => (
                                <span
                                  key={act.id}
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    act.category === 'dining' || act.category === 'food'
                                      ? 'bg-amber-500'
                                      : act.category === 'transport'
                                      ? 'bg-blue-500'
                                      : 'bg-primary'
                                  }`}
                                />
                              ))}
                            {cell.activityCount > 3 && (
                              <span className="text-[8px] font-bold text-slate-400">
                                +{cell.activityCount - 3}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Bottom: Warning indicator if day has conflict */}
                    <div className="flex items-center justify-between min-h-[14px]">
                      {cell.hasConflict && (
                        <span
                          className="flex items-center gap-0.5 text-[9px] text-amber-600 font-semibold"
                          title="Schedule density high"
                        >
                          <span className="material-symbols-outlined text-[10px]">warning</span>
                          Conflict
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conflict Resolution Banner */}
          {activities.length >= 2 && activitiesForSelectedDay.length >= 2 && (
            <div className="bg-amber-50/80 border border-amber-200/70 rounded-xl p-3 flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0 mt-0.5">
                schedule
              </span>
              <div className="flex-1 text-xs text-amber-900">
                <span className="font-bold">Automated Pacing Insight:</span> Day {selectedDayNumber} has {activitiesForSelectedDay.length} planned activities. Consider allocating a transit buffer between stops.
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Day Dossier & Weather (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Active Day Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                  Day {selectedDayNumber} of {totalDays}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                  {selectedDayDateStr}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white rounded-lg text-slate-600 dark:text-slate-300 transition-colors text-xs font-semibold flex items-center gap-1"
                title="Add event to this day"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
              </button>
            </div>

            {/* Micro Weather Bar */}
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/40 border border-sky-100 dark:border-sky-800/50 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-sky-600 dark:text-sky-400 text-[26px]">wb_sunny</span>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Clear Skies • 21°C</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Humidity 48% • Light Breeze</div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md shadow-xs border border-sky-200/50 dark:border-sky-700/50">
                Ideal Walk
              </span>
            </div>

            {/* Chronological Day Schedule */}
            <div className="space-y-3 pt-1">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Planned Timeline ({activitiesForSelectedDay.length} items)
              </h4>

              {activitiesForSelectedDay.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                  <span className="material-symbols-outlined text-3xl mb-1 text-slate-300 dark:text-slate-600">
                    event_busy
                  </span>
                  <p>No activities scheduled for Day {selectedDayNumber}.</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-2 text-primary font-semibold hover:underline"
                  >
                    + Schedule an activity
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activitiesForSelectedDay.map((act) => (
                    <div
                      key={act.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/80 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700 rounded-xl transition-all group relative"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              act.category === 'dining' || act.category === 'food'
                                ? 'bg-amber-500'
                                : act.category === 'transport'
                                ? 'bg-blue-500'
                                : 'bg-primary'
                            }`}
                          />
                          <span>{act.title}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteActivity(act.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-0.5"
                          title="Delete activity"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px]">schedule</span>
                          {act.startTime || act.time} - {act.endTime || '12:00 PM'}
                        </span>
                        <span>•</span>
                        <span className="truncate flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px]">place</span>
                          {act.location}
                        </span>
                      </div>

                      {(act.notes || act.description) && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700 mt-2 font-mono">
                          {act.notes || act.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                        <span className="capitalize font-medium">{act.category}</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {formatCurrency(act.cost || 0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Transit Pacing Tips */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400 text-[20px]">
                directions_subway
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Transit Passes &amp; QR Tips
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Add transit legs and departure times to your itinerary to automatically monitor connection pacing and transfer buffers.
            </p>
          </div>
        </div>
      </div>
      )}

      {/* Add Activity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
                Schedule Activity for Day {selectedDayNumber}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Activity Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zen Meditation at Kennin-ji"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as ActivityCategory)
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
                  >
                    <option value="sightseeing">Sightseeing</option>
                    <option value="food">Dining / Food</option>
                    <option value="transport">Transport</option>
                    <option value="lodging">Lodging</option>
                    <option value="culture">Culture</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cost
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      value={newCost}
                      onChange={(e) => setNewCost(e.target.value)}
                      className="w-full px-3 py-2 pr-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
                    />
                    <span className="absolute right-2 px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[11px] font-bold select-none pointer-events-none">
                      {activeTrip?.currency || 'JPY'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. 584 Komatsucho, Higashiyama Ward"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Wear slip-on shoes, photography allowed in gardens only..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
