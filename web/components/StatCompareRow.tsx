import type { StatName } from "@/lib/types";

export function StatCompareRow({
  stat,
  valueA,
  valueB,
}: {
  stat: StatName;
  valueA: number;
  valueB: number;
}) {
  const aHigher = valueA > valueB;
  const bHigher = valueB > valueA;

  const winColor = "#4ade80";
  const neutralColor = "#6b7280";

  return (
    <div
      className="grid grid-cols-3 px-5 py-3"
      style={{ borderTop: "1px solid #1f1f1f" }}
    >
      {/* Left value */}
      <div className="flex items-center gap-1.5">
        <span
          className="font-display font-bold text-base"
          style={{ color: aHigher ? winColor : "#9ca3af" }}
        >
          {valueA}
        </span>
        {aHigher && (
          <span className="font-mono text-xs" style={{ color: winColor }}>
            ↑
          </span>
        )}
        {bHigher && (
          <span className="font-mono text-xs" style={{ color: neutralColor }}>
            ↓
          </span>
        )}
      </div>

      {/* Stat label */}
      <span
        className="font-mono text-[10px] uppercase tracking-wider text-center self-center"
        style={{ color: neutralColor }}
      >
        {stat}
      </span>

      {/* Right value */}
      <div className="flex items-center justify-end gap-1.5">
        {aHigher && (
          <span className="font-mono text-xs" style={{ color: neutralColor }}>
            ↓
          </span>
        )}
        {bHigher && (
          <span className="font-mono text-xs" style={{ color: winColor }}>
            ↑
          </span>
        )}
        <span
          className="font-display font-bold text-base"
          style={{ color: bHigher ? winColor : "#9ca3af" }}
        >
          {valueB}
        </span>
      </div>
    </div>
  );
}
