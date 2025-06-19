/*
  # Create Courts and Bookings System

  1. New Tables
    - `courts`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text)
      - `sport_type` (text, e.g., 'Tennis', 'Football')
      - `court_type` (text, e.g., 'Indoor-Hard', 'Outdoor-Clay')
      - `location_address` (text)
      - `latitude` (float8)
      - `longitude` (float8)
      - `images` (jsonb, array of image URLs)
      - `hourly_price` (numeric, not null)
      - `created_at` (timestamptz)
    
    - `bookings`
      - `id` (uuid, primary key)
      - `court_id` (uuid, foreign key to courts.id)
      - `user_id` (uuid, foreign key to profiles.user_id)
      - `start_time` (timestamptz, not null)
      - `end_time` (timestamptz, not null)
      - `total_price` (numeric, not null)
      - `status` (text, default 'confirmed')
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Courts: SELECT for authenticated users
    - Bookings: Users can only see/create their own bookings

  3. Functions
    - search_courts function for filtering courts
*/

-- Create courts table
CREATE TABLE IF NOT EXISTS courts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  sport_type text NOT NULL,
  court_type text,
  location_address text,
  latitude float8,
  longitude float8,
  images jsonb DEFAULT '[]'::jsonb,
  hourly_price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id uuid NOT NULL,
  user_id uuid NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  total_price numeric NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamptz DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT fk_booking_court FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE CASCADE,
  CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Business logic constraints
  CONSTRAINT valid_booking_status CHECK (status IN ('confirmed', 'cancelled')),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Enable Row Level Security
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courts
CREATE POLICY "Courts are viewable by authenticated users"
  ON courts
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_courts_sport_type ON courts(sport_type);
CREATE INDEX IF NOT EXISTS idx_courts_location ON courts(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_courts_price ON courts(hourly_price);
CREATE INDEX IF NOT EXISTS idx_bookings_court ON bookings(court_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_time ON bookings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Function to search courts with filters
CREATE OR REPLACE FUNCTION search_courts(
  p_sport_type text DEFAULT NULL,
  p_court_type text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_date date DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  sport_type text,
  court_type text,
  location_address text,
  latitude float8,
  longitude float8,
  images jsonb,
  hourly_price numeric,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.sport_type,
    c.court_type,
    c.location_address,
    c.latitude,
    c.longitude,
    c.images,
    c.hourly_price,
    c.created_at
  FROM courts c
  WHERE 
    (p_sport_type IS NULL OR c.sport_type = p_sport_type)
    AND (p_court_type IS NULL OR c.court_type = p_court_type)
    AND (p_location IS NULL OR c.location_address ILIKE '%' || p_location || '%')
    AND (p_min_price IS NULL OR c.hourly_price >= p_min_price)
    AND (p_max_price IS NULL OR c.hourly_price <= p_max_price)
  ORDER BY c.created_at DESC;
END;
$$;

-- Function to get court availability for a specific date
CREATE OR REPLACE FUNCTION get_court_availability(
  p_court_id uuid,
  p_date date
)
RETURNS TABLE (
  hour_slot integer,
  is_available boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH hours AS (
    SELECT generate_series(8, 21) AS hour_slot
  ),
  booked_hours AS (
    SELECT DISTINCT EXTRACT(HOUR FROM start_time)::integer AS booked_hour
    FROM bookings
    WHERE court_id = p_court_id
      AND DATE(start_time) = p_date
      AND status = 'confirmed'
  )
  SELECT 
    h.hour_slot,
    (bh.booked_hour IS NULL) AS is_available
  FROM hours h
  LEFT JOIN booked_hours bh ON h.hour_slot = bh.booked_hour
  ORDER BY h.hour_slot;
END;
$$;

-- Insert sample courts data
INSERT INTO courts (name, description, sport_type, court_type, location_address, latitude, longitude, images, hourly_price) VALUES
('Central Tennis Club - Court 1', 'Professional hard court with excellent lighting and modern facilities. Perfect for competitive matches and training sessions.', 'Tennis', 'Indoor-Hard', '123 Sports Avenue, Downtown', 40.7128, -74.0060, '["https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg"]', 45.00),
('Riverside Football Pitch', 'Full-size outdoor football pitch with natural grass. Great for team training and matches with scenic river views.', 'Football', 'Outdoor-Grass', '456 Riverside Drive, Westside', 40.7589, -73.9851, '["https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg"]', 80.00),
('Elite Basketball Court', 'Indoor basketball court with professional flooring and adjustable hoops. Air-conditioned facility with spectator seating.', 'Basketball', 'Indoor-Wood', '789 Athletic Center, Midtown', 40.7505, -73.9934, '["https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg"]', 35.00),
('Sunset Tennis Courts - Court A', 'Outdoor clay court surrounded by beautiful landscaping. Popular for recreational play and lessons.', 'Tennis', 'Outdoor-Clay', '321 Sunset Boulevard, Eastside', 40.7282, -73.7949, '["https://images.pexels.com/photos/1619299/pexels-photo-1619299.jpeg"]', 30.00),
('Metro Volleyball Arena', 'Indoor volleyball court with professional net system and sand flooring. Perfect for beach volleyball enthusiasts.', 'Volleyball', 'Indoor-Sand', '654 Metro Plaza, Central', 40.7614, -73.9776, '["https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg"]', 40.00),
('Parkside Soccer Field', 'Well-maintained outdoor soccer field with artificial turf. Includes changing rooms and equipment storage.', 'Soccer', 'Outdoor-Artificial', '987 Park Street, Northside', 40.7831, -73.9712, '["https://images.pexels.com/photos/1171084/pexels-photo-1171084.jpeg"]', 60.00);