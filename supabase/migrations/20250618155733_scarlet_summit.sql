/*
  # Social Feed System Implementation

  1. New Tables
    - `posts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles.user_id)
      - `content` (text) - The text content of the post
      - `image_url` (text, nullable) - Link to uploaded image/video
      - `likes_count` (integer, default 0)
      - `comments_count` (integer, default 0)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `posts` table
    - Add policies for authenticated users to create/read posts
    - Users can delete their own posts

  3. Functions
    - RPC function to get feed posts with user profile data
*/

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  image_url text,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT fk_post_user FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
CREATE POLICY "Posts are viewable by authenticated users"
  ON posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Function to get feed posts with user profile data
CREATE OR REPLACE FUNCTION get_feed_posts(
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
  author_location text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    pr.location as author_location
  FROM posts p
  JOIN profiles pr ON p.user_id = pr.user_id
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function to get suggested players (players you may know)
CREATE OR REPLACE FUNCTION get_suggested_players(
  p_limit integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  location text,
  sports jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.first_name,
    p.last_name,
    p.avatar_url,
    p.location,
    p.sports
  FROM profiles p
  WHERE p.user_id != auth.uid()
    AND p.user_id NOT IN (
      -- Exclude users we already have game requests with
      SELECT DISTINCT 
        CASE 
          WHEN sender_id = auth.uid() THEN receiver_id
          WHEN receiver_id = auth.uid() THEN sender_id
        END
      FROM game_requests
      WHERE sender_id = auth.uid() OR receiver_id = auth.uid()
    )
  ORDER BY RANDOM()
  LIMIT p_limit;
END;
$$;

-- Function to get featured courts
CREATE OR REPLACE FUNCTION get_featured_courts(
  p_limit integer DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  name text,
  sport_type text,
  location_address text,
  hourly_price numeric,
  images jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.sport_type,
    c.location_address,
    c.hourly_price,
    c.images
  FROM courts c
  ORDER BY c.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Insert some sample posts for demonstration
INSERT INTO posts (user_id, content, created_at) 
SELECT 
  p.user_id,
  CASE 
    WHEN p.sports::text LIKE '%Tennis%' THEN 'Just finished an amazing tennis session! Looking for more players to join our weekly games. 🎾'
    WHEN p.sports::text LIKE '%Basketball%' THEN 'Great basketball practice today! Our team is really coming together. Who wants to scrimmage this weekend? 🏀'
    WHEN p.sports::text LIKE '%Football%' THEN 'Football season is here! Training hard and ready for the upcoming matches. Let''s go team! ⚽'
    WHEN p.sports::text LIKE '%Soccer%' THEN 'Soccer practice was intense today! Working on our passing game. Anyone up for a friendly match? ⚽'
    ELSE 'Had an incredible workout today! Feeling stronger and more motivated than ever. What''s your favorite way to stay active? 💪'
  END as content,
  now() - (random() * interval '7 days') as created_at
FROM profiles p
WHERE p.sports IS NOT NULL 
  AND jsonb_array_length(p.sports) > 0
LIMIT 10
ON CONFLICT DO NOTHING;