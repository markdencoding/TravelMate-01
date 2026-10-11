/**
 * TravelMate Database Schema Definitions
 * Reconciled against Supabase linked project schema (CLI 2.120.0).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'traveler' | 'admin';
export type TripStatus = 'planned' | 'ongoing' | 'completed';
export type TripPrivacy = 'collaborative' | 'private';
export type ActivityCategory =
  | 'activities'
  | 'food'
  | 'transport'
  | 'lodging'
  | 'photo'
  | 'nature'
  | 'culture'
  | 'sightseeing'
  | 'dining'
  | 'leisure';

export type ExpenseCategory =
  | 'food'
  | 'activities'
  | 'transport'
  | 'lodging'
  | 'misc'
  | 'dining'
  | 'sightseeing';

export type PaymentStatus =
  | 'paid'
  | 'deposit'
  | 'estimated'
  | 'planned'
  | 'reconciled';

export type NotificationType =
  | 'budget'
  | 'weather'
  | 'document'
  | 'waypoint'
  | 'completed'
  | 'system';

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      destinations: {
        Row: {
          arrival_date: string | null
          country: string
          created_at: string
          departure_date: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          order_index: number
          trip_id: string
          updated_at: string
        }
        Insert: {
          arrival_date?: string | null
          country?: string
          created_at?: string
          departure_date?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          order_index?: number
          trip_id: string
          updated_at?: string
        }
        Update: {
          arrival_date?: string | null
          country?: string
          created_at?: string
          departure_date?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          order_index?: number
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "destinations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          currency: string
          description: string
          expense_date: string
          id: string
          itinerary_item_id: string | null
          notes: string
          payment_status: string
          title: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          currency?: string
          description?: string
          expense_date: string
          id?: string
          itinerary_item_id?: string | null
          notes?: string
          payment_status?: string
          title: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          currency?: string
          description?: string
          expense_date?: string
          id?: string
          itinerary_item_id?: string | null
          notes?: string
          payment_status?: string
          title?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_expenses_item"
            columns: ["trip_id", "itinerary_item_id"]
            isOneToOne: false
            referencedRelation: "itinerary_items"
            referencedColumns: ["trip_id", "id"]
          },
        ]
      }
      itinerary_items: {
        Row: {
          booking_ref: string
          category: string
          cost: number
          created_at: string
          currency: string
          day_date: string
          description: string
          destination_id: string | null
          end_time: string | null
          id: string
          latitude: number | null
          location_name: string
          longitude: number | null
          notes: string
          order_index: number
          start_time: string | null
          title: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          booking_ref?: string
          category: string
          cost?: number
          created_at?: string
          currency?: string
          day_date: string
          description?: string
          destination_id?: string | null
          end_time?: string | null
          id?: string
          latitude?: number | null
          location_name?: string
          longitude?: number | null
          notes?: string
          order_index?: number
          start_time?: string | null
          title: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          booking_ref?: string
          category?: string
          cost?: number
          created_at?: string
          currency?: string
          day_date?: string
          description?: string
          destination_id?: string | null
          end_time?: string | null
          id?: string
          latitude?: number | null
          location_name?: string
          longitude?: number | null
          notes?: string
          order_index?: number
          start_time?: string | null
          title?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_items_destination"
            columns: ["trip_id", "destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["trip_id", "id"]
          },
          {
            foreignKeyName: "itinerary_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read_at: string | null
          remind_at: string | null
          title: string
          trip_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          remind_at?: string | null
          title: string
          trip_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          remind_at?: string | null
          title?: string
          trip_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string
          bio: string
          created_at: string
          date_format: string
          display_name: string
          email: string
          id: string
          is_active: boolean
          measurement_units: string
          notifications_enabled: boolean
          preferred_currency: string
          role: string
          time_format: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string
          bio?: string
          created_at?: string
          date_format?: string
          display_name?: string
          email?: string
          id: string
          is_active?: boolean
          measurement_units?: string
          notifications_enabled?: boolean
          preferred_currency?: string
          role?: string
          time_format?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string
          bio?: string
          created_at?: string
          date_format?: string
          display_name?: string
          email?: string
          id?: string
          is_active?: boolean
          measurement_units?: string
          notifications_enabled?: boolean
          preferred_currency?: string
          role?: string
          time_format?: string
          updated_at?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          budget: number
          budget_amount: number
          country: string
          cover_image: string
          cover_image_alt: string
          cover_image_credit: string
          cover_image_credit_url: string
          created_at: string
          currency: string
          destination_region: string
          end_date: string
          id: string
          notes: string
          privacy: string
          start_date: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget?: number
          budget_amount?: number
          country?: string
          cover_image?: string
          cover_image_alt?: string
          cover_image_credit?: string
          cover_image_credit_url?: string
          created_at?: string
          currency?: string
          destination_region?: string
          end_date: string
          id?: string
          notes?: string
          privacy?: string
          start_date: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget?: number
          budget_amount?: number
          country?: string
          cover_image?: string
          cover_image_alt?: string
          cover_image_credit?: string
          cover_image_credit_url?: string
          created_at?: string
          currency?: string
          destination_region?: string
          end_date?: string
          id?: string
          notes?: string
          privacy?: string
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience Type Helpers
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type DbTripRow = Tables<'trips'>;
export type DbTripInsert = TablesInsert<'trips'>;
export type DbTripUpdate = TablesUpdate<'trips'>;

export type DbItineraryItemRow = Tables<'itinerary_items'>;
export type DbItineraryItemInsert = TablesInsert<'itinerary_items'>;
export type DbItineraryItemUpdate = TablesUpdate<'itinerary_items'>;

export type DbExpenseRow = Tables<'expenses'>;
export type DbExpenseInsert = TablesInsert<'expenses'>;
export type DbExpenseUpdate = TablesUpdate<'expenses'>;

export type DbDestinationRow = Tables<'destinations'>;
export type DbDestinationInsert = TablesInsert<'destinations'>;
export type DbDestinationUpdate = TablesUpdate<'destinations'>;

export type DbProfileRow = Tables<'profiles'>;
export type DbProfileInsert = TablesInsert<'profiles'>;
export type DbProfileUpdate = TablesUpdate<'profiles'>;

export type DbNotificationRow = Tables<'notifications'>;
export type DbNotificationInsert = TablesInsert<'notifications'>;
export type DbNotificationUpdate = TablesUpdate<'notifications'>;
