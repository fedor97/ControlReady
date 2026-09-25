interface Badge {
  name: string;
  earned: boolean;
}

export function BadgeGrid({ badges }: { badges: Badge[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {badges.map((b) => (
        <div
          key={b.name}
          className={`rounded border px-3 py-2 text-xs font-semibold ${
            b.earned ? "border-cr-good/50 bg-cr-good/10 text-cr-good" : "border-cr-border bg-cr-panel-2 text-cr-text-dim"
          }`}
        >
          <div className="mb-0.5 text-[10px] uppercase tracking-wide">{b.earned ? "Earned" : "Locked"}</div>
          {b.name}
        </div>
      ))}
    </div>
  );
}
