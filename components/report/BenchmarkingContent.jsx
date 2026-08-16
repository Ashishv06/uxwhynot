import { sumScores } from "../../lib/auditView";

export default function BenchmarkingContent({ benchmarking, productName, competitorNames }) {
  return (
    <>
      <p className="placeholder-text" style={{ marginBottom: 16 }}>
        Competitor scores are estimates from a single screenshot, not a hands-on audit —
        read them as directional, not as rigorous as {productName}&apos;s scores above.
      </p>

      {benchmarking.scoringMatrix?.length > 0 && (
        <div className="card">
          <h3>UX Scoring Matrix</h3>
          <table>
            <thead>
              <tr>
                <th>Dimension</th>
                <th>{productName}</th>
                {competitorNames.map((name) => (
                  <th key={name}>{name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {benchmarking.scoringMatrix.map((row) => (
                <tr key={row.dimension}>
                  <td>{row.dimension}</td>
                  <td title={row.product.rationale}>{row.product.score}/5</td>
                  {competitorNames.map((name) => {
                    const c = (row.competitors || []).find((x) => x.name === name);
                    return (
                      <td key={name} title={c?.rationale}>
                        {c ? `${c.score}/5` : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td><strong>Total</strong></td>
                <td><strong>{sumScores(benchmarking.scoringMatrix, (r) => r.product.score)}</strong></td>
                {competitorNames.map((name) => (
                  <td key={name}>
                    <strong>
                      {sumScores(benchmarking.scoringMatrix, (r) =>
                        (r.competitors || []).find((x) => x.name === name)?.score
                      )}
                    </strong>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {benchmarking.featureComparison?.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3>Feature Comparison</h3>
          {benchmarking.featureComparison.map((row) => (
            <div key={row.feature} style={{ marginBottom: 18 }}>
              <strong>{row.feature}</strong>
              <p className="placeholder-text">{productName}: {row.product}</p>
              {(row.competitors || []).map((c) => (
                <p className="placeholder-text" key={c.name}>{c.name}: {c.status}</p>
              ))}
              <p className="placeholder-text">{row.explanation}</p>
            </div>
          ))}
        </div>
      )}

      {benchmarking.flowComparison?.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3>Flow Comparison</h3>
          {benchmarking.flowComparison.map((row) => (
            <div key={row.flow} style={{ marginBottom: 18 }}>
              <strong>{row.flow}</strong>
              <p className="placeholder-text">
                {productName}: {row.product.steps} step(s) — {row.product.friction}
              </p>
              {(row.competitors || []).map((c) => (
                <p className="placeholder-text" key={c.name}>
                  {c.name}: {c.steps} step(s) — {c.friction}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
