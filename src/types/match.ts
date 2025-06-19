export interface Match {
  id: string;
  request_id: string;
  winner_id?: string;
  loser_id?: string;
  score?: string;
  status: 'pending_confirmation' | 'verified';
  created_at: string;
  verified_at?: string;
  
  // Populated from joins
  opponent_name?: string;
  opponent_avatar_url?: string;
  sport_type?: string;
  result?: 'Won' | 'Lost' | 'Draw';
}

export interface SkillEndorsement {
  id: string;
  endorser_id: string;
  recipient_id: string;
  skill_name: string;
  match_id: string;
  created_at: string;
  
  // Populated from joins
  endorser_name?: string;
}

export interface SkillEndorsementSummary {
  skill_name: string;
  endorsement_count: number;
  recent_endorsers: string[];
}

export interface CreateMatchData {
  request_id: string;
  winner_id?: string;
  loser_id?: string;
  score?: string;
}

export interface CreateEndorsementData {
  recipient_id: string;
  skill_name: string;
  match_id: string;
}

export const AVAILABLE_SKILLS = [
  'Sportsmanship',
  'Punctuality',
  'Powerful Serve',
  'Great Defense',
  'Team Player',
  'Great Attitude',
  'Technical Skills',
  'Leadership',
  'Fair Play',
  'Consistency'
] as const;