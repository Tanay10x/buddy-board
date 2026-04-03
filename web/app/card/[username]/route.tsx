import { ImageResponse } from "next/og";
import { getBuddyByUsername } from "@/lib/queries";
import { renderSprite } from "@/lib/sprites";
import { RARITY_COLORS, RARITY_STARS, STAT_NAMES } from "@/lib/constants";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

async function loadFont(): Promise<ArrayBuffer> {
  const fontPath = join(process.cwd(), "public", "fonts", "JetBrainsMono-Regular.ttf");
  const buffer = await readFile(fontPath);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const buddy = await getBuddyByUsername(username);

  if (!buddy) {
    return new Response("Not found", { status: 404 });
  }

  const font = await loadFont();
  const sprite = renderSprite(buddy.species, buddy.eye, buddy.hat);
  const borderColor = RARITY_COLORS[buddy.rarity];
  const stars = RARITY_STARS[buddy.rarity];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "600px",
          height: "340px",
          backgroundColor: "#0c0c0c",
          border: `3px solid ${borderColor}`,
          borderRadius: "12px",
          padding: "20px 24px",
          fontFamily: "JetBrains Mono",
          color: "#e5e7eb",
          boxSizing: "border-box",
        }}
      >
        {/* ── Header ───────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "14px",
            paddingBottom: "10px",
            borderBottom: `1px solid #1f1f1f`,
          }}
        >
          <span style={{ color: borderColor, fontSize: "13px", fontWeight: "bold", letterSpacing: "0.05em" }}>
            {stars} {buddy.rarity.toUpperCase()}
          </span>
          <span style={{ color: "#6b7280", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {buddy.species}
            {buddy.shiny ? " ✦ SHINY" : ""}
          </span>
        </div>

        {/* ── Body: sprite + name/personality ─────────────── */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "14px", flex: "1 0 auto" }}>
          {/* Sprite */}
          <div
            style={{
              display: "flex",
              backgroundColor: "#1a1a1a",
              borderRadius: "8px",
              padding: "10px 12px",
              border: `1px solid #2e2e2e`,
            }}
          >
            <pre
              style={{
                fontSize: "10.5px",
                lineHeight: "1.25",
                color: "#4ade80",
                margin: 0,
                whiteSpace: "pre",
              }}
            >
              {sprite.join("\n")}
            </pre>
          </div>

          {/* Name + personality */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
            <span
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#e5e7eb",
                marginBottom: "6px",
                letterSpacing: "-0.01em",
              }}
            >
              {buddy.name}
            </span>
            <span
              style={{
                fontSize: "11px",
                color: "#9ca3af",
                fontStyle: "italic",
                lineHeight: "1.45",
                maxWidth: "280px",
              }}
            >
              &quot;{buddy.personality.slice(0, 110)}{buddy.personality.length > 110 ? "…" : ""}&quot;
            </span>
          </div>
        </div>

        {/* ── Stat bars ────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px" }}>
          {STAT_NAMES.map((stat) => {
            const value = buddy.stats[stat];
            const pct = (value / 100) * 100;
            return (
              <div key={stat} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px" }}>
                <span style={{ width: "76px", color: "#9ca3af", fontSize: "10px", letterSpacing: "0.05em" }}>
                  {stat}
                </span>
                {/* Bar track */}
                <div
                  style={{
                    flex: 1,
                    height: "6px",
                    backgroundColor: "#1a1a1a",
                    borderRadius: "3px",
                    display: "flex",
                    overflow: "hidden",
                  }}
                >
                  {/* Bar fill */}
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      backgroundColor: borderColor,
                      borderRadius: "3px",
                    }}
                  />
                </div>
                <span style={{ width: "26px", textAlign: "right", color: "#e5e7eb", fontSize: "11px" }}>
                  {value}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Footer ───────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "8px",
            borderTop: "1px solid #1f1f1f",
            fontSize: "10px",
          }}
        >
          <span style={{ color: "#9ca3af" }}>
            @{buddy.username}
            {buddy.github_verified ? (
              <span style={{ color: "#4ade80", marginLeft: "6px" }}>✓ GitHub</span>
            ) : null}
          </span>
          <span style={{ color: "#6b7280", letterSpacing: "0.04em" }}>buddyboard.dev</span>
        </div>
      </div>
    ),
    {
      width: 600,
      height: 340,
      fonts: [
        {
          name: "JetBrains Mono",
          data: font,
          style: "normal",
          weight: 400,
        },
      ],
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    },
  );
}
