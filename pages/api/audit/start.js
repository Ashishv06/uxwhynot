// POST /api/audit/start  { url: string }  ->  { jobId }
//
// Kicks off the audit (capture + Claude) in the background and returns
// immediately. Poll /api/audit/status?jobId=... for progress and the final
// result. This only works because the app runs as an always-on Node process
// (see README) — the job continues after this handler returns.

const { captureSite } = require("../../../lib/captureSite");
const { runClaudeAudit } = require("../../../lib/claudeAudit");
const { runLighthouse } = require("../../../lib/runLighthouse");
const { createJob, updateJob } = require("../../../lib/jobStore");
const { saveAudit } = require("../../../lib/db");
const { toFriendlyError } = require("../../../lib/friendlyError");
const { buildAutomatedOnlyAudit } = require("../../../lib/automatedOnlyAudit");
const { checkQuota, consumeQuota } = require("../../../lib/quota");

const MAX_COMPETITORS = 4;

// TODO (freemium/premium): there is no auth in this starter yet, so every
// request is treated as an anonymous free-tier user for now. Once you add
// real auth (NextAuth/Clerk/Supabase Auth) and a database (db/schema.sql),
// replace this with a real lookup: `const user = await getUserFromSession(req);`
// and persist the `user` object checkQuota()/consumeQuota() return back to
// the users table. Nothing else in this file needs to change, the gating
// logic below already expects that shape.
function getRequestUser(req) {
  return {
    plan: "free",
    // TEMP TEST OVERRIDE: set to 3 (the lifetime limit) so every audit takes
    // the automated-only path — real Performance + Accessibility, zero
    // Claude spend — for testing without Anthropic credits. Set back to 0
    // once you're ready to test the paid Senior UX Review path again.
    full_audits_used_lifetime: 3,
    audits_used_this_period: 0,
    period_start: null,
  };
}

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

async function captureCompetitor(url) {
  try {
    const captured = await captureSite(url, { skipAxe: true });
    return { url, title: captured.title, screenshotBase64: captured.screenshotBase64 };
  } catch (err) {
    // Some sites block automated capture (CSP, bot detection, timeouts).
    // Don't fail the whole audit over one competitor — Claude is told to
    // exclude it rather than guess (see methodologyPrompt.js).
    return { url, error: err.message };
  }
}

async function runJob(jobId, url, competitorUrls, user, quota) {
  try {
    updateJob(jobId, { status: "running", phase: "capturing" });

    // Performance (Lighthouse) and Accessibility (axe-core, inside
    // captureSite) always run, for every user, every audit — neither
    // touches Claude, so there's nothing to gate. They run in parallel
    // since they're independent, both just hit the same URL.
    const [captured, lighthouse] = await Promise.all([
      captureSite(url, { onPhase: (phase) => updateJob(jobId, { phase }) }),
      runLighthouse(url),
    ]);

    if (!quota.allowed) {
      // Free plan with all 3 lifetime full reviews used, or premium with
      // this week's 10 used up. Either way: Performance + Accessibility
      // still run and show, the 4 Claude-reasoned categories lock instead,
      // and there's no competitor benchmarking (that needs Claude too).
      const automatedOnly = buildAutomatedOnlyAudit(captured, lighthouse);
      automatedOnly.upsell.message =
        quota.scope === "lifetime"
          ? `You've used all 3 free full Senior UX Reviews for this account. Upgrade to Premium for 10 more per week.`
          : `You've used all your full audits for this period. Resets ${new Date(quota.resetsAt).toLocaleDateString()}.`;
      saveAudit(jobId, automatedOnly);
      updateJob(jobId, { status: "done", phase: "done", result: automatedOnly });
      return;
    }

    if (competitorUrls.length) {
      updateJob(jobId, { phase: "benchmarking" });
      captured.competitors = await Promise.all(competitorUrls.map(captureCompetitor));
    }

    updateJob(jobId, { phase: "analyzing" });
    const audit = await runClaudeAudit(captured);

    const scoreProjection = [...(audit.scoreProjection || [])];
    if (lighthouse && lighthouse.score != null) {
      scoreProjection.unshift({ category: "Performance", initial: lighthouse.score, optimized: lighthouse.score });
    }

    // TODO: once real auth + a database exist, persist consumeQuota(user)
    // back to the users table here so the counter actually sticks.
    consumeQuota(user);

    const result = {
      tier: "full",
      url,
      title: captured.title,
      generatedAt: new Date().toISOString(),
      ...audit,
      scoreProjection,
      performance: lighthouse,
      remainingFreeAudits: quota.scope === "lifetime" ? Math.max(0, quota.remaining - 1) : null,
    };

    // Same id for the in-memory job and the persisted row — the frontend
    // redirects to /audits/{jobId} once the job reports "done", so the
    // result survives a refresh instead of living only in React state.
    saveAudit(jobId, result);

    updateJob(jobId, { status: "done", phase: "done", result });
  } catch (err) {
    console.error("Audit failed:", err);
    updateJob(jobId, {
      status: "error",
      // Full raw error is logged above for debugging. Only a mapped,
      // human-readable message ever goes back to the browser — see
      // lib/friendlyError.js for what gets translated to what and why.
      error: toFriendlyError(err),
    });
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url, competitorUrls } = req.body || {};

  if (!url || typeof url !== "string" || !isValidHttpUrl(url)) {
    return res.status(400).json({
      error: "Please provide a valid URL, including http:// or https://.",
    });
  }

  const cleanedCompetitorUrls = Array.isArray(competitorUrls)
    ? competitorUrls.filter((u) => typeof u === "string" && isValidHttpUrl(u)).slice(0, MAX_COMPETITORS)
    : [];

  const user = getRequestUser(req);
  const quota = checkQuota(user);

  const jobId = createJob();
  res.status(202).json({ jobId });

  runJob(jobId, url, cleanedCompetitorUrls, user, quota);
}
