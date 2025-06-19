export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  
  // Populated from joins
  author_first_name: string;
  author_last_name: string;
  author_avatar_url?: string;
  author_location?: string;
  user_has_liked?: boolean;
}

export interface CreatePostData {
  content: string;
  image_url?: string;
}

export interface SuggestedPlayer {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  location?: string;
  sports: Array<{
    sport: string;
    level: string;
  }>;
}

export interface FeaturedCourt {
  id: string;
  name: string;
  sport_type: string;
  location_address?: string;
  hourly_price: number;
  images: string[];
}

export interface PostLike {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface LikeToggleResult {
  liked: boolean;
  like_count: number;
}