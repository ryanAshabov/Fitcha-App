import React from 'react';
import { Calendar, MapPin, Clock, Check, X } from 'lucide-react';
import { GameRequest } from '../types/gameRequest';
import Button from './ui/Button';

interface RequestCardProps {
  request: GameRequest;
  type: 'received' | 'sent';
  onAccept?: (requestId: string) => void;
  onDecline?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
  isUpdating?: boolean;
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  type,
  onAccept,
  onDecline,
  onCancel,
  isUpdating = false
}) => {
  const otherProfile = type === 'received' ? request.sender_profile : request.receiver_profile;
  
  if (!otherProfile) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatRelativeTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
            {otherProfile.avatar_url ? (
              <img
                src={otherProfile.avatar_url}
                alt={`${otherProfile.first_name} ${otherProfile.last_name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100">
                <span className="text-sm font-bold text-blue-600">
                  {otherProfile.first_name.charAt(0)}{otherProfile.last_name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* User Info */}
          <div>
            <h3 className="font-semibold text-gray-900">
              {otherProfile.first_name} {otherProfile.last_name}
            </h3>
            {otherProfile.location && (
              <div className="flex items-center text-gray-600 text-sm">
                <MapPin className="w-3 h-3 mr-1" />
                <span>{otherProfile.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status & Time */}
        <div className="text-right">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </span>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <Clock className="w-3 h-3 mr-1" />
            <span>{formatRelativeTime(request.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Message */}
      {request.message && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">{request.message}</p>
        </div>
      )}

      {/* Proposed Date/Time */}
      {request.proposed_datetime && (
        <div className="mb-4 flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          <span>Suggested: {formatDateTime(request.proposed_datetime)}</span>
        </div>
      )}

      {/* Actions */}
      {request.status === 'pending' && (
        <div className="flex space-x-2">
          {type === 'received' && onAccept && onDecline && (
            <>
              <Button
                variant="primary"
                onClick={() => onAccept(request.id)}
                disabled={isUpdating}
                className="flex-1 flex items-center justify-center space-x-2"
              >
                <Check size={16} />
                <span>Accept</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => onDecline(request.id)}
                disabled={isUpdating}
                className="flex-1 flex items-center justify-center space-x-2"
              >
                <X size={16} />
                <span>Decline</span>
              </Button>
            </>
          )}
          
          {type === 'sent' && onCancel && (
            <Button
              variant="secondary"
              onClick={() => onCancel(request.id)}
              disabled={isUpdating}
              className="flex items-center justify-center space-x-2"
            >
              <X size={16} />
              <span>Cancel</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default RequestCard;