import React from 'react';
import { useAthleticProfile } from '../hooks/useAthleticProfile';
import { AppPage } from '../App';
import ProfileHeader from './profile/ProfileHeader';
import ActivityStatsSection from './profile/ActivityStatsSection';
import AthleticInfoSection from './profile/AthleticInfoSection';
import AchievementsSection from './profile/AchievementsSection';
import PeerReviewsSection from './profile/PeerReviewsSection';
import MatchHistorySection from './profile/MatchHistorySection';
import FriendshipButton from './FriendshipButton';
import RequestToPlayModal from './RequestToPlayModal';
import { useMessaging } from '../hooks/useMessaging';
import { Users, MessageCircle } from 'lucide-react';
import Button from './ui/Button';
import { useState } from 'react';

interface NewProfilePageProps {
  userId?: string;
  isOwnProfile: boolean;
  onEditClick?: () => void;
  onNavigate?: (page: AppPage) => void;
}

const NewProfilePage: React.FC<NewProfilePageProps> = ({ 
  userId,
  isOwnProfile, 
  onEditClick,
  onNavigate
}) => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const { 
    profile, 
    loading, 
    error, 
    addSport, 
    removeSport, 
    addAchievement, 
    removeAchievement,
    refetch 
  } = useAthleticProfile(userId);
  const { sendMessageToUser } = useMessaging();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading athletic profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading profile: {error}</p>
          <Button variant="primary" onClick={() => onNavigate?.('home')}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (sendingMessage || !profile) return;

    setSendingMessage(true);
    
    const result = await sendMessageToUser(
      profile.user_id, 
      `Hi ${profile.first_name}! I'd love to connect and maybe play together sometime.`
    );
    
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

  const handleRequestSuccess = () => {
    console.log('Request sent successfully!');
  };

  // Convert profile to the format expected by RequestToPlayModal
  const profileForModal = {
    id: profile.user_id,
    user_id: profile.user_id,
    first_name: profile.first_name,
    last_name: profile.last_name,
    bio: profile.bio,
    avatar_url: profile.avatar_url,
    location: profile.location,
    sports: profile.sports.map(sport => ({
      sport: sport.sport_name,
      level: sport.skill_level
    })),
    updated_at: new Date().toISOString()
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <ProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          onEditClick={onEditClick}
          onProfileUpdate={refetch}
        />

        {/* Action Buttons for Other Users */}
        {!isOwnProfile && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Friendship Button */}
              <FriendshipButton userId={profile.user_id} className="flex-1" />
              
              <div className="flex gap-2 flex-1">
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
            </div>
          </div>
        )}

        {/* Activity Statistics */}
        <ActivityStatsSection
          userId={profile.user_id}
          isOwnProfile={isOwnProfile}
        />

        {/* Athletic Information */}
        <AthleticInfoSection
          sports={profile.sports}
          isOwnProfile={isOwnProfile}
          onAddSport={addSport}
          onRemoveSport={removeSport}
        />

        {/* Achievements */}
        <AchievementsSection
          achievements={profile.achievements}
          isOwnProfile={isOwnProfile}
          onAddAchievement={addAchievement}
          onRemoveAchievement={removeAchievement}
        />

        {/* Peer Reviews & Ratings */}
        <PeerReviewsSection
          userId={profile.user_id}
          isOwnProfile={isOwnProfile}
        />

        {/* Match History */}
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
          receiverProfile={profileForModal}
          onSuccess={handleRequestSuccess}
        />
      )}
    </div>
  );
};

export default NewProfilePage;