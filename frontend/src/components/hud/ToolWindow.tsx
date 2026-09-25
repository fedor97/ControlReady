import { useSimStore } from "../../state/simStore";
import { NetworkToolsPanel } from "../panels/NetworkToolsPanel";
import { ScadaPanel } from "../panels/ScadaPanel";
import { ReportCard } from "../panels/ReportCard";
import { PlcSoftwareWindow } from "../panels/PlcSoftwareWindow";

const TITLES: Record<string, string> = {
  network: "Network Tools",
  plc: "PLC Software — PLC-01",
  scada: "SCADA — Plant Overview",
  report: "Work Order Report",
};

export function ToolWindow() {
  const activeTool = useSimStore((s) => s.activeTool);
  const setActiveTool = useSimStore((s) => s.setActiveTool);

  if (activeTool === "none") return null;

  return (
    <div className="pointer-events-auto absolute inset-4 z-20 flex flex-col overflow-hidden rounded-lg border border-cr-border bg-cr-panel shadow-2xl md:inset-x-16 md:inset-y-6">
      <div className="flex items-center justify-between border-b border-cr-border bg-cr-panel-2 px-4 py-2">
        <div className="text-sm font-bold text-cr-accent">{TITLES[activeTool]}</div>
        <button onClick={() => setActiveTool("none")} className="btn px-2 py-1 text-xs">
          ✕
        </button>
      </div>
      <div className="min-h-0 flex-1">
        {activeTool === "network" && <NetworkToolsPanel />}
        {activeTool === "plc" && <PlcSoftwareWindow />}
        {activeTool === "scada" && <ScadaPanel />}
        {activeTool === "report" && (
          <div className="mx-auto h-full max-w-md">
            <ReportCard />
          </div>
        )}
      </div>
    </div>
  );
}
