import React, { useState, useEffect } from 'react';
import { useProfile } from '../hooks/useProfile';
import { profileService } from '../services/profileService';
import { Profile } from '../types/profile';
import NewProfilePage from './NewProfilePage';
import EditProfilePage from './EditProfilePage';
import { AppPage } from '../App';
import { useAuth } from '../hooks/useAuth';

interface ProfileContainerProps {
  onNavigate: (page: AppPage) => void;
  viewingUserId?: string | null;
}

const ProfileContainer: React.FC<ProfileContainerProps> = ({ 
  onNavigate, 
  viewingUserId 
}) => {
  const { user } = useAuth();
  const { profile: currentUserProfile, loading: currentUserLoading, error: currentUserError, updateProfile } = useProfile();
  const [viewedProfile, setViewedProfile] = useState<Profile | null>(null);
  const [viewedProfileLoading, setViewedProfileLoading] = useState(false);
  const [viewedProfileError, setViewedProfileError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Determine if we're viewing another user's profile or our own
  const isViewingOtherUser = viewingUserId && viewingUserId !== user?.id;
  const isOwnProfile = !isViewingOtherUser;

  // Use appropriate profile data based on whether we're viewing our own or another user's profile
  const profile = isViewingOtherUser ? viewedProfile : currentUserProfile;
  const loading = isViewingOtherUser ? viewedProfileLoading : currentUserLoading;
  const error = isViewingOtherUser ? viewedProfileError : currentUserError;

  // Fetch viewed user's profile if viewing another user
  useEffect(() => {
    if (isViewingOtherUser && viewingUserId) {
      fetchViewedProfile(viewingUserId);
    } else {
      // Clear viewed profile data when not viewing another user
      setViewedProfile(null);
      setViewedProfileError(null);
    }
  }, [viewingUserId, isViewingOtherUser]);

  const fetchViewedProfile = async (userId: string) => {
    setViewedProfileLoading(true);
    setViewedProfileError(null);

    const { data, error } = await profileService.getProfile(userId);

    if (error) {
      setViewedProfileError(error.message);
    } else {
      setViewedProfile(data);
    }

    setViewedProfileLoading(false);
  };

  // Loading state - show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state - show error message
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading profile: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-500"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async (profileData: any) => {
    const result = await updateProfile(profileData);
    if (result.success) {
      setIsEditing(false);
    }
    return result;
  };

  const handleCancelEdit = () => {
    if (profile === null) {
      // If no profile exists and user cancels, navigate back to home
      onNavigate('home');
    } else {
      // If profile exists, just exit edit mode
      setIsEditing(false);
    }
  };

  // Only allow editing of own profile, and only show edit page if profile is null (needs to be created) or if editing
  if (isOwnProfile && (profile === null || isEditing)) {
    return (
      <EditProfilePage
        profile={profile}
        onSave={handleSave}
        onCancel={handleCancelEdit}
        onNavigate={onNavigate}
      />
    );
  }

  // Show profile not found for other users when profile is null
  if (isViewingOtherUser && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Profile not found</p>
          <button
            onClick={() => onNavigate('find-players')}
            className="text-blue-600 hover:text-blue-500"
          >
            Back to Find Players
          </button>
        </div>
      </div>
    );
  }

  // Final safety check - ensure profile exists before rendering NewProfilePage
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Profile not available</p>
          <button
            onClick={() => onNavigate('home')}
            className="text-blue-600 hover:text-blue-500"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Render the new enhanced profile page
  return (
    <NewProfilePage
      userId={isViewingOtherUser ? viewingUserId : undefined}
      isOwnProfile={isOwnProfile}
      onEditClick={isOwnProfile ? () => setIsEditing(true) : undefined}
      onNavigate={onNavigate}
    />
  );
};

export default ProfileContainer;