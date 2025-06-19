/*
  # Friendship System Implementation

  1. New Tables
    - `friendships`
      - `id` (uuid, primary key)
      - `requester_id` (uuid, foreign key to profiles.user_id)
      - `receiver_id` (uuid, foreign key to profiles.user_id)
      - `status` (text, enum: pending, accepted, declined, blocked)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `friendships` table
    - Add policies for viewing, creating, updating, and deleting friendships
    - Add constraints to prevent self-friendship and duplicate requests

  3. Functions
    - `get_friendship_status` - Get friendship status between two users
    - `get_user_friends` - Get user's friends list
    - `get_pending_friend_requests` - Get pending friend requests
    - `handle_friendship_notification` - Send notifications for friendship events

  4. Triggers
    - Auto-update `updated_at` timestamp
    - Send notifications for friendship events

  5. Indexes
    - Performance indexes for common queries
*/

-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT fk_friendship_requester FOREIGN KEY (requester_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_friendship_receiver FOREIGN KEY (receiver_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Business logic constraints
  CONSTRAINT no_self_friendship CHECK (requester_id != receiver_id),
  CONSTRAINT valid_friendship_status CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  CONSTRAINT unique_friendship_pair UNIQUE (requester_id, receiver_id)
);

-- Enable Row Level Security
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friendships
CREATE POLICY "Users can view friendships they are involved in"
  ON friendships
  FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create friendship requests"
  ON friendships
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendships they are involved in"
  ON friendships
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can delete friendships they are involved in"
  ON friendships
  FOR DELETE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_receiver ON friendships(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_friendships_created_at ON friendships(created_at DESC);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle friendship notifications
CREATE OR REPLACE FUNCTION handle_friendship_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Send notification for new friendship requests
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    INSERT INTO notifications (user_id, actor_id, type, message, related_entity_id)
    SELECT 
      NEW.receiver_id,
      NEW.requester_id,
      'friend_request',
      (SELECT first_name || ' ' || last_name FROM profiles WHERE user_id = NEW.requester_id) || ' sent you a friend request',
      NEW.id;
  END IF;
  
  -- Send notification for accepted friendship requests
  IF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    INSERT INTO notifications (user_id, actor_id, type, message, related_entity_id)
    SELECT 
      NEW.requester_id,
      NEW.receiver_id,
      'friend_request_accepted',
      (SELECT first_name || ' ' || last_name FROM profiles WHERE user_id = NEW.receiver_id) || ' accepted your friend request',
      NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for friendship notifications
DROP TRIGGER IF EXISTS trigger_friendship_notification ON friendships;
CREATE TRIGGER trigger_friendship_notification
  AFTER INSERT OR UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION handle_friendship_notification();

-- Function to get friendship status between two users
CREATE OR REPLACE FUNCTION get_friendship_status(user1_id uuid, user2_id uuid)
RETURNS TABLE (
  friendship_id uuid,
  status text,
  requester_id uuid,
  receiver_id uuid,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as friendship_id,
    f.status,
    f.requester_id,
    f.receiver_id,
    f.created_at
  FROM friendships f
  WHERE (f.requester_id = user1_id AND f.receiver_id = user2_id)
     OR (f.requester_id = user2_id AND f.receiver_id = user1_id)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's friends list
CREATE OR REPLACE FUNCTION get_user_friends(p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  friend_id uuid,
  friend_name text,
  friend_avatar text,
  friend_location text,
  friendship_date timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN f.requester_id = COALESCE(p_user_id, auth.uid()) THEN f.receiver_id
      ELSE f.requester_id
    END as friend_id,
    CASE 
      WHEN f.requester_id = COALESCE(p_user_id, auth.uid()) THEN p2.first_name || ' ' || p2.last_name
      ELSE p1.first_name || ' ' || p1.last_name
    END as friend_name,
    CASE 
      WHEN f.requester_id = COALESCE(p_user_id, auth.uid()) THEN p2.avatar_url
      ELSE p1.avatar_url
    END as friend_avatar,
    CASE 
      WHEN f.requester_id = COALESCE(p_user_id, auth.uid()) THEN p2.location
      ELSE p1.location
    END as friend_location,
    f.updated_at as friendship_date
  FROM friendships f
  LEFT JOIN profiles p1 ON f.requester_id = p1.user_id
  LEFT JOIN profiles p2 ON f.receiver_id = p2.user_id
  WHERE f.status = 'accepted'
    AND (f.requester_id = COALESCE(p_user_id, auth.uid()) OR f.receiver_id = COALESCE(p_user_id, auth.uid()))
  ORDER BY f.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending friend requests
CREATE OR REPLACE FUNCTION get_pending_friend_requests(p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  friendship_id uuid,
  requester_id uuid,
  requester_name text,
  requester_avatar text,
  requester_location text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as friendship_id,
    f.requester_id,
    p.first_name || ' ' || p.last_name as requester_name,
    p.avatar_url as requester_avatar,
    p.location as requester_location,
    f.created_at
  FROM friendships f
  LEFT JOIN profiles p ON f.requester_id = p.user_id
  WHERE f.receiver_id = COALESCE(p_user_id, auth.uid())
    AND f.status = 'pending'
  ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update notification types constraint to include friendship notifications
DO $$
BEGIN
  -- Drop the existing constraint
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS valid_notification_type;
  
  -- Add the new constraint with friendship notification types
  ALTER TABLE notifications ADD CONSTRAINT valid_notification_type 
    CHECK (type IN (
      'new_game_request', 
      'request_accepted', 
      'request_declined', 
      'booking_confirmed', 
      'match_result_needed',
      'friend_request',
      'friend_request_accepted'
    ));
END $$;