import { supabase } from '../lib/supabase';
import { PlayerSearchFilters, PlayerSearchResult } from '../types/player';

export const playerService = {
  async searchPlayers(filters: PlayerSearchFilters): Promise<{ 
    data: PlayerSearchResult[] | null; 
    error: any 
  }> {
    try {
      const { data, error } = await supabase.rpc('search_players', {
        p_sport: filters.sport || null,
        p_level: filters.level || null,
        p_location: filters.location || null
      });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to search players'
        }
      };
    }
  }
};