import React from 'react';

export const MobilePullToRefresh: React.FC<{
  onRefresh: () => Promise<void> | void;
  isRefreshing: boolean;
}> = ({ onRefresh, isRefreshing }) => {
  return (
    <div
      className={`w-full flex items-center justify-center py-2 transition-all duration-300 ${
        isRefreshing ? 'opacity-100 h-10' : 'opacity-0 h-0 overflow-hidden'
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800">
        <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
        <span>Updating itinerary data...</span>
      </div>
    </div>
  );
};
