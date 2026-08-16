import { useState } from "react";
import Link from "next/link";

const MAX_COMPETITORS = 4;

function parseCompetitorUrls(raw) {
  return raw
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, MAX_COMPETITORS);
}

export default function Landing({ onStart, errorMessage }) {
  const [url, setUrl] = useState("");
  const [competitorsOpen, setCompetitorsOpen] = useState(false);
  const [competitorInput, setCompetitorInput] = useState("");

  function handleStart() {
    onStart(url.trim(), parseCompetitorUrls(competitorInput));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleStart();
  }

  return (
    <div className="lp-page">
      {/* ---------- Header ---------- */}
      <header className="lp-header">
        <div className="lp-logo">
          UX<span className="logo-accent">WHYNOT</span>
        </div>
        <nav className="lp-nav">
          <Link href="/features">Features</Link>
          <a href="#">Pricing</a>
          <a href="#">About</a>
        </nav>
        <div className="lp-header-right">
          <a href="#" className="lp-login">Login</a>
          <button type="button" className="lp-cta-pill">Audit Now →</button>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <main className="lp-hero">
        <div className="lp-glow lp-glow-left" />
        <div className="lp-glow lp-glow-mid" />
        <div className="lp-glow lp-glow-right" />
        <div className="lp-grid-bg" />

        <div className="lp-hero-inner">
          <div className="lp-headline-wrap">
            <div className="lp-headline-frame">
              <h1 className="lp-headline">
                <span className="lp-grad">A senior</span> UX designer<br />
                in your browser
              </h1>
              <span className="lp-corner lp-corner-tl" />
              <span className="lp-corner lp-corner-tr" />
              <span className="lp-corner lp-corner-bl" />
              <span className="lp-corner lp-corner-br" />
            </div>
            <div className="lp-badge-wrap">
              <svg className="lp-badge-arrow" width="60" height="50" viewBox="0 0 60 50" fill="none">
                <path d="M50 5 C 40 5, 15 10, 8 35" stroke="#9AA1AE" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 5" fill="none" />
                <path d="M14 28 L8 35 L2 27" stroke="#9AA1AE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              <div className="lp-badge">✦ Reviewed like<br />a senior designer</div>
            </div>
          </div>

          <p className="lp-sub">
            Built something with AI? Get it reviewed the way a senior designer would review it,
            backed by{" "}
            <span className="lp-sub-accent">
              real evidence
              <svg className="lp-underline" width="110" height="10" viewBox="0 0 110 10" fill="none">
                <path d="M2 7 Q 55 -2 108 7" stroke="#4BA9C8" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
            </span>
            , not generic feedback.
          </p>

          <div className="lp-search-pill">
            <span className="lp-globe-icon">🌐</span>
            <input
              type="text"
              placeholder="Paste your website or app URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button type="button" className="lp-cta-pill lp-cta-lg" onClick={handleStart}>
              ✦ Start Free Audit →
            </button>
          </div>

          {competitorsOpen && (
            <div className="lp-competitors-pill">
              <input
                type="text"
                placeholder={`Up to ${MAX_COMPETITORS} competitor URLs, comma-separated`}
                value={competitorInput}
                onChange={(e) => setCompetitorInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          )}

          {errorMessage && <div className="lp-error">{errorMessage}</div>}

          <div className="lp-secondary-row">
            <button type="button" className="lp-linklike" onClick={() => setCompetitorsOpen((o) => !o)}>
              {competitorsOpen ? "Hide competitor comparison" : "+ Compare against competitors (optional)"}
            </button>
            <span className="lp-dot">•</span>
            <button type="button" className="lp-linklike">Or upload a screenshot instead →</button>
            <span className="lp-dot">•</span>
            <button type="button" className="lp-linklike">Learn more about UXWHYNOT ↓</button>
            <span className="lp-dot">•</span>
            <Link href="/audits" className="lp-linklike">View past audits →</Link>
          </div>
        </div>

        {/* ---------- Floating preview cards ---------- */}
        <div className="lp-cards">
          <div className="lp-card lp-card-score">
            <div className="lp-score-ring">
              <svg viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#E8F7EC" strokeWidth="8" />
                <circle
                  cx="40" cy="40" r="34" fill="none" stroke="#43B86B" strokeWidth="8"
                  strokeDasharray="213.5" strokeDashoffset="17" strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                />
              </svg>
            </div>
            <div className="lp-score-block">
              <div className="lp-score-label">Overall UX Score</div>
              <div className="lp-score-num">92<span>/100</span></div>
              <div className="lp-score-tag">Excellent</div>
            </div>
            <div className="lp-issues">
              <div className="lp-issues-title">Top Issues</div>
              <div className="lp-issue-row"><span className="lp-sev red" /> Low contrast text <span className="lp-count red">2</span></div>
              <div className="lp-issue-row"><span className="lp-sev orange" /> Missing alt text <span className="lp-count orange">3</span></div>
              <div className="lp-issue-row"><span className="lp-sev yellow" /> Button size too small <span className="lp-count yellow">2</span></div>
            </div>
          </div>

          <div className="lp-card lp-card-report">
            <div className="lp-report-title">UX Audit Report</div>
            <div className="lp-report-tabs">
              <span className="active">Overview</span><span>Issues</span><span>Accessibility</span><span>Performance</span>
            </div>
            <div className="lp-report-body">
              <div className="lp-report-heading">Overview</div>
              <div className="lp-skeleton-lines">
                <div /><div /><div style={{ width: "60%" }} />
              </div>
              <div className="lp-report-image" />
            </div>
          </div>

          <div className="lp-card lp-card-a11y">
            <div className="lp-a11y-top">
              <div className="lp-a11y-title">Accessibility</div>
              <div className="lp-a11y-badge">AA</div>
            </div>
            <div className="lp-a11y-sub">WCAG 2.1 AA</div>
            <div className="lp-a11y-check">✓ Perceivable</div>
            <div className="lp-a11y-check">✓ Operable</div>
            <div className="lp-a11y-check">✓ Understandable</div>
            <div className="lp-a11y-check">✓ Robust</div>
          </div>
        </div>

        <span className="lp-heart">♡</span>
        <span className="lp-spark lp-spark-1">✦</span>
        <span className="lp-spark lp-spark-2">✦</span>
      </main>

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
