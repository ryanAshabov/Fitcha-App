import { supabase } from '../lib/supabase';
import { Court, CourtSearchFilters, Booking, CreateBookingData, TimeSlot } from '../types/court';

export const courtService = {
  async searchCourts(filters: CourtSearchFilters): Promise<{ 
    data: Court[] | null; 
    error: any 
  }> {
    try {
      const { data, error } = await supabase.rpc('search_courts', {
        p_sport_type: filters.sport_type || null,
        p_court_type: filters.court_type || null,
        p_location: filters.location || null,
        p_min_price: filters.min_price || null,
        p_max_price: filters.max_price || null,
        p_date: filters.date || null
      });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to search courts'
        }
      };
    }
  },

  async getCourt(courtId: string): Promise<{ data: Court | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .eq('id', courtId)
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to fetch court details'
        }
      };
    }
  },

  async getCourtAvailability(courtId: string, date: string): Promise<{ 
    data: TimeSlot[] | null; 
    error: any 
  }> {
    try {
      const { data, error } = await supabase.rpc('get_court_availability', {
        p_court_id: courtId,
        p_date: date
      });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to fetch court availability'
        }
      };
    }
  },

  async createBooking(bookingData: CreateBookingData): Promise<{ 
    data: Booking | null; 
    error: any 
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          court_id: bookingData.court_id,
          start_time: bookingData.start_time,
          end_time: bookingData.end_time,
          total_price: bookingData.total_price
        })
        .select(`
          *,
          court:courts(*)
        `)
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to create booking'
        }
      };
    }
  },

  async getUserBookings(): Promise<{ data: Booking[] | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          court:courts(*)
        `)
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to fetch user bookings'
        }
      };
    }
  },

  async cancelBooking(bookingId: string): Promise<{ data: Booking | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .select(`
          *,
          court:courts(*)
        `)
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to cancel booking'
        }
      };
    }
  }
};