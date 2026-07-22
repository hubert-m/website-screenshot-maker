import { NextRequest, NextResponse } from 'next/server';
import puppeteer, { Browser } from 'puppeteer';
import fs from 'fs';
import path from 'path';

// Memory-based rate limiter (Reset on server restart)
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT_COUNT = 10;
const RATE_LIMIT_WINDOW = 3600000; // 1 hour

function checkRateLimit(ip: string): { allowed: boolean; remaining?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_COUNT - 1 };
  }

  if (entry.count >= RATE_LIMIT_COUNT) {
    return { allowed: false };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_COUNT - entry.count };
}

async function writeLog(ip: string, payload: any, success: boolean, status: number, errorMessage?: string) {
  try {
    const tz = process.env.APP_TIMEZONE || 'Europe/Warsaw';
    const logsDir = path.join(process.cwd(), 'logs', 'generates');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const now = new Date();
    // Use the configured timezone for the filename (YYYY-MM-DD)
    const date = now.toLocaleDateString('en-CA', { timeZone: tz });
    const logFile = path.join(logsDir, `${date}.log`);
    
    // Format timestamp: Y-m-d H:m:s.mls
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value;
    const ms = now.getMilliseconds().toString().padStart(3, '0');
    const formattedTimestamp = `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')}.${ms}`;

    const logEntry = {
      timestamp: formattedTimestamp,
      ip,
      payload,
      success,
      status,
      error: errorMessage || null
    };

    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  } catch (err) {
    console.warn('Logging failed:', err);
  }
}

export async function POST(req: NextRequest) {
  let browser: Browser | null = null;
  let payload: any = {};
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  
  // Rate Limit Guard
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    await writeLog(ip, {}, false, 429, 'Rate limit exceeded');
    return NextResponse.json({ error: 'Limit 10 zrzutów na godzinę został wyczerpany.' }, { status: 429 });
  }

  try {
    payload = await req.json();
    const { url, width = 1920, height = 1080, fullPage = true, format = 'png' } = payload;

    if (!url) {
      await writeLog(ip, payload, false, 400, 'URL is required');
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
        throw new Error('Failed to connect to browser instance. Ensure Chrome is running with --remote-debugging-port=9222');
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

    // Inject CSS to hide scrollbars
    await page.addStyleTag({
      content: `
        ::-webkit-scrollbar {
          display: none !important;
        }
        html {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `,
    });

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

    await writeLog(ip, payload, true, 200);

    let contentType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    let filename = `screenshot.${format}`;
    let finalBuffer: any = screenshotBuffer;

    const compressorUrl = process.env.IMAGE_COMPRESSOR_URL;
    const compressorToken = process.env.IMAGE_COMPRESSOR_TOKEN;

    if (compressorUrl && compressorToken) {
      try {
        const formData = new FormData();
        const blob = new Blob([screenshotBuffer as any], { type: contentType });
        formData.append('image', blob, filename);

        const compressResponse = await fetch(compressorUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${compressorToken}`,
          },
          body: formData,
        });

        if (compressResponse.ok) {
          const compressData = await compressResponse.json();
          if (compressData.success && compressData.data && compressData.data.url) {
            const downloadResponse = await fetch(compressData.data.url);
            if (downloadResponse.ok) {
              const arrayBuffer = await downloadResponse.arrayBuffer();
              finalBuffer = Buffer.from(arrayBuffer);
              
              const compressedFormat = compressData.data.format;
              if (compressedFormat) {
                contentType = `image/${compressedFormat}`;
                filename = `screenshot.${compressedFormat}`;
              }
            }
          }
        }
      } catch (e) {
        console.error('Image compression failed:', e);
        // Fallback to original buffer
      }
    }

    return new NextResponse(finalBuffer, {
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

    await writeLog(ip, payload, false, 500, error.message);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

