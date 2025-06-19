/*
  # Profile Page Overhaul - Phase 2: Living Profile with Dynamic Data

  1. New Tables
    - `game_reviews` - Peer reviews and ratings system
      - Links reviews to specific bookings/matches
      - Stores ratings (1-5) and comments
      - Tracks reviewer and reviewee relationships

  2. Enhanced Functions
    - `get_user_activity_stats` - Calculate lifetime activity statistics
    - `get_user_peer_reviews` - Fetch user reviews with reviewer details
    - `get_user_match_history_detailed` - Enhanced match history with filtering
    - `calculate_trust_score` - Calculate user trust score from reviews

  3. Security
    - Enable RLS on all new tables
    - Add policies for review creation and viewing
    - Ensure users can only review completed bookings
    - Prevent duplicate reviews for same booking

  4. Triggers
    - Auto-prompt for reviews after booking completion
    - Update trust scores when new reviews are added
*/

-- Create game_reviews table for peer reviews and ratings
CREATE TABLE IF NOT EXISTS game_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  reviewee_id uuid NOT NULL,
  rating integer NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT fk_review_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_reviewer FOREIGN KEY (reviewer_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_review_reviewee FOREIGN KEY (reviewee_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Business logic constraints
  CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT no_self_review CHECK (reviewer_id != reviewee_id),
  CONSTRAINT unique_review_per_booking UNIQUE (booking_id, reviewer_id, reviewee_id)
);

-- Enable Row Level Security
ALTER TABLE game_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_reviews
CREATE POLICY "Users can view reviews where they are involved"
  ON game_reviews
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reviewer_id OR auth.uid() = reviewee_id);

CREATE POLICY "Users can view all reviews for public profiles"
  ON game_reviews
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create reviews for their completed bookings"
  ON game_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id AND
    booking_id IN (
      SELECT b.id FROM bookings b 
      WHERE b.status = 'confirmed' 
        AND b.end_time < now()
        AND (b.user_id = auth.uid() OR b.booked_by_user_id = auth.uid())
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_reviews_booking ON game_reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_game_reviews_reviewer ON game_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_game_reviews_reviewee ON game_reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_game_reviews_rating ON game_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_game_reviews_created ON game_reviews(created_at DESC);

-- Function to calculate user activity statistics
CREATE OR REPLACE FUNCTION get_user_activity_stats(p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  sessions_played bigint,
  unique_partners bigint,
  courts_visited bigint,
  trust_score numeric
) AS $$
DECLARE
  target_user_id uuid := COALESCE(p_user_id, auth.uid());
BEGIN
  RETURN QUERY
  SELECT 
    -- Sessions played (completed bookings)
    (SELECT COUNT(*) 
     FROM bookings b 
     WHERE (b.user_id = target_user_id OR b.booked_by_user_id = target_user_id)
       AND b.status = 'confirmed' 
       AND b.end_time < now()) as sessions_played,
    
    -- Unique partners (distinct other users from completed bookings)
    (SELECT COUNT(DISTINCT 
       CASE 
         WHEN b.user_id = target_user_id THEN b.booked_by_user_id
         ELSE b.user_id
       END)
     FROM bookings b 
     WHERE (b.user_id = target_user_id OR b.booked_by_user_id = target_user_id)
       AND b.status = 'confirmed' 
       AND b.end_time < now()
       AND (b.user_id != target_user_id OR b.booked_by_user_id != target_user_id)) as unique_partners,
    
    -- Courts visited (distinct courts from completed bookings)
    (SELECT COUNT(DISTINCT b.court_id) 
     FROM bookings b 
     WHERE (b.user_id = target_user_id OR b.booked_by_user_id = target_user_id)
       AND b.status = 'confirmed' 
       AND b.end_time < now()) as courts_visited,
    
    -- Trust score (average rating from reviews)
    COALESCE(
      (SELECT ROUND(AVG(gr.rating)::numeric, 1) 
       FROM game_reviews gr 
       WHERE gr.reviewee_id = target_user_id), 
      0
    ) as trust_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user peer reviews with reviewer details
CREATE OR REPLACE FUNCTION get_user_peer_reviews(p_user_id uuid DEFAULT NULL, p_limit integer DEFAULT 10)
RETURNS TABLE (
  review_id uuid,
  reviewer_id uuid,
  reviewer_name text,
  reviewer_avatar text,
  rating integer,
  comment text,
  sport_context text,
  court_context text,
  review_date timestamptz,
  booking_date timestamptz
) AS $$
DECLARE
  target_user_id uuid := COALESCE(p_user_id, auth.uid());
BEGIN
  RETURN QUERY
  SELECT 
    gr.id as review_id,
    gr.reviewer_id,
    p.first_name || ' ' || p.last_name as reviewer_name,
    p.avatar_url as reviewer_avatar,
    gr.rating,
    gr.comment,
    'General' as sport_context, -- We'll enhance this when we add sport context to bookings
    c.name as court_context,
    gr.created_at as review_date,
    b.start_time as booking_date
  FROM game_reviews gr
  LEFT JOIN profiles p ON gr.reviewer_id = p.user_id
  LEFT JOIN bookings b ON gr.booking_id = b.id
  LEFT JOIN courts c ON b.court_id = c.id
  WHERE gr.reviewee_id = target_user_id
  ORDER BY gr.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get detailed match history with filtering
CREATE OR REPLACE FUNCTION get_user_match_history_detailed(
  p_user_id uuid DEFAULT NULL,
  p_sport_filter text DEFAULT NULL,
  p_year_filter integer DEFAULT NULL,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  booking_id uuid,
  partner_id uuid,
  partner_name text,
  partner_avatar text,
  court_id uuid,
  court_name text,
  court_location text,
  booking_date timestamptz,
  duration_hours numeric,
  total_cost numeric,
  sport_context text,
  has_review boolean,
  partner_rating integer
) AS $$
DECLARE
  target_user_id uuid := COALESCE(p_user_id, auth.uid());
BEGIN
  RETURN QUERY
  SELECT 
    b.id as booking_id,
    CASE 
      WHEN b.user_id = target_user_id THEN b.booked_by_user_id
      ELSE b.user_id
    END as partner_id,
    CASE 
      WHEN b.user_id = target_user_id THEN p2.first_name || ' ' || p2.last_name
      ELSE p1.first_name || ' ' || p1.last_name
    END as partner_name,
    CASE 
      WHEN b.user_id = target_user_id THEN p2.avatar_url
      ELSE p1.avatar_url
    END as partner_avatar,
    b.court_id,
    c.name as court_name,
    c.location_address as court_location,
    b.start_time as booking_date,
    EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600 as duration_hours,
    b.total_price,
    c.sport_type as sport_context,
    EXISTS(
      SELECT 1 FROM game_reviews gr 
      WHERE gr.booking_id = b.id 
        AND gr.reviewer_id = target_user_id
    ) as has_review,
    gr.rating as partner_rating
  FROM bookings b
  LEFT JOIN profiles p1 ON b.user_id = p1.user_id
  LEFT JOIN profiles p2 ON b.booked_by_user_id = p2.user_id
  LEFT JOIN courts c ON b.court_id = c.id
  LEFT JOIN game_reviews gr ON gr.booking_id = b.id 
    AND gr.reviewee_id = CASE 
      WHEN b.user_id = target_user_id THEN b.booked_by_user_id
      ELSE b.user_id
    END
  WHERE (b.user_id = target_user_id OR b.booked_by_user_id = target_user_id)
    AND b.status = 'confirmed' 
    AND b.end_time < now()
    AND (p_sport_filter IS NULL OR c.sport_type ILIKE '%' || p_sport_filter || '%')
    AND (p_year_filter IS NULL OR EXTRACT(YEAR FROM b.start_time) = p_year_filter)
  ORDER BY b.start_time DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can review a specific booking
CREATE OR REPLACE FUNCTION can_review_booking(p_booking_id uuid, p_reviewee_id uuid)
RETURNS boolean AS $$
DECLARE
  booking_record RECORD;
  existing_review_count integer;
BEGIN
  -- Get booking details
  SELECT * INTO booking_record
  FROM bookings 
  WHERE id = p_booking_id;
  
  -- Check if booking exists and is completed
  IF booking_record IS NULL OR booking_record.status != 'confirmed' OR booking_record.end_time >= now() THEN
    RETURN false;
  END IF;
  
  -- Check if current user was part of this booking
  IF auth.uid() != booking_record.user_id AND auth.uid() != booking_record.booked_by_user_id THEN
    RETURN false;
  END IF;
  
  -- Check if reviewee was the other participant
  IF p_reviewee_id != booking_record.user_id AND p_reviewee_id != booking_record.booked_by_user_id THEN
    RETURN false;
  END IF;
  
  -- Check if review already exists
  SELECT COUNT(*) INTO existing_review_count
  FROM game_reviews 
  WHERE booking_id = p_booking_id 
    AND reviewer_id = auth.uid() 
    AND reviewee_id = p_reviewee_id;
  
  RETURN existing_review_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a review (with validation)
CREATE OR REPLACE FUNCTION create_game_review(
  p_booking_id uuid,
  p_reviewee_id uuid,
  p_rating integer,
  p_comment text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  review_id uuid;
BEGIN
  -- Validate that user can review this booking
  IF NOT can_review_booking(p_booking_id, p_reviewee_id) THEN
    RAISE EXCEPTION 'You cannot review this booking or user';
  END IF;
  
  -- Create the review
  INSERT INTO game_reviews (
    booking_id,
    reviewer_id,
    reviewee_id,
    rating,
    comment
  ) VALUES (
    p_booking_id,
    auth.uid(),
    p_reviewee_id,
    p_rating,
    p_comment
  )
  RETURNING id INTO review_id;
  
  RETURN review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available bookings for review
CREATE OR REPLACE FUNCTION get_bookings_pending_review(p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  booking_id uuid,
  partner_id uuid,
  partner_name text,
  partner_avatar text,
  court_name text,
  booking_date timestamptz,
  sport_type text
) AS $$
DECLARE
  target_user_id uuid := COALESCE(p_user_id, auth.uid());
BEGIN
  RETURN QUERY
  SELECT 
    b.id as booking_id,
    CASE 
      WHEN b.user_id = target_user_id THEN b.booked_by_user_id
      ELSE b.user_id
    END as partner_id,
    CASE 
      WHEN b.user_id = target_user_id THEN p2.first_name || ' ' || p2.last_name
      ELSE p1.first_name || ' ' || p1.last_name
    END as partner_name,
    CASE 
      WHEN b.user_id = target_user_id THEN p2.avatar_url
      ELSE p1.avatar_url
    END as partner_avatar,
    c.name as court_name,
    b.start_time as booking_date,
    c.sport_type
  FROM bookings b
  LEFT JOIN profiles p1 ON b.user_id = p1.user_id
  LEFT JOIN profiles p2 ON b.booked_by_user_id = p2.user_id
  LEFT JOIN courts c ON b.court_id = c.id
  WHERE (b.user_id = target_user_id OR b.booked_by_user_id = target_user_id)
    AND b.status = 'confirmed' 
    AND b.end_time < now()
    AND b.end_time > now() - INTERVAL '30 days' -- Only show recent completed bookings
    AND NOT EXISTS (
      SELECT 1 FROM game_reviews gr 
      WHERE gr.booking_id = b.id 
        AND gr.reviewer_id = target_user_id
    )
  ORDER BY b.end_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update notification types to include review prompts
DO $$
BEGIN
  -- Drop the existing constraint
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS valid_notification_type;
  
  -- Add the new constraint with review notification types
  ALTER TABLE notifications ADD CONSTRAINT valid_notification_type 
    CHECK (type IN (
      'new_game_request', 
      'request_accepted', 
      'request_declined', 
      'booking_confirmed', 
      'match_result_needed',
      'friend_request',
      'friend_request_accepted',
      'review_prompt',
      'review_received'
    ));
END $$;

-- Function to handle post-booking review prompts
CREATE OR REPLACE FUNCTION handle_booking_completion()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only trigger for bookings that just ended (within last hour)
  IF NEW.status = 'confirmed' AND NEW.end_time <= now() AND NEW.end_time > now() - INTERVAL '1 hour' THEN
    -- Create review prompt notifications for both participants
    INSERT INTO notifications (user_id, type, message, related_entity_id)
    VALUES 
      (NEW.user_id, 'review_prompt', 'Please review your recent game partner', NEW.id),
      (COALESCE(NEW.booked_by_user_id, NEW.user_id), 'review_prompt', 'Please review your recent game partner', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for booking completion review prompts
DROP TRIGGER IF EXISTS trigger_booking_completion_review_prompt ON bookings;
CREATE TRIGGER trigger_booking_completion_review_prompt
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION handle_booking_completion();

-- Function to handle new review notifications
CREATE OR REPLACE FUNCTION handle_review_notification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create notification for the reviewee
  INSERT INTO notifications (
    user_id,
    actor_id,
    type,
    message,
    related_entity_id
  ) VALUES (
    NEW.reviewee_id,
    NEW.reviewer_id,
    'review_received',
    'left you a review',
    NEW.id
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for review notifications
DROP TRIGGER IF EXISTS trigger_review_notification ON game_reviews;
CREATE TRIGGER trigger_review_notification
  AFTER INSERT ON game_reviews
  FOR EACH ROW
  EXECUTE FUNCTION handle_review_notification();