import { useSimStore } from "../../state/simStore";
import type { ToolId } from "../../state/simStore";

const APPS: { tool: ToolId | "vfd-inspector"; label: string; hint: string }[] = [
  { tool: "network", label: "Network Tools", hint: "Ping devices, discover the LAN, edit IP configuration" },
  { tool: "plc", label: "PLC Software", hint: "Controller organizer, live ladder logic, tag monitoring" },
  { tool: "vfd-inspector", label: "VFD Tool", hint: "Full drive configuration for VFD-01" },
  { tool: "scada", label: "SCADA", hint: "Plant-wide status overview and alarms" },
];

export function EngineeringWorkstationModal({ onClose }: { onClose: () => void }) {
  const setActiveTool = useSimStore((s) => s.setActiveTool);
  const setInspected = useSimStore((s) => s.setInspected);

  function launch(tool: ToolId | "vfd-inspector") {
    if (tool === "vfd-inspector") setInspected("vfd");
    else setActiveTool(tool);
    onClose();
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-cr-border bg-cr-panel shadow-2xl">
        <div className="flex items-center justify-between border-b border-cr-border bg-cr-panel-2 px-5 py-3">
          <div>
            <div className="text-xs tracking-widest text-cr-text-dim">ENGINEERING WORKSTATION</div>
            <div className="font-mono-industrial text-sm font-bold text-cr-accent">192.168.1.50</div>
          </div>
          <button onClick={onClose} className="btn px-2 py-1 text-xs">
            ✕
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 p-5">
          {APPS.map((app) => (
            <button key={app.label} onClick={() => launch(app.tool)} className="btn flex flex-col items-start gap-1 p-3 text-left">
              <span className="text-sm font-semibold text-cr-text">{app.label}</span>
              <span className="text-[11px] font-normal text-cr-text-dim">{app.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
