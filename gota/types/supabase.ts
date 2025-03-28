export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          phone_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          phone_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          phone_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      restaurants: {
        Row: {
          id: string
          name: string
          address: string
          phone: string
          description: string
          image_url: string | null
          opening_hours: string | null
          average_rating: number | null
          total_reviews: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          phone: string
          description: string
          image_url?: string | null
          opening_hours?: string | null
          average_rating?: number | null
          total_reviews?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          phone?: string
          description?: string
          image_url?: string | null
          opening_hours?: string | null
          average_rating?: number | null
          total_reviews?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          user_id: string
          restaurant_id: string
          date: string
          time: string
          number_of_people: number
          notes: string | null
          status: string
          payment_id: string | null
          restaurant_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          restaurant_id: string
          date: string
          time: string
          number_of_people: number
          notes?: string | null
          status?: string
          payment_id?: string | null
          restaurant_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          restaurant_id?: string
          date?: string
          time?: string
          number_of_people?: number
          notes?: string | null
          status?: string
          payment_id?: string | null
          restaurant_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          restaurant_id: string
          rating: number
          comment: string
          user_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          restaurant_id: string
          rating: number
          comment: string
          user_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          restaurant_id?: string
          rating?: number
          comment?: string
          user_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cancellation_requests: {
        Row: {
          id: string
          reservation_id: string
          user_id: string
          status: string
          requested_at: string
          processed_at: string | null
          processed_by: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reservation_id: string
          user_id: string
          status?: string
          requested_at?: string
          processed_at?: string | null
          processed_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reservation_id?: string
          user_id?: string
          status?: string
          requested_at?: string
          processed_at?: string | null
          processed_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      reservation_statistics: {
        Row: {
          restaurant_id: string | null
          date: string | null
          total_reservations: number | null
          confirmed_reservations: number | null
          pending_reservations: number | null
          cancelled_reservations: number | null
          total_guests: number | null
          day_of_week: number | null
          hour_of_day: number | null
        }
      }
    }
    Functions: {
      get_dashboard_statistics: {
        Args: {
          p_restaurant_id: string
        }
        Returns: {
          total_reservations: number
          today_reservations: number
          pending_reservations: number
          cancelled_reservations: number
          total_customers: number
          today_customers: number
          average_rating: number
          total_reviews: number
          total_tables: number
          available_tables: number
        }[]
      }
      get_daily_revenue: {
        Args: {
          p_restaurant_id: string
          p_start_date?: string
          p_end_date?: string
        }
        Returns: {
          date: string
          total_reservations: number
          total_guests: number
          revenue: number
        }[]
      }
      get_recent_reviews: {
        Args: {
          p_restaurant_id: string
          limit_count?: number
        }
        Returns: {
          id: string
          user_id: string
          restaurant_id: string
          rating: number
          comment: string
          user_name: string | null
          created_at: string
        }[]
      }
      get_reservation_heatmap: {
        Args: {
          p_restaurant_id: string
          p_start_date?: string
          p_end_date?: string
        }
        Returns: {
          day_of_week: number
          hour_of_day: number
          reservation_count: number
        }[]
      }
      get_restaurant_rating: {
        Args: {
          p_restaurant_id: string
        }
        Returns: {
          average_rating: number
          review_count: number
        }[]
      }
    }
  }
} 