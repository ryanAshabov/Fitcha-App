import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Target, Award } from 'lucide-react';
import { Match, SkillEndorsementSummary } from '../types/match';
import { matchService } from '../services/matchService';

interface MatchHistorySectionProps {
  userId?: string;
  isOwnProfile: boolean;
}

const MatchHistorySection: React.FC<MatchHistorySectionProps> = ({ 
  userId, 
  isOwnProfile 
}) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [endorsements, setEndorsements] = useState<SkillEndorsementSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMatchData();
  }, [userId]);

  const fetchMatchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [matchResult, endorsementResult] = await Promise.all([
        matchService.getUserMatchHistory(userId),
        matchService.getUserSkillEndorsements(userId)
      ]);

      if (matchResult.error) {
        throw new Error(matchResult.error.message);
      }
      if (endorsementResult.error) {
        throw new Error(endorsementResult.error.message);
      }

      setMatches(matchResult.data || []);
      setEndorsements(endorsementResult.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'Won':
        return 'text-green-600 bg-green-100';
      case 'Lost':
        return 'text-red-600 bg-red-100';
      case 'Draw':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Match History & Endorsements</h2>
        <p className="text-red-600">Error loading data: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Match History */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Trophy className="w-5 h-5 mr-2" />
          Match History
        </h2>
        
        {matches.length > 0 ? (
          <div className="space-y-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Opponent Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                      {match.opponent_avatar_url ? (
                        <img
                          src={match.opponent_avatar_url}
                          alt={match.opponent_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-100">
                          <span className="text-sm font-bold text-blue-600">
                            {match.opponent_name?.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Match Details */}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        vs {match.opponent_name}
                      </h3>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>{formatMatchDate(match.verified_at!)}</span>
                        </div>
                        {match.score && (
                          <div className="flex items-center">
                            <Target className="w-3 h-3 mr-1" />
                            <span>{match.score}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Result Badge */}
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getResultColor(match.result || 'Unknown')}`}>
                    {match.result || 'N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Matches Yet</h3>
            <p className="text-gray-600">
              {isOwnProfile 
                ? "Your verified match history will appear here after you play games with other users."
                : "This user hasn't played any verified matches yet."
              }
            </p>
          </div>
        )}
      </div>

      {/* Skills & Endorsements */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Award className="w-5 h-5 mr-2" />
          Skills & Endorsements
        </h2>
        
        {endorsements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {endorsements.map((endorsement) => (
              <div
                key={endorsement.skill_name}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {endorsement.skill_name}
                  </h3>
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
                    {endorsement.endorsement_count}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p className="mb-1">Endorsed by:</p>
                  <p className="text-xs">
                    {endorsement.recent_endorsers.slice(0, 3).join(', ')}
                    {endorsement.recent_endorsers.length > 3 && 
                      ` and ${endorsement.recent_endorsers.length - 3} others`
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Endorsements Yet</h3>
            <p className="text-gray-600">
              {isOwnProfile 
                ? "Play matches with other users to receive skill endorsements from your opponents."
                : "This user hasn't received any skill endorsements yet."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchHistorySection;