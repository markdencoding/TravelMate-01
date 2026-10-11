import { getTrips } from '@/lib/data/trips';
import { DashboardScreen } from '@/screens/DashboardScreen';

export default async function DashboardPage() {
  const { data: initialTrips } = await getTrips();
  return <DashboardScreen initialTrips={initialTrips} />;
}
