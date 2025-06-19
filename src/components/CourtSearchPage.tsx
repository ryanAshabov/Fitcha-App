import React, { useState, useEffect } from 'react';
import { MapPin, Star, Calendar } from 'lucide-react';
import { Court, CourtSearchFilters as TCourtSearchFilters } from '../types/court';
import { courtService } from '../services/courtService';
import { AppPage } from '../App';
import GlobalHeader from './layout/GlobalHeader';
import CourtSearchFilters from './CourtSearchFilters';
import CourtCard from './CourtCard';
import Button from './ui/Button';

interface CourtSearchPageProps {
  onNavigate: (page: AppPage) => void;
  onViewCourt: (courtId: string) => void;
}

const CourtSearchPage: React.FC<CourtSearchPageProps> = ({ 
  onNavigate, 
  onViewCourt 
}) => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Load initial results on component mount
  useEffect(() => {
    handleSearch({});
  }, []);

  const handleSearch = async (filters: TCourtSearchFilters) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    const { data, error: searchError } = await courtService.searchCourts(filters);

    if (searchError) {
      setError(searchError.message);
      setCourts([]);
    } else {
      setCourts(data || []);
    }

    setLoading(false);
  };

  const renderResults = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex space-x-4">
                <div className="w-32 h-24 bg-gray-200 rounded-lg animate-pulse flex-shrink-0"></div>
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
            <Calendar className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Search Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button variant="primary" onClick={() => handleSearch({})}>
            Try Again
          </Button>
        </div>
      );
    }

    if (hasSearched && courts.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Courts Found</h3>
          <p className="text-gray-600 mb-4">
            No courts match your current search criteria. Try adjusting your filters or search for different terms.
          </p>
          <Button variant="secondary" onClick={() => handleSearch({})}>
            Show All Courts
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            {courts.length} court{courts.length !== 1 ? 's' : ''} found
          </p>
        </div>
        
        {courts.map((court) => (
          <CourtCard
            key={court.id}
            court={court}
            onViewCourt={onViewCourt}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalHeader currentPage="book-court" onNavigate={onNavigate} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book a Court</h1>
          <p className="text-gray-600">
            Discover and book sports facilities in your area. Find the perfect court for your next game or training session.
          </p>
        </div>

        {/* Search Filters */}
        <CourtSearchFilters onSearch={handleSearch} isLoading={loading} />

        {/* Results */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {renderResults()}
        </div>
      </main>
    </div>
  );
};

export default CourtSearchPage;