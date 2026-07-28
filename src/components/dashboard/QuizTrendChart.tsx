// src/components/dashboard/QuizTrendChart.tsx
// Graphique en ligne (SVG) à série unique : pas de légende nécessaire (le titre de la
// section nomme déjà la série), étiquette directe uniquement sur le dernier point.
const WIDTH = 560;
const HEIGHT = 160;
const PADDING_X = 8;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 12;
const END_LABEL_WIDTH = 44;
const BASELINE_STROKE = "rgba(42, 42, 42, 0.12)";

export interface QuizAttemptPoint {
  score: number;
  label: string;
}

function scaleX(index: number, count: number): number {
  if (count <= 1) return PADDING_X;
  const usable = WIDTH - PADDING_X * 2 - END_LABEL_WIDTH;
  return PADDING_X + (usable * index) / (count - 1);
}

function scaleY(score: number): number {
  const usable = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  return PADDING_TOP + usable * (1 - Math.max(0, Math.min(100, score)) / 100);
}

export function QuizTrendChart({ attempts }: { attempts: QuizAttemptPoint[] }) {
  const points = attempts.map((attempt, index) => ({
    x: scaleX(index, attempts.length),
    y: scaleY(attempt.score),
    ...attempt,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const baselineY = scaleY(0);
  const areaPath = `M${points[0].x},${baselineY} ${points
    .map((p) => `L${p.x},${p.y}`)
    .join(" ")} L${points[points.length - 1].x},${baselineY} Z`;
  const lastPoint = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
      role="img"
      aria-label={`Évolution des scores de quiz, de ${points[0].score}% à ${lastPoint.score}%`}
    >
      <line
        x1={PADDING_X}
        y1={baselineY}
        x2={WIDTH - END_LABEL_WIDTH}
        y2={baselineY}
        stroke={BASELINE_STROKE}
        strokeWidth={1}
      />
      <path d={areaPath} fill="var(--color-accent)" opacity={0.1} stroke="none" />
      <path
        d={linePath}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, index) => (
        <circle
          key={index}
          cx={p.x}
          cy={p.y}
          r={4}
          fill="var(--color-accent)"
          stroke="var(--color-surface-light)"
          strokeWidth={2}
        >
          <title>
            {p.label} — {p.score}%
          </title>
        </circle>
      ))}
      <text
        x={lastPoint.x + 10}
        y={lastPoint.y + 4}
        className="fill-ink text-[13px] font-medium"
      >
        {lastPoint.score}%
      </text>
    </svg>
  );
}
