import { NextRequest, NextResponse } from 'next/server';
import puppeteer, { Browser } from 'puppeteer';

export async function POST(req: NextRequest) {
  let browser: Browser | null = null;
  
  try {
    const body = await req.json();
    const { url, width = 1920, height = 1080, fullPage = false, format = 'png' } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    } else {
      // Production path: Connect to existing Chrome instance
      try {
        const debuggerUrl = process.env.CHROME_DEBUGGER_URL || 'http://127.0.0.1:9222/json/version';
        const versionResponse = await fetch(debuggerUrl);
        const data = await versionResponse.json();
        const wsUrl = data.webSocketDebuggerUrl;

        if (!wsUrl) {
          throw new Error('webSocketDebuggerUrl not found');
        }

        browser = await puppeteer.connect({
          browserWSEndpoint: wsUrl,
          defaultViewport: { width, height },
        });
      } catch (err) {
        console.error('Failed to connect to production Chrome:', err);
        return NextResponse.json({ 
          error: 'Failed to connect to browser instance. Ensure Chrome is running with --remote-debugging-port=9222' 
        }, { status: 500 });
      }
    }

    if (!browser) {
      throw new Error('Browser initialization failed');
    }

    const page = await browser.newPage();
    await page.setViewport({ width, height });
    
    // Wait until network is idle to ensure initial resources are loaded
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });

    // Handle common cookie consent buttons (e.g., Cookiebot)
    try {
      const cookieButtonId = 'CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll';
      const hasCookieButton = await page.$(`#${cookieButtonId}`);
      if (hasCookieButton) {
        await page.click(`#${cookieButtonId}`);
        // Small delay to allow the banner to disappear
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (e) {
      // Ignore if not found or error
    }

    // Auto-scroll logic to trigger lazy loading
    await page.evaluate(async (targetH, isFull) => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (isFull) {
            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          } else {
            if (totalHeight >= targetH || totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }
        }, 100);
      });
      
      // Return to the top of the page
      window.scrollTo(0, 0);
    }, height, fullPage);

    // Briefly wait for any lazy-loaded content/animations to settle and for sticky elements to reposition
    await new Promise(r => setTimeout(r, 3000));

    const screenshotBuffer = await page.screenshot({
      fullPage,
      type: format === 'jpg' ? 'jpeg' : 'png',
      quality: format === 'jpg' ? 80 : undefined,
    });

    // Cleanup: Close the page (and browser if launched)
    await page.close();
    if (isDev) {
      await browser.close();
    } else {
      await browser.disconnect();
    }

    const contentType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const filename = `screenshot.${format}`;

    return new NextResponse(screenshotBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    console.error('Screenshot error:', error);
    
    // Attempt cleanup on error
    if (browser) {
      try {
        if (process.env.NODE_ENV === 'development') {
          await browser.close();
        } else {
          await browser.disconnect();
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
