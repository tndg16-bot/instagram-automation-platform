import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can login', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[name="email"]', 'wrong@example.com');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('displays Instagram accounts', async ({ page }) => {
    await expect(page.locator('text=Instagram Accounts')).toBeVisible();
    await expect(page.locator('[data-testid="account-card"]')).toHaveCount.greaterThan(0);
  });

  test('can navigate to auto settings', async ({ page }) => {
    await page.click('text=Auto Settings');
    await expect(page).toHaveURL('/auto');
    await expect(page.locator('text=自動化設定')).toBeVisible();
  });

  test('can navigate to workflows', async ({ page }) => {
    await page.click('text=Workflows');
    await expect(page).toHaveURL('/workflows/builder');
    await expect(page.locator('text=ワークフロービルダー')).toBeVisible();
  });
});

test.describe('Workflow Builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.goto('/workflows/builder');
  });

  test('can create new workflow', async ({ page }) => {
    await page.click('text=+ 新規ワークフロー');
    
    await page.fill('[placeholder="ワークフロー名"]', 'Test Workflow');
    await page.click('text=🚀 トリガー');
    await page.click('text=⚡ アクション');
    
    await page.click('text=保存');
    
    await expect(page.locator('text=Test Workflow')).toBeVisible();
  });

  test('can add nodes to workflow', async ({ page }) => {
    await page.click('text=+ 新規ワークフロー');
    
    // Add trigger node
    await page.click('text=🚀 トリガー');
    await expect(page.locator('text=トリガー')).toBeVisible();
    
    // Add action node
    await page.click('text=⚡ アクション');
    await expect(page.locator('text=アクション')).toBeVisible();
    
    // Add condition node
    await page.click('text=🔀 条件分岐');
    await expect(page.locator('text=条件分岐')).toBeVisible();
  });
});

test.describe('Auto Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.goto('/auto');
  });

  test('can configure auto-like settings', async ({ page }) => {
    await expect(page.locator('text=自動いいね')).toBeVisible();
    
    // Enable auto-like
    await page.click('input[type="checkbox"]');
    
    // Add hashtag
    await page.fill('input[placeholder="ハッシュタグを追加"]', 'marketing');
    await page.press('input[placeholder="ハッシュタグを追加"]', 'Enter');
    
    await expect(page.locator('text=#marketing')).toBeVisible();
    
    // Save settings
    await page.click('text=設定を保存');
    await expect(page.locator('text=設定を保存しました')).toBeVisible();
  });

  test('can switch to auto-follow tab', async ({ page }) => {
    await page.click('text=自動フォロー');
    
    await expect(page.locator('text=自動フォローを有効にする')).toBeVisible();
  });
});

test.describe('API Integration', () => {
  test('API health check', async ({ request }) => {
    const response = await request.get('http://localhost:8000/health');
    expect(response.ok()).toBeTruthy();
    
    const body = await response.json();
    expect(body.status).toBe('ok');
  });

  test('API requires authentication', async ({ request }) => {
    const response = await request.get('http://localhost:8000/api/auth/me');
    expect(response.status()).toBe(401);
  });
});
