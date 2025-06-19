import React, { useState } from 'react';
import { Award, Plus, Trash2, ExternalLink, Calendar, Building } from 'lucide-react';
import { Achievement } from '../../types/athleticProfile';
import Button from '../ui/Button';
import AddAchievementModal from './AddAchievementModal';

interface AchievementsSectionProps {
  achievements: Achievement[];
  isOwnProfile: boolean;
  onAddAchievement?: (achievementData: any) => Promise<{ success: boolean; error?: string }>;
  onRemoveAchievement?: (achievementId: string) => Promise<{ success: boolean; error?: string }>;
}

const AchievementsSection: React.FC<AchievementsSectionProps> = ({
  achievements,
  isOwnProfile,
  onAddAchievement,
  onRemoveAchievement
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [removingAchievementId, setRemovingAchievementId] = useState<string | null>(null);

  const getAchievementTypeColor = (type: string) => {
    switch (type) {
      case 'Certification':
        return 'bg-blue-100 text-blue-800';
      case 'Award':
        return 'bg-yellow-100 text-yellow-800';
      case 'Competition':
        return 'bg-green-100 text-green-800';
      case 'Course':
        return 'bg-purple-100 text-purple-800';
      case 'License':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAchievementTypeIcon = (type: string) => {
    switch (type) {
      case 'Award':
      case 'Competition':
        return <Award className="w-4 h-4" />;
      default:
        return <Award className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const handleAddAchievement = async (achievementData: any) => {
    if (!onAddAchievement) return { success: false, error: 'Add achievement function not available' };

    const result = await onAddAchievement(achievementData);
    if (result.success) {
      setShowAddModal(false);
    }
    return result;
  };

  const handleRemoveAchievement = async (achievementId: string) => {
    if (!onRemoveAchievement) return;

    setRemovingAchievementId(achievementId);
    const result = await onRemoveAchievement(achievementId);
    
    if (!result.success) {
      alert('Failed to remove achievement: ' + result.error);
    }
    
    setRemovingAchievementId(null);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Award className="w-5 h-5 text-yellow-600" />
            <span>Achievements & Certifications</span>
          </h2>
          
          {isOwnProfile && (
            <Button
              variant="primary"
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add Achievement</span>
            </Button>
          )}
        </div>

        {achievements.length > 0 ? (
          <div className="space-y-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow relative group"
              >
                {/* Remove button for own profile */}
                {isOwnProfile && (
                  <button
                    onClick={() => handleRemoveAchievement(achievement.id)}
                    disabled={removingAchievementId === achievement.id}
                    className="absolute top-4 right-4 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {removingAchievementId === achievement.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                )}

                <div className="flex items-start space-x-4">
                  {/* Achievement Icon */}
                  <div className="flex-shrink-0 mt-1">
                    <div className={`p-2 rounded-lg ${getAchievementTypeColor(achievement.type)}`}>
                      {getAchievementTypeIcon(achievement.type)}
                    </div>
                  </div>

                  {/* Achievement Details */}
                  <div className="flex-grow min-w-0 pr-8">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {achievement.title}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAchievementTypeColor(achievement.type)}`}
                        >
                          {achievement.type}
                        </span>
                      </div>
                      
                      {achievement.is_verified && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <Award size={16} />
                          <span className="text-xs font-medium">Verified</span>
                        </div>
                      )}
                    </div>

                    {achievement.organization && (
                      <div className="flex items-center space-x-1 text-gray-600 mb-2">
                        <Building className="w-4 h-4" />
                        <span className="text-sm">{achievement.organization}</span>
                      </div>
                    )}

                    {achievement.description && (
                      <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                        {achievement.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                        {achievement.date_issued && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>Issued {formatDate(achievement.date_issued)}</span>
                          </div>
                        )}
                        
                        {achievement.expiry_date && (
                          <div className={`flex items-center space-x-1 ${
                            isExpired(achievement.expiry_date) ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            <Calendar className="w-3 h-3" />
                            <span>
                              {isExpired(achievement.expiry_date) ? 'Expired' : 'Expires'} {formatDate(achievement.expiry_date)}
                            </span>
                          </div>
                        )}
                      </div>

                      {achievement.credential_url && (
                        <a
                          href={achievement.credential_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View Credential</span>
                        </a>
                      )}
                    </div>

                    {achievement.credential_id && (
                      <div className="mt-2 text-xs text-gray-500">
                        ID: {achievement.credential_id}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Achievements Yet</h3>
            <p className="text-gray-600 mb-6">
              {isOwnProfile 
                ? "Add your certifications, awards, and achievements to showcase your athletic credentials and build trust with other athletes."
                : "This user hasn't added any achievements yet."
              }
            </p>
            {isOwnProfile && (
              <Button 
                variant="primary" 
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Add Your First Achievement</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add Achievement Modal */}
      {showAddModal && (
        <AddAchievementModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddAchievement={handleAddAchievement}
        />
      )}
    </>
  );
};

export default AchievementsSection;