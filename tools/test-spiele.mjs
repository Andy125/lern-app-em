// Tests der Spiellogik: Regeln der Blöcke und Physik des Runs. Ein Autopilot spielt den Run viele Minuten lang:
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
const { BLOECKE: B, RUN } = ctx.LN_SPIELE;
const { ok, ende } = pruefer("Spiele");

// ---------- Blöcke: Formen ----------
for (const typ of B.TYPEN) {
  const start = B.gedreht(typ, 0).map((p) => p.join()).sort().join("|");
  for (let r = 0; r < 4; r++) {
    const z = B.gedreht(typ, r);
    ok(z.length === 4 && new Set(z.map((p) => p.join())).size === 4, `${typ} Drehung ${r}: vier verschiedene Felder`);
    ok(z.every(([x, y]) => x >= 0 && y >= 0 && x < 4 && y < 4), `${typ} Drehung ${r}: im 4×4-Raster`);
  }
  ok(B.gedreht(typ, 4).map((p) => p.join()).sort().join("|") === start, `${typ}: viermal drehen ergibt die Ausgangsform`);
}
{
  const s = B.neu(3); const gezogen = [s.teil.typ, s.naechste];
  for (let i = 0; i < 12; i++) gezogen.push(B.ziehe(s));
  ok(B.TYPEN.every((t) => gezogen.filter((x) => x === t).length === 2), "7er-Beutel: in 14 Teilen jede Form genau zweimal");
  ok(s.grid.every((r) => r.every((c) => c === null)) && !s.vorbei, "neues Spiel: leeres Feld");
}
{
  const s = B.neu(5);
  for (let i = 0; i < 12; i++) B.bewege(s, -1);
  ok(Math.min(...B.zellen(s.teil).map((p) => p[0])) === 0, "nach links bis an die Wand, nicht weiter");
  for (let i = 0; i < 12; i++) B.bewege(s, 1);
  ok(Math.max(...B.zellen(s.teil).map((p) => p[0])) === 9, "nach rechts bis an die Wand, nicht weiter");
}
{
  // Eine Reihe fertig machen
  const s = B.neu(1);
  s.grid[19] = [null, null, null, null, "x", "x", "x", "x", "x", "x"];
  s.grid[18][7] = "y";
  s.teil = { typ: "I", rot: 0, x: 0, y: 18 };
  const vorher = s.punkte;
  B.fest(s);
  ok(s.linien === 1 && s.punkte - vorher === 100, "volle Reihe: weg, 100 Punkte");
  ok(s.grid[19][7] === "y" && s.grid[19].filter(Boolean).length === 1, "darüber liegende Reihe rutscht nach");
}
{
  const s = B.neu(1);
  for (let y = 16; y < 20; y++) s.grid[y] = ["x", "x", "x", "x", "x", "x", "x", "x", "x", null];
  s.teil = { typ: "I", rot: 1, x: 7, y: 16 };
  ok(B.zellen(s.teil).every(([x]) => x === 9), "I senkrecht in der letzten Spalte");
  B.fest(s);
  ok(s.linien === 4 && s.punkte === 800, "vier Reihen auf einmal: 800 Punkte");
}
{
  const s = B.neu(2); const y0 = s.teil.y; const n = B.ganzRunter(s);
  ok(n > 15 && s.punkte === 2 * n && s.teil.y === (s.teil.typ === "I" ? -1 : 0), "ganz fallen lassen: 2 Punkte pro Reihe, neues Teil oben");
  ok(y0 <= 0, "Teil startet oben");
}
{
  const s = B.neu(4); const y0 = s.teil.y;
  B.tick(s, B.intervall(1));
  ok(s.teil.y === y0 + 1, "nach einem Takt eine Reihe tiefer");
  ok(B.intervall(1) === 800 && B.intervall(5) < B.intervall(2) && B.intervall(30) === 90, "schneller mit jedem Level, nie schneller als 90 ms");
  B.tick(s, B.ZEITLIMIT);
  ok(s.vorbei && s.zeitUm, "nach vier Minuten ist die Runde vorbei");
}
{
  const s = B.neu(6);
  for (let y = 0; y < 3; y++) s.grid[y] = Array(10).fill("x");
  B.spawn(s);
  ok(s.vorbei, "kein Platz mehr oben: Spiel vorbei");
}
// Zufallsspiele: Regeln bleiben immer eingehalten
for (let seed = 1; seed <= 25; seed++) {
  const s = B.neu(seed); let r = seed * 7; let alt = 0; let fehlerFrei = true;
  for (let i = 0; i < 3000 && !s.vorbei; i++) {
    r = (r * 1103515245 + 12345) >>> 0;
    const a = r % 7;
    if (a === 0) B.bewege(s, -1); else if (a === 1) B.bewege(s, 1); else if (a === 2) B.drehe(s); else if (a === 3) B.fallen(s, true); else if (a === 4 && r % 5 === 0) B.ganzRunter(s); else B.tick(s, 120);
    if (!s.vorbei && !B.passt(s, s.teil)) fehlerFrei = false;
    if (s.grid.some((reihe) => reihe.every((c) => c !== null))) fehlerFrei = false;
    if (s.punkte < alt || s.level !== 1 + Math.floor(s.linien / 10)) fehlerFrei = false;
    alt = s.punkte;
  }
  ok(fehlerFrei, `Zufallsspiel ${seed}: Teil passt immer, keine volle Reihe bleibt liegen, Punkte und Level stimmen`);
}

// ---------- Run: Physik ----------
const DT = 1 / 60;
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
