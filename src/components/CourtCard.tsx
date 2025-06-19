import React from 'react';
import { MapPin, DollarSign, Star } from 'lucide-react';
import { Court } from '../types/court';
import Button from './ui/Button';

interface CourtCardProps {
  court: Court;
  onViewCourt: (courtId: string) => void;
}

const CourtCard: React.FC<CourtCardProps> = ({ court, onViewCourt }) => {
  const primaryImage = court.images && court.images.length > 0 ? court.images[0] : null;

  const getSportIcon = (sportType: string) => {
    // For now, we'll use a generic star icon, but this could be expanded with sport-specific icons
    return <Star className="w-4 h-4" />;
  };

  const formatCourtType = (courtType: string) => {
    return courtType?.replace('-', ' ') || '';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex space-x-4">
        {/* Court Image */}
        <div className="flex-shrink-0">
          <div className="w-32 h-24 rounded-lg bg-gray-200 overflow-hidden">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={court.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100">
                {getSportIcon(court.sport_type)}
              </div>
            )}
          </div>
        </div>

        {/* Court Info */}
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-grow">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {court.name}
              </h3>
              
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                <span className="flex items-center space-x-1">
                  {getSportIcon(court.sport_type)}
                  <span>{court.sport_type}</span>
                </span>
                
                {court.court_type && (
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                    {formatCourtType(court.court_type)}
                  </span>
                )}
              </div>

              {court.location_address && (
                <div className="flex items-center text-gray-600 mt-2">
                  <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="text-sm truncate">{court.location_address}</span>
                </div>
              )}

              {court.description && (
                <p className="text-gray-700 text-sm mt-2 line-clamp-2">
                  {court.description}
                </p>
              )}

              {/* Price */}
              <div className="flex items-center mt-3 space-x-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-lg font-bold text-green-600">
                  ${court.hourly_price}
                </span>
                <span className="text-sm text-gray-600">/hour</span>
              </div>
            </div>

            {/* View Details Button */}
            <div className="ml-4 flex-shrink-0">
              <Button
                variant="primary"
                onClick={() => onViewCourt(court.id)}
                className="text-sm px-4 py-2"
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourtCard;