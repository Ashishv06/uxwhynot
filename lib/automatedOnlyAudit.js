// Builds a free-tier result directly from the axe-core scan, no Claude call,
// no cost. Returns the same shape as the full audit so components/Results.jsx
// can render either one without a branch, just with heuristics empty and
// only an Accessibility score, since that's the only category a deterministic
// scan can actually measure.

const IMPACT_TO_SEVERITY = {
  critical: "Critical",
  serious: "Major",
  moderate: "Moderate",
  minor: "Minor",
};

function scoreFromViolations(violations) {
  const penalty = violations.reduce((sum, v) => {
    const weight = { critical: 15, serious: 10, moderate: 5, minor: 2 }[v.impact] || 5;
    return sum + weight;
  }, 0);
  return Math.max(0, 100 - penalty);
}

function buildAutomatedOnlyAudit(captured, lighthouse, { fullTierName = "Premium" } = {}) {
  const violations = captured.axeViolations || [];
  const initial = scoreFromViolations(violations);

  const scoreProjection = [
    { category: "Accessibility", initial, optimized: violations.length ? 100 : initial },
  ];
  if (lighthouse && lighthouse.score != null) {
    scoreProjection.unshift({ category: "Performance", initial: lighthouse.score, optimized: lighthouse.score });
  }

  const findings = violations.map((v) => ({
    section: "Automated Scan",
    severity: IMPACT_TO_SEVERITY[v.impact] || "Moderate",
    verification: "Automated",
    observation: `${v.help} (${v.nodeCount} element${v.nodeCount === 1 ? "" : "s"} affected${
      v.sampleTargets.length ? `, e.g. ${v.sampleTargets[0]}` : ""
    })`,
    issue: v.description,
    recommendation: `Resolve the "${v.id}" accessibility rule violation.`,
  }));

  return {
    tier: "automated-only",
    url: captured.url,
    title: captured.title,
    generatedAt: new Date().toISOString(),
    scoreProjection,
    performance: lighthouse || null,
    heuristics: [],
    findings,
    upsell: {
      message:
        findings.length > 0
          ? `${findings.length} accessibility issue${findings.length === 1 ? "" : "s"} found automatically. ` +
            `Unlock ${fullTierName} for the full Senior UX Review: usability, visual design, conversion ` +
            `readiness, all 10 heuristics, and Copy Fix Prompt for every finding.`
          : `No automated accessibility issues found. Unlock ${fullTierName} for the full Senior UX Review, ` +
            `automated scans only catch what's measurable, a lot of real UX problems aren't.`,
    },
  };
}

module.exports = { buildAutomatedOnlyAudit };
