export interface Court {
  id: string;
  name: string;
  description?: string;
  sport_type: string;
  court_type?: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  hourly_price: number;
  created_at: string;
}

export interface CourtSearchFilters {
  sport_type?: string;
  court_type?: string;
  location?: string;
  min_price?: number;
  max_price?: number;
  date?: string;
}

export interface Booking {
  id: string;
  court_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: 'confirmed' | 'cancelled';
  created_at: string;
  
  // Populated from joins
  court?: Court;
}

export interface CreateBookingData {
  court_id: string;
  start_time: string;
  end_time: string;
  total_price: number;
}

export interface TimeSlot {
  hour_slot: number;
  is_available: boolean;
}

export const SPORT_TYPES = [
  'Tennis',
  'Football',
  'Basketball',
  'Soccer',
  'Volleyball',
  'Badminton',
  'Squash',
  'Table Tennis'
] as const;

export const COURT_TYPES = [
  'Indoor-Hard',
  'Outdoor-Hard',
  'Indoor-Clay',
  'Outdoor-Clay',
  'Indoor-Grass',
  'Outdoor-Grass',
  'Indoor-Wood',
  'Outdoor-Wood',
  'Indoor-Sand',
  'Outdoor-Sand',
  'Indoor-Artificial',
  'Outdoor-Artificial'
] as const;