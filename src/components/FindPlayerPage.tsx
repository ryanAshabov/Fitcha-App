import React, { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';
import { PlayerSearchFilters, PlayerSearchResult } from '../types/player';
import { playerService } from '../services/playerService';
import { AppPage } from '../App';
import GlobalHeader from './layout/GlobalHeader';
import PlayerSearchFiltersComponent from './PlayerSearchFilters';
import PlayerCard from './PlayerCard';
import Button from './ui/Button';

interface FindPlayerPageProps {
  onNavigate: (page: AppPage) => void;
  onViewProfile: (userId: string) => void;
}

const FindPlayerPage: React.FC<FindPlayerPageProps> = ({ 
  onNavigate, 
  onViewProfile 
}) => {
  const [players, setPlayers] = useState<PlayerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Load initial results on component mount
  useEffect(() => {
    handleSearch({});
  }, []);

  const handleSearch = async (filters: PlayerSearchFilters) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    const { data, error: searchError } = await playerService.searchPlayers(filters);

    if (searchError) {
      setError(searchError.message);
      setPlayers([]);
    } else {
      setPlayers(data || []);
    }

    setLoading(false);
  };

  const renderResults = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-grow space-y-2">
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Search Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button variant="primary" onClick={() => handleSearch({})}>
            Try Again
          </Button>
        </div>
      );
    }

    if (hasSearched && players.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Players Found</h3>
          <p className="text-gray-600 mb-4">
            No players match your current search criteria. Try adjusting your filters or search for different terms.
          </p>
          <Button variant="secondary" onClick={() => handleSearch({})}>
            Show All Players
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            {players.length} player{players.length !== 1 ? 's' : ''} found
          </p>
        </div>
        
        {players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            onViewProfile={onViewProfile}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalHeader currentPage="find-players" onNavigate={onNavigate} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Players</h1>
          <p className="text-gray-600">
            Discover and connect with athletes in your area. Filter by sport, skill level, and location to find your perfect training partners or teammates.
          </p>
        </div>

        {/* Search Filters */}
        <PlayerSearchFiltersComponent onSearch={handleSearch} isLoading={loading} />

        {/* Results */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {renderResults()}
        </div>
      </main>
    </div>
  );
};

export default FindPlayerPage;