import { useState } from "react";
import { useSimStore } from "../../state/simStore";
import { DeviceNetworkFields } from "../shared/DeviceNetworkFields";
import type { PingResult } from "../../types";

type Tab = "overview" | "network" | "parameters" | "faults";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "network", label: "Network" },
  { key: "parameters", label: "Parameters" },
  { key: "faults", label: "Faults" },
];

export function VfdInspector() {
  const vfd = useSimStore((s) => s.vfd);
  const device = useSimStore((s) => s.devices.find((d) => d.id === "vfd"));
  const updateDeviceCable = useSimStore((s) => s.updateDeviceCable);
  const runPing = useSimStore((s) => s.runPing);
  const updateVfdParams = useSimStore((s) => s.updateVfdParams);
  const [tab, setTab] = useState<Tab>("overview");
  const [lastPing, setLastPing] = useState<PingResult | null>(null);

  if (!device) return null;

  const statusLabel = vfd.faultCode ?? (vfd.running ? "RUNNING" : device.poweredOn ? "READY" : "OFFLINE");
  const statusTone = vfd.faultCode ? "text-cr-bad" : vfd.running ? "text-cr-good" : "text-cr-text-dim";

  return (
    <div className="flex h-full flex-col">
      <div className="flex border-b border-cr-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 px-2 py-2 text-[11px] font-semibold ${
              tab === t.key ? "border-b-2 border-cr-accent text-cr-accent" : "text-cr-text-dim hover:text-cr-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 text-xs">
        {tab === "overview" && (
          <div className="space-y-1.5">
            <Row label="Status" value={statusLabel} tone={statusTone} />
            <Row label="Power" value={device.poweredOn ? "ON" : "OFF"} tone={device.poweredOn ? "text-cr-good" : "text-cr-text-dim"} />
            <Row label="Run Command" value={vfd.runCommand ? "ON" : "OFF"} />
            <Row label="Output Frequency" value={`${vfd.outputFrequency.toFixed(1)} Hz`} />
            <Row label="Motor Current" value={`${vfd.motorCurrent.toFixed(2)} A`} />
            <Row label="Fault Code" value={vfd.faultCode ?? "None"} tone={vfd.faultCode ? "text-cr-bad" : "text-cr-good"} />
          </div>
        )}

        {tab === "network" && <DeviceNetworkFields deviceId="vfd" />}

        {tab === "parameters" && (
          <div className="space-y-3">
            <SliderRow label="Frequency Reference" unit="Hz" min={0} max={60} value={vfd.params.frequencyReference} onChange={(v) => updateVfdParams({ frequencyReference: v })} />
            <SliderRow label="Acceleration" unit="s" min={1} max={20} value={vfd.params.acceleration} onChange={(v) => updateVfdParams({ acceleration: v })} />
            <SliderRow label="Deceleration" unit="s" min={1} max={20} value={vfd.params.deceleration} onChange={(v) => updateVfdParams({ deceleration: v })} />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={vfd.params.networkControlEnabled} onChange={(e) => updateVfdParams({ networkControlEnabled: e.target.checked })} />
              Network Control Mode Enabled
            </label>
          </div>
        )}

        {tab === "faults" && (
          <div className="space-y-2">
            {vfd.faultCode ? (
              <div className="rounded border border-cr-bad/40 bg-cr-bad/10 px-3 py-2 text-cr-bad">
                <div className="font-semibold">{vfd.faultCode}</div>
                <div className="mt-1 text-cr-text-dim">
                  Communication fault — the PLC cannot reach the VFD on the network. Correct the VFD's IP/subnet in the Network
                  tab; this fault clears automatically once communication is restored.
                </div>
              </div>
            ) : (
              <div className="rounded border border-cr-good/40 bg-cr-good/10 px-3 py-2 text-cr-good">No active faults.</div>
            )}
          </div>
        )}
      </div>

      {lastPing && (
        <div className={`mx-4 mb-2 rounded border px-2 py-1 text-[11px] ${lastPing.ok ? "border-cr-good/40 text-cr-good" : "border-cr-bad/40 text-cr-bad"}`}>
          {lastPing.message.split("\n")[0]}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 border-t border-cr-border p-3">
        <ActionButton onClick={() => setLastPing(runPing("plc", device.network.ip))}>Ping Device</ActionButton>
        {device.cableConnected ? (
          <ActionButton onClick={() => updateDeviceCable("vfd", false)}>Disconnect Ethernet</ActionButton>
        ) : (
          <ActionButton onClick={() => updateDeviceCable("vfd", true)}>Reconnect Ethernet</ActionButton>
        )}
        <ActionButton onClick={() => setTab("faults")}>View Faults</ActionButton>
        <ActionButton primary onClick={() => setTab("parameters")}>
          Open VFD Parameters
        </ActionButton>
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between rounded border border-cr-border/60 px-2 py-1.5">
      <span className="text-cr-text-dim">{label}</span>
      <span className={`font-mono-industrial font-semibold ${tone ?? "text-cr-text"}`}>{value}</span>
    </div>
  );
}

function SliderRow({ label, unit, min, max, value, onChange }: { label: string; unit: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-cr-text-dim">
        <span>{label}</span>
        <span className="font-mono-industrial text-cr-text">
          {value} {unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-cr-accent" />
    </div>
  );
}

function ActionButton({ children, onClick, primary }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button onClick={onClick} className="btn px-2 py-1.5 text-[11px]" style={primary ? { background: "var(--color-cr-info)", color: "var(--color-cr-bg)" } : undefined}>
      {children}
    </button>
  );
}
