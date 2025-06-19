import { supabase } from '../lib/supabase';
import { 
  ActivityStats, 
  PeerReview, 
  MatchHistoryItem, 
  ReviewableBooking, 
  CreateReviewData,
  MatchHistoryFilters 
} from '../types/activityStats';

export const activityStatsService = {
  async getUserActivityStats(userId?: string): Promise<{ data: ActivityStats | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_user_activity_stats', {
        p_user_id: userId || null
      });

      if (error) {
        throw error;
      }

      return { data: data?.[0] || null, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to fetch activity stats'
        }
      };
    }
  },

  async getUserPeerReviews(userId?: string, limit: number = 10): Promise<{ data: PeerReview[] | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_user_peer_reviews', {
        p_user_id: userId || null,
        p_limit: limit
      });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to fetch peer reviews'
        }
      };
    }
  },

  async getUserMatchHistory(
    userId?: string, 
    filters?: MatchHistoryFilters, 
    limit: number = 20
  ): Promise<{ data: MatchHistoryItem[] | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_user_match_history_detailed', {
        p_user_id: userId || null,
        p_sport_filter: filters?.sport || null,
        p_year_filter: filters?.year || null,
        p_limit: limit
      });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to fetch match history'
        }
      };
    }
  },

  async getReviewableBookings(userId?: string): Promise<{ data: ReviewableBooking[] | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_bookings_pending_review', {
        p_user_id: userId || null
      });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to fetch reviewable bookings'
        }
      };
    }
  },

  async createReview(reviewData: CreateReviewData): Promise<{ data: string | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('create_game_review', {
        p_booking_id: reviewData.booking_id,
        p_reviewee_id: reviewData.reviewee_id,
        p_rating: reviewData.rating,
        p_comment: reviewData.comment || null
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to create review'
        }
      };
    }
  },

  async canReviewBooking(bookingId: string, revieweeId: string): Promise<{ data: boolean; error: any }> {
    try {
      const { data, error } = await supabase.rpc('can_review_booking', {
        p_booking_id: bookingId,
        p_reviewee_id: revieweeId
      });

      if (error) {
        throw error;
      }

      return { data: data || false, error: null };
    } catch (error: any) {
      return {
        data: false,
        error: {
          message: error.message || 'Failed to check review eligibility'
        }
      };
    }
  }
};