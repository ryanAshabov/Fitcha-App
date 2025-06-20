import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../services/authService';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase');

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signUp', () => {
    it('should call supabase.auth.signUp with correct parameters', async () => {
      const mockSignUpData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const mockResponse = {
        data: { user: { id: 'test-user' } },
        error: null
      };

      vi.mocked(supabase.auth.signUp).mockResolvedValue(mockResponse);

      const result = await authService.signUp(mockSignUpData);

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
        options: {
          data: {
            first_name: 'John',
            last_name: 'Doe'
          }
        }
      });

      expect(result).toEqual({ data: mockResponse.data, error: null });
    });

    it('should handle signup errors', async () => {
      const mockError = { message: 'Email already exists' };
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await authService.signUp({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      expect(result).toEqual({
        data: null,
        error: { message: 'Email already exists' }
      });
    });
  });

  describe('signIn', () => {
    it('should call supabase.auth.signInWithPassword with correct parameters', async () => {
      const mockSignInData = {
        emailOrPhone: 'john@example.com',
        password: 'password123'
      };

      const mockResponse = {
        data: { user: { id: 'test-user' } },
        error: null
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(mockResponse);

      const result = await authService.signIn(mockSignInData);

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123'
      });

      expect(result).toEqual({ data: mockResponse.data, error: null });
    });

    it('should handle signin errors', async () => {
      const mockError = { message: 'Invalid credentials' };
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await authService.signIn({
        emailOrPhone: 'john@example.com',
        password: 'wrongpassword'
      });

      expect(result).toEqual({
        data: null,
        error: { message: 'Invalid credentials' }
      });
    });
  });

  describe('signOut', () => {
    it('should call supabase.auth.signOut', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      const result = await authService.signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(result).toEqual({ error: null });
    });

    it('should handle signout errors', async () => {
      const mockError = { message: 'Signout failed' };
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: mockError });

      const result = await authService.signOut();

      expect(result).toEqual({
        error: { message: 'Signout failed' }
      });
    });
  });
});