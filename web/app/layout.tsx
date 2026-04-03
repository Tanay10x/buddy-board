import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Buddy Board — Claude Code Companion Leaderboard",
  description: "See how your Claude Code buddy stacks up. Submit your companion, climb the leaderboard, share your trading card.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${jetbrainsMono.variable} font-mono bg-gray-950 text-gray-100 min-h-screen`}>
        <nav className="border-b border-gray-800 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-white hover:text-gray-300">
              Buddy Board
            </a>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="/" className="hover:text-white">Leaderboard</a>
              <a href="/stats" className="hover:text-white">Stats</a>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
