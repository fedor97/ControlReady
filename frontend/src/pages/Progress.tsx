import { NavBar } from "../components/layout/NavBar";
import { useProgressStore, averageScore } from "../state/progressStore";

function levelFor(labsCompleted: number): string {
  if (labsCompleted === 0) return "Trainee";
  if (labsCompleted < 3) return "Junior Technician";
  if (labsCompleted < 6) return "Technician";
  return "Senior Technician";
}

export function Progress() {
  const studentName = useProgressStore((s) => s.studentName);
  const completedLabs = useProgressStore((s) => s.completedLabs);
  const avg = averageScore(completedLabs);
  const hasCompleted = completedLabs.length > 0;

  return (
    <div className="min-h-screen bg-cr-bg">
      <NavBar />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <div className="text-xs tracking-widest text-cr-text-dim">TRAINING PROGRESS</div>
          <h1 className="text-lg font-bold text-cr-text">{studentName}</h1>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <StatCard label="Current Training Level" value={levelFor(completedLabs.length)} />
          <StatCard label="Labs Completed" value={String(completedLabs.length)} />
          <StatCard label="Average Score" value={hasCompleted ? `${avg}/100` : "—"} />
        </div>

        <div className="rounded border border-cr-border bg-cr-panel p-5">
          <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-cr-text-dim">Completed Work Orders</div>
          {completedLabs.length === 0 ? (
            <div className="text-sm text-cr-text-dim">No labs completed yet. Head to Labs to start Work Order #1001.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-cr-text-dim">
                  <th className="py-1">Lab</th>
                  <th className="py-1">Fault</th>
                  <th className="py-1">Score</th>
                  <th className="py-1">Hints Used</th>
                  <th className="py-1">Completed</th>
                </tr>
              </thead>
              <tbody>
                {completedLabs.map((l, i) => (
                  <tr key={i} className="border-t border-cr-border/60">
                    <td className="py-1.5">{l.labName}</td>
                    <td className="py-1.5 text-cr-text-dim">{l.faultId}</td>
                    <td className="py-1.5 font-mono-industrial text-cr-accent">{l.score.total}/100</td>
                    <td className="py-1.5">{l.hintsUsed}</td>
                    <td className="py-1.5 text-cr-text-dim">{new Date(l.completedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-cr-border bg-cr-panel px-4 py-3">
      <div className="text-[10px] uppercase tracking-wide text-cr-text-dim">{label}</div>
      <div className="font-mono-industrial text-base font-bold text-cr-text">{value}</div>
    </div>
  );
}
