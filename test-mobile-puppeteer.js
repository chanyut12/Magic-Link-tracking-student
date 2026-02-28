const puppeteer = require('puppeteer');

(async () => {
  console.log('📱 Starting Mobile Viewport Test (375x812)');
  console.log('='.repeat(60));
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    await page.setViewport({
      width: 375,
      height: 812,
      isMobile: true,
      hasTouch: true
    });
    
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');
    
    console.log('✅ Browser launched, viewport set to 375x812');
    console.log('');
    
    console.log('🌐 Navigating to http://localhost:3000/...');
    await page.goto('http://localhost:3000/', { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    console.log('✅ Page loaded');
    console.log('');
    
    await page.screenshot({ 
      path: 'mobile-dashboard-full.png', 
      fullPage: true 
    });
    console.log('📸 Full page screenshot: mobile-dashboard-full.png');
    
    await page.screenshot({ 
      path: 'mobile-dashboard-viewport.png', 
      fullPage: false 
    });
    console.log('📸 Viewport screenshot: mobile-dashboard-viewport.png');
    console.log('');
    
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        bodyScrollWidth: document.body.scrollWidth,
        bodyScrollHeight: document.body.scrollHeight,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        hasViewportMeta: !!document.querySelector('meta[name="viewport"]'),
        viewportMetaContent: document.querySelector('meta[name="viewport"]')?.getAttribute('content') || 'N/A'
      };
    });
    
    console.log('📄 PAGE INFO:');
    console.log(`   Title: ${pageInfo.title}`);
    console.log(`   Viewport: ${pageInfo.viewportWidth}x${pageInfo.viewportHeight}`);
    console.log(`   Body scroll size: ${pageInfo.bodyScrollWidth}x${pageInfo.bodyScrollHeight}`);
    console.log(`   Horizontal overflow: ${pageInfo.bodyScrollWidth > pageInfo.viewportWidth ? '⚠️  YES' : '✅ NO'}`);
    console.log(`   Viewport meta: ${pageInfo.hasViewportMeta ? '✅' : '❌'}`);
    if (pageInfo.hasViewportMeta) {
      console.log(`   Meta content: "${pageInfo.viewportMetaContent}"`);
    }
    console.log('');
    
    const headerCheck = await page.evaluate(() => {
      const header = document.querySelector('.header');
      if (!header) return { exists: false };
      
      const h1 = header.querySelector('h1');
      const rect = header.getBoundingClientRect();
      const h1Rect = h1?.getBoundingClientRect();
      
      return {
        exists: true,
        visible: rect.width > 0 && rect.height > 0,
        text: header.textContent?.trim().substring(0, 80),
        width: Math.round(rect.width),
        h1Width: h1Rect ? Math.round(h1Rect.width) : null,
        h1Readable: h1Rect ? h1Rect.width <= 375 : null
      };
    });
    
    console.log('📋 HEADER CHECK:');
    console.log(`   Exists: ${headerCheck.exists ? '✅' : '❌'}`);
    if (headerCheck.exists) {
      console.log(`   Visible: ${headerCheck.visible ? '✅' : '❌'}`);
      console.log(`   Text: "${headerCheck.text}..."`);
      console.log(`   Width: ${headerCheck.width}px`);
      if (headerCheck.h1Width) {
        console.log(`   H1 width: ${headerCheck.h1Width}px`);
        console.log(`   H1 readable: ${headerCheck.h1Readable ? '✅' : '⚠️'}`);
      }
    }
    console.log('');
    
    const createBtnCheck = await page.evaluate(() => {
      const btn = document.querySelector('button');
      if (!btn) return { exists: false };
      
      const buttons = Array.from(document.querySelectorAll('button'));
      const createBtn = buttons.find(b => b.textContent.includes('สร้างภารกิจ'));
      
      if (!createBtn) return { exists: false };
      
      const rect = createBtn.getBoundingClientRect();
      return {
        exists: true,
        visible: rect.width > 0 && rect.height > 0,
        text: createBtn.textContent.trim(),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        inViewport: rect.x >= 0 && rect.x + rect.width <= 375
      };
    });
    
    console.log('🔘 CREATE TASK BUTTON ("สร้างภารกิจ"):');
    console.log(`   Exists: ${createBtnCheck.exists ? '✅' : '❌'}`);
    if (createBtnCheck.exists) {
      console.log(`   Visible: ${createBtnCheck.visible ? '✅' : '❌'}`);
      console.log(`   Text: "${createBtnCheck.text}"`);
      console.log(`   Position: (${createBtnCheck.x}, ${createBtnCheck.y})`);
      console.log(`   Size: ${createBtnCheck.width}x${createBtnCheck.height}px`);
      console.log(`   Within viewport: ${createBtnCheck.inViewport ? '✅' : '⚠️'}`);
    }
    console.log('');
    
    const statsCheck = await page.evaluate(() => {
      const statsGrid = document.querySelector('.stats-grid');
      if (!statsGrid) return { exists: false };
      
      const rect = statsGrid.getBoundingClientRect();
      const cards = Array.from(document.querySelectorAll('.stat-card'));
      
      return {
        exists: true,
        visible: rect.width > 0 && rect.height > 0,
        gridWidth: Math.round(rect.width),
        cardCount: cards.length,
        cardWidths: cards.slice(0, 4).map(card => Math.round(card.getBoundingClientRect().width)),
        fitsInViewport: rect.width <= 375
      };
    });
    
    console.log('📊 STATS GRID CHECK:');
    console.log(`   Exists: ${statsCheck.exists ? '✅' : '❌'}`);
    if (statsCheck.exists) {
      console.log(`   Visible: ${statsCheck.visible ? '✅' : '❌'}`);
      console.log(`   Grid width: ${statsCheck.gridWidth}px`);
      console.log(`   Card count: ${statsCheck.cardCount}`);
      console.log(`   Fits in viewport (375px): ${statsCheck.fitsInViewport ? '✅' : '⚠️  Horizontal scroll'}`);
      if (statsCheck.cardWidths.length > 0) {
        console.log(`   Card widths: ${statsCheck.cardWidths.join(', ')}px`);
      }
    }
    console.log('');
    
    const tableCheck = await page.evaluate(() => {
      const table = document.querySelector('table');
      if (!table) return { exists: false };
      
      const rect = table.getBoundingClientRect();
      const wrapper = table.closest('.table-wrapper, .table-container, [style*="overflow"]');
      
      let wrapperInfo = null;
      if (wrapper) {
        const wrapperRect = wrapper.getBoundingClientRect();
        const style = window.getComputedStyle(wrapper);
        wrapperInfo = {
          exists: true,
          overflowX: style.overflowX,
          width: Math.round(wrapperRect.width),
          scrollable: style.overflowX === 'auto' || style.overflowX === 'scroll'
        };
      }
      
      return {
        exists: true,
        visible: rect.width > 0 && rect.height > 0,
        width: Math.round(rect.width),
        widerThanViewport: rect.width > 375,
        wrapper: wrapperInfo || { exists: false }
      };
    });
    
    console.log('📋 TABLE CHECK:');
    console.log(`   Exists: ${tableCheck.exists ? '✅' : '❌'}`);
    if (tableCheck.exists) {
      console.log(`   Visible: ${tableCheck.visible ? '✅' : '❌'}`);
      console.log(`   Width: ${tableCheck.width}px`);
      console.log(`   Wider than viewport: ${tableCheck.widerThanViewport ? '✅ (scroll expected)' : '⚠️'}`);
      console.log(`   Scrollable wrapper: ${tableCheck.wrapper.exists ? '✅' : '⚠️  Not found'}`);
      if (tableCheck.wrapper.exists) {
        console.log(`   Wrapper overflow-x: ${tableCheck.wrapper.overflowX}`);
        console.log(`   Horizontal scroll enabled: ${tableCheck.wrapper.scrollable ? '✅' : '❌'}`);
      }
    }
    console.log('');
    
    const actionButtonsCheck = await page.evaluate(() => {
      const copyButtons = Array.from(document.querySelectorAll('button')).filter(b => 
        b.textContent.includes('📋')
      );
      const lineButtons = Array.from(document.querySelectorAll('button')).filter(b => 
        b.textContent.includes('💬')
      );
      
      const getButtonInfo = (btn) => {
        const rect = btn.getBoundingClientRect();
        return {
          visible: rect.width > 0 && rect.height > 0,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          touchFriendly: rect.width >= 44 && rect.height >= 44
        };
      };
      
      return {
        copyCount: copyButtons.length,
        lineCount: lineButtons.length,
        firstCopy: copyButtons.length > 0 ? getButtonInfo(copyButtons[0]) : null,
        firstLine: lineButtons.length > 0 ? getButtonInfo(lineButtons[0]) : null
      };
    });
    
    console.log('🔘 ACTION BUTTONS (Copy 📋 & LINE 💬):');
    console.log(`   Copy buttons found: ${actionButtonsCheck.copyCount}`);
    console.log(`   LINE buttons found: ${actionButtonsCheck.lineCount}`);
    
    if (actionButtonsCheck.firstCopy) {
      console.log(`   First copy button:`);
      console.log(`     Visible: ${actionButtonsCheck.firstCopy.visible ? '✅' : '❌'}`);
      console.log(`     Size: ${actionButtonsCheck.firstCopy.width}x${actionButtonsCheck.firstCopy.height}px`);
      console.log(`     Touch-friendly (≥44px): ${actionButtonsCheck.firstCopy.touchFriendly ? '✅' : '⚠️  Too small'}`);
    }
    
    if (actionButtonsCheck.firstLine) {
      console.log(`   First LINE button:`);
      console.log(`     Visible: ${actionButtonsCheck.firstLine.visible ? '✅' : '❌'}`);
      console.log(`     Size: ${actionButtonsCheck.firstLine.width}x${actionButtonsCheck.firstLine.height}px`);
      console.log(`     Touch-friendly (≥44px): ${actionButtonsCheck.firstLine.touchFriendly ? '✅' : '⚠️  Too small'}`);
    }
    console.log('');
    
    console.log('='.repeat(60));
    console.log('✅ Mobile viewport test completed!');
    console.log('📸 Screenshots saved:');
    console.log('   - mobile-dashboard-full.png (full page)');
    console.log('   - mobile-dashboard-viewport.png (above fold)');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
})();
