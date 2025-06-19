/*
  # Create Messaging System

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `participant1_id` (uuid, foreign key to profiles.user_id)
      - `participant2_id` (uuid, foreign key to profiles.user_id)
      - `created_at` (timestamp)
      - `last_message_at` (timestamp)
    - `messages`
      - `id` (bigint, primary key)
      - `conversation_id` (uuid, foreign key to conversations.id)
      - `sender_id` (uuid, foreign key to profiles.user_id)
      - `content` (text)
      - `created_at` (timestamp)
      - `is_read` (boolean)

  2. Security
    - Enable RLS on both tables
    - Add policies for participants to access their conversations and messages

  3. Functions & Triggers
    - Function to update last_message_at when new message is sent
    - Function to find or create conversation between two users
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id uuid NOT NULL,
  participant2_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT fk_participant1 FOREIGN KEY (participant1_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_participant2 FOREIGN KEY (participant2_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Business logic constraints
  CONSTRAINT no_self_conversation CHECK (participant1_id != participant2_id),
  CONSTRAINT ordered_participants CHECK (participant1_id < participant2_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_read boolean DEFAULT false,
  
  -- Foreign key constraints
  CONSTRAINT fk_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_sender FOREIGN KEY (sender_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can create conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE auth.uid() = participant1_id OR auth.uid() = participant2_id
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE auth.uid() = participant1_id OR auth.uid() = participant2_id
    )
  );

CREATE POLICY "Users can update read status of messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE auth.uid() = participant1_id OR auth.uid() = participant2_id
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE auth.uid() = participant1_id OR auth.uid() = participant2_id
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant1_id, participant2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- Function to update last_message_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_message_at when new message is inserted
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Function to find or create conversation between two users
CREATE OR REPLACE FUNCTION find_or_create_conversation(user1_id uuid, user2_id uuid)
RETURNS uuid AS $$
DECLARE
  conversation_id uuid;
  participant1 uuid;
  participant2 uuid;
BEGIN
  -- Ensure consistent ordering (smaller UUID first)
  IF user1_id < user2_id THEN
    participant1 := user1_id;
    participant2 := user2_id;
  ELSE
    participant1 := user2_id;
    participant2 := user1_id;
  END IF;
  
  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM conversations
  WHERE participant1_id = participant1 AND participant2_id = participant2;
  
  -- If not found, create new conversation
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (participant1_id, participant2_id)
    VALUES (participant1, participant2)
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user conversations with last message info
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  conversation_id uuid,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  last_message_content text,
  last_message_at timestamptz,
  unread_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as conversation_id,
    CASE 
      WHEN c.participant1_id = COALESCE(p_user_id, auth.uid()) THEN c.participant2_id
      ELSE c.participant1_id
    END as other_user_id,
    CASE 
      WHEN c.participant1_id = COALESCE(p_user_id, auth.uid()) THEN p2.first_name || ' ' || p2.last_name
      ELSE p1.first_name || ' ' || p1.last_name
    END as other_user_name,
    CASE 
      WHEN c.participant1_id = COALESCE(p_user_id, auth.uid()) THEN p2.avatar_url
      ELSE p1.avatar_url
    END as other_user_avatar,
    lm.content as last_message_content,
    c.last_message_at,
    COALESCE(unread.count, 0) as unread_count
  FROM conversations c
  LEFT JOIN profiles p1 ON c.participant1_id = p1.user_id
  LEFT JOIN profiles p2 ON c.participant2_id = p2.user_id
  LEFT JOIN LATERAL (
    SELECT content
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as count
    FROM messages m
    WHERE m.conversation_id = c.id
      AND m.sender_id != COALESCE(p_user_id, auth.uid())
      AND m.is_read = false
  ) unread ON true
  WHERE c.participant1_id = COALESCE(p_user_id, auth.uid()) 
     OR c.participant2_id = COALESCE(p_user_id, auth.uid())
  ORDER BY c.last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get messages for a conversation
CREATE OR REPLACE FUNCTION get_conversation_messages(p_conversation_id uuid)
RETURNS TABLE (
  message_id bigint,
  sender_id uuid,
  sender_name text,
  sender_avatar text,
  content text,
  created_at timestamptz,
  is_read boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as message_id,
    m.sender_id,
    p.first_name || ' ' || p.last_name as sender_name,
    p.avatar_url as sender_avatar,
    m.content,
    m.created_at,
    m.is_read
  FROM messages m
  LEFT JOIN profiles p ON m.sender_id = p.user_id
  WHERE m.conversation_id = p_conversation_id
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;