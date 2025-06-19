import { useState, useEffect, useRef } from 'react';
import { AthleticProfile } from '../types/athleticProfile';
import { athleticProfileService } from '../services/athleticProfileService';
import { useAuth } from './useAuth';

export const useAthleticProfile = (userId?: string) => {
  const [profile, setProfile] = useState<AthleticProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const fetchedRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  // Determine if we're viewing our own profile or another user's
  const targetUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  useEffect(() => {
    if (targetUserId) {
      // Only fetch if we haven't fetched for this user yet, or if the user has changed
      if (!fetchedRef.current || currentUserIdRef.current !== targetUserId) {
        currentUserIdRef.current = targetUserId;
        fetchProfile();
      }
    } else {
      // Reset state when no target user
      setProfile(null);
      setLoading(false);
      setError(null);
      fetchedRef.current = false;
      currentUserIdRef.current = null;
    }
  }, [targetUserId]);

  const fetchProfile = async () => {
    if (!targetUserId) return;

    setLoading(true);
    setError(null);

    const { data, error: profileError } = await athleticProfileService.getAthleticProfile(
      isOwnProfile ? undefined : targetUserId
    );

    if (profileError) {
      setError(profileError.message);
    } else {
      setProfile(data);
    }

    setLoading(false);
    fetchedRef.current = true;
  };

  const addSport = async (sportData: any) => {
    const result = await athleticProfileService.addUserSport(sportData);
    
    if (result.error) {
      return { success: false, error: result.error.message };
    }

    // Refresh profile after adding sport
    await fetchProfile();
    return { success: true, data: result.data };
  };

  const removeSport = async (sportId: string) => {
    const result = await athleticProfileService.removeUserSport(sportId);
    
    if (result.error) {
      return { success: false, error: result.error.message };
    }

    // Refresh profile after removing sport
    await fetchProfile();
    return { success: true };
  };

  const addAchievement = async (achievementData: any) => {
    const result = await athleticProfileService.addAchievement(achievementData);
    
    if (result.error) {
      return { success: false, error: result.error.message };
    }

    // Refresh profile after adding achievement
    await fetchProfile();
    return { success: true, data: result.data };
  };

  const removeAchievement = async (achievementId: string) => {
    const result = await athleticProfileService.removeAchievement(achievementId);
    
    if (result.error) {
      return { success: false, error: result.error.message };
    }

    // Refresh profile after removing achievement
    await fetchProfile();
    return { success: true };
  };

  const updateBasicProfile = async (profileData: any) => {
    const result = await athleticProfileService.updateBasicProfile(profileData);
    
    if (result.error) {
      return { success: false, error: result.error.message };
    }

    // Refresh profile after updating
    await fetchProfile();
    return { success: true };
  };

  const refetch = () => {
    fetchedRef.current = false;
    fetchProfile();
  };

  return {
    profile,
    loading,
    error,
    isOwnProfile,
    addSport,
    removeSport,
    addAchievement,
    removeAchievement,
    updateBasicProfile,
    refetch
  };
};