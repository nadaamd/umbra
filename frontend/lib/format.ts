/** Display formatters — terminal style: terse, tabular, deterministic. */

export const usd = (n: number, frac = 0) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: frac,
    maximumFractionDigits: frac,
  });

/** Compact USD: $1.27M, $963k. */
export function usdCompact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

export const price4 = (n: number) => `$${n.toFixed(4)}`;
export const price2 = (n: number) => `$${n.toFixed(2)}`;
export const pct = (n: number, frac = 1) => `${n.toFixed(frac)}%`;
export const bps = (n: number) => `${n.toFixed(0)} bps`;

/** UTC HH:MM from unix seconds. */
export function hhmm(ts: number): string {
  const d = new Date(ts * 1000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(
    d.getUTCMinutes()
  ).padStart(2, "0")}`;
}

/** UTC DD MMM HH:MM from unix seconds. */
export function stamp(ts: number): string {
  const d = new Date(ts * 1000);
  const mon = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  return `${String(d.getUTCDate()).padStart(2, "0")} ${mon} ${hhmm(ts)}`;
}

/** From an ISO string in the sweep data → DD MMM HH:MM UTC. */
export function stampIso(iso: string): string {
  const t = Math.floor(new Date(iso).getTime() / 1000);
  return stamp(t);
}

/** Shorten a hex address: 0x88e6…5640 */
export const addr = (a: string) =>
  a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;

/** Signed number with explicit +/−. */
export const signed = (n: number, frac = 2) =>
  `${n >= 0 ? "+" : ""}${n.toFixed(frac)}`;
