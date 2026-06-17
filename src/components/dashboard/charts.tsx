"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axis = {
  stroke: "hsl(var(--muted-foreground))",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
};

function tooltipStyle() {
  return {
    contentStyle: {
      background: "hsl(var(--card))",
      border: "1px solid hsl(var(--border))",
      borderRadius: 8,
      fontSize: 12,
      color: "hsl(var(--card-foreground))",
      boxShadow: "0 4px 12px rgb(0 0 0 / 0.1)",
    },
    labelStyle: { color: "hsl(var(--muted-foreground))" },
  };
}

export function ValueAreaChart({ data }: { data: { week: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="valueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="week" {...axis} />
        <YAxis {...axis} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={40} />
        <Tooltip
          {...tooltipStyle()}
          formatter={(v: number) => [v.toLocaleString(), "Value"]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--primary))"
          strokeWidth={2.5}
          fill="url(#valueFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MoversBarChart({ data }: { data: { product: string; qty: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis type="number" {...axis} />
        <YAxis
          type="category"
          dataKey="product"
          {...axis}
          width={110}
          tickFormatter={(v: string) => (v.length > 14 ? v.slice(0, 13) + "…" : v)}
        />
        <Tooltip {...tooltipStyle()} cursor={{ fill: "hsl(var(--muted))" }} />
        <Bar dataKey="qty" radius={[0, 6, 6, 0]} barSize={20}>
          {data.map((_, i) => (
            <Cell key={i} fill={`hsl(var(--chart-${(i % 5) + 1}))`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonut({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let acc = 0;
  const stops = data.map((d, i) => {
    const start = (acc / total) * 360;
    acc += d.value;
    const end = (acc / total) * 360;
    return `hsl(var(--chart-${(i % 5) + 1})) ${start}deg ${end}deg`;
  });
  return (
    <div className="flex items-center gap-5">
      <div
        className="relative size-32 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops.join(",")})` }}
      >
        <div className="absolute inset-[18%] flex flex-col items-center justify-center rounded-full bg-card">
          <span className="text-xl font-bold tabular-nums">{total}</span>
          <span className="text-[11px] text-muted-foreground">SKUs</span>
        </div>
      </div>
      <ul className="space-y-1.5 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-sm"
              style={{ background: `hsl(var(--chart-${(i % 5) + 1}))` }}
            />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="ml-auto font-medium tabular-nums">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
