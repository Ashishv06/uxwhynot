import { useRef, useState } from "react";
import { groupFindingsBySection, severityClass } from "../lib/auditView";

// Always-free categories run via real tooling (Lighthouse, axe-core), never
// gated. Reasoned categories come from the Claude Senior UX Review and are
// what a free/premium plan actually limits. Order here drives both the
// gauge row and the accordion below.
const CATEGORY_ORDER = [
  { key: "Performance", alwaysFree: true },
  { key: "Accessibility", alwaysFree: true },
  { key: "Usability", alwaysFree: false },
  { key: "Visual Design", alwaysFree: false },
  { key: "Conversion Readiness", alwaysFree: false },
  { key: "Agentic Browsing", alwaysFree: false },
];

function scoreColor(score) {
  if (score == null) return "gray";
  if (score >= 90) return "green";
  if (score >= 50) return "yellow";
  return "red";
}

// Formats a finding into a ready-to-paste instruction for Claude, Cursor,
// Lovable, v0, Bolt, etc. No new API call, no schema dependency beyond
// fields the audit already returns — this is deliberately the cheapest
// version of "Fix" that's still genuinely useful.
function buildFixPrompt(finding, audit) {
  const lines = [
    `Fix this UX issue on ${audit?.url || "the page"}${finding.section ? ` (${finding.section})` : ""}:`,
    "",
    finding.observation ? `What's there now: ${finding.observation}` : null,
    `Problem: ${finding.issue}`,
    finding.userImpact ? `User impact: ${finding.userImpact}` : null,
    `Fix: ${finding.recommendation}`,
    finding.wcagReference ? `WCAG reference: ${finding.wcagReference}` : null,
    "",
    "Preserve the existing visual design system and page structure. Only change what's needed to resolve this issue.",
  ];
  return lines.filter((l) => l !== null).join("\n");
}

function Gauge({ score, locked, onClick }) {
  const color = scoreColor(score);
  const pct = locked ? 0 : Math.max(0, Math.min(100, score || 0));
  const circumference = 2 * Math.PI * 26;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <button type="button" className={`lh-gauge lh-gauge-${color}`} onClick={onClick}>
      <svg viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="26" fill="none" strokeWidth="6" className="lh-gauge-track" />
        {!locked && (
          <circle
            cx="32" cy="32" r="26" fill="none" strokeWidth="6" className="lh-gauge-fill"
            strokeDasharray={circumference} strokeDashoffset={offset}
            transform="rotate(-90 32 32)" strokeLinecap="round"
          />
        )}
      </svg>
      <span className="lh-gauge-value">{locked ? "🔒" : score}</span>
    </button>
  );
}

export default function Results({ audit, onNewAudit }) {
  const [activeTab, setActiveTab] = useState("mobile");
  const [copyLabel, setCopyLabel] = useState("Copy");
  const [copiedFindingKey, setCopiedFindingKey] = useState(null);
  const [findingsExpanded, setFindingsExpanded] = useState(false);
  const [opportunitiesExpanded, setOpportunitiesExpanded] = useState(false);

  const sectionRefs = useRef({});

  const scoreByCategory = {};
  (audit.scoreProjection || []).forEach((row) => { scoreByCategory[row.category] = row; });

  const heuristics = audit.heuristics || [];
  const findingGroups = groupFindingsBySection(audit.findings);
  const isFull = audit.tier === "full";
  const perf = audit.performance || null;

  function scrollToCategory(key) {
    const el = sectionRefs.current[key];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleCopy() {
    navigator.clipboard?.writeText(audit.url).catch(() => {});
    setCopyLabel("Copied!");
    setTimeout(() => setCopyLabel("Copy"), 1200);
  }

  function handlePreview() {
    window.open(audit.url, "_blank");
  }

  function handleDownload() {
    window.open(`/api/audits/${audit.id}/pdf`, "_blank");
  }

  function handleCopyFixPrompt(finding, key) {
    const prompt = buildFixPrompt(finding, audit);
    navigator.clipboard?.writeText(prompt).catch(() => {});
    setCopiedFindingKey(key);
    setTimeout(() => setCopiedFindingKey((k) => (k === key ? null : k)), 1500);
  }

  const visibleGroups = findingsExpanded ? findingGroups : findingGroups.slice(0, 1);
  const visibleOpportunities = perf?.opportunities
    ? opportunitiesExpanded ? perf.opportunities : perf.opportunities.slice(0, 3)
    : [];

  return (
    <section id="screen-results" className="screen active lh-page">
      <div className="lh-shell">
        <div className="lh-top">
          <div className="url-pill">{audit.url}</div>
          <div className="actions">
            <button type="button" className="btn btn-outline" onClick={handleCopy}>{copyLabel}</button>
            <button type="button" className="btn btn-outline" onClick={handlePreview}>Preview</button>
            <button type="button" className="btn btn-dark" onClick={handleDownload}>Download PDF</button>
          </div>
        </div>

        <div className="tabs">
          <button type="button" className={`tab${activeTab === "mobile" ? " active" : ""}`} onClick={() => setActiveTab("mobile")}>📱 Mobile</button>
          <button type="button" className={`tab${activeTab === "desktop" ? " active" : ""}`} onClick={() => setActiveTab("desktop")}>🖥 Desktop</button>
        </div>

        <div className="lh-gauge-row">
          {CATEGORY_ORDER.map(({ key, alwaysFree }) => {
            const row = scoreByCategory[key];
            const locked = !alwaysFree && !isFull;
            return (
              <div className="lh-gauge-item" key={key}>
                <Gauge score={row ? row.initial : null} locked={locked} onClick={() => scrollToCategory(key)} />
                <span className="lh-gauge-label">{key}</span>
              </div>
            );
          })}
        </div>

        {!isFull && (
          <div className="upsell-banner">
            <span className="upsell-badge">{audit.tier === "full" ? "Limit reached" : "Free scan"}</span>
            <p>{audit.upsell?.message}</p>
            <button type="button" className="btn btn-primary">Upgrade to Premium →</button>
          </div>
        )}
        {isFull && audit.remainingFreeAudits != null && (
          <div className="lh-remaining-note">
            {audit.remainingFreeAudits > 0
              ? `${audit.remainingFreeAudits} free Senior UX Review${audit.remainingFreeAudits === 1 ? "" : "s"} left on this account.`
              : `That was your last free Senior UX Review. Upgrade to Premium for 10 more per week.`}
          </div>
        )}

        {/* ---------- Performance ---------- */}
        <div className="lh-card" ref={(el) => (sectionRefs.current.Performance = el)}>
          <div className="lh-card-head">
            <Gauge score={perf?.score ?? null} locked={false} onClick={() => {}} />
            <div>
              <h3>Performance</h3>
              <p className="placeholder-text">Real Lighthouse metrics, measured, not estimated. Always included, on every plan.</p>
            </div>
          </div>
          {perf?.metrics ? (
            <div className="lh-metrics-grid">
              <div><span className="lh-metric-label">First Contentful Paint</span><span className="lh-metric-value">{perf.metrics.firstContentfulPaint || "—"}</span></div>
              <div><span className="lh-metric-label">Largest Contentful Paint</span><span className="lh-metric-value">{perf.metrics.largestContentfulPaint || "—"}</span></div>
              <div><span className="lh-metric-label">Total Blocking Time</span><span className="lh-metric-value">{perf.metrics.totalBlockingTime || "—"}</span></div>
              <div><span className="lh-metric-label">Cumulative Layout Shift</span><span className="lh-metric-value">{perf.metrics.cumulativeLayoutShift || "—"}</span></div>
              <div><span className="lh-metric-label">Speed Index</span><span className="lh-metric-value">{perf.metrics.speedIndex || "—"}</span></div>
            </div>
          ) : (
            <p className="placeholder-text">Performance data wasn&apos;t available for this run{perf?.error ? ` (${perf.error})` : ""}.</p>
          )}
          {visibleOpportunities.length > 0 && (
            <div className="lh-opportunities">
              <h4>Opportunities</h4>
              {visibleOpportunities.map((o) => (
                <div className="lh-opportunity" key={o.title}>
                  <strong>{o.title}</strong>
                  <p>{o.description}</p>
                </div>
              ))}
              {perf.opportunities.length > 3 && (
                <button type="button" className="lh-show-more" onClick={() => setOpportunitiesExpanded((v) => !v)}>
                  {opportunitiesExpanded ? "Show less" : `Show ${perf.opportunities.length - 3} more`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ---------- Accessibility ---------- */}
        <div className="lh-card" ref={(el) => (sectionRefs.current.Accessibility = el)}>
          <div className="lh-card-head">
            <Gauge score={scoreByCategory.Accessibility?.initial ?? null} locked={false} onClick={() => {}} />
            <div>
              <h3>Accessibility</h3>
              <p className="placeholder-text">Automated axe-core scan against the live DOM: contrast, alt text, labels, ARIA. Always included, on every plan.</p>
            </div>
          </div>
          {!isFull && findingGroups.length > 0 ? (
            <div className="lh-audit-list">
              {findingGroups.flatMap(([, items]) => items).map((f, i) => (
                <div className="lh-audit-item" key={i}>
                  <span className={`lh-sev-dot sev-${(f.severity || "").toLowerCase().replace(/\s/g, "-")}`} />
                  <span>{f.issue}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="placeholder-text">
              {isFull
                ? "Accessibility findings from the automated scan are included in Detailed Findings below."
                : "No automated accessibility issues found on this pass."}
            </p>
          )}
        </div>

        {/* ---------- Reasoned categories ---------- */}
        {[
          { key: "Usability", desc: "Navigation clarity, error handling, form design, visual hierarchy, consistency." },
          { key: "Visual Design", desc: "Hierarchy, consistency, aesthetic and minimalist design." },
          { key: "Conversion Readiness", desc: "Clarity of the primary call-to-action, forms, friction points." },
          { key: "Agentic Browsing", desc: "How well this page works for an AI agent acting on a user's behalf, not just a human." },
        ].map(({ key, desc }) => (
          <div className="lh-card" key={key} ref={(el) => (sectionRefs.current[key] = el)}>
            <div className="lh-card-head">
              <Gauge score={isFull ? scoreByCategory[key]?.initial ?? null : null} locked={!isFull} onClick={() => {}} />
              <div>
                <h3>{key}</h3>
                <p className="placeholder-text">{desc}</p>
              </div>
            </div>
            {!isFull && (
              <p className="placeholder-text lh-locked-text">
                Part of the full Senior UX Review. {audit.upsell?.message || "Upgrade to Premium to unlock this category."}
              </p>
            )}
          </div>
        ))}

        {/* ---------- Heuristic Evaluation ---------- */}
        <div className="lh-card">
          <h3>Heuristic Evaluation</h3>
          {heuristics.length > 0 ? (
            <table>
              <thead><tr><th>Heuristic</th><th>Score</th><th>Notes</th></tr></thead>
              <tbody>
                {heuristics.map((h) => (
                  <tr key={h.name}><td>{h.name}</td><td>{h.score}/10</td><td>{h.notes}</td></tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="placeholder-text">All 10 of Nielsen&apos;s usability heuristics, scored with evidence. Part of the full Senior UX Review.</p>
          )}
        </div>

        {/* ---------- Detailed Findings ---------- */}
        {isFull && findingGroups.length > 0 && (
          <div className="lh-card">
            <h3>Detailed Findings</h3>
            <div className="findings-section">
              <div className="senior-callout">✦ Reviewed like a senior designer, not scanned like a linter — every finding below shows what we saw, why it matters, who it affects, and what to change.</div>
              <div className="findings-legend">
                <span><span className="dot" style={{ background: "var(--red)" }} />Critical — fix first</span>
                <span><span className="dot" style={{ background: "var(--purple-1)" }} />Major — significant barrier</span>
                <span><span className="dot" style={{ background: "var(--yellow)" }} />Moderate — meaningful friction</span>
                <span><span className="dot" style={{ background: "var(--green)" }} />What works well</span>
              </div>

              {visibleGroups.map(([section, items]) => (
                <div className="findings-group" key={section}>
                  <h4>{section}</h4>
                  <div className="finding-grid">
                    {items.map((f, i) => {
                      const key = `${section}-${i}`;
                      const canFix = f.severity !== "What Works" && f.recommendation;
                      return (
                        <div className="finding-item" key={key}>
                          <div className="finding-shot">Screenshot</div>
                          <div className={`finding-box ${severityClass(f.severity)}`}>
                            <span className="sev-tag">{f.severity?.toUpperCase()}</span>
                            {f.observation && <p className="finding-observation">{f.observation}</p>}
                            <p className="finding-issue">
                              {f.issue}
                              {f.recommendation ? ` — ${f.recommendation}` : ""}
                            </p>
                            {canFix && (
                              <button type="button" className="fix-prompt-btn" onClick={() => handleCopyFixPrompt(f, key)}>
                                {copiedFindingKey === key ? "Copied ✓" : "Copy Fix Prompt →"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {findingGroups.length > 1 && (
                <button type="button" className="lh-show-more" onClick={() => setFindingsExpanded((v) => !v)}>
                  {findingsExpanded ? "Show less" : `Show ${findingGroups.length - 1} more section${findingGroups.length - 1 === 1 ? "" : "s"}`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <button type="button" className="btn btn-primary newaudit" onClick={onNewAudit}>+ New Audit</button>
    </section>
  );
}
