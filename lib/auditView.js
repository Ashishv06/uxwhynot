// Pure helpers shared between the interactive Results view and the
// print/PDF report, so the two never drift on how scores/findings are
// bucketed and grouped.

export function scoreBadgeClass(score) {
  if (score >= 80) return "green";
  if (score >= 50) return "yellow";
  return "red";
}

export function severityClass(severity) {
  const map = {
    Critical: "sev-critical",
    Major: "sev-major",
    Moderate: "sev-moderate",
    Minor: "sev-moderate",
    "What Works": "sev-works",
  };
  return map[severity] || "sev-moderate";
}

export function groupFindingsBySection(findings) {
  const groups = new Map();
  (findings || []).forEach((f) => {
    const key = f.section || "General";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(f);
  });
  return Array.from(groups.entries());
}

export function competitorNamesFrom(scoringMatrix) {
  const names = new Set();
  (scoringMatrix || []).forEach((row) => (row.competitors || []).forEach((c) => names.add(c.name)));
  return Array.from(names);
}

export function sumScores(scoringMatrix, pick) {
  return (scoringMatrix || []).reduce((total, row) => total + (pick(row) || 0), 0);
}

export function formatDate(iso) {
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}
