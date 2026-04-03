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
    <pre className="font-mono text-sm leading-tight text-green-400 select-none">
      {lines.join("\n")}
    </pre>
  );
}
