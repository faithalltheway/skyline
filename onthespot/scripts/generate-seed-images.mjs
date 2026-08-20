// Generates local SVG placeholder images for seed data so the app has zero
// dependency on an external image host (picsum.photos, etc).
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "seed");
mkdirSync(outDir, { recursive: true });

const PALETTES = [
  ["#0f8a7f", "#3ccdb8"],
  ["#ec4110", "#ff7a3d"],
  ["#134946", "#1aad9d"],
  ["#7e2414", "#fb5a1e"],
  ["#106f68", "#71e4cf"],
  ["#9c2814", "#ffa470"],
  ["#052a29", "#0f8a7f"],
  ["#c4300e", "#ffc9a8"],
  ["#135854", "#a9f2e2"],
  ["#7e2414", "#ec4110"],
];

const ICONS = ["🎵", "😂", "⚽", "🍔", "🖼️", "🤝", "♿", "🎪", "🎮", "🎨", "📚"];

for (let i = 0; i < 20; i++) {
  const [c1, c2] = PALETTES[i % PALETTES.length];
  const icon = ICONS[i % ICONS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <text x="400" y="330" font-size="160" text-anchor="middle" dominant-baseline="middle">${icon}</text>
</svg>`;
  writeFileSync(path.join(outDir, `event-${i}.svg`), svg);
}

console.log(`Generated 20 seed placeholder images in ${outDir}`);
