const { chromium } = require('playwright');

(async () => {
  console.log('Starting mobile test...');
  const browser = await chromium.launch({ 
    headless: true,
    timeout: 30000
  });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
    });
    
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    
    console.log('Navigating to localhost:3000...');
    await page.goto('http://localhost:3000/', { 
      waitUntil: 'load',
      timeout: 10000 
    });
    
    console.log('Waiting for content...');
    await page.waitForTimeout(2000);
    
    console.log('Taking screenshot...');
    await page.screenshot({ 
      path: 'mobile-dashboard.png', 
      fullPage: true 
    });
    
    console.log('✅ Screenshot saved: mobile-dashboard.png');
    
    // Quick checks
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    const headerExists = await page.locator('.header').count() > 0;
    console.log(`Header found: ${headerExists}`);
    
    const statsGridExists = await page.locator('.stats-grid').count() > 0;
    console.log(`Stats grid found: ${statsGridExists}`);
    
    const tableExists = await page.locator('table').count() > 0;
    console.log(`Table found: ${tableExists}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
})();
