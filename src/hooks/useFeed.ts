import { useState, useEffect, useRef } from 'react';
import { Post, SuggestedPlayer, FeaturedCourt } from '../types/post';
import { postService } from '../services/postService';
import { useAuth } from './useAuth';

export const useFeed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [suggestedPlayers, setSuggestedPlayers] = useState<SuggestedPlayer[]>([]);
  const [featuredCourts, setFeaturedCourts] = useState<FeaturedCourt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (user && !fetchedRef.current) {
      fetchFeedData();
      fetchedRef.current = true;
    } else if (!user) {
      // Reset state when user logs out
      setPosts([]);
      setSuggestedPlayers([]);
      setFeaturedCourts([]);
      setLoading(false);
      setError(null);
      fetchedRef.current = false;
    }
  }, [user?.id]);

  const fetchFeedData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const [postsResult, playersResult, courtsResult] = await Promise.all([
        postService.getFeedPosts(),
        postService.getSuggestedPlayers(),
        postService.getFeaturedCourts()
      ]);

      if (postsResult.error) {
        throw new Error(postsResult.error.message);
      }
      if (playersResult.error) {
        throw new Error(playersResult.error.message);
      }
      if (courtsResult.error) {
        throw new Error(courtsResult.error.message);
      }

      setPosts(postsResult.data || []);
      setSuggestedPlayers(playersResult.data || []);
      setFeaturedCourts(courtsResult.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (content: string, imageUrl?: string) => {
    const result = await postService.createPost({ content, image_url: imageUrl });
    
    if (result.error) {
      return { success: false, error: result.error.message };
    }

    // Refresh feed after creating post
    await fetchFeedData();
    return { success: true, data: result.data };
  };

  const deletePost = async (postId: string) => {
    const result = await postService.deletePost(postId);
    
    if (result.error) {
      return { success: false, error: result.error.message };
    }

    // Remove post from local state
    setPosts(prev => prev.filter(post => post.id !== postId));
    return { success: true };
  };

  const refetch = () => {
    fetchedRef.current = false;
    fetchFeedData();
  };

  return {
    posts,
    suggestedPlayers,
    featuredCourts,
    loading,
    error,
    createPost,
    deletePost,
    refetch
  };
};