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
  title: {
    default: "Buddy Board — Claude Code Buddy Leaderboard & Trading Cards",
    template: "%s | Buddy Board",
  },
  description:
    "The competitive leaderboard and Pokédex-style trading cards for Claude Code /buddy companions. 18 species, 5 rarity tiers, 1,728 unique combos. Submit yours with npx buddy-board.",
  keywords: [
    "claude buddy", "claude code buddy", "buddy board", "claude code leaderboard",
    "claude code companion", "claude buddy trading card", "claude buddy leaderboard",
    "claude code /buddy", "buddydex", "claude buddy species", "claude buddy rarity",
    "ascii art trading cards", "ai companion leaderboard",
  ],
  metadataBase: new URL("https://buddyboard.xyz"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Buddy Board",
    title: "Buddy Board — Claude Code Buddy Leaderboard & Trading Cards",
    description:
      "Pokédex-style trading cards for Claude Code /buddy companions. 18 species, 5 rarity tiers, holographic effects, org team battles. npx buddy-board to join.",
    url: "https://buddyboard.xyz",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 675,
        alt: "Buddy Board — Claude Code Companion Leaderboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buddy Board — Claude Code Buddy Leaderboard",
    description:
      "Trading cards for your Claude Code /buddy. 18 species, 5 rarity tiers, 1,728 combos. How rare is yours?",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Buddy Board",
              url: "https://buddyboard.xyz",
              description:
                "Competitive leaderboard and Pokédex-style trading cards for Claude Code /buddy companions. 18 species, 5 rarity tiers, 1,728 unique combos.",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Web",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              author: {
                "@type": "Person",
                name: "TanayK07",
                url: "https://github.com/TanayK07",
              },
            }),
          }}
        />
      </head>
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
              <a
                href="https://github.com/TanayK07/buddy-board"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                title="GitHub"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
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
                href="https://github.com/TanayK07/buddy-board"
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
