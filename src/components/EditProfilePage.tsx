import React, { useState, useRef } from 'react';
import { Camera, Plus, X, Save } from 'lucide-react';
import { Profile, ProfileFormData, SportSkill, AVAILABLE_SPORTS, SKILL_LEVELS } from '../types/profile';
import { profileService } from '../services/profileService';
import { AppPage } from '../App';
import GlobalHeader from './layout/GlobalHeader';
import Button from './ui/Button';
import Input from './ui/Input';

interface EditProfilePageProps {
  profile: Profile | null;
  onSave: (data: ProfileFormData) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  onNavigate?: (page: AppPage) => void;
}

const EditProfilePage: React.FC<EditProfilePageProps> = ({ 
  profile, 
  onSave, 
  onCancel,
  onNavigate
}) => {
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    sports: profile?.sports || []
  });

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAddSport, setShowAddSport] = useState(false);
  const [newSport, setNewSport] = useState({ sport: '', level: 'Beginner' as SportSkill['level'] });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

    setIsUploading(true);

    const { data, error } = await profileService.uploadAvatar(file);

    if (error) {
      alert('Failed to upload avatar: ' + error.message);
    } else if (data) {
      setAvatarUrl(data);
    }

    setIsUploading(false);
  };

  const handleAddSport = () => {
    if (!newSport.sport) return;

    // Check if sport already exists
    const exists = formData.sports.some(s => s.sport === newSport.sport);
    if (exists) {
      alert('This sport is already in your list');
      return;
    }

    setFormData(prev => ({
      ...prev,
      sports: [...prev.sports, { ...newSport }]
    }));

    setNewSport({ sport: '', level: 'Beginner' });
    setShowAddSport(false);
  };

  const handleRemoveSport = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sports: prev.sports.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSaving(true);

    // Include avatar URL in the form data if it was updated
    const profileData = {
      ...formData,
      ...(avatarUrl !== profile?.avatar_url && { avatar_url: avatarUrl })
    };

    const result = await onSave(profileData);

    if (result.success) {
      // Success handled by parent component
    } else {
      alert('Failed to save profile: ' + result.error);
    }

    setIsSaving(false);
  };

  const handleCancel = () => {
    if (!isSaving) {
      onCancel();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalHeader currentPage="profile" onNavigate={onNavigate || (() => {})} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
          <p className="text-gray-600 mt-2">Update your profile information and sports preferences.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Avatar Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h2>
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-100">
                      <span className="text-lg font-bold text-blue-600">
                        {formData.first_name.charAt(0)}{formData.last_name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                {isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center space-x-2"
                >
                  <Camera size={16} />
                  <span>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                </Button>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 5MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                label="First Name"
                type="text"
                value={formData.first_name}
                onChange={(value) => handleInputChange('first_name', value)}
                error={errors.first_name}
              />
              <Input
                label="Last Name"
                type="text"
                value={formData.last_name}
                onChange={(value) => handleInputChange('last_name', value)}
                error={errors.last_name}
              />
            </div>
            <div className="mb-4">
              <Input
                label="Location"
                type="text"
                value={formData.location}
                onChange={(value) => handleInputChange('location', value)}
                placeholder="e.g., New York, NY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell others about yourself and your athletic interests..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Sports & Skills */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Sports & Skills</h2>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddSport(true)}
                className="flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Add Sport</span>
              </Button>
            </div>

            {/* Add Sport Form */}
            {showAddSport && (
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sport
                    </label>
                    <select
                      value={newSport.sport}
                      onChange={(e) => setNewSport(prev => ({ ...prev, sport: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a sport</option>
                      {AVAILABLE_SPORTS.map(sport => (
                        <option key={sport} value={sport}>{sport}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Skill Level
                    </label>
                    <select
                      value={newSport.level}
                      onChange={(e) => setNewSport(prev => ({ ...prev, level: e.target.value as SportSkill['level'] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {SKILL_LEVELS.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleAddSport}
                    disabled={!newSport.sport}
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowAddSport(false);
                      setNewSport({ sport: '', level: 'Beginner' });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Sports List */}
            {formData.sports.length > 0 ? (
              <div className="space-y-2">
                {formData.sports.map((sportSkill, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <span className="font-medium text-gray-900">{sportSkill.sport}</span>
                      <span className="ml-2 text-sm text-gray-600">({sportSkill.level})</span>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleRemoveSport(index)}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No sports added yet. Click "Add Sport" to get started.
              </p>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving}
              className="flex items-center space-x-2"
            >
              <Save size={16} />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfilePage;