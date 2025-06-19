import React from 'react';
import { Trophy, Users, Calendar, Target, LogOut, User, Inbox, MapPin, Clock } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { useDashboardData } from '../hooks/useDashboardData';
import { AppPage } from '../App';
import Button from './ui/Button';
import Logo from './ui/Logo';
import NotificationCenter from './NotificationCenter';

interface DashboardProps {
  onNavigate: (page: AppPage) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { pendingRequestsCount, nextBooking, userStats, loading } = useDashboardData();

  const handleSignOut = async () => {
    await authService.signOut();
  };

  const firstName = user?.user_metadata?.first_name || 'User';
  const lastName = user?.user_metadata?.last_name || '';

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="small" variant="full" />
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {firstName} {lastName}
              </span>
              
              {/* Notification Center */}
              <NotificationCenter />
              
              <Button
                variant="secondary"
                onClick={() => onNavigate('requests')}
                className="flex items-center space-x-2 relative"
              >
                <Inbox size={16} />
                <span>Requests</span>
                {pendingRequestsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                  </span>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={() => onNavigate('profile')}
                className="flex items-center space-x-2"
              >
                <User size={16} />
                <span>Profile</span>
              </Button>
              <Button
                variant="secondary"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Fitcha, {firstName}!
          </h1>
          <p className="text-gray-600">
            Your athletic journey starts here. Connect, compete, and grow with the sports community.
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Find Players Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Find Players</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Connect with athletes in your area and find your perfect training partners.
            </p>
            <Button 
              variant="primary" 
              className="w-full"
              onClick={() => onNavigate('find-players')}
            >
              Find Players
            </Button>
          </div>

          {/* Book a Court Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Book a Court</h3>
            </div>
            
            {loading ? (
              <div className="mb-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            ) : nextBooking ? (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-900 mb-1">Next booking:</p>
                <p className="text-sm text-gray-700 mb-1">{nextBooking.court_name}</p>
                <div className="flex items-center text-xs text-gray-600">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{formatDateTime(nextBooking.start_time)}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 mb-4">
                Discover and book sports facilities in your area for your next game or training session.
              </p>
            )}
            
            <Button 
              variant="primary" 
              className="w-full"
              onClick={() => onNavigate('book-court')}
            >
              {nextBooking ? 'View Bookings' : 'Book a Court'}
            </Button>
          </div>

          {/* Game Requests Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Inbox className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Game Requests</h3>
            </div>
            
            {loading ? (
              <div className="mb-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
              </div>
            ) : pendingRequestsCount > 0 ? (
              <p className="text-gray-600 mb-4">
                You have <span className="font-semibold text-orange-600">{pendingRequestsCount}</span> pending request{pendingRequestsCount !== 1 ? 's' : ''} waiting for your response.
              </p>
            ) : (
              <p className="text-gray-600 mb-4">
                Manage your incoming and outgoing requests to play with other athletes.
              </p>
            )}
            
            <Button 
              variant="primary" 
              className="w-full relative"
              onClick={() => onNavigate('requests')}
            >
              View Requests
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Athletic Profile Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Athletic Profile</h3>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="text-center">
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {userStats.courts_booked}
                </div>
                <div className="text-sm text-gray-600">Courts Booked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {userStats.games_played}
                </div>
                <div className="text-sm text-gray-600">Games Played</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {userStats.connections}
                </div>
                <div className="text-sm text-gray-600">Connections</div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;