/*
  # Match History & Peer Endorsements System

  1. New Tables
    - `matches`
      - `id` (uuid, primary key)
      - `request_id` (uuid, foreign key to game_requests)
      - `winner_id` (uuid, foreign key to profiles.user_id)
      - `loser_id` (uuid, foreign key to profiles.user_id)
      - `score` (text)
      - `status` (text: 'pending_confirmation', 'verified')
      - `created_at` (timestamp)
      - `verified_at` (timestamp)
    
    - `skill_endorsements`
      - `id` (uuid, primary key)
      - `endorser_id` (uuid, foreign key to profiles.user_id)
      - `recipient_id` (uuid, foreign key to profiles.user_id)
      - `skill_name` (text)
      - `match_id` (uuid, foreign key to matches)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
    - Add policies for viewing verified matches and endorsements

  3. Functions
    - Function to check for completed games and create notifications
    - Function to get match history for a user
    - Function to get skill endorsements for a user
*/

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES game_requests(id) ON DELETE CASCADE,
  winner_id uuid REFERENCES profiles(user_id) ON DELETE SET NULL,
  loser_id uuid REFERENCES profiles(user_id) ON DELETE SET NULL,
  score text,
  status text NOT NULL DEFAULT 'pending_confirmation' CHECK (status IN ('pending_confirmation', 'verified')),
  created_at timestamptz DEFAULT now(),
  verified_at timestamptz,
  
  -- Ensure we don't have duplicate matches for the same request
  UNIQUE(request_id)
);

-- Create skill_endorsements table
CREATE TABLE IF NOT EXISTS skill_endorsements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endorser_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate endorsements for the same skill from the same person in the same match
  UNIQUE(endorser_id, recipient_id, skill_name, match_id),
  
  -- Prevent self-endorsements
  CHECK (endorser_id != recipient_id)
);

-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_endorsements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for matches
CREATE POLICY "Users can view verified matches they participated in"
  ON matches
  FOR SELECT
  TO authenticated
  USING (
    status = 'verified' AND 
    (winner_id = auth.uid() OR loser_id = auth.uid() OR 
     request_id IN (
       SELECT id FROM game_requests 
       WHERE sender_id = auth.uid() OR receiver_id = auth.uid()
     ))
  );

CREATE POLICY "Users can create matches for their accepted requests"
  ON matches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    request_id IN (
      SELECT id FROM game_requests 
      WHERE (sender_id = auth.uid() OR receiver_id = auth.uid()) 
      AND status = 'accepted'
    )
  );

CREATE POLICY "Users can update matches they participated in"
  ON matches
  FOR UPDATE
  TO authenticated
  USING (
    request_id IN (
      SELECT id FROM game_requests 
      WHERE sender_id = auth.uid() OR receiver_id = auth.uid()
    )
  );

-- RLS Policies for skill_endorsements
CREATE POLICY "Users can view endorsements for verified matches"
  ON skill_endorsements
  FOR SELECT
  TO authenticated
  USING (
    match_id IN (
      SELECT id FROM matches WHERE status = 'verified'
    )
  );

CREATE POLICY "Users can create endorsements for their verified matches"
  ON skill_endorsements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    endorser_id = auth.uid() AND
    match_id IN (
      SELECT m.id FROM matches m
      JOIN game_requests gr ON m.request_id = gr.id
      WHERE m.status = 'verified' 
      AND (gr.sender_id = auth.uid() OR gr.receiver_id = auth.uid())
    )
  );

-- Function to get user's match history
CREATE OR REPLACE FUNCTION get_user_match_history(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  match_id uuid,
  opponent_name text,
  opponent_avatar_url text,
  sport_type text,
  match_date timestamptz,
  result text,
  score text,
  verified_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as match_id,
    CASE 
      WHEN m.winner_id = p_user_id THEN loser_profile.first_name || ' ' || loser_profile.last_name
      ELSE winner_profile.first_name || ' ' || winner_profile.last_name
    END as opponent_name,
    CASE 
      WHEN m.winner_id = p_user_id THEN loser_profile.avatar_url
      ELSE winner_profile.avatar_url
    END as opponent_avatar_url,
    'General' as sport_type, -- Can be enhanced later with sport from request
    m.verified_at as match_date,
    CASE 
      WHEN m.winner_id = p_user_id THEN 'Won'
      WHEN m.loser_id = p_user_id THEN 'Lost'
      ELSE 'Draw'
    END as result,
    m.score,
    m.verified_at
  FROM matches m
  LEFT JOIN profiles winner_profile ON m.winner_id = winner_profile.user_id
  LEFT JOIN profiles loser_profile ON m.loser_id = loser_profile.user_id
  WHERE m.status = 'verified' 
  AND (m.winner_id = p_user_id OR m.loser_id = p_user_id)
  ORDER BY m.verified_at DESC;
END;
$$;

-- Function to get user's skill endorsements
CREATE OR REPLACE FUNCTION get_user_skill_endorsements(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  skill_name text,
  endorsement_count bigint,
  recent_endorsers text[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    se.skill_name,
    COUNT(*) as endorsement_count,
    ARRAY_AGG(
      endorser_profile.first_name || ' ' || endorser_profile.last_name
      ORDER BY se.created_at DESC
    )::text[] as recent_endorsers
  FROM skill_endorsements se
  JOIN profiles endorser_profile ON se.endorser_id = endorser_profile.user_id
  WHERE se.recipient_id = p_user_id
  GROUP BY se.skill_name
  ORDER BY endorsement_count DESC, se.skill_name;
END;
$$;

-- Function to check for completed games and create notifications
CREATE OR REPLACE FUNCTION check_completed_games()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  completed_request RECORD;
BEGIN
  -- Find accepted requests where the proposed datetime has passed
  -- and no match record exists yet
  FOR completed_request IN
    SELECT 
      gr.id as request_id,
      gr.sender_id,
      gr.receiver_id,
      sender_profile.first_name || ' ' || sender_profile.last_name as sender_name,
      receiver_profile.first_name || ' ' || receiver_profile.last_name as receiver_name
    FROM game_requests gr
    JOIN profiles sender_profile ON gr.sender_id = sender_profile.user_id
    JOIN profiles receiver_profile ON gr.receiver_id = receiver_profile.user_id
    WHERE gr.status = 'accepted'
    AND gr.proposed_datetime < NOW()
    AND NOT EXISTS (
      SELECT 1 FROM matches WHERE request_id = gr.id
    )
  LOOP
    -- Create notifications for both players
    INSERT INTO notifications (user_id, type, message, related_entity_id)
    VALUES 
      (
        completed_request.sender_id,
        'match_result_needed',
        'Log the result for your match with ' || completed_request.receiver_name,
        completed_request.request_id
      ),
      (
        completed_request.receiver_id,
        'match_result_needed',
        'Log the result for your match with ' || completed_request.sender_name,
        completed_request.request_id
      );
  END LOOP;
END;
$$;

-- Add new notification type to the constraint
DO $$
BEGIN
  -- Drop the existing constraint
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS valid_notification_type;
  
  -- Add the new constraint with the additional type
  ALTER TABLE notifications ADD CONSTRAINT valid_notification_type 
    CHECK (type = ANY (ARRAY[
      'new_game_request'::text, 
      'request_accepted'::text, 
      'request_declined'::text, 
      'booking_confirmed'::text,
      'match_result_needed'::text
    ]));
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_matches_participants ON matches(winner_id, loser_id);
CREATE INDEX IF NOT EXISTS idx_matches_request ON matches(request_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_skill_endorsements_recipient ON skill_endorsements(recipient_id);
CREATE INDEX IF NOT EXISTS idx_skill_endorsements_skill ON skill_endorsements(skill_name);