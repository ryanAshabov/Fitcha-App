import React, { useState } from 'react';
import { Search, Filter, Calendar, DollarSign } from 'lucide-react';
import { CourtSearchFilters as TCourtSearchFilters } from '../types/court';
import { SPORT_TYPES, COURT_TYPES } from '../types/court';
import Button from './ui/Button';
import Input from './ui/Input';

interface CourtSearchFiltersProps {
  onSearch: (filters: TCourtSearchFilters) => void;
  isLoading: boolean;
}

const CourtSearchFilters: React.FC<CourtSearchFiltersProps> = ({ 
  onSearch, 
  isLoading 
}) => {
  const [filters, setFilters] = useState<TCourtSearchFilters>({
    sport_type: '',
    court_type: '',
    location: '',
    min_price: undefined,
    max_price: undefined,
    date: ''
  });

  const handleFilterChange = (key: keyof TCourtSearchFilters, value: string | number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up filters - remove empty strings and undefined values
    const cleanFilters: TCourtSearchFilters = {};
    if (filters.sport_type && filters.sport_type.trim()) {
      cleanFilters.sport_type = filters.sport_type.trim();
    }
    if (filters.court_type && filters.court_type.trim()) {
      cleanFilters.court_type = filters.court_type.trim();
    }
    if (filters.location && filters.location.trim()) {
      cleanFilters.location = filters.location.trim();
    }
    if (filters.min_price !== undefined && filters.min_price > 0) {
      cleanFilters.min_price = filters.min_price;
    }
    if (filters.max_price !== undefined && filters.max_price > 0) {
      cleanFilters.max_price = filters.max_price;
    }
    if (filters.date && filters.date.trim()) {
      cleanFilters.date = filters.date.trim();
    }

    onSearch(cleanFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      sport_type: '',
      court_type: '',
      location: '',
      min_price: undefined,
      max_price: undefined,
      date: ''
    });
    onSearch({});
  };

  const hasActiveFilters = filters.sport_type || filters.court_type || filters.location || 
                          filters.min_price || filters.max_price || filters.date;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <Filter className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Find Courts</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Sport Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sport
            </label>
            <select
              value={filters.sport_type || ''}
              onChange={(e) => handleFilterChange('sport_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Sports</option>
              {SPORT_TYPES.map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </div>

          {/* Court Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Court Type
            </label>
            <select
              value={filters.court_type || ''}
              onChange={(e) => handleFilterChange('court_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {COURT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <Input
              label="Location"
              type="text"
              value={filters.location || ''}
              onChange={(value) => handleFilterChange('location', value)}
              placeholder="Enter city or area"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Price Range */}
          <div>
            <Input
              label="Min Price ($/hour)"
              type="number"
              value={filters.min_price?.toString() || ''}
              onChange={(value) => handleFilterChange('min_price', value ? parseFloat(value) : undefined)}
              placeholder="0"
            />
          </div>

          <div>
            <Input
              label="Max Price ($/hour)"
              type="number"
              value={filters.max_price?.toString() || ''}
              onChange={(value) => handleFilterChange('max_price', value ? parseFloat(value) : undefined)}
              placeholder="100"
            />
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={filters.date || ''}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-3">
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <Search size={16} />
              <span>{isLoading ? 'Searching...' : 'Search Courts'}</span>
            </Button>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleClearFilters}
                disabled={isLoading}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {hasActiveFilters && (
            <div className="text-sm text-gray-600">
              {Object.values(filters).filter(Boolean).length} filter{Object.values(filters).filter(Boolean).length !== 1 ? 's' : ''} applied
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default CourtSearchFilters;