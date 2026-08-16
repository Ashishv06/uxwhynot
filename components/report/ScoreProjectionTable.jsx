import { scoreBadgeClass } from "../../lib/auditView";

export default function ScoreProjectionTable({ scoreProjection }) {
  return (
    <table>
      <thead>
        <tr><th>Category</th><th>Initial</th><th></th><th>Optimized</th></tr>
      </thead>
      <tbody>
        {scoreProjection.map((row) => (
          <tr key={row.category}>
            <td>{row.category}</td>
            <td><span className={`badge ${scoreBadgeClass(row.initial)}`}>{row.initial}</span></td>
            <td className="arrow">→</td>
            <td><span className={`badge ${scoreBadgeClass(row.optimized)}`}>{row.optimized}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
