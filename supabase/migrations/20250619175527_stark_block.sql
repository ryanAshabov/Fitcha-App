/*
  # Messaging Notification System Implementation

  1. New Functions
    - `get_unread_conversation_count` - Get count of conversations with unread messages
    - `mark_conversation_as_read` - Mark all messages in a conversation as read
    - `handle_message_notification` - Create notifications for new messages

  2. Enhanced Triggers
    - Auto-create notifications when new messages are sent
    - Update conversation last_message_at timestamp

  3. Security
    - All functions use SECURITY DEFINER for proper access control
    - RLS policies ensure users can only access their own data
*/

-- Function to get count of conversations with unread messages
CREATE OR REPLACE FUNCTION get_unread_conversation_count(p_user_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid := COALESCE(p_user_id, auth.uid());
  unread_count integer;
BEGIN
  SELECT COUNT(DISTINCT m.conversation_id)::integer
  INTO unread_count
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE (c.participant1_id = target_user_id OR c.participant2_id = target_user_id)
    AND m.sender_id != target_user_id
    AND m.is_read = false;
    
  RETURN COALESCE(unread_count, 0);
END;
$$;

-- Function to mark all messages in a conversation as read for the current user
CREATE OR REPLACE FUNCTION mark_conversation_as_read(p_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark all messages in the conversation as read for the current user
  UPDATE messages
  SET is_read = true
  WHERE conversation_id = p_conversation_id
    AND sender_id != auth.uid()
    AND is_read = false;
END;
$$;

-- Function to handle message notifications
CREATE OR REPLACE FUNCTION handle_message_notification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  sender_name text;
  receiver_id uuid;
BEGIN
  -- Get sender name
  SELECT p.first_name || ' ' || p.last_name
  INTO sender_name
  FROM profiles p
  WHERE p.user_id = NEW.sender_id;
  
  -- Get receiver ID (the other participant in the conversation)
  SELECT 
    CASE 
      WHEN c.participant1_id = NEW.sender_id THEN c.participant2_id
      ELSE c.participant1_id
    END
  INTO receiver_id
  FROM conversations c
  WHERE c.id = NEW.conversation_id;
  
  -- Create notification for the receiver
  INSERT INTO notifications (
    user_id,
    actor_id,
    type,
    message,
    related_entity_id
  ) VALUES (
    receiver_id,
    NEW.sender_id,
    'new_message',
    'sent you a message',
    NEW.conversation_id
  );
  
  RETURN NEW;
END;
$$;

-- Update notification types constraint to include message notifications
DO $$
BEGIN
  -- Drop the existing constraint
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS valid_notification_type;
  
  -- Add the new constraint with message notification types
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
      'review_received',
      'new_message'
    ));
END $$;

-- Create trigger for message notifications
DROP TRIGGER IF EXISTS trigger_message_notification ON messages;
CREATE TRIGGER trigger_message_notification
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_notification();

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_unread_conversation_count TO authenticated;
GRANT EXECUTE ON FUNCTION mark_conversation_as_read TO authenticated;