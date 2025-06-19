import React, { useState } from 'react';
import { MapPin, Edit, Trophy, Star, Users, MessageCircle } from 'lucide-react';
import { Profile, SportSkill } from '../types/profile';
import { AppPage } from '../App';
import { useMessaging } from '../hooks/useMessaging';
import Button from './ui/Button';
import FriendshipButton from './FriendshipButton';
import RequestToPlayModal from './RequestToPlayModal';
import MatchHistorySection from './MatchHistorySection';

interface ProfilePageProps {
  profile: Profile | null;
  isOwnProfile: boolean;
  onEditClick?: () => void;
  onNavigate?: (page: AppPage) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ 
  profile, 
  isOwnProfile, 
  onEditClick,
  onNavigate
}) => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const { sendMessageToUser } = useMessaging();

  // Early return with loading state if profile is null or undefined
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const getSkillLevelColor = (level: SportSkill['level']) => {
    switch (level) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-blue-100 text-blue-800';
      case 'Advanced':
        return 'bg-purple-100 text-purple-800';
      case 'Professional':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSkillLevelIcon = (level: SportSkill['level']) => {
    switch (level) {
      case 'Professional':
        return <Trophy className="w-3 h-3" />;
      case 'Advanced':
        return <Star className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const handleRequestSuccess = () => {
    console.log('Request sent successfully!');
  };

  const handleSendMessage = async () => {
    if (sendingMessage) return;

    setSendingMessage(true);
    
    const result = await sendMessageToUser(profile.user_id, `Hi ${profile.first_name || 'there'}! I'd love to connect and maybe play together sometime.`);
    
    if (result.success) {
      // Navigate to messages page
      if (onNavigate) {
        onNavigate('messages');
      }
    } else {
      alert('Failed to send message: ' + result.error);
    }
    
    setSendingMessage(false);
  };

  // Safely access profile properties with fallbacks
  const firstName = profile.first_name || '';
  const lastName = profile.last_name || '';
  const avatarUrl = profile.avatar_url || '';
  const location = profile.location || '';
  const bio = profile.bio || '';

  // Filter out invalid sport entries and ensure they have required properties
  const validSports = Array.isArray(profile.sports) 
    ? profile.sports.filter((sportSkill): sportSkill is SportSkill => 
        sportSkill && 
        typeof sportSkill === 'object' && 
        typeof sportSkill.sport === 'string' && 
        sportSkill.sport.trim() !== '' &&
        typeof sportSkill.level === 'string' && 
        sportSkill.level.trim() !== ''
      )
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={`${firstName} ${lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100">
                    <span className="text-2xl font-bold text-blue-600">
                      {firstName.charAt(0)}{lastName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-grow">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {firstName} {lastName}
                  </h1>
                  
                  {location && (
                    <div className="flex items-center text-gray-600 mb-3">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{location}</span>
                    </div>
                  )}

                  {bio && (
                    <p className="text-gray-700 max-w-2xl">{bio}</p>
                  )}
                </div>

                <div className="mt-4 sm:mt-0 flex flex-col space-y-2">
                  {isOwnProfile && onEditClick && (
                    <Button
                      variant="secondary"
                      onClick={onEditClick}
                      className="flex items-center space-x-2"
                    >
                      <Edit size={16} />
                      <span>Edit Profile</span>
                    </Button>
                  )}

                  {!isOwnProfile && (
                    <>
                      {/* Friendship Button */}
                      <FriendshipButton userId={profile.user_id} />
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="primary"
                          onClick={() => setShowRequestModal(true)}
                          className="flex items-center space-x-2 flex-1"
                        >
                          <Users size={16} />
                          <span>Request to Play</span>
                        </Button>
                        
                        <Button
                          variant="secondary"
                          onClick={handleSendMessage}
                          disabled={sendingMessage}
                          className="flex items-center space-x-2 flex-1"
                        >
                          <MessageCircle size={16} />
                          <span>{sendingMessage ? 'Sending...' : 'Message'}</span>
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sports & Skills */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Sports & Skills</h2>
          
          {validSports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {validSports.map((sportSkill, index) => (
                <div
                  key={`${sportSkill.sport}-${index}`}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{sportSkill.sport}</h3>
                    {getSkillLevelIcon(sportSkill.level)}
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSkillLevelColor(
                      sportSkill.level
                    )}`}
                  >
                    {sportSkill.level}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Sports Added Yet</h3>
              <p className="text-gray-600 mb-4">
                {isOwnProfile 
                  ? "Add your sports and skill levels to connect with other athletes."
                  : "This user hasn't added any sports yet."
                }
              </p>
              {isOwnProfile && onEditClick && (
                <Button variant="primary" onClick={onEditClick}>
                  Add Sports
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Match History & Endorsements */}
        <MatchHistorySection 
          userId={profile.user_id} 
          isOwnProfile={isOwnProfile} 
        />
      </div>

      {/* Request to Play Modal */}
      {!isOwnProfile && (
        <RequestToPlayModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          receiverProfile={profile}
          onSuccess={handleRequestSuccess}
        />
      )}
    </div>
  );
};

export default ProfilePage;