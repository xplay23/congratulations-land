import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

// Audit the production build; do not benchmark Vite's development overhead.
const label = process.argv[2] || 'current';
const paths = process.argv.includes('--all') ? ['/', '/svyatyj-mykolaj/', '/tsiny/'] : ['/'];
const port = 5188;
const server = spawn(process.execPath, ['server.mjs', '--production'], {
  env: { ...process.env, PORT: String(port) }, windowsHide: true, stdio: 'pipe'
});
let browser;
try {
  await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); server.once('exit', code => reject(new Error(`Server exited ${code}`))); });
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    args: ['--remote-debugging-port=9223'], ignoreDefaultArgs: ['--disable-back-forward-cache'], headless: true
  });
  await mkdir(`tmp/lighthouse/${label}`, { recursive: true });
  for (const path of paths) for (const device of ['mobile', 'desktop']) {
    const result = await lighthouse(`http://127.0.0.1:${port}${path}`, {
      port: 9223, output: ['html', 'json'], logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    }, device === 'desktop' ? desktopConfig : undefined);
    const name = `${path === '/' ? 'home' : path.replaceAll('/', '')}-${device}`;
    await writeFile(`tmp/lighthouse/${label}/${name}.html`, result.report[0]);
    await writeFile(`tmp/lighthouse/${label}/${name}.json`, result.report[1]);
    const { categories, audits } = result.lhr;
    console.log(JSON.stringify({ name, scores: Object.fromEntries(Object.entries(categories).map(([k,v]) => [k, Math.round(v.score * 100)])), metrics: Object.fromEntries(['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'].map(k => [k, audits[k].displayValue])), failures: Object.values(audits).filter(a => a.score !== null && a.score < .9).map(a => ({ id: a.id, title: a.title, value: a.displayValue })) }));
  }
} finally {
  await browser?.close();
  server.kill();
}
