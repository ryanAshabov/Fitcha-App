import React, { useState, useRef, useEffect } from 'react';
import { Search, Home, Users, Calendar, Inbox, User, LogOut } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { useGameRequests } from '../hooks/useGameRequests';
import { AppPage } from '../App';
import Logo from './ui/Logo';
import NotificationCenter from './NotificationCenter';

interface PersistentHeaderProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
}

const PersistentHeader: React.FC<PersistentHeaderProps> = ({ currentPage, onNavigate }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { pendingCount } = useGameRequests();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const firstName = user?.user_metadata?.first_name || 'User';
  const lastName = user?.user_metadata?.last_name || '';

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
      key: 'requests' as AppPage,
      icon: Inbox,
      label: 'Requests',
      active: currentPage === 'requests',
      badge: pendingCount > 0 ? pendingCount : undefined
    }
  ];

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section - Logo */}
          <div className="flex items-center">
            <Logo size="small" variant="full" />
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
                  <span className="mt-1">{item.label}</span>
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Notifications */}
            <div className="px-2">
              <NotificationCenter />
            </div>

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
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                  <div className="p-3 border-b border-gray-200">
                    <p className="font-medium text-gray-900">{firstName} {lastName}</p>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onNavigate('profile');
                        setShowProfileDropdown(false);
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User size={16} />
                      <span>View Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setShowProfileDropdown(false);
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
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

export default PersistentHeader;