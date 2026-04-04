import { ImageResponse } from "next/og";
import { getBuddyByUsername } from "@/lib/queries";
import { RARITY_COLORS, RARITY_STARS } from "@/lib/constants";
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
  const rarityColor = RARITY_COLORS[buddy.rarity];
  const stars = RARITY_STARS[buddy.rarity];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "500px",
          height: "100px",
          backgroundColor: "#0c0c0c",
          border: `2px solid ${rarityColor}`,
          borderRadius: "8px",
          fontFamily: "JetBrains Mono",
          overflow: "hidden",
        }}
      >
        {/* Rarity color bar */}
        <div
          style={{
            width: "6px",
            height: "100%",
            backgroundColor: rarityColor,
            flexShrink: 0,
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flex: 1,
            padding: "0 20px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: rarityColor, fontSize: "12px" }}>{stars}</span>
              <span style={{ color: "#e5e7eb", fontSize: "16px", fontWeight: "bold" }}>
                {buddy.name}
              </span>
            </div>
            <span style={{ color: "#6b7280", fontSize: "12px" }}>
              @{buddy.username} · {buddy.species}
              {buddy.shiny ? " ✨" : ""}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ color: "#4ade80", fontSize: "24px", fontWeight: "bold" }}>
              {buddy.total_stats}
            </span>
            <span style={{ color: "#6b7280", fontSize: "10px" }}>TOTAL</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 500,
      height: 100,
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
