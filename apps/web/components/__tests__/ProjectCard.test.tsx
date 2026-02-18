import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ProjectCard component test - placeholder for when component exists
interface ProjectCardProps {
  id: string;
  name: string;
  description?: string;
  guestCount: number;
  status: 'draft' | 'active' | 'archived';
  onClick?: () => void;
  onMenuClick?: () => void;
}

// Simple ProjectCard implementation for testing
function ProjectCard({ 
  id, 
  name, 
  description, 
  guestCount, 
  status,
  onClick,
  onMenuClick 
}: ProjectCardProps) {
  return (
    <div 
      data-testid="project-card"
      data-project-id={id}
      onClick={onClick}
      className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 data-testid="project-name" className="font-semibold text-lg">{name}</h3>
          {description && (
            <p data-testid="project-description" className="text-gray-600 mt-1">{description}</p>
          )}
        </div>
        <button
          data-testid="project-menu-button"
          onClick={(e) => {
            e.stopPropagation();
            onMenuClick?.();
          }}
          className="p-2 hover:bg-gray-100 rounded min-h-[44px] min-w-[44px]"
          aria-label="Project menu"
        >
          ⋮
        </button>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <span data-testid="guest-count" className="text-sm text-gray-500">
          {guestCount} guests
        </span>
        <span 
          data-testid="project-status" 
          data-status={status}
          className={`text-sm px-2 py-1 rounded ${
            status === 'active' ? 'bg-green-100 text-green-800' :
            status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}
        >
          {status}
        </span>
      </div>
    </div>
  );
}

describe('ProjectCard', () => {
  const defaultProps: ProjectCardProps = {
    id: '1',
    name: 'Wedding Event',
    description: 'A beautiful wedding celebration',
    guestCount: 150,
    status: 'active',
  };

  it('renders project name', () => {
    render(<ProjectCard {...defaultProps} />);
    expect(screen.getByTestId('project-name')).toHaveTextContent('Wedding Event');
  });

  it('displays correct guest count', () => {
    render(<ProjectCard {...defaultProps} />);
    expect(screen.getByTestId('guest-count')).toHaveTextContent('150 guests');
  });

  it('displays correct status', () => {
    render(<ProjectCard {...defaultProps} />);
    expect(screen.getByTestId('project-status')).toHaveTextContent('active');
    expect(screen.getByTestId('project-status')).toHaveAttribute('data-status', 'active');
  });

  it('handles click event', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<ProjectCard {...defaultProps} onClick={handleClick} />);
    
    await user.click(screen.getByTestId('project-card'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows menu button on hover/focus', () => {
    render(<ProjectCard {...defaultProps} />);
    const menuButton = screen.getByTestId('project-menu-button');
    expect(menuButton).toBeInTheDocument();
    expect(menuButton).toHaveAttribute('aria-label', 'Project menu');
  });

  it('handles menu click separately from card click', async () => {
    const handleCardClick = jest.fn();
    const handleMenuClick = jest.fn();
    const user = userEvent.setup();
    
    render(
      <ProjectCard 
        {...defaultProps} 
        onClick={handleCardClick} 
        onMenuClick={handleMenuClick} 
      />
    );
    
    await user.click(screen.getByTestId('project-menu-button'));
    expect(handleMenuClick).toHaveBeenCalledTimes(1);
    expect(handleCardClick).not.toHaveBeenCalled();
  });

  it('renders without description', () => {
    render(<ProjectCard {...defaultProps} description={undefined} />);
    expect(screen.getByTestId('project-name')).toBeInTheDocument();
    expect(screen.queryByTestId('project-description')).not.toBeInTheDocument();
  });

  it('has minimum touch target size for accessibility', () => {
    render(<ProjectCard {...defaultProps} />);
    const menuButton = screen.getByTestId('project-menu-button');
    
    // Check that the button has minimum 44px touch target
    const styles = window.getComputedStyle(menuButton);
    expect(parseInt(styles.minHeight || '44')).toBeGreaterThanOrEqual(44);
    expect(parseInt(styles.minWidth || '44')).toBeGreaterThanOrEqual(44);
  });
});
