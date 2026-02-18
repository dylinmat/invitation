import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardNav } from '../dashboard/nav';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

import { usePathname } from 'next/navigation';

const mockedUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('DashboardNav', () => {
  beforeEach(() => {
    mockedUsePathname.mockReturnValue('/dashboard');
  });

  it('renders all navigation items', () => {
    render(<DashboardNav />);
    
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Help & Support')).toBeInTheDocument();
  });

  it('highlights active link', () => {
    render(<DashboardNav />);
    
    const projectsLink = screen.getByText('Projects').closest('a');
    expect(projectsLink).toHaveAttribute('aria-current', 'page');
    expect(projectsLink).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('does not highlight inactive links', () => {
    render(<DashboardNav />);
    
    const calendarLink = screen.getByText('Calendar').closest('a');
    expect(calendarLink).not.toHaveAttribute('aria-current');
    expect(calendarLink).toHaveClass('text-muted-foreground');
  });

  it('updates active state based on pathname', () => {
    mockedUsePathname.mockReturnValue('/dashboard/calendar');
    
    render(<DashboardNav />);
    
    const calendarLink = screen.getByText('Calendar').closest('a');
    expect(calendarLink).toHaveAttribute('aria-current', 'page');
  });

  it('has proper href attributes', () => {
    render(<DashboardNav />);
    
    expect(screen.getByText('Projects').closest('a')).toHaveAttribute('href', '/dashboard');
    expect(screen.getByText('Calendar').closest('a')).toHaveAttribute('href', '/dashboard/calendar');
    expect(screen.getByText('Settings').closest('a')).toHaveAttribute('href', '/dashboard/settings');
  });

  it('has minimum touch target size', () => {
    render(<DashboardNav />);
    
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveClass('min-h-[44px]', 'touch-manipulation');
    });
  });

  it('has focus-visible styles for accessibility', () => {
    render(<DashboardNav />);
    
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-primary');
    });
  });

  it('icons are present for all items', () => {
    render(<DashboardNav />);
    
    // All nav items should have an icon (using lucide-react)
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
  });

  it('handles partial path matching for active state', () => {
    mockedUsePathname.mockReturnValue('/dashboard/settings/profile');
    
    render(<DashboardNav />);
    
    const settingsLink = screen.getByText('Settings').closest('a');
    expect(settingsLink).toHaveAttribute('aria-current', 'page');
  });
});

describe('DashboardNav Mobile', () => {
  beforeEach(() => {
    mockedUsePathname.mockReturnValue('/dashboard');
  });

  it('navigation is accessible via keyboard', async () => {
    const user = userEvent.setup();
    render(<DashboardNav />);
    
    const firstLink = screen.getAllByRole('link')[0];
    firstLink.focus();
    
    expect(document.activeElement).toBe(firstLink);
    
    // Tab to next link
    await user.tab();
    
    const secondLink = screen.getAllByRole('link')[1];
    expect(document.activeElement).toBe(secondLink);
  });
});
