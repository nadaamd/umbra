import { ReactNode } from "react";

/** A bordered terminal panel with a hairline header rail. */
export function Panel({
  title,
  tag,
  right,
  children,
  className = "",
  bodyClass = "",
}: {
  title?: string;
  tag?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClass?: string;
}) {
  return (
    <section
      className={`flex flex-col border border-line bg-panel ${className}`}
    >
      {title && (
        <header className="flex items-center justify-between border-b border-line px-3 h-9 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-[11px] tracking-[0.08em] uppercase text-ink2 truncate">
              {title}
            </span>
            {tag && (
              <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-ink3 border border-line2 px-1 py-px rounded-sm">
                {tag}
              </span>
            )}
          </div>
          {right}
        </header>
      )}
      <div className={`flex-1 min-h-0 ${bodyClass}`}>{children}</div>
    </section>
  );
}

/** A labeled datum: micro uppercase label over a mono value. */
export function Stat({
  label,
  value,
  sub,
  tone = "ink",
  align = "left",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "ink" | "risk" | "safe" | "armed" | "ink2";
  align?: "left" | "right";
}) {
  const toneClass = {
    ink: "text-ink",
    ink2: "text-ink2",
    risk: "text-risk",
    safe: "text-safe",
    armed: "text-armed",
  }[tone];
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <div className="label">{label}</div>
      <div className={`font-mono tabular-nums leading-tight mt-1 ${toneClass}`}>
        {value}
      </div>
      {sub && <div className="font-mono text-[10px] text-ink3 mt-0.5">{sub}</div>}
    </div>
  );
}

/** Thin uppercase micro label. */
export function Label({ children }: { children: ReactNode }) {
  return <div className="label">{children}</div>;
}

/** Horizontal hairline. */
export function Rule({ className = "" }: { className?: string }) {
  return <div className={`h-px bg-line ${className}`} />;
}

/** A small keycap-style chip. */
export function Chip({
  children,
  active = false,
  onClick,
  title,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`font-mono text-[10px] px-1.5 h-[18px] rounded-sm border transition-colors ${
        active
          ? "border-ink2 bg-raised text-ink"
          : "border-line2 text-ink3 hover:text-ink2 hover:border-ink3"
      }`}
    >
      {children}
    </button>
  );
}
