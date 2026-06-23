interface Props {
  value: number;
  size?: number;
  label?: string;
}

function colorFor(v: number): string {
  return v >= 70 ? "#22c55e" : v >= 55 ? "#f59e0b" : "#ef4444";
}

export function ScoreGauge({ value, size = 116, label = "Overall" }: Props) {
  const v = Math.max(0, Math.min(100, value));
  const stroke = 9;
  const r = size / 2 - stroke;
  const circ = 2 * Math.PI * r;
  const dash = (v / 100) * circ;
  const color = colorFor(v);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#1c2436"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold leading-none" style={{ color }}>
          {Math.round(v)}
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
          {label}
        </span>
      </div>
    </div>
  );
}
