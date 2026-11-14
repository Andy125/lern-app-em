// Lädt die App-Logik und alle Inhaltsdateien in Node, genau in der Reihenfolge aus public/index.html.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PUBLIC = path.join(ROOT, "public");

export function skripteAusIndex() {
  const html = fs.readFileSync(path.join(PUBLIC, "index.html"), "utf8");
  return [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
}

export function ladeLogik() {
  const ctx = { console, Math, Date, JSON, Object, Array, String, Number, Set, Map, isNaN, isFinite };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  const dateien = skripteAusIndex().filter((f) => f === "logic.js" || /^inhalte-.*\.js$/.test(f));
  for (const f of dateien) vm.runInContext(fs.readFileSync(path.join(PUBLIC, f), "utf8"), ctx, { filename: f });
  return { L: ctx.LN, FAECHER: ctx.LN_FAECHER || [], dateien };
}

// Kleiner Prüfer: zählt, sammelt Fehler, beendet mit Code 1 bei Fehlern
export function pruefer(name) {
  let n = 0; const fehler = [];
  const ok = (bed, text) => { n++; if (!bed) { fehler.push(text); if (fehler.length <= 40 || process.env.ALLE_FEHLER) console.log("FAIL " + text); } };
  const ende = () => {
    if (fehler.length) { console.log(`${name}: ${fehler.length} von ${n} Prüfungen fehlgeschlagen`); process.exit(1); }
    console.log(`${name}: alle ${n} Prüfungen bestanden`);
  };
  return { ok, ende };
}
