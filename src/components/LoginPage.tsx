import React, { useState } from 'react';
import { Eye, EyeOff, Users, Chrome, Smartphone } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import SocialButton from './ui/SocialButton';
import Logo from './ui/Logo';
import { authService } from '../services/authService';
import { SignInData } from '../types/auth';

interface LoginPageProps {
  onSwitchToSignup: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToSignup }) => {
  const [formData, setFormData] = useState<SignInData>({
    emailOrPhone: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (field: keyof SignInData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.emailOrPhone.trim()) {
      newErrors.emailOrPhone = 'Email is required';
    } else if (!validateEmail(formData.emailOrPhone.trim())) {
      newErrors.emailOrPhone = 'Please enter a valid email address';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
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
      const { data, error } = await authService.signIn(formData);

      if (error) {
        // Handle specific error cases
        if (error.message.includes('Invalid login credentials')) {
          setGeneralError('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setGeneralError('Please check your email and confirm your account before signing in.');
        } else if (error.message.includes('Too many requests')) {
          setGeneralError('Too many login attempts. Please wait a moment before trying again.');
        } else {
          setGeneralError('Unable to sign in. Please try again.');
        }
        return;
      }

      if (data?.user) {
        // Success - user will be automatically redirected by the auth state change
        console.log('Login successful');
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
            Log In to Fitcha
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Play more, connect better, and grow with the Fitcha sports community.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {generalError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{generalError}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              value={formData.emailOrPhone}
              onChange={(value) => handleInputChange('emailOrPhone', value)}
              placeholder="Enter your email address"
              error={errors.emailOrPhone}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(value) => handleInputChange('password', value)}
              placeholder="Enter your password"
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

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              fullWidth 
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
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
                onClick={() => console.log('Google login')}
              />
              <SocialButton
                icon={<Smartphone size={20} />}
                provider="Apple"
                onClick={() => console.log('Apple login')}
              />
            </div>
          </div>

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">New to Fitcha? </span>
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Join now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;