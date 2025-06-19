export interface UserSport {
  id: string;
  sport_name: string;
  skill_level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Professional';
  preferred_role?: string;
  dominant_hand?: 'Right' | 'Left' | 'Ambidextrous';
  years_experience: number;
}

export interface Achievement {
  id: string;
  type: 'Certification' | 'Award' | 'Competition' | 'Course' | 'License';
  title: string;
  organization?: string;
  description?: string;
  date_issued?: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
  is_verified: boolean;
}

export interface AthleticProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  user_type: 'player' | 'coach' | 'venue_owner';
  birth_date?: string;
  age?: number;
  bio?: string;
  avatar_url?: string;
  location?: string;
  sports: UserSport[];
  achievements: Achievement[];
  total_sports: number;
  total_achievements: number;
  profile_completeness: number;
}

export interface CreateUserSportData {
  sport_name: string;
  skill_level: UserSport['skill_level'];
  preferred_role?: string;
  dominant_hand?: UserSport['dominant_hand'];
  years_experience?: number;
}

export interface CreateAchievementData {
  type: Achievement['type'];
  title: string;
  organization?: string;
  description?: string;
  date_issued?: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
}

export const AVAILABLE_SPORTS = [
  'Tennis',
  'Basketball',
  'Football',
  'Soccer',
  'Baseball',
  'Volleyball',
  'Swimming',
  'Running',
  'Cycling',
  'Golf',
  'Boxing',
  'Wrestling',
  'Martial Arts',
  'Badminton',
  'Table Tennis',
  'Cricket',
  'Rugby',
  'Hockey',
  'Skiing',
  'Snowboarding',
  'Rock Climbing',
  'Surfing',
  'Yoga',
  'Pilates',
  'CrossFit',
  'Weightlifting',
  'Track and Field',
  'Gymnastics',
  'Dance',
  'Fencing'
] as const;

export const SKILL_LEVELS: UserSport['skill_level'][] = [
  'Beginner',
  'Intermediate', 
  'Advanced',
  'Professional'
];

export const ACHIEVEMENT_TYPES: Achievement['type'][] = [
  'Certification',
  'Award',
  'Competition',
  'Course',
  'License'
];

export const DOMINANT_HANDS: UserSport['dominant_hand'][] = [
  'Right',
  'Left',
  'Ambidextrous'
];