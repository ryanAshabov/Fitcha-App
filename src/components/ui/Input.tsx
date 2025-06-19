import React, { useState } from 'react';

interface InputProps {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  rightIcon?: React.ReactNode;
  className?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  type,
  value,
  onChange,
  placeholder,
  error,
  rightIcon,
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const hasValue = value.length > 0;
  const showFloatingLabel = isFocused || hasValue;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={showFloatingLabel ? placeholder : ''}
          className={`w-full px-3 pt-7 pb-3 border rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${rightIcon ? 'pr-10' : ''}`}
        />
        
        <label
          className={`absolute left-3 transition-all duration-200 pointer-events-none select-none ${
            showFloatingLabel
              ? 'top-1.5 text-xs text-gray-500 font-medium'
              : 'top-1/2 -translate-y-1/2 text-sm text-gray-400'
          }`}
        >
          {label}
        </label>

        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;