# UXWHYNOT — starter build

This started as a working skeleton and has grown past v1: paste a URL, a
headless browser screenshots it and scans it for accessibility issues, Claude
analyzes both against the methodology in `lib/methodologyPrompt.js`, and the
result renders in the same UI you already reviewed as a static prototype —
plus background job progress, saved history, optional competitor
benchmarking, and real PDF export (all detailed in the roadmap below).

It's still scoped to one product per audit, no login. Not yet built: the full
spec's autonomous competitor discovery and multi-tier benchmarking (v2 in
`UX_Audit_Plugin_Spec_v2.md`) — you always provide competitor URLs yourself.

## What's here

```
lib/
  captureSite.js         screenshots a URL + runs an axe-core accessibility scan
  claudeAudit.js          sends that (+ competitor screenshots) to Claude, gets back structured JSON
  methodologyPrompt.js    the audit methodology, as Claude's instructions (reasoning-chain findings)
  auditSchema.js           the exact shape Claude must return
  jobStore.js              in-memory job store backing the async audit flow
  db.js                    SQLite persistence for past audits
  auditView.js             pure helpers shared by the results view and the PDF report
  friendlyError.js         maps raw upstream errors (Anthropic, Playwright) to user-facing copy
  plans.js                 Free/Premium quota numbers + calendar-week reset math
  quota.js                 pure quota check/consume logic, no DB calls
  automatedOnlyAudit.js    builds the free-tier (axe-scan-only, zero Claude cost) result
pages/
  index.js                the whole app: landing -> processing -> redirects to /audits/{id}
  features.js              /features — what the product does, reasoning chain, roadmap
  audits/index.js          list of past audits
  audits/[id].js            a saved audit's results page
  audits/[id]/print.js      linear report view, screenshotted to PDF (not for browsing directly)
  api/audit/start.js       kicks off an audit job (quota-gated), returns { jobId } immediately
  api/audit/status.js      poll this with a jobId for phase + final result
  api/audits/[id]/pdf.js    renders audits/[id]/print.js to a PDF via headless Chromium
components/
  Landing.jsx, Processing.jsx, Results.jsx, PrintReport.jsx, Features.jsx
  report/                  section components shared between Results.jsx and PrintReport.jsx
db/schema.sql              users/audits tables for real auth + persistent quota (not run automatically)
styles/globals.css         light-theme design system (see below), plus print + features styles
```

**Design system.** The whole product shares one light-theme visual language —
white surfaces, `--purple-1`/`--purple-2` (orange, despite the name — long
story, see the git history) for primary actions, `--accent-1`/`--accent-2`
(cyan) for navigation and identity, defined once as CSS variables in
`styles/globals.css` and used by every page (Landing, Processing modal,
Results/dashboard, past-audits list, Features, PDF report). The landing and
features pages' `.lp-*` classes are the one deliberately self-contained
exception — they carry their own local palette so their more illustrative,
marketing-page styling (floating cards, grid background, hand-drawn accents)
doesn't leak into the rest of the product.

**Freemium gating.** Free tier gets the automated axe-core scan only (real
findings, zero Claude cost, unlimited). Premium gets 10 full Senior UX
Review audits per calendar week (resets Monday 00:00 UTC — see `lib/plans.js`
for the numbers, marked as an example to validate against real Claude spend).
`pages/api/audit/start.js` checks quota before deciding whether to call
Claude; `lib/automatedOnlyAudit.js` builds the free-tier result directly from
the accessibility scan, in the exact same shape a full audit returns, so
`Results.jsx` renders either one without a branch. **There's no real auth or
database yet** — `getRequestUser()` in `pages/api/audit/start.js` is a stub
that treats every request as an anonymous free-tier user (see the TODO
comment there for what wiring up real auth + `db/schema.sql` looks like).

Audits run as a background job: `POST /api/audit/start` returns a `jobId`
right away, and `pages/index.js` polls `GET /api/audit/status?jobId=...`
every ~1.2s. `components/Processing.jsx` reflects the real phase the backend
is in (`capturing` -> `scanning` -> `analyzing` -> `done`) instead of
animating on a fixed timer. The job store is a plain in-memory `Map` — correct
for the always-on single Node process this app is meant to run as (see
Deploying below); swap it for Redis/a DB row if you ever run multiple
instances behind a load balancer.

## Running it yourself

You'll need [Node.js](https://nodejs.org) installed (the LTS version). Then, in this folder:

```bash
npm install
npx playwright install chromium    # only needed once, downloads the headless browser
cp .env.example .env.local          # then paste your real Anthropic API key into it
npm run dev
```

`npm install` compiles a small native binary for the SQLite database
(`better-sqlite3`). On macOS that needs Xcode Command Line Tools, which are
usually already present; if the install fails complaining about a missing
compiler, run `xcode-select --install` and try again.

Open http://localhost:3000, paste a URL, and watch it run for real. Get an API
key at https://console.anthropic.com/settings/keys — never put that key in
any file that ships to the browser, it only belongs in `.env.local` and in
your hosting provider's environment variable settings.

## Deploying it, the one decision that matters

A single audit can take 20-90 seconds (browser load + screenshot + a Claude
vision call). **Don't deploy this to a platform whose serverless functions
have a short execution timeout** (Vercel's free tier caps at 10 seconds,
you'll get silent failures). Deploy it as a normal, always-on Node process
instead:

- **Render.com** or **Railway.app** — connect your GitHub repo, set the build
  command to `npm install && npm run build`, the start command to
  `npm start`, add your `ANTHROPIC_API_KEY` as an environment variable, done.
  Both have simple free/cheap tiers and no timeout surprise.
- If you do want Vercel specifically, you're on the Pro plan and setting
  `maxDuration` on the API route — more setup, skip it for v1.

## What to build next (in order)

1. **Try it on 5-10 real sites first.** Read the findings Claude produces.
   Tighten `methodologyPrompt.js` based on what's actually wrong with the
   output before adding any new feature, a better prompt is worth more than
   more code right now.
2. ~~**Real progress instead of the timer.**~~ Done — the audit runs as a
   background job (`api/audit/start.js` + `api/audit/status.js`, backed by
   `lib/jobStore.js`) and `components/Processing.jsx` reflects the real
   phase. If you outgrow a single Node process, swap the in-memory store for
   Redis or a database row without touching the frontend contract.
3. ~~**Persistence.**~~ Done — audits are saved to a local SQLite file
   (`lib/db.js`, `data/audits.db`, gitignored) as soon as a job completes.
   Each result gets a durable URL at `/audits/{id}` (so a refresh re-fetches
   it instead of losing it), and `/audits` lists everything you've run,
   linked from the "View past audits" button on the home page. No account or
   API keys needed. If you later deploy somewhere with an ephemeral
   filesystem (e.g. most serverless platforms — see the deploy note above)
   or want audits shared across instances, swap `lib/db.js` for Supabase/
   Postgres; nothing else needs to change.
4. ~~**Competitor benchmarking (v2 in the spec doc).**~~ Done for the MVP
   version — click "+ Compare against competitors" on the home page and add
   up to 4 URLs. Each gets a lightweight screenshot-only capture (no
   accessibility scan, no full audit — see the spec's Core Principle: it's an
   estimate from browsing, not a hands-on audit) and Claude fills in the
   `benchmarking` field of `auditSchema.js` (Feature Comparison, Flow
   Comparison, Scoring Matrix), rendered on the Benchmarking tab of the
   results page. If a competitor's site blocks automated capture (CSP, bot
   detection), that competitor is excluded from the comparison rather than
   guessed at — this is a known, expected failure mode, see the spec's Known
   Constraint section. Not yet built: the full spec's "propose competitors if
   none given" scope-confirmation step — you always provide the URLs
   yourself.
5. ~~**PDF export that's actually a PDF**, not `window.print()`.~~ Done —
   "Download PDF" now hits `GET /api/audits/[id]/pdf`, which renders a
   dedicated linear report view (`pages/audits/[id]/print.js`,
   `components/PrintReport.jsx`) in headless Chromium via **Playwright**
   (already a dependency for capture, so no separate Puppeteer install) and
   calls `page.pdf()` server-side. The report and interactive results view
   share the same section components (`components/report/*.jsx`) so they
   can't drift apart.

## Starting your first Claude Code session

Open this folder in Claude Code (`cd` into it, run `claude`) and a good first
prompt is something like:

> This is a working Next.js starter for a UX audit tool. Read README.md and
> lib/methodologyPrompt.js to understand what it does. I want to [pick one:
> improve the audit prompt / add real progress streaming / add a database /
> deploy this to Render]. Walk me through it step by step, I'm not a
> developer, so explain what each command does before I run it.

Claude Code can read this whole codebase, so it doesn't need you to
re-explain what's already here, just point it at what you want to change
next.
