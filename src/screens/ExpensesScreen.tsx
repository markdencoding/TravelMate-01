'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTravelStore } from '../store';
import { ExpenseCategory, ExpenseItem } from '../types';
import { ExpenseDonutChart } from '../components/ExpenseDonutChart';
import {
  CurrencyConverter,
  SUPPORTED_CURRENCIES,
  getTripDestinationCurrency,
  formatCurrencyAmount,
} from '../components/CurrencyConverter';
import { formatCurrency } from '@/lib/currencies';
import { createExpenseAction, deleteExpenseAction } from '@/app/actions/expenses';

export const ExpensesScreen: React.FC = () => {
  const {
    expenses,
    addExpense,
    deleteExpense,
    trips,
    activeTripId,
    setActiveTripId,
    setActiveTab,
    userPreferences,
    preferences,
    openEditTripModal,
  } = useTravelStore();

  const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'date-asc' | 'cost-desc' | 'cost-asc'>('date-asc');
  const [isTripDropdownOpen, setIsTripDropdownOpen] = useState(false);
  const [isConverterModalOpen, setIsConverterModalOpen] = useState(false);

  // Active trip details & single ledger currency
  const activeTrip = trips.find((t) => t.id === activeTripId) || trips[0] || null;
  const tripCurrency = activeTrip?.currency || 'USD';

  // User Home Currency and Local Destination Currency
  const homeCurrency = userPreferences?.currency || preferences?.currency || 'USD';
  const destinationCurrency = useMemo(() => getTripDestinationCurrency(activeTrip), [activeTrip]);

  // Live Exchange Rate (1 USD = X Destination Currency)
  const [liveExchangeRate, setLiveExchangeRate] = useState<number>(() => {
    return SUPPORTED_CURRENCIES[destinationCurrency]?.baseRateToUsd || 154.2;
  });

  // Sync default rate on destination currency change
  useEffect(() => {
    const defaultRate = SUPPORTED_CURRENCIES[destinationCurrency]?.baseRateToUsd || 1.0;
    setLiveExchangeRate(defaultRate);
  }, [destinationCurrency]);

  // Currency Display Mode: 'dual' (both side by side), 'home' (home currency only), 'destination' (local currency only)
  const [currencyDisplayMode, setCurrencyDisplayMode] = useState<'dual' | 'home' | 'destination'>('dual');

  // Quick Draft Form States
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('food');
  const [formDay, setFormDay] = useState('Day 1');
  const [formDayNumber, setFormDayNumber] = useState(1);
  const [formStatus, setFormStatus] = useState('Planned / Estimated');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculated Metrics
  const totalPlannedUsd = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + (curr.costUsd || curr.amount || 0), 0);
  }, [expenses]);

  const targetBudget = activeTrip ? (activeTrip.budget || activeTrip.estimatedBudget || 0) : 0;
  const variance = targetBudget - totalPlannedUsd;
  const isOverBudget = targetBudget > 0 && variance < 0;

  // Filter & Sort expenses
  const filteredExpenses = useMemo(() => {
    let list = [...expenses];
    if (categoryFilter !== 'all') {
      list = list.filter((e) => e.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q) || e.notes.toLowerCase().includes(q));
    }
    if (sortOption === 'cost-desc') {
      list.sort((a, b) => b.costUsd - a.costUsd);
    } else if (sortOption === 'cost-asc') {
      list.sort((a, b) => a.costUsd - b.costUsd);
    } else {
      list.sort((a, b) => a.dayNumber - b.dayNumber);
    }
    return list;
  }, [expenses, categoryFilter, searchQuery, sortOption]);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    setIsSubmitting(true);
    const amountVal = parseFloat(formAmount) || 85.0;

    // Standardize to trip currency and compute USD / JPY equivalents for reporting
    const currInfo = SUPPORTED_CURRENCIES[tripCurrency] || SUPPORTED_CURRENCIES.USD;
    let costUsd = amountVal;
    if (tripCurrency === 'USD') {
      costUsd = amountVal;
    } else {
      costUsd = Number((amountVal / (currInfo.baseRateToUsd || 1.0)).toFixed(2));
    }
    const costJpy = Math.round(costUsd * (SUPPORTED_CURRENCIES.JPY?.baseRateToUsd || 154.2));

    setTimeout(async () => {
      addExpense({
        tripId: activeTripId,
        title: formTitle,
        subtitle: `${formCategory.toUpperCase()} milestone`,
        category: formCategory,
        paymentStatus: formStatus,
        costUsd,
        costJpy,
        amount: amountVal,
        dateStr: `Nov ${11 + formDayNumber}`,
        dayLabel: `Day ${formDayNumber}`,
        dayNumber: formDayNumber,
        notes: formNotes,
      });

      try {
        await createExpenseAction({
          tripId: activeTripId,
          title: formTitle,
          category: formCategory,
          paymentStatus: formStatus,
          amount: amountVal,
          dayNumber: formDayNumber,
          notes: formNotes,
        });
      } catch (err) {
        console.warn('Backend sync fallback for expense:', err);
      }

      setFormTitle('');
      setFormAmount('85.00');
      setIsSubmitting(false);
    }, 300);
  };

  const handleDeleteExpense = async (id: string) => {
    deleteExpense(id);
    try {
      await deleteExpenseAction(id);
    } catch (err) {
      console.warn('Backend sync fallback for expense deletion:', err);
    }
  };

  const exportExpensesCsv = () => {
    const headers = ['Date', 'Day', 'Category', 'Title', 'Cost (USD)', 'Status', 'Notes'];
    const rows = filteredExpenses.map((exp) => [
      exp.dateStr || '',
      exp.dayLabel || `Day ${exp.dayNumber}`,
      exp.category || '',
      `"${(exp.title || '').replace(/"/g, '""')}"`,
      exp.costUsd.toFixed(2),
      exp.paymentStatus || '',
      `"${(exp.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `travelmate-expenses-${activeTrip?.id || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleEditExpense = (exp: ExpenseItem) => {
    setFormTitle(exp.title);
    setFormAmount(exp.costUsd.toFixed(2));
    setFormCategory(exp.category);
    setFormDayNumber(exp.dayNumber);
    setFormDay(`Day ${exp.dayNumber}`);
    setFormNotes(exp.notes || '');
    const panel = document.getElementById('addExpensePanel');
    if (panel) panel.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full flex flex-col gap-space-lg max-w-[1440px] mx-auto px-space-md lg:px-space-xl py-space-md">
      {/* Breadcrumb & Top Bar */}
      <div className="flex flex-col gap-space-xs">
        <nav className="flex items-center gap-2 font-caption text-caption text-on-surface-variant">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="hover:text-primary transition-colors cursor-pointer"
            type="button"
          >
            Home
          </button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <button
            onClick={() => setActiveTab('trips')}
            className="hover:text-primary transition-colors cursor-pointer"
            type="button"
          >
            Trips
          </button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-body-medium font-semibold">{activeTrip?.title || 'All Trips'}</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-on-surface font-semibold">Expenses</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pt-space-xs">
          <div className="flex flex-col gap-1">
            <h1 className="font-page-title text-page-title text-on-surface tracking-tight font-bold">
              Trip Expenses &amp; Budget Tracker
            </h1>

            {/* Trip Selector Dropdown */}
            <div className="relative inline-block mt-0.5">
              <button
                type="button"
                onClick={() => setIsTripDropdownOpen(!isTripDropdownOpen)}
                className="flex items-center gap-2 bg-surface-container-lowest hover:bg-surface-container-low px-3 py-1.5 rounded-lg shadow-sm text-left transition-colors cursor-pointer border border-surface-container-high/60"
              >
                <span className="material-symbols-outlined text-secondary text-[18px]">calendar_today</span>
                <span className="font-body-medium text-body text-on-surface font-semibold">
                  {activeTrip ? `${activeTrip.title} (${activeTrip.dateRange})` : 'No Active Trip Selected'}
                </span>
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                  expand_more
                </span>
              </button>

              {isTripDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-80 bg-surface-container-lowest rounded-xl shadow-xl z-50 p-2 flex flex-col gap-1 border border-surface-container-high">
                  <div className="px-3 py-1.5 text-caption font-caption text-on-surface-variant uppercase tracking-wider font-bold">
                    Switch Itinerary
                  </div>
                  {trips.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setActiveTripId(t.id);
                        setIsTripDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                        t.id === activeTripId
                          ? 'bg-surface-container-low text-primary font-semibold'
                          : 'hover:bg-surface-container-low text-on-surface'
                      }`}
                    >
                      <div>
                        <div className="font-body-medium text-body">{t.title}</div>
                        <div className="font-caption text-caption text-on-surface-variant">
                          {t.dateRange} • {t.status}
                        </div>
                      </div>
                      {t.id === activeTripId && (
                        <span className="material-symbols-outlined text-primary text-[18px]">check</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Standard System Currency: Philippine Peso */}
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-primary">payments</span>
                <span>Ledger Currency:</span>
              </span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-lowest border border-surface-container-high/80 rounded-lg text-xs font-bold text-on-surface shadow-2xs">
                <span>🇵🇭</span>
                <span>Philippine Peso (PHP, ₱)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsConverterModalOpen(true)}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer ml-1"
              >
                <span className="material-symbols-outlined text-[14px]">currency_exchange</span>
                <span>Open Currency Converter</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-space-sm self-start md:self-auto flex-wrap">
            <button
              onClick={() => {
                const el = document.getElementById('currencyConverterHub');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="h-[44px] px-3.5 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface font-button text-button rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer border border-surface-container-high/60"
              type="button"
              title="Open Currency Converter"
            >
              <span className="material-symbols-outlined text-primary text-[18px]">payments</span>
              <span className="font-semibold">FX Converter</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                {destinationCurrency} ⇄ {homeCurrency}
              </span>
            </button>
            <button
              onClick={exportExpensesCsv}
              className="h-[44px] px-4 bg-surface-container-lowest hover:bg-surface-container-low text-primary font-button text-button rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer border border-surface-container-high/60"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">file_download</span>
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => {
                if (trips.length === 0) {
                  openEditTripModal();
                  return;
                }
                const el = document.getElementById('addExpensePanel');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="h-[44px] px-5 bg-secondary hover:bg-secondary-container text-on-secondary font-button text-button rounded-lg shadow-[0_2px_8px_-2px_rgba(180,40,12,0.35)] flex items-center gap-2 transition-transform active:scale-95 cursor-pointer font-semibold"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Add Expense</span>
            </button>
          </div>
        </div>
      </div>


      {trips.length === 0 ? (
        <div className="bg-surface-container-lowest p-space-xl rounded-xl flex flex-col items-center justify-center text-center shadow-sm border border-surface-container-high/40 py-16 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-space-sm">
            <span className="material-symbols-outlined text-[32px]">account_balance_wallet</span>
          </div>
          <h4 className="font-item-title text-item-title text-on-surface font-semibold text-lg">
            No trips created yet
          </h4>
          <p className="font-body text-body text-on-surface-variant mt-1 max-w-sm">
            Create an expedition first to begin tracking expenses, category budgets, and multi-currency conversions.
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
        <>
          {/* Top Metrics Row: Sticky summary card at the top on mobile */}
          <div className="flex flex-col gap-space-md sticky top-14 md:static z-20 bg-white/95 dark:bg-slate-900/95 md:bg-transparent backdrop-blur-md md:backdrop-blur-none -mx-4 px-4 md:mx-0 md:px-0 py-2 md:py-0 border-b md:border-b-0 border-slate-200/80 dark:border-slate-800 transition-colors">
            <div className="flex md:grid md:grid-cols-3 gap-space-md overflow-x-auto md:overflow-x-visible snap-x snap-mandatory no-scrollbar pb-1 md:pb-0">
          {/* Metric Card 1: Budget Target */}
          <div className="min-w-[85%] sm:min-w-[280px] md:min-w-0 snap-start shrink-0 md:shrink bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-bold">
                Total Target Budget
              </span>
              <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="font-display text-display text-on-surface tracking-tight font-bold">
                {formatCurrency(targetBudget)}
              </div>
              <div className="flex items-center gap-1.5 mt-1 font-caption text-caption text-on-surface-variant flex-wrap">
                <span>Allocated for {activeTrip?.daysCount || 1} days</span>
                <span>•</span>
                <span className="font-semibold text-primary">
                  ~{formatCurrency(Math.round(targetBudget / (activeTrip?.daysCount || 1)))}/day target
                </span>
              </div>
            </div>
            <div className="w-full bg-surface-container-high h-1 rounded-full mt-3 overflow-hidden">
              <div className="bg-primary h-full rounded-full w-full" />
            </div>
          </div>

          {/* Metric Card 2: Estimated Spent */}
          <div className="min-w-[85%] sm:min-w-[280px] md:min-w-0 snap-start shrink-0 md:shrink bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-bold">
                Calculated Planned Total
              </span>
              <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="font-display text-display text-on-surface tracking-tight font-bold">
                {formatCurrency(totalPlannedUsd)}
              </div>
              <div className="flex items-center gap-1.5 mt-1 font-caption text-caption text-on-surface-variant flex-wrap">
                <span className="text-secondary font-medium">
                  {targetBudget > 0 ? ((totalPlannedUsd / targetBudget) * 100).toFixed(1) : '0'}% of budget
                </span>
                <span>•</span>
                <span>{expenses.length} tracked expenditures</span>
              </div>
            </div>
            <div className="w-full bg-surface-container-high h-1 rounded-full mt-3 overflow-hidden">
              <div className="bg-secondary-container h-full rounded-full w-full" />
            </div>
          </div>

          {/* Metric Card 3: Budget Variance Card */}
          <div
            className={`min-w-[85%] sm:min-w-[280px] md:min-w-0 snap-start shrink-0 md:shrink rounded-xl p-space-md shadow-sm flex flex-col justify-between border ${
              isOverBudget
                ? 'bg-error-container text-on-error-container border-error/20'
                : 'bg-surface-container-lowest text-on-surface border-surface-container-high/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`font-caption text-caption uppercase tracking-wider font-bold flex items-center gap-1 ${
                  isOverBudget ? 'text-on-error-container' : 'text-on-surface-variant'
                }`}
              >
                <span className={`material-symbols-outlined text-[16px] ${isOverBudget ? 'text-error' : 'text-primary'}`}>
                  {isOverBudget ? 'warning' : 'verified'}
                </span>
                Budget Variance
              </span>
              <span
                className={`font-badge text-badge px-2 py-0.5 rounded-full uppercase font-bold ${
                  isOverBudget ? 'bg-error text-on-error' : 'bg-surface-container-high text-primary'
                }`}
              >
                {isOverBudget ? 'Alert' : 'On Track'}
              </span>
            </div>
            <div className="mt-2">
              <div
                className={`font-display text-display font-bold tracking-tight ${
                  isOverBudget ? 'text-error' : 'text-primary'
                }`}
              >
                {isOverBudget ? '-' : '+'}
                {formatCurrency(Math.abs(variance))}
              </div>
              <div className="font-caption text-caption text-on-surface-variant font-medium mt-1 leading-snug">
                {isOverBudget ? (
                  <>
                    Notice: Expenses exceed budget target by{' '}
                    {targetBudget > 0 ? Math.abs((variance / targetBudget) * 100).toFixed(1) : '0.0'}%
                  </>
                ) : (
                  <>
                    Buffer remaining:{' '}
                    {targetBudget > 0 ? ((variance / targetBudget) * 100).toFixed(1) : '100.0'}% of planned target
                  </>
                )}
              </div>
            </div>
            <div className={`mt-2 text-[11px] font-semibold flex items-center gap-1 ${isOverBudget ? 'text-error' : 'text-primary'}`}>
              <span className="material-symbols-outlined text-[14px]">
                {isOverBudget ? 'trending_up' : 'check_circle'}
              </span>
              <span>{isOverBudget ? 'Needs reallocation before departure' : 'Disciplined spending allocation'}</span>
            </div>
          </div>
        </div>

        {/* Segmented Multi-Category Progress Rail */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs border border-surface-container-high/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-item-title text-item-title text-on-surface font-semibold">
                Budget Allocation Stream
              </span>
              <span className="font-caption text-caption text-on-surface-variant">
                ({formatCurrency(targetBudget)} Baseline Cap)
              </span>
            </div>
            <div className="flex items-center gap-3 font-caption text-caption flex-wrap">
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary" /> Food {formatCurrency(expenses.filter(e => e.category === 'food' || e.category === 'dining').reduce((s, e) => s + (e.amount || e.costUsd || 0), 0), { maximumFractionDigits: 0 })}
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" /> Activities {formatCurrency(expenses.filter(e => e.category === 'activities' || e.category === 'sightseeing').reduce((s, e) => s + (e.amount || e.costUsd || 0), 0), { maximumFractionDigits: 0 })}
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-container" /> Transit {formatCurrency(expenses.filter(e => e.category === 'transport').reduce((s, e) => s + (e.amount || e.costUsd || 0), 0), { maximumFractionDigits: 0 })}
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-inverse-primary" /> Lodging {formatCurrency(expenses.filter(e => e.category === 'lodging').reduce((s, e) => s + (e.amount || e.costUsd || 0), 0), { maximumFractionDigits: 0 })}
              </span>
              {isOverBudget && (
                <span className="flex items-center gap-1 font-semibold text-error">
                  <span className="w-2.5 h-2.5 rounded-full bg-error" /> Over-budget +{formatCurrency(Math.abs(variance), { maximumFractionDigits: 0 })}
                </span>
              )}
            </div>
          </div>

          <div className="relative w-full pt-4 pb-2">
            {/* 100% Target Limit Marker Indicator */}
            <div className="absolute top-0 bottom-0 left-[94.95%] flex flex-col items-center z-20 pointer-events-none">
              <span className="font-badge text-[10px] font-bold text-on-surface-variant bg-surface-container px-1 rounded-sm shadow-xs mb-0.5">
                TARGET LIMIT
              </span>
              <div className="w-0.5 h-full bg-on-surface" />
            </div>

            {/* Multi-Segment Bar */}
            <div className="h-4 w-full bg-surface-container rounded-full flex overflow-hidden p-0.5 relative shadow-inner">
              <div
                className="h-full bg-secondary rounded-l-full relative cursor-pointer transition-all"
                style={{
                  width: targetBudget > 0 ? `${Math.min((expenses.filter(e => e.category === 'food' || e.category === 'dining').reduce((s, e) => s + (e.costUsd || e.amount || 0), 0) / targetBudget) * 100, 100)}%` : '0%',
                }}
                title="Food & Dining"
              />
              <div
                className="h-full bg-[#7C3AED] relative cursor-pointer transition-all"
                style={{
                  width: targetBudget > 0 ? `${Math.min((expenses.filter(e => e.category === 'activities' || e.category === 'sightseeing').reduce((s, e) => s + (e.costUsd || e.amount || 0), 0) / targetBudget) * 100, 100)}%` : '0%',
                }}
                title="Activities"
              />
              <div
                className="h-full bg-primary-container relative cursor-pointer transition-all"
                style={{
                  width: targetBudget > 0 ? `${Math.min((expenses.filter(e => e.category === 'transport').reduce((s, e) => s + (e.costUsd || e.amount || 0), 0) / targetBudget) * 100, 100)}%` : '0%',
                }}
                title="Transport"
              />
              <div
                className="h-full bg-inverse-primary relative cursor-pointer transition-all"
                style={{
                  width: targetBudget > 0 ? `${Math.min((expenses.filter(e => e.category === 'lodging').reduce((s, e) => s + (e.costUsd || e.amount || 0), 0) / targetBudget) * 100, 100)}%` : '0%',
                }}
                title="Accommodation"
              />
              {isOverBudget && (
                <div
                  className="h-full rounded-r-full bg-error relative cursor-pointer overflow-hidden transition-all"
                  style={{
                    width: targetBudget > 0 ? `${Math.min((Math.abs(variance) / targetBudget) * 100, 20)}%` : '0%',
                  }}
                  title="Over budget deficit"
                >
                  <div className="w-full h-full opacity-40 bg-[repeating-linear-gradient(45deg,#ffffff,#ffffff_4px,transparent_4px,transparent_8px)]" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts & Breakdown Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
        {/* Left Column: Interactive Donut Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between border border-surface-container-high/40">
          <ExpenseDonutChart
            expenses={expenses.filter((e) => e.tripId === activeTripId)}
            selectedCategory={categoryFilter}
            onSelectCategory={(cat) => setCategoryFilter(cat)}
            currency={currencyDisplayMode === 'destination' ? destinationCurrency : homeCurrency}
            targetBudget={
              currencyDisplayMode === 'destination'
                ? Math.round(targetBudget * liveExchangeRate)
                : targetBudget
            }
          />
        </div>

        {/* Right Column: Reallocation & JPY Peg (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-space-md">
          {/* Optimization Notice (Only show when over budget with real expenses) */}
          {isOverBudget && expenses.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-3 relative overflow-hidden border border-surface-container-high/40 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-error-container text-error flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">crisis_alert</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-item-title text-item-title text-on-surface font-bold">
                      Budget Optimization Notice
                    </span>
                    <span className="font-badge text-badge px-2 py-0.5 rounded-full bg-error-container text-error uppercase font-bold">
                      Action Rec.
                    </span>
                  </div>
                  <p className="font-body text-small text-on-surface-variant mt-1 leading-relaxed">
                    Expenses exceed allocated budget target by{' '}
                    <strong className="text-on-surface font-semibold">
                      {formatCurrencyAmount(Math.abs(variance), homeCurrency)}
                    </strong>
                    . Consider reallocating or pacing optional activities.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Real-Time Currency Converter Hub */}
          <div id="currencyConverterHub" className="scroll-mt-6">
            <CurrencyConverter
              destinationCurrency={destinationCurrency}
              homeCurrency={homeCurrency}
              onRateChange={(rate, from, to) => {
                if (from === 'USD' && to === destinationCurrency) {
                  setLiveExchangeRate(rate);
                } else if (from === destinationCurrency && to === 'USD') {
                  setLiveExchangeRate(rate > 0 ? 1 / rate : 154.2);
                }
              }}
              onApplyToExpenseDraft={(amt, curr, note) => {
                setFormAmount(amt.toFixed(tripCurrency === 'JPY' || tripCurrency === 'KRW' ? 0 : 2));
                if (note) setFormNotes((prev) => (prev ? `${prev} • ${note}` : note));
                const el = document.getElementById('addExpensePanel');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid: Table & Embedded Add Expense Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md items-start">
        {/* Primary Table Section */}
        <div className="xl:col-span-8 bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md border border-surface-container-high/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-xs">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-full font-badge text-badge transition-colors whitespace-nowrap cursor-pointer font-bold ${
                  categoryFilter === 'all'
                    ? 'bg-primary-container text-on-primary'
                    : 'bg-surface-container hover:bg-surface-variant text-on-surface-variant'
                }`}
              >
                ALL ({expenses.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('food')}
                className={`px-3 py-1.5 rounded-full font-badge text-badge transition-colors whitespace-nowrap cursor-pointer font-bold ${
                  categoryFilter === 'food'
                    ? 'bg-primary-container text-on-primary'
                    : 'bg-surface-container hover:bg-surface-variant text-on-surface-variant'
                }`}
              >
                FOOD
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('activities')}
                className={`px-3 py-1.5 rounded-full font-badge text-badge transition-colors whitespace-nowrap cursor-pointer font-bold ${
                  categoryFilter === 'activities'
                    ? 'bg-primary-container text-on-primary'
                    : 'bg-surface-container hover:bg-surface-variant text-on-surface-variant'
                }`}
              >
                ACTIVITIES
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('transport')}
                className={`px-3 py-1.5 rounded-full font-badge text-badge transition-colors whitespace-nowrap cursor-pointer font-bold ${
                  categoryFilter === 'transport'
                    ? 'bg-primary-container text-on-primary'
                    : 'bg-surface-container hover:bg-surface-variant text-on-surface-variant'
                }`}
              >
                TRANSPORT
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('lodging')}
                className={`px-3 py-1.5 rounded-full font-badge text-badge transition-colors whitespace-nowrap cursor-pointer font-bold ${
                  categoryFilter === 'lodging'
                    ? 'bg-primary-container text-on-primary'
                    : 'bg-surface-container hover:bg-surface-variant text-on-surface-variant'
                }`}
              >
                LODGING
              </button>
            </div>

            {/* Search & Sort */}
            <div className="flex items-center gap-space-xs self-stretch md:self-auto">
              <div className="relative flex-1 md:w-56">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  search
                </span>
                <input
                  className="w-full h-[36px] pl-8 pr-3 bg-surface-container-low rounded-lg font-body text-small text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Filter expenses..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="relative">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className="h-[36px] px-3 pr-8 bg-surface-container-low text-on-surface font-caption text-caption rounded-lg appearance-none cursor-pointer focus:outline-none"
                >
                  <option value="date-asc">Sort: Date (Asc)</option>
                  <option value="cost-desc">Sort: Cost (High-Low)</option>
                  <option value="cost-asc">Sort: Cost (Low-High)</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px] pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Expense Cards (below 768px) */}
          <div className="flex md:hidden flex-col gap-3">
            {filteredExpenses.length === 0 ? (
              <div className="p-6 text-center text-on-surface-variant text-body bg-surface-container-low rounded-xl">
                No expenses logged yet.
              </div>
            ) : (
              filteredExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-surface-container-low rounded-xl p-3.5 border border-surface-container-high/60 flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            exp.category === 'transport'
                              ? 'bg-surface-container-high text-primary'
                              : exp.category === 'lodging'
                              ? 'bg-surface-variant text-primary'
                              : exp.category === 'activities'
                              ? 'bg-[#EDE9FE] text-[#7C3AED]'
                              : 'bg-secondary-fixed text-on-secondary-fixed'
                          }`}
                        >
                          {exp.category}
                        </span>
                        <span className="text-xs text-on-surface-variant font-medium">
                          {exp.dayLabel} • {exp.dateStr}
                        </span>
                      </div>
                      <h4 className="font-body-medium text-sm text-on-surface font-bold mt-1">
                        {exp.title}
                      </h4>
                      <span className="text-xs text-on-surface-variant">
                        {exp.subtitle}
                      </span>
                    </div>

                    {/* Cost badge */}
                    <div className="text-right shrink-0">
                      <div className="font-body-medium text-sm text-on-surface font-bold">
                        {formatCurrency(exp.amount || exp.costUsd || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-surface-container-high/40 text-xs">
                    <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium bg-surface-variant px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {exp.paymentStatus}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => alert(`Editing item: ${exp.title}`)}
                        className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                        title="Edit expense"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                        title="Delete expense"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-caption text-caption uppercase tracking-wider rounded-lg">
                  <th className="py-2.5 px-3 rounded-l-lg font-semibold">Date / Day</th>
                  <th className="py-2.5 px-3 font-semibold">Expense Item</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold">Payment Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Est. Cost</th>
                  <th className="py-2.5 px-3 font-semibold hidden lg:table-cell">Notes</th>
                  <th className="py-2.5 px-3 rounded-r-lg font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container text-body font-body">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-on-surface-variant text-body">
                      No expenses logged yet.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-surface-container-low/60 transition-colors group">
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-body-medium text-on-surface font-semibold">{exp.dateStr}</div>
                      <div className="font-caption text-caption text-on-surface-variant">{exp.dayLabel}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-body-medium text-body text-on-surface font-semibold group-hover:text-primary transition-colors">
                        {exp.title}
                      </div>
                      <div className="font-caption text-caption text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          {exp.category === 'transport'
                            ? 'train'
                            : exp.category === 'lodging'
                            ? 'home'
                            : exp.category === 'activities'
                            ? 'temple_buddhist'
                            : 'restaurant'}
                        </span>
                        {exp.subtitle}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`font-badge text-badge px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          exp.category === 'transport'
                            ? 'bg-surface-container-high text-primary'
                            : exp.category === 'lodging'
                            ? 'bg-surface-variant text-primary'
                            : exp.category === 'activities'
                            ? 'bg-[#EDE9FE] text-[#7C3AED]'
                            : 'bg-secondary-fixed text-on-secondary-fixed'
                        }`}
                      >
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-caption text-caption text-primary font-medium bg-surface-variant px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {exp.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="font-body-medium text-body text-on-surface font-bold">
                        {formatCurrency(exp.amount || exp.costUsd || 0)}
                      </div>
                    </td>
                    <td className="py-3 px-3 hidden lg:table-cell max-w-[180px] truncate text-on-surface-variant font-caption text-caption">
                      {exp.notes}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEditExpense(exp)}
                          className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                          title="Edit in form"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                          title="Delete"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="flex items-center justify-between pt-space-xs text-caption font-caption text-on-surface-variant">
            <div>
              Showing {filteredExpenses.length} tracked expense{filteredExpenses.length === 1 ? '' : 's'}
            </div>
            <span className="text-[11px] font-medium text-on-surface-variant">
              Full dataset synchronized
            </span>
          </div>
        </div>

        {/* Embedded 'Add Expense' Panel */}
        <div
          id="addExpensePanel"
          className="xl:col-span-4 bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md sticky top-20 border border-surface-container-high/40"
        >
          <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high/30">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-secondary text-on-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">add</span>
              </div>
              <h2 className="font-item-title text-item-title text-on-surface font-bold">
                Add New Expense Item
              </h2>
            </div>
            <span className="font-badge text-badge px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-bold">
              QUICK DRAFT
            </span>
          </div>

          <form className="flex flex-col gap-space-sm" onSubmit={handleSaveExpense}>
            {/* Title */}
            <div className="flex flex-col gap-1">
              <label className="font-caption text-caption font-bold text-on-surface">
                Expense Item Title
              </label>
              <input
                className="h-[44px] px-3 bg-surface-container-low rounded-lg font-body text-body text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                placeholder="e.g. Gion Kaiseki Multi-Course"
                required
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            {/* Amount with ₱ Prefix */}
            <div className="flex flex-col gap-1.5">
              <label className="font-caption text-caption font-bold text-on-surface">Amount (₱)</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-body text-on-surface-variant font-bold">
                  ₱
                </span>
                <input
                  className="w-full h-[44px] pl-8 pr-20 bg-surface-container-low rounded-lg font-body text-body text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                  placeholder="1,500.00"
                  required
                  step="any"
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                />
                <span className="absolute right-2 px-2.5 py-1 bg-surface-container text-on-surface-variant rounded-md text-xs font-bold flex items-center gap-1 select-none pointer-events-none">
                  <span>🇵🇭</span>
                  <span>PHP</span>
                </span>
              </div>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1">
              <label className="font-caption text-caption font-bold text-on-surface">Category</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'food', label: 'Food & Dining' },
                  { id: 'activities', label: 'Activities' },
                  { id: 'transit', label: 'Transit' },
                  { id: 'lodging', label: 'Lodging' },
                ].map((c) => (
                  <label
                    key={c.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      formCategory === c.id
                        ? 'bg-surface-container ring-1 ring-primary'
                        : 'bg-surface-container-low hover:bg-surface-container'
                    }`}
                  >
                    <input
                      className="text-primary focus:ring-primary"
                      name="cat"
                      type="radio"
                      checked={formCategory === (c.id === 'transit' ? 'transport' : c.id)}
                      onChange={() =>
                        setFormCategory((c.id === 'transit' ? 'transport' : c.id) as ExpenseCategory)
                      }
                    />
                    <span className="font-caption text-caption text-on-surface font-medium">{c.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Day Assignment & Status */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="font-caption text-caption font-bold text-on-surface">
                  Day Assignment
                </label>
                <select
                  value={formDay}
                  onChange={(e) => {
                    setFormDay(e.target.value);
                    const match = e.target.value.match(/Day (\d+)/);
                    if (match) setFormDayNumber(parseInt(match[1]));
                  }}
                  className="h-[44px] px-3 bg-surface-container-low rounded-lg font-body text-small text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-xs cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((d) => (
                    <option key={d} value={`Day ${d} (Nov ${11 + d})`}>
                      Day {d} (Nov {11 + d})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-caption text-caption font-bold text-on-surface">
                  Payment Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="h-[44px] px-3 bg-surface-container-low rounded-lg font-body text-small text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-xs cursor-pointer"
                >
                  <option>Planned / Estimated</option>
                  <option>Paid in Full</option>
                  <option>Cash Reserved</option>
                  <option>Pre-booked Online</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1">
              <label className="font-caption text-caption font-bold text-on-surface">
                Notes or Confirmation Ref
              </label>
              <input
                className="h-[44px] px-3 bg-surface-container-low rounded-lg font-body text-body text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                placeholder="Table reservation for 2, 7:30pm"
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>

            {/* Submit */}
            <div className="flex items-center gap-2 pt-2">
              <button
                disabled={isSubmitting}
                className="flex-1 h-[44px] bg-secondary hover:bg-secondary-container text-on-secondary font-button text-button rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer font-semibold"
                type="submit"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isSubmitting ? 'refresh' : 'check'}
                </span>
                <span>{isSubmitting ? 'Saving...' : 'Save Expense'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormTitle('');
                  setFormAmount('0.00');
                  setFormNotes('');
                }}
                className="h-[44px] px-4 bg-surface-container hover:bg-surface-variant text-on-surface-variant font-button text-button rounded-lg transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </form>

          <div className="p-3 bg-surface-container-low rounded-lg flex items-center gap-2 text-caption font-caption text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-primary">sync</span>
            <span>Expenses auto-sync to overall Itinerary Day timeline &amp; Export reports.</span>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Floating Modal Currency Converter for Quick Access */}
      {isConverterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">currency_exchange</span>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Quick Currency Converter</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConverterModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="p-4 max-h-[80vh] overflow-y-auto">
              <CurrencyConverter
                destinationCurrency={destinationCurrency}
                homeCurrency={homeCurrency}
                onRateChange={(rate, from, to) => {
                  if (from === 'USD' && to === destinationCurrency) {
                    setLiveExchangeRate(rate);
                  } else if (from === destinationCurrency && to === 'USD') {
                    setLiveExchangeRate(rate > 0 ? 1 / rate : 154.2);
                  }
                }}
                onApplyToExpenseDraft={(amt, curr, note) => {
                  setFormAmount(amt.toFixed(tripCurrency === 'JPY' || tripCurrency === 'KRW' ? 0 : 2));
                  if (note) setFormNotes((prev) => (prev ? `${prev} • ${note}` : note));
                  setIsConverterModalOpen(false);
                  const el = document.getElementById('addExpensePanel');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

