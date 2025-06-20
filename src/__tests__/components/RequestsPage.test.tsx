import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RequestsPage from '../../components/RequestsPage';

// Mock the useGameRequests hook
vi.mock('../../hooks/useGameRequests', () => ({
  useGameRequests: vi.fn()
}));

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' }
  })
}));

import { useGameRequests } from '../../hooks/useGameRequests';

describe('RequestsPage Component', () => {
  const mockOnNavigate = vi.fn();
  const mockUpdateRequestStatus = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    vi.mocked(useGameRequests).mockReturnValue({
      receivedRequests: [],
      sentRequests: [],
      pendingCount: 0,
      loading: false,
      error: null,
      updateRequestStatus: mockUpdateRequestStatus,
      refetch: vi.fn()
    });
  });

  it('should render tabs for received and sent requests', () => {
    render(<RequestsPage onNavigate={mockOnNavigate} />);
    
    expect(screen.getByText(/received/i)).toBeInTheDocument();
    expect(screen.getByText(/sent/i)).toBeInTheDocument();
  });

  it('should display pending count badge on received tab', () => {
    vi.mocked(useGameRequests).mockReturnValue({
      receivedRequests: [],
      sentRequests: [],
      pendingCount: 3,
      loading: false,
      error: null,
      updateRequestStatus: mockUpdateRequestStatus,
      refetch: vi.fn()
    });

    render(<RequestsPage onNavigate={mockOnNavigate} />);
    
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should display received requests with accept/decline buttons', () => {
    const mockReceivedRequests = [
      {
        id: 'req1',
        sender_id: 'sender1',
        receiver_id: 'test-user-id',
        status: 'pending',
        message: 'Want to play tennis?',
        created_at: '2023-01-01T10:00:00Z',
        sender_profile: {
          first_name: 'John',
          last_name: 'Doe',
          location: 'New York'
        }
      }
    ];

    vi.mocked(useGameRequests).mockReturnValue({
      receivedRequests: mockReceivedRequests,
      sentRequests: [],
      pendingCount: 1,
      loading: false,
      error: null,
      updateRequestStatus: mockUpdateRequestStatus,
      refetch: vi.fn()
    });

    render(<RequestsPage onNavigate={mockOnNavigate} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Want to play tennis?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument();
  });

  it('should call updateRequestStatus when accept button is clicked', async () => {
    const mockReceivedRequests = [
      {
        id: 'req1',
        sender_id: 'sender1',
        receiver_id: 'test-user-id',
        status: 'pending',
        created_at: '2023-01-01T10:00:00Z',
        sender_profile: {
          first_name: 'John',
          last_name: 'Doe'
        }
      }
    ];

    vi.mocked(useGameRequests).mockReturnValue({
      receivedRequests: mockReceivedRequests,
      sentRequests: [],
      pendingCount: 1,
      loading: false,
      error: null,
      updateRequestStatus: mockUpdateRequestStatus,
      refetch: vi.fn()
    });

    render(<RequestsPage onNavigate={mockOnNavigate} />);
    
    const acceptButton = screen.getByRole('button', { name: /accept/i });
    fireEvent.click(acceptButton);
    
    expect(mockUpdateRequestStatus).toHaveBeenCalledWith('req1', 'accepted');
  });

  it('should call updateRequestStatus when decline button is clicked', async () => {
    const mockReceivedRequests = [
      {
        id: 'req1',
        sender_id: 'sender1',
        receiver_id: 'test-user-id',
        status: 'pending',
        created_at: '2023-01-01T10:00:00Z',
        sender_profile: {
          first_name: 'John',
          last_name: 'Doe'
        }
      }
    ];

    vi.mocked(useGameRequests).mockReturnValue({
      receivedRequests: mockReceivedRequests,
      sentRequests: [],
      pendingCount: 1,
      loading: false,
      error: null,
      updateRequestStatus: mockUpdateRequestStatus,
      refetch: vi.fn()
    });

    render(<RequestsPage onNavigate={mockOnNavigate} />);
    
    const declineButton = screen.getByRole('button', { name: /decline/i });
    fireEvent.click(declineButton);
    
    expect(mockUpdateRequestStatus).toHaveBeenCalledWith('req1', 'declined');
  });

  it('should switch between received and sent tabs', () => {
    const mockSentRequests = [
      {
        id: 'req2',
        sender_id: 'test-user-id',
        receiver_id: 'receiver1',
        status: 'pending',
        created_at: '2023-01-01T10:00:00Z',
        receiver_profile: {
          first_name: 'Jane',
          last_name: 'Smith'
        }
      }
    ];

    vi.mocked(useGameRequests).mockReturnValue({
      receivedRequests: [],
      sentRequests: mockSentRequests,
      pendingCount: 0,
      loading: false,
      error: null,
      updateRequestStatus: mockUpdateRequestStatus,
      refetch: vi.fn()
    });

    render(<RequestsPage onNavigate={mockOnNavigate} />);
    
    const sentTab = screen.getByRole('button', { name: /sent/i });
    fireEvent.click(sentTab);
    
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should display loading state', () => {
    vi.mocked(useGameRequests).mockReturnValue({
      receivedRequests: [],
      sentRequests: [],
      pendingCount: 0,
      loading: true,
      error: null,
      updateRequestStatus: mockUpdateRequestStatus,
      refetch: vi.fn()
    });

    render(<RequestsPage onNavigate={mockOnNavigate} />);
    
    // Should show loading skeletons
    expect(screen.getAllByRole('generic')).toHaveLength(expect.any(Number));
  });

  it('should display error state', () => {
    vi.mocked(useGameRequests).mockReturnValue({
      receivedRequests: [],
      sentRequests: [],
      pendingCount: 0,
      loading: false,
      error: 'Failed to load requests',
      updateRequestStatus: mockUpdateRequestStatus,
      refetch: vi.fn()
    });

    render(<RequestsPage onNavigate={mockOnNavigate} />);
    
    expect(screen.getByText('Error Loading Requests')).toBeInTheDocument();
    expect(screen.getByText('Failed to load requests')).toBeInTheDocument();
  });

  it('should display empty state for no requests', () => {
    render(<RequestsPage onNavigate={mockOnNavigate} />);
    
    expect(screen.getByText('No Received Requests')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /find players/i })).toBeInTheDocument();
  });
});