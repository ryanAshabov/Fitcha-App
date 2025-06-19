export interface Friendship {
  friendship_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  requester_id: string;
  receiver_id: string;
  created_at: string;
}

export interface Friend {
  friend_id: string;
  friend_name: string;
  friend_avatar?: string;
  friend_location?: string;
  friendship_date: string;
}

export interface PendingFriendRequest {
  friendship_id: string;
  requester_id: string;
  requester_name: string;
  requester_avatar?: string;
  requester_location?: string;
  created_at: string;
}

export interface CreateFriendRequestData {
  receiver_id: string;
}

export interface UpdateFriendshipData {
  status: 'accepted' | 'declined' | 'blocked';
}

export type FriendshipButtonState = 
  | 'add_friend'
  | 'request_sent' 
  | 'request_received'
  | 'friends'
  | 'blocked'
  | 'loading';