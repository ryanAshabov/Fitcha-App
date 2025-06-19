import React, { useState } from 'react';
import { Calendar, Users, MapPin, Star, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useMatchHistory } from '../../hooks/useActivityStats';
import { MatchHistoryFilters } from '../../types/activityStats';
import Button from '../ui/Button';

interface MatchHistorySectionProps {
  userId?: string;
  isOwnProfile: boolean;
}

const MatchHistorySection: React.FC<MatchHistorySectionProps> = ({ 
  userId, 
  isOwnProfile 
}) => {
  const [showAll, setShowAll] = useState(false);
  const [filters, setFilters] = useState<MatchHistoryFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  
  const { matches, loading, error } = useMatchHistory(
    userId, 
    filters, 
    showAll ? 50 : 10
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}min`;
    }
    return `${hours.toFixed(1)}h`;
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={12}
            className={`${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getUniqueYears = () => {
    const years = matches.map(match => new Date(match.booking_date).getFullYear());
    return [...new Set(years)].sort((a, b) => b - a);
  };

  const getUniqueSports = () => {
    const sports = matches.map(match => match.sport_context);
    return [...new Set(sports)].sort();
  };

  const handleFilterChange = (key: keyof MatchHistoryFilters, value: string | number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = filters.sport || filters.year;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-grow space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Match History</h2>
        <p className="text-red-600 text-sm">Error loading match history: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">Match History</h2>
        </div>
        
        {matches.length > 0 && (
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter size={16} />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Filters */}
      {showFilters && matches.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sport
              </label>
              <select
                value={filters.sport || ''}
                onChange={(e) => handleFilterChange('sport', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sports</option>
                {getUniqueSports().map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <select
                value={filters.year || ''}
                onChange={(e) => handleFilterChange('year', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Years</option>
                {getUniqueYears().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              {hasActiveFilters && (
                <Button
                  variant="secondary"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {matches.length > 0 ? (
        <>
          <div className="space-y-4">
            {matches.slice(0, showAll ? matches.length : 10).map((match) => (
              <div
                key={match.booking_id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Partner Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {match.partner_avatar ? (
                        <img
                          src={match.partner_avatar}
                          alt={match.partner_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-100">
                          <span className="text-sm font-bold text-blue-600">
                            {match.partner_name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Match Details */}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        vs {match.partner_name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center space-x-1">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {match.sport_context}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{match.court_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(match.booking_date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Match Info */}
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">
                      {formatDuration(match.duration_hours)} • ${match.total_cost}
                    </div>
                    {match.partner_rating && (
                      <div className="flex items-center justify-end space-x-1">
                        {renderStars(match.partner_rating)}
                        <span className="text-xs text-gray-600 ml-1">
                          {match.partner_rating}/5
                        </span>
                      </div>
                    )}
                    {!match.has_review && isOwnProfile && (
                      <div className="text-xs text-blue-600 mt-1">
                        Review pending
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Show More/Less Button */}
          {matches.length > 10 && (
            <div className="mt-6 text-center">
              <Button
                variant="secondary"
                onClick={() => setShowAll(!showAll)}
                className="flex items-center space-x-2"
              >
                {showAll ? (
                  <>
                    <ChevronUp size={16} />
                    <span>Show Less</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    <span>Show All {matches.length} Matches</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Match History</h3>
          <p className="text-gray-600 mb-6">
            {isOwnProfile 
              ? "Your completed game sessions will appear here. Book a court and play with other athletes to build your match history."
              : "This user hasn't completed any game sessions yet."
            }
          </p>
          {isOwnProfile && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-purple-600 mt-0.5" />
                <div className="text-sm text-purple-800">
                  <p className="font-medium mb-1">Start Playing!</p>
                  <p>Book courts, connect with players, and build your athletic history on Fitcha.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MatchHistorySection;