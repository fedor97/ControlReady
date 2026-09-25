import { useState } from "react";
import { useSimStore } from "../../state/simStore";
import { totalHintsAvailable } from "../../engine/hintEngine";

export function HintPanel({ onClose }: { onClose: () => void }) {
  const hintsUsed = useSimStore((s) => s.hintsUsed);
  const requestHint = useSimStore((s) => s.requestHint);
  const fault = useSimStore((s) => s.fault);
  const [history, setHistory] = useState<{ level: number; text: string; isFinalAnswer: boolean }[]>([]);

  const maxHints = totalHintsAvailable(fault) + 1; // +1 for the final-answer reveal
  const exhausted = hintsUsed >= maxHints;

  function request() {
    const hint = requestHint();
    setHistory((h) => [...h, hint]);
  }

  return (
    <div className="pointer-events-auto flex w-96 flex-col rounded-lg border border-cr-border bg-cr-panel shadow-2xl">
      <div className="flex items-center justify-between border-b border-cr-border px-4 py-2">
        <div>
          <div className="text-xs tracking-widest text-cr-text-dim">TRAINING GUIDANCE</div>
          <div className="text-sm font-bold text-cr-accent">Rule-Based Hint System</div>
        </div>
        <button onClick={onClose} className="btn px-2 py-1 text-xs">
          ✕
        </button>
      </div>
      <div className="max-h-72 overflow-y-auto px-4 py-3 text-sm">
        {history.length === 0 && (
          <div className="text-cr-text-dim">
            Stuck? Request a hint. Hints escalate in specificity — using more of them will slightly lower your Fault Diagnosis
            score.
          </div>
        )}
        {history.map((h, i) => (
          <div key={i} className={`mb-2 rounded border px-3 py-2 ${h.isFinalAnswer ? "border-cr-warn/60 bg-cr-warn/10" : "border-cr-border bg-cr-panel-2"}`}>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-cr-text-dim">
              {h.isFinalAnswer ? "Answer" : `Hint ${h.level}`}
            </div>
            <div>{h.text}</div>
          </div>
        ))}
      </div>
      <div className="border-t border-cr-border px-4 py-3">
        <button onClick={request} disabled={exhausted} className="btn w-full px-4 py-2 text-sm" style={{ background: "var(--color-cr-warn)", color: "var(--color-cr-bg)" }}>
          {exhausted ? "No further hints" : `Request Hint (${hintsUsed}/${maxHints} used)`}
        </button>
      </div>
    </div>
  );
}
