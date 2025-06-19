import { useState, useEffect, useRef } from 'react';
import { GameRequest } from '../types/gameRequest';
import { gameRequestService } from '../services/gameRequestService';
import { useAuth } from './useAuth';

export const useGameRequests = () => {
  const [receivedRequests, setReceivedRequests] = useState<GameRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<GameRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (user && !fetchedRef.current) {
      fetchRequests();
      fetchedRef.current = true;
    } else if (!user) {
      // Reset state when user logs out
      setReceivedRequests([]);
      setSentRequests([]);
      setPendingCount(0);
      setLoading(false);
      setError(null);
      fetchedRef.current = false;
    }
  }, [user?.id]);

  const fetchRequests = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const [receivedResult, sentResult, countResult] = await Promise.all([
        gameRequestService.getReceivedRequests(),
        gameRequestService.getSentRequests(),
        gameRequestService.getPendingReceivedCount()
      ]);

      if (receivedResult.error) {
        throw new Error(receivedResult.error.message);
      }
      if (sentResult.error) {
        throw new Error(sentResult.error.message);
      }
      if (countResult.error) {
        throw new Error(countResult.error.message);
      }

      setReceivedRequests(receivedResult.data || []);
      setSentRequests(sentResult.data || []);
      setPendingCount(countResult.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: 'accepted' | 'declined' | 'cancelled') => {
    const result = await gameRequestService.updateRequestStatus(requestId, { status });
    
    if (result.error) {
      return { success: false, error: result.error.message };
    }

    // Refresh requests after update
    await fetchRequests();
    return { success: true, data: result.data };
  };

  const refetch = () => {
    fetchedRef.current = false;
    fetchRequests();
  };

  return {
    receivedRequests,
    sentRequests,
    pendingCount,
    loading,
    error,
    updateRequestStatus,
    refetch
  };
};