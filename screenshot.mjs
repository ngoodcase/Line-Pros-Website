import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PUPPETEER_PATH = 'C:/Users/nateh/AppData/Local/Temp/puppeteer-test/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';

const args = process.argv.slice(2);
const url = args[0] || 'http://localhost:3000';
const label = args[1] ? `-${args[1]}` : '';

const outDir = path.join(__dirname, 'temporary screenshots');
fs.mkdirSync(outDir, { recursive: true });

const existing = fs.readdirSync(outDir).filter(f => /^screenshot-\d+/.test(f));
const nextN = existing.reduce((max, f) => {
  const m = f.match(/^screenshot-(\d+)/);
  return m ? Math.max(max, parseInt(m[1], 10)) : max;
}, 0) + 1;

const outFile = path.join(outDir, `screenshot-${nextN}${label}.png`);

let puppeteer;
try {
  puppeteer = (await import('file:///' + PUPPETEER_PATH.replace(/\\/g, '/'))).default;
} catch (e) {
  try {
    puppeteer = (await import('puppeteer')).default;
  } catch (e2) {
    console.error('Could not load puppeteer. Tried:', PUPPETEER_PATH, 'and global puppeteer.');
    console.error(e.message);
    process.exit(1);
  }
}

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path: outFile, fullPage: true });
await browser.close();

console.log(`Saved ${outFile}`);
