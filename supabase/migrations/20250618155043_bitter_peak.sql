/*
  # Dynamic Dashboard & Unified Notification Center

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles.user_id)
      - `actor_id` (uuid, foreign key to profiles.user_id, nullable)
      - `type` (text, notification type)
      - `message` (text, human-readable message)
      - `read_at` (timestamptz, nullable)
      - `related_entity_id` (uuid, nullable)
      - `created_at` (timestamptz)

  2. RPC Functions
    - `get_pending_requests_count` - Get count of pending game requests
    - `get_next_booking` - Get user's next upcoming booking
    - `get_user_stats` - Get user activity statistics
    - `get_unread_notifications_count` - Get count of unread notifications

  3. Security
    - Enable RLS on notifications table
    - Add policies for users to manage their own notifications

  4. Triggers
    - Auto-generate notifications for game requests and bookings
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actor_id uuid,
  type text NOT NULL,
  message text NOT NULL,
  read_at timestamptz,
  related_entity_id uuid,
  created_at timestamptz DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_actor FOREIGN KEY (actor_id) REFERENCES profiles(user_id) ON DELETE SET NULL,
  
  -- Business logic constraints
  CONSTRAINT valid_notification_type CHECK (type IN ('new_game_request', 'request_accepted', 'request_declined', 'booking_confirmed'))
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Function to get pending requests count
CREATE OR REPLACE FUNCTION get_pending_requests_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_count integer;
BEGIN
  SELECT COUNT(*)::integer
  INTO request_count
  FROM game_requests
  WHERE receiver_id = auth.uid()
    AND status = 'pending';
    
  RETURN COALESCE(request_count, 0);
END;
$$;

-- Function to get next booking
CREATE OR REPLACE FUNCTION get_next_booking()
RETURNS TABLE (
  id uuid,
  court_name text,
  start_time timestamptz,
  end_time timestamptz,
  total_price numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    c.name as court_name,
    b.start_time,
    b.end_time,
    b.total_price
  FROM bookings b
  JOIN courts c ON b.court_id = c.id
  WHERE b.user_id = auth.uid()
    AND b.status = 'confirmed'
    AND b.start_time > now()
  ORDER BY b.start_time ASC
  LIMIT 1;
END;
$$;

-- Function to get user stats
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE (
  courts_booked integer,
  games_played integer,
  connections integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  booked_count integer;
  games_count integer;
  connections_count integer;
BEGIN
  -- Count total bookings
  SELECT COUNT(*)::integer
  INTO booked_count
  FROM bookings
  WHERE user_id = auth.uid();
  
  -- Count completed games (past bookings)
  SELECT COUNT(*)::integer
  INTO games_count
  FROM bookings
  WHERE user_id = auth.uid()
    AND status = 'confirmed'
    AND end_time < now();
  
  -- Count connections (accepted game requests)
  SELECT COUNT(DISTINCT 
    CASE 
      WHEN sender_id = auth.uid() THEN receiver_id
      WHEN receiver_id = auth.uid() THEN sender_id
    END
  )::integer
  INTO connections_count
  FROM game_requests
  WHERE (sender_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'accepted';
    
  RETURN QUERY SELECT 
    COALESCE(booked_count, 0),
    COALESCE(games_count, 0),
    COALESCE(connections_count, 0);
END;
$$;

-- Function to get unread notifications count
CREATE OR REPLACE FUNCTION get_unread_notifications_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unread_count integer;
BEGIN
  SELECT COUNT(*)::integer
  INTO unread_count
  FROM notifications
  WHERE user_id = auth.uid()
    AND read_at IS NULL;
    
  RETURN COALESCE(unread_count, 0);
END;
$$;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_as_read(notification_ids uuid[] DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF notification_ids IS NULL THEN
    -- Mark all notifications as read
    UPDATE notifications
    SET read_at = now()
    WHERE user_id = auth.uid()
      AND read_at IS NULL;
  ELSE
    -- Mark specific notifications as read
    UPDATE notifications
    SET read_at = now()
    WHERE user_id = auth.uid()
      AND id = ANY(notification_ids)
      AND read_at IS NULL;
  END IF;
END;
$$;

-- Trigger function for game request notifications
CREATE OR REPLACE FUNCTION handle_game_request_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sender_name text;
  receiver_name text;
  notification_message text;
BEGIN
  -- Get sender and receiver names
  SELECT CONCAT(first_name, ' ', last_name)
  INTO sender_name
  FROM profiles
  WHERE user_id = NEW.sender_id;
  
  SELECT CONCAT(first_name, ' ', last_name)
  INTO receiver_name
  FROM profiles
  WHERE user_id = NEW.receiver_id;

  IF TG_OP = 'INSERT' THEN
    -- New game request notification
    notification_message := sender_name || ' sent you a game request';
    
    INSERT INTO notifications (user_id, actor_id, type, message, related_entity_id)
    VALUES (NEW.receiver_id, NEW.sender_id, 'new_game_request', notification_message, NEW.id);
    
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status IN ('accepted', 'declined') THEN
    -- Request status change notification
    IF NEW.status = 'accepted' THEN
      notification_message := receiver_name || ' accepted your game request';
      INSERT INTO notifications (user_id, actor_id, type, message, related_entity_id)
      VALUES (NEW.sender_id, NEW.receiver_id, 'request_accepted', notification_message, NEW.id);
    ELSIF NEW.status = 'declined' THEN
      notification_message := receiver_name || ' declined your game request';
      INSERT INTO notifications (user_id, actor_id, type, message, related_entity_id)
      VALUES (NEW.sender_id, NEW.receiver_id, 'request_declined', notification_message, NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger function for booking notifications
CREATE OR REPLACE FUNCTION handle_booking_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  court_name text;
  notification_message text;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    -- Get court name
    SELECT name
    INTO court_name
    FROM courts
    WHERE id = NEW.court_id;
    
    notification_message := 'Your booking for ' || court_name || ' has been confirmed';
    
    INSERT INTO notifications (user_id, type, message, related_entity_id)
    VALUES (NEW.user_id, 'booking_confirmed', notification_message, NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_game_request_notification ON game_requests;
CREATE TRIGGER trigger_game_request_notification
  AFTER INSERT OR UPDATE ON game_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_game_request_notification();

DROP TRIGGER IF EXISTS trigger_booking_notification ON bookings;
CREATE TRIGGER trigger_booking_notification
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION handle_booking_notification();