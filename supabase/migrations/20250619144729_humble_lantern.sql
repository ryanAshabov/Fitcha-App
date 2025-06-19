/*
  # Profile Page Overhaul - Phase 1: Core Identity & Database Schema

  1. Database Enhancements
    - Add new columns to profiles table (user_type, birth_date, privacy_settings)
    - Create user_sports table for detailed sports information
    - Create achievements table for certifications and awards
    - Add proper indexes and RLS policies

  2. New Tables
    - `user_sports`: Links users to sports with detailed skill information
    - `achievements`: Stores certifications, awards, and accomplishments

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for data access and modification
*/

-- Enhance profiles table with new columns
DO $$
BEGIN
  -- Add user_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'user_type'
  ) THEN
    ALTER TABLE profiles ADD COLUMN user_type text DEFAULT 'player';
    ALTER TABLE profiles ADD CONSTRAINT valid_user_type 
      CHECK (user_type IN ('player', 'coach', 'venue_owner'));
  END IF;

  -- Add birth_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN birth_date date;
  END IF;

  -- Add privacy_settings column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'privacy_settings'
  ) THEN
    ALTER TABLE profiles ADD COLUMN privacy_settings jsonb DEFAULT '{}';
  END IF;
END $$;

-- Create user_sports table
CREATE TABLE IF NOT EXISTS user_sports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sport_name text NOT NULL,
  skill_level text NOT NULL DEFAULT 'Beginner',
  preferred_role text,
  dominant_hand text,
  years_experience integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT fk_user_sports_user FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Business logic constraints
  CONSTRAINT valid_skill_level CHECK (skill_level IN ('Beginner', 'Intermediate', 'Advanced', 'Professional')),
  CONSTRAINT valid_dominant_hand CHECK (dominant_hand IS NULL OR dominant_hand IN ('Right', 'Left', 'Ambidextrous')),
  CONSTRAINT valid_years_experience CHECK (years_experience >= 0 AND years_experience <= 100),
  CONSTRAINT unique_user_sport UNIQUE (user_id, sport_name)
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  organization text,
  description text,
  date_issued date,
  expiry_date date,
  credential_id text,
  credential_url text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT fk_achievements_user FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Business logic constraints
  CONSTRAINT valid_achievement_type CHECK (type IN ('Certification', 'Award', 'Competition', 'Course', 'License')),
  CONSTRAINT valid_dates CHECK (expiry_date IS NULL OR expiry_date > date_issued)
);

-- Enable Row Level Security
ALTER TABLE user_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_sports
CREATE POLICY "Users can view all user sports"
  ON user_sports
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own sports"
  ON user_sports
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for achievements
CREATE POLICY "Users can view all achievements"
  ON achievements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own achievements"
  ON achievements
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sports_user ON user_sports(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sports_sport ON user_sports(sport_name);
CREATE INDEX IF NOT EXISTS idx_user_sports_skill ON user_sports(skill_level);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(type);
CREATE INDEX IF NOT EXISTS idx_achievements_date ON achievements(date_issued DESC);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_user_sports_updated_at
  BEFORE UPDATE ON user_sports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_achievements_updated_at
  BEFORE UPDATE ON achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get user's complete athletic profile
CREATE OR REPLACE FUNCTION get_user_athletic_profile(p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  -- Profile info
  user_id uuid,
  first_name text,
  last_name text,
  user_type text,
  birth_date date,
  age integer,
  bio text,
  avatar_url text,
  location text,
  
  -- Sports info (as JSON array)
  sports jsonb,
  
  -- Achievements info (as JSON array)
  achievements jsonb,
  
  -- Stats
  total_sports integer,
  total_achievements integer,
  profile_completeness integer
) AS $$
DECLARE
  target_user_id uuid := COALESCE(p_user_id, auth.uid());
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.first_name,
    p.last_name,
    p.user_type,
    p.birth_date,
    CASE 
      WHEN p.birth_date IS NOT NULL 
      THEN EXTRACT(YEAR FROM AGE(p.birth_date))::integer
      ELSE NULL 
    END as age,
    p.bio,
    p.avatar_url,
    p.location,
    
    -- Sports as JSON array
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', us.id,
          'sport_name', us.sport_name,
          'skill_level', us.skill_level,
          'preferred_role', us.preferred_role,
          'dominant_hand', us.dominant_hand,
          'years_experience', us.years_experience
        ) ORDER BY us.created_at
      ) FROM user_sports us WHERE us.user_id = target_user_id),
      '[]'::jsonb
    ) as sports,
    
    -- Achievements as JSON array
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'type', a.type,
          'title', a.title,
          'organization', a.organization,
          'description', a.description,
          'date_issued', a.date_issued,
          'expiry_date', a.expiry_date,
          'credential_id', a.credential_id,
          'credential_url', a.credential_url,
          'is_verified', a.is_verified
        ) ORDER BY a.date_issued DESC NULLS LAST
      ) FROM achievements a WHERE a.user_id = target_user_id),
      '[]'::jsonb
    ) as achievements,
    
    -- Stats
    (SELECT COUNT(*)::integer FROM user_sports us WHERE us.user_id = target_user_id) as total_sports,
    (SELECT COUNT(*)::integer FROM achievements a WHERE a.user_id = target_user_id) as total_achievements,
    
    -- Profile completeness calculation (0-100)
    (
      CASE WHEN p.first_name IS NOT NULL AND p.first_name != '' THEN 15 ELSE 0 END +
      CASE WHEN p.last_name IS NOT NULL AND p.last_name != '' THEN 15 ELSE 0 END +
      CASE WHEN p.bio IS NOT NULL AND p.bio != '' THEN 20 ELSE 0 END +
      CASE WHEN p.avatar_url IS NOT NULL AND p.avatar_url != '' THEN 15 ELSE 0 END +
      CASE WHEN p.location IS NOT NULL AND p.location != '' THEN 10 ELSE 0 END +
      CASE WHEN p.birth_date IS NOT NULL THEN 10 ELSE 0 END +
      CASE WHEN (SELECT COUNT(*) FROM user_sports us WHERE us.user_id = target_user_id) > 0 THEN 15 ELSE 0 END
    )::integer as profile_completeness
    
  FROM profiles p
  WHERE p.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add or update user sport
CREATE OR REPLACE FUNCTION upsert_user_sport(
  p_sport_name text,
  p_skill_level text,
  p_preferred_role text DEFAULT NULL,
  p_dominant_hand text DEFAULT NULL,
  p_years_experience integer DEFAULT 0
)
RETURNS uuid AS $$
DECLARE
  sport_id uuid;
BEGIN
  INSERT INTO user_sports (
    user_id,
    sport_name,
    skill_level,
    preferred_role,
    dominant_hand,
    years_experience
  ) VALUES (
    auth.uid(),
    p_sport_name,
    p_skill_level,
    p_preferred_role,
    p_dominant_hand,
    p_years_experience
  )
  ON CONFLICT (user_id, sport_name) 
  DO UPDATE SET
    skill_level = EXCLUDED.skill_level,
    preferred_role = EXCLUDED.preferred_role,
    dominant_hand = EXCLUDED.dominant_hand,
    years_experience = EXCLUDED.years_experience,
    updated_at = now()
  RETURNING id INTO sport_id;
  
  RETURN sport_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add achievement
CREATE OR REPLACE FUNCTION add_user_achievement(
  p_type text,
  p_title text,
  p_organization text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_date_issued date DEFAULT NULL,
  p_expiry_date date DEFAULT NULL,
  p_credential_id text DEFAULT NULL,
  p_credential_url text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  achievement_id uuid;
BEGIN
  INSERT INTO achievements (
    user_id,
    type,
    title,
    organization,
    description,
    date_issued,
    expiry_date,
    credential_id,
    credential_url
  ) VALUES (
    auth.uid(),
    p_type,
    p_title,
    p_organization,
    p_description,
    p_date_issued,
    p_expiry_date,
    p_credential_id,
    p_credential_url
  )
  RETURNING id INTO achievement_id;
  
  RETURN achievement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing sports column in profiles to be compatible
-- This migration preserves existing data while adding the new structure
DO $$
DECLARE
  profile_record RECORD;
  sport_record RECORD;
BEGIN
  -- Migrate existing sports data from profiles.sports to user_sports table
  FOR profile_record IN 
    SELECT user_id, sports 
    FROM profiles 
    WHERE sports IS NOT NULL AND jsonb_array_length(sports) > 0
  LOOP
    -- Loop through each sport in the sports array
    FOR sport_record IN 
      SELECT 
        value->>'sport' as sport_name,
        value->>'level' as skill_level
      FROM jsonb_array_elements(profile_record.sports)
      WHERE value->>'sport' IS NOT NULL AND value->>'sport' != ''
    LOOP
      -- Insert into user_sports table if not already exists
      INSERT INTO user_sports (user_id, sport_name, skill_level)
      VALUES (
        profile_record.user_id, 
        sport_record.sport_name, 
        COALESCE(sport_record.skill_level, 'Beginner')
      )
      ON CONFLICT (user_id, sport_name) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;