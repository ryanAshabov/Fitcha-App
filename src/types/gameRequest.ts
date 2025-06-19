export interface GameRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  message?: string;
  proposed_datetime?: string;
  created_at: string;
  
  // Populated from joins
  sender_profile?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
    location?: string;
  };
  receiver_profile?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
    location?: string;
  };
}

export interface CreateGameRequestData {
  receiver_id: string;
  message?: string;
  proposed_datetime?: string;
}

export interface UpdateGameRequestData {
  status: 'accepted' | 'declined' | 'cancelled';
}