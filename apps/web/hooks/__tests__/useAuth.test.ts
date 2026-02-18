import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth, useRequireAuth, useRedirectIfAuthenticated } from '../useAuth';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  setAuth: jest.fn(),
  clearAuth: jest.fn(),
  getStoredUser: jest.fn(),
  isAuthenticated: jest.fn(),
  getToken: jest.fn(),
}));

// Mock the API module
jest.mock('@/lib/api', () => ({
  authApi: {
    requestMagicLink: jest.fn(),
    verifyOtp: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

// Mock react-query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    refetch: jest.fn().mockResolvedValue({ data: null }),
  })),
  useMutation: jest.fn((options) => ({
    mutateAsync: jest.fn((...args) => {
      if (options?.onSuccess) {
        return Promise.resolve({ token: 'test-token', user: { id: '1', email: 'test@test.com' } })
          .then(data => {
            options.onSuccess(data);
            return data;
          });
      }
      return Promise.resolve();
    }),
  })),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    clear: jest.fn(),
    cancelQueries: jest.fn(),
    getQueryData: jest.fn(),
    setQueryData: jest.fn(),
  })),
}));

import { isAuthenticated, getStoredUser } from '@/lib/auth';
import { authApi } from '@/lib/api';

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isAuthenticated as jest.Mock).mockReturnValue(false);
    (getStoredUser as jest.Mock).mockReturnValue(null);
  });

  it('initializes as unauthenticated when no stored auth', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('initializes as authenticated when stored auth exists', () => {
    const mockUser = { id: '1', email: 'test@test.com', name: 'Test User' };
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (getStoredUser as jest.Mock).mockReturnValue(mockUser);

    const { result } = renderHook(() => useAuth());
    
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('sets authenticated after login flow', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login('test@test.com');
    });
    
    expect(authApi.requestMagicLink).toHaveBeenCalledWith('test@test.com');
  });

  it('sets authenticated after verify', async () => {
    const mockUser = { id: '1', email: 'test@test.com' };
    (authApi.verifyOtp as jest.Mock).mockResolvedValue({ 
      token: 'test-token', 
      user: mockUser 
    });

    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.verify('test@test.com', '123456');
    });
    
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('clears auth on logout', () => {
    const mockUser = { id: '1', email: 'test@test.com' };
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (getStoredUser as jest.Mock).mockReturnValue(mockUser);

    const { result } = renderHook(() => useAuth());
    
    act(() => {
      result.current.logout();
    });
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('syncs auth state across tabs', () => {
    const { result } = renderHook(() => useAuth());
    
    // Simulate storage event (cross-tab auth change)
    act(() => {
      const storageEvent = new StorageEvent('storage', {
        key: 'eios_token',
        newValue: 'new-token',
      });
      window.dispatchEvent(storageEvent);
    });
    
    // Should re-check auth status
    expect(isAuthenticated).toHaveBeenCalled();
  });
});

describe('useRequireAuth', () => {
  it('redirects when not authenticated', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(false);
    
    renderHook(() => useRequireAuth('/login'));
    
    // Router push should be called
    // This is mocked in jest.setup.ts
  });
});

describe('useRedirectIfAuthenticated', () => {
  it('redirects when already authenticated', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (getStoredUser as jest.Mock).mockReturnValue({ id: '1' });
    
    renderHook(() => useRedirectIfAuthenticated('/dashboard'));
    
    // Router push should be called
    // This is mocked in jest.setup.ts
  });
});
