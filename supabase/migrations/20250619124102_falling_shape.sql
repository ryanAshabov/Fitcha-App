/*
  # Create Game Requests System

  1. New Tables
    - `game_requests`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, foreign key to profiles.user_id)
      - `receiver_id` (uuid, foreign key to profiles.user_id)
      - `status` (text, default 'pending')
      - `message` (text, optional)
      - `proposed_datetime` (timestamptz, optional)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `game_requests` table
    - Add policies for users to view requests they're involved in
    - Add policies for creating and updating requests
    - Add constraints for valid status values and business logic

  3. Performance
    - Add indexes on sender_id, receiver_id, status, and created_at
*/

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view requests they are involved in" ON game_requests;
DROP POLICY IF EXISTS "Users can create requests as sender" ON game_requests;
DROP POLICY IF EXISTS "Receivers can update request status" ON game_requests;
DROP POLICY IF EXISTS "Senders can cancel pending requests" ON game_requests;
DROP POLICY IF EXISTS "Receivers can update request status to accepted or declined" ON game_requests;
DROP POLICY IF EXISTS "Senders can cancel their pending requests" ON game_requests;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS game_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  message text,
  proposed_datetime timestamptz,
  created_at timestamptz DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT fk_sender FOREIGN KEY (sender_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_receiver FOREIGN KEY (receiver_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Business logic constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  CONSTRAINT no_self_request CHECK (sender_id != receiver_id)
);

-- Enable Row Level Security
ALTER TABLE game_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view requests they are involved in"
  ON game_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create requests as sender"
  ON game_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can update request status to accepted or declined"
  ON game_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (
    auth.uid() = receiver_id 
    AND status IN ('accepted', 'declined')
  );

CREATE POLICY "Senders can cancel their pending requests"
  ON game_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (
    auth.uid() = sender_id 
    AND status = 'cancelled'
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_requests_sender ON game_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_game_requests_receiver ON game_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_game_requests_status ON game_requests(status);
CREATE INDEX IF NOT EXISTS idx_game_requests_created_at ON game_requests(created_at DESC);