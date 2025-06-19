import { supabase } from '../lib/supabase';
import { Match, SkillEndorsementSummary, CreateMatchData, CreateEndorsementData } from '../types/match';

export const matchService = {
  async createMatch(matchData: CreateMatchData): Promise<{ data: Match | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('matches')
        .insert(matchData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to create match'
        }
      };
    }
  },

  async getUserMatchHistory(userId?: string): Promise<{ data: Match[] | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_user_match_history', {
        p_user_id: userId || undefined
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

  async getUserSkillEndorsements(userId?: string): Promise<{ data: SkillEndorsementSummary[] | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_user_skill_endorsements', {
        p_user_id: userId || undefined
      });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to fetch skill endorsements'
        }
      };
    }
  },

  async createEndorsement(endorsementData: CreateEndorsementData): Promise<{ data: any | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('skill_endorsements')
        .insert({
          endorser_id: user.id,
          ...endorsementData
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to create endorsement'
        }
      };
    }
  },

  async verifyMatch(matchId: string): Promise<{ data: Match | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('matches')
        .update({ 
          status: 'verified',
          verified_at: new Date().toISOString()
        })
        .eq('id', matchId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to verify match'
        }
      };
    }
  }
};