import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CourtSearchPage from '../../components/CourtSearchPage';
import { courtService } from '../../services/courtService';

// Mock the court service
vi.mock('../../services/courtService', () => ({
  courtService: {
    searchCourts: vi.fn()
  }
}));

describe('CourtSearchPage Component', () => {
  const mockOnNavigate = vi.fn();
  const mockOnViewCourt = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default successful response
    vi.mocked(courtService.searchCourts).mockResolvedValue({
      data: [],
      error: null
    });
  });

  it('should render search filters and results section', () => {
    render(<CourtSearchPage onNavigate={mockOnNavigate} onViewCourt={mockOnViewCourt} />);
    
    expect(screen.getByText('Book a Court')).toBeInTheDocument();
    expect(screen.getByText('Find Courts')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search courts/i })).toBeInTheDocument();
  });

  it('should call courtService.searchCourts on component mount', async () => {
    render(<CourtSearchPage onNavigate={mockOnNavigate} onViewCourt={mockOnViewCourt} />);
    
    await waitFor(() => {
      expect(courtService.searchCourts).toHaveBeenCalledWith({});
    });
  });

  it('should filter courts by sport type', async () => {
    render(<CourtSearchPage onNavigate={mockOnNavigate} onViewCourt={mockOnViewCourt} />);
    
    const sportSelect = screen.getByDisplayValue('All Sports');
    const searchButton = screen.getByRole('button', { name: /search courts/i });

    fireEvent.change(sportSelect, { target: { value: 'Tennis' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(courtService.searchCourts).toHaveBeenCalledWith({
        sport_type: 'Tennis'
      });
    });
  });

  it('should filter courts by price range', async () => {
    render(<CourtSearchPage onNavigate={mockOnNavigate} onViewCourt={mockOnViewCourt} />);
    
    const minPriceInput = screen.getByPlaceholderText('0');
    const maxPriceInput = screen.getByPlaceholderText('100');
    const searchButton = screen.getByRole('button', { name: /search courts/i });

    fireEvent.change(minPriceInput, { target: { value: '20' } });
    fireEvent.change(maxPriceInput, { target: { value: '50' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(courtService.searchCourts).toHaveBeenCalledWith({
        min_price: 20,
        max_price: 50
      });
    });
  });

  it('should display search results', async () => {
    const mockCourts = [
      {
        id: 'court1',
        name: 'Tennis Center',
        sport_type: 'Tennis',
        hourly_price: 30,
        location_address: '123 Main St',
        images: [],
        created_at: '2023-01-01T00:00:00Z'
      }
    ];

    vi.mocked(courtService.searchCourts).mockResolvedValue({
      data: mockCourts,
      error: null
    });

    render(<CourtSearchPage onNavigate={mockOnNavigate} onViewCourt={mockOnViewCourt} />);
    
    await waitFor(() => {
      expect(screen.getByText('Tennis Center')).toBeInTheDocument();
      expect(screen.getByText('Tennis')).toBeInTheDocument();
      expect(screen.getByText('$30')).toBeInTheDocument();
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
    });
  });

  it('should call onViewCourt when view details button is clicked', async () => {
    const mockCourts = [
      {
        id: 'court1',
        name: 'Tennis Center',
        sport_type: 'Tennis',
        hourly_price: 30,
        images: [],
        created_at: '2023-01-01T00:00:00Z'
      }
    ];

    vi.mocked(courtService.searchCourts).mockResolvedValue({
      data: mockCourts,
      error: null
    });

    render(<CourtSearchPage onNavigate={mockOnNavigate} onViewCourt={mockOnViewCourt} />);
    
    await waitFor(() => {
      const viewDetailsButton = screen.getByRole('button', { name: /view details/i });
      fireEvent.click(viewDetailsButton);
      
      expect(mockOnViewCourt).toHaveBeenCalledWith('court1');
    });
  });
});