"use client";

interface MiniBarChartProps {
  data: { label: string; value: number }[];
  height?: number;
}

/**
 * Small dependency-free bar chart built with plain divs. Bar height is
 * relative to the largest value in the set.
 */
export default function MiniBarChart({ data, height = 128 }: MiniBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex items-end gap-3">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <span className="font-tabular text-xs text-ink">{d.value}</span>
          <div
            className="flex w-full items-end overflow-hidden rounded-md bg-bg"
            style={{ height }}
          >
            <div
              className="w-full rounded-md bg-brand-gradient transition-[height] duration-500 ease-out"
              style={{ height: d.value > 0 ? `${Math.max((d.value / max) * 100, 6)}%` : 0 }}
            />
          </div>
          <span className="text-[11px] text-muted">{d.label}</span>
        </div>
      ))}
    </div>
  );
}