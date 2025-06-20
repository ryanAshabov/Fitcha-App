import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGameRequests } from '../../hooks/useGameRequests';
import { gameRequestService } from '../../services/gameRequestService';

// Mock the auth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' }
  })
}));

// Mock the game request service
vi.mock('../../services/gameRequestService', () => ({
  gameRequestService: {
    getReceivedRequests: vi.fn(),
    getSentRequests: vi.fn(),
    getPendingReceivedCount: vi.fn(),
    updateRequestStatus: vi.fn()
  }
}));

describe('useGameRequests Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default successful responses
    vi.mocked(gameRequestService.getReceivedRequests).mockResolvedValue({
      data: [],
      error: null
    });
    vi.mocked(gameRequestService.getSentRequests).mockResolvedValue({
      data: [],
      error: null
    });
    vi.mocked(gameRequestService.getPendingReceivedCount).mockResolvedValue({
      data: 0,
      error: null
    });
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useGameRequests());

    expect(result.current.loading).toBe(true);
    expect(result.current.receivedRequests).toEqual([]);
    expect(result.current.sentRequests).toEqual([]);
    expect(result.current.pendingCount).toBe(0);
  });

  it('should fetch and set initial data successfully', async () => {
    const mockReceivedRequests = [
      { id: 'req1', sender_id: 'user1', receiver_id: 'test-user-id', status: 'pending' }
    ];
    const mockSentRequests = [
      { id: 'req2', sender_id: 'test-user-id', receiver_id: 'user2', status: 'pending' }
    ];

    vi.mocked(gameRequestService.getReceivedRequests).mockResolvedValue({
      data: mockReceivedRequests,
      error: null
    });
    vi.mocked(gameRequestService.getSentRequests).mockResolvedValue({
      data: mockSentRequests,
      error: null
    });
    vi.mocked(gameRequestService.getPendingReceivedCount).mockResolvedValue({
      data: 2,
      error: null
    });

    const { result } = renderHook(() => useGameRequests());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.receivedRequests).toEqual(mockReceivedRequests);
    expect(result.current.sentRequests).toEqual(mockSentRequests);
    expect(result.current.pendingCount).toBe(2);
    expect(result.current.error).toBe(null);
  });

  it('should handle fetch errors gracefully', async () => {
    vi.mocked(gameRequestService.getReceivedRequests).mockResolvedValue({
      data: null,
      error: { message: 'Network error' }
    });

    const { result } = renderHook(() => useGameRequests());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.receivedRequests).toEqual([]);
    expect(result.current.sentRequests).toEqual([]);
    expect(result.current.pendingCount).toBe(0);
  });

  it('should update request status successfully', async () => {
    vi.mocked(gameRequestService.updateRequestStatus).mockResolvedValue({
      data: { id: 'req1', status: 'accepted' },
      error: null
    });

    const { result } = renderHook(() => useGameRequests());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updateResult = await result.current.updateRequestStatus('req1', 'accepted');

    expect(updateResult.success).toBe(true);
    expect(gameRequestService.updateRequestStatus).toHaveBeenCalledWith('req1', { status: 'accepted' });
  });
});