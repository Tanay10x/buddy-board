import type { Metadata } from "next";
import { JetBrains_Mono, Instrument_Sans } from "next/font/google";
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
      <body className="font-sans bg-[#0c0c0c] text-[#e5e7eb] min-h-screen antialiased">
        {/* ── Sticky Header ─────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 border-b border-[#2e2e2e] bg-[#0c0c0c]/80 backdrop-blur-md">
          <div className="max-w-[1100px] mx-auto px-6 py-4 flex items-center justify-between">
            {/* Logo */}
            <a
              href="/"
              className="font-display text-xl font-bold tracking-tight hover:opacity-80 transition-opacity"
            >
              <span className="text-white">Buddy</span>
              <span className="text-[#4ade80]">Board</span>
            </a>

            {/* Nav links */}
            <nav className="flex items-center gap-6 text-sm text-[#9ca3af]">
              <a
                href="/"
                className="hover:text-[#e5e7eb] transition-colors"
              >
                Leaderboard
              </a>
              <a
                href="/stats"
                className="hover:text-[#e5e7eb] transition-colors"
              >
                Stats
              </a>
              <a
                href="/submit"
                className="px-3 py-1.5 rounded-md bg-[#1a1a1a] border border-[#2e2e2e] text-[#4ade80] hover:bg-[#2a2a2a] hover:border-[#4ade80]/40 transition-all text-xs font-medium font-mono"
              >
                + Submit buddy
              </a>
            </nav>
          </div>
        </header>

        {/* ── Main Content ───────────────────────────────────────────────── */}
        <main className="max-w-[1100px] mx-auto px-6 py-10">
          {children}
        </main>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer className="border-t border-[#1f1f1f] mt-16">
          <div className="max-w-[1100px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6b7280]">
            <span>
              <span className="font-display font-medium text-[#9ca3af]">Buddy</span>
              <span className="font-display font-medium text-[#4ade80]">Board</span>
              <span className="ml-2">— Claude Code companion leaderboard</span>
            </span>
            <div className="flex items-center gap-5">
              <a
                href="/submit"
                className="text-[#9ca3af] hover:text-[#4ade80] transition-colors"
              >
                Submit your buddy
              </a>
              <span className="text-[#2e2e2e]">|</span>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9ca3af] hover:text-[#e5e7eb] transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
