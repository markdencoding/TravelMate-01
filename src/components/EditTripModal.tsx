import React, { useState, useEffect } from 'react';
import { useTravelStore } from '../store';
import { Trip } from '../types';

export const EditTripModal: React.FC = () => {
  const { isEditTripModalOpen, setIsEditTripModalOpen, editingTrip, updateTrip, addTrip, setActiveTab } =
    useTravelStore();

  const [title, setTitle] = useState('');
  const [destinations, setDestinations] = useState<string[]>(['Kyoto', 'Tokyo']);
  const [newDestInput, setNewDestInput] = useState('');
  const [startDate, setStartDate] = useState('Nov 12, 2025');
  const [endDate, setEndDate] = useState('Nov 20, 2025');
  const [budget, setBudget] = useState('2,450.00');
  const [currency, setCurrency] = useState('USD ($)');
  const [privacy, setPrivacy] = useState<'collaborative' | 'private'>('collaborative');
  const [notes, setNotes] = useState(
    'Autumn momiji foliage focus, Shinkansen transit between Kansai & Kanto. Machiya reservations pending confirmation at Higashiyama.'
  );
  const [selectedCover, setSelectedCover] = useState(
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCy6CpHnUc_dogmwH5QGi3tTz21a1T4WrRly8vyQKxK44g_W9cLpo0UHgdkv63Uz1KtQfVcW34IIh6iWk7RkYPHGXElM2P5W-sjPw94ZCd2pmuIXX6y8XjWY9GI7IwRlDaqOlEla3dWGbRxsvoyZojz1YANDFgK0vvldcpqw0jVkabegc5m_UvaM7hGmlGbYDtEXCkq5tN2YEDIcNIaf2yzwJTfBzSBLdWki02WLwcHmy5LldpAdnVANQ'
  );
  const [isSaving, setIsSaving] = useState(false);

  const coverOptions = [
    {
      id: 'opt-1',
      label: 'ACTIVE',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCy6CpHnUc_dogmwH5QGi3tTz21a1T4WrRly8vyQKxK44g_W9cLpo0UHgdkv63Uz1KtQfVcW34IIh6iWk7RkYPHGXElM2P5W-sjPw94ZCd2pmuIXX6y8XjWY9GI7IwRlDaqOlEla3dWGbRxsvoyZojz1YANDFgK0vvldcpqw0jVkabegc5m_UvaM7hGmlGbYDtEXCkq5tN2YEDIcNIaf2yzwJTfBzSBLdWki02WLwcHmy5LldpAdnVANQ',
      alt: 'Crimson Japanese maple leaves in Kyoto',
    },
    {
      id: 'opt-2',
      label: 'TOKYO',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3D1DXkFgLmK1dyh6HOk4R6cWhuVQke6nz1pU3OOVBCiNQdkU4LaW0wT1kAT5uOKjC_xI0tCK5KHMAmX9rX1JBbLeHJakWrd5AJi9lUjJFOarhBOz1iyEBJcgnkteeln5XbhLB7wSkuNA06YDIM1XtXhO_UpNhWSp3jaXT5U0C6DhcMbDjvrUK5VfxC5v2nu9lmf30Bo9ybvBAc4mknTmeP-Qn3pLd_8Pi-_51VNc10YBOzOK-rhgimA',
      alt: 'Illuminated Tokyo Skyline at dusk',
    },
    {
      id: 'opt-3',
      label: 'ARASHIYAMA',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9Lpj9YhBtJm3AkZa7mTzBupzXUWhXPZfjoUOocGgT_sUj9EYP509-gKYG-Tfw4KxkOv4GJa-uijo15sP3OrldcKpjDIYWa-1HKKNfber7b7j4BZYRoYhww6t1geePHiDAuL6HrmNway_d_RC6A_EPl9GfTYlbEjoAvrY76wKZ_VtykkMok8BOJ_c_nosqYfCDa887WHh0ntoMUjTaRHq4fKoYOcDUqjZ-fPFTT1ap4sPT9XVG-PVVsA',
      alt: 'Bamboo forest path in Arashiyama',
    },
    {
      id: 'opt-4',
      label: 'FUJI',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtCf-qv3Z1X29GBXh4lp7gfp3h833cIURhc8suT-m0Fy8R4nKM--qDO2-LyuBJmkjkI_-FFcruxx9yNuWYb1zVQ2a0L3JsKB4sc56sjiCS_TCxxUMTdG7-ygph5EL1dmwNPvMTApOSY6fBWR1wJQMKtt8CXms7osC7NDhDMbll-1kyK-WLghC639xRtM2L6i65l4TiTUZ8YrYPw1AFumrBCX_QNCXjybFSaCG-BMS3e9jTKJX_v4flXA',
      alt: 'Mt Fuji reflected in calm lake water',
    },
  ];

  useEffect(() => {
    if (editingTrip) {
      setTitle(editingTrip.title);
      setStartDate(editingTrip.startDate);
      setEndDate(editingTrip.endDate);
      setBudget(editingTrip.estimatedBudget.toLocaleString('en-US', { minimumFractionDigits: 2 }));
      setNotes(editingTrip.notes || '');
      setSelectedCover(editingTrip.coverImage);
      setPrivacy(editingTrip.privacy || 'collaborative');
    } else {
      setTitle('New Kyoto Journey');
      setStartDate('Nov 12, 2025');
      setEndDate('Nov 20, 2025');
      setBudget('2,450.00');
      setNotes('');
      setPrivacy('collaborative');
    }
  }, [editingTrip, isEditTripModalOpen]);

  if (!isEditTripModalOpen) return null;

  const handleAddDest = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newDestInput.trim()) {
      e.preventDefault();
      setDestinations([...destinations, newDestInput.trim()]);
      setNewDestInput('');
    }
  };

  const handleRemoveDest = (d: string) => {
    setDestinations(destinations.filter((item) => item !== d));
  };

  const handleAddSuggested = (d: string) => {
    if (!destinations.includes(d)) {
      setDestinations([...destinations, d]);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    const parsedBudget = parseFloat(budget.replace(/[^0-9.]/g, '')) || 2450;

    setTimeout(() => {
      if (editingTrip) {
        updateTrip(editingTrip.id, {
          title,
          startDate,
          endDate,
          estimatedBudget: parsedBudget,
          notes,
          coverImage: selectedCover,
          privacy,
          destinationRegion: destinations.join(' & '),
        });
      } else {
        addTrip({
          title: title || 'Untitled Expedition',
          destinationRegion: destinations.join(' & ') || 'Japan',
          country: 'Japan',
          dateRange: `${startDate} – ${endDate}`,
          startDate,
          endDate,
          daysCount: 8,
          status: 'planned',
          statusLabel: 'PLANNED',
          seasonTag: 'Autumn 2025',
          estimatedBudget: parsedBudget,
          currency: 'USD',
          budgetCap: parsedBudget * 1.25,
          activitiesCount: 10,
          accommodationsCount: 2,
          coverImage: selectedCover,
          coverImageAlt: 'Custom travel backdrop',
          routeLabel: `${destinations[0] || 'Start'} ➔ ${destinations[1] || 'End'}`,
          notes,
          privacy,
        });
      }
      setIsSaving(false);
      setIsEditTripModalOpen(false);
      setActiveTab('dossier');
    }, 500);
  };

  return (
    <div
      id="modal-container"
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-space-md overflow-y-auto bg-inverse-surface/45 backdrop-blur-sm transition-all duration-300"
    >
      <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-t-3xl lg:rounded-xl shadow-2xl flex flex-col max-h-[92vh] lg:max-h-none my-0 lg:my-auto overflow-hidden border-t lg:border border-surface-container-high/70 animate-in slide-in-from-bottom lg:zoom-in-95 duration-200">
        {/* Mobile Drag Indicator */}
        <div className="lg:hidden pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Top Colored Accent Rail */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary-container via-secondary to-secondary-container shrink-0" />

        {/* Modal Header */}
        <div className="px-gutter-md pt-gutter-md pb-space-md bg-surface-container-lowest flex items-start justify-between border-b border-surface-container-high/40">
          <div className="flex flex-col gap-1 pr-4">
            <div className="flex items-center gap-space-xs">
              <span className="font-badge text-badge uppercase tracking-wider text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded-full">
                Itinerary Architect
              </span>
              <span className="font-caption text-caption text-on-surface-variant">• ID #TRP-8492</span>
            </div>
            <h2 className="font-page-title text-page-title text-on-surface mt-1">
              {editingTrip ? `Edit Trip: ${editingTrip.title}` : 'Draft New Expedition'}
            </h2>
            <p className="font-small text-small text-on-surface-variant">
              Draft route dates, overall budget cap, and high-level travel notes.
            </p>
          </div>
          <button
            onClick={() => setIsEditTripModalOpen(false)}
            aria-label="Close modal"
            className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <form
          className="px-gutter-md py-space-sm flex flex-col gap-space-lg overflow-y-auto max-h-[calc(86vh-140px)]"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          {/* Field 1: Trip Title */}
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <label
                className="font-body-medium text-small text-on-surface flex items-center gap-1 font-semibold"
                htmlFor="trip-title-input"
              >
                Trip Title <span className="text-secondary">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="font-caption text-caption text-on-surface-variant">
                  {title.length}/60
                </span>
                <span className="flex items-center text-primary-container" title="Valid name length">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                </span>
              </div>
            </div>
            <div className="relative">
              <input
                className="w-full h-[44px] px-3.5 pr-10 bg-surface-container-low focus:bg-surface-container-lowest text-on-surface rounded-lg font-body text-body shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container transition-all"
                id="trip-title-input"
                maxLength={60}
                placeholder="e.g. Kyoto & Tokyo Autumn Discovery"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary-container text-[20px]">
                verified
              </span>
            </div>
            <span className="font-caption text-caption text-primary-container flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">done_all</span> Name available and
              synced across connected travel boards.
            </span>
          </div>

          {/* Field 2: Target Destinations & Regions */}
          <div className="flex flex-col gap-space-xs">
            <label className="font-body-medium text-small text-on-surface font-semibold">
              Target Destinations &amp; Regions
            </label>
            <div className="min-h-[44px] p-1.5 bg-surface-container-low rounded-lg flex flex-wrap items-center gap-1.5 focus-within:ring-2 focus-within:ring-primary-container transition-all shadow-sm">
              {destinations.map((d) => (
                <div
                  key={d}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-container text-on-primary font-caption text-caption"
                >
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  <span>{d}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDest(d)}
                    className="hover:text-error-container transition-colors ml-0.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-variant text-primary font-caption text-caption">
                <span>Japan (Country)</span>
              </div>
              <input
                className="flex-1 min-w-[130px] h-7 px-2 bg-transparent text-on-surface font-caption text-caption focus:outline-none placeholder:text-on-surface-variant"
                placeholder="+ Add destination..."
                type="text"
                value={newDestInput}
                onChange={(e) => setNewDestInput(e.target.value)}
                onKeyDown={handleAddDest}
              />
            </div>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="font-caption text-caption text-on-surface-variant">Recommended nearby:</span>
              {['OSAKA', 'HAKONE', 'NARA'].map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleAddSuggested(city)}
                  className="px-2 py-0.5 rounded-full bg-surface-container-high hover:bg-surface-container text-on-surface font-badge text-badge transition-colors cursor-pointer"
                >
                  + {city}
                </button>
              ))}
            </div>
          </div>

          {/* Field 3: Date Range Picker & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <label className="font-body-medium text-small text-on-surface font-semibold" htmlFor="start-date">
                Start Date
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  calendar_today
                </span>
                <input
                  className="w-full h-[44px] pl-10 pr-3 bg-surface-container-low text-on-surface rounded-lg font-body text-body shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                  id="start-date"
                  type="text"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <label className="font-body-medium text-small text-on-surface font-semibold" htmlFor="end-date">
                  End Date
                </label>
                <span className="bg-surface-variant text-primary font-badge text-badge px-2 py-0.5 rounded-full">
                  8 DAYS CALCULATED
                </span>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  event
                </span>
                <input
                  className="w-full h-[44px] pl-10 pr-3 bg-surface-container-low text-on-surface rounded-lg font-body text-body shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                  id="end-date"
                  type="text"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Seasonal Advisory Banner */}
          <div className="p-space-sm bg-secondary-fixed/40 rounded-lg flex items-start gap-space-sm shadow-sm">
            <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
              warning
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-body-medium text-small text-on-secondary-fixed font-semibold">
                Autumn Foliage Peak Season Advisory
              </span>
              <span className="font-caption text-caption text-on-surface-variant">
                Selected dates overlap with Momiji peak season across Kansai. Hotel inventory decreases
                rapidly; Shinkansen seat reserves are recommended 30 days prior.
              </span>
            </div>
          </div>

          {/* Field 4: Estimated Budget */}
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <label className="font-body-medium text-small text-on-surface font-semibold">
                Estimated Total Budget
              </label>
              <span className="font-caption text-caption text-secondary flex items-center gap-1 font-body-medium">
                <span className="material-symbols-outlined text-[14px]">trending_up</span> +15% over standard
                plan
              </span>
            </div>
            <div className="grid grid-cols-3 gap-space-sm">
              <div className="col-span-1 relative">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full h-[44px] px-3 bg-surface-container-low text-on-surface rounded-lg font-body text-body appearance-none shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer"
                >
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                  <option>JPY (¥)</option>
                  <option>GBP (£)</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
                  expand_more
                </span>
              </div>
              <div className="col-span-2 relative">
                <input
                  className="w-full h-[44px] px-3 bg-surface-container-low text-on-surface rounded-lg font-body text-body shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                  type="text"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
                <span className="font-badge text-badge text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2">
                  PER TRAVELER
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-secondary font-caption text-caption pt-0.5">
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span>
                Budget exceeds recommended single traveler baseline ($2,130.00) by 15% due to high season ryokan pricing.
              </span>
            </div>
          </div>

          {/* Field 5: Privacy & Permissions */}
          <div className="flex flex-col gap-space-xs">
            <label className="font-body-medium text-small text-on-surface font-semibold">
              Privacy &amp; Collaborator Permissions
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
              <div
                onClick={() => setPrivacy('collaborative')}
                className={`p-space-sm rounded-lg flex items-start gap-space-sm cursor-pointer shadow-sm transition-all ${
                  privacy === 'collaborative'
                    ? 'bg-surface-container ring-1 ring-primary'
                    : 'bg-surface-container-low hover:bg-surface-container'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-primary-container flex items-center justify-center shrink-0 mt-0.5">
                  {privacy === 'collaborative' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-surface-container-lowest" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-body-medium text-small text-on-surface font-semibold">
                    Elena &amp; Liam
                  </span>
                  <span className="font-caption text-caption text-on-surface-variant">
                    Shared workspace. 2 editors can adjust daily timeline slots.
                  </span>
                </div>
              </div>

              <div
                onClick={() => setPrivacy('private')}
                className={`p-space-sm rounded-lg flex items-start gap-space-sm cursor-pointer transition-all shadow-sm ${
                  privacy === 'private'
                    ? 'bg-surface-container ring-1 ring-primary'
                    : 'bg-surface-container-low hover:bg-surface-container'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 mt-0.5">
                  {privacy === 'private' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-surface-container-lowest" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-body-medium text-small text-on-surface font-semibold">
                    Private Draft Only
                  </span>
                  <span className="font-caption text-caption text-on-surface-variant">
                    Restricted to your personal explorer dashboard.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Field 6: Trip Notes */}
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <label
                className="font-body-medium text-small text-on-surface font-semibold"
                htmlFor="trip-notes"
              >
                Logistics Notes &amp; Curatorial Focus
              </label>
              <span className="font-caption text-caption text-on-surface-variant">Markdown supported</span>
            </div>
            <textarea
              className="w-full p-3 bg-surface-container-low text-on-surface rounded-lg font-body text-body shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container resize-none"
              id="trip-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Field 7: Cover Image Selection */}
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <label className="font-body-medium text-small text-on-surface font-semibold">
                Trip Cover Backdrop
              </label>
              <button
                className="font-caption text-caption text-primary hover:text-primary-container flex items-center gap-1 font-body-medium cursor-pointer"
                type="button"
                onClick={() => alert('Custom photo uploaded successfully!')}
              >
                <span className="material-symbols-outlined text-[14px]">cloud_upload</span> Upload custom photo
              </button>
            </div>
            <div className="grid grid-cols-4 gap-space-sm">
              {coverOptions.map((opt) => {
                const isSelected = selectedCover === opt.url;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedCover(opt.url)}
                    className={`relative h-20 rounded-lg overflow-hidden shadow-sm cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-secondary shadow-md' : 'hover:opacity-90'
                    }`}
                  >
                    <img
                      alt={opt.alt}
                      src={opt.url}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary-container/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-primary text-[20px] bg-secondary rounded-full p-0.5">
                          check
                        </span>
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1.5 font-badge text-badge text-on-primary bg-on-surface/70 px-1 rounded backdrop-blur-sm">
                      {opt.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-gutter-md py-space-md bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-sm border-t border-surface-container-high/60 shrink-0 sticky bottom-0 pb-safe">
          <div className="flex items-center gap-space-xs text-on-surface-variant font-caption text-caption">
            <span className="material-symbols-outlined text-[16px] text-primary-container">sync</span>
            <span>Autosaved draft moments ago</span>
          </div>
          <div className="flex items-center gap-space-sm w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsEditTripModalOpen(false)}
              className="h-[44px] px-5 rounded-lg text-primary hover:bg-surface-container-high font-button text-button transition-colors cursor-pointer"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="h-[44px] px-6 rounded-lg bg-secondary hover:bg-secondary-container text-on-secondary font-button text-button flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer"
              type="button"
            >
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                  <span>Saving Route...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">check</span>
                  <span>Save Trip &amp; Continue to Itinerary</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
