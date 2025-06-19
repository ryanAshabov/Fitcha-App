import React, { useState, useRef } from 'react';
import { Camera, MapPin, Calendar, User, Award, Trophy } from 'lucide-react';
import { AthleticProfile } from '../../types/athleticProfile';
import { profileService } from '../../services/profileService';
import Button from '../ui/Button';

interface ProfileHeaderProps {
  profile: AthleticProfile;
  isOwnProfile: boolean;
  onEditClick?: () => void;
  onProfileUpdate?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  profile, 
  isOwnProfile, 
  onEditClick,
  onProfileUpdate 
}) => {
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !isOwnProfile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);

    const { data, error } = await profileService.uploadAvatar(file);

    if (error) {
      alert('Failed to upload avatar: ' + error.message);
    } else if (data) {
      // Update profile with new avatar URL
      await profileService.upsertProfile({ avatar_url: data });
      if (onProfileUpdate) {
        onProfileUpdate();
      }
    }

    setIsUploadingAvatar(false);
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const getProfileCompletenessColor = (completeness: number) => {
    if (completeness >= 80) return 'text-green-600 bg-green-100';
    if (completeness >= 60) return 'text-yellow-600 bg-yellow-100';
    if (completeness >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'coach':
        return <Award className="w-4 h-4" />;
      case 'venue_owner':
        return <MapPin className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case 'coach':
        return 'Coach';
      case 'venue_owner':
        return 'Venue Owner';
      default:
        return 'Player';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
        {/* Avatar Section */}
        <div className="flex-shrink-0 relative">
          <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden relative">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={`${profile.first_name} ${profile.last_name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100">
                <span className="text-3xl font-bold text-blue-600">
                  {profile.first_name.charAt(0)}{profile.last_name.charAt(0)}
                </span>
              </div>
            )}
            
            {/* Upload overlay for own profile */}
            {isOwnProfile && (
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center cursor-pointer group"
                   onClick={() => fileInputRef.current?.click()}>
                <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            )}
            
            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>

        {/* Profile Info */}
        <div className="flex-grow">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            <div className="mb-4 lg:mb-0">
              {/* Name and User Type */}
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile.first_name} {profile.last_name}
                </h1>
                <div className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {getUserTypeIcon(profile.user_type)}
                  <span>{getUserTypeLabel(profile.user_type)}</span>
                </div>
              </div>

              {/* Age and Location */}
              <div className="flex items-center space-x-4 text-gray-600 mb-3">
                {profile.age && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{profile.age} years old</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{profile.location}</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-700 max-w-2xl leading-relaxed mb-4">
                  {profile.bio}
                </p>
              )}

              {/* Quick Stats */}
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-1">
                  <Trophy className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{profile.total_sports}</span>
                  <span className="text-gray-600">Sports</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Award className="w-4 h-4 text-green-600" />
                  <span className="font-medium">{profile.total_achievements}</span>
                  <span className="text-gray-600">Achievements</span>
                </div>
              </div>
            </div>

            {/* Action Buttons and Profile Completeness */}
            <div className="flex flex-col items-start lg:items-end space-y-3">
              {/* Profile Completeness */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Profile:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProfileCompletenessColor(profile.profile_completeness)}`}>
                  {profile.profile_completeness}% Complete
                </span>
              </div>

              {/* Edit Button for Own Profile */}
              {isOwnProfile && onEditClick && (
                <Button
                  variant="primary"
                  onClick={onEditClick}
                  className="flex items-center space-x-2"
                >
                  <User size={16} />
                  <span>Edit Profile</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;