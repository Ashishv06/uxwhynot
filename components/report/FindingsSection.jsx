import { useState } from "react";
import { severityClass } from "../../lib/auditView";

const COPIED_LABEL_MS = 1500;

export default function FindingsSection({ findingGroups, getFixPrompt }) {
  const [copiedKey, setCopiedKey] = useState(null);

  function handleCopyFixPrompt(key, finding) {
    navigator.clipboard?.writeText(getFixPrompt(finding)).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), COPIED_LABEL_MS);
  }

  return (
    <div className="findings-section">
      <div className="findings-legend">
        <span><span className="dot" style={{ background: "var(--red)" }} />Critical — fix first</span>
        <span><span className="dot" style={{ background: "var(--purple-1)" }} />Major — significant barrier</span>
        <span><span className="dot" style={{ background: "var(--yellow)" }} />Moderate — meaningful friction</span>
        <span><span className="dot" style={{ background: "var(--green)" }} />What works well</span>
      </div>

      {findingGroups.map(([section, items]) => (
        <div className="findings-group" key={section}>
          <h4>{section}</h4>
          <div className="finding-grid">
            {items.map((f, i) => {
              const key = `${section}-${i}`;
              const isWhatWorks = f.severity === "What Works";
              return (
                <div className="finding-item" key={key}>
                  <div className="finding-shot">Screenshot</div>
                  <div className={`finding-box ${severityClass(f.severity)}`}>
                    <span className="sev-tag">{f.severity?.toUpperCase()}</span>
                    {f.observation && <div className="finding-observation">{f.observation}</div>}
                    <div className="finding-issue">
                      {f.issue}
                      {f.recommendation ? ` — ${f.recommendation}` : ""}
                    </div>
                    {!isWhatWorks && getFixPrompt && (
                      <button
                        type="button"
                        className="fix-prompt-btn"
                        onClick={() => handleCopyFixPrompt(key, f)}
                      >
                        {copiedKey === key ? "Copied ✓" : "Copy Fix Prompt"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {findingGroups.length === 0 && (
        <p className="placeholder-text">No findings above Minor severity were returned for this audit.</p>
      )}
    </div>
  );
}
