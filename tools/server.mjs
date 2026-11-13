// Kleiner Server für public/ (für die Browser-Tests). Startet auf einem freien Port.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { PUBLIC } from "./lade.mjs";

const TYPEN = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml" };

export function starteServer(start = PUBLIC) {
  let wurzel = start; // lässt sich umstellen, damit Tests ein Update auf derselben Adresse nachspielen können
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (p.endsWith("/")) p += "index.html";
      const datei = path.join(wurzel, path.normalize(p).replace(/^(\.\.[/\\])+/, ""));
      if (!datei.startsWith(wurzel) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) { res.writeHead(404); res.end("nicht gefunden"); return; }
      res.writeHead(200, { "Content-Type": TYPEN[path.extname(datei)] || "application/octet-stream", "Cache-Control": "no-cache" });
      fs.createReadStream(datei).pipe(res);
    });
    s.listen(0, "127.0.0.1", () => ok({ url: `http://127.0.0.1:${s.address().port}/`, stop: () => new Promise((r) => s.close(r)), setWurzel: (w) => { wurzel = w; } }));
  });
}

// Browser starten: im CI das von Playwright installierte Chromium, lokal auf Wunsch ein vorhandenes Chrome (CHROME_PATH)
export async function starteBrowser() {
  const { chromium } = await import("playwright");
  return chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
}
