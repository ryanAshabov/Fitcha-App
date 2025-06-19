import React, { useState } from 'react';
import { X, Calendar, Clock, DollarSign, MapPin } from 'lucide-react';
import { Court } from '../types/court';
import { courtService } from '../services/courtService';
import Button from './ui/Button';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  court: Court;
  selectedDate: string;
  selectedTimeSlot: number;
  onSuccess: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  court,
  selectedDate,
  selectedTimeSlot,
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleConfirmBooking = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    // Create start and end times
    const startTime = new Date(`${selectedDate}T${selectedTimeSlot.toString().padStart(2, '0')}:00:00`);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    const bookingData = {
      court_id: court.id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      total_price: court.hourly_price
    };

    const result = await courtService.createBooking(bookingData);

    if (result.error) {
      setError(result.error.message);
    } else {
      onSuccess();
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Confirm Booking</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Court Info */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">{court.name}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{court.location_address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {court.sport_type}
                </span>
                {court.court_type && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                    {court.court_type.replace('-', ' ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Booking Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>Date:</span>
                </div>
                <span className="font-medium">{formatDate(selectedDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>Time:</span>
                </div>
                <span className="font-medium">
                  {formatTime(selectedTimeSlot)} - {formatTime(selectedTimeSlot + 1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span>Duration:</span>
                </div>
                <span className="font-medium">1 hour</span>
              </div>
            </div>
          </div>

          {/* Total Price */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Total Price:</span>
              <span className="text-2xl font-bold text-blue-600">
                ${court.hourly_price.toFixed(2)}
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleConfirmBooking}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            By confirming this booking, you agree to the court's terms and conditions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;