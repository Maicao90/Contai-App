import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set scale factor for high res
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 2 });

  await page.goto(`file://${path.resolve(__dirname, 'story_premium_fintech.html')}`, { waitUntil: 'load' });
  const storyElement = await page.$('.story-container');
  if (storyElement) {
    await storyElement.screenshot({ path: 'story_premium_fintech.png' });
  }

  await browser.close();
})();
