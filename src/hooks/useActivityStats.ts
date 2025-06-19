import { useState, useEffect, useRef } from 'react';
import { ActivityStats, PeerReview, MatchHistoryItem, MatchHistoryFilters } from '../types/activityStats';
import { activityStatsService } from '../services/activityStatsService';
import { useAuth } from './useAuth';

export const useActivityStats = (userId?: string) => {
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const fetchedRef = useRef(false);

  // Determine target user
  const targetUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  useEffect(() => {
    if (targetUserId && !fetchedRef.current) {
      fetchStats();
      fetchedRef.current = true;
    } else if (!targetUserId) {
      setStats(null);
      setLoading(false);
      setError(null);
      fetchedRef.current = false;
    }
  }, [targetUserId]);

  const fetchStats = async () => {
    if (!targetUserId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await activityStatsService.getUserActivityStats(
        isOwnProfile ? undefined : targetUserId
      );

      if (result.error) {
        throw new Error(result.error.message);
      }

      setStats(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchedRef.current = false;
    fetchStats();
  };

  return {
    stats,
    loading,
    error,
    refetch
  };
};

export const usePeerReviews = (userId?: string, limit: number = 10) => {
  const [reviews, setReviews] = useState<PeerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Determine target user
  const targetUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchReviews();
    }
  }, [targetUserId, limit]);

  const fetchReviews = async () => {
    if (!targetUserId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await activityStatsService.getUserPeerReviews(
        isOwnProfile ? undefined : targetUserId,
        limit
      );

      if (result.error) {
        throw new Error(result.error.message);
      }

      setReviews(result.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchReviews();
  };

  return {
    reviews,
    loading,
    error,
    refetch
  };
};

export const useMatchHistory = (userId?: string, filters?: MatchHistoryFilters, limit: number = 20) => {
  const [matches, setMatches] = useState<MatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Determine target user
  const targetUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchMatches();
    }
  }, [targetUserId, filters, limit]);

  const fetchMatches = async () => {
    if (!targetUserId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await activityStatsService.getUserMatchHistory(
        isOwnProfile ? undefined : targetUserId,
        filters,
        limit
      );

      if (result.error) {
        throw new Error(result.error.message);
      }

      setMatches(result.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchMatches();
  };

  return {
    matches,
    loading,
    error,
    refetch
  };
};