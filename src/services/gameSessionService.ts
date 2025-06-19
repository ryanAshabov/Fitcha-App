import { supabase } from '../lib/supabase';
import { 
  GameSession, 
  SessionChatMessage, 
  CourtSuggestion,
  CreateGameSessionData, 
  UpdateGameSessionData,
  SendMessageData 
} from '../types/gameSession';

export const gameSessionService = {
  async createSession(sessionData: CreateGameSessionData): Promise<{ data: GameSession | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('game_sessions')
        .insert({
          initiator_id: user.id,
          ...sessionData
        })
        .select(`
          *,
          initiator_profile:profiles!game_sessions_initiator_id_fkey(first_name, last_name, avatar_url),
          invitee_profile:profiles!game_sessions_invitee_id_fkey(first_name, last_name, avatar_url)
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
          message: error.message || 'Failed to create game session'
        }
      };
    }
  },

  async getUserActiveSessions(): Promise<{ data: GameSession[] | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_user_active_sessions');

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to fetch active sessions'
        }
      };
    }
  },

  async getSession(sessionId: string): Promise<{ data: GameSession | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select(`
          *,
          initiator_profile:profiles!game_sessions_initiator_id_fkey(first_name, last_name, avatar_url),
          invitee_profile:profiles!game_sessions_invitee_id_fkey(first_name, last_name, avatar_url),
          court:courts(name, location_address, hourly_price)
        `)
        .eq('id', sessionId)
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to fetch session'
        }
      };
    }
  },

  async updateSession(sessionId: string, updateData: UpdateGameSessionData): Promise<{ data: GameSession | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .update(updateData)
        .eq('id', sessionId)
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
          message: error.message || 'Failed to update session'
        }
      };
    }
  },

  async suggestCourts(sessionId: string, limit: number = 10): Promise<{ data: CourtSuggestion[] | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('suggest_courts_for_session', {
        p_session_id: sessionId,
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
          message: error.message || 'Failed to suggest courts'
        }
      };
    }
  },

  async getSessionMessages(sessionId: string): Promise<{ data: SessionChatMessage[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('session_chat_messages')
        .select(`
          *,
          sender:profiles!session_chat_messages_sender_id_fkey(first_name, last_name, avatar_url)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to fetch session messages'
        }
      };
    }
  },

  async sendMessage(messageData: SendMessageData): Promise<{ data: SessionChatMessage | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('session_chat_messages')
        .insert({
          sender_id: user.id,
          ...messageData
        })
        .select(`
          *,
          sender:profiles!session_chat_messages_sender_id_fkey(first_name, last_name, avatar_url)
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
          message: error.message || 'Failed to send message'
        }
      };
    }
  },

  async subscribeToSessionMessages(sessionId: string, callback: (message: SessionChatMessage) => void) {
    const subscription = supabase
      .channel(`session_messages_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          callback(payload.new as SessionChatMessage);
        }
      )
      .subscribe();

    return subscription;
  },

  async subscribeToSessionUpdates(sessionId: string, callback: (session: GameSession) => void) {
    const subscription = supabase
      .channel(`session_updates_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          callback(payload.new as GameSession);
        }
      )
      .subscribe();

    return subscription;
  }
};