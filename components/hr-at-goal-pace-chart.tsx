type Point = {
  week: string;
  avgHr: number | null;
  totalGoalPaceMin: number;
  rideCount: number;
  lowConfidence: boolean;
};

export default function HrAtGoalPaceChart({ series }: { series: Point[] }) {
  const usable = series.filter((p) => p.avgHr != null);

  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-xs uppercase tracking-widest text-stone-500">
            HR at goal pace
          </h3>
          <p className="text-[11px] text-stone-400 mt-0.5">
            28-30 km/h band · lower bpm = improving fitness
          </p>
        </div>
        {usable.length > 0 && (
          <p className="font-serif-display text-3xl font-black">
            {usable[usable.length - 1].avgHr}
            <span className="text-stone-400 text-base font-normal ml-1">
              bpm
            </span>
          </p>
        )}
      </div>

      {usable.length === 0 ? (
        <p className="text-sm text-stone-500 mt-3">
          No rides yet at 28-30 km/h. As you log rides at goal pace, the trend
          will populate.
        </p>
      ) : usable.length < 3 ? (
        <>
          <Chart series={usable} />
          <p className="text-[11px] text-stone-400 mt-2">
            Trend will sharpen over the next few weeks of riding.
          </p>
        </>
      ) : (
        <Chart series={usable} />
      )}
    </section>
  );
}

function Chart({ series }: { series: Point[] }) {
  const W = 320;
  const H = 90;
  const padX = 8;
  const padY = 8;

  const hrs = series.map((p) => p.avgHr ?? 0);
  const minHr = Math.min(...hrs) - 3;
  const maxHr = Math.max(...hrs) + 3;
  const hrRange = Math.max(maxHr - minHr, 1);

  const n = series.length;
  const xOf = (i: number) =>
    n === 1 ? W / 2 : padX + (i / (n - 1)) * (W - 2 * padX);
  const yOf = (hr: number) =>
    padY + (1 - (hr - minHr) / hrRange) * (H - 2 * padY);

  const points = series.map((p, i) => ({
    x: xOf(i),
    y: yOf(p.avgHr ?? 0),
    lowConfidence: p.lowConfidence,
    week: p.week,
    avgHr: p.avgHr,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  // Linear regression trendline (only when we have >=3 points).
  let trendPath: string | null = null;
  if (series.length >= 3) {
    const xs = series.map((_, i) => i);
    const ys = hrs;
    const xMean = xs.reduce((a, b) => a + b, 0) / xs.length;
    const yMean = ys.reduce((a, b) => a + b, 0) / ys.length;
    const num = xs.reduce((a, x, i) => a + (x - xMean) * (ys[i] - yMean), 0);
    const den = xs.reduce((a, x) => a + (x - xMean) ** 2, 0);
    const slope = den === 0 ? 0 : num / den;
    const intercept = yMean - slope * xMean;
    const y0 = intercept;
    const y1 = slope * (n - 1) + intercept;
    trendPath = `M ${xOf(0)} ${yOf(y0)} L ${xOf(n - 1)} ${yOf(y1)}`;
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full mt-3 overflow-visible"
      aria-label="HR at goal pace trend"
    >
      {trendPath && (
        <path
          d={trendPath}
          fill="none"
          stroke="#d6d3d1"
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
      )}
      <path
        d={linePath}
        fill="none"
        stroke="#dc2626"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r={p.lowConfidence ? 2 : 3.5}
            fill={p.lowConfidence ? "#fca5a5" : "#dc2626"}
          />
          {i === points.length - 1 && (
            <text
              x={p.x}
              y={p.y - 8}
              fontSize="10"
              fill="#dc2626"
              textAnchor="middle"
              fontWeight="bold"
            >
              {p.avgHr}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
