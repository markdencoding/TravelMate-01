import React, { useState } from 'react';
import { useTravelStore } from '../store';
import { BottomSheet } from './BottomSheet';

interface QuickActionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: 'trip' | 'activity' | 'expense') => void;
}

export const QuickActionsSheet: React.FC<QuickActionsSheetProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const { trips, activeTripId, setActiveTripId } = useTravelStore();
  const [showTripPickerFor, setShowTripPickerFor] = useState<'activity' | 'expense' | null>(null);

  const activeTrip = trips.find((t) => t.id === activeTripId);

  const handleTripPickerSelect = (tripId: string) => {
    setActiveTripId(tripId);
    const pendingAction = showTripPickerFor;
    setShowTripPickerFor(null);
    onClose();
    if (pendingAction) {
      onSelectAction(pendingAction);
    }
  };

  const handleActionClick = (action: 'trip' | 'activity' | 'expense') => {
    if (action === 'trip') {
      onClose();
      onSelectAction('trip');
      return;
    }

    // If active trip exists, execute directly. If not, open trip picker
    if (activeTrip) {
      onClose();
      onSelectAction(action);
    } else {
      setShowTripPickerFor(action);
    }
  };

  return (
    <>
      <BottomSheet
        isOpen={isOpen && !showTripPickerFor}
        onClose={onClose}
        title="Quick Actions"
        subtitle={activeTrip ? `Active Expedition: ${activeTrip.title}` : 'Choose an action to perform'}
      >
        <div className="flex flex-col gap-3 py-1">
          {/* Action 1: New Trip */}
          <button
            type="button"
            onClick={() => handleActionClick('trip')}
            className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 transition-all text-left group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[26px]">add_location_alt</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-display font-bold text-sm text-slate-900 dark:text-white">
                New Trip
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Plan and architect a new expedition from scratch
              </span>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-[20px]">chevron_right</span>
          </button>

          {/* Action 2: Add Activity */}
          <button
            type="button"
            onClick={() => handleActionClick('activity')}
            className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 transition-all text-left group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[26px]">local_activity</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  Add Activity
                </span>
                {!activeTrip && (
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-md font-semibold">
                    Pick trip
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Schedule a shrine visit, landmark, or dining milestone
              </span>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-[20px]">chevron_right</span>
          </button>

          {/* Action 3: Add Expense */}
          <button
            type="button"
            onClick={() => handleActionClick('expense')}
            className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 transition-all text-left group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[26px]">payments</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  Add Expense
                </span>
                {!activeTrip && (
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-md font-semibold">
                    Pick trip
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Log a receipt or budgeted cost in dual currencies
              </span>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-[20px]">chevron_right</span>
          </button>
        </div>
      </BottomSheet>

      {/* Trip Picker Bottom Sheet (if no active trip selected) */}
      <BottomSheet
        isOpen={Boolean(showTripPickerFor)}
        onClose={() => setShowTripPickerFor(null)}
        title="Select Active Expedition"
        subtitle={`Pick which trip to add this ${showTripPickerFor} to`}
      >
        <div className="flex flex-col gap-2 py-1">
          {trips.map((trip) => (
            <button
              key={trip.id}
              type="button"
              onClick={() => handleTripPickerSelect(trip.id)}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition-colors text-left cursor-pointer"
            >
              <img
                src={trip.coverImage}
                alt={trip.title}
                className="w-12 h-12 rounded-xl object-cover shrink-0"
              />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
                  {trip.title}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {trip.destinationRegion} • {trip.dateRange}
                </span>
              </div>
              <span className="material-symbols-outlined text-teal-600 dark:text-teal-400 text-[20px]">
                arrow_forward
              </span>
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
};
