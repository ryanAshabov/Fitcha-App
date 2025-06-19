import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, MapPin, DollarSign, Clock, Users, Send } from 'lucide-react';
import { GameSession, SessionChatMessage, CourtSuggestion } from '../types/gameSession';
import { gameSessionService } from '../services/gameSessionService';
import { useAuth } from '../hooks/useAuth';
import Button from './ui/Button';

interface GameSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onSessionUpdate?: () => void;
}

const GameSessionModal: React.FC<GameSessionModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  onSessionUpdate
}) => {
  const [session, setSession] = useState<GameSession | null>(null);
  const [messages, setMessages] = useState<SessionChatMessage[]>([]);
  const [courtSuggestions, setCourtSuggestions] = useState<CourtSuggestion[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchSessionData();
      setupRealtimeSubscriptions();
    }
  }, [isOpen, sessionId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSessionData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [sessionResult, messagesResult] = await Promise.all([
        gameSessionService.getSession(sessionId),
        gameSessionService.getSessionMessages(sessionId)
      ]);

      if (sessionResult.error) {
        throw new Error(sessionResult.error.message);
      }
      if (messagesResult.error) {
        throw new Error(messagesResult.error.message);
      }

      setSession(sessionResult.data);
      setMessages(messagesResult.data || []);

      // Fetch court suggestions if in court selection phase
      if (sessionResult.data?.status === 'court_selection') {
        const courtsResult = await gameSessionService.suggestCourts(sessionId);
        if (!courtsResult.error) {
          setCourtSuggestions(courtsResult.data || []);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to new messages
    const messageSubscription = gameSessionService.subscribeToSessionMessages(
      sessionId,
      (newMessage) => {
        // Only add message if it's not from the current user (to avoid duplicates from optimistic updates)
        if (newMessage.sender_id !== user?.id) {
          setMessages(prev => [...prev, newMessage]);
        }
      }
    );

    // Subscribe to session updates
    const sessionSubscription = gameSessionService.subscribeToSessionUpdates(
      sessionId,
      (updatedSession) => {
        setSession(updatedSession);
        if (onSessionUpdate) {
          onSessionUpdate();
        }
      }
    );

    return () => {
      messageSubscription.unsubscribe();
      sessionSubscription.unsubscribe();
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !session || sendingMessage) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately
    setSendingMessage(true);

    // Optimistically add message to local state
    const optimisticMessage: SessionChatMessage = {
      id: Date.now(), // Temporary ID
      session_id: sessionId,
      sender_id: user!.id,
      message: messageText,
      message_type: 'text',
      metadata: {},
      created_at: new Date().toISOString(),
      sender_name: `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim(),
      sender_avatar: user?.user_metadata?.avatar_url
    };

    setMessages(prev => [...prev, optimisticMessage]);

    // Send message to backend
    const result = await gameSessionService.sendMessage({
      session_id: sessionId,
      message: messageText
    });

    if (result.error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setError(result.error.message);
      setNewMessage(messageText); // Restore message text
    } else if (result.data) {
      // Replace optimistic message with real message from server
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticMessage.id ? result.data! : msg
        )
      );
    }

    setSendingMessage(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAcceptSession = async () => {
    if (!session) return;

    const result = await gameSessionService.updateSession(sessionId, {
      status: 'court_selection'
    });

    if (result.error) {
      setError(result.error.message);
    } else {
      // Fetch court suggestions
      const courtsResult = await gameSessionService.suggestCourts(sessionId);
      if (!courtsResult.error) {
        setCourtSuggestions(courtsResult.data || []);
      }
    }
  };

  const handleSelectCourt = async (court: CourtSuggestion) => {
    if (!session) return;

    const result = await gameSessionService.updateSession(sessionId, {
      status: 'pending_payment',
      selected_court_id: court.court_id,
      total_cost: court.hourly_price,
      payment_option: 'split_50_50' // Default to split payment
    });

    if (result.error) {
      setError(result.error.message);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending_acceptance':
        return { text: 'Waiting for Response', color: 'bg-yellow-100 text-yellow-800' };
      case 'court_selection':
        return { text: 'Choosing Court', color: 'bg-blue-100 text-blue-800' };
      case 'pending_payment':
        return { text: 'Payment Required', color: 'bg-orange-100 text-orange-800' };
      case 'confirmed':
        return { text: 'Confirmed', color: 'bg-green-100 text-green-800' };
      default:
        return { text: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Game Session</h2>
            </div>
            {session && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusDisplay(session.status).color}`}>
                {getStatusDisplay(session.status).text}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading session...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <Button variant="primary" onClick={fetchSessionData}>
              Try Again
            </Button>
          </div>
        ) : session ? (
          <div className="flex h-[600px]">
            {/* Left Panel - Session Details */}
            <div className="w-1/3 border-r bg-gray-50 p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Game Details */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Game Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Sport:</span>
                      <span>{session.sport}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>{formatDateTime(session.proposed_datetime)}</span>
                    </div>
                    {session.court_name && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{session.court_name}</span>
                      </div>
                    )}
                    {session.total_cost && (
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span>${session.total_cost}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {session.status === 'pending_acceptance' && session.invitee_id === user?.id && (
                  <div className="space-y-2">
                    <Button
                      variant="primary"
                      onClick={handleAcceptSession}
                      className="w-full"
                    >
                      Accept Invitation
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => gameSessionService.updateSession(sessionId, { status: 'cancelled' })}
                      className="w-full"
                    >
                      Decline
                    </Button>
                  </div>
                )}

                {/* Court Suggestions */}
                {session.status === 'court_selection' && courtSuggestions.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Suggested Courts</h3>
                    <div className="space-y-2">
                      {courtSuggestions.slice(0, 5).map((court) => (
                        <div
                          key={court.court_id}
                          className="p-3 border border-gray-200 rounded-lg hover:bg-white cursor-pointer transition-colors"
                          onClick={() => handleSelectCourt(court)}
                        >
                          <div className="font-medium text-sm">{court.court_name}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            ${court.hourly_price}/hr • {court.distance_km.toFixed(1)}km away
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Chat */}
            <div className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_id === user?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs mt-1 opacity-75">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={sendingMessage}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <Button
                    variant="primary"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="px-4 py-2"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default GameSessionModal;