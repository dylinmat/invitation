import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check page title and content
    await expect(page).toHaveTitle(/Login|Sign In/i);
    await expect(page.getByRole('heading', { name: /sign in|login/i })).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Try to submit with invalid email
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('invalid-email');
    
    const submitButton = page.getByRole('button', { name: /send|submit|sign in/i });
    await submitButton.click();
    
    // Should show validation error
    await expect(page.getByText(/invalid email|please enter a valid email/i)).toBeVisible();
  });

  test('should request magic link with valid email', async ({ page }) => {
    await page.goto('/auth/login');
    
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('test@example.com');
    
    const submitButton = page.getByRole('button', { name: /send|submit|sign in/i });
    
    // Mock successful API response
    await page.route('**/api/auth/magic-link', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
      });
    });
    
    await submitButton.click();
    
    // Should show success message or redirect to verify page
    await expect(
      page.getByText(/check your email|magic link sent|verification code/i)
    ).toBeVisible();
  });

  test('should redirect to dashboard after successful verification', async ({ page }) => {
    // Navigate to verify page with token
    await page.goto('/auth/verify?email=test@example.com');
    
    // Mock successful verification
    await page.route('**/api/auth/verify', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ 
          token: 'test-token',
          user: { id: '1', email: 'test@example.com', name: 'Test User' }
        }),
      });
    });
    
    // Fill OTP code
    const otpInputs = page.locator('[data-testid="otp-input"] input, input[type="text"][maxlength="1"]');
    if (await otpInputs.count() > 0) {
      await otpInputs.first().fill('123456');
    } else {
      // Alternative: single input for full code
      await page.getByLabel(/verification code|otp/i).fill('123456');
    }
    
    const verifyButton = page.getByRole('button', { name: /verify|confirm/i });
    await verifyButton.click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard.*/);
  });

  test('should redirect authenticated users away from login', async ({ page, context }) => {
    // Set auth cookie to simulate logged-in user
    await context.addCookies([{
      name: 'eios_token',
      value: 'test-token',
      domain: 'localhost',
      path: '/',
    }]);
    
    await page.goto('/auth/login');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard.*/);
  });

  test('should logout successfully', async ({ page, context }) => {
    // Set auth cookie
    await context.addCookies([{
      name: 'eios_token',
      value: 'test-token',
      domain: 'localhost',
      path: '/',
    }]);
    
    await page.goto('/dashboard');
    
    // Click user menu
    const userMenu = page.getByLabel(/user menu/i);
    await userMenu.click();
    
    // Click logout
    const logoutButton = page.getByRole('menuitem', { name: /logout|sign out/i });
    await logoutButton.click();
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*auth\/login.*/);
  });
});

test.describe('Mobile Authentication', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should show mobile-optimized login form', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Form should be accessible on mobile
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();
    
    // Check touch targets are at least 44px
    const submitButton = page.getByRole('button', { name: /send|submit|sign in/i });
    const buttonBox = await submitButton.boundingBox();
    expect(buttonBox?.width).toBeGreaterThanOrEqual(44);
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
  });
});
