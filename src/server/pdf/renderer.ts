import { logger } from '../../core/logger';
import { ensureChromium, loadChromium } from './install';

export interface RenderPdfOptions {
  port: number;
  host?: string;
  projectKey: string;
  branch?: string;
  pullRequest?: string;
  /** Local auth token, passed to the report page via URL fragment if set. */
  authToken?: string;
}

function buildReportUrl(opts: RenderPdfOptions): string {
  const host = opts.host && opts.host !== '0.0.0.0' ? opts.host : '127.0.0.1';
  const params = new URLSearchParams({ project: opts.projectKey });
  if (opts.pullRequest) params.set('pr', opts.pullRequest);
  else if (opts.branch) params.set('branch', opts.branch);
  const fragment = opts.authToken ? `#token=${opts.authToken}` : '';
  return `http://${host}:${opts.port}/report?${params.toString()}${fragment}`;
}

/** Render the SPA's /report route to a PDF via headless Chromium. */
export async function renderReportPdf(opts: RenderPdfOptions): Promise<Buffer> {
  const chromium = await loadChromium();
  await ensureChromium(chromium);

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const url = buildReportUrl(opts);
    logger.debug(`Rendering report: ${url.replace(/#token=.*/, '#token=***')}`);

    await page.goto(url, { waitUntil: 'networkidle', timeout: 45_000 });
    // Wait until the SPA signals its data + charts have settled.
    await page
      .waitForFunction('window.__REPORT_READY__ === true', undefined, { timeout: 30_000 })
      .catch(() => logger.warn('Report readiness flag not set; capturing current state.'));

    return await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '16mm', bottom: '16mm', left: '12mm', right: '12mm' },
    });
  } finally {
    await browser.close();
  }
}
