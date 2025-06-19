/*
  # Post Likes System

  1. New Tables
    - `post_likes`
      - `post_id` (uuid, FK to posts)
      - `user_id` (uuid, FK to profiles)
      - `created_at` (timestamp)
      - Composite primary key on (post_id, user_id)

  2. Security
    - Enable RLS on `post_likes` table
    - Add policies for authenticated users to manage their own likes

  3. Functions
    - Function to toggle like status
    - Function to get post like counts and user like status
*/

-- Create post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  -- Composite primary key to prevent duplicate likes
  PRIMARY KEY (post_id, user_id)
);

-- Enable RLS
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_likes
CREATE POLICY "Users can view all post likes"
  ON post_likes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own likes"
  ON post_likes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to toggle like status
CREATE OR REPLACE FUNCTION toggle_post_like(p_post_id uuid)
RETURNS TABLE (
  liked boolean,
  like_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_liked boolean;
  v_count bigint;
BEGIN
  -- Check if user has already liked this post
  SELECT EXISTS (
    SELECT 1 FROM post_likes 
    WHERE post_id = p_post_id AND user_id = v_user_id
  ) INTO v_liked;
  
  IF v_liked THEN
    -- Unlike the post
    DELETE FROM post_likes 
    WHERE post_id = p_post_id AND user_id = v_user_id;
    v_liked := false;
  ELSE
    -- Like the post
    INSERT INTO post_likes (post_id, user_id) 
    VALUES (p_post_id, v_user_id);
    v_liked := true;
  END IF;
  
  -- Get updated like count
  SELECT COUNT(*) INTO v_count
  FROM post_likes 
  WHERE post_id = p_post_id;
  
  -- Update the posts table with the new count
  UPDATE posts 
  SET likes_count = v_count 
  WHERE id = p_post_id;
  
  RETURN QUERY SELECT v_liked, v_count;
END;
$$;

-- Function to get enhanced feed posts with like status
CREATE OR REPLACE FUNCTION get_feed_posts_with_likes(
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  content text,
  image_url text,
  likes_count integer,
  comments_count integer,
  created_at timestamptz,
  author_first_name text,
  author_last_name text,
  author_avatar_url text,
  author_location text,
  user_has_liked boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.content,
    p.image_url,
    p.likes_count,
    p.comments_count,
    p.created_at,
    pr.first_name as author_first_name,
    pr.last_name as author_last_name,
    pr.avatar_url as author_avatar_url,
    pr.location as author_location,
    COALESCE(
      EXISTS (
        SELECT 1 FROM post_likes pl 
        WHERE pl.post_id = p.id AND pl.user_id = v_user_id
      ), 
      false
    ) as user_has_liked
  FROM posts p
  JOIN profiles pr ON p.user_id = pr.user_id
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_created ON post_likes(created_at DESC);

-- Update the existing get_feed_posts function to use the new enhanced version
DROP FUNCTION IF EXISTS get_feed_posts(integer, integer);