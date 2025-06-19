import React from 'react';
import { Users, Check, X } from 'lucide-react';
import { usePendingFriendRequests } from '../hooks/useFriendship';
import Button from './ui/Button';

const FriendRequestsWidget: React.FC = () => {
  const { pendingRequests, loading, error, acceptRequest, declineRequest } = usePendingFriendRequests();

  const handleAccept = async (friendshipId: string) => {
    const result = await acceptRequest(friendshipId);
    if (!result.success) {
      alert('Failed to accept friend request: ' + result.error);
    }
  };

  const handleDecline = async (friendshipId: string) => {
    const result = await declineRequest(friendshipId);
    if (!result.success) {
      alert('Failed to decline friend request: ' + result.error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Friend Requests</h4>
        <div className="space-y-3">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Friend Requests</h4>
        <p className="text-sm text-red-600">Error loading requests: {error}</p>
      </div>
    );
  }

  if (pendingRequests.length === 0) {
    return null; // Don't show widget if no pending requests
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h4 className="font-semibold text-gray-900 mb-4">Friend Requests</h4>
      
      <div className="space-y-3">
        {pendingRequests.slice(0, 3).map((request) => (
          <div
            key={request.friendship_id}
            className="border border-gray-200 rounded-lg p-3"
          >
            <div className="flex items-center space-x-3 mb-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                {request.requester_avatar ? (
                  <img
                    src={request.requester_avatar}
                    alt={request.requester_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100">
                    <span className="text-sm font-bold text-blue-600">
                      {request.requester_name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Request Info */}
              <div className="flex-grow min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {request.requester_name}
                </p>
                {request.requester_location && (
                  <p className="text-xs text-gray-600 truncate">
                    {request.requester_location}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button
                variant="primary"
                onClick={() => handleAccept(request.friendship_id)}
                className="flex-1 flex items-center justify-center space-x-1 text-xs py-1"
              >
                <Check size={12} />
                <span>Accept</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleDecline(request.friendship_id)}
                className="flex-1 flex items-center justify-center space-x-1 text-xs py-1"
              >
                <X size={12} />
                <span>Decline</span>
              </Button>
            </div>
          </div>
        ))}
        
        {pendingRequests.length > 3 && (
          <Button variant="secondary" className="w-full text-sm">
            View All Requests ({pendingRequests.length})
          </Button>
        )}
      </div>
    </div>
  );
};

export default FriendRequestsWidget;