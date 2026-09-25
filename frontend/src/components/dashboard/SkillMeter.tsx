export function SkillMeter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-cr-text-dim">{label}</span>
        <span className="font-mono-industrial text-cr-text">{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded bg-cr-border">
        <div
          className={`h-full ${value >= 80 ? "bg-cr-good" : value >= 50 ? "bg-cr-warn" : value > 0 ? "bg-cr-bad" : "bg-cr-border"}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
