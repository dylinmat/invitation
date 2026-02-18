import { renderHook } from '@testing-library/react';
import { useThrottledScroll, useScrollDirection, useScrollHeader } from '../useThrottledScroll';

describe('useThrottledScroll', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('throttles scroll events', () => {
    const callback = jest.fn();
    
    renderHook(() => useThrottledScroll(callback, 100));
    
    // Simulate multiple scroll events
    act(() => {
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('scroll'));
    });
    
    // Callback should not be called immediately
    expect(callback).not.toHaveBeenCalled();
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    // Should have been called at least once
    expect(callback).toHaveBeenCalled();
  });

  it('uses requestAnimationFrame for intermediate updates', () => {
    const callback = jest.fn();
    
    renderHook(() => useThrottledScroll(callback, 16));
    
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    
    // Should queue a rAF callback
    expect(callback).not.toHaveBeenCalled();
  });

  it('cleans up event listener on unmount', () => {
    const callback = jest.fn();
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { unmount } = renderHook(() => useThrottledScroll(callback, 16));
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});

describe('useScrollDirection', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('detects scroll down', () => {
    const { result } = renderHook(() => useScrollDirection(16));
    
    act(() => {
      window.scrollY = 100;
      window.dispatchEvent(new Event('scroll'));
    });
    
    jest.advanceTimersByTime(16);
    
    expect(result.current.current).toBe('down');
  });

  it('detects scroll up', () => {
    Object.defineProperty(window, 'scrollY', { value: 200, writable: true });
    
    const { result } = renderHook(() => useScrollDirection(16));
    
    act(() => {
      window.scrollY = 100;
      window.dispatchEvent(new Event('scroll'));
    });
    
    jest.advanceTimersByTime(16);
    
    expect(result.current.current).toBe('up');
  });
});

describe('useScrollHeader', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows header at top of page', () => {
    const { result } = renderHook(() => useScrollHeader(16));
    
    expect(result.current).toBe(true);
  });

  it('hides header when scrolling down past threshold', () => {
    const { result } = renderHook(() => useScrollHeader(16));
    
    act(() => {
      window.scrollY = 100;
      window.dispatchEvent(new Event('scroll'));
    });
    
    jest.advanceTimersByTime(16);
    
    expect(result.current).toBe(false);
  });

  it('shows header when scrolling up', () => {
    Object.defineProperty(window, 'scrollY', { value: 200, writable: true });
    
    const { result } = renderHook(() => useScrollHeader(16));
    
    // First scroll down to hide
    act(() => {
      window.scrollY = 300;
      window.dispatchEvent(new Event('scroll'));
    });
    jest.advanceTimersByTime(16);
    
    expect(result.current).toBe(false);
    
    // Then scroll up
    act(() => {
      window.scrollY = 200;
      window.dispatchEvent(new Event('scroll'));
    });
    jest.advanceTimersByTime(16);
    
    expect(result.current).toBe(true);
  });
});

// Import act for the tests
import { act } from '@testing-library/react';
