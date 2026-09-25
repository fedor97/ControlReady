import { useSimStore } from "../../state/simStore";
import type { MissionPhase } from "../../state/simStore";

const STAGES: { key: MissionPhase; label: string }[] = [
  { key: "inspect", label: "Inspect" },
  { key: "diagnose", label: "Diagnose" },
  { key: "repair", label: "Repair" },
  { key: "test", label: "Test" },
  { key: "report", label: "Report" },
];

function phaseIndex(phase: MissionPhase): number {
  if (phase === "complete") return STAGES.length - 1;
  const i = STAGES.findIndex((s) => s.key === phase);
  return i === -1 ? 0 : i;
}

export function MissionStepper() {
  const phase = useSimStore((s) => s.getMissionPhase());
  const currentIndex = phaseIndex(phase);
  const complete = phase === "complete";

  return (
    <div className="hidden items-center gap-2 md:flex">
      {STAGES.map((stage, i) => {
        const done = i < currentIndex || complete;
        const current = i === currentIndex && !complete;
        return (
          <div key={stage.key} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                  done
                    ? "bg-cr-good text-cr-bg"
                    : current
                      ? "bg-cr-accent text-cr-bg ring-2 ring-cr-accent/40"
                      : "bg-cr-border text-cr-text-dim"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span className={`text-[10px] uppercase tracking-wide ${current ? "text-cr-accent" : "text-cr-text-dim"}`}>
                {stage.label}
              </span>
            </div>
            {i < STAGES.length - 1 && <div className={`h-px w-6 ${done ? "bg-cr-good" : "bg-cr-border"}`} />}
          </div>
        );
      })}
    </div>
  );
}
