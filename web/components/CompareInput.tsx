"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CompareInput({ username }: { username: string }) {
  const [other, setOther] = useState("");
  const router = useRouter();

  function handleCompare() {
    const opponent = other.trim().toLowerCase().replace(/^@/, "");
    if (!opponent) return;
    router.push(`/compare/${username}/${opponent}`);
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="@username"
        value={other}
        onChange={(e) => setOther(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCompare()}
        className="flex-1 bg-transparent font-mono text-xs rounded-md px-3 py-2 outline-none"
        style={{
          border: "1px solid #3a3a3a",
          color: "#e5e7eb",
        }}
      />
      <button
        onClick={handleCompare}
        className="px-3 py-2 rounded-md font-mono text-xs font-medium transition-colors"
        style={{
          backgroundColor: "#1f1f1f",
          border: "1px solid #2e2e2e",
          color: "#E07A5F",
        }}
      >
        Compare
      </button>
    </div>
  );
}
