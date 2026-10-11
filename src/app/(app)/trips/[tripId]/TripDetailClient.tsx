'use client';

import React, { useEffect } from 'react';
import { useTravelStore } from '@/store';
import { CalendarScreen } from '@/screens/CalendarScreen';
import type { Trip } from '@/types';

interface TripDetailClientProps {
  tripId: string;
  initialTrip?: Trip | null;
}

export const TripDetailClient: React.FC<TripDetailClientProps> = ({
  tripId,
  initialTrip,
}) => {
  const { setActiveTripId, addTrip, trips } = useTravelStore();

  useEffect(() => {
    if (tripId) {
      setActiveTripId(tripId);
    }
    if (initialTrip) {
      const exists = trips.some((t) => t.id === initialTrip.id);
      if (!exists) {
        addTrip(initialTrip);
      }
    }
  }, [tripId, initialTrip, setActiveTripId, addTrip, trips]);

  return <CalendarScreen />;
};
