import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavBar } from "../components/layout/NavBar";
import { lab1Definition } from "../labs/lab1-motor-control/definition";
import type { FaultScenarioId } from "../types";

export function InstructorSetup() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<FaultScenarioId | "random">(lab1Definition.defaultFaultId);

  const implementedFaults = lab1Definition.faultCatalog.filter((f) => f.implemented);

  function start() {
    const faultId =
      selected === "random" ? implementedFaults[Math.floor(Math.random() * implementedFaults.length)].id : selected;
    navigate(`/lab/${lab1Definition.id}`, { state: { faultId } });
  }

  return (
    <div className="min-h-screen bg-cr-bg">
      <NavBar />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="text-xs tracking-widest text-cr-text-dim">INSTRUCTOR MODE</div>
        <h1 className="mb-1 text-lg font-bold text-cr-text">Select a Fault Scenario</h1>
        <p className="mb-6 text-sm text-cr-text-dim">
          Choose which fault the student will diagnose for {lab1Definition.workOrder.id} ({lab1Definition.name}). Pick
          "Random" to assign one automatically.
        </p>

        <div className="space-y-2">
          <label
            className={`flex cursor-pointer items-center gap-3 rounded border px-4 py-3 ${
              selected === "random" ? "border-cr-accent bg-cr-accent/10" : "border-cr-border bg-cr-panel"
            }`}
          >
            <input type="radio" checked={selected === "random"} onChange={() => setSelected("random")} />
            <div>
              <div className="font-semibold text-cr-text">Random</div>
              <div className="text-xs text-cr-text-dim">Randomly assign one of the {implementedFaults.length} implemented fault scenarios.</div>
            </div>
          </label>

          {lab1Definition.faultCatalog.map((f) => (
            <label
              key={f.id}
              className={`flex items-center gap-3 rounded border px-4 py-3 ${
                !f.implemented
                  ? "cursor-not-allowed border-cr-border bg-cr-panel/50 opacity-50"
                  : selected === f.id
                    ? "cursor-pointer border-cr-accent bg-cr-accent/10"
                    : "cursor-pointer border-cr-border bg-cr-panel"
              }`}
            >
              <input
                type="radio"
                disabled={!f.implemented}
                checked={selected === f.id}
                onChange={() => setSelected(f.id)}
              />
              <div>
                <div className="font-semibold text-cr-text">
                  {f.title} {!f.implemented && <span className="text-xs font-normal text-cr-text-dim">(Coming Soon)</span>}
                </div>
                <div className="text-xs text-cr-text-dim">{f.summary}</div>
              </div>
            </label>
          ))}
        </div>

        <button onClick={start} className="btn btn-accent mt-6 w-full py-2.5 text-sm">
          Start Work Order {lab1Definition.workOrder.id}
        </button>
      </main>
    </div>
  );
}
