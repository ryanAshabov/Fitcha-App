import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../../App';
import { authService } from '../../services/authService';
import { playerService } from '../../services/playerService';

// Mock all services
vi.mock('../../services/authService');
vi.mock('../../services/playerService');
vi.mock('../../hooks/useAuth');
vi.mock('../../hooks/useGameRequests');
vi.mock('../../hooks/useNotifications');
vi.mock('../../hooks/useMessaging');

describe('User Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete login to player search flow', async () => {
    // Mock successful login
    vi.mocked(authService.signIn).mockResolvedValue({
      data: { user: { id: 'test-user', email: 'test@example.com' } },
      error: null
    });

    // Mock player search
    vi.mocked(playerService.searchPlayers).mockResolvedValue({
      data: [
        {
          id: 'player1',
          user_id: 'user1',
          first_name: 'John',
          last_name: 'Doe',
          sports: [{ sport: 'Tennis', level: 'Advanced' }],
          updated_at: '2023-01-01T00:00:00Z'
        }
      ],
      error: null
    });

    // Mock useAuth to return authenticated user after login
    const { useAuth } = await import('../../hooks/useAuth');
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' },
      session: null,
      loading: false
    });

    render(<App />);

    // Should start with login page
    expect(screen.getByText('Log In to Fitcha')).toBeInTheDocument();

    // Fill in login form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // Should navigate to main app after successful login
    await waitFor(() => {
      expect(screen.getByText('Find Players')).toBeInTheDocument();
    });

    // Navigate to find players page
    const findPlayersLink = screen.getByText('Find Players');
    fireEvent.click(findPlayersLink);

    // Should show player search results
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Tennis')).toBeInTheDocument();
    });
  });

  it('should handle authentication errors gracefully', async () => {
    // Mock failed login
    vi.mocked(authService.signIn).mockResolvedValue({
      data: null,
      error: { message: 'Invalid credentials' }
    });

    const { useAuth } = await import('../../hooks/useAuth');
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false
    });

    render(<App />);

    // Fill in login form with invalid credentials
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(loginButton);

    // Should show error message and stay on login page
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      expect(screen.getByText('Log In to Fitcha')).toBeInTheDocument();
    });
  });
});