import { supabase } from '../lib/supabase';
import { GameRequest, CreateGameRequestData, UpdateGameRequestData } from '../types/gameRequest';

export const gameRequestService = {
  async createRequest(requestData: CreateGameRequestData): Promise<{ data: GameRequest | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('game_requests')
        .insert({
          sender_id: user.id,
          receiver_id: requestData.receiver_id,
          message: requestData.message,
          proposed_datetime: requestData.proposed_datetime
        })
        .select(`
          *,
          sender_profile:profiles!fk_sender(first_name, last_name, avatar_url, location),
          receiver_profile:profiles!fk_receiver(first_name, last_name, avatar_url, location)
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
          message: error.message || 'Failed to create game request'
        }
      };
    }
  },

  async getReceivedRequests(): Promise<{ data: GameRequest[] | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('game_requests')
        .select(`
          *,
          sender_profile:profiles!fk_sender(first_name, last_name, avatar_url, location)
        `)
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to fetch received requests'
        }
      };
    }
  },

  async getSentRequests(): Promise<{ data: GameRequest[] | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('game_requests')
        .select(`
          *,
          receiver_profile:profiles!fk_receiver(first_name, last_name, avatar_url, location)
        `)
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to fetch sent requests'
        }
      };
    }
  },

  async updateRequestStatus(requestId: string, updateData: UpdateGameRequestData): Promise<{ data: GameRequest | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('game_requests')
        .update({ status: updateData.status })
        .eq('id', requestId)
        .select(`
          *,
          sender_profile:profiles!fk_sender(first_name, last_name, avatar_url, location),
          receiver_profile:profiles!fk_receiver(first_name, last_name, avatar_url, location)
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
          message: error.message || 'Failed to update request status'
        }
      };
    }
  },

  async getPendingReceivedCount(): Promise<{ data: number; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { count, error } = await supabase
        .from('game_requests')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (error) {
        throw error;
      }

      return { data: count || 0, error: null };
    } catch (error: any) {
      return {
        data: 0,
        error: {
          message: error.message || 'Failed to fetch pending requests count'
        }
      };
    }
  }
};