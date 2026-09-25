import { useEffect, useRef, useState } from "react";
import { useSimStore } from "../../state/simStore";
import { DeviceNetworkFields } from "../shared/DeviceNetworkFields";
import type { DeviceId } from "../../types";

type Tab = "ping" | "discovery" | "ipconfig" | "topology";
const TABS: { key: Tab; label: string }[] = [
  { key: "ping", label: "Ping" },
  { key: "discovery", label: "Discovery" },
  { key: "ipconfig", label: "IP Config" },
  { key: "topology", label: "Topology" },
];

function PingTab({ fromId, setFromId }: { fromId: DeviceId; setFromId: (id: DeviceId) => void }) {
  const devices = useSimStore((s) => s.devices);
  const runConsoleCommand = useSimStore((s) => s.runConsoleCommand);
  const consoleHistory = useSimStore((s) => s.consoleHistory);
  const [cmd, setCmd] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [consoleHistory]);

  function submit() {
    if (!cmd.trim()) return;
    runConsoleCommand(fromId, cmd);
    setCmd("");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-cr-border px-2 py-1.5 text-[11px]">
        <span className="text-cr-text-dim">From:</span>
        <select value={fromId} onChange={(e) => setFromId(e.target.value as DeviceId)} className="field-flat px-1.5 py-0.5 font-mono-industrial text-cr-text">
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-black/40 px-2 py-1.5 font-mono-industrial text-[11px] text-cr-good">
        <div className="mb-1 text-cr-text-dim">Try: ping 192.168.1.20</div>
        {consoleHistory.map((entry, i) => (
          <div key={i} className="mb-1.5">
            <div className="text-cr-info">{`> ${entry.command}`}</div>
            <pre className={`whitespace-pre-wrap ${entry.ok ? "text-cr-good" : "text-cr-bad"}`}>{entry.output}</pre>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-cr-border p-1.5">
        <input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="ping 192.168.1.20"
          className="field-flat flex-1 px-2 py-1.5 font-mono-industrial text-[11px] text-cr-text outline-none"
        />
        <button onClick={submit} className="btn px-3 py-1.5 text-[11px] text-cr-accent">
          Run
        </button>
      </div>
    </div>
  );
}

function DiscoveryTab({ fromId, setFromId }: { fromId: DeviceId; setFromId: (id: DeviceId) => void }) {
  const devices = useSimStore((s) => s.devices);
  const runDiscover = useSimStore((s) => s.runDiscover);
  const consoleHistory = useSimStore((s) => s.consoleHistory);
  const lastDiscovery = [...consoleHistory].reverse().find((e) => e.command === "discover");

  return (
    <div className="flex h-full flex-col p-2">
      <div className="mb-2 flex items-center gap-2 text-[11px]">
        <span className="text-cr-text-dim">From:</span>
        <select value={fromId} onChange={(e) => setFromId(e.target.value as DeviceId)} className="field-flat px-1.5 py-0.5 font-mono-industrial text-cr-text">
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <button onClick={() => runDiscover(fromId)} className="btn ml-auto px-2 py-1 text-[11px]" style={{ background: "var(--color-cr-info)", color: "var(--color-cr-bg)" }}>
          Discover Devices
        </button>
      </div>
      <pre className="flex-1 overflow-y-auto whitespace-pre-wrap rounded bg-black/40 p-2 font-mono-industrial text-[11px] text-cr-good">
        {lastDiscovery?.output ?? "Click Discover Devices to scan the network."}
      </pre>
    </div>
  );
}

function IpConfigTab() {
  const devices = useSimStore((s) => s.devices);
  const updateDeviceCable = useSimStore((s) => s.updateDeviceCable);
  const updateDevicePower = useSimStore((s) => s.updateDevicePower);
  return (
    <div className="h-full space-y-2 overflow-y-auto p-2">
      {devices.map((d) => (
        <div key={d.id} className="rounded border border-cr-border/60 p-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-cr-text">{d.name}</span>
            <div className="flex gap-1">
              <button onClick={() => updateDeviceCable(d.id, !d.cableConnected)} className="btn px-1.5 py-0.5 text-[10px]" style={{ color: d.cableConnected ? "var(--color-cr-good)" : "var(--color-cr-bad)" }}>
                {d.cableConnected ? "Cable OK" : "Cable OUT"}
              </button>
              <button onClick={() => updateDevicePower(d.id, !d.poweredOn)} className="btn px-1.5 py-0.5 text-[10px]" style={{ color: d.poweredOn ? "var(--color-cr-good)" : "var(--color-cr-text-dim)" }}>
                {d.poweredOn ? "PWR ON" : "PWR OFF"}
              </button>
            </div>
          </div>
          <DeviceNetworkFields deviceId={d.id} compact />
        </div>
      ))}
    </div>
  );
}

function TopologyTab() {
  const devices = useSimStore((s) => s.devices);
  const setInspected = useSimStore((s) => s.setInspected);
  const get = (id: DeviceId) => devices.find((d) => d.id === id);
  const sw = get("switch");
  const linkOk = (id: DeviceId) => {
    const d = get(id);
    return Boolean(sw?.poweredOn && sw?.cableConnected && d?.poweredOn && d?.cableConnected);
  };

  const Node = ({ id, label }: { id: DeviceId; label: string }) => (
    <button onClick={() => setInspected(id)} className="btn flex-col gap-1 px-3 py-2 text-center">
      <span className={`status-dot ${get(id)?.poweredOn ? "bg-cr-good" : "bg-cr-text-dim"}`} />
      <span className="text-[10px] font-semibold text-cr-text">{label}</span>
    </button>
  );

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-[11px]">
      <Node id="pc" label="Engineering PC" />
      <div className={`h-4 w-px ${linkOk("pc") ? "bg-cr-good" : "bg-cr-bad"}`} />
      <Node id="switch" label="Ethernet Switch" />
      <div className="flex gap-8">
        <div className="flex flex-col items-center gap-2">
          <div className={`h-4 w-px ${linkOk("plc") ? "bg-cr-good" : "bg-cr-bad"}`} />
          <Node id="plc" label="PLC-01" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className={`h-4 w-px ${linkOk("vfd") ? "bg-cr-good" : "bg-cr-bad"}`} />
          <Node id="vfd" label="VFD-01" />
        </div>
      </div>
      <div className={`h-4 w-px ${linkOk("server") ? "bg-cr-good" : "bg-cr-bad"}`} />
      <Node id="server" label="Automation Server" />
    </div>
  );
}

export function NetworkToolsPanel() {
  const [tab, setTab] = useState<Tab>("ping");
  const [fromId, setFromId] = useState<DeviceId>("pc");

  return (
    <div className="flex h-full flex-col">
      <div className="flex border-b border-cr-border">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 px-1 py-1.5 text-[11px] font-semibold ${tab === t.key ? "border-b-2 border-cr-accent text-cr-accent" : "text-cr-text-dim hover:text-cr-text"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        {tab === "ping" && <PingTab fromId={fromId} setFromId={setFromId} />}
        {tab === "discovery" && <DiscoveryTab fromId={fromId} setFromId={setFromId} />}
        {tab === "ipconfig" && <IpConfigTab />}
        {tab === "topology" && <TopologyTab />}
      </div>
    </div>
  );
}
