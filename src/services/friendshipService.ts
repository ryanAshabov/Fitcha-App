import { supabase } from '../lib/supabase';
import { 
  Friendship, 
  Friend, 
  PendingFriendRequest, 
  CreateFriendRequestData, 
  UpdateFriendshipData 
} from '../types/friendship';

export const friendshipService = {
  async getFriendshipStatus(userId: string): Promise<{ data: Friendship | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_friendship_status', {
        user1_id: (await supabase.auth.getUser()).data.user?.id,
        user2_id: userId
      });

      if (error) {
        throw error;
      }

      return { data: data?.[0] || null, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to get friendship status'
        }
      };
    }
  },

  async sendFriendRequest(requestData: CreateFriendRequestData): Promise<{ data: Friendship | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          receiver_id: requestData.receiver_id,
          status: 'pending'
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
          message: error.message || 'Failed to send friend request'
        }
      };
    }
  },

  async updateFriendship(friendshipId: string, updateData: UpdateFriendshipData): Promise<{ data: Friendship | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .update({ status: updateData.status })
        .eq('id', friendshipId)
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
          message: error.message || 'Failed to update friendship'
        }
      };
    }
  },

  async cancelFriendRequest(friendshipId: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) {
        throw error;
      }

      return { success: true, error: null };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'Failed to cancel friend request'
        }
      };
    }
  },

  async unfriend(friendshipId: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) {
        throw error;
      }

      return { success: true, error: null };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'Failed to unfriend user'
        }
      };
    }
  },

  async getUserFriends(userId?: string): Promise<{ data: Friend[] | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_user_friends', {
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
          message: error.message || 'Failed to get user friends'
        }
      };
    }
  },

  async getPendingFriendRequests(): Promise<{ data: PendingFriendRequest[] | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_pending_friend_requests');

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to get pending friend requests'
        }
      };
    }
  }
};