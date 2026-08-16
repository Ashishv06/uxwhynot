import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ----------------------------------------------------------------
// Content — kept as data so the JSX below stays readable. Every
// number/string here is illustrative demo content (this page shows
// what a real audit output looks like, it doesn't run one), matching
// the "Final Product-UI-Based Figma Prompt" spec section-by-section.
// ----------------------------------------------------------------

const HERO_SCORES = [
  { key: "Performance", score: 62, tone: "neutral" },
  { key: "Accessibility", score: 85, tone: "success" },
  { key: "Usability", score: 25, tone: "critical" },
  { key: "Visual Design", score: 71, tone: "cyan" },
  { key: "Conversion Readiness", score: 94, tone: "success" },
  { key: "Agentic Browsing", score: 68, tone: "neutral" },
];

const FEATURE_CARDS = [
  {
    n: "01",
    key: "Performance",
    score: 62,
    tone: "neutral",
    kind: "performance",
    metrics: [
      { label: "FCP", value: "3.4s" },
      { label: "LCP", value: "6.9s" },
      { label: "TBT", value: "2,130ms" },
      { label: "CLS", value: "0.011" },
      { label: "Speed Index", value: "6.1s" },
    ],
    opportunities: ["Reduce JavaScript execution time", "Minimize main-thread work", "Reduce unused JavaScript"],
  },
  {
    n: "02",
    key: "Accessibility",
    score: 85,
    tone: "success",
    kind: "checklist",
    checklist: ["Contrast", "Keyboard access", "Labels", "ARIA", "Touch targets", "Focus states"],
    badge: "WCAG 2.1 AA",
  },
  {
    n: "03",
    key: "Usability",
    score: 25,
    tone: "critical",
    kind: "list",
    list: ["Navigation clarity", "Error handling", "Form design", "Visual hierarchy", "Consistency"],
  },
  {
    n: "04",
    key: "Visual Design",
    score: 71,
    tone: "cyan",
    kind: "list",
    list: ["Hierarchy", "Consistency", "Spacing", "Typography", "Aesthetic coherence"],
  },
  {
    n: "05",
    key: "Conversion Readiness",
    score: 94,
    tone: "success",
    kind: "list",
    list: ["Primary CTA", "Forms", "Friction points", "Decision hierarchy", "Action visibility"],
  },
  {
    n: "06",
    key: "Agentic Browsing",
    score: 68,
    tone: "neutral",
    kind: "flow",
    desc: "How well this page works for an AI agent acting on a user's behalf, not just a human.",
    flow: ["Find", "Understand", "Navigate", "Act"],
  },
];

const CHAIN = [
  { step: "Observation", text: "Primary CTA has insufficient contrast." },
  { step: "Reasoning", text: "The CTA competes visually with surrounding content." },
  { step: "Impact", text: "Users may not immediately recognize the primary action." },
  { step: "Recommendation", text: "Increase contrast and strengthen visual hierarchy.", accent: true },
];

const HEURISTIC_ROWS = [
  { name: "Visibility of System Status", score: 8, notes: "Clear feedback on load and error states." },
  { name: "Match Between System and the Real World", score: 6, notes: "Some jargon in navigation labels." },
  { name: "User Control and Freedom", score: 7, notes: "Back/cancel available on most flows." },
  { name: "Consistency and Standards", score: 5, notes: "Button styles vary across pages." },
  { name: "Error Prevention", score: 4, notes: "No confirmation before destructive actions." },
  { name: "Aesthetic and Minimalist Design", score: 9, notes: "Clean layout, minimal clutter." },
];

const EVIDENCE_COLUMNS = [
  {
    severity: "Critical",
    tone: "critical",
    finding: "The homepage has no primary navigation exposing key sections.",
    fixable: true,
  },
  {
    severity: "Major",
    tone: "major",
    finding: "Some interactive elements are difficult to identify.",
    fixable: true,
  },
  {
    severity: "What Works",
    tone: "success",
    finding: "Clear hero message and primary CTA.",
    fixable: false,
  },
];

const SEVERITY_LEGEND = [
  { label: "Critical", detail: "Fix first", tone: "critical" },
  { label: "Major", detail: "Significant barrier", tone: "major" },
  { label: "Moderate", detail: "Meaningful friction", tone: "moderate" },
  { label: "What Works", detail: "Keep it", tone: "success" },
];

const SCREENSHOT_ANNOTATIONS = [
  { label: "Primary CTA", note: "Low contrast", top: "22%", left: "68%" },
  { label: "Navigation", note: "Hierarchy unclear", top: "10%", left: "10%" },
  { label: "Form", note: "Error prevention opportunity", top: "62%", left: "16%" },
];

const FIX_PROMPT = `Improve the navigation hierarchy while preserving the existing typography, spacing, brand colors and layout.

What's there now: The homepage has no primary navigation exposing key sections, visitors have to scroll to discover what's available.
Why it matters: Visitors may not know how to explore important sections, and bounce before finding what they came for.
Fix: Introduce clear primary navigation while preserving the current visual system.

Only change what's needed to resolve this issue.`;

const CATEGORY_DELTAS = [
  { key: "Accessibility", before: 71, after: 94 },
  { key: "Usability", before: 25, after: 82 },
  { key: "Visual Design", before: 71, after: 89 },
  { key: "Conversion Readiness", before: 94, after: 97 },
];

const SENIOR_COMMENTS = [
  { text: "Primary CTA competes with secondary actions.", tone: "orange", top: "18%", left: "60%" },
  { text: "Navigation hierarchy is unclear.", tone: "orange", top: "8%", left: "6%" },
  { text: "This interaction requires unnecessary cognitive effort.", tone: "cyan", top: "48%", left: "58%" },
  { text: "Mobile target is too small.", tone: "orange", top: "72%", left: "10%" },
  { text: "Strong visual hierarchy here — keep it.", tone: "success", top: "34%", left: "26%" },
];

const WORKFLOW_STEPS = [
  { n: "01", label: "Paste URL" },
  { n: "02", label: "Audit" },
  { n: "03", label: "Senior Review" },
  { n: "04", label: "Fix" },
  { n: "05", label: "Test", final: true },
];

// Small circular score gauge, shared by every mini product-UI fragment
// on this page. Mirrors the real Results.jsx gauge so these previews
// look like they belong to the same application, not a mockup drawn
// separately.
function scoreColor(score) {
  if (score >= 90) return "success";
  if (score >= 50) return "moderate";
  return "critical";
}

function Gauge({ score, size = 56, tone }) {
  const resolvedTone = tone || scoreColor(score);
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className={`f2-gauge f2-gauge-${resolvedTone}`} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="5" className="f2-gauge-track" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="5" className="f2-gauge-fill"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} strokeLinecap="round"
        />
      </svg>
      <span className="f2-gauge-value">{score}</span>
    </div>
  );
}

// Lightweight scroll-reveal: any element with .f2-reveal fades/slides in
// once it enters the viewport. One shared IntersectionObserver instead
// of per-section listeners, kept deliberately subtle per the "don't use
// excessive animations" note in the spec.
function useScrollReveal() {
  const rootRef = useRef(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = root.querySelectorAll(".f2-reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("f2-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("f2-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return rootRef;
}

export default function Features() {
  const pageRef = useScrollReveal();
  const [viewMode, setViewMode] = useState("mobile");
  const [copiedKey, setCopiedKey] = useState(null);

  function handleCopy(key, text) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
  }

  return (
    <div className="lp-page feat2-page" ref={pageRef}>
      {/* ---------- Header ---------- */}
      <header className="lp-header f2-sticky">
        <Link href="/" className="lp-logo">
          UX<span className="logo-accent">WHYNOT</span>
        </Link>
        <nav className="lp-nav">
          <Link href="/features" className="feat-nav-active">Features</Link>
          <a href="#">Pricing</a>
          <a href="#">About</a>
        </nav>
        <div className="lp-header-right">
          <a href="#" className="lp-login">Login</a>
          <Link href="/" className="f2-cta-orange">Audit Now →</Link>
        </div>
      </header>

      {/* ---------- 6. Hero ---------- */}
      <section className="f2-hero">
        <p className="f2-eyebrow">What UXWHYNOT actually does</p>
        <h1 className="f2-h1">
          Give every team access to <span className="f2-highlight">senior-level UX thinking</span>
        </h1>
        <p className="f2-hero-sub">
          AI made building interfaces cheap. It didn&apos;t make building good experiences equally cheap.
          UXWHYNOT is the layer that sits between &ldquo;AI built it&rdquo; and &ldquo;real users see it.&rdquo;
        </p>
      </section>

      {/* ---------- 7. Hero product visual ---------- */}
      <section className="f2-hero-visual-wrap">
        <div className="f2-browser f2-reveal">
          <div className="f2-browser-top">
            <span className="f2-url-pill">yourproduct.com</span>
            <div className="f2-browser-actions">
              <button type="button" className="f2-btn-ghost">Copy</button>
              <button type="button" className="f2-btn-ghost">Preview</button>
              <button type="button" className="f2-btn-dark">Download PDF</button>
            </div>
          </div>
          <div className="f2-browser-tabs">
            <button type="button" className={`f2-tab${viewMode === "mobile" ? " active" : ""}`} onClick={() => setViewMode("mobile")}>📱 Mobile</button>
            <button type="button" className={`f2-tab${viewMode === "desktop" ? " active" : ""}`} onClick={() => setViewMode("desktop")}>🖥 Desktop</button>
          </div>
          <div className="f2-gauge-row">
            {HERO_SCORES.map((s) => (
              <div className="f2-gauge-item" key={s.key}>
                <Gauge score={s.score} tone={s.tone} size={54} />
                <span className="f2-gauge-label">{s.key}</span>
              </div>
            ))}
          </div>
          <div className="f2-mini-cards">
            <div className="f2-mini-card tone-critical">
              <span className="f2-sev-tag">CRITICAL</span>
              <p>Primary navigation is difficult to discover on first load.</p>
            </div>
            <div className="f2-mini-card tone-major">
              <span className="f2-sev-tag">MAJOR</span>
              <p>Form fields don&apos;t explain why validation failed.</p>
            </div>
            <div className="f2-mini-card tone-success">
              <span className="f2-sev-tag">WHAT WORKS</span>
              <p>Hero message and primary CTA are immediately clear.</p>
            </div>
          </div>

          <span className="f2-float f2-float-1">6 UX dimensions</span>
          <span className="f2-float f2-float-2">WCAG 2.1 AA</span>
          <span className="f2-float f2-float-3">Heuristic evaluation</span>
          <span className="f2-float f2-float-4">Evidence-backed findings</span>
        </div>
      </section>

      {/* ---------- 8. Six ways to understand your product ---------- */}
      <section className="f2-section">
        <h2 className="f2-h2 f2-reveal">One audit. Six ways to understand your product.</h2>
        <p className="f2-lead f2-reveal">
          We evaluate your interface through six lenses: an engineering, design, and product perspective, all
          from one same run, not three separate tools.
        </p>
        <div className="f2-six-grid">
          {FEATURE_CARDS.map((c) => (
            <div className={`f2-six-card f2-reveal tone-${c.tone}`} key={c.key}>
              <div className="f2-six-top">
                <span className="f2-six-num">{c.n}</span>
                <Gauge score={c.score} tone={c.tone} size={44} />
              </div>
              <h3>{c.key}</h3>

              {c.kind === "performance" && (
                <>
                  <div className="f2-metric-row">
                    {c.metrics.map((m) => (
                      <div key={m.label}><span className="f2-metric-val">{m.value}</span><span className="f2-metric-lbl">{m.label}</span></div>
                    ))}
                  </div>
                  <div className="f2-opps">
                    <span className="f2-opps-title">Opportunities</span>
                    <ul>{c.opportunities.map((o) => <li key={o}>{o}</li>)}</ul>
                  </div>
                </>
              )}

              {c.kind === "checklist" && (
                <>
                  <span className="f2-wcag-badge">{c.badge}</span>
                  <ul className="f2-checklist">
                    {c.checklist.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </>
              )}

              {c.kind === "list" && (
                <ul className="f2-plainlist">
                  {c.list.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}

              {c.kind === "flow" && (
                <>
                  <p className="f2-six-desc">{c.desc}</p>
                  <div className="f2-agentic-flow">
                    {c.flow.map((step, i) => (
                      <span key={step} className="f2-agentic-step">
                        {step}
                        {i < c.flow.length - 1 && <span className="f2-agentic-arrow">→</span>}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ---------- 9. Transition ---------- */}
      <section className="f2-transition f2-reveal">
        <p>But UXWHYNOT doesn&apos;t stop at scoring.</p>
        <h2>It explains why.</h2>
      </section>

      {/* ---------- 10. Reasoning engine ---------- */}
      <section className="f2-section">
        <h2 className="f2-h2 f2-reveal">Not a scanner. A reasoning chain.</h2>
        <p className="f2-lead f2-reveal">
          A rule-violation scanner can tell you that something is wrong. UXWHYNOT explains what it means for
          the person using your product.
        </p>
        <div className="f2-reasoning-row f2-reveal">
          {CHAIN.map((c, i) => (
            <div className="f2-reasoning-item" key={c.step}>
              <div className={`f2-reasoning-card${c.accent ? " accent" : ""}`}>
                <span className="f2-reasoning-label">{c.step}</span>
                <p>&ldquo;{c.text}&rdquo;</p>
              </div>
              {i < CHAIN.length - 1 && <span className="f2-reasoning-arrow">↓</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ---------- 11. Generic scanner vs UXWHYNOT ---------- */}
      <section className="f2-section">
        <h2 className="f2-h2 f2-reveal">The difference is the reasoning.</h2>
        <div className="f2-compare f2-reveal">
          <div className="f2-compare-col scanner">
            <span className="f2-compare-label">Generic Scanner</span>
            <p className="f2-compare-quote">&ldquo;Primary CTA has insufficient contrast.&rdquo;</p>
            <span className="f2-compare-tag">WCAG 1.4.3</span>
          </div>
          <div className="f2-compare-col uxwhynot">
            <span className="f2-compare-label">UXWHYNOT</span>
            <ul>
              <li><strong>Observation</strong> — what&apos;s literally on screen</li>
              <li><strong>Reasoning</strong> — why that&apos;s a problem</li>
              <li><strong>Impact</strong> — who it affects, concretely</li>
              <li><strong>Recommendation</strong> — the specific fix</li>
              <li><strong>Evidence</strong> — the screenshot it came from</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- 12. Heuristic evaluation ---------- */}
      <section className="f2-section f2-tint">
        <div className="f2-inner">
          <h2 className="f2-h2 f2-reveal">Built on proven UX principles.</h2>
          <div className="f2-heuristic-table f2-reveal">
            <div className="f2-heuristic-head">
              <span>Heuristic</span><span>Score</span><span>Notes</span>
            </div>
            {HEURISTIC_ROWS.map((h) => (
              <div className="f2-heuristic-row" key={h.name}>
                <span>{h.name}</span>
                <span className={`f2-score-pill ${h.score >= 8 ? "success" : h.score >= 5 ? "moderate" : "critical"}`}>{h.score}/10</span>
                <span className="f2-heuristic-notes">{h.notes}</span>
              </div>
            ))}
            <a href="#" className="f2-view-all">View all 10 heuristics →</a>
          </div>
        </div>
      </section>

      {/* ---------- 13. Evidence ---------- */}
      <section className="f2-section">
        <h2 className="f2-h2 f2-reveal">Every finding comes with evidence.</h2>
        <p className="f2-lead f2-reveal">
          We don&apos;t just tell you something is wrong. We show you where it happens and why it matters.
        </p>
        <div className="f2-evidence-grid f2-reveal">
          {EVIDENCE_COLUMNS.map((e) => (
            <div className={`f2-evidence-card tone-${e.tone}`} key={e.severity}>
              <span className="f2-sev-tag">{e.severity.toUpperCase()}</span>
              <div className="f2-evidence-shot">Screenshot</div>
              <p>{e.finding}</p>
              {e.fixable && (
                <button type="button" className="f2-fix-btn" onClick={() => handleCopy(e.severity, `Fix: ${e.finding}`)}>
                  {copiedKey === e.severity ? "Copied ✓" : "Copy Fix Prompt →"}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* ---------- 14. Severity system ---------- */}
        <div className="f2-severity-legend f2-reveal">
          {SEVERITY_LEGEND.map((s) => (
            <span className="f2-severity-item" key={s.label}>
              <span className={`f2-severity-dot tone-${s.tone}`} />
              <strong>{s.label}</strong> — {s.detail}
            </span>
          ))}
        </div>
      </section>

      {/* ---------- 15. Screenshot-based UX review ---------- */}
      <section className="f2-section f2-tint">
        <div className="f2-inner">
          <h2 className="f2-h2 f2-reveal">See exactly where the problem lives.</h2>
          <p className="f2-lead f2-reveal">
            Our engine highlights exactly where a real interface falls short, mapped directly onto the
            page, exactly as Figma.
          </p>
          <div className="f2-screenshot f2-reveal">
            <div className="f2-screenshot-chrome">
              <span /><span /><span />
            </div>
            <div className="f2-screenshot-body">
              <div className="f2-wire-nav" />
              <div className="f2-wire-hero">
                <div className="f2-wire-line short" />
                <div className="f2-wire-line" />
                <div className="f2-wire-cta" />
              </div>
              <div className="f2-wire-form">
                <div className="f2-wire-field" />
                <div className="f2-wire-field" />
              </div>
              {SCREENSHOT_ANNOTATIONS.map((a) => (
                <div className="f2-annotation" style={{ top: a.top, left: a.left }} key={a.label}>
                  <span className="f2-annotation-dot" />
                  <span className="f2-annotation-label">{a.label}</span>
                  <span className="f2-annotation-line" />
                  <span className="f2-annotation-note">{a.note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 16. From finding to fix ---------- */}
      <section className="f2-section">
        <h2 className="f2-h2 f2-reveal">From finding to fix, in one click.</h2>
        <p className="f2-lead f2-reveal">Every actionable finding includes a ready-to-use Copy Fix Prompt.</p>
        <div className="f2-fix-grid f2-reveal">
          <div className="f2-fix-card">
            <span className="f2-sev-tag">CRITICAL</span>
            <h4>Homepage navigation is difficult to discover.</h4>
            <span className="f2-fix-label">Why it matters</span>
            <p>Visitors may not know how to explore important sections.</p>
            <span className="f2-fix-label">Recommendation</span>
            <p>Introduce clear primary navigation while preserving the current visual system.</p>
            <button type="button" className="f2-cta-orange f2-fix-cta" onClick={() => handleCopy("fixcard", FIX_PROMPT)}>
              {copiedKey === "fixcard" ? "Copied ✓" : "Copy Fix Prompt →"}
            </button>
          </div>
          <div className="f2-fix-panel">
            <div className="f2-fix-panel-head">
              <span className="f2-fix-dot" /> Generated Fix Prompt
            </div>
            <pre>{FIX_PROMPT}</pre>
          </div>
        </div>
      </section>

      {/* ---------- 17. Before / after ---------- */}
      <section className="f2-section f2-tint">
        <div className="f2-inner">
          <h2 className="f2-h2 f2-reveal">See the difference before your users do.</h2>
          <div className="f2-ba-grid f2-reveal">
            <div className="f2-ba-col before">
              <div className="f2-ba-head">
                <span>BEFORE</span>
                <span className="f2-ba-score critical">62</span>
              </div>
              <div className="f2-ba-mock">
                <div className="f2-wire-nav small" />
                <div className="f2-wire-line short" />
                <div className="f2-wire-line" />
              </div>
              <div className="f2-ba-tags">
                <span className="f2-severity-dot tone-critical" /> Critical
                <span className="f2-severity-dot tone-major" /> Major
                <span className="f2-severity-dot tone-moderate" /> Moderate
              </div>
            </div>
            <div className="f2-ba-col after">
              <div className="f2-ba-head">
                <span>AFTER</span>
                <span className="f2-ba-score success">91</span>
              </div>
              <div className="f2-ba-mock improved">
                <div className="f2-wire-nav small" />
                <div className="f2-wire-line short" />
                <div className="f2-wire-line" />
              </div>
              <div className="f2-ba-tags">
                <span className="f2-severity-dot tone-success" /> Resolved
                <span className="f2-severity-dot tone-cyan" /> Improved
                <span className="f2-severity-dot tone-success" /> Passed
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 18. Score transformation ---------- */}
      <section className="f2-section">
        <div className="f2-transform f2-reveal">
          <div className="f2-transform-score critical">62<span>/100</span></div>
          <div className="f2-transform-mid">
            <span className="f2-transform-arrow">↓</span>
            <span className="f2-transform-label">UXWHYNOT recommendations</span>
            <span className="f2-transform-arrow">↓</span>
          </div>
          <div className="f2-transform-score success">91<span>/100</span></div>
        </div>
        <div className="f2-delta-grid f2-reveal">
          {CATEGORY_DELTAS.map((d) => (
            <div className="f2-delta-item" key={d.key}>
              <span className="f2-delta-label">{d.key}</span>
              <span className="f2-delta-nums">
                <span className="from">{d.before}</span> → <span className="to">{d.after}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- 19. Senior review ---------- */}
      <section className="f2-section f2-tint">
        <div className="f2-inner">
          <h2 className="f2-h2 f2-reveal">What would a senior UX designer catch?</h2>
          <p className="f2-lead f2-reveal">UXWHYNOT combines automated checks with contextual UX reasoning.</p>
          <div className="f2-review-shot f2-reveal">
            <div className="f2-screenshot-chrome"><span /><span /><span /></div>
            <div className="f2-screenshot-body">
              <div className="f2-wire-nav" />
              <div className="f2-wire-hero">
                <div className="f2-wire-line short" />
                <div className="f2-wire-line" />
                <div className="f2-wire-cta" />
              </div>
              <div className="f2-wire-form">
                <div className="f2-wire-field" />
                <div className="f2-wire-field" />
              </div>
              {SENIOR_COMMENTS.map((c) => (
                <div className={`f2-comment tone-${c.tone}`} style={{ top: c.top, left: c.left }} key={c.text}>
                  {c.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 20. Final workflow ---------- */}
      <section className="f2-section">
        <div className="f2-workflow f2-reveal">
          {WORKFLOW_STEPS.map((s, i) => (
            <div className="f2-workflow-item" key={s.n}>
              <div className={`f2-workflow-num${s.final ? " final" : ""}`}>{s.n}</div>
              <span>{s.label}</span>
              {i < WORKFLOW_STEPS.length - 1 && <span className="f2-workflow-arrow">→</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ---------- 21. Final CTA ---------- */}
      <section className="f2-final-cta">
        <h2 className="f2-reveal">See what UXWHYNOT would catch on your product.</h2>
        <p className="f2-reveal">Paste a URL and get an evidence-backed UX audit in under two minutes.</p>
        <div className="f2-final-input f2-reveal">
          <span className="f2-globe">🌐</span>
          <input type="text" placeholder="Paste your website URL" />
          <Link href="/" className="f2-cta-orange">Start Free Audit →</Link>
        </div>
        <div className="f2-final-meta f2-reveal">
          <span>No credit card required</span><span>·</span><span>Website or screenshot</span><span>·</span><span>Results in minutes</span>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="lp-footer">
        <div className="lp-logo lp-logo-sm">
          UX<span className="logo-accent">WHYNOT</span>
        </div>
        <div className="lp-footer-copy">© UXWHYNOT 2026. All rights reserved.</div>
        <div className="lp-footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}
