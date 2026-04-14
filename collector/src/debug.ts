import 'dotenv/config';
import { PlaywrightCrawler, Configuration } from 'crawlee';

const config = new Configuration({ persistStorage: false, storageClientOptions: { localDataDirectory: './storage/debug' } });
let logged = false;

const crawler = new PlaywrightCrawler({
  maxRequestsPerCrawl: 1,
  headless: true,
  requestHandlerTimeoutSecs: 30,
  async requestHandler({ page }) {
    page.on('response', async (response) => {
      if (logged) return;
      const url = response.url();
      if (url.includes('/api/sale-details') && !url.includes('threerandom')) {
        try {
          const json = await response.json();
          const sales = Array.isArray(json) ? json : [json];
          if (sales.length > 0) {
            logged = true;
            console.log('\n========== SAMPLE SALE OBJECT ==========');
            console.log(JSON.stringify(sales[0], null, 2));
            console.log('========================================\n');
          }
        } catch {}
      }
    });
    await page.goto('https://www.estatesales.net/OR/Portland/97201');
    await page.waitForTimeout(15000);
  },
}, config);

crawler.run([{ url: 'https://www.estatesales.net/OR/Portland/97201' }]);
