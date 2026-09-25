import { useSimStore } from "../../state/simStore";
import type { ToolId } from "../../state/simStore";

const TOOLS: { id: ToolId; label: string; enabled: boolean }[] = [
  { id: "network", label: "Network", enabled: true },
  { id: "plc", label: "PLC", enabled: true },
  { id: "vfd", label: "VFD", enabled: true },
  { id: "scada", label: "SCADA", enabled: true },
  { id: "report", label: "Report", enabled: true },
];

export function BottomToolbar() {
  const activeTool = useSimStore((s) => s.activeTool);
  const setActiveTool = useSimStore((s) => s.setActiveTool);
  const setWorkOrderOpen = useSimStore((s) => s.setWorkOrderOpen);
  const setInspected = useSimStore((s) => s.setInspected);
  const vfdFault = useSimStore((s) => s.vfd.faultCode);
  const alarmActive = useSimStore((s) => !s.tags.VFD_Communication_OK);

  function click(id: ToolId) {
    if (id === "vfd") {
      setInspected("vfd");
      return;
    }
    setActiveTool(activeTool === id ? "none" : id);
  }

  return (
    <div className="flex h-full items-center gap-2 border-t border-cr-border bg-cr-panel px-3">
      <ToolButton label="Work Order" active={false} onClick={() => setWorkOrderOpen(true)} />
      <div className="h-6 w-px bg-cr-border" />
      {TOOLS.map((t) => (
        <ToolButton
          key={t.id}
          label={t.label}
          active={activeTool === t.id}
          disabled={!t.enabled}
          alert={t.id === "scada" && alarmActive}
          badge={t.id === "vfd" && vfdFault ? vfdFault : undefined}
          onClick={() => click(t.id)}
        />
      ))}
      <div className="h-6 w-px bg-cr-border" />
      <ToolButton label="Drawings" active={false} disabled comingSoon onClick={() => {}} />
      <div className="ml-auto text-[11px] text-cr-text-dim">CONTROLREADY · Industrial Training Simulator</div>
    </div>
  );
}

function ToolButton({
  label,
  active,
  disabled,
  comingSoon,
  alert,
  badge,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  comingSoon?: boolean;
  alert?: boolean;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={comingSoon ? "Coming soon" : undefined}
      className={`btn relative px-3 py-1.5 text-xs ${active ? "btn-active" : ""}`}
    >
      {alert && <span className="absolute -top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-cr-bad" />}
      {label}
      {badge && <span className="rounded bg-cr-bad/20 px-1 text-[9px] font-bold text-cr-bad">{badge.replace("_", " ")}</span>}
    </button>
  );
}
