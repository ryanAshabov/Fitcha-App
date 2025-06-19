import { useState, useEffect, useRef } from 'react';
import { Profile } from '../types/profile';
import { profileService } from '../services/profileService';
import { useAuth } from './useAuth';

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const fetchedRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (user) {
      // Only fetch if we haven't fetched for this user yet, or if the user has changed
      if (!fetchedRef.current || currentUserIdRef.current !== user.id) {
        currentUserIdRef.current = user.id;
        fetchProfile();
      }
    } else {
      // Reset state when user logs out
      setProfile(null);
      setLoading(false);
      setError(null);
      fetchedRef.current = false;
      currentUserIdRef.current = null;
    }
  }, [user?.id]); // Only depend on user ID, not the entire user object

  const fetchProfile = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    const { data, error: profileError } = await profileService.getCurrentUserProfile();

    if (profileError) {
      setError(profileError.message);
    } else {
      setProfile(data);
    }

    setLoading(false);
    fetchedRef.current = true;
  };

  const updateProfile = async (profileData: any) => {
    const { data, error: updateError } = await profileService.upsertProfile(profileData);

    if (updateError) {
      setError(updateError.message);
      return { success: false, error: updateError.message };
    } else {
      setProfile(data);
      return { success: true, data };
    }
  };

  const refetch = () => {
    fetchedRef.current = false;
    fetchProfile();
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch
  };
};