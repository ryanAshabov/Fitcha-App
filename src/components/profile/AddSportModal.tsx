import React, { useState } from 'react';
import { X, Trophy } from 'lucide-react';
import { AVAILABLE_SPORTS, SKILL_LEVELS, DOMINANT_HANDS } from '../../types/athleticProfile';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface AddSportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSport: (sportData: any) => Promise<{ success: boolean; error?: string }>;
}

const AddSportModal: React.FC<AddSportModalProps> = ({
  isOpen,
  onClose,
  onAddSport
}) => {
  const [formData, setFormData] = useState({
    sport_name: '',
    skill_level: 'Beginner' as const,
    preferred_role: '',
    dominant_hand: '' as any,
    years_experience: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sport_name || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    const sportData = {
      sport_name: formData.sport_name,
      skill_level: formData.skill_level,
      preferred_role: formData.preferred_role || undefined,
      dominant_hand: formData.dominant_hand || undefined,
      years_experience: formData.years_experience
    };

    const result = await onAddSport(sportData);

    if (result.success) {
      // Reset form
      setFormData({
        sport_name: '',
        skill_level: 'Beginner',
        preferred_role: '',
        dominant_hand: '',
        years_experience: 0
      });
      onClose();
    } else {
      setError(result.error || 'Failed to add sport');
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        sport_name: '',
        skill_level: 'Beginner',
        preferred_role: '',
        dominant_hand: '',
        years_experience: 0
      });
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
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Add Sport</h2>
          </div>
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
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Sport Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sport *
            </label>
            <select
              value={formData.sport_name}
              onChange={(e) => setFormData(prev => ({ ...prev, sport_name: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a sport</option>
              {AVAILABLE_SPORTS.map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </div>

          {/* Skill Level */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skill Level *
            </label>
            <select
              value={formData.skill_level}
              onChange={(e) => setFormData(prev => ({ ...prev, skill_level: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {SKILL_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          {/* Years of Experience */}
          <div className="mb-4">
            <Input
              label="Years of Experience"
              type="number"
              value={formData.years_experience.toString()}
              onChange={(value) => setFormData(prev => ({ ...prev, years_experience: parseInt(value) || 0 }))}
              placeholder="0"
            />
          </div>

          {/* Preferred Role */}
          <div className="mb-4">
            <Input
              label="Preferred Role (Optional)"
              type="text"
              value={formData.preferred_role}
              onChange={(value) => setFormData(prev => ({ ...prev, preferred_role: value }))}
              placeholder="e.g., Midfielder, Singles, Point Guard"
            />
          </div>

          {/* Dominant Hand */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dominant Hand (Optional)
            </label>
            <select
              value={formData.dominant_hand}
              onChange={(e) => setFormData(prev => ({ ...prev, dominant_hand: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select dominant hand</option>
              {DOMINANT_HANDS.map(hand => (
                <option key={hand} value={hand}>{hand}</option>
              ))}
            </select>
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
              disabled={isSubmitting || !formData.sport_name}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <Trophy size={16} />
              <span>{isSubmitting ? 'Adding...' : 'Add Sport'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSportModal;