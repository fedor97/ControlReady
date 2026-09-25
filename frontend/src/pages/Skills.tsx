import { NavBar } from "../components/layout/NavBar";
import { SkillMeter } from "../components/dashboard/SkillMeter";
import { BadgeGrid } from "../components/dashboard/BadgeGrid";
import { useProgressStore, averageBreakdown } from "../state/progressStore";

export function Skills() {
  const completedLabs = useProgressStore((s) => s.completedLabs);
  const breakdown = averageBreakdown(completedLabs);
  const hasCompleted = completedLabs.length > 0;

  const badges = [
    { name: "Industrial Networking", earned: hasCompleted },
    { name: "Motor Controls", earned: hasCompleted },
    { name: "PLC Fundamentals", earned: hasCompleted },
    { name: "VFD Troubleshooting", earned: hasCompleted },
  ];

  return (
    <div className="min-h-screen bg-cr-bg">
      <NavBar />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6">
          <div className="text-xs tracking-widest text-cr-text-dim">SKILLS</div>
          <h1 className="text-lg font-bold text-cr-text">Skill Progress &amp; Badges</h1>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 rounded border border-cr-border bg-cr-panel p-5">
            <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-cr-text-dim">Skill Progress</div>
            <div className="space-y-3">
              <SkillMeter label="Industrial Networking" value={breakdown.networking} />
              <SkillMeter label="PLC Fundamentals" value={breakdown.plc} />
              <SkillMeter label="VFD Troubleshooting" value={hasCompleted ? Math.round((breakdown.networking + breakdown.plc) / 2) : 0} />
              <SkillMeter label="Motor Controls" value={hasCompleted ? Math.round((breakdown.plc + breakdown.faultDiagnosis) / 2) : 0} />
              <SkillMeter label="Troubleshooting" value={breakdown.faultDiagnosis} />
              <SkillMeter label="Commissioning Basics" value={breakdown.verification} />
              <SkillMeter label="BMS Fundamentals" value={0} />
            </div>
            <div className="mt-2 text-[11px] text-cr-text-dim">BMS Fundamentals unlocks with Lab 3 (see roadmap).</div>
          </div>

          <div className="rounded border border-cr-border bg-cr-panel p-5">
            <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-cr-text-dim">Badges</div>
            <BadgeGrid badges={badges} />
          </div>
        </div>
      </main>
    </div>
  );
}
