import { supabase } from '../lib/supabase';
import { Conversation, Message, CreateMessageData, SendMessageToUserData } from '../types/messaging';

export const messagingService = {
  async getUserConversations(): Promise<{ data: Conversation[] | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_user_conversations');

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to fetch conversations'
        }
      };
    }
  },

  async getConversationMessages(conversationId: string): Promise<{ data: Message[] | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_conversation_messages', {
        p_conversation_id: conversationId
      });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to fetch messages'
        }
      };
    }
  },

  async sendMessage(messageData: CreateMessageData): Promise<{ data: Message | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: messageData.conversation_id,
          sender_id: user.id,
          content: messageData.content
        })
        .select(`
          id,
          sender_id,
          content,
          created_at,
          is_read,
          sender:profiles(first_name, last_name, avatar_url)
        `)
        .single();

      if (error) {
        throw error;
      }

      // Transform the response to match our Message interface
      const transformedData: Message = {
        message_id: data.id,
        sender_id: data.sender_id,
        sender_name: `${data.sender.first_name} ${data.sender.last_name}`,
        sender_avatar: data.sender.avatar_url,
        content: data.content,
        created_at: data.created_at,
        is_read: data.is_read
      };

      return { data: transformedData, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to send message'
        }
      };
    }
  },

  async sendMessageToUser(messageData: SendMessageToUserData): Promise<{ data: Message | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Find or create conversation
      const { data: conversationId, error: conversationError } = await supabase.rpc('find_or_create_conversation', {
        user1_id: user.id,
        user2_id: messageData.recipient_id
      });

      if (conversationError) {
        throw conversationError;
      }

      // Send message to the conversation
      return await this.sendMessage({
        conversation_id: conversationId,
        content: messageData.content
      });
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to send message to user'
        }
      };
    }
  },

  async markMessagesAsRead(conversationId: string): Promise<{ success: boolean; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      if (error) {
        throw error;
      }

      return { success: true, error: null };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'Failed to mark messages as read'
        }
      };
    }
  },

  subscribeToConversationMessages(conversationId: string, callback: (message: Message) => void) {
    const subscription = supabase
      .channel(`conversation_messages_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch the complete message data with sender info
          const { data } = await supabase.rpc('get_conversation_messages', {
            p_conversation_id: conversationId
          });
          
          if (data && data.length > 0) {
            // Find the new message (it should be the last one)
            const newMessage = data.find((msg: Message) => msg.message_id === payload.new.id);
            if (newMessage) {
              callback(newMessage);
            }
          }
        }
      )
      .subscribe();

    return subscription;
  },

  subscribeToUserConversations(callback: (conversation: Conversation) => void) {
    const subscription = supabase
      .channel('user_conversations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async () => {
          // Refresh conversations list when any new message is sent
          const { data } = await this.getUserConversations();
          if (data && data.length > 0) {
            // Call callback with the most recent conversation
            callback(data[0]);
          }
        }
      )
      .subscribe();

    return subscription;
  }
};