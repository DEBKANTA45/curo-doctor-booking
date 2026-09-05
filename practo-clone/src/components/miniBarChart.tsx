"use client";

type MiniBarChartDatum = {
  label: string;
  value: number;
};

export default function MiniBarChart({ data }: { data: MiniBarChartDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex items-end gap-3">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-32 w-full items-end rounded-md bg-bg">
            <div
              className="w-full rounded-md bg-primary transition-all"
              style={{ height: `${(d.value / max) * 100}%` }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
          <span className="font-tabular text-xs text-muted">{d.label}</span>
          <span className="font-tabular text-xs font-medium text-ink">{d.value}</span>
        </div>
      ))}
    </div>
  );
}