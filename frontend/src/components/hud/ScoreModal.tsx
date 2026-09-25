import { useNavigate } from "react-router-dom";
import { useSimStore } from "../../state/simStore";
import { useProgressStore } from "../../state/progressStore";

export function ScoreModal() {
  const navigate = useNavigate();
  const fault = useSimStore((s) => s.fault);
  const vfd = useSimStore((s) => s.vfd);
  const motorRunning = useSimStore((s) => Boolean(s.tags.Motor_Running));
  const lab = useSimStore((s) => s.lab);
  const startLab = useSimStore((s) => s.startLab);
  const completedLabs = useProgressStore((s) => s.completedLabs);
  const record = completedLabs[completedLabs.length - 1];

  if (!record) return null;

  const rows: [string, string, "good" | "bad"][] = [
    ["Motor 1", motorRunning ? "RUNNING" : "STOPPED", motorRunning ? "good" : "bad"],
    ["PLC", "ONLINE", "good"],
    ["VFD", vfd.commOk ? "ONLINE" : "OFFLINE", vfd.commOk ? "good" : "bad"],
    ["Communication", vfd.commOk ? "HEALTHY" : "DEGRADED", vfd.commOk ? "good" : "bad"],
  ];

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-y-auto rounded-lg border border-cr-border bg-cr-panel shadow-2xl">
        <div className="border-b border-cr-border bg-gradient-to-r from-cr-accent/20 to-transparent px-6 py-5">
          <div className="text-xs tracking-widest text-cr-accent">WORK ORDER COMPLETE</div>
          <div className="text-lg font-bold text-cr-text">
            {lab.workOrder.id} — {lab.workOrder.equipment}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 px-6 py-4">
          {rows.map(([label, value, tone]) => (
            <div key={label} className="rounded border border-cr-border bg-cr-panel-2 px-3 py-3 text-center">
              <div className="text-[10px] uppercase tracking-wide text-cr-text-dim">{label}</div>
              <div className={`font-mono-industrial text-base font-bold ${tone === "good" ? "text-cr-good" : "text-cr-bad"}`}>{value}</div>
            </div>
          ))}
        </div>

        <div className="mx-6 mb-4 rounded border border-cr-border bg-cr-panel-2 px-4 py-3">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-cr-text-dim">Root Cause</div>
          <div className="mb-2 text-sm">{fault.rootCause}</div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-cr-text-dim">Corrective Action</div>
          <div className="text-sm">{fault.correctiveAction}</div>
        </div>

        <div className="mx-6 mb-4 flex items-center justify-between rounded border border-cr-accent/40 bg-cr-accent/10 px-4 py-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-cr-text-dim">Student Score</div>
            <div className="font-mono-industrial text-2xl font-bold text-cr-accent">{record.score.total}/100</div>
          </div>
          <div className="grid grid-cols-1 gap-1 text-xs">
            <ScoreRow label="Networking" value={record.score.breakdown.networking} />
            <ScoreRow label="PLC" value={record.score.breakdown.plc} />
            <ScoreRow label="Fault Diagnosis" value={record.score.breakdown.faultDiagnosis} />
            <ScoreRow label="Verification" value={record.score.breakdown.verification} />
            <ScoreRow label="Documentation" value={record.score.breakdown.documentation} />
          </div>
        </div>

        <div className="mx-6 mb-6 rounded border border-cr-good/40 bg-cr-good/10 px-4 py-3 text-center">
          <div className="text-xs uppercase tracking-wide text-cr-text-dim">Skill Earned</div>
          <div className="text-base font-bold text-cr-good">{lab.skillOnCompletion}</div>
        </div>

        <div className="mt-auto flex gap-3 border-t border-cr-border px-6 py-4">
          <button onClick={() => startLab(fault.id)} className="btn px-4 py-2 text-xs">
            Retry Lab
          </button>
          <button onClick={() => navigate("/portfolio")} className="btn px-4 py-2 text-xs">
            View Portfolio
          </button>
          <button onClick={() => navigate("/labs")} className="btn btn-accent ml-auto px-4 py-2 text-xs">
            Back to Lab Library
          </button>
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 text-cr-text-dim">{label}</span>
      <div className="h-1.5 w-24 overflow-hidden rounded bg-cr-border">
        <div className="h-full bg-cr-accent" style={{ width: `${value}%` }} />
      </div>
      <span className="font-mono-industrial text-cr-text">{value}%</span>
    </div>
  );
}
