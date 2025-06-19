import React, { useState } from 'react';
import { Trophy, Plus, Edit, Trash2, Star, Award } from 'lucide-react';
import { UserSport } from '../../types/athleticProfile';
import Button from '../ui/Button';
import AddSportModal from './AddSportModal';

interface AthleticInfoSectionProps {
  sports: UserSport[];
  isOwnProfile: boolean;
  onAddSport?: (sportData: any) => Promise<{ success: boolean; error?: string }>;
  onRemoveSport?: (sportId: string) => Promise<{ success: boolean; error?: string }>;
}

const AthleticInfoSection: React.FC<AthleticInfoSectionProps> = ({
  sports,
  isOwnProfile,
  onAddSport,
  onRemoveSport
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [removingSportId, setRemovingSportId] = useState<string | null>(null);

  const getSkillLevelColor = (level: string) => {
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

  const getSkillLevelIcon = (level: string) => {
    switch (level) {
      case 'Professional':
        return <Trophy className="w-3 h-3" />;
      case 'Advanced':
        return <Star className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const handleAddSport = async (sportData: any) => {
    if (!onAddSport) return { success: false, error: 'Add sport function not available' };

    const result = await onAddSport(sportData);
    if (result.success) {
      setShowAddModal(false);
    }
    return result;
  };

  const handleRemoveSport = async (sportId: string) => {
    if (!onRemoveSport) return;

    setRemovingSportId(sportId);
    const result = await onRemoveSport(sportId);
    
    if (!result.success) {
      alert('Failed to remove sport: ' + result.error);
    }
    
    setRemovingSportId(null);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-blue-600" />
            <span>Sports & Skills</span>
          </h2>
          
          {isOwnProfile && (
            <Button
              variant="primary"
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add Sport</span>
            </Button>
          )}
        </div>

        {sports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sports.map((sport) => (
              <div
                key={sport.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative group"
              >
                {/* Remove button for own profile */}
                {isOwnProfile && (
                  <button
                    onClick={() => handleRemoveSport(sport.id)}
                    disabled={removingSportId === sport.id}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {removingSportId === sport.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                )}

                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 pr-6">{sport.sport_name}</h3>
                  {getSkillLevelIcon(sport.skill_level)}
                </div>

                <div className="space-y-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSkillLevelColor(sport.skill_level)}`}
                  >
                    {sport.skill_level}
                  </span>

                  {sport.years_experience > 0 && (
                    <div className="text-xs text-gray-600">
                      {sport.years_experience} year{sport.years_experience !== 1 ? 's' : ''} experience
                    </div>
                  )}

                  {sport.preferred_role && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Role:</span> {sport.preferred_role}
                    </div>
                  )}

                  {sport.dominant_hand && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Dominant:</span> {sport.dominant_hand} handed
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sports Added Yet</h3>
            <p className="text-gray-600 mb-6">
              {isOwnProfile 
                ? "Add your sports and skill levels to showcase your athletic abilities and connect with other athletes."
                : "This user hasn't added any sports yet."
              }
            </p>
            {isOwnProfile && (
              <Button 
                variant="primary" 
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Add Your First Sport</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add Sport Modal */}
      {showAddModal && (
        <AddSportModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddSport={handleAddSport}
        />
      )}
    </>
  );
};

export default AthleticInfoSection;