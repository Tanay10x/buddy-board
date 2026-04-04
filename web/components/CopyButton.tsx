"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="font-mono text-xs px-2 py-1 rounded transition-colors cursor-pointer"
      style={{
        backgroundColor: copied ? "rgba(224, 122, 95, 0.1)" : "#1a1a1a",
        border: `1px solid ${copied ? "#E07A5F" : "#2e2e2e"}`,
        color: copied ? "#E07A5F" : "#9ca3af",
      }}
    >
      {copied ? "Copied!" : label}
    </button>
  );
}
