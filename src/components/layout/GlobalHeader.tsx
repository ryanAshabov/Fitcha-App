import React, { useState, useRef, useEffect } from 'react';
import { Search, Home, Users, Calendar, Inbox, Bell, MessageCircle, User, LogOut, Settings, Edit } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useGameRequests } from '../../hooks/useGameRequests';
import { useNotifications } from '../../hooks/useNotifications';
import { useMessaging } from '../../hooks/useMessaging';
import { authService } from '../../services/authService';
import { AppPage } from '../../App';
import Logo from '../ui/Logo';

interface GlobalHeaderProps {
  currentPage?: AppPage;
  onNavigate: (page: AppPage) => void;
}

// Skeleton component for loading state
const HeaderSkeleton: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section - Logo */}
          <div className="flex items-center">
            <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Center Section - Search Bar */}
          <div className="flex-1 max-w-lg mx-8">
            <div className="w-full h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          {/* Right Section - Navigation & Profile */}
          <div className="flex items-center space-x-1">
            {/* Navigation skeleton */}
            {[...Array(5)].map((_, index) => (
              <div key={index} className="w-16 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
            
            {/* Profile skeleton */}
            <div className="w-20 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    </header>
  );
};

const GlobalHeader: React.FC<GlobalHeaderProps> = ({ currentPage, onNavigate }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get data from hooks with safe defaults
  const { user, loading: userLoading } = useAuth();
  const { pendingCount = 0, loading: requestsLoading } = useGameRequests();
  const { unreadCount = 0, loading: notificationsLoading } = useNotifications();
  const { unreadCount: messageUnreadCount = 0, loading: messagesLoading } = useMessaging();

  // Master loading state - wait for all critical data
  const isLoading = userLoading || requestsLoading || notificationsLoading || messagesLoading;

  // Safe user data extraction with explicit null checks and fallbacks
  let firstName = '';
  let lastName = '';
  let userEmail = '';

  if (user) {
    firstName = user.user_metadata?.first_name || user.email?.split('@')[0] || 'User';
    lastName = user.user_metadata?.last_name || '';
    userEmail = user.email || '';
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await authService.signOut();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement global search functionality
    console.log('Search for:', searchQuery);
  };

  // Show skeleton while loading
  if (isLoading) {
    return <HeaderSkeleton />;
  }

  // If user is not authenticated after loading, show minimal header
  if (!user) {
    return (
      <header className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo size="small" variant="full" />
            <div className="text-sm text-gray-600">Please sign in</div>
          </div>
        </div>
      </header>
    );
  }

  const navigationItems = [
    {
      key: 'home' as AppPage,
      icon: Home,
      label: 'Home',
      active: currentPage === 'home'
    },
    {
      key: 'find-players' as AppPage,
      icon: Users,
      label: 'Find Players',
      active: currentPage === 'find-players'
    },
    {
      key: 'book-court' as AppPage,
      icon: Calendar,
      label: 'Book a Court',
      active: currentPage === 'book-court'
    },
    {
      key: 'messages' as AppPage,
      icon: MessageCircle,
      label: 'Messages',
      active: currentPage === 'messages',
      badge: messageUnreadCount > 0 ? messageUnreadCount : undefined
    },
    {
      key: 'requests' as AppPage,
      icon: Inbox,
      label: 'Requests',
      active: currentPage === 'requests',
      badge: pendingCount > 0 ? pendingCount : undefined
    }
  ];

  return (
    <header className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section - Logo */}
          <div className="flex items-center">
            <button onClick={() => onNavigate('home')} className="flex items-center">
              <Logo size="small" variant="full" />
            </button>
          </div>

          {/* Center Section - Search Bar */}
          <div className="flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search players and content..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                />
              </div>
            </form>
          </div>

          {/* Right Section - Navigation & Profile */}
          <div className="flex items-center space-x-1">
            {/* Navigation Links */}
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  className={`relative flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    item.active
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent size={20} />
                  <span className="mt-1 hidden sm:block">{item.label}</span>
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">
                    {firstName.charAt(0)}{lastName.charAt(0)}
                  </span>
                </div>
                <span className="text-sm font-medium hidden md:block">Me</span>
              </button>

              {/* Dropdown Menu */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <p className="font-medium text-gray-900">{firstName} {lastName}</p>
                    <p className="text-sm text-gray-600">{userEmail}</p>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => {
                        onNavigate('profile');
                        setShowProfileDropdown(false);
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User size={16} />
                      <span>View My Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('profile');
                        setShowProfileDropdown(false);
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Edit size={16} />
                      <span>Edit Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('profile');
                        setShowProfileDropdown(false);
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Settings size={16} />
                      <span>Account Settings</span>
                    </button>
                    <hr className="my-2" />
                    <button
                      onClick={() => {
                        handleSignOut();
                        setShowProfileDropdown(false);
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;