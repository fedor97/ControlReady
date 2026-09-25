import { useState } from "react";
import { useSimStore } from "../../state/simStore";
import { useProgressStore } from "../../state/progressStore";
import type { ServiceReport } from "../../types";

const EMPTY: ServiceReport = {
  technicianName: "",
  workOrderId: "",
  equipment: "",
  reportedProblem: "",
  problemFound: "",
  rootCause: "",
  correctiveAction: "",
  testingPerformed: "",
  finalStatus: "",
};

export function ReportCard() {
  const lab = useSimStore((s) => s.lab);
  const fault = useSimStore((s) => s.fault);
  const isResolved = useSimStore((s) => s.isFaultResolved());
  const motorVerified = useSimStore((s) => s.motorVerifiedRunning);
  const verifyRunning = useSimStore((s) => s.verifyRunning);
  const motorRunning = useSimStore((s) => Boolean(s.tags.Motor_Running));
  const submitServiceReport = useSimStore((s) => s.submitServiceReport);
  const getScore = useSimStore((s) => s.getScore);
  const hintsUsed = useSimStore((s) => s.hintsUsed);
  const startedAt = useSimStore((s) => s.startedAt);
  const completedAt = useSimStore((s) => s.completedAt);
  const addCompletedLab = useProgressStore((s) => s.addCompletedLab);

  const [report, setReport] = useState<ServiceReport>({
    ...EMPTY,
    workOrderId: lab.workOrder.id,
    equipment: lab.workOrder.equipment,
    reportedProblem: lab.workOrder.problem,
  });
  const [issues, setIssues] = useState<string[]>([]);

  function set<K extends keyof ServiceReport>(key: K, value: ServiceReport[K]) {
    setReport((r) => ({ ...r, [key]: value }));
  }

  function handleSubmit() {
    const validation = submitServiceReport(report);
    setIssues(validation.issues);
    if (validation.complete) {
      const score = getScore();
      addCompletedLab({
        labId: lab.id,
        labName: lab.name,
        faultId: fault.id,
        score,
        hintsUsed,
        timeToRepairMs: Date.now() - startedAt,
        skillEarned: lab.skillOnCompletion,
        completedAt: new Date().toISOString(),
        accomplishments: [
          "Configured an industrial Ethernet network",
          "Assigned PLC and VFD IP addresses",
          "Diagnosed an industrial communication failure",
          "Corrected a network configuration fault",
          "Monitored PLC Ladder Logic",
          "Commissioned a motor/VFD system",
          "Verified equipment operation",
          "Completed a technical service report",
        ],
      });
    }
  }

  if (completedAt !== null) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 p-4 text-center text-xs text-cr-text-dim">
        <div className="text-cr-good">✓ Report submitted.</div>
        <div>See the Work Order Complete summary.</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-2 text-xs">
      {(!isResolved || !motorVerified) && (
        <div className="mb-2 rounded border border-cr-warn/50 bg-cr-warn/10 px-2 py-1.5 text-[10px] text-cr-warn">
          {!isResolved && <div>The fault does not appear to be corrected yet.</div>}
          {isResolved && !motorVerified && motorRunning && (
            <button onClick={verifyRunning} className="underline">
              Click to verify Motor_Running = TRUE
            </button>
          )}
          {isResolved && !motorVerified && !motorRunning && <div>Start the motor and verify it's running first.</div>}
        </div>
      )}

      <div className="flex-1 space-y-2">
        <Field label="Technician Name" value={report.technicianName} onChange={(v) => set("technicianName", v)} />
        <Field label="Problem Found" value={report.problemFound} onChange={(v) => set("problemFound", v)} textarea />
        <Field label="Root Cause" value={report.rootCause} onChange={(v) => set("rootCause", v)} textarea />
        <Field label="Corrective Action" value={report.correctiveAction} onChange={(v) => set("correctiveAction", v)} textarea />
        <Field label="Testing Performed" value={report.testingPerformed} onChange={(v) => set("testingPerformed", v)} textarea />
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-cr-text-dim">Final Status</span>
          <select value={report.finalStatus} onChange={(e) => set("finalStatus", e.target.value as ServiceReport["finalStatus"])} className="field-flat px-2 py-1.5 text-cr-text">
            <option value="">Select…</option>
            <option value="Operational">Operational</option>
            <option value="Needs Follow-up">Needs Follow-up</option>
          </select>
        </label>
      </div>

      {issues.length > 0 && (
        <div className="my-2 rounded border border-cr-bad/50 bg-cr-bad/10 px-2 py-1.5 text-[10px] text-cr-bad">
          <ul className="list-disc pl-3">
            {issues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={handleSubmit} className="btn mt-2 w-full py-1.5 text-xs" style={{ background: "var(--color-cr-good)", color: "var(--color-cr-bg)" }}>
        Submit Report
      </button>
    </div>
  );
}

function Field({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-cr-text-dim">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className="field-flat px-2 py-1.5 text-[11px] text-cr-text" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className="field-flat px-2 py-1.5 text-[11px] text-cr-text" />
      )}
    </label>
  );
}
