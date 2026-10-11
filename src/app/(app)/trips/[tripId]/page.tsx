import { getTripById } from '@/lib/data/trips';
import { TripDetailClient } from './TripDetailClient';

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const { data: initialTrip } = await getTripById(tripId);

  return <TripDetailClient tripId={tripId} initialTrip={initialTrip} />;
}
