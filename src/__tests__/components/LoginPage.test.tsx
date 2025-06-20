import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '../../components/LoginPage';
import { authService } from '../../services/authService';

// Mock the auth service
vi.mock('../../services/authService', () => ({
  authService: {
    signIn: vi.fn()
  }
}));

describe('LoginPage Component', () => {
  const mockOnSwitchToSignup = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form elements', () => {
    render(<LoginPage onSwitchToSignup={mockOnSwitchToSignup} />);
    
    expect(screen.getByText('Log In to Fitcha')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    render(<LoginPage onSwitchToSignup={mockOnSwitchToSignup} />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    render(<LoginPage onSwitchToSignup={mockOnSwitchToSignup} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('should call authService.signIn with correct credentials', async () => {
    vi.mocked(authService.signIn).mockResolvedValue({
      data: { user: { id: 'test-user' } },
      error: null
    });

    render(<LoginPage onSwitchToSignup={mockOnSwitchToSignup} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authService.signIn).toHaveBeenCalledWith({
        emailOrPhone: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('should display error message on login failure', async () => {
    vi.mocked(authService.signIn).mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' }
    });

    render(<LoginPage onSwitchToSignup={mockOnSwitchToSignup} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it('should toggle password visibility', () => {
    render(<LoginPage onSwitchToSignup={mockOnSwitchToSignup} />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button

    expect(passwordInput).toHaveAttribute('type', 'password');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should call onSwitchToSignup when join now is clicked', () => {
    render(<LoginPage onSwitchToSignup={mockOnSwitchToSignup} />);
    
    const joinNowButton = screen.getByText('Join now');
    fireEvent.click(joinNowButton);

    expect(mockOnSwitchToSignup).toHaveBeenCalled();
  });
});