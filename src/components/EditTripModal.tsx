'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTravelStore } from '../store';
import { calculateDaysCount, formatDateRange } from '@/lib/dates';
import {
  createTripAction,
  updateTripAction,
  deleteTripAction,
  getDestinationsForTripAction,
} from '@/app/actions/trips';
import type { PlaceItem } from '@/lib/validators/places';
import type { RecommendationItem } from '@/lib/recommendations';
import { PlaceSearchInput } from './PlaceSearchInput';
import type { PlaceSuggestion } from '@/lib/validators/suggestions';
import type { PhotoSuggestion } from '@/lib/validators/photos';

export interface DestinationChipItem {
  id?: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

function toIsoDate(str: string | undefined, fallback: string): string {
  if (!str) return fallback;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch {}
  return fallback;
}

export const EditTripModal: React.FC = () => {
  const router = useRouter();
  const { isEditTripModalOpen, setIsEditTripModalOpen, editingTrip, updateTrip, addTrip, deleteTrip } =
    useTravelStore();

  const [title, setTitle] = useState('');
  const [destinations, setDestinations] = useState<DestinationChipItem[]>([]);
  const [newDestInput, setNewDestInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [budget, setBudget] = useState('');
  const [privacy, setPrivacy] = useState<'collaborative' | 'private'>('collaborative');
  const [notes, setNotes] = useState('');

  // Cover photo selection state (optional, defaults to empty)
  const [selectedCover, setSelectedCover] = useState<string>('');
  const [selectedCoverAlt, setSelectedCoverAlt] = useState<string>('');
  const [selectedCoverCredit, setSelectedCoverCredit] = useState<string>('');
  const [selectedCoverCreditUrl, setSelectedCoverCreditUrl] = useState<string>('');

  // Destination photo suggestions state
  const [photoSuggestions, setPhotoSuggestions] = useState<PhotoSuggestion[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [activePhotoDestIndex, setActivePhotoDestIndex] = useState<number>(0);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Destination Search State
  const [searchResults, setSearchResults] = useState<PlaceItem[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [placeSearchError, setPlaceSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(-1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Country Recommendations State
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendedCountry, setRecommendedCountry] = useState<string>('');

  // Initialize Modal form state
  useEffect(() => {
    if (editingTrip) {
      setTitle(editingTrip.title);
      setStartDate(toIsoDate(editingTrip.startDate, ''));
      setEndDate(toIsoDate(editingTrip.endDate, ''));
      setDateError(null);
      setTitleError(null);
      setFormError(null);
      setBudget(
        editingTrip.budget || editingTrip.estimatedBudget
          ? (editingTrip.budget ?? editingTrip.estimatedBudget ?? 0).toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })
          : ''
      );
      setNotes(editingTrip.notes || '');
      setSelectedCover(editingTrip.coverImage || '');
      setSelectedCoverAlt(editingTrip.coverImageAlt || '');
      setSelectedCoverCredit(editingTrip.coverImageCredit || '');
      setSelectedCoverCreditUrl(editingTrip.coverImageCreditUrl || '');
      setPrivacy(editingTrip.privacy || 'collaborative');

      // Load destinations from database
      getDestinationsForTripAction(editingTrip.id).then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setDestinations(
            res.data.map((d: any) => ({
              id: d.id,
              name: d.name,
              country: d.country || editingTrip.country || '',
              latitude: d.latitude || 0,
              longitude: d.longitude || 0,
            }))
          );
        } else if (editingTrip.destinations && editingTrip.destinations.length > 0) {
          setDestinations(
            editingTrip.destinations.map((name) => ({
              name,
              country: editingTrip.country || '',
              latitude: 0,
              longitude: 0,
            }))
          );
        } else if (editingTrip.destinationRegion) {
          setDestinations(
            editingTrip.destinationRegion
              .split(' & ')
              .map((s) => s.trim())
              .filter(Boolean)
              .map((name) => ({
                name,
                country: editingTrip.country || '',
                latitude: 0,
                longitude: 0,
              }))
          );
        } else {
          setDestinations([]);
        }
      });
    } else {
      // Create new trip: start completely clean with NO demo content
      setTitle('');
      setStartDate('');
      setEndDate('');
      setDateError(null);
      setTitleError(null);
      setFormError(null);
      setBudget('');
      setNotes('');
      setSelectedCover('');
      setSelectedCoverAlt('');
      setSelectedCoverCredit('');
      setSelectedCoverCreditUrl('');
      setPhotoSuggestions([]);
      setPhotoError(null);
      setActivePhotoDestIndex(0);
      setPrivacy('collaborative');
      setDestinations([]);
      setSearchResults([]);
      setPlaceSearchError(null);
      setRecommendations([]);
      setRecommendedCountry('');
    }
  }, [editingTrip, isEditTripModalOpen]);

  // Fetch destination photo suggestions from /api/photos
  useEffect(() => {
    if (destinations.length === 0) {
      setPhotoSuggestions([]);
      setPhotoError(null);
      setIsLoadingPhotos(false);
      return;
    }

    const safeIndex =
      activePhotoDestIndex < destinations.length ? activePhotoDestIndex : 0;
    const targetDest = destinations[safeIndex];
    if (!targetDest || !targetDest.name) return;

    let isMounted = true;
    setIsLoadingPhotos(true);
    setPhotoError(null);

    const params = new URLSearchParams();
    params.set('query', targetDest.name);
    if (targetDest.country) {
      params.set('country', targetDest.country);
    }

    fetch(`/api/photos?${params.toString()}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Photo provider error');
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          if (data.success && Array.isArray(data.data)) {
            setPhotoSuggestions(data.data);
            setPhotoError(null);
          } else {
            setPhotoSuggestions([]);
            setPhotoError(data.error?.message || null);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Photos suggestion error:', err);
          setPhotoSuggestions([]);
          setPhotoError('Photo suggestions are temporarily unavailable.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingPhotos(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [destinations, activePhotoDestIndex]);

  // Handle outside click to dismiss place dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch Country Recommendations when country is identified
  useEffect(() => {
    // Detect country from chosen destinations
    const foundCountry =
      destinations.find((d) => d.country && d.country.trim().length > 1)?.country ||
      destinations.find((d) => ['japan', 'italy', 'france', 'spain', 'philippines', 'thailand', 'norway', 'scotland'].includes(d.name.toLowerCase()))?.name ||
      '';

    if (!foundCountry || foundCountry.trim().length < 2) {
      setRecommendations([]);
      setRecommendedCountry('');
      return;
    }

    if (foundCountry.toLowerCase() === recommendedCountry.toLowerCase()) {
      return;
    }

    let isMounted = true;
    setIsLoadingRecommendations(true);
    setRecommendedCountry(foundCountry);

    fetch(`/api/recommendations?country=${encodeURIComponent(foundCountry)}`)
      .then((res) => (res.ok ? res.json() : { recommendations: [] }))
      .then((data) => {
        if (isMounted) {
          setRecommendations(Array.isArray(data.recommendations) ? data.recommendations : []);
          setIsLoadingRecommendations(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setRecommendations([]);
          setIsLoadingRecommendations(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [destinations, recommendedCountry]);

  if (!isEditTripModalOpen) return null;

  // Search Places through /api/places (Nominatim fallback)
  const handlePerformSearch = async (queryText?: string) => {
    const q = (typeof queryText === 'string' ? queryText : newDestInput).trim();
    if (!q) return;

    setIsSearchingPlaces(true);
    setPlaceSearchError(null);
    setHasSearched(true);
    setIsDropdownOpen(true);
    setActiveDropdownIndex(-1);

    try {
      const res = await fetch(`/api/places?q=${encodeURIComponent(q)}`);
      const data = await res.json();

      if (!res.ok) {
        setPlaceSearchError(data.error || `Search failed with status ${res.status}`);
        setSearchResults([]);
      } else {
        setSearchResults(data.places || []);
      }
    } catch {
      setPlaceSearchError('Unable to connect to place service. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  const handleSelectSuggestion = (suggestion: PlaceSuggestion) => {
    // Prevent duplicate destinations by case-insensitive name
    const alreadyExists = destinations.some(
      (d) => d.name.toLowerCase() === suggestion.name.toLowerCase()
    );

    if (!alreadyExists) {
      const isCountry = suggestion.kind === 'country';
      const newChip: DestinationChipItem = {
        id: suggestion.id,
        name: suggestion.name,
        country: isCountry ? suggestion.name : (suggestion.country || ''),
        latitude: suggestion.latitude || 0,
        longitude: suggestion.longitude || 0,
      };
      setDestinations((prev) => [...prev, newChip]);
    }

    setSearchResults([]);
    setIsDropdownOpen(false);
    setPlaceSearchError(null);
  };

  const handleSelectPlace = (place: PlaceItem) => {
    // Prevent duplicate destinations by name
    const alreadyExists = destinations.some(
      (d) => d.name.toLowerCase() === place.name.toLowerCase()
    );

    if (!alreadyExists) {
      const newChip: DestinationChipItem = {
        id: place.id,
        name: place.name,
        country: place.country || '',
        latitude: place.latitude || 0,
        longitude: place.longitude || 0,
      };
      setDestinations((prev) => [...prev, newChip]);
    }

    setNewDestInput('');
    setSearchResults([]);
    setIsDropdownOpen(false);
    setActiveDropdownIndex(-1);
    setPlaceSearchError(null);
  };

  const handleAddRecommendation = (rec: RecommendationItem) => {
    const alreadyExists = destinations.some(
      (d) => d.name.toLowerCase() === rec.name.toLowerCase()
    );
    if (!alreadyExists) {
      setDestinations((prev) => [
        ...prev,
        {
          id: rec.id,
          name: rec.name,
          country: rec.country,
          latitude: rec.latitude,
          longitude: rec.longitude,
        },
      ]);
    }
  };

  const handleRemoveDest = (nameToRemove: string) => {
    setDestinations((prev) => prev.filter((d) => d.name !== nameToRemove));
  };

  // Keyboard Navigation for Combobox
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isDropdownOpen && searchResults.length > 0) {
        setIsDropdownOpen(true);
      }
      setActiveDropdownIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveDropdownIndex((prev) =>
        prev > 0 ? prev - 1 : searchResults.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isDropdownOpen && activeDropdownIndex >= 0 && searchResults[activeDropdownIndex]) {
        handleSelectPlace(searchResults[activeDropdownIndex]);
      } else {
        handlePerformSearch();
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const isTitleValid = title.trim().length >= 1 && title.trim().length <= 60;
  const hasValidDates = Boolean(
    startDate &&
      endDate &&
      /^\d{4}-\d{2}-\d{2}$/.test(startDate) &&
      /^\d{4}-\d{2}-\d{2}$/.test(endDate) &&
      endDate >= startDate
  );
  const calculatedDays = hasValidDates ? calculateDaysCount(startDate, endDate) : null;

  const handleSave = async () => {
    if (!title.trim()) {
      setTitleError('Trip title is required');
      return;
    }
    if (title.trim().length > 60) {
      setTitleError('Trip title cannot exceed 60 characters');
      return;
    }
    setTitleError(null);

    if (!startDate || !endDate) {
      setDateError('Please select both start and end dates');
      return;
    }

    if (endDate < startDate) {
      setDateError('End date cannot be before start date');
      return;
    }
    setDateError(null);
    setFormError(null);

    setIsSaving(true);
    const parsedBudget = parseFloat(budget.replace(/[^0-9.]/g, '')) || 0;
    const computedDays = calculateDaysCount(startDate, endDate);
    const computedRange = formatDateRange(startDate, endDate);

    const derivedRegion =
      destinations.length > 0 ? destinations.map((d) => d.name).join(' & ') : '';
    const derivedCountry =
      destinations.find((d) => d.country)?.country || 'Global';

    try {
      if (editingTrip) {
        const res = await updateTripAction({
          id: editingTrip.id,
          title: title.trim(),
          startDate,
          endDate,
          budget: parsedBudget,
          currency: 'PHP',
          notes,
          coverImage: selectedCover || '',
          coverImageAlt: selectedCover ? (selectedCoverAlt || `${title.trim()} cover`) : '',
          coverImageCredit: selectedCover ? selectedCoverCredit : '',
          coverImageCreditUrl: selectedCover ? selectedCoverCreditUrl : '',
          destinationRegion: derivedRegion,
          country: derivedCountry,
          destinations: destinations.map((d, index) => ({
            name: d.name,
            country: d.country,
            latitude: d.latitude,
            longitude: d.longitude,
            orderIndex: index,
          })),
        });

        if (res.success && res.data) {
          updateTrip(editingTrip.id, {
            ...res.data,
            coverImage: selectedCover || '',
            coverImageAlt: selectedCover ? (selectedCoverAlt || `${title.trim()} cover`) : '',
            coverImageCredit: selectedCover ? selectedCoverCredit : '',
            coverImageCreditUrl: selectedCover ? selectedCoverCreditUrl : '',
            destinations: destinations.map((d) => d.name),
          });
          setIsEditTripModalOpen(false);
          router.push('/trips');
          router.refresh();
        } else {
          setFormError(res.error || 'Failed to update trip.');
          return;
        }
      } else {
        const res = await createTripAction({
          title: title.trim(),
          destinationRegion: derivedRegion,
          country: derivedCountry,
          startDate,
          endDate,
          budget: parsedBudget,
          currency: 'PHP',
          notes,
          coverImage: selectedCover || '',
          coverImageAlt: selectedCover ? (selectedCoverAlt || `${title.trim()} cover`) : '',
          coverImageCredit: selectedCover ? selectedCoverCredit : '',
          coverImageCreditUrl: selectedCover ? selectedCoverCreditUrl : '',
          destinations: destinations.map((d, index) => ({
            name: d.name,
            country: d.country,
            latitude: d.latitude,
            longitude: d.longitude,
            orderIndex: index,
          })),
        });

        if (res.success && res.data) {
          addTrip({
            ...res.data,
            coverImage: selectedCover || '',
            coverImageAlt: selectedCover ? (selectedCoverAlt || `${title.trim()} cover`) : '',
            coverImageCredit: selectedCover ? selectedCoverCredit : '',
            coverImageCreditUrl: selectedCover ? selectedCoverCreditUrl : '',
            destinations: destinations.map((d) => d.name),
          });
          setIsEditTripModalOpen(false);
          router.push('/trips');
          router.refresh();
        } else {
          setFormError(res.error || 'Failed to create trip.');
          return;
        }
      }
    } catch (err: any) {
      console.warn('Trip action failed:', err);
      setFormError(err?.message || 'An unexpected error occurred while saving trip.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (!editingTrip) return;
    if (
      typeof window !== 'undefined' &&
      !window.confirm(`Are you sure you want to delete "${editingTrip.title}"?`)
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTripAction(editingTrip.id);
    } catch (err) {
      console.warn('Delete trip server action error:', err);
    } finally {
      deleteTrip(editingTrip.id);
      setIsDeleting(false);
      setIsEditTripModalOpen(false);
      router.push('/trips');
    }
  };

  return (
    <div
      id="modal-container"
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-space-md overflow-y-auto bg-black/60 backdrop-blur-sm transition-all duration-300"
    >
      <div
        className="w-full max-w-[760px] bg-surface rounded-t-2xl lg:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-surface-container-high animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Modal Header */}
        <div className="px-gutter-md py-space-md bg-surface-container-low flex items-center justify-between border-b border-surface-container-high/60 shrink-0">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[22px]">edit_calendar</span>
            </div>
            <div className="flex flex-col">
              <span className="font-badge text-badge text-secondary font-mono tracking-widest uppercase">
                {editingTrip ? 'Trip Planner • Edit Mode' : 'Trip Planner • New Trip'}
              </span>
              <h2 id="modal-title" className="font-display font-bold text-title text-on-surface">
                {editingTrip ? 'Edit Trip Details' : 'Create New Trip'}
              </h2>
            </div>
          </div>
          <button
            onClick={() => setIsEditTripModalOpen(false)}
            aria-label="Close dialog"
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="p-gutter-md overflow-y-auto flex-1 flex flex-col gap-space-lg custom-scrollbar"
        >
          {formError && (
            <div
              role="alert"
              className="p-3 bg-error/10 border border-error/30 text-error rounded-xl flex items-start gap-2.5 text-xs font-semibold"
            >
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <span>{formError}</span>
            </div>
          )}

          {/* Field 1: Trip Title */}
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <label className="font-body-medium text-small text-on-surface font-semibold" htmlFor="trip-title-input">
                Trip / Expedition Name *
              </label>
              <div className="flex items-center gap-1.5">
                <span className="font-caption text-caption text-on-surface-variant">
                  {title.length}/60
                </span>
                {isTitleValid && (
                  <span className="flex items-center text-primary" title="Valid name length">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  </span>
                )}
              </div>
            </div>
            <div className="relative">
              <input
                className={`w-full h-[44px] px-3.5 pr-10 bg-surface-container-low focus:bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/60 rounded-lg font-body text-body shadow-sm focus:outline-none focus:ring-2 ${
                  titleError ? 'ring-2 ring-error' : 'focus:ring-primary-container'
                } transition-all`}
                id="trip-title-input"
                maxLength={60}
                placeholder="e.g. Kyoto & Tokyo Autumn Discovery"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError && e.target.value.trim()) setTitleError(null);
                }}
              />
              {isTitleValid && (
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary text-[20px]">
                  verified
                </span>
              )}
            </div>
            {titleError && (
              <span className="text-[11px] text-error dark:text-rose-400 font-medium">{titleError}</span>
            )}
          </div>

          {/* Field 2: Target Destinations & Regions */}
          <div className="flex flex-col gap-space-xs" ref={searchContainerRef}>
            <div className="flex items-center justify-between">
              <label className="font-body-medium text-small text-on-surface font-semibold">
                Target Destinations &amp; Regions
              </label>
              <span className="font-caption text-[11px] text-on-surface-variant">
                Live suggestions • Press Enter to search
              </span>
            </div>

            {/* Selected Destination Chips */}
            {destinations.length > 0 && (
              <div className="min-h-[40px] p-2 bg-surface-container-low rounded-xl flex flex-wrap items-center gap-1.5 shadow-xs border border-surface-container-high dark:border-outline-variant">
                {destinations.map((d) => (
                  <div
                    key={d.name}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-container text-white dark:text-teal-100 font-caption text-caption shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    <span className="font-medium">{d.name}</span>
                    {d.country && (
                      <span className="text-[10px] text-white/80 dark:text-teal-200/90 font-normal">({d.country})</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveDest(d.name)}
                      className="hover:text-rose-300 dark:hover:text-rose-400 transition-colors ml-0.5 cursor-pointer p-0.5 rounded-full"
                      title={`Remove ${d.name}`}
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Reusable PlaceSearchInput Combobox */}
            <div className="relative">
              <PlaceSearchInput
                id="trip-destination-search-input"
                placeholder={
                  destinations.length === 0
                    ? "Search destination (e.g. Tokyo, Kyoto, Paris, Boracay)..."
                    : "+ Add another destination..."
                }
                onSelectSuggestion={handleSelectSuggestion}
                onSubmitQuery={handlePerformSearch}
              />

              {/* Autocomplete / Search Results Dropdown Fallback */}
              {isDropdownOpen && (
                <div
                  className="absolute left-0 right-0 top-full mt-1.5 bg-surface dark:bg-surface-container-high rounded-xl shadow-xl border border-surface-container-high dark:border-outline-variant z-50 overflow-hidden max-h-[260px] overflow-y-auto custom-scrollbar"
                  role="listbox"
                >
                  {isSearchingPlaces ? (
                    <div className="p-4 text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[16px] animate-spin text-primary">
                        progress_activity
                      </span>
                      <span>Searching destinations...</span>
                    </div>
                  ) : placeSearchError ? (
                    <div className="p-3.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/60 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">error</span>
                      <span>{placeSearchError}</span>
                    </div>
                  ) : searchResults.length === 0 && hasSearched ? (
                    <div className="p-4 text-center text-xs text-on-surface-variant">
                      No destinations found for &quot;{newDestInput.trim()}&quot;. Press Enter to try another query.
                    </div>
                  ) : (
                    searchResults.map((place, idx) => {
                      const isHighlighted = idx === activeDropdownIndex;
                      const isAdded = destinations.some(
                        (d) => d.name.toLowerCase() === place.name.toLowerCase()
                      );

                      return (
                        <div
                          key={place.id}
                          role="option"
                          aria-selected={isHighlighted}
                          onClick={() => handleSelectPlace(place)}
                          className={`min-h-[44px] px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors border-b last:border-b-0 border-surface-container-high/60 dark:border-outline-variant/40 ${
                            isHighlighted
                              ? 'bg-primary/10 dark:bg-primary/20'
                              : 'hover:bg-surface-container-low dark:hover:bg-surface-container'
                          } ${isAdded ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-[16px]">
                                {place.category === 'nature'
                                  ? 'landscape'
                                  : place.category === 'landmark'
                                  ? 'account_balance'
                                  : place.category === 'culture'
                                  ? 'theater_comedy'
                                  : 'location_on'}
                              </span>
                            </div>
                            <div className="truncate">
                              <span className="font-semibold text-xs text-on-surface block truncate">
                                {place.name}
                              </span>
                              <span className="text-[11px] text-on-surface-variant block truncate">
                                {place.country ? `${place.country} • ` : ''}
                                {place.displayName}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5">
                            {place.categoryLabel && (
                              <span className="font-badge text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant">
                                {place.categoryLabel}
                              </span>
                            )}
                            {isAdded ? (
                              <span className="text-[11px] text-on-surface-variant font-medium">Added</span>
                            ) : (
                              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                                add_circle
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Step 3: Popular in {Country} Recommendations Strip */}
            {isLoadingRecommendations ? (
              <div className="flex items-center gap-2 pt-1 text-xs text-on-surface-variant animate-pulse">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                <span>Finding recommended places in {recommendedCountry}...</span>
              </div>
            ) : recommendations.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="font-caption text-caption text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-primary">explore</span>
                  Popular in {recommendedCountry}:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {recommendations
                    .filter(
                      (rec) =>
                        !destinations.some(
                          (d) => d.name.toLowerCase() === rec.name.toLowerCase()
                        )
                    )
                    .slice(0, 8)
                    .map((rec) => (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => handleAddRecommendation(rec)}
                        className="px-2.5 py-1 rounded-full bg-surface-container-high hover:bg-surface-container text-on-surface font-caption text-caption flex items-center gap-1 transition-colors cursor-pointer"
                        title={`Add ${rec.name} to itinerary`}
                      >
                        <span className="material-symbols-outlined text-[13px] text-primary">add</span>
                        <span>{rec.name}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Field 3: Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <label className="font-body-medium text-small text-on-surface font-semibold" htmlFor="start-date">
                Start date
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  calendar_today
                </span>
                <input
                  className="w-full h-[44px] pl-10 pr-3 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/60 rounded-lg font-body text-body shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container [color-scheme:light] dark:[color-scheme:dark]"
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    const nextStart = e.target.value;
                    setStartDate(nextStart);
                    if (endDate && nextStart > endDate) {
                      setDateError('End date cannot be before start date');
                    } else {
                      setDateError(null);
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <label className="font-body-medium text-small text-on-surface font-semibold" htmlFor="end-date">
                  End date
                </label>
                {hasValidDates && calculatedDays !== null && (
                  <span className="bg-surface-variant text-primary font-badge text-badge px-2 py-0.5 rounded-full font-bold">
                    {calculatedDays} DAYS CALCULATED
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  event
                </span>
                <input
                  className={`w-full h-[44px] pl-10 pr-3 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/60 rounded-lg font-body text-body shadow-sm focus:outline-none focus:ring-2 [color-scheme:light] dark:[color-scheme:dark] ${
                    dateError ? 'ring-2 ring-error' : 'focus:ring-primary-container'
                  }`}
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    const nextEnd = e.target.value;
                    setEndDate(nextEnd);
                    if (startDate && nextEnd < startDate) {
                      setDateError('End date cannot be before start date');
                    } else {
                      setDateError(null);
                    }
                  }}
                />
              </div>
              {dateError && (
                <span className="text-[11px] text-error dark:text-rose-400 font-medium">{dateError}</span>
              )}
            </div>
          </div>

          {/* Field 4: Estimated Budget (₱) */}
          <div className="flex flex-col gap-space-xs">
            <label className="font-body-medium text-small text-on-surface font-semibold" htmlFor="estimated-budget">
              Estimated Total Budget (₱)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-base text-on-surface-variant">
                ₱
              </span>
              <input
                className="w-full h-[44px] pl-9 pr-3 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/60 rounded-lg font-body text-body shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                id="estimated-budget"
                type="text"
                placeholder="50,000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
          </div>

          {/* Field 5: Trip Collaboration & Privacy */}
          <div className="flex flex-col gap-space-xs">
            <label className="font-body-medium text-small text-on-surface font-semibold">
              Route Access &amp; Privacy
            </label>
            <div className="grid grid-cols-2 gap-space-sm">
              <button
                type="button"
                onClick={() => setPrivacy('collaborative')}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1 text-left transition-all cursor-pointer ${
                  privacy === 'collaborative'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-surface-container-high bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <span className="material-symbols-outlined text-[16px]">group</span>
                  <span>Shared Trip</span>
                </div>
                <span className="text-[11px] opacity-80">
                  Shared with travel companions
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPrivacy('private')}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1 text-left transition-all cursor-pointer ${
                  privacy === 'private'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-surface-container-high bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  <span>Private Draft</span>
                </div>
                <span className="text-[11px] opacity-80">
                  Visible only to your account
                </span>
              </button>
            </div>
          </div>

          {/* Field 6: Curator Notes & Logistical Context */}
          <div className="flex flex-col gap-space-xs">
            <label className="font-body-medium text-small text-on-surface font-semibold" htmlFor="curator-notes">
              Curator Notes &amp; Expedition Logistics
            </label>
            <textarea
              className="w-full p-3 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/60 rounded-lg font-body text-body shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container resize-none"
              id="curator-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add key logistics, rail transit guidelines, or hotel confirmation reminders..."
            />
          </div>

          {/* Field 7: Cover photo (optional) */}
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <label className="font-body-medium text-small text-on-surface font-semibold">
                Cover photo (optional)
              </label>
              {selectedCover && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCover('');
                    setSelectedCoverAlt('');
                    setSelectedCoverCredit('');
                    setSelectedCoverCreditUrl('');
                  }}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">close</span>
                  Remove cover
                </button>
              )}
            </div>

            {/* Destination tabs if multiple destinations */}
            {destinations.length > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5 pb-1">
                <span className="text-[11px] text-on-surface-variant font-medium">Photos for:</span>
                {destinations.map((d, idx) => (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => setActivePhotoDestIndex(idx)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      activePhotoDestIndex === idx
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-surface-container-high text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            )}

            {/* Photo Choice Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
              {/* "No cover" choice tile */}
              <div
                onClick={() => {
                  setSelectedCover('');
                  setSelectedCoverAlt('');
                  setSelectedCoverCredit('');
                  setSelectedCoverCreditUrl('');
                }}
                className={`group relative h-22 rounded-lg cursor-pointer border-2 transition-all flex flex-col items-center justify-center gap-1 p-2 ${
                  !selectedCover
                    ? 'border-secondary ring-2 ring-secondary/30 bg-surface-container-high'
                    : 'border-surface-container-high/60 bg-surface-container-low hover:border-outline-variant hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[24px] text-on-surface-variant">
                  image_not_supported
                </span>
                <span className="text-[11px] font-bold text-on-surface tracking-wide">
                  No cover
                </span>
                {!selectedCover && (
                  <div className="absolute top-1.5 right-1.5">
                    <span className="material-symbols-outlined text-secondary text-[16px]">
                      check_circle
                    </span>
                  </div>
                )}
              </div>

              {/* Photo Suggestions or Loading / Empty States */}
              {destinations.length === 0 ? (
                <div className="col-span-1 sm:col-span-3 p-3 rounded-lg border border-dashed border-surface-container-high bg-surface-container-low text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px] opacity-60">add_location_alt</span>
                  <span>Add a destination to see photo suggestions</span>
                </div>
              ) : isLoadingPhotos ? (
                <>
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="h-22 rounded-lg bg-surface-container-high animate-pulse border border-surface-container-high"
                    />
                  ))}
                </>
              ) : photoError ? (
                <div className="col-span-1 sm:col-span-3 p-3 rounded-lg bg-surface-container-low text-xs text-on-surface-variant flex items-center gap-2 border border-surface-container-high">
                  <span className="material-symbols-outlined text-[18px] opacity-60">cloud_off</span>
                  <span>Photo suggestions are temporarily unavailable. You can still save without a cover.</span>
                </div>
              ) : photoSuggestions.length === 0 ? (
                <div className="col-span-1 sm:col-span-3 p-3 rounded-lg bg-surface-container-low text-xs text-on-surface-variant flex items-center justify-center gap-2 border border-surface-container-high">
                  <span className="material-symbols-outlined text-[18px] opacity-60">hide_image</span>
                  <span>No photos found for this destination.</span>
                </div>
              ) : (
                photoSuggestions.map((photo) => {
                  const isSelected = selectedCover === photo.coverUrl;
                  return (
                    <div
                      key={photo.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedCover('');
                          setSelectedCoverAlt('');
                          setSelectedCoverCredit('');
                          setSelectedCoverCreditUrl('');
                        } else {
                          setSelectedCover(photo.coverUrl);
                          setSelectedCoverAlt(photo.alt);
                          setSelectedCoverCredit(
                            photo.creator ? `Photo: ${photo.creator} · ${photo.licenseName} · Wikimedia Commons` : ''
                          );
                          setSelectedCoverCreditUrl(photo.filePageUrl);
                        }
                      }}
                      className={`group relative h-22 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                        isSelected
                          ? 'border-secondary ring-2 ring-secondary/30 scale-[1.02]'
                          : 'border-transparent hover:border-outline-variant opacity-85 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={photo.thumbUrl || photo.coverUrl}
                        alt={photo.alt}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary-container/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-on-primary text-[20px] bg-secondary rounded-full p-0.5">
                            check
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-1 left-1.5 right-1.5 px-1 py-0.5 bg-black/60 rounded text-[9px] font-medium text-white truncate backdrop-blur-xs">
                        {photo.alt}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Active Cover Attribution Caption */}
            {selectedCover && selectedCoverCredit && (
              <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5 pt-1">
                <span className="material-symbols-outlined text-[14px] text-primary">info</span>
                <span>
                  {selectedCoverCreditUrl ? (
                    <a
                      href={selectedCoverCreditUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-primary"
                    >
                      {selectedCoverCredit}
                    </a>
                  ) : (
                    selectedCoverCredit
                  )}
                </span>
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-gutter-md py-space-md bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-sm border-t border-surface-container-high/60 shrink-0 sticky bottom-0 pb-safe">
          <div className="flex items-center gap-space-xs text-on-surface-variant font-caption text-caption">
            {editingTrip && (
              <button
                type="button"
                onClick={handleDeleteTrip}
                disabled={isDeleting || isSaving}
                className="h-[36px] px-3 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-button text-caption flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200 dark:border-rose-900/60"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>{isDeleting ? 'Deleting...' : 'Delete Trip'}</span>
              </button>
            )}
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
              className="h-[44px] px-6 rounded-lg bg-secondary hover:bg-secondary-container text-on-secondary font-button text-button flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
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
                  <span>Save Trip &amp; Continue</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
