/** Abstract equipment-silhouette preview art — no photographic assets required, keeps cards lightweight. */
export function LabThumbnail({ seed, locked }: { seed: number; locked?: boolean }) {
  const hue = (seed * 47) % 360;
  return (
    <svg viewBox="0 0 320 180" className="h-full w-full">
      <defs>
        <linearGradient id={`bg-${seed}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`hsl(${hue}, 30%, 16%)`} />
          <stop offset="100%" stopColor="#0e1116" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#bg-${seed})`} />
      <rect x="0" y="150" width="320" height="30" fill="#0b0e13" opacity="0.6" />
      {/* abstract cabinet */}
      <rect x="30" y="60" width="70" height="90" rx="4" fill="#1c222c" stroke="#2a313e" />
      <rect x="42" y="75" width="20" height="26" rx="2" fill={locked ? "#3a3f2e" : `hsl(${hue}, 60%, 45%)`} opacity="0.8" />
      <rect x="68" y="75" width="20" height="26" rx="2" fill="#2a313e" />
      {/* abstract motor/conveyor */}
      <circle cx="200" cy="120" r="28" fill="#2a313e" stroke="#3a3f2e" />
      <rect x="150" y="112" width="120" height="16" rx="8" fill="#20242c" stroke="#2a313e" />
      <circle cx="200" cy="120" r="10" fill={locked ? "#4b5563" : `hsl(${hue}, 70%, 55%)`} />
      {/* network line */}
      <path d="M65 60 L200 40 L250 60" stroke={locked ? "#4b5563" : `hsl(${hue}, 70%, 55%)`} strokeWidth="2" fill="none" opacity="0.7" />
      {locked && (
        <g opacity="0.9">
          <rect x="140" y="70" width="40" height="32" rx="4" fill="#0b0e13" stroke="#2a313e" />
          <path d="M148 70 v-8 a12 12 0 0 1 24 0 v8" stroke="#4b5563" strokeWidth="3" fill="none" />
        </g>
      )}
    </svg>
  );
}
