import React from 'react';
import GlobalHeader from './GlobalHeader';
import { AppPage } from '../../App';

interface MainLayoutProps {
  children: React.ReactNode;
  currentPage?: AppPage;
  onNavigate: (page: AppPage) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, currentPage, onNavigate }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalHeader currentPage={currentPage} onNavigate={onNavigate} />
      <main className={currentPage === 'messages' ? '' : 'pt-16'}>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;