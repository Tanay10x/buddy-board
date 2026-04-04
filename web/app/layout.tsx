import type { Metadata } from "next";
import { JetBrains_Mono, Instrument_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Instrument Sans — body font, self-hosted via next/font (zero-CLS)
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-instrument-sans",
  display: "swap",
});

// JetBrains Mono — stats/code, self-hosted via next/font
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Satoshi (display/headings) is loaded via CSS @import in globals.css
// because it comes from Fontshare CDN, not Google Fonts.

export const metadata: Metadata = {
  title: "Buddy Board — Claude Code Companion Leaderboard",
  description:
    "See how your Claude Code buddy stacks up. Submit your companion, climb the leaderboard, share your trading card.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${jetbrainsMono.variable}`}
    >
      <body
        className="font-sans min-h-screen antialiased"
        style={{ backgroundColor: "#0c0c0c", color: "#e5e7eb" }}
      >
        {/* ── Sticky Header ─────────────────────────────────── */}
        <header
          className="sticky top-0 z-50 backdrop-blur-md"
          style={{
            borderBottom: "1px solid #2e2e2e",
            backgroundColor: "rgba(12, 12, 12, 0.8)",
          }}
        >
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between">
            {/* Logo */}
            <a
              href="/"
              className="font-display text-lg sm:text-xl font-bold tracking-tight hover:opacity-80 transition-opacity"
            >
              <span style={{ color: "#ffffff" }}>Buddy</span>
              <span style={{ color: "#4ade80" }}>Board</span>
            </a>

            {/* Nav links */}
            <nav className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm" style={{ color: "#9ca3af" }}>
              <a
                href="/"
                className="hover:text-white transition-colors"
              >
                Leaderboard
              </a>
              <a
                href="/stats"
                className="hover:text-white transition-colors"
              >
                Stats
              </a>
              <a
                href="/org"
                className="hover:text-white transition-colors"
              >
                Orgs
              </a>
              <a
                href="/dex"
                className="hover:text-white transition-colors"
              >
                BuddyDex
              </a>
              <a
                href="/recent"
                className="hover:text-white transition-colors"
              >
                Recent
              </a>
            </nav>
          </div>
        </header>

        {/* ── Main Content ──────────────────────────────────── */}
        <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 sm:py-10">
          {children}
        </main>

        {/* ── Footer ─────────────────────────────────────────── */}
        <footer style={{ borderTop: "1px solid #1f1f1f" }} className="mt-12 sm:mt-16">
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ color: "#6b7280" }}>
            <span>
              <span className="font-display font-medium" style={{ color: "#9ca3af" }}>Buddy</span>
              <span className="font-display font-medium" style={{ color: "#4ade80" }}>Board</span>
              <span className="ml-2">— Claude Code companion leaderboard</span>
            </span>
            <div className="flex items-center gap-5">
              <a
                href="/#hero"
                className="hover:text-white transition-colors"
                style={{ color: "#9ca3af" }}
              >
                Submit your buddy
              </a>
              <span style={{ color: "#2e2e2e" }}>|</span>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                style={{ color: "#9ca3af" }}
              >
                GitHub
              </a>
            </div>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
