// Spielhalle: zwei kleine Spiele als Belohnung. Oben die reine Spiellogik (läuft auch in Node, siehe
// tools/test-spiele.mjs), unten das Zeichnen auf Canvas und die Steuerung fürs iPad.
// «Sky Jump»: der Hund springt von Wolke zu Wolke nach oben. «Run»: der eigene Hund rennt, springt und sammelt Knochen.
(function (root) {
  "use strict";

  function zufall(seed) {
    let s = seed >>> 0 || 1;
    return function () { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // ================= Sky Jump =================
  // Der Hund springt von selbst, sobald er auf einer Wolke landet. Links und rechts lenkt man. Wer aus dem Bild fällt,
  // ist raus. Weltkoordinaten: y wächst nach oben, die Kamera folgt nach oben, nie nach unten. Am Rand geht es auf der
  // anderen Seite weiter. Jede neue Wolke auf dem Weg ist von der vorigen aus erreichbar (test-spiele.mjs prüft das).
  const SPRUNG = {
    BREITE: 360, HOEHE: 540, G: 1500, V: 820, FEDER: 1250, TEMPO: 300, BESCHL: 2600, BREMSE: 2000, ZEITLIMIT: 3 * 60 * 1000,
    HUND_B: 30, // halbe Breite der Pfoten zum Landen (etwas großzügig)
    SPANNE: 55, // so weit pendelt eine wandernde Wolke höchstens von ihrer Mitte weg
    // Höchste Sprunghöhe: V² / 2G = 224. Die Lücke auf dem Weg ist höchstens 170.
    schwer(h) { return Math.min(1, h / 15000); },
    neu(seed) {
      const s = { rng: zufall(seed), t: 0, x: SPRUNG.BREITE / 2, y: 0, vx: 0, vy: SPRUNG.V, blick: 1, kamera: 0, maxY: 0,
        plattformen: [{ x: 0, y: 0, w: SPRUNG.BREITE, typ: "boden", vx: 0, weg: true }], knochen: [], knochenZahl: 0, spruenge: 0,
        punkte: 0, vorbei: false, zeitUm: false, grund: "", obenY: 0 };
      s.letzte = s.plattformen[0];
      SPRUNG.erzeuge(s);
      return s;
    },
    luecke(h, r) { const k = SPRUNG.schwer(h); const von = 46 + 44 * k, bis = 96 + 74 * k; return von + r * (bis - von); },
    // Flugzeit vom Absprung bis man beim Fallen wieder auf Höhe dy ist
    flugzeit(dy) { const V = SPRUNG.V, G = SPRUNG.G; return (V + Math.sqrt(Math.max(0, V * V - 2 * G * dy))) / G; },
    erzeuge(s) {
      const W = SPRUNG.BREITE;
      while (s.obenY < s.kamera + SPRUNG.HOEHE + 320) {
        const h = s.obenY, k = SPRUNG.schwer(h);
        const dy = SPRUNG.luecke(h, s.rng());
        const w = Math.round(80 - 22 * k);
        // Wandernde Wolken pendeln nur um ihre Mitte, damit der Weg erreichbar bleibt
        const wandert = h > 1500 && s.rng() < 0.4 * k + 0.05, spanne = SPRUNG.SPANNE;
        const dxMax = Math.max(16, Math.min(200, SPRUNG.TEMPO * (SPRUNG.flugzeit(dy) - 0.15) * 0.7) - (s.letzte.typ === "wandert" ? spanne : 0) - (wandert ? spanne : 0));
        const vorher = s.letzte.typ === "boden" ? W / 2 : s.letzte.mitte != null ? s.letzte.mitte : s.letzte.x + s.letzte.w / 2;
        const c = Math.max(w / 2, Math.min(W - w / 2, vorher + (s.rng() * 2 - 1) * dxMax));
        const p = { x: c - w / 2, y: h + dy, w, mitte: c, typ: wandert ? "wandert" : "normal", vx: wandert ? (35 + 75 * k) * (s.rng() < 0.5 ? -1 : 1) : 0, feder: !wandert && h > 600 && s.rng() < 0.07, weg: true };
        s.plattformen.push(p);
        // Bröckel-Wolken als Falle, nie auf dem Weg
        if (h > 900 && s.rng() < 0.2 + 0.35 * k) {
          const bw = 66, by = h + dy * (0.35 + 0.3 * s.rng()), bx = s.rng() * (W - bw);
          if (Math.abs(bx + bw / 2 - c) > 70) s.plattformen.push({ x: bx, y: by, w: bw, typ: "broeckel", vx: 0 });
        }
        if (s.rng() < 0.32) s.knochen.push({ x: c + (s.rng() * 2 - 1) * 40, y: h + dy + 50 + s.rng() * 70 });
        s.letzte = p; s.obenY = h + dy;
      }
    },
    abstandX(a, b) { const W = SPRUNG.BREITE; let d = (a - b) % W; if (d > W / 2) d -= W; if (d < -W / 2) d += W; return d; },
    aufPlattform(s, p) { return Math.abs(SPRUNG.abstandX(s.x, p.x + p.w / 2)) <= p.w / 2 + SPRUNG.HUND_B - 12; },
    // ein Schritt; eingabe: { richtung: -1, 0 oder 1 }
    schritt(s, dt, eingabe) {
      if (s.vorbei) return;
      const W = SPRUNG.BREITE, richtung = (eingabe && eingabe.richtung) || 0;
      s.t += dt;
      if (s.t * 1000 >= SPRUNG.ZEITLIMIT) { s.vorbei = true; s.zeitUm = true; s.grund = "zeit"; return; }
      // lenken mit etwas Schwung
      if (richtung) { const ziel = richtung * SPRUNG.TEMPO; s.vx += Math.max(-SPRUNG.BESCHL * dt, Math.min(SPRUNG.BESCHL * dt, ziel - s.vx)); s.blick = richtung; }
      else s.vx -= Math.sign(s.vx) * Math.min(Math.abs(s.vx), SPRUNG.BREMSE * dt);
      s.x = ((s.x + s.vx * dt) % W + W) % W;
      for (const p of s.plattformen) if (p.typ === "wandert") {
        p.x += p.vx * dt;
        const links = Math.max(0, p.mitte - SPRUNG.SPANNE - p.w / 2), rechts = Math.min(W - p.w, p.mitte + SPRUNG.SPANNE - p.w / 2);
        if (p.x < links) { p.x = links; p.vx = Math.abs(p.vx); } if (p.x > rechts) { p.x = rechts; p.vx = -Math.abs(p.vx); }
      }
      const y0 = s.y;
      s.vy -= SPRUNG.G * dt; s.y += s.vy * dt;
      if (s.vy < 0) for (const p of s.plattformen) {
        if (p.kaputt || y0 < p.y || s.y > p.y || !SPRUNG.aufPlattform(s, p)) continue;
        if (p.typ === "broeckel") { p.kaputt = true; continue; }
        s.y = p.y; s.vy = p.feder ? SPRUNG.FEDER : SPRUNG.V; s.spruenge++; s.zuletzt = p; p.getroffen = s.t;
        break;
      }
      for (const k of s.knochen) if (!k.weg && Math.abs(SPRUNG.abstandX(s.x, k.x)) < 30 && k.y > s.y - 6 && k.y < s.y + 46) { k.weg = true; s.knochenZahl++; }
      s.maxY = Math.max(s.maxY, s.y);
      s.kamera = Math.max(s.kamera, s.y - SPRUNG.HOEHE * 0.42);
      if (s.y < s.kamera - 50) { s.vorbei = true; s.grund = "absturz"; }
      s.plattformen = s.plattformen.filter((p) => p.y > s.kamera - 80 && !(p.kaputt && p.y < s.kamera + 40));
      s.knochen = s.knochen.filter((k) => !k.weg && k.y > s.kamera - 40);
      SPRUNG.erzeuge(s);
      s.punkte = Math.floor(s.maxY / 10) + s.knochenZahl * 10;
    },
  };

  // ================= Turbo Kart =================
  // Rennen gegen drei Computer-Fahrer, drei Runden. Gas gibt der Kart von selbst, man lenkt links und rechts.
  // Fragezeichen-Kisten geben Turbo oder eine Matschpfütze, Knochen machen ein bisschen schneller, auf dem Gras
  // wird man langsam. Welt: 1024 x 1024, y nach unten, Winkel im Uhrzeigersinn. Fortschritt wird an der Mittellinie
  // gemessen (Abschneiden über das Gras zählt nicht), test-spiele.mjs fährt alles mit einem Autopiloten ab.
  const KART = {
    BREITE: 480, HOEHE: 270, WELT: 1024, HALB: 46, RUNDEN: 3, N: 600, VMAX: 230, ZEITLIMIT: 3 * 60 * 1000,
    PUNKTE: [{ x: 170, y: 860 }, { x: 120, y: 640 }, { x: 170, y: 430 }, { x: 300, y: 270 }, { x: 460, y: 215 }, { x: 590, y: 265 }, { x: 625, y: 380 }, { x: 600, y: 470 }, { x: 650, y: 570 }, { x: 730, y: 615 }, { x: 795, y: 560 }, { x: 800, y: 420 }, { x: 740, y: 290 }, { x: 770, y: 160 }, { x: 850, y: 110 }, { x: 920, y: 150 }, { x: 945, y: 300 }, { x: 940, y: 470 }, { x: 930, y: 640 }, { x: 880, y: 800 }, { x: 760, y: 900 }, { x: 560, y: 920 }, { x: 330, y: 920 }],
    GEGNER: [{ name: "Katze", tier: "katze", farbe: "#ff5fa2", tempo: 0.8 }, { name: "Fuchs", tier: "fuchs", farbe: "#f2773a", tempo: 0.77 }, { name: "Hase", tier: "hase", farbe: "#5aa9ff", tempo: 0.74 }],
    strecke: null,
    // Mittellinie: Catmull-Rom durch die Punkte, dann in gleich lange Stücke geteilt
    baueStrecke() {
      if (KART.strecke) return KART.strecke;
      const P = KART.PUNKTE, roh = [];
      for (let i = 0; i < P.length; i++) {
        const p0 = P[(i - 1 + P.length) % P.length], p1 = P[i], p2 = P[(i + 1) % P.length], p3 = P[(i + 2) % P.length];
        for (let k = 0; k < 40; k++) {
          const t = k / 40, t2 = t * t, t3 = t2 * t;
          roh.push([0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
            0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)]);
        }
      }
      const lang = [0]; for (let i = 1; i <= roh.length; i++) { const a = roh[i - 1], b = roh[i % roh.length]; lang.push(lang[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
      const gesamt = lang[roh.length], pts = [];
      let j = 0;
      for (let i = 0; i < KART.N; i++) {
        const ziel = (i / KART.N) * gesamt; while (lang[j + 1] < ziel) j++;
        const a = roh[j], b = roh[(j + 1) % roh.length], f = (ziel - lang[j]) / (lang[j + 1] - lang[j]);
        pts.push({ x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f });
      }
      for (let i = 0; i < KART.N; i++) { const a = pts[(i - 1 + KART.N) % KART.N], b = pts[(i + 1) % KART.N]; pts[i].w = Math.atan2(b.y - a.y, b.x - a.x); }
      KART.strecke = { pts, laenge: gesamt, turbo: [150, 430], kisten: [90, 330, 520], knochen: [40, 200, 270, 380, 470, 560] };
      return KART.strecke;
    },
    // nächster Punkt der Mittellinie in einem Fenster um den letzten bekannten
    naechster(pts, x, y, start, vor, zurueck) {
      let best = start, bd = Infinity;
      for (let k = -zurueck; k <= vor; k++) { const i = (start + k + KART.N) % KART.N, p = pts[i], d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y); if (d < bd) { bd = d; best = i; } }
      return { i: best, d: Math.sqrt(bd) };
    },
    // siege: bisher gewonnene Rennen, die anderen werden damit schneller (bis Sieg 8 jeweils 2,5 %)
    neu(seed, siege) {
      const S = KART.baueStrecke(), rng = zufall(seed), pts = S.pts, extra = 1 + 0.025 * Math.min(8, siege || 0);
      const fahrer = [];
      const startplatz = (reihe, seite) => { const i = (KART.N - 6 - reihe * 9) % KART.N, p = pts[i], n = [-Math.sin(p.w), Math.cos(p.w)]; return { x: p.x + n[0] * seite * 16, y: p.y + n[1] * seite * 16, w: p.w, idx: i }; };
      const plaetze = [startplatz(0, -1), startplatz(1, 1), startplatz(2, -1), startplatz(3, 1)];
      const reihenfolge = [0, 1, 3, 2]; // Spieler startet als Dritter
      KART.GEGNER.concat([{ name: "Du", spieler: true }]).forEach((g, k) => {
        const pl = plaetze[reihenfolge[k]];
        fahrer.push({ name: g.name, tier: g.tier || "hund", farbe: g.farbe || "#7b6cff", tempo: g.spieler ? 1 : g.tempo * extra, spieler: !!g.spieler,
          x: pl.x, y: pl.y, w: pl.w, v: 0, lenk: 0, idx: pl.idx, fs: pl.idx - KART.N, runde: 0, ziel: null, knochen: 0, item: null,
          turbo: 0, schleudern: 0, gras: 0, bahn: (rng() * 2 - 1) * 14, wackel: rng() * 6.28, zurueck: 0 });
      });
      const kisten = [];
      for (const i of S.kisten) for (const seite of [-22, 0, 22]) { const p = pts[i], n = [-Math.sin(p.w), Math.cos(p.w)]; kisten.push({ x: p.x + n[0] * seite, y: p.y + n[1] * seite, weg: 0 }); }
      const knochen = [];
      for (const i of S.knochen) for (let k = 0; k < 4; k++) { const p = pts[(i + k * 4) % KART.N], n = [-Math.sin(p.w), Math.cos(p.w)], seite = Math.sin(i) * 18; knochen.push({ x: p.x + n[0] * seite, y: p.y + n[1] * seite, weg: 0 }); }
      return { rng, t: -3, fahrer, spieler: fahrer[fahrer.length - 1], kisten, knochen, pfuetzen: [], punkte: 0, vorbei: false, zeitUm: false, grund: "", platz: 4, zielZeit: 0, knochenZahl: 0, meldung: "", meldungBis: 0 };
    },
    // Ziel für Computer und Autopilot: ein Stück voraus auf der eigenen Spur
    zielPunkt(f, voraus) {
      const S = KART.strecke, p = S.pts[(f.idx + voraus) % KART.N], n = [-Math.sin(p.w), Math.cos(p.w)];
      return { x: p.x + n[0] * f.bahn, y: p.y + n[1] * f.bahn };
    },
    lenkNach(f, z) {
      let d = Math.atan2(z.y - f.y, z.x - f.x) - f.w;
      while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      return Math.max(-1, Math.min(1, d * 2.6));
    },
    platzVon(s, f) { return 1 + s.fahrer.filter((x) => x !== f && (x.ziel != null && (f.ziel == null || x.ziel < f.ziel) || (x.ziel == null && f.ziel == null && x.fs > f.fs))).length; },
    benutzeItem(s, f) {
      if (!f.item) return;
      if (f.item === "turbo") f.turbo = 1.3;
      else s.pfuetzen.push({ x: f.x - Math.cos(f.w) * 22, y: f.y - Math.sin(f.w) * 22, t: s.t, von: f });
      f.item = null;
    },
    // ein Schritt; eingabe: { richtung, item }
    schritt(s, dt, eingabe) {
      if (s.vorbei) return;
      const S = KART.strecke, pts = S.pts;
      s.t += dt;
      if (s.t * 1000 >= KART.ZEITLIMIT) { s.vorbei = true; s.zeitUm = true; s.grund = "zeit"; KART.wertung(s); return; }
      if (s.t < 0) return; // Countdown
      const sp = s.spieler;
      for (const f of s.fahrer) {
        if (f.ziel != null) { f.v *= 0.97; f.x += Math.cos(f.w) * f.v * dt; f.y += Math.sin(f.w) * f.v * dt; continue; }
        // Lenken
        let lenk = 0;
        if (f.spieler) { lenk = (eingabe && eingabe.richtung) || 0; if (eingabe && eingabe.item) { KART.benutzeItem(s, f); eingabe.item = false; } }
        else {
          f.wackel += dt * 0.7; f.bahn = Math.sin(f.wackel) * 16;
          lenk = KART.lenkNach(f, KART.zielPunkt(f, 9 + Math.floor(f.v / 45)));
          if (f.item && s.rng() < dt * 0.5) KART.benutzeItem(s, f);
        }
        f.lenk += (lenk - f.lenk) * Math.min(1, dt * 10);
        if (f.schleudern > 0) { f.schleudern -= dt; f.w += dt * 9; f.v *= Math.pow(0.4, dt); }
        else f.w += f.lenk * 3 * Math.min(1, f.v / 110) * dt;
        // Lenkhilfe: ohne Lenken dreht sich der eigene Kart sanft in Fahrtrichtung der Strecke
        if (f.spieler && !lenk && !f.schleudern) { let d = pts[(f.idx + 6) % KART.N].w - f.w; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; f.w += d * Math.min(1, dt * 1.5); }
        // Tempo
        const nah = KART.naechster(pts, f.x, f.y, f.idx, 40, 25);
        const gras = nah.d > KART.HALB;
        f.gras = gras ? f.gras + dt : 0;
        let vz = KART.VMAX * f.tempo * (1 + Math.min(10, f.knochen) * 0.012);
        if (!f.spieler) { const abstand = (f.fs - sp.fs) / KART.N; if (abstand > 0.3) vz *= 0.9; else if (abstand < -0.3) vz *= 1.07; }
        if (gras) vz *= 0.45;
        if (f.turbo > 0) { f.turbo -= dt; vz = Math.max(vz, KART.VMAX * 1.45); }
        if (!gras && S.turbo.some((i) => { const d = (nah.i - i + KART.N) % KART.N; return d < 6; })) f.turbo = Math.max(f.turbo, 0.7);
        f.v += (vz - f.v) * Math.min(1, dt * 1.4);
        f.x += Math.cos(f.w) * f.v * dt; f.y += Math.sin(f.w) * f.v * dt;
        f.x = Math.max(12, Math.min(KART.WELT - 12, f.x)); f.y = Math.max(12, Math.min(KART.WELT - 12, f.y));
        // Fortschritt an der Mittellinie
        const neu = KART.naechster(pts, f.x, f.y, f.idx, 40, 25);
        let d = neu.i - f.idx; if (d > KART.N / 2) d -= KART.N; if (d < -KART.N / 2) d += KART.N;
        f.idx = neu.i; f.fs += d;
        f.runde = Math.max(f.runde, Math.floor(f.fs / KART.N) + 1);
        // Zu weit weg oder zu lange im Gras: zurück auf die Strecke
        if (neu.d > 120 || f.gras > 4) { const p = pts[f.idx]; f.x = p.x; f.y = p.y; f.w = p.w; f.v = 0; f.gras = 0; f.zurueck = 1.2; if (f.spieler) { s.meldung = "Zurück auf die Strecke"; s.meldungBis = s.t + 1.5; } }
        if (f.zurueck > 0) f.zurueck -= dt;
        if (f.fs >= KART.RUNDEN * KART.N && f.ziel == null) { f.ziel = s.t; if (f.spieler) { s.zielZeit = s.t; KART.wertung(s); s.vorbei = true; s.grund = "ziel"; } }
        // Kisten, Knochen, Pfützen
        for (const k of s.kisten) if (k.weg <= s.t && Math.hypot(k.x - f.x, k.y - f.y) < 14) { k.weg = s.t + 3; if (!f.item) { f.item = s.rng() < 0.6 ? "turbo" : "pfuetze"; if (f.spieler) { s.meldung = f.item === "turbo" ? "Turbo!" : "Matschpfütze!"; s.meldungBis = s.t + 1.2; } } }
        for (const k of s.knochen) if (k.weg <= s.t && Math.hypot(k.x - f.x, k.y - f.y) < 13) { k.weg = s.t + 8; f.knochen = Math.min(10, f.knochen + 1); if (f.spieler) s.knochenZahl++; }
        for (const p of s.pfuetzen) if (!p.weg && (p.von !== f || s.t - p.t > 1) && Math.hypot(p.x - f.x, p.y - f.y) < 14) { p.weg = true; f.schleudern = 0.8; f.knochen = Math.max(0, f.knochen - 3); if (f.spieler) { s.meldung = "Platsch!"; s.meldungBis = s.t + 1.2; } }
      }
      s.pfuetzen = s.pfuetzen.filter((p) => !p.weg && s.t - p.t < 25);
      // Zusammenstöße: auseinanderschieben
      for (let a = 0; a < s.fahrer.length; a++) for (let b = a + 1; b < s.fahrer.length; b++) {
        const A = s.fahrer[a], B = s.fahrer[b], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy);
        if (d > 0 && d < 15) { const k = (15 - d) / 2 / d; A.x -= dx * k; A.y -= dy * k; B.x += dx * k; B.y += dy * k; A.v *= 0.985; B.v *= 0.985; }
      }
      if (!s.vorbei) { s.platz = KART.platzVon(s, sp); s.punkte = KART.punkteFuer(s); }
    },
    punkteFuer(s) { return [1000, 700, 500, 300][s.platz - 1] * (s.vorbei || s.spieler.ziel != null ? 1 : 0) + s.knochenZahl * 10 + Math.max(0, Math.floor(s.spieler.fs / 10)); },
    wertung(s) { s.platz = KART.platzVon(s, s.spieler); s.punkte = [1000, 700, 500, 300][s.platz - 1] + s.knochenZahl * 10 + Math.max(0, Math.floor(s.spieler.fs / 10)) + (s.zielZeit ? Math.max(0, Math.round(180 - s.zielZeit) * 5) : 0); },
  };

  // ================= Run =================
  const RUN = {
    BREITE: 640, HOEHE: 300, BODEN: 250, X: 90, W: 46, H: 36,
    G: 2300, SPRUNG: -760, DOPPEL: -640, HALTEN: 0.2, HALTEFAKTOR: 0.5,
    V0: 250, VMAX: 590, BESCHL: 6,
    PLATTFORM_Y: 170,
    neu(seed) {
      const s = { rng: zufall(seed), t: 0, strecke: 0, v: RUN.V0, fuss: RUN.BODEN, vy: 0, amBoden: true, auf: null, spruenge: 0, haltZeit: 0, faellt: false,
        hindernisse: [], gruben: [], plattformen: [], knochen: [], knochenZahl: 0, punkte: 0, vorbei: false, grund: "", naechst: 380 };
      return s;
    },
    abstand(s, laenge) { return laenge + s.v * 0.85 + 110 + s.rng() * s.v * 0.7; },
    // ein neues Stück Strecke rechts außerhalb des Bildes
    erzeuge(s) {
      const x0 = RUN.BREITE + 30, r = s.rng();
      let laenge = 0;
      if (s.t < 4 || r < 0.32) {
        const typ = ["hydrant", "huetchen", "kiste"][Math.floor(s.rng() * 3)];
        const h = typ === "hydrant" ? 34 : typ === "huetchen" ? 28 : 30, w = typ === "kiste" ? 30 : 22;
        s.hindernisse.push({ x: x0, w, h, typ }); laenge = w;
      } else if (r < 0.48) {
        s.hindernisse.push({ x: x0, w: 22, h: 28, typ: "huetchen" }, { x: x0 + 34, w: 22, h: 28, typ: "huetchen" }); laenge = 56;
      } else if (r < 0.68) {
        const w = Math.round(Math.min(112, Math.max(56, s.v * 0.66 * 0.42)));
        s.gruben.push({ x: x0, w });
        for (let i = 0; i < 3; i++) s.knochen.push({ x: x0 + w / 2 - 22 + i * 22, y: RUN.BODEN - 95 - (i === 1 ? 14 : 0) });
        laenge = w;
      } else if (r < 0.86) {
        const w = 140 + Math.round(s.rng() * 60);
        s.plattformen.push({ x: x0, y: RUN.PLATTFORM_Y, w });
        for (let i = 0; i < 4; i++) s.knochen.push({ x: x0 + 20 + i * ((w - 40) / 3), y: RUN.PLATTFORM_Y - 26 });
        laenge = w;
      } else {
        for (let i = 0; i < 5; i++) s.knochen.push({ x: x0 + i * 26, y: RUN.BODEN - 30 - Math.sin((i / 4) * Math.PI) * 50 });
        laenge = 110;
      }
      s.naechst = RUN.abstand(s, laenge);
    },
    ueberGrube(s) {
      const a = RUN.X + 10, b = RUN.X + RUN.W - 10;
      return s.gruben.some((g) => a >= g.x && b <= g.x + g.w);
    },
    aufPlattform(s, p) { return RUN.X + RUN.W - 8 > p.x && RUN.X + 8 < p.x + p.w; },
    // ein Schritt Spielzeit; eingabe: { druck: diesen Moment getippt, halten: Finger liegt noch auf }
    schritt(s, dt, eingabe) {
      if (s.vorbei) return;
      eingabe = eingabe || {};
      s.t += dt; s.v = Math.min(RUN.VMAX, RUN.V0 + RUN.BESCHL * s.t);
      const dx = s.v * dt; s.strecke += dx;
      for (const liste of [s.hindernisse, s.gruben, s.plattformen, s.knochen]) for (const o of liste) o.x -= dx;
      s.hindernisse = s.hindernisse.filter((o) => o.x + o.w > -40);
      s.gruben = s.gruben.filter((o) => o.x + o.w > -40);
      s.plattformen = s.plattformen.filter((o) => o.x + o.w > -40);
      s.knochen = s.knochen.filter((o) => o.x > -40 && !o.weg);
      s.naechst -= dx; if (s.naechst <= 0) RUN.erzeuge(s);
      // Springen: am Boden ein Sprung, in der Luft einmal ein Doppelsprung
      if (eingabe.druck && !s.faellt) {
        if (s.amBoden) { s.vy = RUN.SPRUNG; s.amBoden = false; s.auf = null; s.spruenge = 1; s.haltZeit = 0; }
        else if (s.spruenge < 2) { s.vy = RUN.DOPPEL; s.spruenge = 2; s.haltZeit = 0; }
      }
      // Kante: ohne Untergrund fällt man
      if (s.amBoden) {
        if (s.auf && !RUN.aufPlattform(s, s.auf)) { s.amBoden = false; s.auf = null; s.spruenge = 1; }
        else if (!s.auf && RUN.ueberGrube(s)) { s.amBoden = false; s.faellt = true; }
      }
      if (!s.amBoden) {
        let g = RUN.G;
        if (eingabe.halten && s.vy < 0 && s.haltZeit < RUN.HALTEN) { g *= RUN.HALTEFAKTOR; s.haltZeit += dt; }
        s.vy += g * dt;
        const neu = s.fuss + s.vy * dt;
        let gelandet = false;
        if (s.vy >= 0 && !s.faellt) {
          for (const p of s.plattformen) if (s.fuss <= p.y + 1 && neu >= p.y && RUN.aufPlattform(s, p)) { s.fuss = p.y; s.vy = 0; s.amBoden = true; s.auf = p; s.spruenge = 0; gelandet = true; break; }
          if (!gelandet && neu >= RUN.BODEN && s.fuss <= RUN.BODEN + 1) {
            if (RUN.ueberGrube(s)) s.faellt = true;
            else { s.fuss = RUN.BODEN; s.vy = 0; s.amBoden = true; s.auf = null; s.spruenge = 0; gelandet = true; }
          }
        }
        if (!gelandet) s.fuss = neu;
        if (s.fuss > RUN.HOEHE + 60) { s.vorbei = true; s.grund = "grube"; }
      }
      // Zusammenstoß mit Hindernissen (etwas nachsichtig: Ränder zählen nicht)
      const ax = RUN.X + 7, bx = RUN.X + RUN.W - 7, oy = s.fuss - RUN.H + 6, uy = s.fuss - 3;
      for (const o of s.hindernisse) if (bx > o.x + 3 && ax < o.x + o.w - 3 && uy > RUN.BODEN - o.h) { s.vorbei = true; s.grund = "hindernis"; }
      for (const k of s.knochen) if (k.x > RUN.X - 8 && k.x < RUN.X + RUN.W + 8 && k.y > oy - 14 && k.y < uy + 10) { k.weg = true; s.knochenZahl++; }
      s.punkte = Math.floor(s.strecke / 10) + s.knochenZahl * 10;
    },
  };

  // ================= Zeichnen und Steuern =================
  function rundRechteck(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

  // Der Hund von der Seite, im Laufen; farbe aus dem Tier (Foxred beim Labrador)
  function zeichneHund(c, x, fuss, t, s, opt) {
    const fell = opt.fell || "#b8622a", dunkel = opt.dunkel || "#94491b", hell = opt.hell || "#cf8346";
    const lauf = s.amBoden ? Math.sin(t * 22) : 0.6;
    const y = fuss - RUN.H;
    c.save();
    // Schwanz
    c.strokeStyle = fell; c.lineWidth = 6; c.lineCap = "round";
    c.beginPath(); c.moveTo(x + 4, y + 14); c.quadraticCurveTo(x - 10, y + 6 + lauf * 3, x - 12, y + 2); c.stroke();
    // Beine
    c.strokeStyle = dunkel; c.lineWidth = 6;
    const bein = (bx, phase) => { const a = s.amBoden ? Math.sin(t * 22 + phase) * 7 : (phase ? 6 : -6); c.beginPath(); c.moveTo(x + bx, y + 24); c.lineTo(x + bx + a, fuss - 2); c.stroke(); };
    bein(10, 0); bein(15, Math.PI); bein(31, Math.PI); bein(36, 0);
    // Körper
    c.fillStyle = fell; c.beginPath(); c.ellipse(x + 23, y + 18, 20, 11, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = hell; c.beginPath(); c.ellipse(x + 26, y + 22, 12, 5, 0, 0, Math.PI * 2); c.fill();
    // Kopf mit Schnauze, Ohr, Auge, Nase
    c.fillStyle = fell; c.beginPath(); c.arc(x + 44, y + 7, 10, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(x + 53, y + 11, 7, 5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = dunkel; c.beginPath(); c.ellipse(x + 40, y + 9, 4.5, 8, 0.35, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#1a0f0a"; c.beginPath(); c.arc(x + 47, y + 5, 1.8, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(x + 59, y + 10, 2.6, 0, Math.PI * 2); c.fill();
    if (opt.halsband) { c.strokeStyle = "#2a6fdb"; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 36, y + 11); c.lineTo(x + 38, y + 19); c.stroke(); }
    c.restore();
  }
  function zeichneRun(c, s, opt) {
    const W = RUN.BREITE, H = RUN.HOEHE, t = s.t;
    const himmel = c.createLinearGradient(0, 0, 0, H);
    himmel.addColorStop(0, opt.himmelOben || "#1E1B36"); himmel.addColorStop(1, opt.himmelUnten || "#3a2f63");
    c.fillStyle = himmel; c.fillRect(0, 0, W, H);
    // Sterne und Mond
    c.fillStyle = "rgba(255,255,255,.7)";
    for (let i = 0; i < 40; i++) { const sx = ((i * 97 + 13) % W - (s.strecke * 0.05) % W + W) % W, sy = (i * 53) % 150; c.fillRect(sx, sy, i % 3 ? 1.5 : 2.5, i % 3 ? 1.5 : 2.5); }
    c.fillStyle = "#f6e7c1"; c.beginPath(); c.arc(W - 90, 60, 22, 0, Math.PI * 2); c.fill();
    c.fillStyle = opt.himmelOben || "#1E1B36"; c.beginPath(); c.arc(W - 80, 54, 20, 0, Math.PI * 2); c.fill();
    // Stadt im Hintergrund (zwei Ebenen, die langsamer laufen)
    for (const [tempo, farbe, basis] of [[0.15, "#2b2550", 120], [0.35, "#352d63", 80]]) {
      c.fillStyle = farbe;
      for (let i = 0; i < 14; i++) {
        const bw = 40 + ((i * 37) % 50), bh = basis + ((i * 53) % 70), bx = ((i * 71 - s.strecke * tempo) % (W + 200) + W + 200) % (W + 200) - 100;
        c.fillRect(bx, RUN.BODEN - bh, bw, bh);
        if (tempo > 0.2) { c.fillStyle = "rgba(255,209,102,.35)"; for (let k = 0; k < 3; k++) c.fillRect(bx + 8 + k * 11, RUN.BODEN - bh + 12, 4, 6); c.fillStyle = farbe; }
      }
    }
    // Boden mit Gruben
    c.fillStyle = opt.boden || "#4b4578"; c.fillRect(0, RUN.BODEN, W, H - RUN.BODEN);
    c.fillStyle = opt.bodenKante || "#5FDDBE"; c.fillRect(0, RUN.BODEN, W, 3);
    for (const g of s.gruben) { c.fillStyle = "#120f22"; c.fillRect(g.x, RUN.BODEN, g.w, H - RUN.BODEN); }
    // Plattformen
    for (const p of s.plattformen) { c.fillStyle = "#B7A8FF"; rundRechteck(c, p.x, p.y, p.w, 14, 6); c.fill(); c.fillStyle = "rgba(255,255,255,.35)"; c.fillRect(p.x + 6, p.y + 2, p.w - 12, 3); }
    // Knochen
    for (const k of s.knochen) {
      c.fillStyle = "#fbf6ea";
      c.fillRect(k.x - 7, k.y - 2.5, 14, 5);
      for (const [dx, dy] of [[-7, -2.5], [-7, 2.5], [7, -2.5], [7, 2.5]]) { c.beginPath(); c.arc(k.x + dx, k.y + dy, 3.2, 0, Math.PI * 2); c.fill(); }
    }
    // Hindernisse
    for (const o of s.hindernisse) {
      const y = RUN.BODEN - o.h;
      if (o.typ === "hydrant") { c.fillStyle = "#FF6B8A"; rundRechteck(c, o.x + 3, y + 6, o.w - 6, o.h - 6, 4); c.fill(); rundRechteck(c, o.x, y + 12, o.w, 6, 3); c.fill(); c.fillRect(o.x + 6, y, o.w - 12, 8); }
      else if (o.typ === "huetchen") { c.fillStyle = "#F2773A"; c.beginPath(); c.moveTo(o.x + o.w / 2, y); c.lineTo(o.x + o.w, RUN.BODEN); c.lineTo(o.x, RUN.BODEN); c.closePath(); c.fill(); c.fillStyle = "#fff"; c.fillRect(o.x + 6, y + o.h * 0.45, o.w - 12, 4); }
      else { c.fillStyle = "#c08a4a"; c.fillRect(o.x, y, o.w, o.h); c.strokeStyle = "#8a5c2a"; c.lineWidth = 2; c.strokeRect(o.x + 1, y + 1, o.w - 2, o.h - 2); c.beginPath(); c.moveTo(o.x, y); c.lineTo(o.x + o.w, RUN.BODEN); c.stroke(); }
    }
    zeichneHund(c, RUN.X, s.fuss, t, s, opt);
  }

  // Sky Jump: Himmel wird mit der Höhe dunkler, bis ins All
  function zeichneSprung(c, s, opt) {
    const W = SPRUNG.BREITE, H = SPRUNG.HOEHE, k = Math.min(1, s.kamera / 12000);
    const mix = (a, b) => "rgb(" + a.map((x, i) => Math.round(x + (b[i] - x) * k)).join(",") + ")";
    const himmel = c.createLinearGradient(0, 0, 0, H);
    himmel.addColorStop(0, mix([58, 47, 99], [8, 6, 26])); himmel.addColorStop(1, mix([110, 90, 170], [30, 22, 70]));
    c.fillStyle = himmel; c.fillRect(0, 0, W, H);
    const sy = (y) => H - (y - s.kamera);
    // Sterne, langsamer als die Wolken
    c.fillStyle = "rgba(255,255,255," + (0.35 + 0.5 * k).toFixed(2) + ")";
    for (let i = 0; i < 46; i++) { const x = (i * 83 + 17) % W, y = (((i * 131) % (H + 40)) + s.kamera * 0.3) % (H + 40) - 20; c.fillRect(x, y, i % 4 ? 1.6 : 2.6, i % 4 ? 1.6 : 2.6); }
    // Planet weit oben
    if (k > 0.3) { c.globalAlpha = Math.min(1, (k - 0.3) * 2); c.fillStyle = "#FF8FB1"; c.beginPath(); c.arc(W - 70, 90, 34, 0, Math.PI * 2); c.fill(); c.strokeStyle = "#FFD166"; c.lineWidth = 4; c.beginPath(); c.ellipse(W - 70, 90, 56, 12, -0.3, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1; }
    // Höhenmarken alle 100 m
    c.font = "bold 12px Sora, system-ui, sans-serif"; c.fillStyle = "rgba(255,255,255,.45)"; c.strokeStyle = "rgba(255,255,255,.18)"; c.lineWidth = 1;
    for (let m = Math.ceil(s.kamera / 1000) * 1000; m < s.kamera + H; m += 1000) { if (!m) continue; const y = sy(m); c.setLineDash([6, 6]); c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); c.setLineDash([]); c.fillText(m / 10 + " m", 8, y - 5); }
    // Wolken
    for (const p of s.plattformen) {
      const y = sy(p.y); if (y < -20 || y > H + 20) continue;
      if (p.typ === "boden") { c.fillStyle = opt.boden || "#4b4578"; c.fillRect(0, y, W, H - y + 20); c.fillStyle = "#5FDDBE"; c.fillRect(0, y, W, 3); continue; }
      const farbe = p.typ === "wandert" ? "#5FDDBE" : p.typ === "broeckel" ? "#c08a4a" : "#B7A8FF";
      c.globalAlpha = p.kaputt ? 0.35 : 1;
      c.fillStyle = farbe; rundRechteck(c, p.x, y, p.w, 14, 7); c.fill();
      c.fillStyle = "rgba(255,255,255,.4)"; c.fillRect(p.x + 8, y + 3, p.w - 16, 3);
      if (p.typ === "broeckel") { c.strokeStyle = "#7a4e22"; c.lineWidth = 2; c.beginPath(); c.moveTo(p.x + p.w * 0.35, y); c.lineTo(p.x + p.w * 0.45, y + 8); c.lineTo(p.x + p.w * 0.38, y + 14); c.moveTo(p.x + p.w * 0.7, y); c.lineTo(p.x + p.w * 0.62, y + 9); c.stroke(); }
      if (p.feder) { const fx = p.x + p.w / 2; c.strokeStyle = "#FFD166"; c.lineWidth = 3; c.beginPath(); c.moveTo(fx - 8, y); for (let i = 1; i <= 4; i++) c.lineTo(fx + (i % 2 ? 8 : -8), y - i * 4); c.stroke(); c.fillStyle = "#FFD166"; c.fillRect(fx - 11, y - 19, 22, 4); }
      c.globalAlpha = 1;
    }
    // Knochen
    c.fillStyle = "#fbf6ea";
    for (const kn of s.knochen) {
      const x = kn.x, y = sy(kn.y);
      c.fillRect(x - 7, y - 2.5, 14, 5);
      for (const [dx, dy] of [[-7, -2.5], [-7, 2.5], [7, -2.5], [7, 2.5]]) { c.beginPath(); c.arc(x + dx, y + dy, 3.2, 0, Math.PI * 2); c.fill(); }
    }
    // Der Hund, in Blickrichtung, am Rand doppelt (er kommt auf der anderen Seite herein)
    const fuss = sy(s.y);
    const hund = (x) => { c.save(); if (s.blick < 0) { c.translate(x, 0); c.scale(-1, 1); c.translate(-x, 0); } zeichneHund(c, x - 30, fuss, s.t, { amBoden: false }, opt); c.restore(); };
    hund(s.x); if (s.x < 34) hund(s.x + W); if (s.x > W - 34) hund(s.x - W);
  }

  // Startet ein Spiel in einem Container. opt: { art, seed, tier, manuell, onEnde(ergebnis), onPunkte(s) }

  // ---------- Turbo Kart zeichnen: Boden als Mode-7-Ebene, Pixel für Pixel ----------
  const K7 = { HZ: 92, F: 210, CAMH: 28, ABST: 40 };
  function kartGrafik() {
    if (KART.grafik) return KART.grafik;
    const S = KART.baueStrecke(), W = KART.WELT, pts = S.pts;
    const cv = root.document.createElement("canvas"); cv.width = W; cv.height = W;
    const g = cv.getContext("2d");
    // Wiese mit Mähstreifen
    for (let y = 0; y < W; y += 32) for (let x = 0; x < W; x += 32) { g.fillStyle = ((x + y) / 32) % 2 ? "#5fb85a" : "#55ad50"; g.fillRect(x, y, 32, 32); }
    const r = zufall(11);
    for (let i = 0; i < 700; i++) { g.fillStyle = ["#ffd166", "#ffffff", "#ff8fb1", "#4c9a48"][i % 4]; g.fillRect(r() * W, r() * W, 3, 3); }
    // Teich in der Mitte
    g.fillStyle = "#e8d49a"; g.beginPath(); g.ellipse(360, 650, 96, 74, 0.3, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#4aa8e0"; g.beginPath(); g.ellipse(360, 650, 84, 62, 0.3, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#7cc6f0"; g.beginPath(); g.ellipse(340, 630, 40, 16, 0.3, 0, Math.PI * 2); g.fill();
    const linie = (breite, farbe) => { g.lineWidth = breite; g.strokeStyle = farbe; g.lineJoin = "round"; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.closePath(); g.stroke(); };
    linie(2 * KART.HALB + 26, "#e9d9a8");
    // rot-weiße Randsteine
    g.lineWidth = 2 * KART.HALB + 12;
    for (let i = 0; i < KART.N; i += 2) { const a = pts[i], b = pts[(i + 2) % KART.N]; g.strokeStyle = (i / 2) % 2 ? "#ffffff" : "#e23b4e"; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
    linie(2 * KART.HALB, "#6e7287");
    // Mittellinie
    g.setLineDash([14, 18]); linie(2, "rgba(255,255,255,.7)"); g.setLineDash([]);
    const quer = (i, f) => { const p = pts[i], n = [-Math.sin(p.w), Math.cos(p.w)]; g.save(); g.translate(p.x, p.y); g.rotate(p.w); f(n); g.restore(); };
    // Start und Ziel
    quer(0, () => { for (let a = 0; a < 2; a++) for (let b = -6; b < 6; b++) { g.fillStyle = (a + b) % 2 ? "#ffffff" : "#222222"; g.fillRect(a * 8 - 8, b * (KART.HALB / 6), 8, KART.HALB / 6); } });
    // Turbo-Felder
    for (const i of S.turbo) for (let k = 0; k < 6; k += 2) quer((i + k) % KART.N, () => { g.fillStyle = "#ffb020"; g.beginPath(); g.moveTo(-6, -16); g.lineTo(8, 0); g.lineTo(-6, 16); g.lineTo(-1, 0); g.closePath(); g.fill(); g.fillStyle = "#fff3b0"; g.fillRect(-10, -20, 2, 40); });
    const tex = new Uint32Array(g.getImageData(0, 0, W, W).data.buffer.slice(0));
    // Bäume und Büsche neben der Strecke
    const deko = [], rr = zufall(5);
    for (let i = 0; i < 400 && deko.length < 70; i++) {
      const x = 20 + rr() * (W - 40), y = 20 + rr() * (W - 40);
      if (Math.hypot(x - 360, y - 650) < 110) continue;
      let d = Infinity; for (const p of pts) d = Math.min(d, Math.hypot(p.x - x, p.y - y));
      if (d < KART.HALB + 30 || d > 200) continue;
      deko.push({ x, y, typ: rr() < 0.65 ? "baum" : "busch", g: 0.8 + rr() * 0.5 });
    }
    // Karte für die Übersicht oben rechts
    const karte = pts.filter((p, i) => i % 6 === 0).map((p) => [p.x / W, p.y / W]);
    const boden = root.document.createElement("canvas"); boden.width = KART.BREITE; boden.height = KART.HOEHE - K7.HZ;
    const bg = boden.getContext("2d"), bild = bg.createImageData(boden.width, boden.height);
    KART.grafik = { tex, deko, karte, boden, bg, bild, buf: new Uint32Array(bild.data.buffer) };
    return KART.grafik;
  }
  const RGBA = (r, g, b) => (255 << 24) | (b << 16) | (g << 8) | r; // little endian
  function zeichneKart(c, s, opt) {
    const G = kartGrafik(), W = KART.BREITE, H = KART.HOEHE, HZ = K7.HZ, F = K7.F, sp = s.spieler, WELT = KART.WELT;
    // Kamera folgt dem eigenen Kart weich
    if (s.camW == null) s.camW = sp.w;
    let dw = sp.w - s.camW; while (dw > Math.PI) dw -= 2 * Math.PI; while (dw < -Math.PI) dw += 2 * Math.PI;
    s.camW += dw * 0.18;
    const fx = Math.cos(s.camW), fy = Math.sin(s.camW), rx = -fy, ry = fx;
    const cx = sp.x - fx * K7.ABST, cy = sp.y - fy * K7.ABST, camH = K7.CAMH + (sp.gras > 0 ? Math.sin(s.t * 40) * 0.6 : 0);
    // Himmel und Hügel
    const himmel = c.createLinearGradient(0, 0, 0, HZ); himmel.addColorStop(0, "#5aa9ff"); himmel.addColorStop(1, "#bfe3ff");
    c.fillStyle = himmel; c.fillRect(0, 0, W, HZ + 1);
    const versatz = (-s.camW / (2 * Math.PI)) * 960;
    c.fillStyle = "#ffffff";
    for (let i = 0; i < 6; i++) { const x = (((versatz * 0.5 + i * 170) % 1020) + 1020) % 1020 - 60, y = 18 + (i % 3) * 14; c.beginPath(); c.arc(x, y, 12, 0, 7); c.arc(x + 14, y - 5, 15, 0, 7); c.arc(x + 30, y, 11, 0, 7); c.fill(); }
    for (const [farbe, hoch, fak] of [["#8fc9a0", 34, 1], ["#6bb37e", 20, 1.6]]) {
      c.fillStyle = farbe; c.beginPath(); c.moveTo(0, HZ + 1);
      for (let x = 0; x <= W; x += 8) { const u = (x - versatz * fak) / 60; c.lineTo(x, HZ - hoch * (0.55 + 0.45 * Math.sin(u) * Math.sin(u * 0.37 + 1))); }
      c.lineTo(W, HZ + 1); c.closePath(); c.fill();
    }
    // Boden
    const buf = G.buf, tex = G.tex, bw = W, rows = H - HZ, GRAS1 = RGBA(95, 184, 90), GRAS2 = RGBA(85, 173, 80);
    for (let y = 0; y < rows; y++) {
      const dy = y + 0.5, z = (camH * F) / dy, sx = (rx * z) / F, sy = (ry * z) / F;
      let wx = cx + fx * z - sx * (W / 2), wy = cy + fy * z - sy * (W / 2);
      const o = y * bw;
      for (let x = 0; x < bw; x++) {
        const ix = wx | 0, iy = wy | 0;
        buf[o + x] = ix >= 0 && iy >= 0 && ix < WELT && iy < WELT ? tex[iy * WELT + ix] : (((ix >> 5) + (iy >> 5)) & 1 ? GRAS1 : GRAS2);
        wx += sx; wy += sy;
      }
    }
    G.bg.putImageData(G.bild, 0, 0);
    c.drawImage(G.boden, 0, HZ);
    // Dunst am Horizont
    const dunst = c.createLinearGradient(0, HZ, 0, HZ + 26); dunst.addColorStop(0, "rgba(191,227,255,.9)"); dunst.addColorStop(1, "rgba(191,227,255,0)");
    c.fillStyle = dunst; c.fillRect(0, HZ, W, 26);
    // Alles, was auf der Strecke steht, nach Entfernung sortiert
    const liste = [];
    const proj = (x, y) => { const ax = x - cx, ay = y - cy, z = ax * fx + ay * fy; if (z < 10 || z > 700) return null; const l = ax * rx + ay * ry, k = F / z; const px = W / 2 + l * k; if (px < -80 || px > W + 80) return null; return { x: px, y: HZ + camH * k, k, z }; };
    for (const d of G.deko) { const p = proj(d.x, d.y); if (p) liste.push({ p, f: () => (d.typ === "baum" ? baum(c, p, d.g) : busch(c, p, d.g)) }); }
    for (const k of s.kisten) if (k.weg <= s.t) { const p = proj(k.x, k.y); if (p) liste.push({ p, f: () => kiste(c, p, s.t) }); }
    for (const k of s.knochen) if (k.weg <= s.t) { const p = proj(k.x, k.y); if (p) liste.push({ p, f: () => knochenK(c, p) }); }
    for (const q of s.pfuetzen) { const p = proj(q.x, q.y); if (p) liste.push({ p, f: () => pfuetze(c, p) }); }
    for (const f of s.fahrer) { if (f === sp) continue; const p = proj(f.x, f.y); if (p && p.z > 24) liste.push({ p, f: () => kartFigur(c, p.x, p.y, p.k, f, f.w - s.camW, opt, s.t) }); }
    // eigenes Kart, in der richtigen Reihenfolge mit den anderen
    const pk = F / K7.ABST, py = HZ + (camH * F) / K7.ABST + (sp.gras > 0 ? Math.sin(s.t * 50) * 1.5 : 0);
    liste.push({ p: { z: K7.ABST }, f: () => {
      kartFigur(c, W / 2, py, pk, sp, sp.w - s.camW + sp.lenk * 0.25, opt, s.t);
      if (sp.turbo > 0) { c.fillStyle = "rgba(255,176,32,.85)"; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(W / 2 - 20 + i * 20, py + 4 + ((s.t * 37 + i) % 1) * 3, 5, 9, 0, 0, 7); c.fill(); } }
    } });
    liste.sort((a, b) => b.p.z - a.p.z);
    for (const e of liste) e.f();
    kartHud(c, s, G);
  }
  function baum(c, p, g) {
    const k = p.k * g; c.fillStyle = "#7a4e22"; c.fillRect(p.x - 2 * k, p.y - 14 * k, 4 * k, 14 * k);
    c.fillStyle = "#2f8f4e"; c.beginPath(); c.arc(p.x, p.y - 22 * k, 11 * k, 0, 7); c.fill();
    c.fillStyle = "#3fae5e"; c.beginPath(); c.arc(p.x - 3 * k, p.y - 25 * k, 6 * k, 0, 7); c.fill();
  }
  function busch(c, p, g) { const k = p.k * g; c.fillStyle = "#3a9a52"; c.beginPath(); c.arc(p.x - 5 * k, p.y - 5 * k, 6 * k, 0, 7); c.arc(p.x + 5 * k, p.y - 5 * k, 6 * k, 0, 7); c.arc(p.x, p.y - 9 * k, 6 * k, 0, 7); c.fill(); c.fillStyle = "#ff8fb1"; c.fillRect(p.x - 1 * k, p.y - 11 * k, 2 * k, 2 * k); }
  function kiste(c, p, t) {
    const k = p.k, a = 6 * k, y = p.y - 9 * k + Math.sin(t * 4) * k;
    c.fillStyle = "hsl(" + ((t * 120) % 360) + ",85%,62%)"; rundRechteck(c, p.x - a, y - a, 2 * a, 2 * a, a * 0.3); c.fill();
    c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = Math.max(1, k * 0.8); c.stroke();
    if (k > 0.6) { c.fillStyle = "#ffffff"; c.font = "bold " + Math.round(9 * k) + "px Sora, system-ui, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("?", p.x, y + k * 0.5); }
  }
  function knochenK(c, p) {
    const k = p.k, y = p.y - 6 * k; c.fillStyle = "#fbf6ea"; c.strokeStyle = "#c9b88f"; c.lineWidth = Math.max(0.6, k * 0.5);
    c.fillRect(p.x - 4 * k, y - 1.2 * k, 8 * k, 2.4 * k);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) { c.beginPath(); c.arc(p.x + sx * 4.5 * k, y + sy * 1.4 * k, 1.8 * k, 0, 7); c.fill(); }
  }
  function pfuetze(c, p) { const k = p.k; c.fillStyle = "#7a5230"; c.beginPath(); c.ellipse(p.x, p.y - 0.5 * k, 9 * k, 3 * k, 0, 0, 7); c.fill(); c.fillStyle = "#9c6b40"; c.beginPath(); c.ellipse(p.x - 2 * k, p.y - 1 * k, 4 * k, 1.2 * k, 0, 0, 7); c.fill(); }
  // Kart mit Tier, von hinten gesehen; drehung leicht schräg
  function kartFigur(c, x, y, k, f, drehung, opt, t) {
    let d = drehung; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    const schraeg = Math.max(-1, Math.min(1, d)) * 3 * k;
    c.save(); c.translate(x, y);
    if (f.schleudern > 0) c.rotate(Math.sin(t * 30) * 0.4);
    c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.ellipse(0, 0, 9 * k, 2.2 * k, 0, 0, 7); c.fill();
    // Räder
    c.fillStyle = "#26232f"; rundRechteck(c, -9 * k, -5 * k, 4 * k, 5 * k, k); c.fill(); rundRechteck(c, 5 * k, -5 * k, 4 * k, 5 * k, k); c.fill();
    // Karosserie
    c.fillStyle = f.farbe; rundRechteck(c, -7 * k + schraeg * 0.3, -8 * k, 14 * k, 6 * k, 2 * k); c.fill();
    c.fillStyle = "rgba(255,255,255,.35)"; c.fillRect(-5 * k + schraeg * 0.3, -7 * k, 10 * k, 1.2 * k);
    c.fillStyle = "#26232f"; c.fillRect(-3 * k + schraeg * 0.3, -3.6 * k, 6 * k, 1.4 * k);
    // Kopf von hinten
    const hx = schraeg * 0.6, hy = -12 * k, A = kopfFarben(f, opt);
    c.fillStyle = A.fell;
    if (f.tier === "hase") { c.beginPath(); c.ellipse(hx - 2 * k, hy - 6 * k, 1.5 * k, 4.5 * k, -0.15, 0, 7); c.ellipse(hx + 2 * k, hy - 6 * k, 1.5 * k, 4.5 * k, 0.15, 0, 7); c.fill(); }
    if (f.tier === "katze" || f.tier === "fuchs") { for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(hx + sx * 4.2 * k, hy - 1 * k); c.lineTo(hx + sx * 3.4 * k, hy - 6.5 * k); c.lineTo(hx + sx * 0.8 * k, hy - 3 * k); c.closePath(); c.fill(); } }
    c.beginPath(); c.arc(hx, hy, 4.2 * k, 0, 7); c.fill();
    if (f.tier === "hund") { c.fillStyle = A.dunkel; for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(hx + sx * 4 * k, hy + 0.5 * k, 1.6 * k, 3.4 * k, sx * 0.25, 0, 7); c.fill(); } if (opt.halsband) { c.fillStyle = "#3a7bd5"; c.fillRect(hx - 3 * k, hy + 3.2 * k, 6 * k, 1.2 * k); } }
    if (f.tier === "fuchs") { c.fillStyle = "#3a2a20"; for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(hx + sx * 3.6 * k, hy - 2.4 * k); c.lineTo(hx + sx * 3.2 * k, hy - 5.6 * k); c.lineTo(hx + sx * 2 * k, hy - 3.4 * k); c.closePath(); c.fill(); } }
    c.restore();
  }
  function kopfFarben(f, opt) {
    if (f.tier === "hund") return { fell: opt.fell || "#c98a4b", dunkel: opt.dunkel || "#8a5a2b" };
    return { katze: { fell: "#9a9aae" }, fuchs: { fell: "#e8743a" }, hase: { fell: "#f4efe6" } }[f.tier];
  }
  function kartHud(c, s, G) {
    const W = KART.BREITE, sp = s.spieler;
    c.textBaseline = "alphabetic"; c.textAlign = "left";
    const schild = (x, y, w, h) => { c.fillStyle = "rgba(30,26,58,.72)"; rundRechteck(c, x, y, w, h, 10); c.fill(); };
    // Platz und Runde
    schild(8, 8, 124, 50);
    c.fillStyle = sp.ziel != null || s.platz === 1 ? "#ffd166" : "#ffffff"; c.font = "800 30px Sora, system-ui, sans-serif"; c.fillText(s.platz + ".", 16, 44);
    c.font = "600 11px Sora, system-ui, sans-serif"; c.fillStyle = "#cfc8ff"; c.fillText("Platz", 52, 26);
    c.fillStyle = "#ffffff"; c.font = "700 13px Sora, system-ui, sans-serif"; c.fillText("Runde " + Math.min(KART.RUNDEN, Math.max(1, sp.runde)) + "/" + KART.RUNDEN, 52, 45);
    // Item
    schild(W / 2 - 26, 8, 52, 46);
    c.strokeStyle = "rgba(255,255,255,.5)"; c.lineWidth = 2; rundRechteck(c, W / 2 - 19, 14, 38, 34, 8); c.stroke();
    c.textAlign = "center"; c.textBaseline = "middle";
    if (sp.item === "turbo") { c.fillStyle = "#ffb020"; c.beginPath(); c.moveTo(W / 2 - 9, 21); c.lineTo(W / 2 + 7, 31); c.lineTo(W / 2 - 9, 41); c.lineTo(W / 2 - 4, 31); c.closePath(); c.fill(); c.fillRect(W / 2 + 6, 21, 3, 20); }
    else if (sp.item === "pfuetze") { c.fillStyle = "#9c6b40"; c.beginPath(); c.ellipse(W / 2, 33, 13, 6, 0, 0, 7); c.fill(); c.fillStyle = "#7a5230"; c.beginPath(); c.ellipse(W / 2 + 2, 34, 6, 3, 0, 0, 7); c.fill(); }
    // Übersichtskarte
    const mx = W - 92, my = 8, ms = 84;
    schild(mx - 4, my - 2, ms + 8, ms + 6);
    c.strokeStyle = "rgba(255,255,255,.75)"; c.lineWidth = 3; c.beginPath(); G.karte.forEach((q, i) => (i ? c.lineTo(mx + q[0] * ms, my + q[1] * ms) : c.moveTo(mx + q[0] * ms, my + q[1] * ms))); c.closePath(); c.stroke();
    for (const f of s.fahrer) { c.fillStyle = f.spieler ? "#ffffff" : f.farbe; c.beginPath(); c.arc(mx + (f.x / KART.WELT) * ms, my + (f.y / KART.WELT) * ms, f.spieler ? 4 : 3, 0, 7); c.fill(); if (f.spieler) { c.strokeStyle = "#7b6cff"; c.lineWidth = 2; c.stroke(); } }
    // Countdown und Meldungen
    c.textAlign = "center"; c.textBaseline = "middle";
    const gross = (text, farbe) => { c.font = "800 46px Sora, system-ui, sans-serif"; c.lineWidth = 6; c.strokeStyle = "rgba(30,26,58,.8)"; c.strokeText(text, W / 2, 130); c.fillStyle = farbe; c.fillText(text, W / 2, 130); };
    if (s.t < 0) gross(String(Math.ceil(-s.t)), "#ffffff");
    else if (s.t < 0.8) gross("Los!", "#5FDDBE");
    else if (sp.ziel != null) gross("Ziel!", "#ffd166");
    else if (s.meldung && s.t < s.meldungBis) { c.font = "800 22px Sora, system-ui, sans-serif"; c.lineWidth = 5; c.strokeStyle = "rgba(30,26,58,.8)"; c.strokeText(s.meldung, W / 2, 84); c.fillStyle = "#ffffff"; c.fillText(s.meldung, W / 2, 84); }
    else if (sp.runde > 1 && (sp.fs % KART.N) < 25 && sp.runde <= KART.RUNDEN) { c.font = "800 22px Sora, system-ui, sans-serif"; c.lineWidth = 5; c.strokeStyle = "rgba(30,26,58,.8)"; const t = sp.runde === KART.RUNDEN ? "Letzte Runde!" : "Runde " + sp.runde; c.strokeText(t, W / 2, 84); c.fillStyle = "#ffd166"; c.fillText(t, W / 2, 84); }
    c.textAlign = "left"; c.textBaseline = "alphabetic";
  }

  function starte(box, opt) {
    const art = opt.art, SP = art === "sprung" ? SPRUNG : art === "kart" ? KART : RUN;
    const dpr = Math.min(2, root.devicePixelRatio || 1);
    let s = SP.neu(opt.seed, opt.siege);
    let laeuft = true, pausiert = false, letzte = 0, rafId = 0;
    const eingabe = { druck: false, halten: false, richtung: 0 };
    const gehalten = { links: false, rechts: false, tippL: false, tippR: false };
    const richtung = () => { const l = gehalten.links || gehalten.tippL, r = gehalten.rechts || gehalten.tippR; eingabe.richtung = (r ? 1 : 0) - (l ? 1 : 0); };
    const canvas = box.querySelector("canvas.spielfeld"), c = canvas.getContext("2d");
    function groesse() {
      let breite;
      if (art === "sprung") {
        const hoch = Math.max(300, (root.innerHeight || 800) - 250);
        breite = Math.floor(Math.min(box.clientWidth || 360, 560, (hoch * SP.BREITE) / SP.HOEHE));
      } else breite = Math.min(box.clientWidth || 640, 900);
      const hoehe = breite * (SP.HOEHE / SP.BREITE);
      canvas.width = Math.round(breite * dpr); canvas.height = Math.round(hoehe * dpr);
      canvas.style.width = breite + "px"; canvas.style.height = hoehe + "px";
      const k = (breite / SP.BREITE) * dpr; c.setTransform(k, 0, 0, k, 0, 0);
    }
    function zeichne() {
      if (art === "sprung") zeichneSprung(c, s, opt.tier || {}); else if (art === "kart") zeichneKart(c, s, opt.tier || {}); else zeichneRun(c, s, opt.tier || {});
      if (opt.onPunkte) opt.onPunkte(s);
    }
    function ende() {
      if (!laeuft) return; laeuft = false; cancelAnimationFrame(rafId); aufraeumen();
      const ergebnis = { punkte: s.punkte, knochen: s.knochenZahl, grund: s.grund, zeitUm: !!s.zeitUm, hoehe: art === "sprung" ? Math.floor(s.maxY / 10) : 0, platz: art === "kart" ? s.platz : 0, zeit: art === "kart" ? s.zielZeit : 0 };
      if (opt.onEnde) opt.onEnde(ergebnis);
    }
    function schritt(ms) {
      if (!laeuft || pausiert) return;
      const n = Math.max(1, Math.round(ms / 16.67));
      for (let i = 0; i < n && !s.vorbei; i++) { SP.schritt(s, ms / n / 1000, eingabe); eingabe.druck = false; }
      zeichne();
      if (s.vorbei) ende();
    }
    function loop(ts) {
      if (!laeuft) return;
      const ms = letzte ? Math.min(50, ts - letzte) : 16; letzte = ts;
      schritt(ms);
      if (laeuft) rafId = requestAnimationFrame(loop);
    }
    // ---- Steuerung ----
    const weg = [];
    const an = (el, ev, fn, o) => { if (!el) return; el.addEventListener(ev, fn, o); weg.push(() => el.removeEventListener(ev, fn, o)); };
    const aktion = (a, los) => {
      if (!laeuft || pausiert) return;
      if (a === "springen") eingabe.druck = true;
      if (a === "item") eingabe.item = true;
      if (a === "links" || a === "rechts") { gehalten[a] = !los; richtung(); }
    };
    // Knöpfe: gedrückt halten lenkt
    box.querySelectorAll("[data-spiel]").forEach((b) => {
      const a = b.getAttribute("data-spiel");
      an(b, "touchstart", (e) => { e.preventDefault(); aktion(a); }, { passive: false });
      an(b, "touchend", (e) => { e.preventDefault(); aktion(a, true); }, { passive: false });
      an(b, "touchcancel", () => aktion(a, true));
      an(b, "mousedown", (e) => { e.preventDefault(); aktion(a); });
      an(b, "mouseup", () => aktion(a, true)); an(b, "mouseleave", () => aktion(a, true));
    });
    if (art === "run") {
      // Überall auf das Spielfeld tippen = springen, Finger liegen lassen = höher springen
      const druck = (e) => { if (e.cancelable) e.preventDefault(); eingabe.druck = true; eingabe.halten = true; };
      const los = () => { eingabe.halten = false; };
      an(canvas, "touchstart", druck, { passive: false }); an(canvas, "touchend", los); an(canvas, "mousedown", druck); an(canvas, "mouseup", los);
    } else {
      // Sky Jump: Finger auf der linken oder rechten Hälfte des Spielfelds lenkt
      const seiten = (e) => {
        if (e.cancelable) e.preventDefault();
        const r = canvas.getBoundingClientRect(); gehalten.tippL = false; gehalten.tippR = false;
        for (let i = 0; i < e.touches.length; i++) { if (e.touches[i].clientX < r.left + r.width / 2) gehalten.tippL = true; else gehalten.tippR = true; }
        richtung();
      };
      an(canvas, "touchstart", seiten, { passive: false }); an(canvas, "touchmove", seiten, { passive: false }); an(canvas, "touchend", seiten, { passive: false }); an(canvas, "touchcancel", seiten);
      let maus = false;
      const mausSeite = (e) => { if (!maus) return; const r = canvas.getBoundingClientRect(); gehalten.tippL = e.clientX < r.left + r.width / 2; gehalten.tippR = !gehalten.tippL; richtung(); };
      an(canvas, "mousedown", (e) => { maus = true; mausSeite(e); }); an(canvas, "mousemove", mausSeite);
      an(root.document, "mouseup", () => { maus = false; gehalten.tippL = gehalten.tippR = false; richtung(); });
    }
    const TASTEN = { ArrowLeft: "links", ArrowRight: "rechts", ArrowUp: "springen", " ": "springen" };
    const taste = (e) => {
      const m = TASTEN[e.key]; if (!m) return; e.preventDefault();
      if (art === "run") { if (m === "springen") { eingabe.druck = true; eingabe.halten = true; } } else if (art === "kart" && m === "springen") aktion("item"); else if (m !== "springen") aktion(m);
    };
    const tasteLos = (e) => { eingabe.halten = false; const m = TASTEN[e.key]; if (m === "links" || m === "rechts") aktion(m, true); };
    an(root.document, "keydown", taste); an(root.document, "keyup", tasteLos);
    const sicht = () => { if (root.document.visibilityState === "hidden") { pausiert = true; gehalten.links = gehalten.rechts = gehalten.tippL = gehalten.tippR = false; richtung(); } };
    an(root.document, "visibilitychange", sicht);
    an(root, "resize", () => { groesse(); zeichne(); });
    function aufraeumen() { weg.forEach((f) => f()); weg.length = 0; }

    groesse(); zeichne();
    if (!opt.manuell) rafId = requestAnimationFrame(loop);
    return {
      stopp() { laeuft = false; cancelAnimationFrame(rafId); aufraeumen(); },
      pause(an) { pausiert = !!an; letzte = 0; },
      get pausiert() { return pausiert; },
      schritt, aktion, eingabe, zustand: () => s, ende,
    };
  }

  root.LN_SPIELE = { SPRUNG, RUN, KART, starte, zufall };
  if (typeof module !== "undefined" && module.exports) module.exports = root.LN_SPIELE;
})(typeof window !== "undefined" ? window : globalThis);
