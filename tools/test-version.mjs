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
ende();
