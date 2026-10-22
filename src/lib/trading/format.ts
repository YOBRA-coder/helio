export function money(n: number, digits = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function px(n: number) {
  if (!Number.isFinite(n)) return "—";
  return `${Math.round(n * 1000) / 10}¢`;
}

export function signedMoney(n: number) {
  if (!Number.isFinite(n)) return "—";
  const body = money(Math.abs(n));
  if (n > 0) return `+${body}`;
  if (n < 0) return `−${body}`;
  return body;
}

export function pct(n: number) {
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

export function remain(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "0s";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export function clock(ts: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function age(now: number, then: number) {
  if (!then || !now) return "—";
  return `${remain(Math.max(0, now - then))} ago`;
}

function csvCell(value: string | number) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv(rows: Array<Array<string | number>>) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: filename.endsWith(".json") ? "application/json" : "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
