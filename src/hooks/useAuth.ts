import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Early return if supabase client is not available
    if (!supabase) {
      console.error('Supabase client is not initialized');
      setLoading(false);
      return;
    }

    // Prevent re-initialization on window focus
    if (initializedRef.current) return;

    // Get initial session with error handling
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        initializedRef.current = true;
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        setSession(null);
        setUser(null);
        setLoading(false);
        initializedRef.current = true;
      });

    // Listen for auth changes with error handling
    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from auth changes:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up auth state change listener:', error);
      setLoading(false);
    }
  }, []); // Empty dependency array to run only once

  // Early return with safe defaults if supabase is not available
  if (!supabase) {
    return {
      user: null,
      session: null,
      loading: false,
    };
  }

  return {
    user,
    session,
    loading,
  };
};