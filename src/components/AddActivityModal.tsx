'use client';

import React, { useState, useEffect } from 'react';
import { useTravelStore } from '@/store';
import { Trip, ActivityCategory, ScheduledActivity } from '@/types';
import { createActivityAction } from '@/app/actions/activities';
import { formatCurrency } from '@/lib/currencies';

export interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTripId?: string;
  initialTitle?: string;
  initialLocation?: string;
  initialCategory?: ActivityCategory;
  initialDayNumber?: number;
  initialStartTime?: string;
  initialEndTime?: string;
  initialCost?: number;
  initialNotes?: string;
  onSuccess?: (activity: ScheduledActivity) => void;
}

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  isOpen,
  onClose,
  initialTripId,
  initialTitle = '',
  initialLocation = '',
  initialCategory = 'sightseeing',
  initialDayNumber = 1,
  initialStartTime = '09:00 AM',
  initialEndTime = '11:00 AM',
  initialCost = 0,
  initialNotes = '',
  onSuccess,
}) => {
  const { trips, addActivity } = useTravelStore();

  const [selectedTripId, setSelectedTripId] = useState<string>(initialTripId || trips[0]?.id || '');
  const [dayNumber, setDayNumber] = useState<number>(initialDayNumber);
  const [title, setTitle] = useState(initialTitle);
  const [location, setLocation] = useState(initialLocation);
  const [category, setCategory] = useState<ActivityCategory>(initialCategory);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [cost, setCost] = useState(String(initialCost));
  const [notes, setNotes] = useState(initialNotes);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync initial props when opened
  useEffect(() => {
    if (isOpen) {
      if (initialTripId) setSelectedTripId(initialTripId);
      else if (trips.length > 0 && !selectedTripId) setSelectedTripId(trips[0].id);
      setTitle(initialTitle);
      setLocation(initialLocation);
      setCategory(initialCategory);
      setDayNumber(initialDayNumber);
      setStartTime(initialStartTime);
      setEndTime(initialEndTime);
      setCost(String(initialCost));
      setNotes(initialNotes);
      setError(null);
    }
  }, [
    isOpen,
    initialTripId,
    initialTitle,
    initialLocation,
    initialCategory,
    initialDayNumber,
    initialStartTime,
    initialEndTime,
    initialCost,
    initialNotes,
    trips,
    selectedTripId,
  ]);

  if (!isOpen) return null;

  const currentTrip = trips.find((t) => t.id === selectedTripId);

  // Calculate total days for the selected trip
  const totalDays = (() => {
    if (!currentTrip?.startDate || !currentTrip?.endDate) return 1;
    const s = new Date(currentTrip.startDate);
    const e = new Date(currentTrip.endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
    const diff = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(diff, 1);
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide an activity title.');
      return;
    }
    if (!selectedTripId) {
      setError('Please select a trip.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const parsedCost = parseFloat(cost) || 0;

    // Calculate specific day date if trip has start_date
    let dayDate: string | undefined = undefined;
    if (currentTrip?.startDate) {
      const d = new Date(currentTrip.startDate);
      d.setDate(d.getDate() + (dayNumber - 1));
      if (!isNaN(d.getTime())) {
        dayDate = d.toISOString().split('T')[0];
      }
    }

    try {
      const res = await createActivityAction({
        tripId: selectedTripId,
        dayNumber,
        date: dayDate,
        title: title.trim(),
        location: location.trim() || undefined,
        category,
        startTime: startTime.trim() || undefined,
        endTime: endTime.trim() || undefined,
        cost: parsedCost,
        notes: notes.trim() || undefined,
      });

      if (!res.success || !res.data) {
        setError(res.error || 'Failed to schedule activity. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Sync to client store
      addActivity(res.data);
      onSuccess?.(res.data);
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      console.error('Error creating activity:', err);
      setError(err?.message || 'Unexpected error creating activity.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-activity-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="min-w-0">
            <h3 id="add-activity-modal-title" className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display truncate">
              Add to Itinerary
            </h3>
            {currentTrip && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Trip: <span className="font-semibold text-primary">{currentTrip.title}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            type="button"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Trip Selector (if multiple trips) */}
          {trips.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Selected Trip
              </label>
              <select
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
              >
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Activity Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Activity Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Fushimi Inari-taisha Shrine"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Location / Address
            </label>
            <input
              type="text"
              placeholder="e.g. 68 Fukakusa Yabunouchicho, Fushimi Ward"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
            />
          </div>

          {/* Day & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Day Number
              </label>
              <select
                value={dayNumber}
                onChange={(e) => setDayNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
              >
                {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Day {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
              >
                <option value="sightseeing">Sightseeing</option>
                <option value="culture">Culture &amp; Heritage</option>
                <option value="food">Dining / Food</option>
                <option value="nature">Nature</option>
                <option value="leisure">Leisure</option>
                <option value="transport">Transport</option>
                <option value="lodging">Lodging</option>
              </select>
            </div>
          </div>

          {/* Time & Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Time
              </label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Time
              </label>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Estimated Cost (PHP)
            </label>
            <div className="relative flex items-center">
              <input
                type="number"
                min="0"
                step="any"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full px-3 py-2 pr-14 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
              />
              <span className="absolute right-2 px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold select-none pointer-events-none">
                PHP
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes / Booking info
            </label>
            <textarea
              rows={2}
              placeholder="Directions, tickets, tour guide notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[15px]">event_available</span>
                  <span>Save to Itinerary</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
