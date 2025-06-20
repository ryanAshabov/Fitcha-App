import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FindPlayerPage from '../../components/FindPlayerPage';
import { playerService } from '../../services/playerService';

// Mock the player service
vi.mock('../../services/playerService', () => ({
  playerService: {
    searchPlayers: vi.fn()
  }
}));

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' }
  })
}));

describe('FindPlayerPage Component', () => {
  const mockOnNavigate = vi.fn();
  const mockOnViewProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default successful response
    vi.mocked(playerService.searchPlayers).mockResolvedValue({
      data: [],
      error: null
    });
  });

  it('should render search filters and results section', () => {
    render(<FindPlayerPage onNavigate={mockOnNavigate} onViewProfile={mockOnViewProfile} />);
    
    expect(screen.getByText('Find Players')).toBeInTheDocument();
    expect(screen.getByText('Find Players')).toBeInTheDocument(); // Filter section title
    expect(screen.getByRole('button', { name: /search players/i })).toBeInTheDocument();
  });

  it('should call playerService.searchPlayers on component mount', async () => {
    render(<FindPlayerPage onNavigate={mockOnNavigate} onViewProfile={mockOnViewProfile} />);
    
    await waitFor(() => {
      expect(playerService.searchPlayers).toHaveBeenCalledWith({});
    });
  });

  it('should filter players by sport', async () => {
    render(<FindPlayerPage onNavigate={mockOnNavigate} onViewProfile={mockOnViewProfile} />);
    
    const sportSelect = screen.getByDisplayValue('All Sports');
    const searchButton = screen.getByRole('button', { name: /search players/i });

    fireEvent.change(sportSelect, { target: { value: 'Tennis' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(playerService.searchPlayers).toHaveBeenCalledWith({
        sport: 'Tennis'
      });
    });
  });

  it('should filter players by skill level', async () => {
    render(<FindPlayerPage onNavigate={mockOnNavigate} onViewProfile={mockOnViewProfile} />);
    
    const levelSelect = screen.getByDisplayValue('All Levels');
    const searchButton = screen.getByRole('button', { name: /search players/i });

    fireEvent.change(levelSelect, { target: { value: 'Advanced' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(playerService.searchPlayers).toHaveBeenCalledWith({
        level: 'Advanced'
      });
    });
  });

  it('should filter players by location', async () => {
    render(<FindPlayerPage onNavigate={mockOnNavigate} onViewProfile={mockOnViewProfile} />);
    
    const locationInput = screen.getByPlaceholderText('Enter city or area');
    const searchButton = screen.getByRole('button', { name: /search players/i });

    fireEvent.change(locationInput, { target: { value: 'New York' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(playerService.searchPlayers).toHaveBeenCalledWith({
        location: 'New York'
      });
    });
  });

  it('should display search results', async () => {
    const mockPlayers = [
      {
        id: 'player1',
        user_id: 'user1',
        first_name: 'John',
        last_name: 'Doe',
        location: 'New York',
        sports: [{ sport: 'Tennis', level: 'Advanced' }],
        updated_at: '2023-01-01T00:00:00Z'
      }
    ];

    vi.mocked(playerService.searchPlayers).mockResolvedValue({
      data: mockPlayers,
      error: null
    });

    render(<FindPlayerPage onNavigate={mockOnNavigate} onViewProfile={mockOnViewProfile} />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('New York')).toBeInTheDocument();
      expect(screen.getByText('Tennis')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });
  });

  it('should call onViewProfile when view profile button is clicked', async () => {
    const mockPlayers = [
      {
        id: 'player1',
        user_id: 'user1',
        first_name: 'John',
        last_name: 'Doe',
        sports: [],
        updated_at: '2023-01-01T00:00:00Z'
      }
    ];

    vi.mocked(playerService.searchPlayers).mockResolvedValue({
      data: mockPlayers,
      error: null
    });

    render(<FindPlayerPage onNavigate={mockOnNavigate} onViewProfile={mockOnViewProfile} />);
    
    await waitFor(() => {
      const viewProfileButton = screen.getByRole('button', { name: /view profile/i });
      fireEvent.click(viewProfileButton);
      
      expect(mockOnViewProfile).toHaveBeenCalledWith('user1');
    });
  });

  it('should clear filters when clear filters button is clicked', async () => {
    render(<FindPlayerPage onNavigate={mockOnNavigate} onViewProfile={mockOnViewProfile} />);
    
    const sportSelect = screen.getByDisplayValue('All Sports');
    const locationInput = screen.getByPlaceholderText('Enter city or area');
    
    // Set some filters
    fireEvent.change(sportSelect, { target: { value: 'Tennis' } });
    fireEvent.change(locationInput, { target: { value: 'New York' } });
    
    // Clear filters should appear
    await waitFor(() => {
      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      fireEvent.click(clearButton);
    });

    await waitFor(() => {
      expect(playerService.searchPlayers).toHaveBeenCalledWith({});
    });
  });

  it('should display no results message when no players found', async () => {
    vi.mocked(playerService.searchPlayers).mockResolvedValue({
      data: [],
      error: null
    });

    render(<FindPlayerPage onNavigate={mockOnNavigate} onViewProfile={mockOnViewProfile} />);
    
    await waitFor(() => {
      expect(screen.getByText('No Players Found')).toBeInTheDocument();
    });
  });

  it('should display error message on search failure', async () => {
    vi.mocked(playerService.searchPlayers).mockResolvedValue({
      data: null,
      error: { message: 'Network error' }
    });

    render(<FindPlayerPage onNavigate={mockOnNavigate} onViewProfile={mockOnViewProfile} />);
    
    await waitFor(() => {
      expect(screen.getByText('Search Error')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});