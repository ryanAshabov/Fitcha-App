import { useState, useEffect, useRef } from 'react';
import { GameSession } from '../types/gameSession';
import { gameSessionService } from '../services/gameSessionService';
import { useAuth } from './useAuth';

export const useGameSessions = () => {
  const [activeSessions, setActiveSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (user && !fetchedRef.current) {
      fetchActiveSessions();
      fetchedRef.current = true;
    } else if (!user) {
      // Reset state when user logs out
      setActiveSessions([]);
      setLoading(false);
      setError(null);
      fetchedRef.current = false;
    }
  }, [user?.id]);

  const fetchActiveSessions = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const result = await gameSessionService.getUserActiveSessions();

      if (result.error) {
        throw new Error(result.error.message);
      }

      setActiveSessions(result.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (inviteeId: string, sport: string, proposedDateTime: string) => {
    const result = await gameSessionService.createSession({
      invitee_id: inviteeId,
      sport,
      proposed_datetime: proposedDateTime
    });
    
    if (result.error) {
      return { success: false, error: result.error.message };
    }

    // Refresh sessions after creating
    await fetchActiveSessions();
    return { success: true, data: result.data };
  };

  const updateSession = async (sessionId: string, updateData: any) => {
    const result = await gameSessionService.updateSession(sessionId, updateData);
    
    if (result.error) {
      return { success: false, error: result.error.message };
    }

    // Refresh sessions after update
    await fetchActiveSessions();
    return { success: true, data: result.data };
  };

  const refetch = () => {
    fetchedRef.current = false;
    fetchActiveSessions();
  };

  return {
    activeSessions,
    loading,
    error,
    createSession,
    updateSession,
    refetch
  };
};