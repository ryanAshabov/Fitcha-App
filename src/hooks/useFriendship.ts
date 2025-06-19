import { useState, useEffect } from 'react';
import { Friendship, Friend, PendingFriendRequest, FriendshipButtonState } from '../types/friendship';
import { friendshipService } from '../services/friendshipService';
import { useAuth } from './useAuth';

export const useFriendshipStatus = (userId: string | null) => {
  const [friendship, setFriendship] = useState<Friendship | null>(null);
  const [buttonState, setButtonState] = useState<FriendshipButtonState>('loading');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (userId && user && userId !== user.id) {
      fetchFriendshipStatus();
    } else {
      setLoading(false);
      setButtonState('add_friend');
    }
  }, [userId, user?.id]);

  const fetchFriendshipStatus = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await friendshipService.getFriendshipStatus(userId);

      if (result.error) {
        throw new Error(result.error.message);
      }

      setFriendship(result.data);
      updateButtonState(result.data);
    } catch (err: any) {
      setError(err.message);
      setButtonState('add_friend');
    } finally {
      setLoading(false);
    }
  };

  const updateButtonState = (friendshipData: Friendship | null) => {
    if (!friendshipData) {
      setButtonState('add_friend');
      return;
    }

    const { status, requester_id } = friendshipData;
    const isRequester = requester_id === user?.id;

    switch (status) {
      case 'pending':
        setButtonState(isRequester ? 'request_sent' : 'request_received');
        break;
      case 'accepted':
        setButtonState('friends');
        break;
      case 'blocked':
        setButtonState('blocked');
        break;
      default:
        setButtonState('add_friend');
    }
  };

  const sendFriendRequest = async () => {
    if (!userId) return { success: false, error: 'Invalid user ID' };

    setButtonState('loading');

    const result = await friendshipService.sendFriendRequest({
      receiver_id: userId
    });

    if (result.error) {
      setButtonState('add_friend');
      return { success: false, error: result.error.message };
    }

    setFriendship(result.data);
    setButtonState('request_sent');
    return { success: true };
  };

  const cancelFriendRequest = async () => {
    if (!friendship) return { success: false, error: 'No friendship found' };

    setButtonState('loading');

    const result = await friendshipService.cancelFriendRequest(friendship.friendship_id);

    if (result.error) {
      setButtonState('request_sent');
      return { success: false, error: result.error.message };
    }

    setFriendship(null);
    setButtonState('add_friend');
    return { success: true };
  };

  const acceptFriendRequest = async () => {
    if (!friendship) return { success: false, error: 'No friendship found' };

    setButtonState('loading');

    const result = await friendshipService.updateFriendship(friendship.friendship_id, {
      status: 'accepted'
    });

    if (result.error) {
      setButtonState('request_received');
      return { success: false, error: result.error.message };
    }

    setFriendship(result.data);
    setButtonState('friends');
    return { success: true };
  };

  const declineFriendRequest = async () => {
    if (!friendship) return { success: false, error: 'No friendship found' };

    setButtonState('loading');

    const result = await friendshipService.updateFriendship(friendship.friendship_id, {
      status: 'declined'
    });

    if (result.error) {
      setButtonState('request_received');
      return { success: false, error: result.error.message };
    }

    setFriendship(null);
    setButtonState('add_friend');
    return { success: true };
  };

  const unfriend = async () => {
    if (!friendship) return { success: false, error: 'No friendship found' };

    setButtonState('loading');

    const result = await friendshipService.unfriend(friendship.friendship_id);

    if (result.error) {
      setButtonState('friends');
      return { success: false, error: result.error.message };
    }

    setFriendship(null);
    setButtonState('add_friend');
    return { success: true };
  };

  return {
    friendship,
    buttonState,
    loading,
    error,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    unfriend,
    refetch: fetchFriendshipStatus
  };
};

export const useFriends = (userId?: string) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFriends();
  }, [userId]);

  const fetchFriends = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await friendshipService.getUserFriends(userId);

      if (result.error) {
        throw new Error(result.error.message);
      }

      setFriends(result.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    friends,
    loading,
    error,
    refetch: fetchFriends
  };
};

export const usePendingFriendRequests = () => {
  const [pendingRequests, setPendingRequests] = useState<PendingFriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await friendshipService.getPendingFriendRequests();

      if (result.error) {
        throw new Error(result.error.message);
      }

      setPendingRequests(result.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (friendshipId: string) => {
    const result = await friendshipService.updateFriendship(friendshipId, {
      status: 'accepted'
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    // Remove from pending requests
    setPendingRequests(prev => prev.filter(req => req.friendship_id !== friendshipId));
    return { success: true };
  };

  const declineRequest = async (friendshipId: string) => {
    const result = await friendshipService.updateFriendship(friendshipId, {
      status: 'declined'
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    // Remove from pending requests
    setPendingRequests(prev => prev.filter(req => req.friendship_id !== friendshipId));
    return { success: true };
  };

  return {
    pendingRequests,
    loading,
    error,
    acceptRequest,
    declineRequest,
    refetch: fetchPendingRequests
  };
};