import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface NextBooking {
  id: string;
  court_name: string;
  start_time: string;
  end_time: string;
  total_price: number;
}

interface UserStats {
  courts_booked: number;
  games_played: number;
  connections: number;
}

export const useDashboardData = () => {
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [nextBooking, setNextBooking] = useState<NextBooking | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    courts_booked: 0,
    games_played: 0,
    connections: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else {
      // Reset state when user logs out
      setPendingRequestsCount(0);
      setNextBooking(null);
      setUserStats({ courts_booked: 0, games_played: 0, connections: 0 });
      setLoading(false);
      setError(null);
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch all dashboard data in parallel
      const [pendingResult, bookingResult, statsResult] = await Promise.all([
        getPendingRequestsCount(),
        getNextBooking(),
        getUserStats()
      ]);

      setPendingRequestsCount(pendingResult);
      setNextBooking(bookingResult);
      setUserStats(statsResult);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPendingRequestsCount = async (): Promise<number> => {
    const { count, error } = await supabase
      .from('game_requests')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user!.id)
      .eq('status', 'pending');

    if (error) {
      throw new Error(error.message);
    }

    return count || 0;
  };

  const getNextBooking = async (): Promise<NextBooking | null> => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        start_time,
        end_time,
        total_price,
        court:courts(name)
      `)
      .eq('user_id', user!.id)
      .eq('status', 'confirmed')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    if (data && data.length > 0) {
      const booking = data[0];
      return {
        id: booking.id,
        court_name: booking.court?.name || 'Unknown Court',
        start_time: booking.start_time,
        end_time: booking.end_time,
        total_price: booking.total_price
      };
    }

    return null;
  };

  const getUserStats = async (): Promise<UserStats> => {
    // Get courts booked count
    const { count: courtsBooked, error: courtsError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id);

    if (courtsError) {
      throw new Error(courtsError.message);
    }

    // Get verified matches count (games played)
    const { count: gamesPlayed, error: gamesError } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'verified')
      .or(`winner_id.eq.${user!.id},loser_id.eq.${user!.id}`);

    if (gamesError) {
      throw new Error(gamesError.message);
    }

    // Get connections count (accepted game requests)
    const { count: connections, error: connectionsError } = await supabase
      .from('game_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`);

    if (connectionsError) {
      throw new Error(connectionsError.message);
    }

    return {
      courts_booked: courtsBooked || 0,
      games_played: gamesPlayed || 0,
      connections: connections || 0
    };
  };

  const refetch = () => {
    fetchDashboardData();
  };

  return {
    pendingRequestsCount,
    nextBooking,
    userStats,
    loading,
    error,
    refetch
  };
};