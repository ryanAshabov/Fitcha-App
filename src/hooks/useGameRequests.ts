import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const setupGameRequests = async () => {
      // Early return if no user
      if (!user) {
        setReceivedRequests([]);
        setSentRequests([]);
        setPendingCount(0);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        // 1. Fetch initial data first - await all requests sequentially
        const [receivedResult, sentResult, countResult] = await Promise.all([
          gameRequestService.getReceivedRequests(),
          gameRequestService.getSentRequests(),
          gameRequestService.getPendingReceivedCount()
        ]);

        // Handle any errors from the requests
        if (receivedResult.error) {
          throw new Error(receivedResult.error.message);
        }
        if (sentResult.error) {
          throw new Error(sentResult.error.message);
        }
        if (countResult.error) {
          throw new Error(countResult.error.message);
        }

        // 2. Set initial state with fetched data
        setReceivedRequests(receivedResult.data || []);
        setSentRequests(sentResult.data || []);
        setPendingCount(countResult.data);
        setError(null);

      } catch (err: any) {
        // Handle errors by setting error state and safe defaults
        setError(err.message);
        setReceivedRequests([]);
        setSentRequests([]);
        setPendingCount(0);
      } finally {
        // 3. Always set loading to false after initial fetch attempt
        setLoading(false);
      }

      // 4. Set up real-time subscriptions after initial state is established
      // Note: In a real implementation, you would set up Supabase real-time listeners here
      // For now, we'll skip this as the current codebase doesn't show real-time subscriptions
      // for game requests, but the pattern would be:
      // const subscription = supabase.channel('game_requests')...
      // return () => subscription.unsubscribe();
    };

    setupGameRequests();
  }, [user?.id]); // Only re-run when user ID changes

  const updateRequestStatus = async (requestId: string, status: 'accepted' | 'declined' | 'cancelled') => {
    const result = await gameRequestService.updateRequestStatus(requestId, { status });
    
    if (result.error) {
      return { success: false, error: result.error.message };
    }

    // Refresh data after update by re-fetching
    try {
      const [receivedResult, sentResult, countResult] = await Promise.all([
        gameRequestService.getReceivedRequests(),
        gameRequestService.getSentRequests(),
        gameRequestService.getPendingReceivedCount()
      ]);

      if (!receivedResult.error && !sentResult.error && !countResult.error) {
        setReceivedRequests(receivedResult.data || []);
        setSentRequests(sentResult.data || []);
        setPendingCount(countResult.data);
      }
    } catch (err) {
      // Silently handle refresh errors - the update still succeeded
      console.error('Failed to refresh requests after update:', err);
    }

    return { success: true, data: result.data };
  };

  const refetch = () => {
    setLoading(true);
    // Trigger re-fetch by updating a dependency or calling setupGameRequests again
    // For simplicity, we'll just reload the component state
    window.location.reload();
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