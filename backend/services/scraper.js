const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Resolve Chrome executable — handles both local and Render environments
function getChromePath() {
    // If PUPPETEER_CACHE_DIR is set (Render), find Chrome inside it
    const cacheDir = process.env.PUPPETEER_CACHE_DIR;
    if (cacheDir && fs.existsSync(cacheDir)) {
        // Walk chrome/ subdirectory to find the binary
        const chromeDir = path.join(cacheDir, 'chrome');
        if (fs.existsSync(chromeDir)) {
            const [platform] = fs.readdirSync(chromeDir);
            if (platform) {
                const [version] = fs.readdirSync(path.join(chromeDir, platform));
                if (version) {
                    const bin = path.join(chromeDir, platform, version, 'chrome-linux64', 'chrome');
                    if (fs.existsSync(bin)) return bin;
                    // Alternate path structure
                    const bin2 = path.join(chromeDir, platform, version, 'chrome');
                    if (fs.existsSync(bin2)) return bin2;
                }
            }
        }
    }
    return undefined; // Let puppeteer find its bundled Chrome
}

async function scrapePage(url) {
    let browser;
    try {
        const executablePath = getChromePath();
        console.log('[Scraper] Chrome path:', executablePath || 'puppeteer bundled default');

        browser = await puppeteer.launch({
            headless: 'new',
            executablePath,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--single-process',          // required on Render's free containers
                '--no-zygote',
                '--window-size=1440,900',
            ],
        });


        const page = await browser.newPage();

        // Larger viewport for better screenshots
        await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        // Block heavy resources that slow rendering but aren't needed for UX analysis
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const type = req.resourceType();
            if (['media', 'font'].includes(type)) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Navigate — try networkidle2 first, fall back to domcontentloaded on timeout
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        } catch {
            // If networkidle2 times out (heavy sites), proceed with what we have
            console.warn('networkidle2 timeout, continuing with current page state...');
        }

        // Scroll to trigger lazy-loading and reveal above-the-fold content
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 300;
                const timer = setInterval(() => {
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if (totalHeight >= Math.min(document.body.scrollHeight, 3000)) {
                        clearInterval(timer);
                        window.scrollTo(0, 0); // scroll back to top for screenshot
                        resolve();
                    }
                }, 100);
            });
        });

        // Wait for images and fonts to settle after scroll
        await new Promise((r) => setTimeout(r, 2500));

        // Try to wait for any loading spinners to disappear
        try {
            await page.waitForFunction(
                () => document.readyState === 'complete',
                { timeout: 5000 }
            );
        } catch { /* ignore */ }

        // Extract page data
        const data = await page.evaluate(() => {
            const getText = (el) => (el ? el.innerText.trim() : '');

            const title = document.title || '';

            const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
                .map((h) => `${h.tagName}: ${getText(h)}`)
                .filter((h) => h.length > 5)
                .slice(0, 20);

            const buttons = Array.from(
                document.querySelectorAll('button, [role="button"], a.btn, input[type="submit"], .cta, [class*="cta"], [class*="button"]')
            )
                .map((b) => getText(b) || b.getAttribute('aria-label') || b.value || '')
                .filter((b) => b.length > 0 && b.length < 100)
                .slice(0, 20);

            const forms = Array.from(document.querySelectorAll('form'))
                .map((f) => {
                    const labels = Array.from(f.querySelectorAll('label')).map((l) => getText(l));
                    const inputs = Array.from(f.querySelectorAll('input, textarea, select')).map(
                        (i) => i.placeholder || i.name || i.type || ''
                    );
                    return [...labels, ...inputs].filter(Boolean).join(', ');
                })
                .filter((f) => f.length > 0)
                .slice(0, 5);

            const bodyText = (document.body?.innerText || '')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 3000);

            const imagesWithoutAlt = Array.from(document.querySelectorAll('img:not([alt])')).length;
            const imagesWithEmptyAlt = Array.from(document.querySelectorAll('img[alt=""]')).length;
            const formsWithoutLabels = Array.from(document.querySelectorAll('input:not([id])')).length;
            const linksWithNoText = Array.from(document.querySelectorAll('a')).filter(
                (a) => !a.innerText.trim() && !a.getAttribute('aria-label')
            ).length;

            const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
            const hasViewport = !!document.querySelector('meta[name="viewport"]');

            return {
                title,
                headings,
                buttons,
                forms,
                bodyText,
                a11y: { imagesWithoutAlt, imagesWithEmptyAlt, formsWithoutLabels, linksWithNoText },
                metaDescription,
                hasViewport,
            };
        });

        // Scroll back to top before screenshotting
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise((r) => setTimeout(r, 500));

        // Take viewport screenshot (above the fold — what users first see)
        const screenshotBuffer = await page.screenshot({
            fullPage: false,
            type: 'jpeg',
            quality: 80,
            clip: { x: 0, y: 0, width: 1440, height: 900 },
        });
        const screenshotBase64 = screenshotBuffer.toString('base64');

        return { ...data, screenshotBase64 };
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { scrapePage };
