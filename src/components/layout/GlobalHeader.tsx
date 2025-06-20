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

// Component to show a placeholder while data is loading
// This improves user experience by preventing layout shifts
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
          <div className="flex items-center space-x-2">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="w-16 h-12 bg-gray-200 rounded-lg animate-pulse hidden sm:block"></div>
            ))}
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

  // --- DATA FETCHING & STATE MANAGEMENT ---
  // We get data AND loading status from our custom hooks.
  // We also provide a safe default value (like 0) to prevent errors.
  const { user, loading: userLoading } = useAuth();
  const { pendingCount = 0, loading: requestsLoading } = useGameRequests();
  const { unreadCount = 0, loading: notificationsLoading } = useNotifications();
  const { unreadCount: messageUnreadCount = 0, loading: messagesLoading } = useMessaging();

  // This is our master loading state. The header is "loading" if ANY of its data is still loading.
  const isLoading = userLoading || requestsLoading || notificationsLoading || messagesLoading;
  
  // --- SAFE DATA ACCESS ---
  // Safely access user metadata with proper type checking to prevent runtime errors
  const safeUserMetadata = user?.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata : {};
  const firstName = safeUserMetadata.first_name || 'User';
  const lastName = safeUserMetadata.last_name || '';
  const userEmail = user?.email || '';

  // --- EVENT HANDLERS & EFFECTS ---
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
    setShowProfileDropdown(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search for:', searchQuery);
  };
  
  const handleDropdownNavigate = (page: AppPage) => {
    onNavigate(page);
    setShowProfileDropdown(false);
  };

  // --- DEFENSIVE RENDERING ---
  // This is the most important fix. We check the loading and user state BEFORE trying to render anything.
  if (isLoading) {
    return <HeaderSkeleton />;
  }

  // If loading is finished but there's no user, show a simple logged-out header.
  if (!user) {
    return (
      <header className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* <Logo size="small" variant="full" /> */} {/* علّق السطر القديم */}
  <div>FITCHA</div> {/* أضف هذا السطر الجديد */}
          </div>
        </div>
      </header>
    );
  }

  // Navigation items array for clean mapping
  const navigationItems = [
    { key: 'home' as AppPage, icon: Home, label: 'Home' },
    { key: 'find-players' as AppPage, icon: Users, label: 'Find Players' },
    { key: 'book-court' as AppPage, icon: Calendar, label: 'Book a Court' },
    { key: 'messages' as AppPage, icon: MessageCircle, label: 'Messages', badge: messageUnreadCount },
    { key: 'requests' as AppPage, icon: Inbox, label: 'Requests', badge: pendingCount },
  ];

  // --- MAIN RENDER ---
  // If we reach this point, we know that isLoading is false and user exists. It is now safe to render.
  return (
    <header className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center">
            <button onClick={() => onNavigate('home')} className="flex items-center">
              <Logo size="small" variant="full" />
            </button>
          </div>

          {/* Center Section */}
          <div className="flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search players and content..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              />
            </form>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentPage === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  className={`relative flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent size={20} />
                  <span className="mt-1 hidden sm:block">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

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

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <p className="font-medium text-gray-900 truncate">{firstName} {lastName}</p>
                    <p className="text-sm text-gray-600 truncate">{userEmail}</p>
                  </div>
                  <div className="py-2">
                    <button onClick={() => handleDropdownNavigate('profile')} className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <User size={16} />
                      <span>View Profile</span>
                    </button>
                    <button onClick={() => handleDropdownNavigate('profile-edit')} className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <Edit size={16} />
                      <span>Edit Profile</span>
                    </button>
                    <hr className="my-2" />
                    <button onClick={handleSignOut} className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
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