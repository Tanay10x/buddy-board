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
    <pre
      className="font-mono text-sm leading-tight select-none shrink-0"
      style={{ color: "#4ade80" }}
    >
      {lines.join("\n")}
    </pre>
  );
}
