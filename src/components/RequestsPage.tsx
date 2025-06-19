import React, { useState } from 'react';
import { Inbox, Send, Users } from 'lucide-react';
import { useGameRequests } from '../hooks/useGameRequests';
import { AppPage } from '../App';
import GlobalHeader from './layout/GlobalHeader';
import RequestCard from './RequestCard';
import Button from './ui/Button';

interface RequestsPageProps {
  onNavigate: (page: AppPage) => void;
}

const RequestsPage: React.FC<RequestsPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  const { 
    receivedRequests, 
    sentRequests, 
    loading, 
    error, 
    updateRequestStatus 
  } = useGameRequests();

  const handleAccept = async (requestId: string) => {
    setUpdatingRequestId(requestId);
    await updateRequestStatus(requestId, 'accepted');
    setUpdatingRequestId(null);
  };

  const handleDecline = async (requestId: string) => {
    setUpdatingRequestId(requestId);
    await updateRequestStatus(requestId, 'declined');
    setUpdatingRequestId(null);
  };

  const handleCancel = async (requestId: string) => {
    setUpdatingRequestId(requestId);
    await updateRequestStatus(requestId, 'cancelled');
    setUpdatingRequestId(null);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-grow space-y-2">
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                  <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Requests</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      );
    }

    const requests = activeTab === 'received' ? receivedRequests : sentRequests;

    if (requests.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {activeTab === 'received' ? (
              <Inbox className="w-8 h-8 text-gray-400" />
            ) : (
              <Send className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {activeTab === 'received' ? 'Received' : 'Sent'} Requests
          </h3>
          <p className="text-gray-600 mb-4">
            {activeTab === 'received' 
              ? "You haven't received any game requests yet."
              : "You haven't sent any game requests yet."
            }
          </p>
          <Button variant="primary" onClick={() => onNavigate('find-players')}>
            Find Players
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {requests.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            type={activeTab}
            onAccept={activeTab === 'received' ? handleAccept : undefined}
            onDecline={activeTab === 'received' ? handleDecline : undefined}
            onCancel={activeTab === 'sent' ? handleCancel : undefined}
            isUpdating={updatingRequestId === request.id}
          />
        ))}
      </div>
    );
  };

  const pendingReceivedCount = receivedRequests.filter(r => r.status === 'pending').length;
  const pendingSentCount = sentRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalHeader currentPage="requests" onNavigate={onNavigate} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Game Requests</h1>
          <p className="text-gray-600">
            Manage your incoming and outgoing requests to play with other athletes.
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('received')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'received'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Inbox size={16} />
                  <span>Received</span>
                  {pendingReceivedCount > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {pendingReceivedCount}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'sent'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Send size={16} />
                  <span>Sent</span>
                  {pendingSentCount > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {pendingSentCount}
                    </span>
                  )}
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RequestsPage;