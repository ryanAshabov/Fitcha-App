import React from 'react';
import { TrendingUp, Users, MapPin, Star, Trophy } from 'lucide-react';
import { ActivityStats } from '../../types/activityStats';
import { useActivityStats } from '../../hooks/useActivityStats';

interface ActivityStatsSectionProps {
  userId?: string;
  isOwnProfile: boolean;
}

const ActivityStatsSection: React.FC<ActivityStatsSectionProps> = ({ 
  userId, 
  isOwnProfile 
}) => {
  const { stats, loading, error } = useActivityStats(userId);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="text-center">
                <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Activity Stats</h2>
        <p className="text-red-600 text-sm">Error loading stats: {error}</p>
      </div>
    );
  }

  const getTrustScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 4.0) return 'text-blue-600';
    if (score >= 3.5) return 'text-yellow-600';
    if (score >= 3.0) return 'text-orange-600';
    return 'text-red-600';
  };

  const getTrustScoreLabel = (score: number) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 4.0) return 'Great';
    if (score >= 3.5) return 'Good';
    if (score >= 3.0) return 'Fair';
    if (score > 0) return 'Needs Improvement';
    return 'No Reviews Yet';
  };

  const statItems = [
    {
      icon: TrendingUp,
      value: stats.sessions_played,
      label: 'Sessions Played',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: Users,
      value: stats.unique_partners,
      label: 'Unique Partners',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: MapPin,
      value: stats.courts_visited,
      label: 'Courts Visited',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      icon: Star,
      value: stats.trust_score > 0 ? stats.trust_score.toFixed(1) : '—',
      label: 'Trust Score',
      color: getTrustScoreColor(stats.trust_score),
      bgColor: stats.trust_score > 0 ? 'bg-yellow-100' : 'bg-gray-100',
      subtitle: getTrustScoreLabel(stats.trust_score)
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
      <div className="flex items-center space-x-2 mb-6">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">Activity Overview</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {statItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div key={index} className="text-center">
              <div className={`w-12 h-12 ${item.bgColor} rounded-full flex items-center justify-center mx-auto mb-3`}>
                <IconComponent className={`w-6 h-6 ${item.color}`} />
              </div>
              <div className={`text-2xl font-bold ${item.color} mb-1`}>
                {item.value}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                {item.label}
              </div>
              {item.subtitle && (
                <div className="text-xs text-gray-500 mt-1">
                  {item.subtitle}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {stats.sessions_played === 0 && isOwnProfile && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Trophy className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Start Your Athletic Journey!</p>
              <p>Book your first court session and connect with other athletes to build your activity stats and trust score.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityStatsSection;