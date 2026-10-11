import { getTrips } from '@/lib/data/trips';
import { TripsScreen } from '@/screens/TripsScreen';

export default async function TripsPage() {
  const { data: initialTrips } = await getTrips();
  return <TripsScreen initialTrips={initialTrips} />;
}
