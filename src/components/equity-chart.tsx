import { useEffect, useState } from "react";
import type { EquityPoint } from "@/lib/trading/types";

type Recharts = typeof import("recharts");

export function EquityChart({ data }: { data: EquityPoint[] }) {
  const [mod, setMod] = useState<Recharts | null>(null);
  useEffect(() => {
    let live = true;
    void import("recharts").then((loaded) => {
      if (live) setMod(loaded);
    });
    return () => {
      live = false;
    };
  }, []);
  if (!mod || data.length < 2) {
    return <div className="grid h-52 place-items-center rounded-md bg-raised text-sm text-muted">Equity curve</div>;
  }
  const { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } = mod;
  return (
    <div className="h-52 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <XAxis dataKey="t" hide />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip
            formatter={(value) => [`$${Number(value).toFixed(2)}`, "Equity"]}
            contentStyle={{
              background: "var(--t-surface)",
              border: "1px solid var(--t-line)",
              borderRadius: 12,
              color: "var(--t-fg)",
            }}
          />
          <Area
            type="monotone"
            dataKey="equity"
            stroke="var(--t-primary)"
            fill="var(--t-primary)"
            fillOpacity={0.18}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
