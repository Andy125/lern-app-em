// Erzeugt die App-Icons (180, 192, 512 px) aus der Tier-Zeichnung in begleiter.js.
// Aufruf: node tools/make-icons.mjs [tierart]
import fs from "node:fs";
import path from "node:path";
import { PUBLIC, ROOT } from "./lade.mjs";
import { starteBrowser } from "./server.mjs";

const art = process.argv[2] || "fuchs";
const js = fs.readFileSync(path.join(PUBLIC, "begleiter.js"), "utf8");
const b = await starteBrowser();
fs.mkdirSync(path.join(PUBLIC, "icons"), { recursive: true });
for (const g of [512, 192, 180]) {
  const p = await b.newPage({ viewport: { width: g, height: g } });
  await p.setContent(`<body style="margin:0"><div id="i" style="width:${g}px;height:${g}px;background:radial-gradient(circle at 50% 40%,#fff4df,#f6d9a8);display:grid;place-items:center"></div><script>${js}</script>
    <script>document.getElementById("i").innerHTML = '<div style="width:${Math.round(g * 0.86)}px;height:${Math.round(g * 0.86)}px">' + LN_TIER.tierSvg(${JSON.stringify(art)}, { stufe: 2, mood: "froh", traegt: ["halstuch"] }) + "</div>";</script></body>`);
  await p.screenshot({ path: path.join(PUBLIC, "icons", `icon-${g}.png`) });
  await p.close();
}
await b.close();
console.log("Icons erzeugt in", path.relative(ROOT, path.join(PUBLIC, "icons")));
