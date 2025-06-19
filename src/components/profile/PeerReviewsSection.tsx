import React, { useState } from 'react';
import { Star, MessageSquare, Calendar, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { usePeerReviews } from '../../hooks/useActivityStats';
import Button from '../ui/Button';

interface PeerReviewsSectionProps {
  userId?: string;
  isOwnProfile: boolean;
}

const PeerReviewsSection: React.FC<PeerReviewsSectionProps> = ({ 
  userId, 
  isOwnProfile 
}) => {
  const [showAll, setShowAll] = useState(false);
  const { reviews, loading, error } = usePeerReviews(userId, showAll ? 50 : 5);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={`${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-grow space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Peer Reviews & Ratings</h2>
        <p className="text-red-600 text-sm">Error loading reviews: {error}</p>
      </div>
    );
  }

  const averageRating = getAverageRating();
  const distribution = getRatingDistribution();

  return (
    <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
      <div className="flex items-center space-x-2 mb-6">
        <MessageSquare className="w-5 h-5 text-green-600" />
        <h2 className="text-xl font-bold text-gray-900">Peer Reviews & Ratings</h2>
      </div>

      {reviews.length > 0 ? (
        <>
          {/* Rating Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Average Rating */}
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {averageRating.toFixed(1)}
                  </span>
                  {renderStars(Math.round(averageRating))}
                </div>
                <p className="text-gray-600">
                  Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 w-8">{rating}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{
                          width: `${reviews.length > 0 ? (distribution[rating as keyof typeof distribution] / reviews.length) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8">
                      {distribution[rating as keyof typeof distribution]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.slice(0, showAll ? reviews.length : 5).map((review) => (
              <div
                key={review.review_id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-3">
                  {/* Reviewer Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {review.reviewer_avatar ? (
                      <img
                        src={review.reviewer_avatar}
                        alt={review.reviewer_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-100">
                        <span className="text-sm font-bold text-blue-600">
                          {review.reviewer_name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Review Content */}
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {review.reviewer_name}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          {renderStars(review.rating)}
                          <span className="text-sm text-gray-600">
                            {review.rating}/5
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(review.review_date)}</span>
                        </div>
                      </div>
                    </div>

                    {review.comment && (
                      <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                        "{review.comment}"
                      </p>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{review.court_context}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Played on {formatDate(review.booking_date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Show More/Less Button */}
          {reviews.length > 5 && (
            <div className="mt-6 text-center">
              <Button
                variant="secondary"
                onClick={() => setShowAll(!showAll)}
                className="flex items-center space-x-2"
              >
                {showAll ? (
                  <>
                    <ChevronUp size={16} />
                    <span>Show Less</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    <span>Show All {reviews.length} Reviews</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
          <p className="text-gray-600 mb-6">
            {isOwnProfile 
              ? "Play games with other athletes to receive reviews and build your trust score."
              : "This user hasn't received any reviews yet."
            }
          </p>
          {isOwnProfile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-start space-x-3">
                <Star className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Build Your Reputation</p>
                  <p>Reviews from game partners help other athletes know they can trust you. Start playing to earn your first reviews!</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PeerReviewsSection;