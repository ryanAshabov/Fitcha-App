import React, { useState, useEffect } from 'react';
import { MapPin, DollarSign, Star, Calendar, Clock, CheckCircle } from 'lucide-react';
import { Court, TimeSlot } from '../types/court';
import { courtService } from '../services/courtService';
import { AppPage } from '../App';
import GlobalHeader from './layout/GlobalHeader';
import Button from './ui/Button';
import BookingModal from './BookingModal';

interface CourtDetailsPageProps {
  courtId: string;
  onNavigate: (page: AppPage) => void;
  onBookingSuccess: () => void;
}

const CourtDetailsPage: React.FC<CourtDetailsPageProps> = ({ 
  courtId, 
  onNavigate,
  onBookingSuccess
}) => {
  const [court, setCourt] = useState<Court | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    fetchCourtDetails();
  }, [courtId]);

  useEffect(() => {
    if (court) {
      fetchAvailability();
    }
  }, [selectedDate, court]);

  const fetchCourtDetails = async () => {
    setLoading(true);
    setError(null);

    const { data, error: courtError } = await courtService.getCourt(courtId);

    if (courtError) {
      setError(courtError.message);
    } else {
      setCourt(data);
    }

    setLoading(false);
  };

  const fetchAvailability = async () => {
    if (!court) return;

    setAvailabilityLoading(true);
    const { data, error: availabilityError } = await courtService.getCourtAvailability(
      court.id, 
      selectedDate
    );

    if (availabilityError) {
      console.error('Failed to fetch availability:', availabilityError.message);
    } else {
      setTimeSlots(data || []);
    }

    setAvailabilityLoading(false);
  };

  const handleTimeSlotSelect = (hourSlot: number, isAvailable: boolean) => {
    if (!isAvailable) return;
    setSelectedTimeSlot(hourSlot);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    setSelectedTimeSlot(null);
    fetchAvailability(); // Refresh availability
    onBookingSuccess();
  };

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const formatCourtType = (courtType: string) => {
    return courtType?.replace('-', ' ') || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GlobalHeader currentPage="court-details" onNavigate={onNavigate} />
        <div className="flex items-center justify-center pt-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading court details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !court) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GlobalHeader currentPage="court-details" onNavigate={onNavigate} />
        <div className="flex items-center justify-center pt-32">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading court: {error}</p>
            <Button variant="primary" onClick={() => onNavigate('book-court')}>
              Back to Search
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const primaryImage = court.images && court.images.length > 0 ? court.images[0] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalHeader currentPage="court-details" onNavigate={onNavigate} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Court Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Court Image */}
            <div>
              <div className="w-full h-64 rounded-lg bg-gray-200 overflow-hidden">
                {primaryImage ? (
                  <img
                    src={primaryImage}
                    alt={court.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100">
                    <Star className="w-12 h-12 text-blue-600" />
                  </div>
                )}
              </div>
            </div>

            {/* Court Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{court.name}</h1>
              
              <div className="flex items-center space-x-4 mb-4">
                <span className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  <Star className="w-4 h-4" />
                  <span>{court.sport_type}</span>
                </span>
                
                {court.court_type && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                    {formatCourtType(court.court_type)}
                  </span>
                )}
              </div>

              {court.location_address && (
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span>{court.location_address}</span>
                </div>
              )}

              <div className="flex items-center mb-6">
                <DollarSign className="w-6 h-6 text-green-600 mr-1" />
                <span className="text-2xl font-bold text-green-600">
                  ${court.hourly_price}
                </span>
                <span className="text-gray-600 ml-1">/hour</span>
              </div>

              {court.description && (
                <p className="text-gray-700 leading-relaxed">{court.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Booking Section */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Book This Court</h2>
          
          {/* Date Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <div className="relative max-w-xs">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Time Slots */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Time Slots</h3>
            
            {availabilityLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[...Array(12)].map((_, index) => (
                  <div key={index} className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.hour_slot}
                    onClick={() => handleTimeSlotSelect(slot.hour_slot, slot.is_available)}
                    disabled={!slot.is_available}
                    className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      slot.is_available
                        ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'
                        : 'bg-red-100 text-red-800 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(slot.hour_slot)}</span>
                    </div>
                    <div className="text-xs mt-1">
                      {slot.is_available ? 'Available' : 'Booked'}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {timeSlots.length === 0 && !availabilityLoading && (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No time slots available for this date.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedTimeSlot !== null && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedTimeSlot(null);
          }}
          court={court}
          selectedDate={selectedDate}
          selectedTimeSlot={selectedTimeSlot}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default CourtDetailsPage;