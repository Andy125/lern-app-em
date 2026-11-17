// Spielhalle: zwei kleine Spiele als Belohnung. Oben die reine Spiellogik (läuft auch in Node, siehe
// tools/test-spiele.mjs), unten das Zeichnen auf Canvas und die Steuerung fürs iPad.
// «Blöcke»: fallende Blöcke stapeln, volle Reihen verschwinden. «Run»: der eigene Hund rennt, springt und sammelt Knochen.
(function (root) {
  "use strict";

  function zufall(seed) {
    let s = seed >>> 0 || 1;
    return function () { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // ================= Blöcke =================
  const FORMEN = {
    I: { zellen: [[0, 1], [1, 1], [2, 1], [3, 1]], groesse: 4, farbe: "#5FDDBE" },
    O: { zellen: [[1, 0], [2, 0], [1, 1], [2, 1]], groesse: 4, farbe: "#FFD166" },
    T: { zellen: [[1, 0], [0, 1], [1, 1], [2, 1]], groesse: 3, farbe: "#B7A8FF" },
    S: { zellen: [[1, 0], [2, 0], [0, 1], [1, 1]], groesse: 3, farbe: "#7BE07B" },
    Z: { zellen: [[0, 0], [1, 0], [1, 1], [2, 1]], groesse: 3, farbe: "#FF6B8A" },
    J: { zellen: [[0, 0], [0, 1], [1, 1], [2, 1]], groesse: 3, farbe: "#5AA9FF" },
    L: { zellen: [[2, 0], [0, 1], [1, 1], [2, 1]], groesse: 3, farbe: "#F2773A" },
  };
  const TYPEN = Object.keys(FORMEN);
  // Drehung im Uhrzeigersinn innerhalb des Rasters der Form; das O dreht sich nicht
  function gedreht(typ, rot) {
    const f = FORMEN[typ]; let z = f.zellen.map((c) => c.slice());
    if (typ === "O") return z;
    for (let i = 0; i < ((rot % 4) + 4) % 4; i++) z = z.map(([x, y]) => [f.groesse - 1 - y, x]);
    return z;
  }
  const BLOECKE = {
    BREITE: 10, HOEHE: 20, ZEITLIMIT: 4 * 60 * 1000,
    PUNKTE: [0, 100, 300, 500, 800],
    FORMEN, TYPEN, gedreht,
    neu(seed) {
      const s = { grid: Array.from({ length: 20 }, () => Array(10).fill(null)), beutel: [], rng: zufall(seed), punkte: 0, linien: 0, level: 1, vorbei: false, zeitUm: false, zeit: 0, fallZeit: 0, teil: null, naechste: null };
      s.naechste = BLOECKE.ziehe(s);
      BLOECKE.spawn(s);
      return s;
    },
    // 7er-Beutel: jede Form kommt in jeder Siebener-Runde genau einmal
    ziehe(s) {
      if (!s.beutel.length) { const b = TYPEN.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(s.rng() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } s.beutel = b; }
      return s.beutel.shift();
    },
    zellen(t) { return gedreht(t.typ, t.rot).map(([x, y]) => [t.x + x, t.y + y]); },
    passt(s, t) {
      return BLOECKE.zellen(t).every(([x, y]) => x >= 0 && x < 10 && y < 20 && (y < 0 || s.grid[y][x] === null));
    },
    spawn(s) {
      const typ = s.naechste; s.naechste = BLOECKE.ziehe(s);
      s.teil = { typ, rot: 0, x: 3, y: typ === "I" ? -1 : 0 };
      if (!BLOECKE.passt(s, s.teil)) s.vorbei = true;
    },
    bewege(s, dx) {
      if (s.vorbei) return false;
      const t = Object.assign({}, s.teil, { x: s.teil.x + dx });
      if (!BLOECKE.passt(s, t)) return false;
      s.teil = t; return true;
    },
    drehe(s) {
      if (s.vorbei) return false;
      for (const kick of [0, -1, 1, -2, 2]) {
        const t = Object.assign({}, s.teil, { rot: (s.teil.rot + 1) % 4, x: s.teil.x + kick });
        if (BLOECKE.passt(s, t)) { s.teil = t; return true; }
      }
      return false;
    },
    // eine Reihe tiefer; geht es nicht weiter, wird das Teil festgesetzt
    fallen(s, weich) {
      if (s.vorbei) return false;
      const t = Object.assign({}, s.teil, { y: s.teil.y + 1 });
      if (BLOECKE.passt(s, t)) { s.teil = t; if (weich) s.punkte += 1; return true; }
      BLOECKE.fest(s); return false;
    },
    zielY(s) { let y = s.teil.y; while (BLOECKE.passt(s, Object.assign({}, s.teil, { y: y + 1 }))) y++; return y; },
    ganzRunter(s) {
      if (s.vorbei) return 0;
      const y = BLOECKE.zielY(s), n = y - s.teil.y;
      s.teil.y = y; s.punkte += 2 * n; BLOECKE.fest(s);
      return n;
    },
    fest(s) {
      const farbe = FORMEN[s.teil.typ].farbe;
      for (const [x, y] of BLOECKE.zellen(s.teil)) { if (y < 0) { s.vorbei = true; continue; } s.grid[y][x] = farbe; }
      const voll = [];
      s.grid.forEach((reihe, y) => { if (reihe.every((c) => c !== null)) voll.push(y); });
      if (voll.length) {
        s.grid = s.grid.filter((_, y) => voll.indexOf(y) < 0);
        while (s.grid.length < 20) s.grid.unshift(Array(10).fill(null));
        s.punkte += BLOECKE.PUNKTE[voll.length] * s.level;
        s.linien += voll.length;
        s.level = 1 + Math.floor(s.linien / 10);
      }
      s.letzteReihen = voll;
      if (!s.vorbei) BLOECKE.spawn(s);
    },
    intervall(level) { return Math.max(90, 800 - (level - 1) * 75); },
    tick(s, ms) {
      if (s.vorbei) return;
      s.zeit += ms;
      if (s.zeit >= BLOECKE.ZEITLIMIT) { s.vorbei = true; s.zeitUm = true; return; }
      s.fallZeit += ms;
      const iv = BLOECKE.intervall(s.level);
      while (s.fallZeit >= iv && !s.vorbei) { s.fallZeit -= iv; BLOECKE.fallen(s, false); }
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

  function zeichneBloecke(c, s, zell, opt) {
    const W = 10 * zell, H = 20 * zell;
    c.clearRect(0, 0, W, H);
    c.fillStyle = opt.feld || "#16142b"; c.fillRect(0, 0, W, H);
    c.strokeStyle = "rgba(255,255,255,.05)"; c.lineWidth = 1;
    for (let x = 1; x < 10; x++) { c.beginPath(); c.moveTo(x * zell + .5, 0); c.lineTo(x * zell + .5, H); c.stroke(); }
    for (let y = 1; y < 20; y++) { c.beginPath(); c.moveTo(0, y * zell + .5); c.lineTo(W, y * zell + .5); c.stroke(); }
    const kachel = (x, y, farbe, geist) => {
      const p = Math.max(1, Math.round(zell * 0.08));
      if (geist) { c.strokeStyle = farbe; c.globalAlpha = .45; c.lineWidth = 2; rundRechteck(c, x * zell + p + 1, y * zell + p + 1, zell - 2 * p - 2, zell - 2 * p - 2, zell * 0.18); c.stroke(); c.globalAlpha = 1; return; }
      c.fillStyle = farbe; rundRechteck(c, x * zell + p, y * zell + p, zell - 2 * p, zell - 2 * p, zell * 0.18); c.fill();
      c.fillStyle = "rgba(255,255,255,.28)"; rundRechteck(c, x * zell + p * 2, y * zell + p * 2, zell - 4 * p, zell * 0.22, zell * 0.1); c.fill();
    };
    s.grid.forEach((reihe, y) => reihe.forEach((f, x) => { if (f) kachel(x, y, f); }));
    if (!s.vorbei && s.teil) {
      const farbe = FORMEN[s.teil.typ].farbe;
      const zy = BLOECKE.zielY(s);
      for (const [x, y] of BLOECKE.zellen(Object.assign({}, s.teil, { y: zy }))) if (y >= 0) kachel(x, y, farbe, true);
      for (const [x, y] of BLOECKE.zellen(s.teil)) if (y >= 0) kachel(x, y, farbe);
    }
  }
  function zeichneVorschau(c, typ, gr) {
    c.clearRect(0, 0, gr * 4, gr * 4);
    if (!typ) return;
    const z = gedreht(typ, 0), minX = Math.min(...z.map((p) => p[0])), maxX = Math.max(...z.map((p) => p[0])), minY = Math.min(...z.map((p) => p[1])), maxY = Math.max(...z.map((p) => p[1]));
    const ox = (4 - (maxX - minX + 1)) / 2 - minX, oy = (4 - (maxY - minY + 1)) / 2 - minY;
    c.fillStyle = FORMEN[typ].farbe;
    for (const [x, y] of z) { rundRechteck(c, (x + ox) * gr + 1, (y + oy) * gr + 1, gr - 2, gr - 2, gr * 0.2); c.fill(); }
  }

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

  // Startet ein Spiel in einem Container. opt: { art, seed, tier, manuell, onEnde(ergebnis), onPunkte(s) }
  function starte(box, opt) {
    const art = opt.art;
    const dpr = Math.min(2, root.devicePixelRatio || 1);
    let s = art === "bloecke" ? BLOECKE.neu(opt.seed) : RUN.neu(opt.seed);
    let laeuft = true, pausiert = false, letzte = 0, rafId = 0, eingabe = { druck: false, halten: false };
    const canvas = box.querySelector("canvas.spielfeld"), c = canvas.getContext("2d");
    const vorschau = box.querySelector("canvas.vorschau"), vc = vorschau ? vorschau.getContext("2d") : null;
    let zell = 24;
    function groesse() {
      if (art === "bloecke") {
        const platz = box.querySelector(".spiel-feld-platz");
        const maxH = Math.max(240, (root.innerHeight || 800) - 330), maxW = Math.max(160, (platz ? platz.clientWidth : 300));
        zell = Math.max(12, Math.floor(Math.min(maxH / 20, maxW / 10)));
        canvas.width = 10 * zell * dpr; canvas.height = 20 * zell * dpr; canvas.style.width = 10 * zell + "px"; canvas.style.height = 20 * zell + "px";
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (vorschau) { vorschau.width = 4 * 18 * dpr; vorschau.height = 4 * 18 * dpr; vorschau.style.width = "72px"; vorschau.style.height = "72px"; vc.setTransform(dpr, 0, 0, dpr, 0, 0); }
      } else {
        const breite = Math.min(box.clientWidth || 640, 900);
        canvas.width = breite * dpr; canvas.height = breite * (RUN.HOEHE / RUN.BREITE) * dpr;
        canvas.style.width = breite + "px"; canvas.style.height = breite * (RUN.HOEHE / RUN.BREITE) + "px";
        const k = (breite / RUN.BREITE) * dpr; c.setTransform(k, 0, 0, k, 0, 0);
      }
    }
    function zeichne() {
      if (art === "bloecke") { zeichneBloecke(c, s, zell, opt); if (vc) zeichneVorschau(vc, s.naechste, 18); }
      else zeichneRun(c, s, opt.tier || {});
      if (opt.onPunkte) opt.onPunkte(s);
    }
    function ende() {
      if (!laeuft) return; laeuft = false; cancelAnimationFrame(rafId); aufraeumen();
      const ergebnis = art === "bloecke" ? { punkte: s.punkte, linien: s.linien, level: s.level, zeitUm: s.zeitUm } : { punkte: s.punkte, knochen: s.knochenZahl, grund: s.grund };
      if (opt.onEnde) opt.onEnde(ergebnis);
    }
    function schritt(ms) {
      if (!laeuft || pausiert) return;
      if (art === "bloecke") BLOECKE.tick(s, ms);
      else { const n = Math.max(1, Math.round(ms / 16.67)); for (let i = 0; i < n && !s.vorbei; i++) { RUN.schritt(s, ms / n / 1000, eingabe); eingabe.druck = false; } }
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
    const aktion = (a) => {
      if (!laeuft || pausiert) return;
      if (art === "bloecke") {
        if (a === "links") BLOECKE.bewege(s, -1); else if (a === "rechts") BLOECKE.bewege(s, 1);
        else if (a === "drehen") BLOECKE.drehe(s); else if (a === "runter") BLOECKE.fallen(s, true); else if (a === "fallen") BLOECKE.ganzRunter(s);
        zeichne(); if (s.vorbei) ende();
      } else if (a === "springen") eingabe.druck = true;
    };
    let wiederholung = null;
    const halteStart = (a) => { aktion(a); clearInterval(wiederholung); if (a === "links" || a === "rechts" || a === "runter") { let erst = true; wiederholung = setInterval(() => { if (erst) { erst = false; return; } aktion(a); }, 85); } };
    const halteEnde = () => { clearInterval(wiederholung); wiederholung = null; };
    box.querySelectorAll("[data-spiel]").forEach((b) => {
      const a = b.getAttribute("data-spiel");
      an(b, "touchstart", (e) => { e.preventDefault(); halteStart(a); }, { passive: false });
      an(b, "touchend", (e) => { e.preventDefault(); halteEnde(); }, { passive: false });
      an(b, "mousedown", (e) => { e.preventDefault(); halteStart(a); });
      an(b, "mouseup", halteEnde); an(b, "mouseleave", halteEnde);
    });
    if (art === "run") {
      // Überall auf das Spielfeld tippen = springen, Finger liegen lassen = höher springen
      const druck = (e) => { if (e.cancelable) e.preventDefault(); eingabe.druck = true; eingabe.halten = true; };
      const los = () => { eingabe.halten = false; };
      an(canvas, "touchstart", druck, { passive: false }); an(canvas, "touchend", los); an(canvas, "mousedown", druck); an(canvas, "mouseup", los);
    } else {
      // Wischen auf dem Spielfeld: seitlich verschieben, nach unten fallen lassen, tippen drehen
      let sx = 0, sy = 0, schonBewegt = 0, startZeit = 0;
      an(canvas, "touchstart", (e) => { e.preventDefault(); const p = e.touches[0]; sx = p.clientX; sy = p.clientY; schonBewegt = 0; startZeit = Date.now(); }, { passive: false });
      an(canvas, "touchmove", (e) => { e.preventDefault(); const p = e.touches[0]; const schritte = Math.trunc((p.clientX - sx) / Math.max(18, zell)); while (schritte > schonBewegt) { aktion("rechts"); schonBewegt++; } while (schritte < schonBewegt) { aktion("links"); schonBewegt--; } }, { passive: false });
      an(canvas, "touchend", (e) => { e.preventDefault(); const p = e.changedTouches[0]; const dy = p.clientY - sy, dx = p.clientX - sx; if (dy > 60 && Math.abs(dy) > Math.abs(dx) && Date.now() - startZeit < 400) aktion("fallen"); else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) aktion("drehen"); }, { passive: false });
    }
    const taste = (e) => {
      const m = { ArrowLeft: "links", ArrowRight: "rechts", ArrowUp: art === "run" ? "springen" : "drehen", ArrowDown: "runter", " ": art === "run" ? "springen" : "fallen" }[e.key];
      if (!m) return; e.preventDefault();
      if (art === "run") { eingabe.druck = true; eingabe.halten = true; } else aktion(m);
    };
    const tasteLos = () => { eingabe.halten = false; };
    an(root.document, "keydown", taste); an(root.document, "keyup", tasteLos);
    const sicht = () => { if (root.document.visibilityState === "hidden") pausiert = true; };
    an(root.document, "visibilitychange", sicht);
    an(root, "resize", () => { groesse(); zeichne(); });
    function aufraeumen() { halteEnde(); weg.forEach((f) => f()); weg.length = 0; }

    groesse(); zeichne();
    if (!opt.manuell) rafId = requestAnimationFrame(loop);
    return {
      stopp() { laeuft = false; cancelAnimationFrame(rafId); aufraeumen(); },
      pause(an) { pausiert = !!an; letzte = 0; },
      get pausiert() { return pausiert; },
      schritt, aktion, eingabe, zustand: () => s, ende,
    };
  }

  root.LN_SPIELE = { BLOECKE, RUN, starte, zufall };
  if (typeof module !== "undefined" && module.exports) module.exports = root.LN_SPIELE;
})(typeof window !== "undefined" ? window : globalThis);
