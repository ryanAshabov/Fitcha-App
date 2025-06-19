import { supabase } from '../lib/supabase';
import { 
  AthleticProfile, 
  UserSport, 
  Achievement, 
  CreateUserSportData, 
  CreateAchievementData 
} from '../types/athleticProfile';

export const athleticProfileService = {
  async getAthleticProfile(userId?: string): Promise<{ data: AthleticProfile | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_user_athletic_profile', {
        p_user_id: userId || null
      });

      if (error) {
        throw error;
      }

      return { data: data?.[0] || null, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to fetch athletic profile'
        }
      };
    }
  },

  async addUserSport(sportData: CreateUserSportData): Promise<{ data: string | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('upsert_user_sport', {
        p_sport_name: sportData.sport_name,
        p_skill_level: sportData.skill_level,
        p_preferred_role: sportData.preferred_role || null,
        p_dominant_hand: sportData.dominant_hand || null,
        p_years_experience: sportData.years_experience || 0
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to add user sport'
        }
      };
    }
  },

  async removeUserSport(sportId: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('user_sports')
        .delete()
        .eq('id', sportId);

      if (error) {
        throw error;
      }

      return { success: true, error: null };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'Failed to remove user sport'
        }
      };
    }
  },

  async addAchievement(achievementData: CreateAchievementData): Promise<{ data: string | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('add_user_achievement', {
        p_type: achievementData.type,
        p_title: achievementData.title,
        p_organization: achievementData.organization || null,
        p_description: achievementData.description || null,
        p_date_issued: achievementData.date_issued || null,
        p_expiry_date: achievementData.expiry_date || null,
        p_credential_id: achievementData.credential_id || null,
        p_credential_url: achievementData.credential_url || null
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to add achievement'
        }
      };
    }
  },

  async updateAchievement(achievementId: string, achievementData: Partial<CreateAchievementData>): Promise<{ data: Achievement | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .update({
          ...achievementData,
          updated_at: new Date().toISOString()
        })
        .eq('id', achievementId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to update achievement'
        }
      };
    }
  },

  async removeAchievement(achievementId: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('achievements')
        .delete()
        .eq('id', achievementId);

      if (error) {
        throw error;
      }

      return { success: true, error: null };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'Failed to remove achievement'
        }
      };
    }
  },

  async updateBasicProfile(profileData: {
    first_name?: string;
    last_name?: string;
    bio?: string;
    location?: string;
    birth_date?: string;
    user_type?: 'player' | 'coach' | 'venue_owner';
  }): Promise<{ success: boolean; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      return { success: true, error: null };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'Failed to update profile'
        }
      };
    }
  }
};