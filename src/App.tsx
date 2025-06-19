import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import MainLayout from './components/layout/MainLayout';
import SocialFeedPage from './components/SocialFeedPage';
import ProfileContainer from './components/ProfileContainer';
import FindPlayerPage from './components/FindPlayerPage';
import RequestsPage from './components/RequestsPage';
import CourtSearchPage from './components/CourtSearchPage';
import CourtDetailsPage from './components/CourtDetailsPage';
import MessagesPage from './components/MessagesPage';

export type AuthPage = 'login' | 'signup';
export type AppPage = 'home' | 'profile' | 'find-players' | 'requests' | 'book-court' | 'court-details' | 'messages';

function App() {
  const [currentPage, setCurrentPage] = useState<AuthPage>('login');
  const [appPage, setAppPage] = useState<AppPage>('home');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId);
    setAppPage('profile');
  };

  const handleViewCourt = (courtId: string) => {
    setSelectedCourtId(courtId);
    setAppPage('court-details');
  };

  const handleNavigate = (page: AppPage) => {
    if (page !== 'profile') {
      setSelectedUserId(null);
    }
    if (page !== 'court-details') {
      setSelectedCourtId(null);
    }
    setAppPage(page);
  };

  const handleBookingSuccess = () => {
    console.log('Booking successful!');
  };

  // If user is authenticated, show app pages with global navigation
  if (user) {
    const renderPageContent = () => {
      // Handle court details page
      if (appPage === 'court-details' && selectedCourtId) {
        return (
          <CourtDetailsPage
            courtId={selectedCourtId}
            onNavigate={handleNavigate}
            onBookingSuccess={handleBookingSuccess}
          />
        );
      }

      switch (appPage) {
        case 'messages':
          return <MessagesPage />;
        case 'book-court':
          return (
            <CourtSearchPage 
              onNavigate={handleNavigate}
              onViewCourt={handleViewCourt}
            />
          );
        case 'requests':
          return <RequestsPage onNavigate={handleNavigate} />;
        case 'find-players':
          return (
            <FindPlayerPage 
              onNavigate={handleNavigate}
              onViewProfile={handleViewProfile}
            />
          );
        case 'profile':
          return (
            <ProfileContainer 
              onNavigate={handleNavigate}
              viewingUserId={selectedUserId}
            />
          );
        case 'home':
        default:
          return (
            <SocialFeedPage
              onNavigate={handleNavigate}
              onViewProfile={handleViewProfile}
              onViewCourt={handleViewCourt}
            />
          );
      }
    };

    return (
      <MainLayout currentPage={appPage} onNavigate={handleNavigate}>
        {renderPageContent()}
      </MainLayout>
    );
  }

  // If user is not authenticated, show auth pages
  return (
    <div className="min-h-screen bg-gray-50">
      {currentPage === 'login' ? (
        <LoginPage onSwitchToSignup={() => setCurrentPage('signup')} />
      ) : (
        <SignUpPage onSwitchToLogin={() => setCurrentPage('login')} />
      )}
    </div>
  );
}

export default App;