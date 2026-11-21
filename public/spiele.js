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
  function starte(box, opt) {
    const art = opt.art, SP = art === "sprung" ? SPRUNG : RUN;
    const dpr = Math.min(2, root.devicePixelRatio || 1);
    let s = SP.neu(opt.seed);
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
      if (art === "sprung") zeichneSprung(c, s, opt.tier || {}); else zeichneRun(c, s, opt.tier || {});
      if (opt.onPunkte) opt.onPunkte(s);
    }
    function ende() {
      if (!laeuft) return; laeuft = false; cancelAnimationFrame(rafId); aufraeumen();
      const ergebnis = { punkte: s.punkte, knochen: s.knochenZahl, grund: s.grund, zeitUm: !!s.zeitUm, hoehe: art === "sprung" ? Math.floor(s.maxY / 10) : 0 };
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
      if (art === "run") { if (m === "springen") { eingabe.druck = true; eingabe.halten = true; } } else if (m !== "springen") aktion(m);
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

  root.LN_SPIELE = { SPRUNG, RUN, starte, zufall };
  if (typeof module !== "undefined" && module.exports) module.exports = root.LN_SPIELE;
})(typeof window !== "undefined" ? window : globalThis);
