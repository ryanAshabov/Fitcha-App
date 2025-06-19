import React, { useState } from 'react';
import { X, Calendar, Users, MapPin } from 'lucide-react';
import { Profile } from '../types/profile';
import { gameSessionService } from '../services/gameSessionService';
import { AVAILABLE_SPORTS } from '../types/profile';
import Button from './ui/Button';
import Input from './ui/Input';

interface MatchmakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: Profile;
  onSessionCreated: (sessionId: string) => void;
}

const MatchmakingModal: React.FC<MatchmakingModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  onSessionCreated
}) => {
  const [sport, setSport] = useState(targetUser?.sports?.[0]?.sport || '');
  const [proposedDateTime, setProposedDateTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!targetUser || !sport || !proposedDateTime || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    const sessionData = {
      invitee_id: targetUser.user_id,
      sport,
      proposed_datetime: proposedDateTime
    };

    const result = await gameSessionService.createSession(sessionData);

    if (result.error) {
      setError(result.error.message);
    } else if (result.data) {
      onSessionCreated(result.data.id);
      onClose();
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSport(targetUser?.sports?.[0]?.sport || '');
      setProposedDateTime('');
      setError('');
      onClose();
    }
  };

  if (!isOpen || !targetUser) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Start a Game Session</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Target User Info */}
          <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {targetUser.avatar_url ? (
                <img
                  src={targetUser.avatar_url}
                  alt={`${targetUser.first_name} ${targetUser.last_name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-100">
                  <span className="text-sm font-bold text-blue-600">
                    {targetUser.first_name.charAt(0)}{targetUser.last_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {targetUser.first_name} {targetUser.last_name}
              </p>
              {targetUser.location && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span>{targetUser.location}</span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Sport Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sport
            </label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a sport</option>
              {AVAILABLE_SPORTS.map(sportOption => (
                <option key={sportOption} value={sportOption}>{sportOption}</option>
              ))}
            </select>
          </div>

          {/* Proposed Date/Time */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proposed Date & Time
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={proposedDateTime}
                onChange={(e) => setProposedDateTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                required
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Users className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">How it works:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Send your game invitation</li>
                  <li>Chat to choose a court together</li>
                  <li>Split payment and confirm booking</li>
                  <li>Play and rate your experience</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !sport || !proposedDateTime}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <Users size={16} />
              <span>{isSubmitting ? 'Creating...' : 'Start Session'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MatchmakingModal;