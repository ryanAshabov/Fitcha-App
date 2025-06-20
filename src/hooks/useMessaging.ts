import { useState, useEffect } from 'react';
import { Conversation, Message } from '../types/messaging';
import { messagingService } from '../services/messagingService';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

export const useMessaging = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const setupMessaging = async () => {
      // Early return if no user
      if (!user) {
        setConversations([]);
        setUnreadCount(0);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        // 1. Fetch initial conversations data first
        const conversationsResult = await messagingService.getUserConversations();
        
        if (conversationsResult.error) {
          throw new Error(conversationsResult.error.message);
        }

        // 2. Fetch unread count
        const { data: unreadData, error: unreadError } = await supabase.rpc('get_unread_conversation_count');
        
        if (unreadError) {
          throw unreadError;
        }

        // 3. Set initial state with fetched data
        setConversations(conversationsResult.data || []);
        setUnreadCount(unreadData || 0);
        setError(null);

      } catch (err: any) {
        // Handle errors by setting error state and safe defaults
        setError(err.message);
        setConversations([]);
        setUnreadCount(0);
      } finally {
        // 4. Always set loading to false after initial fetch attempt
        setLoading(false);
      }

      // 5. Set up real-time subscription after initial state is established
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
            // When new message arrives, refresh conversations and unread count
            try {
              const newConversationsResult = await messagingService.getUserConversations();
              const { data: newUnreadData } = await supabase.rpc('get_unread_conversation_count');
              
              if (!newConversationsResult.error && newConversationsResult.data) {
                setConversations(newConversationsResult.data);
              }
              if (newUnreadData !== null) {
                setUnreadCount(newUnreadData);
              }
            } catch (err) {
              console.error('Error refreshing conversations:', err);
            }
          }
        )
        .subscribe();

      // 6. Return cleanup function
      return () => {
        subscription.unsubscribe();
      };
    };

    setupMessaging();
  }, [user?.id]); // Only re-run when user ID changes

  const sendMessageToUser = async (recipientId: string, content: string) => {
    const result = await messagingService.sendMessageToUser({
      recipient_id: recipientId,
      content
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    // Refresh conversations and unread count after sending message
    try {
      const conversationsResult = await messagingService.getUserConversations();
      const { data: unreadData } = await supabase.rpc('get_unread_conversation_count');
      
      if (!conversationsResult.error && conversationsResult.data) {
        setConversations(conversationsResult.data);
      }
      if (unreadData !== null) {
        setUnreadCount(unreadData);
      }
    } catch (err) {
      // Silently handle refresh errors - the message was still sent
      console.error('Failed to refresh conversations after sending message:', err);
    }

    return { success: true, data: result.data };
  };

  const refetch = () => {
    setLoading(true);
    // Trigger re-fetch by updating a dependency
    window.location.reload();
  };

  return {
    conversations,
    unreadCount,
    loading,
    error,
    sendMessageToUser,
    refetch
  };
};

export const useConversation = (conversationId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const setupConversation = async () => {
      // Early return if no conversation ID or user
      if (!conversationId || !user) {
        setMessages([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // 1. Fetch initial messages first
        const result = await messagingService.getConversationMessages(conversationId);

        if (result.error) {
          throw new Error(result.error.message);
        }

        // 2. Set initial state with fetched data
        setMessages(result.data || []);
        setError(null);
        
        // 3. Mark messages as read
        await messagingService.markMessagesAsRead(conversationId);

      } catch (err: any) {
        // Handle errors by setting error state and safe defaults
        setError(err.message);
        setMessages([]);
      } finally {
        // 4. Always set loading to false after initial fetch attempt
        setLoading(false);
      }

      // 5. Set up real-time subscription after initial state is established
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
            // When new message arrives, fetch complete message data
            try {
              const { data } = await supabase.rpc('get_conversation_messages', {
                p_conversation_id: conversationId
              });
              
              if (data && data.length > 0) {
                // Find the new message (it should be the last one)
                const newMessage = data.find((msg: Message) => msg.message_id === payload.new.id);
                if (newMessage) {
                  // Only add message if it's not from the current user (to avoid duplicates from optimistic updates)
                  if (newMessage.sender_id !== user?.id) {
                    setMessages(prev => [...prev, newMessage]);
                  }
                  
                  // Mark as read if it's not from current user
                  if (newMessage.sender_id !== user?.id) {
                    messagingService.markMessagesAsRead(conversationId);
                  }
                }
              }
            } catch (err) {
              console.error('Error handling new message:', err);
            }
          }
        )
        .subscribe();

      // 6. Return cleanup function
      return () => {
        subscription.unsubscribe();
      };
    };

    setupConversation();
  }, [conversationId, user?.id]); // Re-run when conversation ID or user ID changes

  const sendMessage = async (content: string) => {
    if (!conversationId || !content.trim()) return { success: false, error: 'Invalid message' };

    // Optimistically add message to local state
    const optimisticMessage: Message = {
      message_id: Date.now(), // Temporary ID
      sender_id: user!.id,
      sender_name: `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim(),
      sender_avatar: user?.user_metadata?.avatar_url,
      content: content.trim(),
      created_at: new Date().toISOString(),
      is_read: false
    };

    setMessages(prev => [...prev, optimisticMessage]);

    // Send message to backend
    const result = await messagingService.sendMessage({
      conversation_id: conversationId,
      content: content.trim()
    });

    if (result.error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.message_id !== optimisticMessage.message_id));
      return { success: false, error: result.error.message };
    } else if (result.data) {
      // Replace optimistic message with real message from server
      setMessages(prev => 
        prev.map(msg => 
          msg.message_id === optimisticMessage.message_id ? result.data! : msg
        )
      );
    }

    return { success: true, data: result.data };
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    refetch: () => {
      setLoading(true);
      window.location.reload();
    }
  };
};