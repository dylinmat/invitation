import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set auth cookie to simulate logged-in user
    await context.addCookies([{
      name: 'eios_token',
      value: 'test-token',
      domain: 'localhost',
      path: '/',
    }]);
    
    // Mock API responses
    await page.route('**/api/projects', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([
          { id: '1', name: 'Wedding Event', status: 'active', guestCount: 150 },
          { id: '2', name: 'Birthday Party', status: 'draft', guestCount: 50 },
        ]),
      });
    });
    
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        }),
      });
    });
  });

  test('should display dashboard with projects', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check dashboard loads
    await expect(page.getByRole('heading', { name: /projects|dashboard/i })).toBeVisible();
    
    // Check projects are displayed
    await expect(page.getByText('Wedding Event')).toBeVisible();
    await expect(page.getByText('Birthday Party')).toBeVisible();
  });

  test('should navigate to project details', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click on a project
    const projectCard = page.getByText('Wedding Event').first();
    await projectCard.click();
    
    // Should navigate to project details
    await expect(page).toHaveURL(/.*dashboard\/projects\/1.*/);
  });

  test('should show user profile in header', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check user avatar/name is displayed
    const userMenu = page.getByLabel(/user menu/i);
    await expect(userMenu).toBeVisible();
    
    // Click to open dropdown
    await userMenu.click();
    
    // Should show user email
    await expect(page.getByText('test@example.com')).toBeVisible();
  });

  test('should navigate to settings', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Open user menu
    const userMenu = page.getByLabel(/user menu/i);
    await userMenu.click();
    
    // Click settings
    const settingsLink = page.getByRole('menuitem', { name: /settings|profile/i });
    await settingsLink.click();
    
    // Should navigate to settings page
    await expect(page).toHaveURL(/.*dashboard\/settings.*/);
  });
});

test.describe('Mobile Dashboard', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([{
      name: 'eios_token',
      value: 'test-token',
      domain: 'localhost',
      path: '/',
    }]);
  });

  test('should show mobile navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Mobile menu button should be visible
    const menuButton = page.getByLabel(/open menu/i);
    await expect(menuButton).toBeVisible();
    
    // Bottom navigation should be visible
    const bottomNav = page.locator('nav').filter({ hasText: /projects|calendar|settings/i }).last();
    await expect(bottomNav).toBeVisible();
  });

  test('should open mobile sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click menu button
    const menuButton = page.getByLabel(/open menu/i);
    await menuButton.click();
    
    // Sidebar should be visible
    const sidebar = page.locator('[data-sidebar="mobile"]');
    await expect(sidebar).toBeVisible();
    
    // Close button should be visible
    const closeButton = page.getByLabel(/close menu/i);
    await expect(closeButton).toBeVisible();
    
    // Click close button
    await closeButton.click();
    
    // Sidebar should be hidden
    await expect(sidebar).not.toBeVisible();
  });

  test('should have minimum touch targets', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check navigation items have minimum 44px touch target
    const navLinks = page.locator('nav a');
    const count = await navLinks.count();
    
    for (let i = 0; i < count; i++) {
      const box = await navLinks.nth(i).boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

test.describe('Dashboard Accessibility', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([{
      name: 'eios_token',
      value: 'test-token',
      domain: 'localhost',
      path: '/',
    }]];
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    
    // Check that h1 is first heading
    const headings = page.locator('h1, h2, h3');
    const firstHeading = await headings.first().evaluate(el => el.tagName);
    expect(firstHeading).toBe('H1');
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check nav has aria-label or is in landmark
    const nav = page.locator('nav').first();
    const ariaLabel = await nav.getAttribute('aria-label');
    const hasNavRole = await nav.getAttribute('role');
    
    expect(ariaLabel || hasNavRole).toBeTruthy();
  });
});
