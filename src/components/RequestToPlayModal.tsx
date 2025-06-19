import React, { useState } from 'react';
import { X, Send, Calendar } from 'lucide-react';
import { Profile } from '../types/profile';
import { gameRequestService } from '../services/gameRequestService';
import Button from './ui/Button';

interface RequestToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiverProfile: Profile;
  onSuccess: () => void;
}

const RequestToPlayModal: React.FC<RequestToPlayModalProps> = ({
  isOpen,
  onClose,
  receiverProfile,
  onSuccess
}) => {
  const [message, setMessage] = useState('');
  const [proposedDateTime, setProposedDateTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    const requestData = {
      receiver_id: receiverProfile.user_id,
      message: message.trim() || undefined,
      proposed_datetime: proposedDateTime || undefined
    };

    const result = await gameRequestService.createRequest(requestData);

    if (result.error) {
      setError(result.error.message);
    } else {
      // Reset form
      setMessage('');
      setProposedDateTime('');
      onSuccess();
      onClose();
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setMessage('');
      setProposedDateTime('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Request to Play</h2>
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
          {/* Receiver Info */}
          <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {receiverProfile.avatar_url ? (
                <img
                  src={receiverProfile.avatar_url}
                  alt={`${receiverProfile.first_name || ''} ${receiverProfile.last_name || ''}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-100">
                  <span className="text-sm font-bold text-blue-600">
                    {(receiverProfile.first_name || '').charAt(0)}{(receiverProfile.last_name || '').charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {receiverProfile.first_name || ''} {receiverProfile.last_name || ''}
              </p>
              {receiverProfile.location && (
                <p className="text-sm text-gray-600">{receiverProfile.location}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Message */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hey! I saw your profile and would love to play together. Are you available for a game?"
              rows={4}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/500 characters
            </p>
          </div>

          {/* Proposed Date/Time */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suggested Date & Time (Optional)
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={proposedDateTime}
                onChange={(e) => setProposedDateTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <Send size={16} />
              <span>{isSubmitting ? 'Sending...' : 'Send Request'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestToPlayModal;