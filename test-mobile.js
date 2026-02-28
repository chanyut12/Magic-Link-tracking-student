const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  });
  
  const page = await context.newPage();
  
  console.log('📱 Testing STS Dashboard on Mobile Viewport (375x812)');
  console.log('=' .repeat(60));
  
  try {
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);
    console.log('✅ Page loaded successfully\n');
    
    // Take screenshot
    await page.screenshot({ path: 'mobile-dashboard-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved: mobile-dashboard-screenshot.png\n');
    
    // Check header
    console.log('🔍 HEADER CHECK:');
    const header = await page.locator('.header').first();
    const headerVisible = await header.isVisible();
    const headerText = await header.textContent();
    console.log(`   Visible: ${headerVisible ? '✅' : '❌'}`);
    console.log(`   Text: "${headerText.trim().substring(0, 50)}..."`);
    
    const h1 = await page.locator('.header h1').first();
    const h1Box = await h1.boundingBox();
    if (h1Box) {
      console.log(`   H1 width: ${h1Box.width}px (viewport: 375px)`);
      console.log(`   Readable: ${h1Box.width <= 375 ? '✅' : '⚠️  May overflow'}`);
    }
    console.log('');
    
    // Check "สร้างภารกิจ" button
    console.log('🔍 CREATE TASK BUTTON CHECK:');
    const createBtn = await page.locator('button:has-text("สร้างภารกิจ")').first();
    const createBtnVisible = await createBtn.isVisible().catch(() => false);
    console.log(`   Visible: ${createBtnVisible ? '✅' : '❌'}`);
    if (createBtnVisible) {
      const btnBox = await createBtn.boundingBox();
      if (btnBox) {
        console.log(`   Position: x=${Math.round(btnBox.x)}px, y=${Math.round(btnBox.y)}px`);
        console.log(`   Size: ${Math.round(btnBox.width)}px × ${Math.round(btnBox.height)}px`);
        console.log(`   Within viewport: ${btnBox.x >= 0 && btnBox.x + btnBox.width <= 375 ? '✅' : '⚠️'}`);
      }
    }
    console.log('');
    
    // Check stats grid
    console.log('🔍 STATS GRID CHECK:');
    const statsGrid = await page.locator('.stats-grid').first();
    const statsVisible = await statsGrid.isVisible();
    console.log(`   Visible: ${statsVisible ? '✅' : '❌'}`);
    
    const statCards = await page.locator('.stat-card').all();
    console.log(`   Number of stat cards: ${statCards.length}`);
    
    if (statCards.length > 0) {
      const gridBox = await statsGrid.boundingBox();
      if (gridBox) {
        console.log(`   Grid width: ${Math.round(gridBox.width)}px`);
        console.log(`   Fits in viewport: ${gridBox.width <= 375 ? '✅' : '⚠️  Horizontal scroll needed'}`);
      }
      
      // Check individual card sizes
      let cardIndex = 0;
      for (const card of statCards.slice(0, 4)) {
        const cardBox = await card.boundingBox();
        if (cardBox) {
          console.log(`   Card ${cardIndex + 1}: ${Math.round(cardBox.width)}px wide`);
          cardIndex++;
        }
      }
    }
    console.log('');
    
    // Check table
    console.log('🔍 TABLE CHECK:');
    const table = await page.locator('table').first();
    const tableVisible = await table.isVisible().catch(() => false);
    console.log(`   Visible: ${tableVisible ? '✅' : '❌'}`);
    
    if (tableVisible) {
      const tableBox = await table.boundingBox();
      if (tableBox) {
        console.log(`   Table width: ${Math.round(tableBox.width)}px`);
        console.log(`   Wider than viewport: ${tableBox.width > 375 ? '✅ (horizontal scroll expected)' : '⚠️  May be too narrow'}`);
      }
      
      // Check if table has wrapper for horizontal scroll
      const tableWrapper = await page.locator('.table-wrapper, .table-container').first();
      const hasWrapper = await tableWrapper.isVisible().catch(() => false);
      console.log(`   Scrollable wrapper: ${hasWrapper ? '✅' : '⚠️  No wrapper detected'}`);
      
      if (hasWrapper) {
        const wrapperStyle = await tableWrapper.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            overflowX: style.overflowX,
            maxWidth: style.maxWidth
          };
        });
        console.log(`   Wrapper overflow-x: ${wrapperStyle.overflowX}`);
        console.log(`   Horizontal scroll: ${wrapperStyle.overflowX === 'auto' || wrapperStyle.overflowX === 'scroll' ? '✅' : '❌'}`);
      }
    }
    console.log('');
    
    // Check for copy and LINE buttons in active cases
    console.log('🔍 ACTION BUTTONS CHECK (Copy 📋 & LINE 💬):');
    const copyButtons = await page.locator('button:has-text("📋")').all();
    const lineButtons = await page.locator('button:has-text("💬")').all();
    
    console.log(`   Copy buttons (📋) found: ${copyButtons.length}`);
    console.log(`   LINE buttons (💬) found: ${lineButtons.length}`);
    
    if (copyButtons.length > 0) {
      const firstCopyBtn = copyButtons[0];
      const copyBtnVisible = await firstCopyBtn.isVisible();
      const copyBtnBox = await firstCopyBtn.boundingBox();
      console.log(`   First copy button visible: ${copyBtnVisible ? '✅' : '❌'}`);
      if (copyBtnBox) {
        console.log(`   Button size: ${Math.round(copyBtnBox.width)}px × ${Math.round(copyBtnBox.height)}px`);
        console.log(`   Touch-friendly (≥44px): ${copyBtnBox.width >= 44 && copyBtnBox.height >= 44 ? '✅' : '⚠️  Too small'}`);
      }
    }
    
    if (lineButtons.length > 0) {
      const firstLineBtn = lineButtons[0];
      const lineBtnVisible = await firstLineBtn.isVisible();
      const lineBtnBox = await firstLineBtn.boundingBox();
      console.log(`   First LINE button visible: ${lineBtnVisible ? '✅' : '❌'}`);
      if (lineBtnBox) {
        console.log(`   Button size: ${Math.round(lineBtnBox.width)}px × ${Math.round(lineBtnBox.height)}px`);
        console.log(`   Touch-friendly (≥44px): ${lineBtnBox.width >= 44 && lineBtnBox.height >= 44 ? '✅' : '⚠️  Too small'}`);
      }
    }
    console.log('');
    
    // Overall mobile responsiveness check
    console.log('🔍 OVERALL MOBILE LAYOUT:');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 375;
    console.log(`   Body scroll width: ${bodyWidth}px`);
    console.log(`   Viewport width: ${viewportWidth}px`);
    console.log(`   Horizontal overflow: ${bodyWidth > viewportWidth ? '⚠️  Yes (scroll needed)' : '✅ No'}`);
    
    // Check for viewport meta tag
    const viewportMeta = await page.locator('meta[name="viewport"]').first();
    const hasViewportMeta = await viewportMeta.count() > 0;
    console.log(`   Viewport meta tag: ${hasViewportMeta ? '✅' : '❌'}`);
    if (hasViewportMeta) {
      const content = await viewportMeta.getAttribute('content');
      console.log(`   Content: "${content}"`);
    }
    console.log('');
    
    console.log('=' .repeat(60));
    console.log('✅ Mobile viewport test completed!');
    console.log('📸 Check mobile-dashboard-screenshot.png for visual reference');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  } finally {
    await browser.close();
  }
})();
