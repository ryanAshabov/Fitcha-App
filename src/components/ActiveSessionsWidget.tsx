import React, { useState } from 'react';
import { Users, Clock, MapPin, MessageCircle } from 'lucide-react';
import { useGameSessions } from '../hooks/useGameSessions';
import GameSessionModal from './GameSessionModal';
import Button from './ui/Button';

const ActiveSessionsWidget: React.FC = () => {
  const { activeSessions, loading, error } = useGameSessions();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_acceptance':
        return 'bg-yellow-100 text-yellow-800';
      case 'court_selection':
        return 'bg-blue-100 text-blue-800';
      case 'pending_payment':
        return 'bg-orange-100 text-orange-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Active Game Sessions</h4>
        <div className="space-y-3">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Active Game Sessions</h4>
        <p className="text-sm text-red-600">Error loading sessions: {error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Active Game Sessions</h4>
        
        {activeSessions.length > 0 ? (
          <div className="space-y-3">
            {activeSessions.slice(0, 3).map((session) => (
              <div
                key={session.id}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedSessionId(session.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">
                      vs {session.other_user_name}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                    {session.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center space-x-3">
                    <span>{session.sport}</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDateTime(session.proposed_datetime)}</span>
                    </div>
                  </div>
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            ))}
            
            {activeSessions.length > 3 && (
              <Button variant="secondary" className="w-full text-sm">
                View All Sessions ({activeSessions.length})
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No active game sessions</p>
            <p className="text-xs text-gray-500 mt-1">
              Start a session with another player to see it here
            </p>
          </div>
        )}
      </div>

      {/* Game Session Modal */}
      {selectedSessionId && (
        <GameSessionModal
          isOpen={!!selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
          sessionId={selectedSessionId}
          onSessionUpdate={() => {
            // Refresh sessions when updated
            window.location.reload();
          }}
        />
      )}
    </>
  );
};

export default ActiveSessionsWidget;