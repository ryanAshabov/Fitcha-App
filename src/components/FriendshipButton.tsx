import React, { useState } from 'react';
import { UserPlus, UserCheck, UserX, Users, MoreHorizontal, Check, X } from 'lucide-react';
import { useFriendshipStatus } from '../hooks/useFriendship';
import { FriendshipButtonState } from '../types/friendship';
import Button from './ui/Button';

interface FriendshipButtonProps {
  userId: string;
  className?: string;
}

const FriendshipButton: React.FC<FriendshipButtonProps> = ({ userId, className = '' }) => {
  const [showUnfriendMenu, setShowUnfriendMenu] = useState(false);
  const {
    buttonState,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    unfriend
  } = useFriendshipStatus(userId);

  const handleAction = async (action: string) => {
    let result;

    switch (action) {
      case 'send_request':
        result = await sendFriendRequest();
        break;
      case 'cancel_request':
        result = await cancelFriendRequest();
        break;
      case 'accept_request':
        result = await acceptFriendRequest();
        break;
      case 'decline_request':
        result = await declineFriendRequest();
        break;
      case 'unfriend':
        result = await unfriend();
        setShowUnfriendMenu(false);
        break;
      default:
        return;
    }

    if (result && !result.success) {
      alert('Error: ' + result.error);
    }
  };

  const renderButton = () => {
    switch (buttonState) {
      case 'loading':
        return (
          <Button
            variant="secondary"
            disabled
            className={`flex items-center space-x-2 ${className}`}
          >
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            <span>Loading...</span>
          </Button>
        );

      case 'add_friend':
        return (
          <Button
            variant="primary"
            onClick={() => handleAction('send_request')}
            className={`flex items-center space-x-2 ${className}`}
          >
            <UserPlus size={16} />
            <span>Add Friend</span>
          </Button>
        );

      case 'request_sent':
        return (
          <Button
            variant="secondary"
            onClick={() => handleAction('cancel_request')}
            className={`flex items-center space-x-2 ${className}`}
          >
            <UserCheck size={16} />
            <span>Request Sent</span>
          </Button>
        );

      case 'request_received':
        return (
          <div className={`flex space-x-2 ${className}`}>
            <Button
              variant="primary"
              onClick={() => handleAction('accept_request')}
              className="flex items-center space-x-2"
            >
              <Check size={16} />
              <span>Accept</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleAction('decline_request')}
              className="flex items-center space-x-2"
            >
              <X size={16} />
              <span>Decline</span>
            </Button>
          </div>
        );

      case 'friends':
        return (
          <div className={`relative ${className}`}>
            <Button
              variant="secondary"
              onClick={() => setShowUnfriendMenu(!showUnfriendMenu)}
              className="flex items-center space-x-2"
            >
              <Users size={16} />
              <span>Friends</span>
              <MoreHorizontal size={14} />
            </Button>

            {showUnfriendMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={() => handleAction('unfriend')}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <UserX size={16} />
                  <span>Unfriend</span>
                </button>
              </div>
            )}
          </div>
        );

      case 'blocked':
        return (
          <Button
            variant="secondary"
            disabled
            className={`flex items-center space-x-2 ${className}`}
          >
            <UserX size={16} />
            <span>Blocked</span>
          </Button>
        );

      default:
        return null;
    }
  };

  return renderButton();
};

export default FriendshipButton;