import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'icon' | 'full';
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', variant = 'full' }) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12'
  };

  const textSizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl'
  };

  const FitchaIcon = () => (
    <div className={`${sizeClasses[size]} bg-blue-600 rounded-lg flex items-center justify-center relative overflow-hidden`}>
      {/* First F - facing right */}
      <div className="absolute left-1 top-1/2 transform -translate-y-1/2">
        <svg 
          width="14" 
          height="16" 
          viewBox="0 0 14 16" 
          fill="none" 
          className="text-white"
        >
          <path 
            d="M2 2V14M2 2H10M2 8H8" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
      
      {/* Second F - facing left (mirrored) */}
      <div className="absolute right-1 top-1/2 transform -translate-y-1/2 scale-x-[-1]">
        <svg 
          width="14" 
          height="16" 
          viewBox="0 0 14 16" 
          fill="none" 
          className="text-white"
        >
          <path 
            d="M2 2V14M2 2H10M2 8H8" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
      
      {/* Central dividing line */}
      <div className="absolute left-1/2 top-2 bottom-2 w-0.5 bg-white/30 transform -translate-x-1/2"></div>
    </div>
  );

  if (variant === 'icon') {
    return <FitchaIcon />;
  }

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <FitchaIcon />
        <span className={`${textSizeClasses[size]} font-bold text-gray-900`}>Fitcha</span>
      </div>
    </div>
  );
};

export default Logo;