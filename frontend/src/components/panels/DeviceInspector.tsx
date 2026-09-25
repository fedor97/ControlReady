import { useSimStore } from "../../state/simStore";
import type { InspectableId } from "../../state/simStore";
import { VfdInspector } from "./VfdInspector";
import { GenericDeviceInspector } from "./GenericDeviceInspector";

const NAMES: Record<InspectableId, string> = {
  plc: "PLC-01",
  vfd: "VFD-01",
  pc: "Engineering PC",
  server: "Automation Server",
  switch: "Ethernet Switch",
  motor: "Motor 1",
  sensor: "Sensor 1",
  overload: "Overload Relay",
  starter: "Motor Starter",
};

export function DeviceInspector() {
  const inspected = useSimStore((s) => s.inspected);
  const setInspected = useSimStore((s) => s.setInspected);
  const vfdFault = useSimStore((s) => s.vfd.faultCode);

  if (!inspected) return null;

  const badge = inspected === "vfd" && vfdFault ? { text: vfdFault.replace("_", " "), tone: "bad" as const } : null;

  return (
    <div className="pointer-events-auto flex h-full w-full flex-col overflow-hidden rounded-lg border border-cr-border bg-cr-panel/95 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between border-b border-cr-border bg-cr-panel-2 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono-industrial text-sm font-bold text-cr-text">{NAMES[inspected]}</span>
          {badge && <span className="rounded bg-cr-bad/20 px-1.5 py-0.5 text-[10px] font-bold text-cr-bad">{badge.text}</span>}
        </div>
        <button onClick={() => setInspected(null)} className="btn px-2 py-1 text-xs">
          ✕
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {inspected === "vfd" ? <VfdInspector /> : <GenericDeviceInspector kind={inspected} />}
      </div>
    </div>
  );
}
