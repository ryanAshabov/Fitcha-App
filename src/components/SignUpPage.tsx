import React, { useState } from 'react';
import { Eye, EyeOff, Chrome, Smartphone } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import SocialButton from './ui/SocialButton';
import Logo from './ui/Logo';
import { authService } from '../services/authService';
import { SignUpData } from '../types/auth';

interface SignUpPageProps {
  onSwitchToLogin: () => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState<SignUpData>({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const handleInputChange = (field: keyof SignUpData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setGeneralError('');

    try {
      const { data, error } = await authService.signUp(formData);

      if (error) {
        // Handle specific error cases
        if (error.message.includes('already registered')) {
          setGeneralError('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('Invalid email')) {
          setGeneralError('Please enter a valid email address.');
        } else if (error.message.includes('Password')) {
          setGeneralError('Password must be at least 6 characters long.');
        } else {
          setGeneralError('Unable to create account. Please try again.');
        }
        return;
      }

      if (data?.user) {
        // Success - redirect to login page
        onSwitchToLogin();
      }
    } catch (error) {
      setGeneralError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Logo />
          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Join Fitcha
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Create your athletic profile and start your journey.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {generalError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{generalError}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                type="text"
                value={formData.firstName}
                onChange={(value) => handleInputChange('firstName', value)}
                placeholder="Enter your first name"
                error={errors.firstName}
              />

              <Input
                label="Last Name"
                type="text"
                value={formData.lastName}
                onChange={(value) => handleInputChange('lastName', value)}
                placeholder="Enter your last name"
                error={errors.lastName}
              />
            </div>

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(value) => handleInputChange('email', value)}
              placeholder="Enter your email"
              error={errors.email}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(value) => handleInputChange('password', value)}
              placeholder="Enter a password (6+ characters)"
              error={errors.password}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />

            <Button 
              type="submit" 
              variant="primary" 
              fullWidth 
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Agree & Join'}
            </Button>

            <p className="text-xs text-gray-500 text-center leading-relaxed">
              By clicking Agree & Join, you agree to the{' '}
              <button className="text-blue-600 hover:text-blue-500 underline">
                Fitcha User Agreement
              </button>
              ,{' '}
              <button className="text-blue-600 hover:text-blue-500 underline">
                Privacy Policy
              </button>
              , and{' '}
              <button className="text-blue-600 hover:text-blue-500 underline">
                Cookie Policy
              </button>
              .
            </p>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <SocialButton
                icon={<Chrome size={20} />}
                provider="Google"
                onClick={() => console.log('Google signup')}
              />
              <SocialButton
                icon={<Smartphone size={20} />}
                provider="Apple"
                onClick={() => console.log('Apple signup')}
              />
            </div>
          </div>

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">Already on Fitcha? </span>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;