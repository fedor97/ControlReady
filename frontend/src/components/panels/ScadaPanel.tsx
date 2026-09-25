import { useEffect, useState } from "react";
import { useSimStore } from "../../state/simStore";

function StatusChip({ label, value, tone }: { label: string; value: string; tone: "good" | "bad" | "dim" }) {
  const toneClass = tone === "good" ? "border-cr-good/50 bg-cr-good/10 text-cr-good" : tone === "bad" ? "border-cr-bad/50 bg-cr-bad/10 text-cr-bad" : "border-cr-border bg-cr-panel-2 text-cr-text-dim";
  return (
    <div className={`flex flex-col items-center gap-0.5 rounded border px-2 py-1.5 text-center ${toneClass}`}>
      <span className="text-[9px] uppercase tracking-wide opacity-80">{label}</span>
      <span className="text-[11px] font-bold">{value}</span>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const max = 60;
  const w = 100;
  const h = 28;
  const points = values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * w;
      const y = h - (Math.min(v, max) / max) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full">
      <polyline points={points} fill="none" stroke="var(--color-cr-accent)" strokeWidth="1.5" />
    </svg>
  );
}

type Tab = "overview" | "alarms";

export function ScadaPanel() {
  const plc = useSimStore((s) => s.devices.find((d) => d.id === "plc"));
  const vfd = useSimStore((s) => s.vfd);
  const motorRunning = useSimStore((s) => Boolean(s.tags.Motor_Running));
  const commOk = useSimStore((s) => Boolean(s.tags.VFD_Communication_OK));
  const pressStart = useSimStore((s) => s.pressStart);
  const pressStop = useSimStore((s) => s.pressStop);
  const alarmAcknowledged = useSimStore((s) => s.alarmAcknowledged);
  const acknowledgeAlarm = useSimStore((s) => s.acknowledgeAlarm);
  const [tab, setTab] = useState<Tab>("overview");
  const [history, setHistory] = useState<number[]>([]);
  const startedAt = useSimStore((s) => s.startedAt);

  useEffect(() => {
    const id = setInterval(() => {
      setHistory((h) => [...h.slice(-29), useSimStore.getState().vfd.outputFrequency]);
    }, 400);
    return () => clearInterval(id);
  }, []);

  // Alarm derives from live state — it disappears automatically the instant comms are healthy again.
  const alarmActive = !commOk;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-cr-border px-2 py-1">
        <div className="flex gap-3">
          <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>
            Overview
          </TabButton>
          <TabButton active={tab === "alarms"} onClick={() => setTab("alarms")}>
            Alarms {alarmActive && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-cr-bad" />}
          </TabButton>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {tab === "overview" && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-1.5">
              <StatusChip label="PLC-01" value={plc?.poweredOn ? "ONLINE" : "OFFLINE"} tone={plc?.poweredOn ? "good" : "dim"} />
              <StatusChip label="VFD-01" value={vfd.faultCode ? "COMM FAULT" : vfd.running ? "RUNNING" : "READY"} tone={vfd.faultCode ? "bad" : "good"} />
              <StatusChip label="Motor 1" value={motorRunning ? "RUNNING" : "STOPPED"} tone={motorRunning ? "good" : "dim"} />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-[10px] text-cr-text-dim">
                <span>Output Frequency</span>
                <span className="font-mono-industrial text-cr-text">{vfd.outputFrequency.toFixed(1)} Hz</span>
              </div>
              <Sparkline values={history.length ? history : [0]} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={pressStart} className="btn py-1.5 text-[11px]" style={{ background: "var(--color-cr-good)", color: "var(--color-cr-bg)" }}>
                Start Motor
              </button>
              <button onClick={pressStop} className="btn py-1.5 text-[11px]" style={{ background: "var(--color-cr-bad)", color: "white" }}>
                Stop Motor
              </button>
            </div>

            {alarmActive && (
              <div className={`rounded border px-2 py-1.5 text-[10px] ${alarmAcknowledged ? "border-cr-border bg-cr-panel-2 text-cr-text-dim" : "border-cr-bad/50 bg-cr-bad/10 text-cr-bad"}`}>
                <span className="font-bold">ALM-001</span> VFD-01 Communication Lost
              </div>
            )}
          </div>
        )}

        {tab === "alarms" && (
          <div className="space-y-1.5">
            {alarmActive ? (
              <div className={`flex items-center justify-between rounded border px-2 py-1.5 text-[10px] ${alarmAcknowledged ? "border-cr-border bg-cr-panel-2 text-cr-text-dim" : "border-cr-bad/50 bg-cr-bad/10 text-cr-bad"}`}>
                <div>
                  <div className="font-bold">ALM-001 — VFD-01 Communication Lost</div>
                  <div className="opacity-70">{new Date(startedAt).toLocaleTimeString()}</div>
                </div>
                {!alarmAcknowledged && (
                  <button onClick={acknowledgeAlarm} className="btn px-2 py-1 text-[10px] text-cr-bad">
                    Acknowledge
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded border border-cr-good/40 bg-cr-good/10 px-2 py-1.5 text-[10px] text-cr-good">No active alarms.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`py-1 text-[11px] font-semibold ${active ? "border-b-2 border-cr-accent text-cr-accent" : "text-cr-text-dim hover:text-cr-text"}`}>
      {children}
    </button>
  );
}
