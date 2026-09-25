import { useSimStore } from "../../state/simStore";
import { DeviceNetworkFields } from "../shared/DeviceNetworkFields";
import type { InspectableId } from "../../state/simStore";

function StatusRow({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" | "warn" | "dim" }) {
  const toneClass = tone === "good" ? "text-cr-good" : tone === "bad" ? "text-cr-bad" : tone === "warn" ? "text-cr-warn" : tone === "dim" ? "text-cr-text-dim" : "text-cr-text";
  return (
    <div className="flex items-center justify-between rounded border border-cr-border/60 px-2 py-1.5 text-xs">
      <span className="text-cr-text-dim">{label}</span>
      <span className={`font-mono-industrial font-semibold ${toneClass}`}>{value}</span>
    </div>
  );
}

export function GenericDeviceInspector({ kind }: { kind: Exclude<InspectableId, "vfd"> }) {
  const device = useSimStore((s) => s.devices.find((d) => d.id === kind));
  const tags = useSimStore((s) => s.tags);
  const resetOverload = useSimStore((s) => s.resetOverload);
  const commOk = useSimStore((s) => Boolean(s.tags.VFD_Communication_OK));
  const setActiveTool = useSimStore((s) => s.setActiveTool);

  if (kind === "motor") {
    const running = Boolean(tags.Motor_Running);
    return (
      <div className="space-y-1.5 p-4 text-xs">
        <StatusRow label="Status" value={running ? "RUNNING" : "STOPPED"} tone={running ? "good" : "dim"} />
        <StatusRow label="Equipment" value="Motor 1" />
        <div className="pt-1 text-[11px] text-cr-text-dim">
          Motor 1 is driven by VFD-01. Open the VFD to check its network configuration and run command.
        </div>
      </div>
    );
  }

  if (kind === "sensor") {
    const on = Boolean(tags.Sensor_1);
    return (
      <div className="space-y-1.5 p-4 text-xs">
        <StatusRow label="Sensor 1" value={on ? "ON" : "OFF"} tone={on ? "good" : "dim"} />
        <div className="pt-1 text-[11px] text-cr-text-dim">Proximity sensor confirming Motor 1 shaft rotation.</div>
      </div>
    );
  }

  if (kind === "overload") {
    const ok = Boolean(tags.Overload_OK);
    return (
      <div className="space-y-2 p-4 text-xs">
        <StatusRow label="Overload Relay" value={ok ? "OK" : "TRIPPED"} tone={ok ? "good" : "bad"} />
        {!ok && (
          <button onClick={resetOverload} className="btn w-full py-1.5 text-[11px]" style={{ background: "var(--color-cr-warn)", color: "var(--color-cr-bg)" }}>
            Reset Overload Relay
          </button>
        )}
      </div>
    );
  }

  if (kind === "starter") {
    const energized = Boolean(tags.Motor_Command);
    return (
      <div className="space-y-1.5 p-4 text-xs">
        <StatusRow label="Motor Starter" value={energized ? "ENERGIZED" : "DE-ENERGIZED"} tone={energized ? "good" : "dim"} />
        <div className="pt-1 text-[11px] text-cr-text-dim">Contactor commanded directly by PLC rung 1 (Motor_Command).</div>
      </div>
    );
  }

  // plc / server / switch — real DeviceId with network config
  if (!device) return null;

  return (
    <div className="space-y-3 p-4 text-xs">
      <StatusRow label="Power" value={device.poweredOn ? "ON" : "OFF"} tone={device.poweredOn ? "good" : "dim"} />
      <StatusRow label="Ethernet Cable" value={device.cableConnected ? "CONNECTED" : "DISCONNECTED"} tone={device.cableConnected ? "good" : "bad"} />
      {kind === "plc" && <StatusRow label="VFD Communication" value={commOk ? "HEALTHY" : "FAULT"} tone={commOk ? "good" : "bad"} />}
      <div>
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-cr-text-dim">Network</div>
        <DeviceNetworkFields deviceId={kind} compact />
      </div>
      {kind === "plc" && (
        <button onClick={() => setActiveTool("plc")} className="btn w-full py-1.5 text-[11px]">
          Open PLC Software
        </button>
      )}
    </div>
  );
}
