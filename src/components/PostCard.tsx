import React, { useState } from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal, Trash2 } from 'lucide-react';
import { Post } from '../types/post';
import { postService } from '../services/postService';
import { useAuth } from '../hooks/useAuth';

interface PostCardProps {
  post: Post;
  onDeletePost?: (postId: string) => void;
  onViewProfile?: (userId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onDeletePost, onViewProfile }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(post.user_has_liked || false);
  const [likeCount, setLikeCount] = useState(post.likes_count);
  const [isLiking, setIsLiking] = useState(false);
  const { user } = useAuth();
  
  const isOwnPost = user?.id === post.user_id;

  const formatRelativeTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d`;
    }
  };

  const handleDeletePost = () => {
    if (onDeletePost && isOwnPost) {
      onDeletePost(post.id);
    }
    setShowMenu(false);
  };

  const handleLikeToggle = async () => {
    if (isLiking) return;

    setIsLiking(true);
    
    // Optimistic update
    const newIsLiked = !isLiked;
    const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1;
    
    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);

    // Send to backend
    const result = await postService.togglePostLike(post.id);

    if (result.error) {
      // Revert optimistic update on error
      setIsLiked(!newIsLiked);
      setLikeCount(likeCount);
      console.error('Failed to toggle like:', result.error.message);
    } else if (result.data) {
      // Update with actual values from server
      setIsLiked(result.data.liked);
      setLikeCount(Number(result.data.like_count));
    }

    setIsLiking(false);
  };

  const handleProfileClick = () => {
    if (onViewProfile) {
      onViewProfile(post.user_id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Author Avatar - Clickable */}
          <button
            onClick={handleProfileClick}
            className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-blue-500 transition-all"
          >
            {post.author_avatar_url ? (
              <img
                src={post.author_avatar_url}
                alt={`${post.author_first_name} ${post.author_last_name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100">
                <span className="text-lg font-bold text-blue-600">
                  {post.author_first_name.charAt(0)}{post.author_last_name.charAt(0)}
                </span>
              </div>
            )}
          </button>

          {/* Author Info - Clickable */}
          <div>
            <button
              onClick={handleProfileClick}
              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left"
            >
              {post.author_first_name} {post.author_last_name}
            </button>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {post.author_location && (
                <>
                  <span>{post.author_location}</span>
                  <span>•</span>
                </>
              )}
              <span>{formatRelativeTime(post.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Post Menu */}
        {isOwnPost && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <MoreHorizontal size={20} />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={handleDeletePost}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                  <span>Delete post</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
        
        {post.image_url && (
          <div className="mt-4">
            <img
              src={post.image_url}
              alt="Post content"
              className="w-full rounded-lg max-h-96 object-cover"
            />
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-6">
          {/* Like Button */}
          <button 
            onClick={handleLikeToggle}
            disabled={isLiking}
            className={`flex items-center space-x-2 transition-colors ${
              isLiked 
                ? 'text-red-600 hover:text-red-700' 
                : 'text-gray-600 hover:text-red-600'
            } ${isLiking ? 'opacity-50' : ''}`}
          >
            <Heart 
              size={20} 
              className={isLiked ? 'fill-current' : ''} 
            />
            <span className="text-sm font-medium">
              {likeCount > 0 ? likeCount : 'Like'}
            </span>
          </button>

          {/* Comment Button - Placeholder for future implementation */}
          <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
            <MessageCircle size={20} />
            <span className="text-sm font-medium">
              {post.comments_count > 0 ? post.comments_count : 'Comment'}
            </span>
          </button>

          {/* Share Button - Placeholder for future implementation */}
          <button className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors">
            <Share size={20} />
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;