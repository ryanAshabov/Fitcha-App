export interface GameSession {
  id: string;
  status: 'pending_acceptance' | 'court_selection' | 'pending_payment' | 'confirmed' | 'completed' | 'cancelled';
  initiator_id: string;
  invitee_id: string;
  sport: string;
  proposed_datetime: string;
  selected_court_id?: string;
  total_cost?: number;
  payment_option?: 'initiator_pays_all' | 'split_50_50' | 'custom_split';
  initiator_payment_status: 'pending' | 'paid' | 'not_required';
  invitee_payment_status: 'pending' | 'paid' | 'not_required';
  created_at: string;
  updated_at: string;
  
  // Populated from joins
  other_user_name?: string;
  other_user_avatar?: string;
  court_name?: string;
  user_role?: 'initiator' | 'invitee';
}

export interface SessionChatMessage {
  id: number;
  session_id: string;
  sender_id: string;
  message: string;
  message_type: 'text' | 'court_suggestion' | 'payment_request' | 'system';
  metadata: Record<string, any>;
  created_at: string;
  
  // Populated from joins
  sender_name?: string;
  sender_avatar?: string;
}

export interface CourtSuggestion {
  court_id: string;
  court_name: string;
  court_address?: string;
  hourly_price: number;
  distance_km: number;
  availability_score: number;
}

export interface CreateGameSessionData {
  invitee_id: string;
  sport: string;
  proposed_datetime: string;
}

export interface UpdateGameSessionData {
  status?: GameSession['status'];
  selected_court_id?: string;
  total_cost?: number;
  payment_option?: GameSession['payment_option'];
  initiator_payment_status?: GameSession['initiator_payment_status'];
  invitee_payment_status?: GameSession['invitee_payment_status'];
}

export interface SendMessageData {
  session_id: string;
  message: string;
  message_type?: SessionChatMessage['message_type'];
  metadata?: Record<string, any>;
}