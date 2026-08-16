// Runs a real Lighthouse performance audit against a URL. Uses its own
// dedicated Chrome instance (via chrome-launcher) rather than reusing the
// Playwright browser from captureSite.js, Lighthouse manages its own
// browser lifecycle and this keeps that separate and standard. Points
// chrome-launcher at Playwright's already-installed Chromium binary so
// there's no separate "also install real Chrome" requirement.
//
// Both `lighthouse` and `chrome-launcher` are ESM-only packages, hence the
// dynamic import() from this otherwise-CommonJS file.

const { chromium } = require("playwright");

async function runLighthouse(url) {
  const { default: lighthouse } = await import("lighthouse");
  const chromeLauncher = await import("chrome-launcher");

  let chrome;
  try {
    chrome = await chromeLauncher.launch({
      chromePath: chromium.executablePath(),
      chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
    });

    const result = await lighthouse(url, {
      port: chrome.port,
      onlyCategories: ["performance"],
      output: "json",
    });

    const lhr = result.lhr;
    const perf = lhr.categories.performance;
    const audits = lhr.audits;

    return {
      score: perf && perf.score != null ? Math.round(perf.score * 100) : null,
      metrics: {
        firstContentfulPaint: audits["first-contentful-paint"]?.displayValue || null,
        largestContentfulPaint: audits["largest-contentful-paint"]?.displayValue || null,
        totalBlockingTime: audits["total-blocking-time"]?.displayValue || null,
        cumulativeLayoutShift: audits["cumulative-layout-shift"]?.displayValue || null,
        speedIndex: audits["speed-index"]?.displayValue || null,
      },
      opportunities: Object.values(audits)
        .filter((a) => a.details && a.details.type === "opportunity" && a.score !== null && a.score < 0.9)
        .sort((a, b) => (b.details?.overallSavingsMs || 0) - (a.details?.overallSavingsMs || 0))
        .slice(0, 5)
        .map((a) => ({ title: a.title, description: a.description })),
    };
  } catch (err) {
    // Lighthouse can fail on sites with unusual redirect chains, bot
    // protection, or a slow cold start. Don't let that kill the whole
    // audit, Performance just won't be available for this run.
    return { score: null, metrics: null, opportunities: [], error: err.message };
  } finally {
    if (chrome) await chrome.kill();
  }
}

module.exports = { runLighthouse };
