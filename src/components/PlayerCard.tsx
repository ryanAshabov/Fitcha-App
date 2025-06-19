import React, { useState } from 'react';
import { MapPin, Trophy, Users } from 'lucide-react';
import { PlayerSearchResult } from '../types/player';
import MatchmakingModal from './MatchmakingModal';
import GameSessionModal from './GameSessionModal';
import Button from './ui/Button';
import { useAuth } from '../hooks/useAuth';

interface PlayerCardProps {
  player: PlayerSearchResult;
  onViewProfile: (playerId: string) => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, onViewProfile }) => {
  const { user } = useAuth();
  const [showMatchmakingModal, setShowMatchmakingModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);
  
  const primarySport = player.sports && player.sports.length > 0 ? player.sports[0] : null;
  const isOwnProfile = user?.id === player.user_id;

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

  const handleSessionCreated = (sessionId: string) => {
    setCreatedSessionId(sessionId);
    setShowMatchmakingModal(false);
    setShowSessionModal(true);
  };

  // Convert PlayerSearchResult to Profile format for the modal
  const playerAsProfile = {
    id: player.id,
    user_id: player.user_id,
    first_name: player.first_name,
    last_name: player.last_name,
    bio: player.bio,
    avatar_url: player.avatar_url,
    location: player.location,
    sports: player.sports,
    updated_at: player.updated_at
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
              {player.avatar_url ? (
                <img
                  src={player.avatar_url}
                  alt={`${player.first_name} ${player.last_name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-100">
                  <span className="text-lg font-bold text-blue-600">
                    {player.first_name.charAt(0)}{player.last_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Player Info */}
          <div className="flex-grow min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-grow">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {player.first_name} {player.last_name}
                </h3>
                
                {player.location && (
                  <div className="flex items-center text-gray-600 mt-1">
                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="text-sm truncate">{player.location}</span>
                  </div>
                )}

                {player.bio && (
                  <p className="text-gray-700 text-sm mt-2 line-clamp-2">
                    {player.bio}
                  </p>
                )}

                {/* Primary Sport */}
                {primarySport && (
                  <div className="flex items-center mt-3 space-x-2">
                    <Trophy className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {primarySport.sport}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSkillLevelColor(
                        primarySport.level
                      )}`}
                    >
                      {primarySport.level}
                    </span>
                  </div>
                )}

                {/* Additional Sports Count */}
                {player.sports && player.sports.length > 1 && (
                  <p className="text-xs text-gray-500 mt-1">
                    +{player.sports.length - 1} more sport{player.sports.length - 1 !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="ml-4 flex-shrink-0 space-y-2">
                {!isOwnProfile && (
                  <Button
                    variant="primary"
                    onClick={() => setShowMatchmakingModal(true)}
                    className="text-sm px-4 py-2 flex items-center space-x-2"
                  >
                    <Users size={16} />
                    <span>Play Together</span>
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => onViewProfile(player.user_id)}
                  className="text-sm px-4 py-2 w-full"
                >
                  View Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Matchmaking Modal */}
      <MatchmakingModal
        isOpen={showMatchmakingModal}
        onClose={() => setShowMatchmakingModal(false)}
        targetUser={playerAsProfile}
        onSessionCreated={handleSessionCreated}
      />

      {/* Game Session Modal */}
      {createdSessionId && (
        <GameSessionModal
          isOpen={showSessionModal}
          onClose={() => {
            setShowSessionModal(false);
            setCreatedSessionId(null);
          }}
          sessionId={createdSessionId}
        />
      )}
    </>
  );
};

export default PlayerCard;