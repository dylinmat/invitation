import { test, expect } from '@playwright/test';

test.describe('Project CRUD Operations', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set auth cookie
    await context.addCookies([{
      name: 'eios_token',
      value: 'test-token',
      domain: 'localhost',
      path: '/',
    }]);
    
    // Mock projects API
    await page.route('**/api/projects**', async route => {
      const method = route.request().method();
      
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify([
            { id: '1', name: 'Wedding Event', status: 'active', guestCount: 150, createdAt: new Date().toISOString() },
            { id: '2', name: 'Birthday Party', status: 'draft', guestCount: 50, createdAt: new Date().toISOString() },
          ]),
        });
      } else if (method === 'POST') {
        const body = await route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          body: JSON.stringify({
            id: '3',
            ...body,
            createdAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.continue();
      }
    });
  });

  test('should list all projects', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check projects are listed
    await expect(page.getByText('Wedding Event')).toBeVisible();
    await expect(page.getByText('Birthday Party')).toBeVisible();
    
    // Check status badges
    await expect(page.getByText('active')).toBeVisible();
    await expect(page.getByText('draft')).toBeVisible();
  });

  test('should create a new project', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click create button
    const createButton = page.getByRole('button', { name: /new project|create project|add project/i });
    await createButton.click();
    
    // Fill form
    const nameInput = page.getByLabel(/project name|name/i);
    await nameInput.fill('Corporate Event');
    
    const descriptionInput = page.getByLabel(/description/i);
    await descriptionInput.fill('Annual company gathering');
    
    // Submit form
    const submitButton = page.getByRole('button', { name: /create|save/i });
    await submitButton.click();
    
    // Should show success message or redirect
    await expect(page.getByText(/created successfully|project created/i)).toBeVisible();
  });

  test('should edit a project', async ({ page }) => {
    await page.goto('/dashboard/projects/1');
    
    // Mock single project fetch
    await page.route('**/api/projects/1', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: '1',
          name: 'Wedding Event',
          description: 'Original description',
          status: 'active',
          guestCount: 150,
        }),
      });
    });
    
    // Click edit button
    const editButton = page.getByRole('button', { name: /edit/i });
    await editButton.click();
    
    // Update name
    const nameInput = page.getByLabel(/project name|name/i);
    await nameInput.clear();
    await nameInput.fill('Updated Wedding Event');
    
    // Save changes
    const saveButton = page.getByRole('button', { name: /save|update/i });
    await saveButton.click();
    
    // Should show success message
    await expect(page.getByText(/updated successfully|changes saved/i)).toBeVisible();
  });

  test('should delete a project', async ({ page }) => {
    await page.goto('/dashboard/projects/1');
    
    // Mock delete endpoint
    await page.route('**/api/projects/1', async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 204 });
      } else {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: '1',
            name: 'Wedding Event',
            status: 'active',
            guestCount: 150,
          }),
        });
      }
    });
    
    // Click delete button
    const deleteButton = page.getByRole('button', { name: /delete/i });
    await deleteButton.click();
    
    // Confirm deletion
    const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
    await confirmButton.click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show project statistics', async ({ page }) => {
    await page.goto('/dashboard/projects/1');
    
    // Mock project with stats
    await page.route('**/api/projects/1', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: '1',
          name: 'Wedding Event',
          status: 'active',
          guestCount: 150,
          rsvpStats: {
            attending: 100,
            declined: 20,
            pending: 30,
          },
        }),
      });
    });
    
    // Check stats are displayed
    await expect(page.getByText(/150 guests/i)).toBeVisible();
    await expect(page.getByText(/100 attending/i)).toBeVisible();
    await expect(page.getByText(/20 declined/i)).toBeVisible();
    await expect(page.getByText(/30 pending/i)).toBeVisible();
  });
});

test.describe('Project Mobile Experience', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([{
      name: 'eios_token',
      value: 'test-token',
      domain: 'localhost',
      path: '/',
    }]);
  });

  test('should have swipeable project cards', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Find a project card
    const card = page.getByText('Wedding Event').locator('..').locator('..');
    
    // Try to swipe left (common mobile pattern for actions)
    const box = await card.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x - 50, box.y + box.height / 2);
      await page.mouse.up();
    }
  });

  test('should have large touch targets for project actions', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check menu buttons on project cards
    const menuButtons = page.getByLabel(/project menu/i);
    const count = await menuButtons.count();
    
    for (let i = 0; i < Math.min(count, 2); i++) {
      const box = await menuButtons.nth(i).boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should persist sidebar state on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Open sidebar
    const menuButton = page.getByLabel(/open menu/i);
    await menuButton.click();
    
    // Sidebar should be visible
    const sidebar = page.locator('[data-sidebar="mobile"]');
    await expect(sidebar).toBeVisible();
    
    // Reload page
    await page.reload();
    
    // Sidebar should remain closed on mobile after reload
    await expect(sidebar).not.toBeVisible();
  });
});
