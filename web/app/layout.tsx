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
      <body className="font-sans bg-base text-text-primary min-h-screen antialiased">
        {/* ── Sticky Header ─────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 border-b border-border bg-base/80 backdrop-blur-md">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            {/* Logo */}
            <a
              href="/"
              className="font-display text-lg sm:text-xl font-bold tracking-tight hover:opacity-80 transition-opacity"
            >
              <span className="text-white">Buddy</span>
              <span className="text-terminal">Board</span>
            </a>

            {/* Nav links */}
            <nav className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm text-text-secondary">
              <a
                href="/"
                className="hover:text-text-primary transition-colors"
              >
                Leaderboard
              </a>
              <a
                href="/stats"
                className="hover:text-text-primary transition-colors"
              >
                Stats
              </a>
              <a
                href="/submit"
                className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface border border-border text-terminal hover:bg-hover hover:border-terminal/40 transition-all text-xs font-medium font-mono"
              >
                + Submit
              </a>
            </nav>
          </div>
        </header>

        {/* ── Main Content ───────────────────────────────────────────────── */}
        <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {children}
        </main>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer className="border-t border-border-subtle mt-12 sm:mt-16">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
            <span>
              <span className="font-display font-medium text-text-secondary">Buddy</span>
              <span className="font-display font-medium text-terminal">Board</span>
              <span className="ml-2">— Claude Code companion leaderboard</span>
            </span>
            <div className="flex items-center gap-5">
              <a
                href="/submit"
                className="text-text-secondary hover:text-terminal transition-colors"
              >
                Submit your buddy
              </a>
              <span className="text-border">|</span>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary hover:text-text-primary transition-colors"
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
