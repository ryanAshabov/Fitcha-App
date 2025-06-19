import React from 'react';
import { MapPin, DollarSign, Users, Calendar, Trophy } from 'lucide-react';
import { useFeed } from '../hooks/useFeed';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { AppPage } from '../App';
import GlobalHeader from './layout/GlobalHeader';
import CreatePostComponent from './CreatePostComponent';
import PostCard from './PostCard';
import ActiveSessionsWidget from './ActiveSessionsWidget';
import FriendRequestsWidget from './FriendRequestsWidget';
import Button from './ui/Button';

interface SocialFeedPageProps {
  onNavigate: (page: AppPage) => void;
  onViewProfile: (userId: string) => void;
  onViewCourt: (courtId: string) => void;
}

const SocialFeedPage: React.FC<SocialFeedPageProps> = ({ 
  onNavigate, 
  onViewProfile,
  onViewCourt 
}) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { posts, suggestedPlayers, featuredCourts, loading, createPost, deletePost } = useFeed();

  const firstName = user?.user_metadata?.first_name || 'User';
  const lastName = user?.user_metadata?.last_name || '';

  const handleCreatePost = async (content: string, imageUrl?: string) => {
    return await createPost(content, imageUrl);
  };

  const handleDeletePost = async (postId: string) => {
    const result = await deletePost(postId);
    if (!result.success) {
      alert('Failed to delete post: ' + result.error);
    }
  };

  const renderLeftColumn = () => (
    <div className="space-y-6">
      {/* User Identity Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={`${firstName} ${lastName}`}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="text-xl font-bold text-blue-600">
                {firstName.charAt(0)}{lastName.charAt(0)}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">
            {firstName} {lastName}
          </h3>
          {profile?.location && (
            <p className="text-sm text-gray-600 mb-3">{profile.location}</p>
          )}
          {profile?.sports && profile.sports.length > 0 && (
            <div className="mb-4">
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                <Trophy className="w-3 h-3 mr-1" />
                {profile.sports[0].sport}
              </span>
            </div>
          )}
          <Button
            variant="secondary"
            onClick={() => onNavigate('profile')}
            className="w-full text-sm"
          >
            View my profile
          </Button>
        </div>
      </div>

      {/* Friend Requests Widget */}
      <FriendRequestsWidget />

      {/* Active Game Sessions */}
      <ActiveSessionsWidget />

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
        <div className="space-y-3">
          <button
            onClick={() => onNavigate('requests')}
            className="flex items-center space-x-3 w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-700">My Requests</span>
          </button>
          <button
            onClick={() => onNavigate('book-court')}
            className="flex items-center space-x-3 w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-700">My Bookings</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderRightColumn = () => (
    <div className="space-y-6">
      {/* Players You May Know */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Players you may know</h4>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-grow space-y-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : suggestedPlayers.length > 0 ? (
          <div className="space-y-3">
            {suggestedPlayers.map((player) => (
              <div key={player.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => onViewProfile(player.user_id)}
                    className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                  >
                    {player.avatar_url ? (
                      <img
                        src={player.avatar_url}
                        alt={`${player.first_name} ${player.last_name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-100">
                        <span className="text-sm font-bold text-blue-600">
                          {player.first_name.charAt(0)}{player.last_name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </button>
                  <div>
                    <button
                      onClick={() => onViewProfile(player.user_id)}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors text-left"
                    >
                      {player.first_name} {player.last_name}
                    </button>
                    {player.location && (
                      <p className="text-xs text-gray-600">{player.location}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => onViewProfile(player.user_id)}
                  className="text-xs px-3 py-1"
                >
                  View
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No suggestions available</p>
        )}
      </div>

      {/* Featured Courts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Featured Courts</h4>
        {loading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3"></div>
              </div>
            ))}
          </div>
        ) : featuredCourts.length > 0 ? (
          <div className="space-y-4">
            {featuredCourts.map((court) => (
              <div key={court.id} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                <h5 className="font-medium text-gray-900 mb-1">{court.name}</h5>
                <div className="flex items-center space-x-2 text-xs text-gray-600 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {court.sport_type}
                  </span>
                  <span className="flex items-center">
                    <DollarSign className="w-3 h-3 mr-1" />
                    ${court.hourly_price}/hr
                  </span>
                </div>
                {court.location_address && (
                  <div className="flex items-center text-xs text-gray-600 mb-2">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span className="truncate">{court.location_address}</span>
                  </div>
                )}
                <Button
                  variant="primary"
                  onClick={() => onViewCourt(court.id)}
                  className="w-full text-xs py-1"
                >
                  View Details
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No featured courts available</p>
        )}
      </div>
    </div>
  );

  const renderMainFeed = () => (
    <div>
      {/* Create Post */}
      <CreatePostComponent onCreatePost={handleCreatePost} />

      {/* Feed Posts */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-grow space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4"></div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
              <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDeletePost={handleDeletePost}
              onViewProfile={onViewProfile}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Fitcha!</h3>
          <p className="text-gray-600 mb-6">
            Start following other athletes and sharing your journey to see posts in your feed.
          </p>
          <Button variant="primary" onClick={() => onNavigate('find-players')}>
            Find Players to Follow
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalHeader currentPage="home" onNavigate={onNavigate} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - User Identity & Quick Links */}
          <div className="lg:col-span-1">
            {renderLeftColumn()}
          </div>

          {/* Middle Column - Main Feed */}
          <div className="lg:col-span-2">
            {renderMainFeed()}
          </div>

          {/* Right Column - Discovery & Modules */}
          <div className="lg:col-span-1">
            {renderRightColumn()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SocialFeedPage;