// Reflects the real job phase reported by /api/audit/status (polled from
// pages/index.js), instead of animating through steps on a fixed timer.

const BASE_STEPS = [
  { key: "capturing", label: "Loading your page and capturing a screenshot" },
  { key: "scanning", label: "Running automated accessibility checks" },
  { key: "benchmarking", label: "Capturing competitor screenshots" },
  { key: "analyzing", label: "Analyzing against the UX methodology with Claude" },
  { key: "done", label: "Finalizing your report" },
];

function stepsFor(hasCompetitors) {
  return hasCompetitors ? BASE_STEPS : BASE_STEPS.filter((s) => s.key !== "benchmarking");
}

function stepIndexForPhase(steps, phase) {
  const idx = steps.findIndex((s) => s.key === phase);
  return idx === -1 ? 0 : idx;
}

export default function Processing({ active, phase, hasCompetitors }) {
  const steps = stepsFor(hasCompetitors);
  const currentIndex = stepIndexForPhase(steps, phase);

  return (
    <div className={`modal-overlay${active ? " active" : ""}`}>
      <div className="modal-title">Audit Progression States</div>
      <div className="proc-card">
        <h2>Running Your Audit...!</h2>
        <p className="sub">
          We&apos;re exploring your product and checking it against real UX and accessibility standards.
          This won&apos;t take long, thanks for your patience.
        </p>
        <div className="checklist">
          {steps.slice(0, currentIndex + 1).map((step, i) => {
            const isDone = i < currentIndex || phase === "done";
            return (
              <div className={`step${isDone ? " done" : ""}`} key={step.key}>
                <span className={`icon ${isDone ? "check" : "spin"}`}>{isDone ? "✔" : ""}</span>
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
