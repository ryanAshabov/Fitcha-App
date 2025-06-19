import React, { useState } from 'react';
import { X, Award } from 'lucide-react';
import { ACHIEVEMENT_TYPES } from '../../types/athleticProfile';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface AddAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAchievement: (achievementData: any) => Promise<{ success: boolean; error?: string }>;
}

const AddAchievementModal: React.FC<AddAchievementModalProps> = ({
  isOpen,
  onClose,
  onAddAchievement
}) => {
  const [formData, setFormData] = useState({
    type: 'Certification' as const,
    title: '',
    organization: '',
    description: '',
    date_issued: '',
    expiry_date: '',
    credential_id: '',
    credential_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    const achievementData = {
      type: formData.type,
      title: formData.title,
      organization: formData.organization || undefined,
      description: formData.description || undefined,
      date_issued: formData.date_issued || undefined,
      expiry_date: formData.expiry_date || undefined,
      credential_id: formData.credential_id || undefined,
      credential_url: formData.credential_url || undefined
    };

    const result = await onAddAchievement(achievementData);

    if (result.success) {
      // Reset form
      setFormData({
        type: 'Certification',
        title: '',
        organization: '',
        description: '',
        date_issued: '',
        expiry_date: '',
        credential_id: '',
        credential_url: ''
      });
      onClose();
    } else {
      setError(result.error || 'Failed to add achievement');
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        type: 'Certification',
        title: '',
        organization: '',
        description: '',
        date_issued: '',
        expiry_date: '',
        credential_id: '',
        credential_url: ''
      });
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-yellow-600" />
            <h2 className="text-xl font-semibold text-gray-900">Add Achievement</h2>
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

          {/* Type Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {ACHIEVEMENT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="mb-4">
            <Input
              label="Title *"
              type="text"
              value={formData.title}
              onChange={(value) => setFormData(prev => ({ ...prev, title: value }))}
              placeholder="e.g., Certified Personal Trainer, Tennis Championship Winner"
            />
          </div>

          {/* Organization */}
          <div className="mb-4">
            <Input
              label="Organization"
              type="text"
              value={formData.organization}
              onChange={(value) => setFormData(prev => ({ ...prev, organization: value }))}
              placeholder="e.g., ISSA, Tennis Association"
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the achievement..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Issued
              </label>
              <input
                type="date"
                value={formData.date_issued}
                onChange={(e) => setFormData(prev => ({ ...prev, date_issued: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                min={formData.date_issued || undefined}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Credential Details */}
          <div className="mb-4">
            <Input
              label="Credential ID"
              type="text"
              value={formData.credential_id}
              onChange={(value) => setFormData(prev => ({ ...prev, credential_id: value }))}
              placeholder="Certificate or license number"
            />
          </div>

          <div className="mb-6">
            <Input
              label="Credential URL"
              type="url"
              value={formData.credential_url}
              onChange={(value) => setFormData(prev => ({ ...prev, credential_url: value }))}
              placeholder="https://example.com/verify-certificate"
            />
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
              disabled={isSubmitting || !formData.title}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <Award size={16} />
              <span>{isSubmitting ? 'Adding...' : 'Add Achievement'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAchievementModal;