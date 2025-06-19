import React, { useState } from 'react';
import { Image, Send } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Button from './ui/Button';

interface CreatePostComponentProps {
  onCreatePost: (content: string, imageUrl?: string) => Promise<{ success: boolean; error?: string }>;
}

const CreatePostComponent: React.FC<CreatePostComponentProps> = ({ onCreatePost }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const firstName = user?.user_metadata?.first_name || 'User';
  const lastName = user?.user_metadata?.last_name || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    const result = await onCreatePost(content.trim());

    if (result.success) {
      setContent('');
    } else {
      setError(result.error || 'Failed to create post');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-4">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-lg font-bold text-blue-600">
                {firstName.charAt(0)}{lastName.charAt(0)}
              </span>
            </div>
          </div>

          {/* Post Input */}
          <div className="flex-grow">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening in your athletic journey?"
              rows={3}
              maxLength={500}
              className="w-full px-0 py-2 border-0 resize-none text-lg placeholder-gray-500 focus:outline-none focus:ring-0"
            />
            
            {error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                  disabled={isSubmitting}
                >
                  <Image size={20} />
                  <span className="text-sm font-medium">Photo</span>
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-500">
                  {content.length}/500
                </span>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!content.trim() || isSubmitting}
                  className="flex items-center space-x-2"
                >
                  <Send size={16} />
                  <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreatePostComponent;