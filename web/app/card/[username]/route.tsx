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
          backgroundColor: "#0a0a0a",
          border: `3px solid ${borderColor}`,
          borderRadius: "12px",
          padding: "24px",
          fontFamily: "JetBrains Mono",
          color: "#e5e7eb",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ color: borderColor, fontSize: "14px", fontWeight: "bold" }}>
            {stars} {buddy.rarity.toUpperCase()}
          </span>
          <span style={{ color: "#6b7280", fontSize: "14px", textTransform: "uppercase" }}>
            {buddy.species}
            {buddy.shiny ? " SHINY" : ""}
          </span>
        </div>

        {/* Body: sprite + info */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "12px" }}>
          <pre
            style={{
              fontSize: "11px",
              lineHeight: "1.2",
              color: "#4ade80",
              margin: 0,
              whiteSpace: "pre",
            }}
          >
            {sprite.join("\n")}
          </pre>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span style={{ fontSize: "18px", fontWeight: "bold", color: "#fff" }}>
              {buddy.name}
            </span>
            <span
              style={{
                fontSize: "11px",
                color: "#9ca3af",
                fontStyle: "italic",
                marginTop: "4px",
                maxWidth: "280px",
                lineHeight: "1.4",
              }}
            >
              &quot;{buddy.personality.slice(0, 120)}{buddy.personality.length > 120 ? "..." : ""}&quot;
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {STAT_NAMES.map((stat) => {
            const value = buddy.stats[stat];
            const filled = Math.round(value / 10);
            const bar = "\u2588".repeat(filled) + "\u2591".repeat(10 - filled);
            return (
              <div key={stat} style={{ display: "flex", gap: "8px", fontSize: "12px" }}>
                <span style={{ width: "80px", color: "#9ca3af" }}>{stat}</span>
                <span style={{ color: borderColor }}>{bar}</span>
                <span style={{ width: "24px", textAlign: "right", color: "#fff" }}>{value}</span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "auto",
            paddingTop: "8px",
            borderTop: "1px solid #1f2937",
            fontSize: "11px",
          }}
        >
          <span style={{ color: "#9ca3af" }}>
            @{buddy.username}
            {buddy.github_verified ? " GitHub" : ""}
          </span>
          <span style={{ color: "#6b7280" }}>buddyboard.dev</span>
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
