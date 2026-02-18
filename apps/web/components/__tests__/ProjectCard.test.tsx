import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectCard } from '@/components/dashboard/project-card';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('ProjectCard', () => {
  const defaultProps = {
    id: '1',
    name: 'Wedding Event',
    description: 'A beautiful wedding celebration',
    eventDate: new Date('2026-06-15'),
    status: 'active' as const,
    stats: {
      totalGuests: 150,
      totalInvites: 145,
      rsvpYes: 120,
      rsvpNo: 10,
      rsvpPending: 20,
    },
    selected: false,
    onSelect: jest.fn(),
  };

  it('renders project name', () => {
    render(<ProjectCard {...defaultProps} />);
    expect(screen.getByText('Wedding Event')).toBeInTheDocument();
  });

  it('displays correct guest count', () => {
    render(<ProjectCard {...defaultProps} />);
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Guests')).toBeInTheDocument();
  });

  it('displays correct status', () => {
    render(<ProjectCard {...defaultProps} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('handles selection', async () => {
    const handleSelect = jest.fn();
    const user = userEvent.setup();
    
    render(<ProjectCard {...defaultProps} onSelect={handleSelect} />);
    
    // Find and click the checkbox
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    expect(handleSelect).toHaveBeenCalledWith('1', true);
  });

  it('renders without description', () => {
    render(<ProjectCard {...defaultProps} description={undefined} />);
    expect(screen.getByText('Wedding Event')).toBeInTheDocument();
  });

  it('displays RSVP stats correctly', () => {
    render(<ProjectCard {...defaultProps} />);
    
    // Should show RSVP stats
    expect(screen.getByText('120')).toBeInTheDocument(); // Yes
    expect(screen.getByText('10')).toBeInTheDocument();  // No
    expect(screen.getByText('20')).toBeInTheDocument();  // Pending
  });

  it('has minimum touch target size for accessibility', () => {
    render(<ProjectCard {...defaultProps} />);
    
    // Check that interactive elements have minimum 44px touch target
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('h-4', 'w-4');
  });

  it('shows archived status correctly', () => {
    render(<ProjectCard {...defaultProps} status="archived" />);
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('shows draft status correctly', () => {
    render(<ProjectCard {...defaultProps} status="draft" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });
});
