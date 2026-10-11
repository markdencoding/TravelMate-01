import React, { useState, useMemo } from 'react';
import { ExpenseItem, ExpenseCategory } from '../types';
import { useTravelStore } from '../store';
import { formatCurrency } from '@/lib/currencies';

interface ExpenseDonutChartProps {
  expenses: ExpenseItem[];
  selectedCategory?: 'all' | ExpenseCategory;
  onSelectCategory?: (category: 'all' | ExpenseCategory) => void;
  currency?: string;
  targetBudget?: number;
}

interface CategoryBreakdown {
  id: ExpenseCategory;
  name: string;
  color: string;
  darkColor?: string;
  bgPill: string;
  textPill: string;
  icon: string;
  amount: number;
  count: number;
  percentage: number;
  dashArray: string;
  dashOffset: number;
}

const CATEGORY_CONFIG: Record<
  string,
  { name: string; color: string; darkColor?: string; bgPill: string; textPill: string; icon: string }
> = {
  food: {
    name: 'Food & Dining',
    color: '#B4280C',
    darkColor: '#FB7185',
    bgPill: 'bg-rose-100 dark:bg-rose-950/40',
    textPill: 'text-rose-700 dark:text-rose-300',
    icon: 'restaurant',
  },
  dining: {
    name: 'Food & Dining',
    color: '#B4280C',
    darkColor: '#FB7185',
    bgPill: 'bg-rose-100 dark:bg-rose-950/40',
    textPill: 'text-rose-700 dark:text-rose-300',
    icon: 'restaurant',
  },
  transport: {
    name: 'Transport & Transit',
    color: '#0D9488',
    bgPill: 'bg-teal-100 dark:bg-teal-950/40',
    textPill: 'text-teal-700 dark:text-teal-300',
    icon: 'directions_subway',
  },
  lodging: {
    name: 'Accommodation',
    color: '#0284C7',
    bgPill: 'bg-sky-100 dark:bg-sky-950/40',
    textPill: 'text-sky-700 dark:text-sky-300',
    icon: 'hotel',
  },
  activities: {
    name: 'Activities & Shrines',
    color: '#7C3AED',
    bgPill: 'bg-purple-100 dark:bg-purple-950/40',
    textPill: 'text-purple-700 dark:text-purple-300',
    icon: 'museum',
  },
  sightseeing: {
    name: 'Activities & Shrines',
    color: '#7C3AED',
    bgPill: 'bg-purple-100 dark:bg-purple-950/40',
    textPill: 'text-purple-700 dark:text-purple-300',
    icon: 'museum',
  },
  misc: {
    name: 'Miscellaneous & Buffer',
    color: '#64748B',
    bgPill: 'bg-slate-100 dark:bg-slate-800',
    textPill: 'text-slate-700 dark:text-slate-300',
    icon: 'receipt_long',
  },
};

export type GroupCategory = 'food' | 'transport' | 'lodging' | 'activities' | 'misc';

const ORDERED_CATEGORIES: GroupCategory[] = [
  'food',
  'transport',
  'lodging',
  'activities',
  'misc',
];

export const ExpenseDonutChart: React.FC<ExpenseDonutChartProps> = ({
  expenses,
  selectedCategory = 'all',
  onSelectCategory,
  currency = 'USD',
  targetBudget,
}) => {
  const { darkMode } = useTravelStore();
  const [hoveredCategory, setHoveredCategory] = useState<ExpenseCategory | null>(null);

  const currSymbol = useMemo(() => {
    if (currency === 'JPY') return '¥';
    if (currency === 'EUR') return '€';
    if (currency === 'GBP') return '£';
    if (currency === 'CAD') return 'C$';
    if (currency === 'AUD') return 'A$';
    return '$';
  }, [currency]);

  // SVG dimensions & circle properties
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.761

  // Aggregate breakdown
  const { totalAmount, categoriesData } = useMemo(() => {
    type GroupCategory = 'food' | 'transport' | 'lodging' | 'activities' | 'misc';

    // Group totals
    const totals: Record<GroupCategory, { amount: number; count: number }> = {
      food: { amount: 0, count: 0 },
      transport: { amount: 0, count: 0 },
      lodging: { amount: 0, count: 0 },
      activities: { amount: 0, count: 0 },
      misc: { amount: 0, count: 0 },
    };

    let grandTotal = 0;

    expenses.forEach((item) => {
      // Normalize category
      let cat: GroupCategory = 'misc';
      if (item.category === 'dining' || item.category === 'food') cat = 'food';
      else if (item.category === 'transport') cat = 'transport';
      else if (item.category === 'lodging') cat = 'lodging';
      else if (item.category === 'activities' || item.category === 'sightseeing') cat = 'activities';
      else cat = 'misc';

      const val = item.costUsd || item.amount || 0;
      totals[cat].amount += val;
      totals[cat].count += 1;
      grandTotal += val;
    });

    // If grandTotal is 0 (empty expenses), provide baseline fallback
    const effectiveTotal = grandTotal > 0 ? grandTotal : 1;

    let cumulativeOffset = 0;

    const data: CategoryBreakdown[] = ORDERED_CATEGORIES.map((catKey) => {
      const cfg = CATEGORY_CONFIG[catKey];
      const amt = totals[catKey].amount;
      const cnt = totals[catKey].count;
      const pct = grandTotal > 0 ? (amt / grandTotal) * 100 : 0;

      // Arc length
      const arcLength = (pct / 100) * circumference;
      const dashArray = `${arcLength.toFixed(2)} ${(circumference - arcLength).toFixed(2)}`;
      const dashOffset = -cumulativeOffset;

      cumulativeOffset += arcLength;

      return {
        id: catKey,
        name: cfg.name,
        color: cfg.color,
        darkColor: cfg.darkColor,
        bgPill: cfg.bgPill,
        textPill: cfg.textPill,
        icon: cfg.icon,
        amount: amt,
        count: cnt,
        percentage: pct,
        dashArray,
        dashOffset,
      };
    });

    return { totalAmount: grandTotal, categoriesData: data };
  }, [expenses, circumference]);

  // Determine which category is active for the center text
  const activeInspection =
    hoveredCategory !== null
      ? categoriesData.find((c) => c.id === hoveredCategory)
      : selectedCategory !== 'all'
      ? categoriesData.find((c) => c.id === selectedCategory)
      : null;

  const handleCategoryClick = (catId: ExpenseCategory) => {
    if (!onSelectCategory) return;
    if (selectedCategory === catId) {
      onSelectCategory('all');
    } else {
      onSelectCategory(catId);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Chart Top Header & Selection status */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
        <div>
          <h2 className="font-section-title text-section-title text-on-surface font-bold">
            Category Spending Distribution
          </h2>
          <p className="font-caption text-caption text-on-surface-variant">
            Live interactive donut analysis of {expenses.length} tracked expenditures
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedCategory !== 'all' && (
            <button
              onClick={() => onSelectCategory && onSelectCategory('all')}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Filtered by: {selectedCategory.toUpperCase()}</span>
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
          <span className="font-badge text-badge px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-bold">
            5 SPENDING PILLARS
          </span>
        </div>
      </div>

      {/* SVG Donut Chart + Interactive Legend Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center py-2">
        {/* SVG Donut Circle Canvas */}
        <div className="sm:col-span-5 flex justify-center items-center relative py-2 select-none">
          <svg
            className="w-52 h-52 -rotate-90 transform drop-shadow-xs"
            viewBox="0 0 100 100"
          >
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="var(--color-surface-container, #e2e8f0)"
              strokeWidth="11"
            />

            {/* Empty state single ring if 0 expenses */}
            {totalAmount === 0 && (
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#cbd5e1"
                strokeWidth="11"
                strokeDasharray="238.76 0"
              />
            )}

            {/* Dynamic category arcs */}
            {totalAmount > 0 &&
              categoriesData.map((cat) => {
                if (cat.amount === 0) return null;
                const isHovered = hoveredCategory === cat.id;
                const isSelected = selectedCategory === cat.id;
                const isDimmed =
                  (hoveredCategory !== null && !isHovered) ||
                  (selectedCategory !== 'all' && !isSelected && hoveredCategory === null);

                return (
                  <circle
                    key={cat.id}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke={cat.color}
                    strokeWidth={isHovered || isSelected ? 14 : 11}
                    strokeDasharray={cat.dashArray}
                    strokeDashoffset={cat.dashOffset}
                    strokeLinecap="butt"
                    className={`transition-all duration-200 cursor-pointer ${
                      isDimmed ? 'opacity-35' : 'opacity-100'
                    }`}
                    onMouseEnter={() => setHoveredCategory(cat.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() => handleCategoryClick(cat.id)}
                  >
                    <title>
                      {cat.name}: {formatCurrency(cat.amount)} ({cat.percentage.toFixed(1)}%)
                    </title>
                  </circle>
                );
              })}
          </svg>

          {/* Center Callout Hub */}
          <div
            className="absolute flex flex-col items-center justify-center text-center p-3 pointer-events-none transition-all duration-150"
            style={{ width: '130px', height: '130px' }}
          >
            {activeInspection ? (
              <div className="animate-fade-in flex flex-col items-center">
                <span className="font-caption text-[11px] uppercase tracking-wider text-on-surface-variant font-bold truncate max-w-[120px]">
                  {activeInspection.name.split(' ')[0]}
                </span>
                <span
                  className="font-page-title text-base sm:text-lg font-black tracking-tight"
                  style={{
                    color:
                      darkMode && activeInspection.darkColor
                        ? activeInspection.darkColor
                        : activeInspection.color,
                  }}
                >
                  {formatCurrency(activeInspection.amount, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                </span>
                <span
                  className={`font-badge text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 ${activeInspection.bgPill} ${activeInspection.textPill}`}
                >
                  {activeInspection.percentage.toFixed(1)}% of total
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="font-caption text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                  Total Tracked
                </span>
                <span className="font-page-title text-base sm:text-lg text-on-surface font-extrabold tracking-tight">
                  {formatCurrency(totalAmount, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                </span>
                <span className="font-badge text-[10px] text-primary font-bold mt-0.5">
                  100% RECORDED
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Breakdown Legend */}
        <div className="sm:col-span-7 flex flex-col gap-2">
          {categoriesData.map((cat) => {
            const isHovered = hoveredCategory === cat.id;
            const isSelected = selectedCategory === cat.id;
            const isDimmed =
              (hoveredCategory !== null && !isHovered) ||
              (selectedCategory !== 'all' && !isSelected && hoveredCategory === null);

            return (
              <div
                key={cat.id}
                onMouseEnter={() => setHoveredCategory(cat.id)}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={() => handleCategoryClick(cat.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-surface-container border-primary ring-1 ring-primary/40 shadow-xs'
                    : isHovered
                    ? 'bg-surface-container-low border-surface-container-high'
                    : 'bg-surface-container-lowest border-surface-container-high/40 hover:bg-surface-container-low'
                } ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
              >
                {/* Left: Indicator dot, icon & name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="truncate">
                    <span className="font-body-medium text-xs sm:text-sm text-on-surface font-bold block truncate">
                      {cat.name}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      {cat.count} logged item{cat.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Right: Amount & % Badge */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="text-right">
                    <span className="font-mono text-xs sm:text-sm font-bold text-on-surface block">
                      {formatCurrency(cat.amount)}
                    </span>
                    {targetBudget && cat.amount > 0 && (
                      <span className="text-[10px] text-on-surface-variant block font-mono">
                        {((cat.amount / targetBudget) * 100).toFixed(1)}% of budget
                      </span>
                    )}
                  </div>

                  <span
                    className={`font-badge text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${cat.bgPill} ${cat.textPill}`}
                  >
                    {cat.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Interactive Tooltip / Guidance */}
      <div className="flex items-center justify-between text-[11px] text-on-surface-variant bg-surface-container-low px-3 py-2 rounded-xl border border-surface-container-high/30">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-primary">touch_app</span>
          <span>Tap any segment or legend row to filter the expense ledger below.</span>
        </div>
        {selectedCategory !== 'all' ? (
          <button
            onClick={() => onSelectCategory && onSelectCategory('all')}
            className="text-primary font-bold hover:underline cursor-pointer"
          >
            Clear Filter
          </button>
        ) : (
          <span className="font-mono">Showing all categories</span>
        )}
      </div>
    </div>
  );
};
