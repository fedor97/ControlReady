import { useNavigate } from "react-router-dom";
import { useSimStore } from "../../state/simStore";
import { MissionStepper } from "./MissionStepper";

export function TopBar({ hintOpen, onToggleHint }: { hintOpen: boolean; onToggleHint: () => void }) {
  const navigate = useNavigate();
  const labName = useSimStore((s) => s.lab.name);
  const hintsUsed = useSimStore((s) => s.hintsUsed);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-cr-border bg-cr-panel px-4">
      <div className="flex items-center gap-1">
        <div className="font-mono-industrial text-sm font-black leading-none text-cr-text">
          CONTROL<span className="text-cr-accent">READY</span>
        </div>
        <div className="ml-2 hidden text-[10px] leading-none text-cr-text-dim lg:block">
          Train Like You Already
          <br />
          Have the Job.
        </div>
      </div>

      <MissionStepper />

      <div className="flex items-center gap-3">
        <div className="hidden text-xs text-cr-text-dim sm:block">
          Lab: <span className="text-cr-text">{labName}</span>
        </div>
        <button
          onClick={onToggleHint}
          className="btn px-3 py-1.5 text-xs"
          style={hintOpen ? { background: "var(--color-cr-warn)", color: "var(--color-cr-bg)" } : { color: "var(--color-cr-warn)" }}
        >
          Need a Hint? {hintsUsed > 0 && `(${hintsUsed})`}
        </button>
        <button onClick={() => navigate("/labs")} className="btn px-3 py-1.5 text-xs">
          Exit
        </button>
      </div>
    </header>
  );
}
