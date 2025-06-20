import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase');

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
    expect(result.current.session).toBe(null);
  });

  it('should set user and session when authenticated', async () => {
    const mockSession = {
      user: { id: 'test-user', email: 'test@example.com' },
      access_token: 'token'
    };

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockSession.user);
    expect(result.current.session).toEqual(mockSession);
  });

  it('should handle session fetch errors gracefully', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: { message: 'Network error' }
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBe(null);
    expect(result.current.session).toBe(null);
  });

  it('should set up auth state change listener', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    });

    renderHook(() => useAuth());

    await waitFor(() => {
      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });
  });
});