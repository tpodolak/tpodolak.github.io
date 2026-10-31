import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Helper to wait for swup page transition to complete
async function waitForSwupTransition(page: Page): Promise<void> {
  await expect(page.locator('html')).not.toHaveClass(/is-changing/, { timeout: 10000 });
}

test.describe('Blog - Page Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog/');
    await page.waitForLoadState('networkidle');
  });

  test('Blog listing renders with posts on first page', async ({ page }) => {
    const posts = page.locator('main .card-base');

    await expect(posts.first()).toBeVisible();

    const count = await posts.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Pagination component is visible with page numbers', async ({ page }) => {
    const pagination = page.locator('main .flex.flex-row.gap-3.justify-center').first();

    await expect(pagination).toBeVisible();

    const pageLinks = pagination.locator('a.btn-card[href*="/blog/"]');
    const linkCount = await pageLinks.count();
    expect(linkCount).toBeGreaterThan(1);
  });

  test('Clicking page number navigates to that page', async ({ page }) => {
    const pagination = page.locator('main .flex.flex-row.gap-3.justify-center').first();
    const page2Link = pagination.locator('a.btn-card[href="/blog/2/"]').first();

    await expect(page2Link).toBeVisible();

    await page2Link.click();
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    await expect(page).toHaveURL(/\/blog\/2\//);

    const posts = page.locator('main .card-base');
    await expect(posts.first()).toBeVisible();
  });

  test('Next page link navigates forward', async ({ page }) => {
    const nextLink = page.locator('main a[aria-label="Next Page"]').first();

    await expect(nextLink).toBeVisible();

    await nextLink.click();
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    await expect(page).toHaveURL(/\/blog\/2\//);
  });

  test('Previous page link navigates back', async ({ page }) => {
    await page.goto('/blog/2/');
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    const prevLink = page.locator('main a[aria-label="Previous Page"]').first();

    await expect(prevLink).toBeVisible();

    await prevLink.click();
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    await expect(page).toHaveURL(/\/blog\//);
  });
});

test.describe('Blog - Post Navigation', () => {
  test('Clicking post title from blog listing opens correct post', async ({ page }) => {
    await page.goto('/blog/');
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    const firstPostLink = page.locator('main .card-base a[href^="/blog/"]').first();

    await expect(firstPostLink).toBeVisible();

    const expectedUrl = await firstPostLink.getAttribute('href');
    const expectedTitle = await firstPostLink.textContent();

    await firstPostLink.click();
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    await expect(page).toHaveURL(new RegExp(expectedUrl!.replace(/\//g, '\\/')));

    const postTitle = page.locator('[data-pagefind-meta="title"]');
    await expect(postTitle).toBeVisible();
    const actualTitle = await postTitle.textContent();
    expect(actualTitle?.trim()).toBe(expectedTitle?.trim());

    await expect(page.locator('.markdown-content')).toBeVisible();
  });

  test('Root path / redirects to /blog/ or shows posts', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    const posts = page.locator('main .card-base');
    await expect(posts.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Blog - Navbar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog/');
    await page.waitForLoadState('networkidle');
  });

  test('Home link (tpodolak.com) navigates to /blog/', async ({ page }) => {
    const homeLink = page.locator('#navbar a[href="/blog/"]').first();

    await expect(homeLink).toBeVisible();

    await homeLink.click();
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    await expect(page).toHaveURL(/\/blog\//);
  });

  test('Twitter link has correct attributes and external target', async ({ page }) => {
    const twitterLink = page.locator('#navbar a[href="https://twitter.com/tpodolak1"]');

    await expect(twitterLink).toBeVisible();
    await expect(twitterLink).toHaveAttribute('target', '_blank');
    await expect(twitterLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('GitHub link has correct attributes and external target', async ({ page }) => {
    const githubLink = page.locator('#navbar a[href="https://github.com/tpodolak"]');

    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute('target', '_blank');
    await expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('LinkedIn link has correct attributes and external target', async ({ page }) => {
    const linkedinLink = page.locator('#navbar a[href="https://www.linkedin.com/pub/tomasz-podolak/3b/7a5/672"]');

    await expect(linkedinLink).toBeVisible();
    await expect(linkedinLink).toHaveAttribute('target', '_blank');
    await expect(linkedinLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('RSS link has correct attributes and same-tab navigation', async ({ page }) => {
    const rssLink = page.locator('#navbar a[href="/rss.xml"]');

    await expect(rssLink).toBeVisible();
    await expect(rssLink).not.toHaveAttribute('target', '_blank');
  });

  test('RSS link loads valid RSS feed', async ({ page }) => {
    const rssLink = page.locator('#navbar a[href="/rss.xml"]');

    await expect(rssLink).toBeVisible();

    await rssLink.click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/rss\.xml/);

    const contentType = await page.evaluate(() => document.contentType);
    expect(contentType).toMatch(/xml/);

    const pageContent = await page.locator('body').textContent();
    expect(pageContent).toContain('<rss');
    expect(pageContent).toContain('<channel>');
    expect(pageContent).toContain('<item>');
  });

  test('Archive link in menu panel navigates to archive page', async ({ page }) => {
    const menuButton = page.locator('#nav-more-switch, #nav-menu-switch').first();

    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const menuPanel = page.locator('#nav-menu-panel');
    await expect(menuPanel).toBeVisible();

    const archiveLink = page.locator('#nav-menu-panel a[href="/blog/archive/"]');
    await expect(archiveLink).toBeVisible();
    await archiveLink.click();

    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);
    await expect(page).toHaveURL(/\/blog\/archive\//);
    await expect(page.locator('#archive-filters')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Blog - Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog/');
    await page.waitForLoadState('networkidle');
  });

  test('Search button is visible in navbar', async ({ page }) => {
    const searchButton = page.locator('#search-switch');

    await expect(searchButton).toBeVisible();
  });

  test('Clicking search button opens search panel', async ({ page }) => {
    const searchButton = page.locator('#search-switch');

    await searchButton.click();

    const searchPanel = page.locator('#search-panel');
    await expect(searchPanel).not.toHaveClass(/float-panel-closed/);

    const searchInput = page.locator('#search-bar-inside input');
    await expect(searchInput).toBeVisible();
  });

  test('Searching shows results', async ({ page }) => {
    const searchButton = page.locator('#search-switch');

    await searchButton.click();

    const searchInput = page.locator('#search-bar-inside input');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Extjs');

    const results = page.locator('.search-results a');
    await expect(results.first()).toBeVisible({ timeout: 10000 });

    const count = await results.count();
    expect(count).toBeGreaterThan(0);

    const firstResult = results.first();
    const resultUrl = await firstResult.getAttribute('href');
    const resultFullText = await firstResult.textContent();

    await firstResult.click();
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    await expect(page).toHaveURL(new RegExp(resultUrl!.replace(/\//g, '\\/')));

    const postTitle = page.locator('[data-pagefind-meta="title"]');
    await expect(postTitle).toBeVisible();
    const actualTitle = await postTitle.textContent();
    expect(resultFullText?.trim()).toContain(actualTitle?.trim() || '');

    await expect(page.locator('.markdown-content')).toBeVisible();

    const searchPanel = page.locator('#search-panel');
    await expect(searchPanel).toHaveClass(/float-panel-closed/);
  });

  test('Search dropdown closes when clicking outside', async ({ page }) => {
    const searchButton = page.locator('#search-switch');

    await searchButton.click();

    const searchInput = page.locator('#search-bar-inside input');
    await searchInput.fill('test');
    await expect(page.locator('.search-results')).toBeVisible({ timeout: 5000 });

    await page.locator('body').click({ position: { x: 10, y: 10 } });

    const searchPanel = page.locator('#search-panel');
    await expect(searchPanel).toHaveClass(/float-panel-closed/, { timeout: 5000 });
  });
});

test.describe('Blog - Archive Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog/archive/');
    await page.waitForLoadState('networkidle');
  });

  test('Archive page loads with archive panel', async ({ page }) => {
    await expect(page.locator('#archive-filters')).toBeVisible();
    await expect(page.locator('.card-base.px-8.py-6')).toBeVisible({ timeout: 10000 });
  });

  test('Archive panel shows posts grouped by year', async ({ page }) => {
    const archivePanel = page.locator('.card-base.px-8.py-6');

    await expect(archivePanel).toBeVisible();

    const yearHeaders = archivePanel.locator('div:has-text("20")');
    await expect(yearHeaders.first()).toBeVisible({ timeout: 10000 });
  });

  test('Clicking post from archive navigates to post', async ({ page }) => {
    const firstPostLink = page.locator('.card-base.px-8.py-6 a[href^="/blog/"]').first();

    await expect(firstPostLink).toBeVisible();

    const expectedUrl = await firstPostLink.getAttribute('href');

    await firstPostLink.click();
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    await expect(page).toHaveURL(new RegExp(expectedUrl!.replace(/\//g, '\\/')));
    await expect(page.locator('[data-pagefind-meta="title"]')).toBeVisible();
  });

  test('Filtering by category works', async ({ page }) => {
    const categoryLinks = page.locator('#archive-filters a[href*="category="]');
    const firstCategory = categoryLinks.first();
    const categoryUrl = await firstCategory.getAttribute('href');

    await firstCategory.click();
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    await expect(page).toHaveURL(new RegExp(categoryUrl!.replace(/[?&]/g, '\\$&')));

    const posts = page.locator('.card-base.px-8.py-6 a[href^="/blog/"]');
    await expect(posts.first()).toBeVisible({ timeout: 10000 });
  });

  test('Filtering by tag works', async ({ page }) => {
    const tagLinks = page.locator('#archive-filters a[href*="tag="]');
    const firstTag = tagLinks.first();
    const tagUrl = await firstTag.getAttribute('href');

    await firstTag.click();
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    await expect(page).toHaveURL(new RegExp(tagUrl!.replace(/[?&]/g, '\\$&')));

    const posts = page.locator('.card-base.px-8.py-6 a[href^="/blog/"]');
    await expect(posts.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Blog - Theme Switcher (Light/Dark Mode)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog/');
    await page.waitForLoadState('networkidle');
  });

  test('Light/dark mode toggle button exists', async ({ page }) => {
    const themeToggle = page.locator('#scheme-switch');

    await expect(themeToggle).toBeVisible();
  });

  test('Clicking theme toggle changes theme', async ({ page }) => {
    const themeToggle = page.locator('#scheme-switch');

    await expect(themeToggle).toBeVisible();

    const initialTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });

    await themeToggle.click();

    await page.waitForFunction((initial) => {
      const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      return current !== initial;
    }, initialTheme);

    const newTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });

    expect(newTheme).not.toBe(initialTheme);
    expect(['dark', 'light']).toContain(newTheme);
  });

  test('Theme preference persists on navigation', async ({ page }) => {
    const themeToggle = page.locator('#scheme-switch');

    await expect(themeToggle).toBeVisible();

    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });

    await page.goto('/blog/archive/');
    await page.waitForLoadState('networkidle');

    const isDark = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    expect(isDark).toBe(true);
  });
});

test.describe('Blog - Tag/Category Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog/');
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);
  });

  test('Clicking category on blog listing navigates to archive with category filter', async ({ page }) => {
    const firstPostCard = page.locator('main .card-base').first();
    const categoryLink = firstPostCard.locator('a[href*="/blog/archive/?category="]').first();

    await expect(categoryLink).toBeVisible();

    const categoryUrl = await categoryLink.getAttribute('href');
    await categoryLink.click();
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    await expect(page).toHaveURL(new RegExp(categoryUrl!.replace(/[?&]/g, '\\$&')));
    await expect(page.locator('#archive-filters')).toBeVisible({ timeout: 10000 });
  });

  test('Clicking tag on blog listing navigates to archive with tag filter', async ({ page }) => {
    const firstPostCard = page.locator('main .card-base').first();
    const tagLink = firstPostCard.locator('a[href*="/blog/archive/?tag="]').first();

    await expect(tagLink).toBeVisible();

    const tagUrl = await tagLink.getAttribute('href');
    await tagLink.click();
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    await expect(page).toHaveURL(new RegExp(tagUrl!.replace(/[?&]/g, '\\$&')));
    await expect(page.locator('#archive-filters')).toBeVisible({ timeout: 10000 });
  });

  test('Clicking category on single post page navigates to archive with category filter', async ({ page }) => {
    const firstPostLink = page.locator('main .card-base a[href^="/blog/"]').first();
    await firstPostLink.click();
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    const categoryLink = page.locator('#post-container a[href*="/blog/archive/?category="]').first();

    await expect(categoryLink).toBeVisible();

    const categoryUrl = await categoryLink.getAttribute('href');
    await categoryLink.click();
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    await expect(page).toHaveURL(new RegExp(categoryUrl!.replace(/[?&]/g, '\\$&')));
    await expect(page.locator('#archive-filters')).toBeVisible({ timeout: 10000 });
  });

  test('Clicking tag on single post page navigates to archive with tag filter', async ({ page }) => {
    const firstPostLink = page.locator('main .card-base a[href^="/blog/"]').first();
    await firstPostLink.click();
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    const tagLink = page.locator('#post-container a[href*="/blog/archive/?tag="]').first();

    await expect(tagLink).toBeVisible();

    const tagUrl = await tagLink.getAttribute('href');
    await tagLink.click();
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    await expect(page).toHaveURL(new RegExp(tagUrl!.replace(/[?&]/g, '\\$&')));
    await expect(page.locator('#archive-filters')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Blog - Archive Page Highlighting', () => {
  test('Selected category is highlighted in categories list', async ({ page }) => {
    await page.goto('/blog/archive/');
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    const firstCategoryLink = page.locator('#categories filter-links a').first();
    const categoryUrl = await firstCategoryLink.getAttribute('href');

    await page.goto(categoryUrl!);
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    const activeLink = page.locator('#categories filter-links a[data-active]');
    await expect(activeLink.first()).toBeVisible();

    const activeHref = await activeLink.first().getAttribute('href');
    expect(activeHref).toBe(categoryUrl);
  });

  test('Selected tag is highlighted in tags list', async ({ page }) => {
    await page.goto('/blog/archive/');
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    const firstTagLink = page.locator('#tags filter-links a').first();
    const tagUrl = await firstTagLink.getAttribute('href');

    await page.goto(tagUrl!);
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    const activeLink = page.locator('#tags filter-links a[data-active]');
    await expect(activeLink.first()).toBeVisible();

    const activeHref = await activeLink.first().getAttribute('href');
    expect(activeHref).toBe(tagUrl);
  });

  test('Categories list expands when collapsed and category is selected', async ({ page }) => {
    await page.goto('/blog/archive/');
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    const firstCategoryLink = page.locator('#categories filter-links a').first();
    const categoryUrl = await firstCategoryLink.getAttribute('href');

    await page.goto(categoryUrl!);
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    const categoriesWidget = page.locator('widget-layout[data-id="categories"]');
    await expect(categoriesWidget).toBeVisible();

    const categoryWrapper = categoriesWidget.locator('.collapse-wrapper');
    await expect(categoryWrapper).toHaveClass(/collapsed/);

    const expandButton = categoriesWidget.locator('.expand-btn button');
    await expect(expandButton).toBeVisible();

    await expandButton.click();

    await expect(categoryWrapper).not.toHaveClass(/collapsed/);
  });

  test('Tags list expands when collapsed and tag is selected', async ({ page }) => {
    await page.goto('/blog/archive/');
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    const firstTagLink = page.locator('#tags filter-links a').first();
    const tagUrl = await firstTagLink.getAttribute('href');

    await page.goto(tagUrl!);
    await page.waitForLoadState('networkidle');
    await waitForSwupTransition(page);

    const tagsWidget = page.locator('widget-layout[data-id="tags"]');
    await expect(tagsWidget).toBeVisible();

    const tagWrapper = tagsWidget.locator('.collapse-wrapper');
    await expect(tagWrapper).toHaveClass(/collapsed/);

    const expandButton = tagsWidget.locator('.expand-btn button');
    await expect(expandButton).toBeVisible();

    await expandButton.click();

    await expect(tagWrapper).not.toHaveClass(/collapsed/);
  });
});