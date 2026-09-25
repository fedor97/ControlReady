import { useSimStore } from "../../state/simStore";
import type { CameraPreset } from "../../state/simStore";

const PRESETS: { key: CameraPreset; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "controlPanel", label: "Control Cabinet" },
  { key: "conveyor", label: "Conveyor" },
  { key: "motor", label: "Motor" },
  { key: "engineering", label: "Engineering PC" },
];

export function CameraPresetButtons() {
  const flyTo = useSimStore((s) => s.flyTo);
  const current = useSimStore((s) => s.cameraPreset);

  return (
    <div className="panel-flat pointer-events-auto flex flex-col gap-1 rounded-lg bg-cr-panel/95 p-2 backdrop-blur">
      <div className="mb-0.5 px-1 text-[10px] uppercase tracking-wide text-cr-text-dim">Camera</div>
      {PRESETS.map((p) => (
        <button key={p.key} onClick={() => flyTo(p.key)} className={`btn px-3 py-1.5 text-left text-xs ${current === p.key ? "btn-active" : ""}`}>
          {p.label}
        </button>
      ))}
    </div>
  );
}
