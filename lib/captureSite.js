// Loads a URL in a headless browser, screenshots it, and runs an automated
// accessibility scan (axe-core) against the live DOM. This is the "eyes"
// half of the audit — Claude never fetches the page itself.

const { chromium } = require("playwright");
const { AxeBuilder } = require("@axe-core/playwright");

const NAV_TIMEOUT_MS = 20000;

async function captureSite(url, { onPhase, skipAxe = false } = {}) {
  const emit = onPhase || (() => {});
  const browser = await chromium.launch({ headless: true });
  try {
    emit("capturing");
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(url, { waitUntil: "networkidle", timeout: NAV_TIMEOUT_MS }).catch(async () => {
      // Some sites never go fully idle (polling, analytics beacons). Fall back
      // to "loaded" rather than failing the whole audit over that.
      await page.goto(url, { waitUntil: "load", timeout: NAV_TIMEOUT_MS });
    });

    const title = await page.title();

    const screenshotBuffer = await page.screenshot({ fullPage: false, type: "png" });
    const screenshotBase64 = screenshotBuffer.toString("base64");

    let axeResults = null;
    let axeError = null;
    if (!skipAxe) {
      emit("scanning");
      try {
        axeResults = await new AxeBuilder({ page }).analyze();
      } catch (e) {
        // A scan failure shouldn't kill the whole audit — Claude can still
        // work from the screenshot alone, just with fewer automated findings.
        axeError = e.message;
      }
    }

    await browser.close();

    return {
      url,
      title,
      screenshotBase64,
      axeViolations: axeResults
        ? axeResults.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            help: v.help,
            nodeCount: v.nodes.length,
            // Keep only the first couple of concrete node targets, not the full
            // dump — Claude needs "what and how many", not every selector.
            sampleTargets: v.nodes.slice(0, 3).map((n) => n.target?.[0]).filter(Boolean),
          }))
        : [],
      axeError,
    };
  } catch (err) {
    await browser.close().catch(() => {});
    throw new Error(`Could not load ${url}: ${err.message}`);
  }
}

module.exports = { captureSite };
