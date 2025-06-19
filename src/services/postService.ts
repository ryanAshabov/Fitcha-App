import { supabase } from '../lib/supabase';
import { Post, CreatePostData, SuggestedPlayer, FeaturedCourt, LikeToggleResult } from '../types/post';

export const postService = {
  async createPost(postData: CreatePostData): Promise<{ data: Post | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: postData.content,
          image_url: postData.image_url
        })
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
          message: error.message || 'Failed to create post'
        }
      };
    }
  },

  async getFeedPosts(limit: number = 20, offset: number = 0): Promise<{ 
    data: Post[] | null; 
    error: any 
  }> {
    try {
      const { data, error } = await supabase.rpc('get_feed_posts_with_likes', {
        p_limit: limit,
        p_offset: offset
      });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to fetch feed posts'
        }
      };
    }
  },

  async togglePostLike(postId: string): Promise<{ data: LikeToggleResult | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('toggle_post_like', {
        p_post_id: postId
      });

      if (error) {
        throw error;
      }

      return { data: data?.[0] || null, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to toggle like'
        }
      };
    }
  },

  async getSuggestedPlayers(limit: number = 5): Promise<{ 
    data: SuggestedPlayer[] | null; 
    error: any 
  }> {
    try {
      const { data, error } = await supabase.rpc('get_suggested_players', {
        p_limit: limit
      });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to fetch suggested players'
        }
      };
    }
  },

  async getFeaturedCourts(limit: number = 3): Promise<{ 
    data: FeaturedCourt[] | null; 
    error: any 
  }> {
    try {
      const { data, error } = await supabase.rpc('get_featured_courts', {
        p_limit: limit
      });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to fetch featured courts'
        }
      };
    }
  },

  async deletePost(postId: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) {
        throw error;
      }

      return { success: true, error: null };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'Failed to delete post'
        }
      };
    }
  }
};