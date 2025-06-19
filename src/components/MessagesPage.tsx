import React, { useState } from 'react';
import { MessageCircle, Send, ArrowLeft } from 'lucide-react';
import { useMessaging, useConversation } from '../hooks/useMessaging';
import { useAuth } from '../hooks/useAuth';
import { Conversation } from '../types/messaging';
import Button from './ui/Button';

const MessagesPage: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const { conversations, loading: conversationsLoading, error: conversationsError } = useMessaging();
  const { messages, loading: messagesLoading, sendMessage } = useConversation(selectedConversation?.conversation_id || null);
  const { user } = useAuth();

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately

    const result = await sendMessage(messageText);

    if (!result.success) {
      setNewMessage(messageText); // Restore message text on error
      alert('Failed to send message: ' + result.error);
    }

    setSendingMessage(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const formatLastMessageTime = (dateTimeString: string) => {
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

  const renderConversationsList = () => {
    if (conversationsLoading) {
      return (
        <div className="p-4">
          <div className="space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center space-x-3 p-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-grow space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (conversationsError) {
      return (
        <div className="p-4 text-center">
          <p className="text-red-600 text-sm">Error loading conversations</p>
        </div>
      );
    }

    if (conversations.length === 0) {
      return (
        <div className="p-8 text-center">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
          <p className="text-gray-600 text-sm">
            Start a conversation by messaging someone from their profile.
          </p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-gray-200">
        {conversations.map((conversation) => (
          <button
            key={conversation.conversation_id}
            onClick={() => setSelectedConversation(conversation)}
            className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
              selectedConversation?.conversation_id === conversation.conversation_id ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                {conversation.other_user_avatar ? (
                  <img
                    src={conversation.other_user_avatar}
                    alt={conversation.other_user_name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100">
                    <span className="text-sm font-bold text-blue-600">
                      {(conversation.other_user_name || 'U').charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Conversation Info */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-sm font-medium truncate ${
                    conversation.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {conversation.other_user_name || 'Unknown User'}
                  </h3>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatLastMessageTime(conversation.last_message_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-sm truncate ${
                    conversation.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
                  }`}>
                    {conversation.last_message_content || 'No messages yet'}
                  </p>
                  {conversation.unread_count > 0 && (
                    <span className="bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 ml-2">
                      {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  const renderChatWindow = () => {
    if (!selectedConversation) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
            <p className="text-gray-600">Choose a conversation from the list to start messaging.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedConversation(null)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
              {selectedConversation.other_user_avatar ? (
                <img
                  src={selectedConversation.other_user_avatar}
                  alt={selectedConversation.other_user_name || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-100">
                  <span className="text-sm font-bold text-blue-600">
                    {(selectedConversation.other_user_name || 'U').charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{selectedConversation.other_user_name || 'Unknown User'}</h3>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messagesLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div className="max-w-xs">
                    <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.message_id}
                className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender_id === user?.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
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
    );
  };

  return (
    <div className="h-screen bg-white flex">
      {/* Conversations List */}
      <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${
        selectedConversation ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {renderConversationsList()}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`flex-1 ${selectedConversation ? 'flex' : 'hidden md:flex'} flex-col`}>
        {renderChatWindow()}
      </div>
    </div>
  );
};

export default MessagesPage;