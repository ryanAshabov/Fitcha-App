import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  user_id: string;
  actor_id?: string;
  type: 'new_game_request' | 'request_accepted' | 'request_declined' | 'booking_confirmed';
  message: string;
  read_at?: string;
  related_entity_id?: string;
  created_at: string;
  
  // Populated from joins
  actor_profile?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (user && !fetchedRef.current) {
      fetchNotifications();
      fetchUnreadCount();
      fetchedRef.current = true;
    } else if (!user) {
      // Reset state when user logs out
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      setError(null);
      fetchedRef.current = false;
    }
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error: notificationsError } = await supabase
        .from('notifications')
        .select(`
          *,
          actor_profile:profiles!fk_notification_actor(first_name, last_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (notificationsError) {
        throw notificationsError;
      }

      setNotifications(data || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const { data, error: countError } = await supabase.rpc('get_unread_notifications_count');

      if (countError) {
        throw countError;
      }

      setUnreadCount(data || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds?: string[]) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('mark_notifications_as_read', {
        notification_ids: notificationIds || null
      });

      if (error) {
        throw error;
      }

      // Update local state
      if (notificationIds) {
        setNotifications(prev => 
          prev.map(notification => 
            notificationIds.includes(notification.id)
              ? { ...notification, read_at: new Date().toISOString() }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      } else {
        // Mark all as read
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const refetch = () => {
    fetchedRef.current = false;
    fetchNotifications();
    fetchUnreadCount();
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    refetch
  };
};