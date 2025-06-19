import { supabase } from '../lib/supabase';
import { SignUpData, SignInData } from '../types/auth';

export const authService = {
  async signUp({ firstName, lastName, email, password }: SignUpData) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error: any) {
      return { 
        data: null, 
        error: {
          message: error.message || 'An unexpected error occurred during sign up'
        }
      };
    }
  },

  async signIn({ emailOrPhone, password }: SignInData) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailOrPhone,
        password,
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error: any) {
      return { 
        data: null, 
        error: {
          message: error.message || 'An unexpected error occurred during sign in'
        }
      };
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      return { error: null };
    } catch (error: any) {
      return { 
        error: {
          message: error.message || 'An unexpected error occurred during sign out'
        }
      };
    }
  },
};