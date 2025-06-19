export interface PlayerSearchFilters {
  sport?: string;
  level?: string;
  location?: string;
}

export interface PlayerSearchResult {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  sports: Array<{
    sport: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Professional';
  }>;
  updated_at: string;
}