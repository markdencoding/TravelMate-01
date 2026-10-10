import React, { useState } from 'react';
import { useTravelStore } from '../store';
import { WeatherForecastWidget } from '../components/WeatherForecastWidget';
import { ActivitySwipeCard } from '../components/ActivitySwipeCard';

export const DashboardScreen: React.FC = () => {
  const {
    activeTrip,
    activities,
    reminders,
    toggleReminder,
    openEditTripModal,
    setActiveTab,
    currentUser,
  } = useTravelStore();

  const pendingRemindersCount = reminders.filter((r) => !r.completed).length;

  return (
    <div className="w-full flex flex-col gap-space-lg max-w-[1400px] mx-auto px-space-lg py-space-lg">
      {/* Top Bar / Breadcrumb & Actions Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-xs text-on-surface-variant font-caption text-caption">
            <span>Home</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="font-body-medium text-primary font-semibold">Dashboard</span>
          </div>
          <h1 className="font-display text-display text-on-surface tracking-tight">
            Welcome back, Elena! 🍂{' '}
            <span className="text-primary-container font-page-title">Ready for autumn in Japan?</span>
          </h1>
          <p className="font-body text-body text-on-surface-variant">
            You have 1 upcoming trip starting in 18 days. Here is your travel planning overview.
          </p>
        </div>
        <div className="flex items-center gap-space-sm shrink-0">
          <button
            onClick={() => setActiveTab('dossier')}
            className="h-[44px] px-space-md bg-surface-container-lowest hover:bg-surface-container-low text-primary font-button text-button rounded-lg shadow-sm flex items-center gap-space-xs transition-all duration-200 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            <span>Export Itinerary PDF</span>
          </button>
          <button
            onClick={() => openEditTripModal()}
            className="h-[44px] px-space-md bg-secondary hover:bg-secondary-container text-on-secondary font-button text-button rounded-lg shadow-md hover:shadow-lg flex items-center gap-space-xs transition-all duration-200 cursor-pointer active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>New Trip</span>
          </button>
        </div>
      </div>

      {/* Key Stat Cards: Horizontal snap-scroll on mobile, 3-column grid on desktop/tablet */}
      <div className="flex md:grid md:grid-cols-3 gap-space-md overflow-x-auto md:overflow-x-visible snap-x snap-mandatory no-scrollbar pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
        {/* Stat 1: Upcoming Trips */}
        <div
          onClick={() => setActiveTab('trips')}
          className="min-w-[85%] sm:min-w-[300px] md:min-w-0 snap-start shrink-0 md:shrink bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between gap-space-sm relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer border border-surface-container-high/40"
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-semibold">
                Upcoming Trips
              </span>
              <span className="font-page-title text-page-title text-on-surface mt-1">3 Planned</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined text-[22px]">explore</span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs pt-space-xs">
            <span className="bg-surface-container-high text-primary font-badge text-badge px-2 py-0.5 rounded-full font-bold">
              NEXT: NOV 12 - 20, 2025
            </span>
            <span className="font-caption text-caption text-on-surface-variant">• Honshu Route</span>
          </div>
        </div>

        {/* Stat 2: Estimated Budget */}
        <div
          onClick={() => setActiveTab('expenses')}
          className="min-w-[85%] sm:min-w-[300px] md:min-w-0 snap-start shrink-0 md:shrink bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between gap-space-sm relative group hover:shadow-md transition-shadow cursor-pointer border border-surface-container-high/40"
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-semibold">
                Estimated Budget Used
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-page-title text-page-title text-on-surface font-bold">$2,450</span>
                <span className="font-body text-body text-on-surface-variant">/ $3,200</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary-container group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined text-[22px]">savings</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 pt-space-xs">
            <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
              <div className="h-full bg-primary-container rounded-full" style={{ width: '76.5%' }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="bg-surface-variant text-primary font-badge text-badge px-2 py-0.5 rounded-full font-bold">
                WITHIN BUDGET
              </span>
              <span className="font-caption text-caption text-on-surface-variant font-medium">
                $750 buffer
              </span>
            </div>
          </div>
        </div>

        {/* Stat 3: Days Until Next Trip */}
        <div
          onClick={() => setActiveTab('calendar')}
          className="min-w-[85%] sm:min-w-[300px] md:min-w-0 snap-start shrink-0 md:shrink bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between gap-space-sm relative group hover:shadow-md transition-shadow cursor-pointer border border-surface-container-high/40"
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-semibold">
                Days Until Next Trip
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-page-title text-page-title text-secondary font-bold">18</span>
                <span className="font-item-title text-item-title text-on-surface">Days to departure</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
              <span className="material-symbols-outlined text-[22px]">luggage</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-space-xs">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
              </span>
              <span className="font-caption text-caption text-on-surface">Final itinerary locked</span>
            </div>
            <span className="font-badge text-badge text-secondary font-bold tracking-wide uppercase">
              Kyoto / Tokyo
            </span>
          </div>
        </div>
      </div>

      {/* Featured "Next Trip" Card & Bento Section */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-lg relative overflow-hidden border border-surface-container-high/50">
        {/* Header row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex flex-col sm:flex-row sm:items-center gap-space-md">
            <div className="w-16 h-16 rounded-xl bg-surface-container shrink-0 overflow-hidden shadow-sm">
              <img
                className="w-full h-full object-cover"
                alt="Vibrant autumn maple foliage in Kyoto, wooden pagoda."
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFDsl4kz5wdhLPAHBCzx3bl6D0qMfklVc1zMAya5C0a47QewkD1_ZZgpedMqqq2z3tiUawt68lmMx8Ua9Un94lJlzkhd__pP97SthIWLSfKIVXqZpvfIIcpzxxOZlt50Q9t7djGt0BZUdmIWWTd7CpMLUvrSL8H94YLdJxsCiZlk02wPctr450tlFe_7N6RKW1kX385g19iZWwqkgaPxTG4LPfc4mg4frYPo7fAkRG6SoLQRcH35EBpA"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center flex-wrap gap-2 mb-1">
                <span className="bg-primary-container text-on-primary font-badge text-badge px-2.5 py-0.5 rounded-full font-bold">
                  PLANNED
                </span>
                <span className="bg-surface-variant text-primary font-badge text-badge px-2.5 py-0.5 rounded-full font-bold">
                  HONSHU, JAPAN
                </span>
                <span className="font-caption text-caption text-on-surface-variant">
                  Nov 12 – Nov 20 (8 Days)
                </span>
              </div>
              <h2 className="font-page-title text-page-title text-on-surface">
                {activeTrip?.title || 'Kyoto & Tokyo Autumn Discovery'}
              </h2>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-space-xs flex-wrap">
            <button
              onClick={() => setActiveTab('explore-map')}
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
              onClick={() => setActiveTab('dossier')}
              className="h-9 px-4 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-button text-caption flex items-center gap-1.5 transition-colors cursor-pointer"
              type="button"
            >
              <span>Open Full Itinerary</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* 5-Day Weather Forecast Component for Currently Selected Destination */}
        <WeatherForecastWidget onExploreRouteClick={() => setActiveTab('explore-map')} />

        {/* Middle Split: Route Thumbnail + Budget Indicator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
          {/* Route Map Preview */}
          <div
            onClick={() => setActiveTab('explore-map')}
            className="lg:col-span-6 rounded-xl relative overflow-hidden group min-h-[160px] flex flex-col justify-end p-space-md cursor-pointer shadow-xs"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCH9_QitHiug-gLFfNwQ-XzUKfr3Fj2tQyTjcjeSey5YTqqqylI1uJ4eyAYuGM2_bsK9461DXbV9zmUalY_bygtx-bj1gqfv8D7khsDLFIzosUe2NPMhtGxIm4H-hSBAKDqGvrs5QBBVJ3T3eNMt7mLarkxBLMEJZdkyVU8yaeBISOn_lF9MBea8pJl74EIVGvQYj1CiNJzMLbVEZhR0luQyIJ-sp0w6ACwRyumG2MURjSNFBoULgbOiQ')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/90 via-inverse-surface/40 to-transparent group-hover:from-inverse-surface/95 transition-all" />
            <div className="relative z-10 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary-container" />
                <span className="font-badge text-badge text-on-primary tracking-wide font-bold">
                  ROUTE ACTIVE
                </span>
              </div>
              <h3 className="font-item-title text-item-title text-on-primary font-semibold">
                Kansai Airport ➔ Kyoto ➔ Tokyo
              </h3>
              <p className="font-caption text-caption text-surface-dim">
                High-speed Shinkansen &amp; Local Hankyu transit
              </p>
            </div>
          </div>

          {/* Budget Multi-segment Rail */}
          <div
            onClick={() => setActiveTab('expenses')}
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
                $2,450 / $3,200
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-full h-3 rounded-full bg-surface-container flex overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '18%' }} title="Transport ($450)" />
                <div className="h-full bg-secondary" style={{ width: '35%' }} title="Food ($850)" />
                <div className="h-full bg-surface-tint" style={{ width: '25%' }} title="Activities ($600)" />
                <div
                  className="h-full bg-primary-container"
                  style={{ width: '22%' }}
                  title="Accommodation ($550)"
                />
              </div>
              <div className="grid grid-cols-2 gap-y-1 text-caption font-caption text-on-surface-variant">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span>Transport: $450</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span>Food: $850</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-surface-tint" />
                  <span>Activities: $600</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary-container" />
                  <span>Lodging: $550</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="font-caption text-caption text-on-surface-variant">Allocated categories</span>
              <span className="font-badge text-badge text-primary-container font-bold">
                76.5% COMMITTED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Chronological Upcoming Activities Timeline (7 cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md border border-surface-container-high/40">
          <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high/40">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[22px]">schedule</span>
              <h3 className="font-section-title text-section-title text-on-surface">
                Upcoming Scheduled Activities
              </h3>
            </div>
            <span className="bg-surface-container text-on-surface font-badge text-badge px-2.5 py-1 rounded-full font-bold">
              CHRONOLOGICAL
            </span>
          </div>

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
                  onDelete={() => {}}
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
                      <button
                        className="text-on-surface-variant hover:text-primary p-1 cursor-grab"
                        type="button"
                        title="Reorder milestone"
                      >
                        <span className="material-symbols-outlined text-[20px]">drag_indicator</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Reminders + Category Analytics (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-space-lg">
          {/* Travel Reminders Checklist */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md border border-surface-container-high/40">
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
              {reminders.map((rem) => (
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
              ))}
            </div>
          </div>

          {/* Category Breakdown Chart Preview */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md border border-surface-container-high/40">
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
                  {/* Food (35%) */}
                  <path
                    className="text-secondary"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="35, 100"
                    strokeWidth="4"
                  />
                  {/* Activities (25%) */}
                  <path
                    className="text-primary-container"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="25, 100"
                    strokeDashoffset="-35"
                    strokeWidth="4"
                  />
                  {/* Transport (18%) */}
                  <path
                    className="text-primary"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="18, 100"
                    strokeDashoffset="-60"
                    strokeWidth="4"
                  />
                  {/* Accommodation (22%) */}
                  <path
                    className="text-surface-variant"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="22, 100"
                    strokeDashoffset="-78"
                    strokeWidth="4"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-page-title text-small text-on-surface font-bold">$2.4k</span>
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
                  <span className="font-semibold text-on-surface">35% ($850)</span>
                </div>
                <div className="flex items-center justify-between text-caption">
                  <span className="flex items-center gap-1.5 text-on-surface font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-container" /> Activities
                  </span>
                  <span className="font-semibold text-on-surface">25% ($600)</span>
                </div>
                <div className="flex items-center justify-between text-caption">
                  <span className="flex items-center gap-1.5 text-on-surface font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-surface-variant" /> Lodging
                  </span>
                  <span className="font-semibold text-on-surface">22% ($550)</span>
                </div>
                <div className="flex items-center justify-between text-caption">
                  <span className="flex items-center gap-1.5 text-on-surface font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Transport
                  </span>
                  <span className="font-semibold text-on-surface">18% ($450)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Starter Template Discovery Banner */}
      <div className="bg-surface-container rounded-xl p-space-lg flex flex-col md:flex-row items-center justify-between gap-space-lg shadow-sm relative overflow-hidden border border-surface-container-high/40">
        <div className="flex items-center gap-space-md">
          <div className="w-14 h-14 rounded-full bg-surface-container-lowest flex items-center justify-center text-secondary shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[28px]">auto_stories</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="bg-secondary-fixed text-secondary font-badge text-badge px-2 py-0.5 rounded-full font-bold">
                CURATED TEMPLATE
              </span>
              <span className="font-caption text-caption text-on-surface-variant">
                Japan Autumn Collection
              </span>
            </div>
            <h4 className="font-section-title text-section-title text-on-surface mt-0.5 font-bold">
              Planning a new getaway?
            </h4>
            <p className="font-body text-body text-on-surface-variant">
              Start with our curated Autumn in Japan starter template—fully equipped with transit passes,
              teahouse routes, and UNESCO sites.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-space-sm shrink-0">
          <button
            onClick={() => setActiveTab('dossier')}
            className="h-[40px] px-space-md bg-surface-container-lowest hover:bg-surface-bright text-on-surface font-button text-button rounded-lg shadow-sm transition-colors cursor-pointer"
            type="button"
          >
            Preview Template
          </button>
          <button
            onClick={() => openEditTripModal()}
            className="h-[40px] px-space-md bg-primary hover:bg-primary-container text-on-primary font-button text-button rounded-lg shadow-sm transition-colors cursor-pointer"
            type="button"
          >
            Use Template
          </button>
        </div>
      </div>
    </div>
  );
};
