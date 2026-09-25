import { NavBar } from "../components/layout/NavBar";
import { useProgressStore, averageScore } from "../state/progressStore";

export function Portfolio() {
  const studentName = useProgressStore((s) => s.studentName);
  const completedLabs = useProgressStore((s) => s.completedLabs);

  const accomplishments = Array.from(new Set(completedLabs.flatMap((l) => l.accomplishments)));
  const skills = Array.from(new Set(completedLabs.map((l) => l.skillEarned)));

  return (
    <div className="min-h-screen bg-cr-bg">
      <NavBar />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="text-xs tracking-widest text-cr-text-dim">CAREER PORTFOLIO</div>
        <h1 className="mb-1 text-lg font-bold text-cr-text">{studentName}</h1>
        <p className="mb-6 text-sm text-cr-text-dim">
          {completedLabs.length > 0
            ? `${completedLabs.length} work order${completedLabs.length > 1 ? "s" : ""} completed · average score ${averageScore(completedLabs)}/100`
            : "Complete a lab to start building your portfolio."}
        </p>

        {accomplishments.length > 0 && (
          <div className="mb-6 rounded border border-cr-border bg-cr-panel p-5">
            <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-cr-text-dim">Accomplishments</div>
            <ul className="space-y-1.5 text-sm">
              {accomplishments.map((a) => (
                <li key={a} className="flex items-center gap-2">
                  <span className="text-cr-good">✓</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {skills.length > 0 && (
          <div className="mb-6 rounded border border-cr-border bg-cr-panel p-5">
            <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-cr-text-dim">Skills Earned</div>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="rounded-full border border-cr-good/50 bg-cr-good/10 px-3 py-1 text-xs font-semibold text-cr-good">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {completedLabs.length > 0 && (
          <div className="rounded border border-cr-border bg-cr-panel p-5">
            <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-cr-text-dim">Work Order History</div>
            <div className="space-y-2">
              {completedLabs.map((l, i) => (
                <div key={i} className="flex items-center justify-between rounded border border-cr-border/60 px-3 py-2 text-sm">
                  <span>{l.labName}</span>
                  <span className="font-mono-industrial text-cr-accent">{l.score.total}/100</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button disabled title="Coming soon" className="btn mt-6 px-4 py-2 text-xs">
          Export Portfolio (Coming Soon)
        </button>
      </main>
    </div>
  );
}
