export default function HeuristicTable({ heuristics }) {
  return (
    <table>
      <thead>
        <tr><th>Heuristic</th><th>Score</th><th>Notes</th></tr>
      </thead>
      <tbody>
        {heuristics.map((h) => (
          <tr key={h.name}>
            <td>{h.name}</td>
            <td>{h.score}/10</td>
            <td>{h.notes}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
