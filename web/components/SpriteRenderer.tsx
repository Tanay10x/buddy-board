import { renderSprite } from "@/lib/sprites";
import type { Species, Eye, Hat } from "@/lib/types";

export function SpriteRenderer({
  species,
  eye,
  hat,
}: {
  species: Species;
  eye: Eye;
  hat: Hat;
}) {
  const lines = renderSprite(species, eye, hat);
  return (
    <div className="rounded-md border border-border bg-elevated p-2.5 sm:p-3 shrink-0 flex items-center justify-center">
      <pre
        className="font-mono text-xs sm:text-sm leading-tight select-none text-terminal"
        style={{ whiteSpace: "pre" }}
      >
        {lines.join("\n")}
      </pre>
    </div>
  );
}
