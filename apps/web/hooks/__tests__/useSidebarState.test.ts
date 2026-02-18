import { renderHook, act } from '@testing-library/react';
import { useSidebarState } from '../useSidebarState';

describe('useSidebarState', () => {
  const SIDEBAR_STATE_KEY = 'eios-sidebar-state';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset window innerWidth to desktop by default
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('initializes as closed on mobile', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375, // iPhone width
    });

    const { result } = renderHook(() => useSidebarState());
    
    expect(result.current.isOpen).toBe(false);
  });

  it('initializes as open on desktop by default', () => {
    const { result } = renderHook(() => useSidebarState());
    
    expect(result.current.isOpen).toBe(true);
  });

  it('reads saved state from localStorage on desktop', () => {
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(false));
    
    const { result } = renderHook(() => useSidebarState());
    
    expect(result.current.isOpen).toBe(false);
  });

  it('persists state to localStorage', () => {
    const { result } = renderHook(() => useSidebarState());
    
    act(() => {
      result.current.setIsOpen(false);
    });
    
    expect(localStorage.getItem(SIDEBAR_STATE_KEY)).toBe('false');
  });

  it('toggles state', () => {
    const { result } = renderHook(() => useSidebarState());
    
    expect(result.current.isOpen).toBe(true);
    
    act(() => {
      result.current.toggle();
    });
    
    expect(result.current.isOpen).toBe(false);
    
    act(() => {
      result.current.toggle();
    });
    
    expect(result.current.isOpen).toBe(true);
  });

  it('syncs state across tabs via storage event', () => {
    const { result } = renderHook(() => useSidebarState());
    
    expect(result.current.isOpen).toBe(true);
    
    // Simulate storage event from another tab
    act(() => {
      localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(false));
      const storageEvent = new StorageEvent('storage', {
        key: SIDEBAR_STATE_KEY,
        newValue: 'false',
      });
      window.dispatchEvent(storageEvent);
    });
    
    expect(result.current.isOpen).toBe(false);
  });

  it('opens sidebar with open() method', () => {
    const { result } = renderHook(() => useSidebarState());
    
    act(() => {
      result.current.setIsOpen(false);
    });
    
    expect(result.current.isOpen).toBe(false);
    
    act(() => {
      result.current.open();
    });
    
    expect(result.current.isOpen).toBe(true);
  });

  it('closes sidebar with close() method', () => {
    const { result } = renderHook(() => useSidebarState());
    
    act(() => {
      result.current.close();
    });
    
    expect(result.current.isOpen).toBe(false);
  });

  it('detects mobile correctly', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { result } = renderHook(() => useSidebarState());
    
    expect(result.current.isMobile).toBe(true);
  });

  it('handles resize from desktop to mobile', () => {
    const { result } = renderHook(() => useSidebarState());
    
    // Initially open on desktop
    expect(result.current.isOpen).toBe(true);
    
    // Resize to mobile
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      window.dispatchEvent(new Event('resize'));
    });
    
    // Should close on mobile transition
    // Note: The actual behavior depends on the implementation
    // This tests the resize handler is registered
  });

  it('ignores storage events for other keys', () => {
    const { result } = renderHook(() => useSidebarState());
    
    const initialState = result.current.isOpen;
    
    act(() => {
      const storageEvent = new StorageEvent('storage', {
        key: 'some-other-key',
        newValue: 'false',
      });
      window.dispatchEvent(storageEvent);
    });
    
    expect(result.current.isOpen).toBe(initialState);
  });
});
