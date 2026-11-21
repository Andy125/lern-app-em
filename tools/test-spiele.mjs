// Tests der Spiellogik: Physik von Sky Jump und Run. Ein Autopilot spielt beide viele Minuten lang:
// Schafft er es, ist jede erzeugte Strecke auch für ein Kind machbar.
// Aufruf: node tools/test-spiele.mjs
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { PUBLIC, pruefer } from "./lade.mjs";

const ctx = { Math, Date, Array, Object, JSON, console };
ctx.window = ctx; ctx.globalThis = ctx; ctx.devicePixelRatio = 1;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(PUBLIC, "spiele.js"), "utf8"), ctx, { filename: "spiele.js" });
const { SPRUNG: SP, RUN } = ctx.LN_SPIELE;
const { ok, ende } = pruefer("Spiele");

const DT = 1 / 60;
// ---------- Sky Jump: Physik ----------
const W = SP.BREITE;
function flug(vy) { const s = SP.neu(1); s.plattformen = []; s.y = 1000; s.kamera = 0; s.vy = vy; let max = s.y, i = 0; s.obenY = 1e9; while (s.vy > 0 && i++ < 400) { SP.schritt(s, 1 / 120, {}); max = Math.max(max, s.y); } return max - 1000; }
{
  const h = flug(SP.V), f = flug(SP.FEDER);
  ok(Math.abs(h - (SP.V * SP.V) / (2 * SP.G)) < 8, `normaler Sprung ca. 224 hoch (${h.toFixed(0)})`);
  ok(f > h * 2, `Feder katapultiert mehr als doppelt so hoch (${f.toFixed(0)})`);
  ok(SP.luecke(0, 1) <= 170 && SP.luecke(1e6, 1) <= 170 && SP.luecke(1e6, 1) < h * 0.8, "größte Lücke bleibt gut unter der Sprunghöhe");
}
function leer(y) { const s = SP.neu(2); s.plattformen = []; s.knochen = []; s.obenY = 1e9; s.x = 180; s.y = y; s.kamera = 0; return s; }
{
  const s = leer(300); s.vy = -10; s.plattformen.push({ x: 140, y: 290, w: 80, typ: "normal", vx: 0 });
  for (let i = 0; i < 20; i++) SP.schritt(s, 1 / 60, {});
  ok(s.vy > 0 && s.spruenge === 1 && s.y > 290, "von oben auf die Wolke: der Hund springt wieder hoch");
  const u = leer(200); u.vy = SP.V; u.plattformen.push({ x: 140, y: 260, w: 80, typ: "normal", vx: 0 });
  for (let i = 0; i < 10; i++) SP.schritt(u, 1 / 60, {});
  ok(u.y > 260 && u.spruenge === 0, "von unten fliegt man durch die Wolke hindurch");
  const b = leer(300); b.vy = -10; b.plattformen.push({ x: 140, y: 290, w: 80, typ: "broeckel", vx: 0 });
  for (let i = 0; i < 20; i++) SP.schritt(b, 1 / 60, {});
  ok(b.vy < 0 && b.y < 290 && b.spruenge === 0, "Bröckel-Wolke trägt nicht");
  const d = leer(300); d.vy = -10; d.plattformen.push({ x: 140, y: 290, w: 80, typ: "normal", vx: 0, feder: true });
  for (let i = 0; i < 20; i++) SP.schritt(d, 1 / 60, {});
  ok(d.vy > SP.V, "Feder gibt mehr Schwung");
  const r = leer(400); r.vy = 0; r.x = W - 5;
  for (let i = 0; i < 15; i++) SP.schritt(r, 1 / 60, { richtung: 1 });
  ok(r.x >= 0 && r.x < 100 && r.vx > 0, "rechts hinaus, links wieder herein");
  const k = leer(400); k.vy = 0; k.knochen.push({ x: 180, y: 380 });
  for (let i = 0; i < 12; i++) SP.schritt(k, 1 / 60, {});
  ok(k.knochenZahl === 1, "Knochen eingesammelt");
  const t = SP.neu(3); for (let i = 0; i < 10; i++) SP.schritt(t, SP.ZEITLIMIT / 1000 / 9, {});
  ok(t.vorbei, "nach der Zeit oder einem Absturz ist die Runde vorbei");
  const z = SP.neu(4); z.t = SP.ZEITLIMIT / 1000 - 0.001; z.vy = SP.V; SP.schritt(z, 0.01, {});
  ok(z.vorbei && z.zeitUm, "nach drei Minuten: Zeit um");
  const f = SP.neu(5); f.plattformen = []; f.kamera = 500; f.y = 520; f.vy = -400; f.obenY = 1e9;
  for (let i = 0; i < 40 && !f.vorbei; i++) SP.schritt(f, 1 / 60, {});
  ok(f.vorbei && f.grund === "absturz", "unten aus dem Bild gefallen: vorbei");
}
// ---------- Sky Jump: jede Strecke ist schaffbar (Autopilot) ----------
// Er zielt auf eine tragende Wolke, die er noch erreicht, bevor er an ihr vorbeifällt (am liebsten die höchste),
// und lenkt am Rand auch hinüber. So würde auch ein Kind spielen.
function zielWolke(s) {
  const G = SP.G, scheitel = s.y + (s.vy > 0 ? (s.vy * s.vy) / (2 * G) : 0), tod = s.kamera - 45;
  let best = null, bestWert = -1e9;
  for (const p of s.plattformen) {
    if (p.typ === "broeckel" || p.kaputt || p.y <= tod || p.y >= (s.vy > 0 ? scheitel - 40 : s.y)) continue;
    if (p.typ === "boden" && s.kamera > 0) continue;
    const zeit = (s.vy + Math.sqrt(Math.max(0, s.vy * s.vy + 2 * G * (s.y - p.y)))) / G;
    const weg = Math.max(0, Math.abs(SP.abstandX(p.x + p.w / 2, s.x)) - p.w / 2 + 4);
    const luft = SP.TEMPO * zeit - weg - Math.abs(p.vx) * zeit;
    if (luft < 15) continue;
    // lieber nach oben als zurück, und beim einmal gewählten Ziel bleiben
    const wert = p.y + Math.min(luft, 60) + (p.y > (s.zuletzt ? s.zuletzt.y : 0) ? 5000 : 0) + (p === s.pilotZiel ? 1000 : 0);
    if (wert > bestWert) { bestWert = wert; best = p; }
  }
  s.pilotZiel = best;
  return best;
}
function sprungPilot(s) {
  const z = zielWolke(s); if (!z) return { richtung: 0 };
  const dx = SP.abstandX(z.x + z.w / 2, s.x);
  return { richtung: Math.abs(dx) < 6 ? 0 : dx > 0 ? 1 : -1 };
}
let hoechst = 0, wandernd = 0, broeckel = 0, federn = 0, minHoehe = 1e9;
for (let seed = 1; seed <= 30; seed++) {
  const s = SP.neu(seed); let t = 0, letzte = s.plattformen[0]; const gesehen = new Set();
  while (t < 170 && !s.vorbei) {
    SP.schritt(s, DT, sprungPilot(s)); t += DT;
    for (const p of s.plattformen) if (!gesehen.has(p)) {
      gesehen.add(p);
      if (p.typ === "wandert") wandernd++; if (p.typ === "broeckel") broeckel++; if (p.feder) federn++;
      if (p.weg && p !== letzte && p.typ !== "boden") {
        ok(p.y - letzte.y <= 170 + 1e-9 && p.y > letzte.y, `Seed ${seed}: Lücke auf dem Weg höchstens 170 (${(p.y - letzte.y).toFixed(0)})`);
        if (letzte.typ !== "boden") ok(Math.abs(p.mitte - letzte.mitte) + (p.typ === "wandert" ? SP.SPANNE : 0) + (letzte.typ === "wandert" ? SP.SPANNE : 0) <= 200, `Seed ${seed}: seitlich erreichbar, auch wenn die Wolken wandern`);
        letzte = p;
      }
    }
  }
  ok(!s.vorbei, `Seed ${seed}: Autopilot schafft 170 Sekunden (${s.grund} nach ${t.toFixed(1)} s in ${Math.floor(s.maxY / 10)} m)`);
  hoechst = Math.max(hoechst, s.maxY); minHoehe = Math.min(minHoehe, s.maxY);
}
ok(minHoehe > 15000, `es geht hoch hinaus, bis in die schwerste Stufe (mind. ${Math.floor(minHoehe / 10)} m)`);
ok(wandernd > 100 && broeckel > 100 && federn > 20, `alle Wolkenarten kommen vor (${wandernd} wandernd, ${broeckel} Bröckel, ${federn} Federn)`);

// ---------- Run: Physik ----------
function hoechsterSprung(halten, doppel) {
  const s = RUN.neu(1); s.naechst = 1e9; let min = s.fuss, i = 0;
  RUN.schritt(s, DT, { druck: true, halten });
  while (!s.amBoden && i++ < 400) { RUN.schritt(s, DT, { halten, druck: doppel && i === 20 }); min = Math.min(min, s.fuss); }
  return { hoehe: RUN.BODEN - min, gelandet: s.amBoden, dauer: i * DT };
}
{
  const a = hoechsterSprung(false, false), b = hoechsterSprung(true, false), c = hoechsterSprung(false, true);
  ok(Math.abs(a.hoehe - (RUN.SPRUNG * RUN.SPRUNG) / (2 * RUN.G)) < 8 && a.gelandet, `normaler Sprung ca. 125 hoch (${a.hoehe.toFixed(0)}) und landet wieder`);
  ok(b.hoehe > a.hoehe + 10, `Finger liegen lassen springt höher (${b.hoehe.toFixed(0)})`);
  ok(c.hoehe > a.hoehe + 30, `Doppelsprung noch höher (${c.hoehe.toFixed(0)})`);
  ok(a.hoehe > 34 + RUN.H * 0 + 30, "Sprung reicht über jedes Hindernis");
}
{
  const s = RUN.neu(1); s.naechst = 1e9;
  s.plattformen.push({ x: RUN.X - 60, y: RUN.PLATTFORM_Y, w: 400 });
  for (let i = 0; i < 30; i++) RUN.schritt(s, DT, {});
  ok(s.amBoden && s.fuss === RUN.BODEN && !s.vorbei, "unter einer Plattform durchlaufen geht");
  RUN.schritt(s, DT, { druck: true, halten: true });
  let i = 0; while (!(s.amBoden) && i++ < 200) RUN.schritt(s, DT, { halten: true });
  ok(s.amBoden && s.fuss === RUN.PLATTFORM_Y && s.auf, "Sprung auf die Plattform: man landet oben");
  i = 0; while (s.auf && i++ < 400) RUN.schritt(s, DT, {});
  i = 0; while (!s.amBoden && i++ < 200) RUN.schritt(s, DT, {});
  ok(s.amBoden && s.fuss === RUN.BODEN && !s.vorbei, "am Ende der Plattform fällt man zurück auf den Boden");
}
{
  const s = RUN.neu(1); s.naechst = 1e9;
  s.gruben.push({ x: RUN.X - 20, w: 200 });
  for (let i = 0; i < 120 && !s.vorbei; i++) RUN.schritt(s, DT, {});
  ok(s.vorbei && s.grund === "grube", "über einer Grube ohne Sprung: hineingefallen");
}
{
  const s = RUN.neu(1); s.naechst = 1e9;
  s.hindernisse.push({ x: RUN.X + 60, w: 22, h: 30, typ: "kiste" });
  for (let i = 0; i < 60 && !s.vorbei; i++) RUN.schritt(s, DT, {});
  ok(s.vorbei && s.grund === "hindernis", "gegen ein Hindernis gelaufen: vorbei");
}
{
  const s = RUN.neu(1); s.naechst = 1e9;
  s.knochen.push({ x: RUN.X + 60, y: RUN.BODEN - 18 });
  for (let i = 0; i < 40; i++) RUN.schritt(s, DT, {});
  ok(s.knochenZahl === 1 && s.punkte === Math.floor(s.strecke / 10) + 10, "Knochen eingesammelt: 10 Punkte extra");
}

// ---------- Run: jede Strecke ist schaffbar (Autopilot) ----------
function autopilot(s) {
  if (!s.amBoden) return {};
  const vorn = RUN.X + RUN.W;
  for (const o of s.hindernisse) { const d = o.x - vorn; if (d > -6 && d < s.v * 0.07 + 10) return { druck: true, halten: false }; }
  for (const g of s.gruben) { const d = g.x - vorn; if (d > -30 && d < s.v * 0.025 + 4) return { druck: true, halten: true }; }
  return {};
}
let gesamt = 0, maxV = 0, gruben = 0, hind = 0;
for (let seed = 1; seed <= 30; seed++) {
  const s = RUN.neu(seed); let t = 0; const gesehen = new Set();
  while (t < 150 && !s.vorbei) {
    RUN.schritt(s, DT, autopilot(s)); t += DT;
    for (const g of s.gruben) if (!gesehen.has(g)) { gesehen.add(g); gruben++; ok(g.w <= 112, `Seed ${seed}: Grube nicht zu breit (${g.w})`); }
    for (const o of s.hindernisse) if (!gesehen.has(o)) { gesehen.add(o); hind++; ok(o.h <= 34, `Seed ${seed}: Hindernis nicht zu hoch`); }
  }
  ok(!s.vorbei, `Seed ${seed}: Autopilot schafft 150 Sekunden (gestorben an «${s.grund}» nach ${t.toFixed(1)} s)`);
  gesamt += s.punkte; maxV = Math.max(maxV, s.v);
}
ok(maxV === RUN.VMAX, `Tempo steigt bis zum Höchstwert (${maxV})`);
ok(gruben > 100 && hind > 200, `genug Gruben (${gruben}) und Hindernisse (${hind}) getestet`);

ende();
