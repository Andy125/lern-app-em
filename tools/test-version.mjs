// Version und Offline-Liste passen zusammen. Aufruf: node tools/test-version.mjs
import fs from "node:fs";
import path from "node:path";
import { PUBLIC, skripteAusIndex, pruefer } from "./lade.mjs";

const { ok, ende } = pruefer("Version");
const ver = fs.readFileSync(path.join(PUBLIC, "version.js"), "utf8");
const sw = fs.readFileSync(path.join(PUBLIC, "sw.js"), "utf8");
const html = fs.readFileSync(path.join(PUBLIC, "index.html"), "utf8");
const n = Number((ver.match(/n:\s*(\d+)/) || [])[1]);
const datum = (ver.match(/date:\s*"([^"]+)"/) || [])[1];
const cache = (sw.match(/const CACHE = "lernnest-v(\d+)"/) || [])[1];
const files = JSON.parse((sw.match(/const FILES = (\[[^\]]+\])/) || [])[1] || "[]");
ok(n > 0, "Versionsnummer gesetzt");
ok(/^\d{4}-\d{2}-\d{2}$/.test(datum || ""), "Versionsdatum gesetzt");
ok(String(n) === cache, `Cache-Name lernnest-v${cache} passt zur Version ${n} (beide zusammen erhöhen)`);
for (const s of skripteAusIndex()) ok(files.includes(s), `${s} steht in sw.js FILES (sonst fehlt es offline)`);
for (const css of [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1])) ok(files.includes(css), `${css} steht in FILES`);
for (const f of files) if (f !== "./") ok(fs.existsSync(path.join(PUBLIC, f)), `${f} aus FILES existiert`);
const inhalte = fs.readdirSync(PUBLIC).filter((f) => /^inhalte-.*\.js$/.test(f));
for (const f of inhalte) ok(skripteAusIndex().includes(f), `${f} ist in index.html eingebunden`);
ok(skripteAusIndex().indexOf("app.js") === skripteAusIndex().length - 1, "app.js wird zuletzt geladen");

// Ältere iPads (iOS 12): keine Emoji, die erst später kamen (sonst leere Kästchen), kein CSS «inset»
const css = fs.readFileSync(path.join(PUBLIC, "style.css"), "utf8");
ok(!/(^|[;{\s])inset\s*:/.test(css), "style.css nutzt kein «inset» (kennt Safari auf älteren iPads nicht)");
for (const f of fs.readdirSync(PUBLIC).filter((x) => x.endsWith(".js"))) {
  const t = fs.readFileSync(path.join(PUBLIC, f), "utf8");
  const neu = [...t].filter((ch) => { const c = ch.codePointAt(0); return (c >= 0x1fa70 && c <= 0x1faff) || (c >= 0x1f7e0 && c <= 0x1f7ef); });
  ok(!neu.length, `${f}: keine neuen Emoji, die ältere iPads nicht zeigen (${neu.join(" ")})`);
}
ende();
