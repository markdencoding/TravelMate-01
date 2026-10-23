'use client';

import React, { useState, useMemo } from 'react';
import { useTravelStore } from '../store';
import { formatCurrency } from '@/lib/currencies';

export const DossierScreen: React.FC = () => {
  const { activeTrip, activities, expenses, trips, setActiveTripId, currentUser, openEditTripModal } =
    useTravelStore();

  // Export Customization States (Hidden on print)
  const [accentTheme, setAccentTheme] = useState<'slate' | 'teal' | 'amber'>('teal');
  const [includeFinancials, setIncludeFinancials] = useState<boolean>(true);
  const [includeWeather, setIncludeWeather] = useState<boolean>(true);
  const [includeEmergency, setIncludeEmergency] = useState<boolean>(true);
  const [densityMode, setDensityMode] = useState<'detailed' | 'compact'>('detailed');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Group activities by trip day
  const daysCount = Math.max(
    1,
    activeTrip?.daysCount ||
      (activeTrip?.startDate && activeTrip?.endDate
        ? Math.floor(
            (new Date(activeTrip.endDate).getTime() - new Date(activeTrip.startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1
        : 1)
  );
  const daysArray = Array.from({ length: daysCount }, (_, i) => i + 1);

  // Budget calculations
  const totalTracked = expenses.reduce(
    (acc, curr) => acc + (curr.costUsd || curr.amount || 0),
    0
  );
  const budgetCap = activeTrip?.budget || activeTrip?.estimatedBudget || 0;
  const budgetVariance = budgetCap - totalTracked;

  const expenseCategories = useMemo(() => {
    const cats: Record<string, { count: number; sum: number }> = {};
    expenses.forEach((e) => {
      const cat = e.category || 'other';
      if (!cats[cat]) cats[cat] = { count: 0, sum: 0 };
      cats[cat].count += 1;
      cats[cat].sum += (e.costUsd || e.amount || 0);
    });
    return Object.entries(cats).map(([cat, data]) => ({
      cat: cat.charAt(0).toUpperCase() + cat.slice(1),
      count: data.count,
      amt: data.sum,
      pct: totalTracked > 0 ? `${Math.round((data.sum / totalTracked) * 100)}%` : '0%',
      status: 'Recorded',
    }));
  }, [expenses, totalTracked]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePrintPDF = () => {
    showToast('Opening print dialog. Select "Save as PDF" to generate document.');
    setTimeout(() => {
      window.print();
    }, 350);
  };

  const handleCopyMarkdown = () => {
    const md = `# EXPEDITION BRIEFING DOSSIER: ${activeTrip?.title || 'Trip'}
**Reference:** TM-EXP-${activeTrip?.id?.toUpperCase() || 'TRIP'}
**Dates:** ${activeTrip?.dateRange || `${daysCount} Days`}
**Traveler:** ${currentUser?.name || 'Traveler'}
**Budget:** ${formatCurrency(budgetCap)} (Tracked: ${formatCurrency(totalTracked)})

## Summary
${activeTrip?.description || activeTrip?.routeSummary || 'Curated journey dossier.'}

## Day-by-Day Schedule
${daysArray
  .map((dayNum) => {
    const dayActs = activities.filter((a) => a.dayNumber === dayNum);
    const dateStr = activeTrip?.startDate
      ? (() => {
          const d = new Date(activeTrip.startDate);
          d.setDate(d.getDate() + (dayNum - 1));
          return d.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
        })()
      : `Day ${dayNum}`;
    const actsStr =
      dayActs.length > 0
        ? dayActs
            .map(
              (a) =>
                `- **${a.startTime || a.time}**: ${a.title} (${a.location}) [${a.category}] - ${formatCurrency(a.cost || 0)}`
            )
            .join('\n')
        : '- Open window / transit pacing';
    return `### ${dateStr}\n${actsStr}`;
  })
  .join('\n\n')}
`;

    navigator.clipboard.writeText(md).then(() => {
      showToast('Markdown itinerary briefing copied to clipboard!');
    });
  };

  // Color mappings based on selected dossier accent
  const accentClasses = {
    teal: {
      primary: 'text-[#0d6e6e]',
      border: 'border-[#0d6e6e]',
      bgLight: 'bg-[#0d6e6e]/5',
      badge: 'bg-[#0d6e6e] text-white',
      rule: 'border-[#0d6e6e]',
    },
    slate: {
      primary: 'text-slate-900',
      border: 'border-slate-900',
      bgLight: 'bg-slate-100',
      badge: 'bg-slate-900 text-white',
      rule: 'border-slate-900',
    },
    amber: {
      primary: 'text-amber-800',
      border: 'border-amber-800',
      bgLight: 'bg-amber-50',
      badge: 'bg-amber-800 text-white',
      rule: 'border-amber-800',
    },
  }[accentTheme];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-16">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-fade-in border border-slate-700">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Action Toolbar (Hidden in Print) */}
      <div className="print:hidden space-y-4">
        {/* Main Controls Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
              <span>Home</span>
              <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              <span>Itinerary</span>
              <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              <span className="text-primary font-semibold">Printable Dossier Studio</span>
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
                Official Travel Dossier &amp; PDF Export
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                A4 / PDF Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Export high-resolution physical briefing dossiers, PDF travel guides, and consular archives.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Trip Selector */}
            <select
              value={activeTrip?.id}
              onChange={(e) => setActiveTripId(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs cursor-pointer"
            >
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>

            {/* Copy Markdown */}
            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Copy formatted markdown itinerary"
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
              <span>Copy Markdown</span>
            </button>

            {/* Primary Export to PDF Action */}
            <button
              onClick={handlePrintPDF}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-primary/25 hover:scale-[1.02] cursor-pointer"
              title="Print or Save as PDF"
            >
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              <span>Export as PDF</span>
            </button>
          </div>
        </div>

        {/* PDF Customization Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-primary">tune</span>
              Dossier Layout Controls:
            </span>

            {/* Accent Theme */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-700 p-0.5 rounded-lg border border-slate-200 dark:border-slate-600">
              <button
                onClick={() => setAccentTheme('teal')}
                className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                  accentTheme === 'teal' ? 'bg-[#0d6e6e] text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Atelier Teal
              </button>
              <button
                onClick={() => setAccentTheme('slate')}
                className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                  accentTheme === 'slate' ? 'bg-slate-900 dark:bg-slate-950 text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Executive Slate
              </button>
              <button
                onClick={() => setAccentTheme('amber')}
                className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                  accentTheme === 'amber' ? 'bg-amber-800 text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Autumn Amber
              </button>
            </div>

            {/* Density Toggle */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-700 p-0.5 rounded-lg border border-slate-200 dark:border-slate-600">
              <button
                onClick={() => setDensityMode('detailed')}
                className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                  densityMode === 'detailed'
                    ? 'bg-primary text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Detailed Notes
              </button>
              <button
                onClick={() => setDensityMode('compact')}
                className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                  densityMode === 'compact'
                    ? 'bg-primary text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Compact Guide
              </button>
            </div>
          </div>

          {/* Section Inclusions Checkboxes */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeFinancials}
                onChange={(e) => setIncludeFinancials(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-primary focus:ring-primary border-slate-300"
              />
              <span>Financial Ledger</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeWeather}
                onChange={(e) => setIncludeWeather(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-primary focus:ring-primary border-slate-300"
              />
              <span>Weather Briefing</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeEmergency}
                onChange={(e) => setIncludeEmergency(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-primary focus:ring-primary border-slate-300"
              />
              <span>Consular Protocols</span>
            </label>
          </div>
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="bg-surface-container-lowest p-space-xl rounded-xl flex flex-col items-center justify-center text-center shadow-sm border border-surface-container-high/40 py-16 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-space-sm">
            <span className="material-symbols-outlined text-[32px]">description</span>
          </div>
          <h4 className="font-item-title text-item-title text-on-surface font-semibold text-lg">
            No expedition dossier available
          </h4>
          <p className="font-body text-body text-on-surface-variant mt-1 max-w-sm">
            Create a trip first to generate and export printable dossiers, PDF summaries, and travel itineraries.
          </p>
          <button
            onClick={() => openEditTripModal()}
            className="mt-space-md h-[40px] px-5 rounded-lg bg-secondary hover:bg-secondary-container text-on-secondary font-button text-caption shadow-sm cursor-pointer font-semibold flex items-center gap-1.5"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Create First Trip</span>
          </button>
        </div>
      ) : (
      /* ========================================================================= */
      /* PRINTABLE PAPER CANVAS (Optimized for PDF Printing)                       */
      /* ========================================================================= */
      <div
        id="printable-dossier"
        className="bg-white border border-slate-300 p-8 sm:p-12 rounded-3xl shadow-md text-slate-900 print:border-none print:shadow-none print:p-0 print:rounded-none transition-all"
      >
        {/* ======================================================== */}
        {/* 1. PROFESSIONAL ARCHIVAL HEADER                          */}
        {/* ======================================================== */}
        <header className="border-b-2 border-slate-900 pb-6 mb-6">
          {/* Top metadata strip */}
          <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase border-b border-slate-200 pb-2.5 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-900 inline-block" />
              <span>TRAVELMATE • TRIP DOSSIER</span>
              <span>•</span>
              <span className="text-slate-800">
                ID #{activeTrip?.id?.toUpperCase() || 'TRP'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>DOC REF: TM-EXP-V1.0</span>
              <span>•</span>
              <span className="text-emerald-700">AUTHORIZATION VERIFIED</span>
            </div>
          </div>

          {/* Main Title Row & Official Verification Stamps */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                <span>CLASSIFICATION: EXECUTIVE ITINERARY</span>
                <span>•</span>
                <span>{activeTrip?.status?.toUpperCase() || 'PLANNED'}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display text-slate-900">
                {activeTrip?.title || 'Expedition Briefing'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                {activeTrip?.description ||
                  activeTrip?.routeSummary ||
                  'An intentional, curated itinerary mapping destinations, activities, and milestones.'}
              </p>
            </div>

            {/* Official Stamps and QR Code verification block */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0">
              {/* Rubber stamp visual */}
              <div
                className={`border-2 ${accentClasses.border} ${accentClasses.primary} font-mono text-[11px] font-black uppercase px-3 py-1.5 rounded rotate-[-2deg] tracking-wider text-center shadow-xs`}
              >
                CONFIRMED EXPEDITION
                <span className="block text-[8px] font-normal tracking-normal text-slate-600">
                  ISSUED: OCT 10, 2026
                </span>
              </div>

              {/* Decorative QR code representing instant digital sync */}
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono text-[9px] text-slate-500">
                <div className="w-10 h-10 bg-slate-900 rounded p-1 flex items-center justify-center text-white shrink-0">
                  {/* Stylized QR icon representation */}
                  <span className="material-symbols-outlined text-[24px]">qr_code_2</span>
                </div>
                <div className="leading-tight">
                  <span className="block font-bold text-slate-900">PASSENGER QR</span>
                  <span>Scan for transit &amp; mobile check-in</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Cover Photo Banner or Fallback */}
        <div className="relative h-44 w-full rounded-2xl overflow-hidden mb-6 border border-slate-200 break-inside-avoid">
          {activeTrip?.coverImage ? (
            <img
              src={activeTrip.coverImage}
              alt={activeTrip.coverImageAlt || activeTrip.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal-900/40 via-slate-100 to-slate-200 relative flex items-center justify-center">
              <span className="material-symbols-outlined text-[40px] text-teal-700/40">explore</span>
            </div>
          )}
          {activeTrip?.coverImage && activeTrip?.coverImageCredit && (
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-[9px] text-white/90">
              {activeTrip.coverImageCreditUrl ? (
                <a
                  href={activeTrip.coverImageCreditUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {activeTrip.coverImageCredit}
                </a>
              ) : (
                <span>{activeTrip.coverImageCredit}</span>
              )}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 2. EXECUTIVE EXPEDITION SUMMARY METRICS                  */}
        {/* ======================================================== */}
        <section className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 mb-8 break-inside-avoid">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider font-display text-slate-900">
              Executive Expedition Summary &amp; Key Parameters
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Curator: {currentUser?.name || 'Traveler'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="space-y-0.5">
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                Date Range &amp; Duration
              </span>
              <span className="font-bold text-slate-900">
                {activeTrip?.dateRange || `${daysCount} Days`}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {daysCount} Days ({Math.max(0, daysCount - 1)} Nights)
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                Base Destinations
              </span>
              <span className="font-bold text-slate-900 truncate block">
                {activeTrip?.destinations?.join(' ➔ ') || 'Curated Destinations'}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Country: {activeTrip?.country || 'International'}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                Budget Allocation
              </span>
              <span className="font-bold text-slate-900">
                {formatCurrency(budgetCap)}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold block">
                Variance: {budgetVariance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(budgetVariance))} ({budgetVariance >= 0 ? 'Under' : 'Over'})
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                Program Density
              </span>
              <span className="font-bold text-slate-900">
                {activities.length} Scheduled Events
              </span>
              <span className="text-[10px] text-slate-500 block">
                Avg. {(activities.length / daysCount).toFixed(1)} activities / day
              </span>
            </div>
          </div>

          {/* Key Confirmed Reservations Strip */}
          {activities.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-600 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-600 text-[14px]">
                  verified
                </span>
                <span>
                  <strong>Activities:</strong> {activities.length} Scheduled Events
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-600 text-[14px]">
                  verified
                </span>
                <span>
                  <strong>Ledger:</strong> {formatCurrency(totalTracked)} Logged
                </span>
              </div>
            </div>
          )}
        </section>

        {/* ======================================================== */}
        {/* 3. DAY-BY-DAY CHRONOLOGICAL ITINERARY BRIEFING           */}
        {/* ======================================================== */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display uppercase tracking-wide">
              Day-by-Day Chronological Itinerary Briefing
            </h2>
            <span className="text-xs font-mono text-slate-500">
              Timings, Coordinates &amp; Field Notes
            </span>
          </div>

          <div className="space-y-5">
            {daysArray.map((dayNum) => {
              const dayActs = activities.filter((a) => a.dayNumber === dayNum);
              const dateStr = activeTrip?.startDate
                ? (() => {
                    const d = new Date(activeTrip.startDate);
                    d.setDate(d.getDate() + (dayNum - 1));
                    return d.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' });
                  })()
                : `Day ${dayNum}`;
              const dayTotalCost = dayActs.reduce((acc, curr) => acc + (curr.cost || 0), 0);

              return (
                <div
                  key={dayNum}
                  className="border border-slate-200 rounded-xl overflow-hidden break-inside-avoid shadow-2xs"
                >
                  {/* Day Header */}
                  <div className="bg-slate-100/90 px-3 sm:px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${accentClasses.badge}`}>
                        DAY {dayNum}
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-slate-900 font-display">
                        {dateStr}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono text-slate-600 flex-wrap">
                      <span>{dayActs.length} Event{dayActs.length !== 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-800">
                        Day Est: {activeTrip?.currency} {dayTotalCost.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Day Activities List */}
                  {dayActs.length === 0 ? (
                    <div className="p-4 text-xs text-slate-400 italic bg-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">pause_circle</span>
                      <span>Open exploration, tea rest, and local pedestrian wandering window.</span>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 bg-white">
                      {dayActs.map((act) => (
                        <div
                          key={act.id}
                          className={`p-3.5 hover:bg-slate-50/60 transition-colors ${
                            densityMode === 'compact' ? 'py-2' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              {/* Time Pill */}
                              <div className="w-20 shrink-0 font-mono text-xs font-bold text-slate-700 bg-slate-100 py-1 px-1.5 rounded text-center">
                                {act.startTime || act.time}
                              </div>

                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-display">
                                    {act.title}
                                  </h4>
                                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                    {act.category}
                                  </span>
                                </div>

                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <span className="material-symbols-outlined text-[13px] text-slate-400">
                                    place
                                  </span>
                                  <span>{act.location}</span>
                                </div>

                                {densityMode === 'detailed' && (act.notes || act.description) && (
                                  <p className="text-[11px] text-slate-600 font-sans mt-1.5 bg-slate-50/80 p-2 rounded-lg border border-slate-100 leading-relaxed">
                                    <strong className="text-slate-800">Curator Note: </strong>
                                    {act.notes || act.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Cost Pill */}
                            <div className="text-right shrink-0 font-mono text-xs font-semibold text-slate-800">
                              {act.cost && act.cost > 0
                                ? formatCurrency(act.cost)
                                : 'Included'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* 4. FINANCIAL ALLOCATION & EXPENSE LEDGER (Conditional)   */}
        {/* ======================================================== */}
        {includeFinancials && (
          <section className="mt-8 pt-6 border-t border-slate-200 break-inside-avoid">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-display">
                Expedition Financial Ledger &amp; Category Distribution
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                Reconciliation Base: {activeTrip?.currency}
              </span>
            </div>

            {/* Mobile Card-Based Financial Ledger */}
            <div className="block md:hidden space-y-2.5">
              {expenseCategories.length === 0 ? (
                <div className="py-4 px-3 text-center text-slate-500 font-medium bg-slate-50 rounded-xl text-xs">
                  No expenses recorded in ledger yet.
                </div>
              ) : (
                expenseCategories.map((row) => (
                  <div
                    key={row.cat}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{row.cat}</span>
                      <span className="text-emerald-700 font-bold text-[10px] uppercase">
                        {row.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 font-mono text-[11px]">
                      <span>{row.count} entries ({row.pct} of budget)</span>
                      <span className="font-bold text-slate-900">{formatCurrency(row.amt)}</span>
                    </div>
                  </div>
                ))
              )}
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>TOTAL TRACKED</span>
                <span className="font-mono text-sm">{formatCurrency(totalTracked)}</span>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Item Count</th>
                    <th className="py-2 px-3">Allocated Amount</th>
                    <th className="py-2 px-3">% of Target Budget</th>
                    <th className="py-2 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {expenseCategories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 px-3 text-center text-slate-500 font-medium">
                        No expenses recorded in ledger yet.
                      </td>
                    </tr>
                  ) : (
                    expenseCategories.map((row) => (
                      <tr key={row.cat}>
                        <td className="py-2 px-3 font-bold text-slate-900">{row.cat}</td>
                        <td className="py-2 px-3">{row.count} entries</td>
                        <td className="py-2 px-3 font-semibold">
                          {formatCurrency(row.amt)}
                        </td>
                        <td className="py-2 px-3">{row.pct}</td>
                        <td className="py-2 px-3 text-right text-emerald-700 font-bold text-[10px]">
                          {row.status}
                        </td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-slate-50 font-bold text-slate-900">
                    <td className="py-2.5 px-3">TOTAL TRACKED EXPENSES</td>
                    <td className="py-2.5 px-3">{expenses.length} item{expenses.length === 1 ? '' : 's'}</td>
                    <td className="py-2.5 px-3">{formatCurrency(totalTracked)}</td>
                    <td className="py-2.5 px-3">{totalTracked > 0 ? '100%' : '0%'}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-700">
                      {budgetVariance >= 0 ? 'UNDER CAP' : 'OVER CAP'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* 5. WEATHER & EXPEDITION PACKING BRIEFING (Conditional)   */}
        {/* ======================================================== */}
        {includeWeather && (
          <section className="mt-8 pt-6 border-t border-slate-200 break-inside-avoid">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-display mb-3">
              Meteorological Profile &amp; Atelier Packing Protocol
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block font-display">
                  Seasonal Thermal Range
                </span>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Review local weather forecasts before departure and pack appropriate layers for outdoor excursions and walking legs.
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block font-display">
                  Expedition Footwear Protocol
                </span>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Comfortable, slip-on walking shoes recommended for extensive daily waypoint pacing and site entries.
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block font-display">
                  Power &amp; Cash Connectivity
                </span>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Confirm regional plug adapters, mobile contactless cards, and keep modest local currency for small vendors.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* 6. EMERGENCY CONTACTS & CONSULAR HOTLINES (Conditional)  */}
        {/* ======================================================== */}
        {includeEmergency && (
          <section className="mt-8 pt-6 border-t border-slate-200 break-inside-avoid">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-display">
                Emergency Protocols &amp; 24/7 Consular Contacts
              </h3>
              <span className="text-[10px] font-mono text-slate-500">Jurisdiction: {activeTrip?.country || 'International'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block font-bold text-[10px]">
                  POLICE &amp; MEDICAL AMBULANCE
                </span>
                <span className="font-bold text-slate-900 text-sm">Emergency Hotlines</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Contact local emergency responders or 112 / 911 services</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block font-bold text-[10px]">
                  EMBASSY / CONSULAR HOTLINE
                </span>
                <span className="font-bold text-slate-900 text-sm">Consular Services</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Reach your home country's local mission desk</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block font-bold text-[10px]">
                  TRAVEL ASSISTANCE DESK
                </span>
                <span className="font-bold text-slate-900 text-sm">Visitor Support</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Transit center &amp; regional tourist bureau</p>
              </div>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* 7. ARCHIVAL SIGNATURE & DOCUMENT FOOTER                   */}
        {/* ======================================================== */}
        <footer className="mt-12 pt-6 border-t-2 border-slate-900 break-inside-avoid">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 font-mono text-[10px] text-slate-500">
            <div className="space-y-1">
              <div>
                <strong className="text-slate-900">PREPARED BY:</strong> {currentUser?.name || 'Traveler'} (Lead Expedition Architect)
              </div>
              <div>
                <strong className="text-slate-900">EXPEDITION HASH:</strong> SHA256-48c9f2b1a82d77e09923
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <div className="border-b border-slate-400 pb-1 inline-block min-w-[160px] text-slate-800 font-serif italic text-xs">
                {currentUser?.name || 'Authorized Traveler'}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-slate-400">
                Curator Authorization Signature
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-[9px] font-mono text-slate-400 border-t border-slate-100 pt-3">
            Generated via TravelMate Atelier Curated Trip Architecture • Document ID #TM-EXP-{activeTrip?.id || 'TRIP'} • Page 1 of 1 (Consolidated Briefing)
          </div>
        </footer>
      </div>
      )}
    </div>
  );
};
