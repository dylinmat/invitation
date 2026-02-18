import {
  reportWebVitals,
  measurePageLoad,
  debounce,
  throttle,
  requestIdleCallback,
  cancelIdleCallback,
  createIntersectionObserver,
} from '../performance';

describe('Performance Utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('reportWebVitals', () => {
    it('should not throw with valid metric', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const metric = {
        id: 'test-id',
        name: 'LCP' as const,
        value: 100,
        entries: [],
      };
      
      expect(() => reportWebVitals(metric)).not.toThrow();
      consoleSpy.mockRestore();
    });

    it('should log metric in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const metric = {
        id: 'test-id',
        name: 'FCP' as const,
        value: 50,
        entries: [],
      };
      
      reportWebVitals(metric);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Web Vitals] FCP:',
        50
      );
      
      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('debounce', () => {
    it('should delay function execution', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 100);
      
      debouncedFunc();
      expect(func).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on multiple calls', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 100);
      
      debouncedFunc();
      jest.advanceTimersByTime(50);
      debouncedFunc();
      jest.advanceTimersByTime(50);
      
      // First call should not have executed yet
      expect(func).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to debounced function', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 100);
      
      debouncedFunc('arg1', 'arg2');
      jest.advanceTimersByTime(100);
      
      expect(func).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('throttle', () => {
    it('should execute function immediately on first call', () => {
      const func = jest.fn();
      const throttledFunc = throttle(func, 100);
      
      throttledFunc();
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should ignore calls during throttle period', () => {
      const func = jest.fn();
      const throttledFunc = throttle(func, 100);
      
      throttledFunc();
      throttledFunc();
      throttledFunc();
      
      expect(func).toHaveBeenCalledTimes(1);
      
      jest.advanceTimersByTime(100);
      
      // Next call should work after throttle period
      throttledFunc();
      expect(func).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments to throttled function', () => {
      const func = jest.fn();
      const throttledFunc = throttle(func, 100);
      
      throttledFunc('arg1', 'arg2');
      
      expect(func).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('requestIdleCallback', () => {
    it('should return a number', () => {
      const callback = jest.fn();
      const id = requestIdleCallback(callback);
      
      expect(typeof id).toBe('number');
    });

    it('should execute callback', () => {
      const callback = jest.fn();
      requestIdleCallback(callback);
      
      jest.advanceTimersByTime(10);
      
      expect(callback).toHaveBeenCalled();
    });

    it('should provide IdleDeadline-like object', () => {
      const callback = jest.fn();
      requestIdleCallback(callback);
      
      jest.advanceTimersByTime(10);
      
      const deadline = callback.mock.calls[0][0];
      expect(deadline.didTimeout).toBe(false);
      expect(typeof deadline.timeRemaining()).toBe('number');
    });
  });

  describe('cancelIdleCallback', () => {
    it('should not throw with valid id', () => {
      expect(() => cancelIdleCallback(123)).not.toThrow();
    });

    it('should cancel pending callback', () => {
      const callback = jest.fn();
      const id = requestIdleCallback(callback);
      
      cancelIdleCallback(id);
      jest.advanceTimersByTime(10);
      
      // Callback might still be called due to setTimeout behavior
      // but this verifies no errors occur
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('createIntersectionObserver', () => {
    it('should return null on server', () => {
      // Simulate server environment
      const originalWindow = global.window;
      // @ts-expect-error - simulating no window
      global.window = undefined;
      
      const observer = createIntersectionObserver(jest.fn());
      expect(observer).toBeNull();
      
      global.window = originalWindow;
    });

    it('should return observer instance in browser', () => {
      const callback = jest.fn();
      const observer = createIntersectionObserver(callback);
      
      expect(observer).toBeInstanceOf(IntersectionObserver);
    });

    it('should use default options', () => {
      const callback = jest.fn();
      const observer = createIntersectionObserver(callback);
      
      expect(observer).toBeDefined();
    });
  });
});

describe('measurePageLoad', () => {
  it('should not throw when called', () => {
    expect(() => measurePageLoad()).not.toThrow();
  });
});
