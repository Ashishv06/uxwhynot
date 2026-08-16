// Linear, single-column report for the PDF export (see pages/api/audits/[id]/pdf.js).
// Reuses the same section components as the interactive Results view so the
// two never drift, but stacks everything in one document instead of tabs.

import { groupFindingsBySection, competitorNamesFrom, formatDate } from "../lib/auditView";
import ScoreProjectionTable from "./report/ScoreProjectionTable";
import FindingsSection from "./report/FindingsSection";
import HeuristicTable from "./report/HeuristicTable";
import BenchmarkingContent from "./report/BenchmarkingContent";

export default function PrintReport({ audit }) {
  const scoreProjection = audit.scoreProjection || [];
  const heuristics = audit.heuristics || [];
  const findingGroups = groupFindingsBySection(audit.findings);
  const benchmarking = audit.benchmarking;
  const productName = audit.title || audit.url;
  const competitorNames = competitorNamesFrom(benchmarking?.scoringMatrix);

  return (
    <div className="print-report">
      <header className="print-header">
        <div className="logo">UXWHYNOT</div>
        <h1>{productName}</h1>
        <p className="placeholder-text">{audit.url}</p>
        <p className="placeholder-text">Generated {formatDate(audit.generatedAt)}</p>
      </header>

      <div className="card">
        <h3>Score Projection</h3>
        <ScoreProjectionTable scoreProjection={scoreProjection} />
      </div>

      <div style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Findings</h3>
        <FindingsSection findingGroups={findingGroups} />
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>Heuristic Evaluation</h3>
        {heuristics.length > 0 ? (
          <HeuristicTable heuristics={heuristics} />
        ) : (
          <p className="placeholder-text">
            Heuristic evaluation, visual design, and conversion readiness scoring are part of the
            full Senior UX Review. Upgrade to Premium to unlock them.
          </p>
        )}
      </div>

      {benchmarking && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Benchmarking</h3>
          <BenchmarkingContent
            benchmarking={benchmarking}
            productName={productName}
            competitorNames={competitorNames}
          />
        </div>
      )}
    </div>
  );
}
