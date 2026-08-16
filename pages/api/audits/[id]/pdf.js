// GET /api/audits/[id]/pdf  ->  a real, server-rendered PDF of the report
// (pages/audits/[id]/print.js), not window.print(). Screenshots the print
// view in headless Chromium via Playwright (already a dependency for
// capture — no need for a separate Puppeteer install) and streams back the
// resulting PDF.

const { chromium } = require("playwright");
const { getAudit } = require("../../../../lib/db");

function safeFilename(audit) {
  const base = (audit.title || audit.url || "audit").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
  return `${base || "audit"}.pdf`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  const audit = typeof id === "string" ? getAudit(id) : null;

  if (!audit) {
    return res.status(404).json({ error: "Audit not found." });
  }

  const protocol = req.headers["x-forwarded-proto"] || "http";
  const printUrl = `${protocol}://${req.headers.host}/audits/${id}/print`;

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(printUrl, { waitUntil: "networkidle", timeout: 20000 });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "24px", bottom: "24px", left: "24px", right: "24px" },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename(audit)}"`);
    return res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error("PDF generation failed:", err);
    return res.status(500).json({ error: "Could not generate the PDF. Try again." });
  } finally {
    await browser.close().catch(() => {});
  }
}

export const config = {
  api: {
    responseLimit: "16mb",
  },
};
