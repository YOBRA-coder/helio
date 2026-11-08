import { useEffect, useState } from "react";
import type { EquityPoint } from "@/lib/trading/types";

type Recharts = typeof import("recharts");

export function useRecharts() {
  const [mod, setMod] = useState<Recharts | null>(null);
  useEffect(() => {
    let live = true;
    void import("recharts").then((m) => live && setMod(m));
    return () => {
      live = false;
    };
  }, []);
  return mod;
}

const tip = {
  background: "var(--t-surface)",
  border: "1px solid var(--t-line)",
  borderRadius: 12,
  color: "var(--t-fg)",
} as const;

function Empty({ h, label }: { h: number; label: string }) {
  return (
    <div className="grid place-items-center rounded-md bg-raised text-sm text-muted" style={{ height: h }}>
      {label}
    </div>
  );
}

const hhmm = (t: number) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Equity with drawdown from the running peak underneath. */
export function EquityDrawdownChart({ data }: { data: EquityPoint[] }) {
  const mod = useRecharts();
  if (!mod || data.length < 3) return <Empty h={240} label="Equity builds up as the desk runs" />;
  let peak = -Infinity;
  const rows = data.map((d) => {
    peak = Math.max(peak, d.equity);
    return { t: d.t, equity: d.equity, dd: -(peak - d.equity) };
  });
  const { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } = mod;
  return (
    <div className="h-60 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--t-line)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="t" tickFormatter={hhmm} tick={{ fill: "var(--t-muted)", fontSize: 11 }} minTickGap={48} />
          <YAxis yAxisId="e" domain={["auto", "auto"]} tick={{ fill: "var(--t-muted)", fontSize: 11 }} width={52} tickFormatter={(v) => `$${Math.round(Number(v))}`} />
          <YAxis yAxisId="d" orientation="right" hide domain={["dataMin", 0]} />
          <Tooltip contentStyle={tip} labelFormatter={(t) => new Date(Number(t)).toLocaleString()} formatter={(v, n) => [`$${Number(v).toFixed(2)}`, n === "dd" ? "Drawdown" : "Equity"]} />
          <Area yAxisId="d" type="monotone" dataKey="dd" stroke="var(--t-danger)" fill="var(--t-danger)" fillOpacity={0.15} strokeWidth={1} dot={false} />
          <Line yAxisId="e" type="monotone" dataKey="equity" stroke="var(--t-primary)" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** BTC reference with the open print of each live window drawn as a line. */
export function SpotChart({ spots, dtMs, now, opens }: { spots: number[]; dtMs: number; now: number; opens: Array<{ label: string; price: number }> }) {
  const mod = useRecharts();
  if (!mod || spots.length < 3) return <Empty h={220} label="Waiting for BTC prints" />;
  const base = now || Date.now();
  const rows = spots.map((p, i) => ({ t: base - (spots.length - 1 - i) * dtMs, p }));
  const lo = Math.min(...spots, ...opens.map((o) => o.price));
  const hi = Math.max(...spots, ...opens.map((o) => o.price));
  const pad = Math.max((hi - lo) * 0.15, hi * 0.0003);
  const { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceLine } = mod;
  return (
    <div className="h-56 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--t-line)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="t" tickFormatter={hhmm} tick={{ fill: "var(--t-muted)", fontSize: 11 }} minTickGap={48} />
          <YAxis domain={[lo - pad, hi + pad]} tick={{ fill: "var(--t-muted)", fontSize: 11 }} width={60} tickFormatter={(v) => `$${Math.round(Number(v)).toLocaleString()}`} />
          <Tooltip contentStyle={tip} labelFormatter={(t) => new Date(Number(t)).toLocaleTimeString()} formatter={(v) => [`$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, "BTC"]} />
          {opens.map((o) => (
            <ReferenceLine key={o.label} y={o.price} stroke="var(--t-muted)" strokeDasharray="4 4" label={{ value: `${o.label} open`, fill: "var(--t-muted)", fontSize: 10, position: "insideTopLeft" }} />
          ))}
          <Line type="monotone" dataKey="p" stroke="var(--t-primary)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Market YES mid against the model's probability for one contract. */
export function ModelVsMarketChart({ rows }: { rows: Array<[number, number, number]> }) {
  const mod = useRecharts();
  if (!mod || rows.length < 3) return <Empty h={180} label="History builds while the contract is open" />;
  const data = rows.map(([t, mid, p]) => ({ t, mid: mid * 100, p: p * 100 }));
  const { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } = mod;
  return (
    <div className="h-48 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--t-line)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="t" tickFormatter={hhmm} tick={{ fill: "var(--t-muted)", fontSize: 11 }} minTickGap={48} />
          <YAxis domain={[0, 100]} tick={{ fill: "var(--t-muted)", fontSize: 11 }} width={36} tickFormatter={(v) => `${v}¢`} />
          <Tooltip contentStyle={tip} labelFormatter={(t) => new Date(Number(t)).toLocaleTimeString()} formatter={(v, n) => [`${Number(v).toFixed(1)}%`, n === "mid" ? "Market" : "Model"]} />
          <Legend formatter={(v) => (v === "mid" ? "Market YES" : "Model YES")} wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="mid" stroke="var(--t-fg)" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="p" stroke="var(--t-primary)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Cumulative P&L per settled trade. */
export function PnlCurve({ pnls }: { pnls: number[] }) {
  const mod = useRecharts();
  if (!mod || pnls.length < 2) return <Empty h={180} label="Needs two settled trades" />;
  let c = 0;
  const data = pnls.map((p, i) => ({ n: i + 1, c: (c += p) }));
  const { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, CartesianGrid } = mod;
  return (
    <div className="h-48 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--t-line)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="n" tick={{ fill: "var(--t-muted)", fontSize: 11 }} />
          <YAxis tick={{ fill: "var(--t-muted)", fontSize: 11 }} width={48} tickFormatter={(v) => `$${Math.round(Number(v))}`} />
          <ReferenceLine y={0} stroke="var(--t-muted)" />
          <Tooltip contentStyle={tip} labelFormatter={(n) => `Trade ${n}`} formatter={(v) => [`$${Number(v).toFixed(2)}`, "Cumulative"]} />
          <Area type="monotone" dataKey="c" stroke="var(--t-primary)" fill="var(--t-primary)" fillOpacity={0.16} strokeWidth={2} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Calibration: predicted bucket vs how often YES actually won. */
export function CalibrationChart({ rows }: { rows: Array<{ p: number; won: number; n: number }> }) {
  const mod = useRecharts();
  const usable = rows.filter((r) => r.n > 0);
  if (!mod || usable.length < 2) return <Empty h={200} label="Needs more official settlements" />;
  const data = usable.map((r) => ({ p: r.p * 100, won: r.won * 100, n: r.n, ideal: r.p * 100 }));
  const { ComposedChart, Line, Scatter, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } = mod;
  return (
    <div className="h-52 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--t-line)" strokeDasharray="3 3" />
          <XAxis dataKey="p" type="number" domain={[0, 100]} tick={{ fill: "var(--t-muted)", fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
          <YAxis type="number" domain={[0, 100]} tick={{ fill: "var(--t-muted)", fontSize: 11 }} width={36} tickFormatter={(v) => `${v}%`} />
          <Tooltip contentStyle={tip} formatter={(v, n, item) => [`${Number(v).toFixed(0)}%`, n === "won" ? `Won (n=${(item.payload as { n: number }).n})` : "Ideal"]} />
          <Line dataKey="ideal" stroke="var(--t-muted)" strokeDasharray="4 4" dot={false} isAnimationActive={false} />
          <Scatter dataKey="won" fill="var(--t-primary)" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** BTC over the last few minutes with each open window's open print drawn as a line. Takes the live feed's own series. */
export function BtcLiveChart({ series, opens }: { series: Array<[number, number]>; opens: Array<{ label: string; price: number }> }) {
  const mod = useRecharts();
  if (!mod || series.length < 3) return <Empty h={200} label="Waiting for live BTC prints" />;
  const rows = series.map(([t, p]) => ({ t, p }));
  const prices = rows.map((r) => r.p);
  const lo = Math.min(...prices, ...opens.map((o) => o.price));
  const hi = Math.max(...prices, ...opens.map((o) => o.price));
  const pad = Math.max((hi - lo) * 0.15, hi * 0.0002);
  const { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceLine } = mod;
  return (
    <div className="h-52 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--t-line)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={hhmm} tick={{ fill: "var(--t-muted)", fontSize: 11 }} minTickGap={56} />
          <YAxis domain={[lo - pad, hi + pad]} tick={{ fill: "var(--t-muted)", fontSize: 11 }} width={60} tickFormatter={(v) => `$${Math.round(Number(v)).toLocaleString()}`} />
          <Tooltip contentStyle={tip} labelFormatter={(t) => new Date(Number(t)).toLocaleTimeString()} formatter={(v) => [`$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, "BTC"]} />
          {opens.map((o) => (
            <ReferenceLine key={o.label} y={o.price} stroke="var(--t-muted)" strokeDasharray="4 4" label={{ value: `${o.label} open`, fill: "var(--t-muted)", fontSize: 10, position: "insideTopLeft" }} />
          ))}
          <Line type="monotone" dataKey="p" stroke="var(--t-primary)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Win rate by entry price against the break-even line (what you paid is the win rate you need). */
export function PriceBucketChart({ rows }: { rows: Array<{ label: string; trades: number; winRate: number; breakEven: number }> }) {
  const mod = useRecharts();
  const usable = rows.filter((r) => r.trades > 0);
  if (!mod || usable.length < 1) return <Empty h={200} label="Needs settled trades" />;
  const data = usable.map((r) => ({ label: `${r.label} (${r.trades})`, win: Math.round(r.winRate * 100), be: Math.round(r.breakEven * 100) }));
  const { ComposedChart, Bar, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } = mod;
  return (
    <div className="h-52 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--t-line)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--t-muted)", fontSize: 11 }} interval={0} />
          <YAxis domain={[0, 100]} tick={{ fill: "var(--t-muted)", fontSize: 11 }} width={36} tickFormatter={(v) => `${v}%`} />
          <Tooltip contentStyle={tip} formatter={(v, n) => [`${v}%`, n === "win" ? "Won" : "Needed to break even"]} />
          <Legend formatter={(v) => (v === "win" ? "Win rate" : "Break-even")} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="win" fill="var(--t-primary)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Line dataKey="be" stroke="var(--t-danger)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Each settled trade: the edge the model claimed at entry against what it actually made. */
export function EdgeResultChart({ rows }: { rows: Array<{ edge: number; pnl: number }> }) {
  const mod = useRecharts();
  if (!mod || rows.length < 5) return <Empty h={200} label="Needs about five settled trades" />;
  const wins = rows.filter((r) => r.pnl > 0).map((r) => ({ x: r.edge * 100, y: r.pnl }));
  const losses = rows.filter((r) => r.pnl <= 0).map((r) => ({ x: r.edge * 100, y: r.pnl }));
  const { ScatterChart, Scatter, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceLine } = mod;
  return (
    <div className="h-52 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--t-line)" strokeDasharray="3 3" />
          <XAxis type="number" dataKey="x" name="Edge" tick={{ fill: "var(--t-muted)", fontSize: 11 }} tickFormatter={(v) => `${Number(v).toFixed(0)}¢`} />
          <YAxis type="number" dataKey="y" name="P&L" tick={{ fill: "var(--t-muted)", fontSize: 11 }} width={44} tickFormatter={(v) => `$${Math.round(Number(v))}`} />
          <ReferenceLine y={0} stroke="var(--t-muted)" />
          <Tooltip contentStyle={tip} cursor={{ strokeDasharray: "3 3" }} formatter={(v, n) => [n === "Edge" ? `${Number(v).toFixed(1)}¢` : `$${Number(v).toFixed(2)}`, String(n)]} />
          <Scatter name="Won" data={wins} fill="var(--t-primary)" isAnimationActive={false} />
          <Scatter name="Lost" data={losses} fill="var(--t-danger)" isAnimationActive={false} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
