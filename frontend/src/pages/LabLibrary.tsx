import { useNavigate } from "react-router-dom";
import { NavBar } from "../components/layout/NavBar";
import { LabThumbnail } from "../components/labs/LabThumbnail";
import { LAB_CATALOG } from "../labs/labCatalog";
import { useProgressStore } from "../state/progressStore";

export function LabLibrary() {
  const navigate = useNavigate();
  const completedLabs = useProgressStore((s) => s.completedLabs);

  return (
    <div className="min-h-screen bg-cr-bg">
      <NavBar />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <div className="text-xs tracking-widest text-cr-text-dim">CONTROLREADY</div>
          <h1 className="text-xl font-bold text-cr-text">Industrial Automation Labs</h1>
          <p className="mt-1 max-w-2xl text-sm text-cr-text-dim">
            Each lab is a separate job scenario — a real work order, a live 3D plant, and a fault only you can diagnose.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {LAB_CATALOG.map((lab, i) => {
            const best = lab.routeId ? completedLabs.filter((c) => c.labId === lab.routeId).sort((a, b) => b.score.total - a.score.total)[0] : undefined;
            const locked = lab.status === "coming_soon";

            return (
              <div key={lab.number} className={`flex flex-col overflow-hidden rounded-lg border ${locked ? "border-cr-border/60 opacity-70" : "border-cr-border"} bg-cr-panel`}>
                <div className="h-36 w-full">
                  <LabThumbnail seed={i} locked={locked} />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-cr-text-dim">Lab {lab.number}</div>
                  <div className="mb-2 text-base font-bold text-cr-text">{lab.title}</div>
                  <div className="mb-3 flex items-center gap-3 text-[11px] text-cr-text-dim">
                    <span>{lab.difficulty}</span>
                    <span>·</span>
                    <span>{lab.minutes} min</span>
                  </div>
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {lab.skills.map((s) => (
                      <span key={s} className="rounded-full border border-cr-border bg-cr-panel-2 px-2 py-0.5 text-[10px] text-cr-text-dim">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto">
                    {best && <div className="mb-2 text-[11px] text-cr-good">Best score: {best.score.total}/100</div>}
                    {locked ? (
                      <div className="btn w-full py-2 text-xs" style={{ cursor: "default" }}>
                        Coming Soon
                      </div>
                    ) : (
                      <button onClick={() => navigate(`/lab/${lab.routeId}/setup`)} className="btn btn-accent w-full py-2 text-xs">
                        Enter Lab
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
