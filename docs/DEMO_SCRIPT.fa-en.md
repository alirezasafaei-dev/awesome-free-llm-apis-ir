# Demo Script / Storyboard

## Duration: ~30 seconds

## Shot List

### Shot 1: Home (0-5s)
- Open `https://llm.persiantoolbox.ir/`
- Show the hero section with stats: 22 providers, 6 guides
- Show the search bar and filter controls

### Shot 2: Filter/Advisor (5-10s)
- Use the filter to select "سهمیه دائمی" (permanent allowance)
- Show filtered results
- Or use the Advisor section to select "چت" use case

### Shot 3: Provider Page (10-18s)
- Click on a provider (e.g., Groq or Cloudflare)
- Show the provider detail page
- Highlight: quota limits, OpenAI compatibility, Iran access status
- Show the "Copy Base URL" button

### Shot 4: Copy Base URL (18-22s)
- Click "کپی" button
- Show visual feedback

### Shot 5: Guide Page (22-27s)
- Navigate to a guide (e.g., "بهترین API رایگان LLM برای ایران")
- Show comparison table or key content

### Shot 6: GitHub Link (27-30s)
- Click GitHub link in footer or header
- Show repository page

## Playwright Commands (for automation)

```javascript
// 1. Home
await page.goto('https://llm.persiantoolbox.ir/');
await page.waitForSelector('.provider-grid');

// 2. Filter
await page.selectElement('#free-type', 'permanent_allowance');
await page.waitForTimeout(500);

// 3. Provider page
await page.click('a[href*="/providers/groq/"]');
await page.waitForSelector('.provider-detail');

// 4. Copy Base URL
await page.click('.copy-button');

// 5. Guide
await page.goto('https://llm.persiantoolbox.ir/guides/best-free-llm-api-iran/');
await page.waitForSelector('.guide-content');

// 6. GitHub
await page.click('a[href*="github.com"]');
```

## Recording Notes

- No browser toolbar, bookmarks, or extensions visible
- No account names, notifications, or DevTools
- Clean viewport (1920×1080 for desktop, 1080×1920 for mobile)
- No copyrighted music
