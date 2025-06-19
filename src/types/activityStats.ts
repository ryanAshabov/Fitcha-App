export interface ActivityStats {
  sessions_played: number;
  unique_partners: number;
  courts_visited: number;
  trust_score: number;
}

export interface PeerReview {
  review_id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar?: string;
  rating: number;
  comment?: string;
  sport_context: string;
  court_context: string;
  review_date: string;
  booking_date: string;
}

export interface MatchHistoryItem {
  booking_id: string;
  partner_id: string;
  partner_name: string;
  partner_avatar?: string;
  court_id: string;
  court_name: string;
  court_location?: string;
  booking_date: string;
  duration_hours: number;
  total_cost: number;
  sport_context: string;
  has_review: boolean;
  partner_rating?: number;
}

export interface ReviewableBooking {
  booking_id: string;
  partner_id: string;
  partner_name: string;
  partner_avatar?: string;
  court_name: string;
  booking_date: string;
  sport_type: string;
}

export interface CreateReviewData {
  booking_id: string;
  reviewee_id: string;
  rating: number;
  comment?: string;
}

export interface MatchHistoryFilters {
  sport?: string;
  year?: number;
}