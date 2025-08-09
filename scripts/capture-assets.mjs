#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import net from 'net';
import { spawn } from 'child_process';

const root = new URL('..', import.meta.url).pathname;
const imagesDir = path.join(root, 'docs/images');
await fs.mkdir(imagesDir, { recursive: true });

async function findFreePort(start = 5173, end = 5190) {
  function check(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.unref();
      server.on('error', () => resolve(false));
      server.listen({ port }, () => {
        server.close(() => resolve(true));
      });
    });
  }
  for (let p = start; p <= end; p++) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await check(p);
    if (ok) return p;
  }
  throw new Error('No free port found');
}

const serve = async (port) => {
  const child = spawn('npm', ['run', 'preview', '--', '--strictPort', '--port', String(port)], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  await new Promise((res) => setTimeout(res, 1500));
  return () => child.kill('SIGTERM');
};

const main = async () => {
  const port = await findFreePort();
  const stop = await serve(port);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // Ensure onboarding is bypassed, secondary display visible, and seed an audit entry so no API is needed
  await page.addInitScript(() => {
    localStorage.setItem('maya_onboarding_complete', 'true');
    try {
      const cfgRaw = localStorage.getItem('maya_config');
      const cfg = cfgRaw ? JSON.parse(cfgRaw) : {};
      cfg.secondary_display_visible = true;
      localStorage.setItem('maya_config', JSON.stringify(cfg));

      const pvRaw = localStorage.getItem('maya_panel_visibility');
      const pv = pvRaw ? JSON.parse(pvRaw) : {};
      pv.configVisible = true;
      pv.ltmVisible = true;
      pv.correctionsVisible = true;
      pv.aliasesVisible = true;
      pv.envVarsVisible = true;
      pv.gitLogVisible = true;
      pv.geminiLogsVisible = true;
      pv.auditHistoryVisible = true;
      localStorage.setItem('maya_panel_visibility', JSON.stringify(pv));
    } catch (e) {
      // no-op
    }
    const seeded = [{
      timestamp: new Date().toISOString(),
      report: {
        summary: 'Automated capture audit summary',
        findings: [
          { category: 'security', issue: 'Outdated package', suggestion: 'Update to latest' },
          { category: 'config', issue: 'Missing env var', suggestion: 'Set VITE_GEMINI_API_KEY in .env.local' },
        ],
      }
    }];
    localStorage.setItem('maya_audit_history', JSON.stringify(seeded));
  });

  const base = `http://localhost:${port}/`;
  await page.goto(base, { waitUntil: 'domcontentloaded' });

  // Wait for main panels; if hidden, toggle the secondary display
  try {
    await page.waitForSelector('text=Configuration', { timeout: 6000 });
  } catch {
    // Ensure app hydrated
    await page.waitForSelector('#command-input', { timeout: 6000 }).catch(() => {});
    const toggle = await page.$('button.display-toggle');
    if (toggle) {
      await toggle.click();
      await page.waitForSelector('text=Configuration', { timeout: 6000 }).catch(() => {});
    }
  }

  // CLI base view
  await page.screenshot({ path: path.join(imagesDir, 'cli.png') });

  // Expand Audit History and capture
  const summaries = await page.getByText('Audit History').all();
  if (summaries.length > 0) {
    const el = summaries[0];
    await el.click({ force: true });
  }
  await page.screenshot({ path: path.join(imagesDir, 'audit-history.png') });

  // Quickstart frames
  await page.screenshot({ path: path.join(imagesDir, 'quickstart-1.png') });
  const runBtn = await page.$('button[aria-label="Run Audit"]');
  if (runBtn) {
    await runBtn.click();
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(imagesDir, 'quickstart-2.png') });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(imagesDir, 'quickstart-3.png') });

  await browser.close();
  await stop();
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
