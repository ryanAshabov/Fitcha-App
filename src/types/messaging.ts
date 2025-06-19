export interface Conversation {
  conversation_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar?: string;
  last_message_content?: string;
  last_message_at: string;
  unread_count: number;
}

export interface Message {
  message_id: number;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface CreateMessageData {
  conversation_id: string;
  content: string;
}

export interface SendMessageToUserData {
  recipient_id: string;
  content: string;
}