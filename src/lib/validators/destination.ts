import { z } from 'zod';

export const addDestinationSchema = z.object({
  tripId: z.string().uuid('Invalid trip ID'),
  name: z.string().trim().min(1, 'Destination name is required').max(200, 'Name is too long'),
  country: z.string().trim().max(100, 'Country is too long').default(''),
  latitude: z.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude'),
  longitude: z.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude'),
});

export type AddDestinationInput = z.infer<typeof addDestinationSchema>;

export interface DestinationItem {
  id: string;
  tripId: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  orderIndex: number;
  arrivalDate?: string | null;
  departureDate?: string | null;
  createdAt: string;
}
