import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { PlayerSearchFilters as TPlayerSearchFilters } from '../types/player';
import { AVAILABLE_SPORTS, SKILL_LEVELS } from '../types/profile';
import Button from './ui/Button';
import Input from './ui/Input';

interface PlayerSearchFiltersProps {
  onSearch: (filters: TPlayerSearchFilters) => void;
  isLoading: boolean;
}

const PlayerSearchFilters: React.FC<PlayerSearchFiltersProps> = ({ 
  onSearch, 
  isLoading 
}) => {
  const [filters, setFilters] = useState<TPlayerSearchFilters>({
    sport: '',
    level: '',
    location: ''
  });

  const handleFilterChange = (key: keyof TPlayerSearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up filters - remove empty strings
    const cleanFilters: TPlayerSearchFilters = {};
    if (filters.sport && filters.sport.trim()) {
      cleanFilters.sport = filters.sport.trim();
    }
    if (filters.level && filters.level.trim()) {
      cleanFilters.level = filters.level.trim();
    }
    if (filters.location && filters.location.trim()) {
      cleanFilters.location = filters.location.trim();
    }

    onSearch(cleanFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      sport: '',
      level: '',
      location: ''
    });
    onSearch({});
  };

  const hasActiveFilters = filters.sport || filters.level || filters.location;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <Filter className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Find Players</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Sport Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sport
            </label>
            <select
              value={filters.sport || ''}
              onChange={(e) => handleFilterChange('sport', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Sports</option>
              {AVAILABLE_SPORTS.map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </div>

          {/* Skill Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skill Level
            </label>
            <select
              value={filters.level || ''}
              onChange={(e) => handleFilterChange('level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Levels</option>
              {SKILL_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
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
              <span>{isLoading ? 'Searching...' : 'Search Players'}</span>
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

export default PlayerSearchFilters;