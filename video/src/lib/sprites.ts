import type { Species, Eye, Hat } from "./types";

const BODIES: Record<Species, string[][]> = {
  duck: [
    ["            ", "    __      ", "  <({E} )___  ", "   (  ._>   ", "    `--´    "],
  ],
  goose: [
    ["            ", "     ({E}>    ", "     ||     ", "   _(__)_   ", "    ^^^^    "],
  ],
  blob: [
    ["            ", "   .----.   ", "  ( {E}  {E} )  ", "  (      )  ", "   `----´   "],
  ],
  cat: [
    ["            ", "   /\\_/\\    ", "  ( {E}   {E})  ", "  (  ω  )   ", '  (")_(")   '],
  ],
  dragon: [
    ["            ", "  /^\\  /^\\  ", " <  {E}  {E}  > ", " (   ~~   ) ", "  `-vvvv-´  "],
  ],
  octopus: [
    ["            ", "   .----.   ", "  ( {E}  {E} )  ", "  (______)  ", "  /\\/\\/\\/\\  "],
  ],
  owl: [
    ["            ", "   /\\  /\\   ", "  (({E})({E}))  ", "  (  ><  )  ", "   `----´   "],
  ],
  penguin: [
    ["            ", "  .---.     ", "  ({E}>{E})     ", " /(   )\\    ", "  `---´     "],
  ],
  turtle: [
    ["            ", "   _,--._   ", "  ( {E}  {E} )  ", " /[______]\\ ", "  ``    ``  "],
  ],
  snail: [
    ["            ", " {E}    .--.  ", "  \\  ( @ )  ", "   \\_`--´   ", "  ~~~~~~~   "],
  ],
  ghost: [
    ["            ", "   .----.   ", "  / {E}  {E} \\  ", "  |      |  ", "  ~`~``~`~  "],
  ],
  axolotl: [
    ["            ", "}~(______)~{", "}~({E} .. {E})~{", "  ( .--. )  ", "  (_/  \\_)  "],
  ],
  capybara: [
    ["            ", "  n______n  ", " ( {E}    {E} ) ", " (   oo   ) ", "  `------´  "],
  ],
  cactus: [
    ["            ", " n  ____  n ", " | |{E}  {E}| | ", " |_|    |_| ", "   |    |   "],
  ],
  robot: [
    ["            ", "   .[||].   ", "  [ {E}  {E} ]  ", "  [ ==== ]  ", "  `------´  "],
  ],
  rabbit: [
    ["            ", "   (\\__/)   ", "  ( {E}  {E} )  ", " =(  ..  )= ", '  (")__(")  '],
  ],
  mushroom: [
    ["            ", " .-o-OO-o-. ", "(__________)", "   |{E}  {E}|   ", "   |____|   "],
  ],
  chonk: [
    ["            ", "  /\\    /\\  ", " ( {E}    {E} ) ", " (   ..   ) ", "  `------´  "],
  ],
};

const HAT_LINES: Record<Hat, string> = {
  none: "",
  crown: "   \\^^^/    ",
  tophat: "   [___]    ",
  propeller: "    -+-     ",
  halo: "   (   )    ",
  wizard: "    /^\\     ",
  beanie: "   (___)    ",
  tinyduck: "    ,>      ",
};

export function renderSprite(species: Species, eye: Eye, hat: Hat): string[] {
  const frames = BODIES[species];
  const body = frames[0].map((line) => line.replaceAll("{E}", eye));
  const lines = [...body];

  if (hat !== "none" && !lines[0].trim()) {
    lines[0] = HAT_LINES[hat];
  }

  if (!lines[0].trim()) {
    lines.shift();
  }

  return lines;
}
