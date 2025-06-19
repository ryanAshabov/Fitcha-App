import { useState, useEffect, useRef } from 'react';
import { Conversation, Message } from '../types/messaging';
import { messagingService } from '../services/messagingService';
import { useAuth } from './useAuth';

export const useMessaging = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (user && !fetchedRef.current) {
      fetchConversations();
      setupRealtimeSubscription();
      fetchedRef.current = true;
    } else if (!user) {
      // Reset state when user logs out
      setConversations([]);
      setLoading(false);
      setError(null);
      fetchedRef.current = false;
    }
  }, [user?.id]);

  const fetchConversations = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const result = await messagingService.getUserConversations();

      if (result.error) {
        throw new Error(result.error.message);
      }

      setConversations(result.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const subscription = messagingService.subscribeToUserConversations(() => {
      // Refresh conversations when new messages arrive
      fetchConversations();
    });

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessageToUser = async (recipientId: string, content: string) => {
    const result = await messagingService.sendMessageToUser({
      recipient_id: recipientId,
      content
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    // Refresh conversations after sending message
    await fetchConversations();
    return { success: true, data: result.data };
  };

  const refetch = () => {
    fetchedRef.current = false;
    fetchConversations();
  };

  return {
    conversations,
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
    if (conversationId && user) {
      fetchMessages();
      setupRealtimeSubscription();
    } else {
      setMessages([]);
      setError(null);
    }
  }, [conversationId, user?.id]);

  const fetchMessages = async () => {
    if (!conversationId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await messagingService.getConversationMessages(conversationId);

      if (result.error) {
        throw new Error(result.error.message);
      }

      setMessages(result.data || []);
      
      // Mark messages as read
      await messagingService.markMessagesAsRead(conversationId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!conversationId) return;

    const subscription = messagingService.subscribeToConversationMessages(
      conversationId,
      (newMessage) => {
        // Only add message if it's not from the current user (to avoid duplicates from optimistic updates)
        if (newMessage.sender_id !== user?.id) {
          setMessages(prev => [...prev, newMessage]);
        }
        
        // Mark as read if it's not from current user
        if (newMessage.sender_id !== user?.id) {
          messagingService.markMessagesAsRead(conversationId);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  };

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
    refetch: fetchMessages
  };
};