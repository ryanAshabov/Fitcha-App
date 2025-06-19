export interface Profile {
  id: string;
  user_id: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  sports: SportSkill[];
}

export interface SportSkill {
  sport: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Professional';
}

export interface ProfileFormData {
  first_name: string;
  last_name: string;
  bio: string;
  location: string;
  sports: SportSkill[];
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
  'Snowboarding'
] as const;

export const SKILL_LEVELS: SportSkill['level'][] = [
  'Beginner',
  'Intermediate', 
  'Advanced',
  'Professional'
];