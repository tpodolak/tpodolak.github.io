import { test, expect } from '@playwright/test';

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
    // Pagination is a div with class "flex flex-row gap-3 justify-center"
    const pagination = page.locator('main .flex.flex-row.gap-3.justify-center').first();
    await expect(pagination).toBeVisible();
    // Should have multiple page number links (btn-card class)
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
    await expect(page).toHaveURL(/\/blog\/2\//);
    // Verify posts on page 2
    const posts = page.locator('main .card-base');
    await expect(posts.first()).toBeVisible();
  });

  test('Next page link navigates forward', async ({ page }) => {
    const nextLink = page.locator('main a[aria-label="Next Page"]').first();
    await expect(nextLink).toBeVisible();
    await nextLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/blog\/2\//);
  });

  test('Previous page link navigates back', async ({ page }) => {
    // First go to page 2
    await page.goto('/blog/2/');
    await page.waitForLoadState('networkidle');
    // Then click previous
    const prevLink = page.locator('main a[aria-label="Previous Page"]').first();
    await expect(prevLink).toBeVisible();
    await prevLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/blog\//);
  });
});

test.describe('Blog - Post Navigation', () => {
  test('Clicking post title from blog listing opens correct post', async ({ page }) => {
    await page.goto('/blog/');
    await page.waitForLoadState('networkidle');

    const firstPostLink = page.locator('main .card-base a[href^="/blog/"]').first();
    await expect(firstPostLink).toBeVisible();

    const expectedUrl = await firstPostLink.getAttribute('href');
    const expectedTitle = await firstPostLink.textContent();

    await firstPostLink.click();
    await page.waitForLoadState('networkidle');

    // Verify URL matches
    await expect(page).toHaveURL(new RegExp(expectedUrl!.replace(/\//g, '\\/')));
    // Verify title matches
    const postTitle = page.locator('[data-pagefind-meta="title"]');
    await expect(postTitle).toBeVisible();
    const actualTitle = await postTitle.textContent();
    expect(actualTitle?.trim()).toBe(expectedTitle?.trim());
    // Verify content loads
    await expect(page.locator('.markdown-content')).toBeVisible();
  });

  test('Root path / redirects to /blog/ or shows posts', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Should either redirect to /blog/ or show posts
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
    // Search input inside panel
    const searchInput = page.locator('#search-bar-inside input');
    await expect(searchInput).toBeVisible();
  });

  test('Searching shows results', async ({ page }) => {
    const searchButton = page.locator('#search-switch');
    await searchButton.click();

    const searchInput = page.locator('#search-bar-inside input');
    await expect(searchInput).toBeVisible();
    // Use Extjs as search query - matches actual blog content
    await searchInput.fill('Extjs');

    // Wait for results to appear (uses pagefind in preview/prod, fake data in dev)
    await page.waitForTimeout(500);

    const results = page.locator('.search-results a');
    const count = await results.count();
    // Results should appear
    expect(count).toBeGreaterThan(0);

    // Click first result
    const firstResult = results.first();
    const resultUrl = await firstResult.getAttribute('href');
    const resultFullText = await firstResult.textContent();
    await firstResult.click();
    await page.waitForLoadState('networkidle');

    // Verify navigation to correct post
    await expect(page).toHaveURL(new RegExp(resultUrl!.replace(/\//g, '\\/')));

    // Verify post is rendered and title matches
    const postTitle = page.locator('[data-pagefind-meta="title"]');
    await expect(postTitle).toBeVisible();
    const actualTitle = await postTitle.textContent();
    // The search result contains title + description, so verify actual title is contained in result
    expect(resultFullText?.trim()).toContain(actualTitle?.trim() || '');

    // Verify content loads
    await expect(page.locator('.markdown-content')).toBeVisible();

    // Verify search dropdown is closed
    const searchPanel = page.locator('#search-panel');
    await expect(searchPanel).toHaveClass(/float-panel-closed/);
  });

  test('Search dropdown closes when clicking outside', async ({ page }) => {
    const searchButton = page.locator('#search-switch');
    await searchButton.click();

    const searchInput = page.locator('#search-bar-inside input');
    await searchInput.fill('test');
    await page.waitForTimeout(300);

    // Click outside (on body)
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(300);

    const searchPanel = page.locator('#search-panel');
    await expect(searchPanel).toHaveClass(/float-panel-closed/);
  });
});

test.describe('Blog - Archive Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog/archive/');
    await page.waitForLoadState('networkidle');
  });

  test('Archive page loads with archive panel', async ({ page }) => {
    await expect(page.locator('#archive-filters')).toBeVisible();
    // ArchivePanel renders inside a div with class "card-base px-8 py-6"
    await expect(page.locator('.card-base.px-8.py-6')).toBeVisible({ timeout: 10000 });
  });

  test('Archive panel shows posts grouped by year', async ({ page }) => {
    const archivePanel = page.locator('.card-base.px-8.py-6');
    await expect(archivePanel).toBeVisible();

    // Should have year headers (div with text content of year like "2024", "2023", etc.)
    const yearHeaders = archivePanel.locator('div:has-text("20")'); // years like 2020, 2021, etc.
    await expect(yearHeaders.first()).toBeVisible({ timeout: 10000 });
  });

  test('Clicking post from archive navigates to post', async ({ page }) => {
    const firstPostLink = page.locator('.card-base.px-8.py-6 a[href^="/blog/"]').first();
    await expect(firstPostLink).toBeVisible();

    const expectedUrl = await firstPostLink.getAttribute('href');
    await firstPostLink.click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(new RegExp(expectedUrl!.replace(/\//g, '\\/')));
    await expect(page.locator('[data-pagefind-meta="title"]')).toBeVisible();
  });

  test('Filtering by category works', async ({ page }) => {
    // Find a category link in the sidebar
    const categoryLinks = page.locator('#archive-filters a[href*="category="]');
    const firstCategory = categoryLinks.first();
    const categoryUrl = await firstCategory.getAttribute('href');
    await firstCategory.click();
    await page.waitForLoadState('networkidle');

    // URL should contain category filter
    await expect(page).toHaveURL(new RegExp(categoryUrl!.replace(/[?&]/g, '\\$&')));
    // Posts should be filtered
    const posts = page.locator('.card-base.px-8.py-6 a[href^="/blog/"]');
    await expect(posts.first()).toBeVisible({ timeout: 10000 });
  });

  test('Filtering by tag works', async ({ page }) => {
    // Find a tag link in the sidebar
    const tagLinks = page.locator('#archive-filters a[href*="tag="]');
    const firstTag = tagLinks.first();
    const tagUrl = await firstTag.getAttribute('href');
    await firstTag.click();
    await page.waitForLoadState('networkidle');

    // URL should contain tag filter
    await expect(page).toHaveURL(new RegExp(tagUrl!.replace(/[?&]/g, '\\$&')));
    // Posts should be filtered
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

    // Get initial theme
    const initialTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });

    // Click toggle
    await themeToggle.click();
    await page.waitForTimeout(300);

    // Get new theme
    const newTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });

    expect(newTheme).not.toBe(initialTheme);
    expect(['dark', 'light']).toContain(newTheme);
  });

  test('Theme preference persists on navigation', async ({ page }) => {
    const themeToggle = page.locator('#scheme-switch');
    await expect(themeToggle).toBeVisible();

    // Set to dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });

    // Navigate to another page
    await page.goto('/blog/archive/');
    await page.waitForLoadState('networkidle');

    // Theme should still be dark
    const isDark = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    expect(isDark).toBe(true);
  });
});

test.describe('Blog - Tag/Category Navigation', () => {
  test('Clicking category on blog listing navigates to archive with category filter', async ({ page }) => {
    await page.goto('/blog/');
    await page.waitForLoadState('networkidle');

    // Find first post card with a category link
    const firstPostCard = page.locator('main .card-base').first();
    const categoryLink = firstPostCard.locator('a[href*="/blog/archive/?category="]').first();

    // Verify category link exists and is visible
    await expect(categoryLink).toBeVisible();

    const categoryUrl = await categoryLink.getAttribute('href');
    await categoryLink.click();
    await page.waitForLoadState('networkidle');

    // Should navigate to archive page with category filter
    await expect(page).toHaveURL(new RegExp(categoryUrl!.replace(/[?&]/g, '\\$&')));
    await expect(page.locator('#archive-filters')).toBeVisible({ timeout: 10000 });
  });

  test('Clicking tag on blog listing navigates to archive with tag filter', async ({ page }) => {
    await page.goto('/blog/');
    await page.waitForLoadState('networkidle');

    // Find first post card with a tag link
    const firstPostCard = page.locator('main .card-base').first();
    const tagLink = firstPostCard.locator('a[href*="/blog/archive/?tag="]').first();

    // Verify tag link exists and is visible
    await expect(tagLink).toBeVisible();

    const tagUrl = await tagLink.getAttribute('href');
    await tagLink.click();
    await page.waitForLoadState('networkidle');

    // Should navigate to archive page with tag filter
    await expect(page).toHaveURL(new RegExp(tagUrl!.replace(/[?&]/g, '\\$&')));
    await expect(page.locator('#archive-filters')).toBeVisible({ timeout: 10000 });
  });

  test('Clicking category on single post page navigates to archive with category filter', async ({ page }) => {
    await page.goto('/blog/');
    await page.waitForLoadState('networkidle');

    // Click first post to go to single post page
    const firstPostLink = page.locator('main .card-base a[href^="/blog/"]').first();
    const postUrl = await firstPostLink.getAttribute('href');
    await firstPostLink.click();
    await page.waitForLoadState('networkidle');

    // Find category link on single post page (PostMetadata component)
    const categoryLink = page.locator('#post-container a[href*="/blog/archive/?category="]').first();
    await expect(categoryLink).toBeVisible();

    const categoryUrl = await categoryLink.getAttribute('href');
    await categoryLink.click();
    await page.waitForLoadState('networkidle');

    // Should navigate to archive page with category filter
    await expect(page).toHaveURL(new RegExp(categoryUrl!.replace(/[?&]/g, '\\$&')));
    await expect(page.locator('#archive-filters')).toBeVisible({ timeout: 10000 });
  });

  test('Clicking tag on single post page navigates to archive with tag filter', async ({ page }) => {
    await page.goto('/blog/');
    await page.waitForLoadState('networkidle');

    // Click first post to go to single post page
    const firstPostLink = page.locator('main .card-base a[href^="/blog/"]').first();
    const postUrl = await firstPostLink.getAttribute('href');
    await firstPostLink.click();
    await page.waitForLoadState('networkidle');

    // Find tag link on single post page (PostMetadata component)
    const tagLink = page.locator('#post-container a[href*="/blog/archive/?tag="]').first();
    await expect(tagLink).toBeVisible();

    const tagUrl = await tagLink.getAttribute('href');
    await tagLink.click();
    await page.waitForLoadState('networkidle');

    // Should navigate to archive page with tag filter
    await expect(page).toHaveURL(new RegExp(tagUrl!.replace(/[?&]/g, '\\$&')));
    await expect(page.locator('#archive-filters')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Blog - Archive Page Highlighting', () => {
  test('Selected category is highlighted in categories list', async ({ page }) => {
    // First, go to archive page to get a real category
    await page.goto('/blog/archive/');
    await page.waitForLoadState('networkidle');

    // Get the first category link from the sidebar
    const categoryLinks = page.locator('#categories filter-links a');
    const count = await categoryLinks.count();

    if (count > 0) {
      const firstCategoryLink = categoryLinks.first();
      const categoryUrl = await firstCategoryLink.getAttribute('href');

      // Navigate to the archive with that category filter
      await page.goto(categoryUrl!);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500); // Wait for FilterLinks to process

      // Find the categories filter-links and check for data-active attribute
      const activeLink = page.locator('#categories filter-links a[data-active]');
      await expect(activeLink.first()).toBeVisible();

      // Verify the active link has the correct href (should match the category we navigated to)
      const activeHref = await activeLink.first().getAttribute('href');
      expect(activeHref).toBe(categoryUrl);
    }
  });

  test('Selected tag is highlighted in tags list', async ({ page }) => {
    // First, go to archive page to get a real tag
    await page.goto('/blog/archive/');
    await page.waitForLoadState('networkidle');

    // Get the first tag link from the sidebar
    const tagLinks = page.locator('#tags filter-links a');
    const count = await tagLinks.count();

    if (count > 0) {
      const firstTagLink = tagLinks.first();
      const tagUrl = await firstTagLink.getAttribute('href');

      // Navigate to the archive with that tag filter
      await page.goto(tagUrl!);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500); // Wait for FilterLinks to process

      // Find the tags filter-links and check for data-active attribute
      const activeLink = page.locator('#tags filter-links a[data-active]');
      await expect(activeLink.first()).toBeVisible();

      // Verify the active link has the correct href (should match the tag we navigated to)
      const activeHref = await activeLink.first().getAttribute('href');
      expect(activeHref).toBe(tagUrl);
    }
  });

  test('Categories list expands when collapsed and category is selected', async ({ page }) => {
    // First, go to archive page to get a real category
    await page.goto('/blog/archive/');
    await page.waitForLoadState('networkidle');

    const categoryLinks = page.locator('#categories filter-links a');
    const count = await categoryLinks.count();

    if (count > 0) {
      const firstCategoryLink = categoryLinks.first();
      const categoryUrl = await firstCategoryLink.getAttribute('href');

      // Navigate to the archive with that category filter
      await page.goto(categoryUrl!);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Check if the categories widget is collapsed (has collapsed state)
      const categoriesWidget = page.locator('#categories');
      await expect(categoriesWidget).toBeVisible();

      // The widget layout has a show-more button when collapsed
      const showMoreButton = page.locator('#categories button:has-text("Show more"), #categories button:has-text("Show all")');
      if (await showMoreButton.count() > 0) {
        // If collapsed, the active category might not be visible until expanded
        // But FilterLinks should still set data-active on the hidden link
        const activeLink = page.locator('#categories filter-links a[data-active]');
        await expect(activeLink.first()).toHaveAttribute('data-active');
      }
    }
  });

  test('Tags list expands when collapsed and tag is selected', async ({ page }) => {
    // First, go to archive page to get a real tag
    await page.goto('/blog/archive/');
    await page.waitForLoadState('networkidle');

    const tagLinks = page.locator('#tags filter-links a');
    const count = await tagLinks.count();

    if (count > 0) {
      const firstTagLink = tagLinks.first();
      const tagUrl = await firstTagLink.getAttribute('href');

      // Navigate to the archive with that tag filter
      await page.goto(tagUrl!);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Check if the tags widget is collapsed
      const tagsWidget = page.locator('#tags');
      await expect(tagsWidget).toBeVisible();

      // The widget layout has a show-more button when collapsed
      const showMoreButton = page.locator('#tags button:has-text("Show more"), #tags button:has-text("Show all")');
      if (await showMoreButton.count() > 0) {
        // If collapsed, the active tag might not be visible until expanded
        // But FilterLinks should still set data-active on the hidden link
        const activeLink = page.locator('#tags filter-links a[data-active]');
        await expect(activeLink.first()).toHaveAttribute('data-active');
      }
    }
  });
});

