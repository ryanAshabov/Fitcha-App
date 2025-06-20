import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const setupNotifications = async () => {
      // Early return if no user
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        // 1. Fetch initial notifications data first
        const { data: notificationsData, error: notificationsError } = await supabase
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

        // 2. Fetch unread count
        const { data: unreadData, error: countError } = await supabase.rpc('get_unread_notifications_count');

        if (countError) {
          throw countError;
        }

        // 3. Set initial state with fetched data
        setNotifications(notificationsData || []);
        setUnreadCount(unreadData || 0);
        setError(null);

      } catch (err: any) {
        // Handle errors by setting error state and safe defaults
        setError(err.message);
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        // 4. Always set loading to false after initial fetch attempt
        setLoading(false);
      }

      // 5. Set up real-time subscription after initial state is established
      const subscription = supabase
        .channel('user_notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          async () => {
            // When new notification arrives, refresh the data
            try {
              const { data: newNotificationsData } = await supabase
                .from('notifications')
                .select(`
                  *,
                  actor_profile:profiles!fk_notification_actor(first_name, last_name, avatar_url)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

              const { data: newUnreadData } = await supabase.rpc('get_unread_notifications_count');

              if (newNotificationsData) {
                setNotifications(newNotificationsData);
              }
              if (newUnreadData !== null) {
                setUnreadCount(newUnreadData);
              }
            } catch (err) {
              console.error('Error refreshing notifications:', err);
            }
          }
        )
        .subscribe();

      // 6. Return cleanup function
      return () => {
        subscription.unsubscribe();
      };
    };

    setupNotifications();
  }, [user?.id]); // Only re-run when user ID changes

  const markAsRead = async (notificationIds?: string[]) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('mark_notifications_as_read', {
        notification_ids: notificationIds || null
      });

      if (error) {
        throw error;
      }

      // Update local state optimistically
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
    setLoading(true);
    // Trigger re-fetch by updating a dependency
    window.location.reload();
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