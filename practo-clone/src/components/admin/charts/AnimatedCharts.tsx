"use client";

import { useEffect, useState } from "react";

// ---------- Animated Bar Chart ----------

export interface BarDatum {
    label: string;
    value: number;
}

export function AnimatedBarChart({
    data,
    colorVar = "--color-primary",
    valuePrefix = "",
    height = 160,
}: {
    data: BarDatum[];
    colorVar?: string;
    valuePrefix?: string;
    height?: number;
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(false);
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
    }, [data]);

    if (data.length === 0) {
        return <p className="py-10 text-center text-xs text-faint">No data for this range.</p>;
    }

    const max = Math.max(1, ...data.map((d) => d.value));

    return (
        <div className="flex items-end gap-1.5">
            {data.map((d, i) => (
                <div key={i} className="group flex min-w-0 flex-1 flex-col items-center gap-1.5">
                    <div
                        className="relative flex w-full items-end overflow-visible rounded-t-md bg-bg"
                        style={{ height }}
                    >
                        <span className="pointer-events-none absolute -top-6 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 shadow-soft transition-opacity group-hover:opacity-100">
                            {valuePrefix}
                            {d.value.toLocaleString("en-IN")}
                        </span>
                        <div
                            className="w-full rounded-t-md"
                            style={{
                                height: mounted ? `${d.value === 0 ? 2 : Math.max(4, (d.value / max) * 100)}%` : "0%",
                                backgroundColor: `rgb(var(${colorVar}))`,
                                transition: "height 700ms ease-out",
                                transitionDelay: `${i * 40}ms`,
                            }}
                        />
                    </div>
                    <span className="w-full truncate text-center text-[10px] text-faint">{d.label}</span>
                </div>
            ))}
        </div>
    );
}

// ---------- Animated Line Chart ----------

export interface LineDatum {
    label: string;
    value: number;
}

export function AnimatedLineChart({
    data,
    colorVar = "--color-primary",
    valuePrefix = "",
    height = 190,
}: {
    data: LineDatum[];
    colorVar?: string;
    valuePrefix?: string;
    height?: number;
}) {
    const [mounted, setMounted] = useState(false);
    const [hovered, setHovered] = useState<number | null>(null);

    useEffect(() => {
        setMounted(false);
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
    }, [data]);

    if (data.length === 0) {
        return <p className="py-10 text-center text-xs text-faint">No data for this range.</p>;
    }

    const max = Math.max(1, ...data.map((d) => d.value));
    const n = data.length;

    const points = data.map((d, i) => {
        const x = n === 1 ? 50 : (i / (n - 1)) * 100;
        const y = 96 - (d.value / max) * 88;
        return { x, y, ...d };
    });

    const pathD = points.length > 1 ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") : "";
    const areaD =
        points.length > 1
            ? `M ${points[0].x} 100 ` + points.map((p) => `L ${p.x} ${p.y}`).join(" ") + ` L ${points[points.length - 1].x} 100 Z`
            : "";
    const gradientId = `line-grad-${colorVar.replace(/[^a-z0-9]/gi, "")}`;
    const showAllLabels = data.length <= 12;

    return (
        <div>
            <div className="relative" style={{ height }}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={`rgb(var(${colorVar}))`} stopOpacity="0.28" />
                            <stop offset="100%" stopColor={`rgb(var(${colorVar}))`} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {areaD && (
                        <path d={areaD} fill={`url(#${gradientId})`} style={{ opacity: mounted ? 1 : 0, transition: "opacity 700ms ease-out 250ms" }} />
                    )}

                    {pathD && (
                        <path
                            d={pathD}
                            fill="none"
                            stroke={`rgb(var(${colorVar}))`}
                            strokeWidth="1.8"
                            vectorEffect="non-scaling-stroke"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            pathLength={100}
                            style={{
                                strokeDasharray: 100,
                                strokeDashoffset: mounted ? 0 : 100,
                                transition: "stroke-dashoffset 900ms ease-out",
                            }}
                        />
                    )}

                    {points.map((p, i) => (
                        <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r={hovered === i ? 2.6 : 1.7}
                            fill={`rgb(var(${colorVar}))`}
                            stroke="white"
                            strokeWidth="0.8"
                            vectorEffect="non-scaling-stroke"
                            style={{
                                opacity: mounted ? 1 : 0,
                                transition: `opacity 400ms ease-out ${250 + i * 25}ms, r 150ms ease-out`,
                            }}
                        />
                    ))}

                    {points.map((p, i) => (
                        <circle
                            key={`hit-${i}`}
                            cx={p.x}
                            cy={p.y}
                            r={5}
                            fill="transparent"
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                            style={{ cursor: "pointer" }}
                        />
                    ))}
                </svg>

                {hovered !== null && points[hovered] && (
                    <div
                        className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-ink px-2 py-1 text-[10px] font-medium text-white shadow-soft"
                        style={{ left: `${points[hovered].x}%`, top: `${points[hovered].y}%`, marginTop: "-8px" }}
                    >
                        {points[hovered].label}: {valuePrefix}
                        {points[hovered].value.toLocaleString("en-IN")}
                    </div>
                )}
            </div>

            <div className="mt-2 flex justify-between text-[10px] text-faint">
                {showAllLabels ? (
                    data.map((d, i) => (
                        <span key={i} className="truncate text-center" style={{ width: `${100 / data.length}%` }}>
                            {d.label}
                        </span>
                    ))
                ) : (
                    <>
                        <span>{data[0]?.label}</span>
                        <span>{data[Math.floor(data.length / 2)]?.label}</span>
                        <span>{data[data.length - 1]?.label}</span>
                    </>
                )}
            </div>
        </div>
    );
}

// ---------- Animated Donut / Pie Chart ----------

export interface DonutSegment {
    label: string;
    value: number;
    colorVar: string;
}

export function AnimatedDonutChart({
    segments,
    size = 168,
    thickness = 24,
    centerLabel,
    centerValue,
}: {
    segments: DonutSegment[];
    size?: number;
    thickness?: number;
    centerLabel?: string;
    centerValue?: string | number;
}) {
    const [mounted, setMounted] = useState(false);
    const [hovered, setHovered] = useState<number | null>(null);

    useEffect(() => {
        setMounted(false);
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
    }, [segments]);

    const total = Math.max(1, segments.reduce((s, seg) => s + seg.value, 0));
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeWidthUnits = (thickness * 100) / size;

    let cumulative = 0;
    const drawn = segments.map((seg, i) => {
        const length = (seg.value / total) * circumference;
        const offset = cumulative;
        cumulative += length;
        return { ...seg, length, offset, index: i };
    });

    return (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <div className="relative shrink-0" style={{ width: size, height: size }}>
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    <circle cx="50" cy="50" r={radius} fill="none" stroke="rgb(var(--color-line))" strokeWidth={strokeWidthUnits} />
                    {drawn.map((seg) => (
                        <circle
                            key={seg.index}
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            stroke={`rgb(var(${seg.colorVar}))`}
                            strokeWidth={hovered === seg.index ? strokeWidthUnits + 3 : strokeWidthUnits}
                            strokeDasharray={mounted ? `${seg.length} ${circumference - seg.length}` : `0 ${circumference}`}
                            strokeDashoffset={-seg.offset}
                            onMouseEnter={() => setHovered(seg.index)}
                            onMouseLeave={() => setHovered((h) => (h === seg.index ? null : h))}
                            style={{
                                transition: `stroke-dasharray 700ms ease-out ${seg.index * 100}ms, stroke-width 150ms ease-out`,
                                cursor: seg.value > 0 ? "pointer" : "default",
                            }}
                        />
                    ))}
                </svg>
                {(centerLabel || centerValue !== undefined) && (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-tabular text-lg font-semibold text-ink">{centerValue}</span>
                        {centerLabel && <span className="text-[10px] text-faint">{centerLabel}</span>}
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-1.5">
                {segments.map((seg, i) => {
                    const pct = total ? Math.round((seg.value / total) * 100) : 0;
                    return (
                        <div
                            key={i}
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                            className={`flex items-center gap-2 rounded-md px-1.5 py-1 text-xs transition-colors ${hovered === i ? "bg-bg" : ""
                                }`}
                        >
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: `rgb(var(${seg.colorVar}))` }} />
                            <span className="flex-1 truncate text-muted">{seg.label}</span>
                            <span className="font-tabular font-medium text-ink">
                                {seg.value} <span className="text-faint">({pct}%)</span>
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}