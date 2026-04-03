"use client";

import { useEffect, useRef, useState } from "react";
import { RARITY_COLORS } from "@/lib/constants";
import type { Rarity } from "@/lib/types";

export function StatBar({
  label,
  value,
  rarity,
}: {
  label: string;
  value: number;
  rarity: Rarity;
}) {
  const [mounted, setMounted] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const color = RARITY_COLORS[rarity];
  const pct = Math.min(100, Math.max(0, value));

  useEffect(() => {
    // Trigger animation after mount
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <span
        className="w-24 shrink-0 text-xs font-mono uppercase tracking-wider"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </span>
      {/* Track */}
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{
          height: "6px",
          background: "var(--color-elevated)",
        }}
      >
        {/* Fill */}
        <div
          ref={barRef}
          style={{
            height: "100%",
            width: mounted ? `${pct}%` : "0%",
            background: color,
            borderRadius: "9999px",
            transition: "width 1s ease-out",
            boxShadow: `0 0 6px 0px ${color}55`,
          }}
        />
      </div>
      <span
        className="w-8 shrink-0 text-right text-xs font-mono font-bold"
        style={{ color: "var(--color-text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}
