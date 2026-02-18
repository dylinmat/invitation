# Testing Guide

This project uses Jest + React Testing Library for unit/integration tests and Playwright for E2E tests.

## Running Tests

### Unit/Integration Tests (Jest)

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- ProjectCard.test.tsx
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Debug tests
npm run test:e2e:debug

# Run specific test
npx playwright test auth.spec.ts
```

## Test Structure

```
__tests__/
├── README.md              # This file
├── components/            # Component tests
│   ├── ProjectCard.test.tsx
│   └── DashboardNav.test.tsx
├── hooks/                 # Hook tests
│   ├── useAuth.test.ts
│   ├── useSidebarState.test.ts
│   └── useThrottledScroll.test.ts
├── lib/                   # Utility tests
│   └── performance.test.ts
└── e2e/                   # E2E tests
    ├── auth.spec.ts
    ├── dashboard.spec.ts
    └── projects.spec.ts
```

## Writing Tests

### Component Tests

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Hook Tests

```tsx
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from './useMyHook';

describe('useMyHook', () => {
  it('returns expected state', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe('initial');
  });

  it('updates state on action', () => {
    const { result } = renderHook(() => useMyHook());
    
    act(() => {
      result.current.setValue('new');
    });
    
    expect(result.current.value).toBe('new');
  });
});
```

## Mocking

### Mocking Next.js Router

```tsx
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/dashboard',
}));
```

### Mocking API Calls

```tsx
jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn().mockResolvedValue({ data: [] }),
  },
}));
```

## Best Practices

1. **Test behavior, not implementation** - Focus on what the user sees/interacts with
2. **Use accessible queries** - Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Arrange-Act-Assert** - Structure tests clearly
4. **One assertion per test** - When possible, for clearer failures
5. **Mock external dependencies** - Don't make real API calls in tests
6. **Test edge cases** - Empty states, errors, loading states
7. **Mobile-first** - Include mobile viewport tests for responsive components

## Coverage Thresholds

Current thresholds (configured in `jest.config.ts`):
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

## Debugging

### Jest
```bash
# Debug specific test
node --inspect-brk node_modules/.bin/jest --runInBand --testNamePattern="test name"
```

### Playwright
```bash
# Open UI mode
npx playwright test --ui

# Debug mode
npx playwright test --debug
```
