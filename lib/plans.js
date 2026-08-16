// Single source of truth for pricing/quota numbers. Change the numbers here,
// nothing else needs to know about them. Treat everything under PREMIUM as
// "example, confirm against real Claude API spend before launch" per the
// cost-math note in README.md.

// Categories that always run, for every user, every audit — Performance
// (real Lighthouse metrics) and Accessibility (axe-core). Both are
// deterministic tooling, zero Claude spend, so there is no reason to ever
// gate them behind a plan or a quota.
const ALWAYS_FREE_CATEGORIES = ["Performance", "Accessibility"];

// The Senior UX Review: Claude-reasoned categories that cost real API spend
// per audit. These are what a plan/quota actually gates.
const REASONED_CATEGORIES = ["Usability", "Visual Design", "Conversion Readiness", "Agentic Browsing"];

const PLANS = {
  free: {
    id: "free",
    label: "Free",
    priceUsd: 0,
    // Lifetime, not recurring: every account gets 3 full Senior UX Reviews
    // total, ever, no weekly reset. After that, Performance + Accessibility
    // keep running (unlimited, always free), the 4 reasoned categories lock.
    lifetimeFullAudits: 3,
    description:
      "Performance and Accessibility on every audit, unlimited, always free. Plus your first 3 " +
      "full Senior UX Reviews (Usability, Visual Design, Conversion Readiness, Agentic Browsing).",
  },
  premium: {
    id: "premium",
    label: "Premium",
    priceUsd: 18, // EXAMPLE — validate against real per-audit Claude cost before launch
    fullAuditsPerPeriod: 10,
    periodDays: 7,
    description:
      "Everything in Free, plus 10 full Senior UX Review audits per week: reasoning-chain " +
      "findings, heuristic evaluation, visual/conversion scoring, Copy Fix Prompt.",
  },
};

// Calendar-week reset (Monday 00:00 UTC), not "7 days after last audit."
// Simpler to build, simpler for a user to understand ("resets Monday"),
// and doesn't require tracking a per-user rolling window.
function getCurrentPeriodStart(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
  const diffToMonday = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diffToMonday);
  return d;
}

function getNextPeriodStart(now = new Date()) {
  const start = getCurrentPeriodStart(now);
  const next = new Date(start);
  next.setUTCDate(next.getUTCDate() + 7);
  return next;
}

module.exports = { PLANS, ALWAYS_FREE_CATEGORIES, REASONED_CATEGORIES, getCurrentPeriodStart, getNextPeriodStart };
