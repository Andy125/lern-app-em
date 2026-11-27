// Lernnest: reine Logik ohne Oberfläche. Läuft im Browser und in Node (tools/test-logic.mjs).
// Jede Aufgabe entsteht aus (Fach, Lernteil, Modus, Startwert) und ist damit reproduzierbar:
// Die Fehlerkiste und die Tests können jede Aufgabe genau so wieder erzeugen.
(function (root) {
  "use strict";

  // ---------- Zufall mit Startwert ----------
  function mulberry(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function R(seed) {
    const f = mulberry(seed);
    const r = {
      f,
      int: (a, b) => a + Math.floor(f() * (b - a + 1)),
      pick: (arr) => arr[Math.floor(f() * arr.length)],
      shuffle: (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
      sample: (arr, n) => r.shuffle(arr).slice(0, n),
      seed: () => Math.floor(f() * 4294967296) >>> 0,
    };
    return r;
  }
  function hash(str) { let h = 2166136261; str = String(str); for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  // Mischen, aber nie in der richtigen Reihenfolge lassen (sonst ist die Aufgabe schon gelöst)
  function mischeAnders(r, arr) {
    if (arr.length < 2) return arr.slice();
    for (let i = 0; i < 12; i++) { const a = r.shuffle(arr); if (a.some((x, j) => x !== arr[j])) return a; }
    return arr.slice(1).concat(arr[0]);
  }

  // ---------- Text vergleichen ----------
  function norm(s) {
    return String(s == null ? "" : s)
      .normalize("NFC")
      .toLowerCase()
      .replace(/ß/g, "ss")
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
      .replace(/[‐-―\-_/.,;:!?"'«»„“”‚‘’()]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  const ARTIKEL = /^(der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines) /;
  const ohneArtikel = (s) => s.replace(ARTIKEL, "");
  const kern = (s) => ohneArtikel(norm(s)).replace(/ /g, "");
  // Grobe Lautschrift: gleich klingende Schreibweisen werden gleich (Reien = Rhein, Bluete = Blüte)
  function klang(s) {
    let t = kern(s);
    t = t.replace(/sch/g, "S").replace(/ae/g, "e").replace(/oe/g, "o").replace(/ue/g, "u")
      .replace(/ph/g, "f").replace(/v/g, "f").replace(/th/g, "t").replace(/dt/g, "t")
      .replace(/ck/g, "k").replace(/tz/g, "z").replace(/qu/g, "kw").replace(/x/g, "ks").replace(/c(?=[aouklr])/g, "k")
      .replace(/y/g, "i").replace(/ieh/g, "i").replace(/ie/g, "i").replace(/([aeiou])h/g, "$1")
      .replace(/ai/g, "ei").replace(/eu/g, "oi").replace(/(.)\1+/g, "$1")
      .replace(/d$/, "t").replace(/b$/, "p").replace(/g$/, "k");
    return t;
  }
  function lev(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[b.length];
  }
  const abstand = (e, z) => Math.min(lev(e, z), lev(klang(e), klang(z)));
  // erlaubte Tippfehler je Wortlänge; gleicher Klang zählt immer (Abstand 0)
  const grenzeFuer = (len) => (len <= 4 ? 0 : len <= 7 ? 1 : len <= 11 ? 2 : 3);
  // Prüft ein geschriebenes Wort. Nachsichtig (Standard): Der Begriff muss erkennbar sein, darf aber
  // keinem anderen Begriff des Fachs näher sein. Streng: nur genau richtig (ohne Gross/klein und Artikel).
  function pruefeWort(eingabe, ziel, opts) {
    opts = opts || {};
    const roh = String(eingabe == null ? "" : eingabe).trim().replace(/\s+/g, " ");
    const e = kern(roh);
    if (!e) return { ok: false, exakt: false, leer: true };
    const alle = [ziel].concat(opts.auch || []);
    const zs = alle.map(kern);
    const ohneArt = (s) => s.replace(/^(der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines)\s+/i, "");
    const genau = alle.some((z) => ohneArt(String(z)) === ohneArt(roh));
    if (opts.streng) return { ok: genau, exakt: genau }; // Rechtschreibung: genau, mit Groß- und Kleinschreibung
    if (zs.includes(e)) return { ok: true, exakt: genau };
    const d = Math.min(...zs.map((z) => abstand(e, z)));
    const len = Math.min(...zs.map((z) => z.length));
    if (d > grenzeFuer(len)) return { ok: false, exakt: false };
    for (const o of opts.andere || []) {
      const on = kern(o);
      if (!on || zs.includes(on)) continue;
      if (abstand(e, on) <= d) return { ok: false, exakt: false, verwechselt: o };
    }
    return { ok: true, exakt: false };
  }
  // Englische Vokabeln: Rechtschreibung zählt genau (auch klein/groß). «to», «a», «an», «the» am Anfang
  // dürfen fehlen oder dabei sein, Satzzeichen am Ende sind egal.
  // Klammern sind freiwillige Teile: «to go (to)» erlaubt «to go to» und «to go», «gym(nasium)» erlaubt «gym» und «gymnasium»
  function varianten(z) {
    const original = String(z);
    let out = [original];
    for (let i = 0; i < 3; i++) {
      const neu = [];
      for (const v of out) { const m = v.match(/\(([^()]*)\)/); if (!m) { neu.push(v); continue; } neu.push(v.replace(m[0], m[1]), v.replace(m[0], "")); }
      out = neu;
    }
    return out.indexOf(original) < 0 ? out.concat(original) : out;
  }
  function pruefeEnglisch(eingabe, ziel, auch) {
    const sauber = (x) => String(x == null ? "" : x).replace(/[’‘`´]/g, "'").replace(/…|\.\.\./g, " ").replace(/,/g, " ").replace(/\s+/g, " ").trim().replace(/[!?.]+$/, "").trim();
    const kurz = (x) => x.replace(/^(to|a|an|the) /i, "");
    const e = sauber(eingabe);
    if (!e) return { ok: false, exakt: false, leer: true };
    const ziele = [];
    for (const z of [ziel].concat(auch || [])) for (const v of varianten(z)) ziele.push(sauber(v));
    if (ziele.some((z) => z === e || kurz(z) === kurz(e))) return { ok: true, exakt: true };
    const kl = (x) => kurz(x).toLowerCase();
    if (ziele.some((z) => kl(z) === kl(e))) return { ok: false, exakt: false, grossKlein: true };
    if (ziele.some((z) => lev(kl(z), kl(e)) <= 2)) return { ok: false, exakt: false, fast: true };
    return { ok: false, exakt: false };
  }
  function parseZahl(s) {
    let t = String(s == null ? "" : s).trim();
    // «1.5» mit Punkt als Komma lesen (englische Tastatur), «1.500» bleibt Tausendertrennung
    if (/^-?\d+\.\d{1,2}$/.test(t)) t = t.replace(".", ",");
    t = t.replace(/[\s  .']/g, "").replace(",", ".");
    if (!/^-?\d+(\.\d+)?$/.test(t)) return NaN;
    return Number(t);
  }

  // ---------- Inhalte ----------
  // Ein Fach hat Themen, ein Thema hat Karten. Aus jeder Karte entstehen ein oder mehrere Lernteile
  // (bei Bild, Paaren und Gruppen einer je Eintrag), jeder Lernteil hat einen eigenen Fortschritt.
  const TYPEN = ["begriff", "frage", "zahl", "wahr", "paare", "gruppen", "reihe", "luecke", "bild", "vokabel", "teilen", "detektiv", "ueberschlag", "umkehr", "kopf", "sach", "passt", "linie", "lage", "welche", "abstand"];
  function fachTeile(fach) {
    if (fach.__teile) return fach.__teile;
    const teile = [];
    for (const th of fach.themen) {
      for (const k of th.karten) {
        if (k.typ === "auftrag") continue; // Mitmach-Aufträge sind keine Quizfragen
        const base = { karte: k, thema: th.id };
        if (k.typ === "bild") k.marken.forEach((m) => teile.push(Object.assign({ id: k.id + "#" + m.nr, teil: m.nr, name: m.begriff }, base)));
        else if (k.typ === "paare") k.paare.forEach((p, i) => teile.push(Object.assign({ id: k.id + "#" + i, teil: i, name: p[0] + " → " + p[1] }, base)));
        else if (k.typ === "gruppen") gruppenListe(k).forEach((g, i) => teile.push(Object.assign({ id: k.id + "#" + i, teil: i, name: g[0] + " (" + g[1] + ")" }, base)));
        else teile.push(Object.assign({ id: k.id, teil: null, name: k.en || k.begriff || k.titel || k.frage || k.satz || (k.text ? kurz(String(k.text).replace(/[{}]/g, ""), 50) : k.id) }, base));
      }
    }
    Object.defineProperty(fach, "__teile", { value: teile, enumerable: false });
    return teile;
  }
  const kurz = (s, n) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + " …" : s);
  const auftraege = (fach) => fach.themen.flatMap((th) => th.karten.filter((k) => k.typ === "auftrag").map((k) => Object.assign({ thema: th.id }, k)));
  // Teile einer Bedeutung: «nehmen; mitnehmen, bringen (zu)» -> nehmen | mitnehmen | bringen
  // teileVon ohne Klammern (für «darf keine falsche Option sein», vorsichtig), teileRoh mit Klammern (für «gilt auch als richtig», streng)
  const merk = (fn) => { const m = new Map(); return (x) => { x = String(x); if (!m.has(x)) m.set(x, fn(x)); return m.get(x); }; };
  const teileVon = merk((s) => s.split(/[;,]/).map((x) => norm(x.replace(/\([^)]*\)/g, "")).replace(/^(der|die|das|ein|eine) /, "")).filter(Boolean));
  const teileRoh = merk((s) => s.split(/[;,]/).map((x) => norm(x).replace(/^(der|die|das|ein|eine) /, "")).filter(Boolean));
  const ueberlappt = (a, b) => { const B = teileVon(b); return teileVon(a).some((x) => B.indexOf(x) >= 0); };
  function vokabelnFach(fach) {
    if (fach.__vok) return fach.__vok;
    const v = []; for (const th of fach.themen) for (const k of th.karten) if (k.typ === "vokabel") { Object.defineProperty(k, "__thema", { value: th.id, enumerable: false, configurable: true }); v.push(k); }
    Object.defineProperty(fach, "__vok", { value: v, enumerable: false });
    return v;
  }
  const teilById = (fach, id) => fachTeile(fach).find((t) => t.id === id) || null;
  function gruppenListe(k) { const out = []; for (const g of Object.keys(k.gruppen)) for (const x of k.gruppen[g]) out.push([x, g]); return out; }
  const alleBegriffe = (fach) => {
    const s = new Set();
    for (const th of fach.themen) for (const k of th.karten) {
      if (k.typ === "begriff") s.add(k.begriff);
      if (k.typ === "bild") k.marken.forEach((m) => s.add(m.begriff));
      if (k.typ === "frage" && k.schreiben) s.add(k.antwort);
    }
    return [...s];
  };

  // Welche Modi eine Karte kennt, nach Stufe sortiert (leicht zuerst)
  function modi(k) {
    switch (k.typ) {
      case "begriff": return ["begriff-wahl", "erklaerung-wahl", "begriff-schreiben"];
      case "frage": return k.schreiben ? ["frage-wahl", "frage-wahl", "frage-schreiben"] : ["frage-wahl"];
      case "zahl": return ["zahl"];
      case "wahr": return ["wahr"];
      case "paare": return kategorien(k) ? ["paar-wahl", "paare"] : ["paare"];
      case "gruppen": return ["gruppe-wahl", "gruppe-antippen"];
      case "reihe": return ["reihe"];
      case "luecke": return ["luecke"];
      case "bild": return ["bild-wahl", "bild-tippen", "bild-schreiben"];
      case "vokabel": return ["en-de-wahl", "de-en-wahl", "de-en-schreiben"].concat(k.satz ? ["satz-wahl"] : []);
      // Mathe: erst geführt in der Rechen-Werkstatt, dann ohne Hilfen, dann nur das Ergebnis (gerechnet auf Papier)
      case "teilen": return ["teilen-werkstatt", "teilen-profi", "teilen-ergebnis"];
      case "detektiv": return ["detektiv"];
      case "ueberschlag": return ["ueberschlag-wahl", "plausibel"];
      case "umkehr": return ["umkehr"];
      case "kopf": return ["kopf"];
      case "sach": return ["sach"];
      case "passt": return ["passt-wahl", "passt-zahl"];
      // Geometrie: Bilder auf Karopapier, jedes Mal neu gezeichnet
      case "linie": return k.zaehlen ? ["linie-wahl", "linie-zaehlen"] : ["linie-wahl"];
      case "lage": return ["lage-wahl"];
      case "welche": return ["welche-wahl"];
      case "abstand": return k.art === "parallel" ? ["abstand-parallel"] : ["abstand-wahl", "abstand-zahl"];
    }
    return [];
  }
  // Themen für Plan und Probe: Bonus-Themen nur, wenn es sonst keine gibt
  const planThemen = (fach) => { const t = fach.themen.filter((x) => !x.bonus); return t.length ? t : fach.themen; };
  const istVerb = (k) => /^to /i.test(k.en || "");
  const satzLuecke = (k) => { const m = String(k.satz || "").match(/\{([^}]+)\}/); return m ? m[1] : null; };
  // Paare mit sich wiederholender rechter Seite sind Zuordnungen zu Gruppen (Forelle → Fische)
  const kategorien = (k) => new Set(k.paare.map((p) => p[1])).size < k.paare.length;
  function modusFuerStufe(k, box, r) {
    const m = k.typ === "vokabel" ? modi(k).slice(0, 3) : modi(k);
    let i = Math.min(m.length - 1, box <= 0 ? 0 : box <= 2 ? 1 : 2);
    if (r && i > 0 && r.f() < 0.25) {
      // ab und zu eine leichtere Form zum Durchatmen, bei Vokabeln gern der Lückensatz
      if (k.typ === "vokabel" && k.satz) return "satz-wahl";
      i -= 1;
    }
    return m[i];
  }

  // ---------- Mathe: schriftlich dividieren ----------
  // Zahlen wie im Schulbuch: ab fünf Stellen mit kleinem Abstand (12 500), vierstellige ohne (4218)
  const zahlText = (n) => { const s = String(n); return s.replace(/^-/, "").length >= 5 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : s; };
  // Die Schritte der schriftlichen Division, genau wie im Heft: Man fängt links mit der kleinsten Zahl an,
  // in die der Divisor passt, dann für jede Stelle Teilen, Mal, Minus, Runterholen.
  function divSchritte(a, b) {
    const d = String(a).split("").map(Number);
    let i = 0, teil = d[0];
    while (teil < b && i < d.length - 1) { i++; teil = teil * 10 + d[i]; }
    const schritte = [];
    for (;;) {
      const z = Math.floor(teil / b), p = z * b;
      schritte.push({ teil, ende: i, ziffer: z, produkt: p, diff: teil - p });
      if (i >= d.length - 1) break;
      i++; teil = (teil - p) * 10 + d[i];
    }
    return { a, b, ziffern: d, schritte, quotient: Number(schritte.map((s) => s.ziffer).join("")), rest: schritte[schritte.length - 1].diff, anfang: schritte[0].ende + 1 };
  }
  // Reihenfolge der Eingaben: womit anfangen, dann je Stelle Ziffer, Produkt, Differenz und Runterholen
  function divAblauf(D) {
    const out = [{ typ: "start", wert: D.anfang }];
    D.schritte.forEach((s, k) => {
      out.push({ typ: "ziffer", s: k, wert: s.ziffer }, { typ: "produkt", s: k, wert: s.produkt }, { typ: "diff", s: k, wert: s.diff });
      if (k < D.schritte.length - 1) out.push({ typ: "runter", s: k, wert: D.ziffern[s.ende + 1] });
    });
    out.push({ typ: "fertig" });
    return out;
  }
  // Wahlmöglichkeiten für den Anfang: die ersten 1, 2, (3) Ziffern
  const divAnfaenge = (D) => { const out = []; for (let n = 1; n <= Math.min(D.ziffern.length, String(D.b).length + 1); n++) out.push(Number(D.ziffern.slice(0, n).join(""))); return out; };
  // Eine Eingabe in der Rechen-Werkstatt prüfen. Liefert bei Fehlern einen Hinweis, der genau diesen Fehler erklärt.
  function divPruefe(t, pos, wert) {
    const m = t.ablauf[pos], D = t.div, b = D.b;
    if (!m || m.typ === "fertig") return { ok: false };
    if (m.typ === "runter") return { ok: true };
    const n = parseZahl(wert);
    if (isNaN(n)) return { ok: false, leer: String(wert == null ? "" : wert).trim() === "" };
    if (m.typ === "start") {
      if (n === Number(D.ziffern.slice(0, D.anfang).join(""))) return { ok: true };
      if (n < b) return { ok: false, text: `${n} ist kleiner als ${b}. Da passt die ${b} nicht hinein. Nimm noch eine Ziffer dazu.` };
      return { ok: false, text: `So viel brauchst du nicht. Die ${b} passt schon in eine kleinere Zahl. Fang so klein wie möglich an.` };
    }
    if (n === m.wert) return { ok: true };
    const s = D.schritte[m.s];
    if (m.typ === "ziffer") {
      if (n > 9) return { ok: false, text: "Ins Ergebnis kommt immer nur eine Ziffer. Wie oft passt die " + b + " höchstens hinein?" };
      if (n * b > s.teil) return { ok: false, text: `Zu viel: ${n} · ${b} = ${n * b}. Das ist mehr als ${s.teil}.` };
      return { ok: false, text: `Da passt noch mehr hinein: ${n} · ${b} = ${n * b}, dann blieben ${s.teil - n * b} übrig. Das reicht noch für einmal ${b}.` };
    }
    if (m.typ === "produkt") {
      const extra = s.ziffer === 0 ? " Null mal eine Zahl ist immer 0." : s.ziffer === 1 ? " Einmal die Zahl ist die Zahl selbst." : b < 10 ? ` Zähl in ${b}er-Schritten: ${b}, ${2 * b}, ${3 * b} …` : ` Tipp: ${s.ziffer} · ${Math.floor(b / 10) * 10} + ${s.ziffer} · ${b % 10}.`;
      return { ok: false, text: `Rechne noch mal: ${s.ziffer} · ${b}.` + extra };
    }
    return { ok: false, text: `Rechne noch mal: ${s.teil} − ${s.produkt}.` + (n > s.teil ? " Beim Minus wird es kleiner, nicht größer." : n >= b ? ` Der Rest muss kleiner als ${b} sein.` : "") };
  }
  const bereich = (x) => (Array.isArray(x) ? x : [x, x]);
  const ohneNull = (D) => D.schritte.every((s) => s.ziffer > 0);
  // Passt eine Division zu den Wünschen der Karte? rest/null: true = muss, false = darf nicht; anfang: "gross" oder "klein"
  function divPasst(D, k) {
    if (D.a < D.b || D.b < 2) return false;
    if (k.rest === true && !D.rest) return false;
    if (k.rest === false && D.rest) return false;
    if (k.null === true && ohneNull(D)) return false;
    if (k.null === false && !ohneNull(D)) return false;
    const lb = String(D.b).length;
    if (k.anfang === "gross" && D.anfang !== lb) return false;
    if (k.anfang === "klein" && D.anfang !== lb + 1) return false;
    return true;
  }
  // Eine passende Division aus dem Startwert erzeugen: Divisor und Quotient wählen, Dividend daraus berechnen
  function erzeugeDivision(r, k) {
    const [smin, smax] = bereich(k.stellen || [3, 4]), [dmin, dmax] = bereich(k.divisor || [2, 9]);
    for (let v = 0; v < 4000; v++) {
      const b = r.int(dmin, dmax);
      if (b < 2 || (b % 10 === 0 && !k.zehner)) continue;
      const n = r.int(smin, smax), amin = Math.pow(10, n - 1), amax = Math.pow(10, n) - 1;
      const rest = k.rest === true ? r.int(1, b - 1) : k.rest === false ? 0 : (r.f() < 0.5 ? 0 : r.int(1, b - 1));
      const qmin = Math.ceil((amin - rest) / b), qmax = Math.floor((amax - rest) / b);
      if (qmin > qmax || qmax < 2) continue;
      let q = r.int(Math.max(2, qmin), qmax);
      if (k.null === true) {
        const qs = String(q).split(""); if (qs.length < 2) continue;
        qs[r.int(1, qs.length - 1)] = "0"; if (qs.length >= 4 && r.f() < 0.3) qs[r.int(1, qs.length - 1)] = "0";
        q = Number(qs.join(""));
      }
      const D = divSchritte(q * b + rest, b);
      if (D.a >= amin && D.a <= amax && divPasst(D, k)) return D;
    }
    return divSchritte(k.ersatz ? k.ersatz[0] : 84, k.ersatz ? k.ersatz[1] : 4);
  }
  const divText = (a, b) => zahlText(a) + " : " + zahlText(b);
  const ergebnisText = (q, rest) => zahlText(q) + (rest ? " Rest " + rest : "");
  // Detektiv: eine durchgerechnete Division mit genau einem typischen Fehler. Alles nach dem Fehler ist folgerichtig
  // weitergerechnet, so wie ein Kind weiterrechnen würde. Zeilen: "q" Ergebnis, "p0" erstes Produkt, "d0" erste Differenz …
  function erzeugeDetektiv(r, k) {
    const arten = k.fehler || ["null", "minus", "mal"];
    for (let v = 0; v < 400; v++) {
      const art = arten[Math.floor(r.f() * arten.length)];
      const D = erzeugeDivision(r, Object.assign({}, k, { null: art === "null" ? true : k.null, rest: k.rest }));
      if (D.schritte.length < 2) continue;
      const S = D.schritte.map((s) => Object.assign({}, s));
      let zeile = "", text = "", richtig = "";
      if (art === "null") {
        // Die Ziffern des Ergebnisses gehören zu den Schritten: Ziffer j ist der Schritt j
        const qs = String(D.quotient), j = qs.indexOf("0", 1); if (j < 0) continue;
        richtig = ergebnisText(D.quotient, D.rest);
        text = `Im Ergebnis fehlt eine 0. Als die ${D.b} nicht in die ${D.schritte[j].teil} gepasst hat, gehört eine 0 ins Ergebnis. Richtig ist ${richtig}.`;
        return { D, schritte: S, quotientText: qs.slice(0, j) + qs.slice(j + 1), rest: D.rest, zeile: "q", text, art, richtig };
      }
      // Fehlerstelle wählen, dann folgerichtig weiterrechnen
      const kandidaten = [];
      S.forEach((s, i) => {
        if (art === "minus") for (const e of [-1, 1]) { const d2 = s.diff + e; if (d2 >= 0 && d2 < D.b) kandidaten.push([i, e]); }
        if (art === "mal" && s.ziffer >= 2) for (const e of [-2, -1, 1, 2]) { const d2 = s.diff - e; if (d2 >= 0 && d2 < D.b) kandidaten.push([i, e]); }
      });
      if (!kandidaten.length) continue;
      const [i, e] = kandidaten[Math.floor(r.f() * kandidaten.length)];
      const s = S[i];
      if (art === "minus") { s.diff += e; zeile = "d" + i; text = `Hier wurde falsch abgezogen: ${s.teil} − ${s.produkt} = ${s.teil - s.produkt}, nicht ${s.diff}.`; }
      else { s.produkt += e; s.diff = s.teil - s.produkt; zeile = "p" + i; text = `Hier stimmt das Malnehmen nicht: ${s.ziffer} · ${D.b} = ${s.ziffer * D.b}, nicht ${s.produkt}.`; }
      for (let j = i + 1; j < S.length; j++) {
        const t = S[j]; t.teil = S[j - 1].diff * 10 + D.ziffern[t.ende];
        t.ziffer = Math.floor(t.teil / D.b); t.produkt = t.ziffer * D.b; t.diff = t.teil - t.produkt;
      }
      const qs = S.map((x) => x.ziffer).join("");
      richtig = ergebnisText(D.quotient, D.rest);
      const folge = qs === String(D.quotient) ? "Deshalb stimmt am Ende der Rest nicht." : "Danach ist alles folgerichtig weitergerechnet, deshalb stimmt auch das Ergebnis nicht.";
      return { D, schritte: S, quotientText: qs, rest: S[S.length - 1].diff, zeile, text: text + " " + folge + ` Richtig wäre ${richtig}.`, art, richtig };
    }
    return null;
  }
  // Überschlag: Dividend in der Nähe einer «schönen» Zahl, damit man gut runden kann
  // Bei zweistelligem Divisor wird auch er gerundet (39 ≈ 40), sonst bleibt er (4 218 : 6 ≈ 4 200 : 6).
  function erzeugeUeberschlag(r, k) {
    const [smin, smax] = bereich(k.stellen || [3, 4]), [dmin, dmax] = bereich(k.divisor || [2, 9]);
    for (let v = 0; v < 3000; v++) {
      const b = r.int(dmin, dmax); if (b % 10 === 0) continue;
      const bg = b < 10 ? b : Math.round(b / 10) * 10;
      const n = r.int(smin, smax);
      const m = r.int(1, 9), e = Math.max(1, n - String(m * bg).length);
      const qn = m * Math.pow(10, e), N = qn * bg;
      if (String(N).length !== n) continue;
      const q = Math.round((N * (1 + (r.f() * 2 - 1) * 0.05)) / b); if (q === qn) continue;
      const a = q * b; if (a === N || String(a).length !== n || Math.abs(a - N) > N * 0.08 || q < qn * 0.7 || q > qn * 1.4) continue;
      return { a, b, bg, q, qn, N };
    }
    return { a: 4218, b: 6, bg: 6, q: 703, qn: 700, N: 4200 };
  }
  const ueberschlagText = (U) => `${zahlText(U.a)} ist ungefähr ${zahlText(U.N)}` + (U.bg !== U.b ? `, ${U.b} ist ungefähr ${U.bg}` : "") + `. ${zahlText(U.N)} : ${U.bg} = ${zahlText(U.qn)}.`;
  function erzeugeBereich(r, k, feldA, feldB, rest) {
    const [amin, amax] = bereich(feldA), [bmin, bmax] = bereich(feldB);
    for (let v = 0; v < 2000; v++) {
      const b = r.int(bmin, bmax);
      const rr = rest === true ? r.int(1, b - 1) : rest === false ? 0 : (r.f() < 0.5 ? 0 : r.int(1, b - 1));
      const qmin = Math.ceil((amin - rr) / b), qmax = Math.floor((amax - rr) / b);
      if (qmin > qmax || qmax < 1) continue;
      const q = r.int(Math.max(1, qmin), qmax);
      return { a: q * b + rr, b, q, rest: rr };
    }
    return { a: 84, b: 4, q: 21, rest: 0 };
  }

  // ---------- Geometrie auf Karopapier ----------
  // Ein Kästchen im Heft ist 5 mm breit. Linien haben einen Punkt (x, y) in Kästchen und eine Richtung (dx, dy)
  // aus ganzen Zahlen, so kann man senkrecht und parallel durch Kästchenzählen prüfen. y zählt nach unten.
  const GEO = { C: 16, Z: 10, K: 24, RAND: 14 };
  const RICHTUNGEN = {
    achsen: [[1, 0], [0, 1]],
    diagonal: [[1, 0], [0, 1], [1, 1], [1, -1]],
    schraeg: [[1, 0], [0, 1], [1, 1], [1, -1], [2, 1], [1, 2], [2, -1], [1, -2], [3, 1], [1, 3], [3, -1], [1, -3]],
  };
  const skalar = (a, b) => a[0] * b[0] + a[1] * b[1];
  const kreuz = (a, b) => a[0] * b[1] - a[1] * b[0];
  const laenge = (a) => Math.sqrt(skalar(a, a));
  // Lage zweier Richtungen: "senkrecht", "parallel" oder "schraeg" (dazwischen, deutlich sichtbar)
  function lageVon(a, b) { if (skalar(a, b) === 0) return "senkrecht"; if (kreuz(a, b) === 0) return "parallel"; return "schraeg"; }
  const deutlichSchraeg = (a, b) => { const c = Math.abs(skalar(a, b)) / (laenge(a) * laenge(b)); return c > 0.42 && c < 0.92; };
  // Teil einer Geraden im Bild: Parameterbereich, in dem sie innerhalb des Rands bleibt
  function imBild(p, d) {
    let lo = -1e9, hi = 1e9;
    const grenzen = [[0, GEO.C], [0, GEO.Z]];
    for (let i = 0; i < 2; i++) {
      const [u, o] = grenzen[i];
      if (d[i] === 0) { if (p[i] < u || p[i] > o) return null; continue; }
      let t1 = (u - p[i]) / d[i], t2 = (o - p[i]) / d[i]; if (t1 > t2) { const x = t1; t1 = t2; t2 = x; }
      lo = Math.max(lo, t1); hi = Math.min(hi, t2);
    }
    return lo < hi ? [lo, hi] : null;
  }
  const px = (v) => GEO.RAND + v * GEO.K;
  function geoSvg(linien, punkte, extra) {
    const W = GEO.C * GEO.K + 2 * GEO.RAND, H = GEO.Z * GEO.K + 2 * GEO.RAND;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Zeichnung auf Karopapier"><rect width="${W}" height="${H}" fill="#fffdf8"/>`;
    for (let x = 0; x <= GEO.C; x++) s += `<line x1="${px(x)}" y1="${px(0)}" x2="${px(x)}" y2="${px(GEO.Z)}" stroke="#e6e0f6" stroke-width="1"/>`;
    for (let y = 0; y <= GEO.Z; y++) s += `<line x1="${px(0)}" y1="${px(y)}" x2="${px(GEO.C)}" y2="${px(y)}" stroke="#e6e0f6" stroke-width="1"/>`;
    for (const l of linien) {
      const [a, b] = l.von;
      s += `<line x1="${px(a[0])}" y1="${px(a[1])}" x2="${px(b[0])}" y2="${px(b[1])}" stroke="${l.farbe || "#2b2550"}" stroke-width="${l.dick || 3}" stroke-linecap="round"${l.gestrichelt ? ' stroke-dasharray="7 6"' : ""}/>`;
      if (l.name) s += `<text x="${px(l.schild[0])}" y="${px(l.schild[1]) + 6}" text-anchor="middle" font-size="19" font-style="italic" font-weight="700" fill="${l.farbe || "#2b2550"}" font-family="Georgia, serif">${l.name}</text>`;
    }
    for (const pt of punkte || []) {
      const x = px(pt.x), y = px(pt.y);
      s += `<path d="M${x - 6} ${y - 6} L${x + 6} ${y + 6} M${x - 6} ${y + 6} L${x + 6} ${y - 6}" stroke="#e5662a" stroke-width="3" stroke-linecap="round"/>`;
      s += `<text x="${x + (pt.dx || 9)}" y="${y + (pt.dy || -9)}" font-size="18" font-weight="700" fill="#e5662a" font-family="Sora, system-ui, sans-serif">${pt.name}</text>`;
    }
    return s + (extra || "") + "</svg>";
  }
  // Ganze Gerade durchs Bild, Name am Ende, das weiter rechts unten liegt; Punkt p soll im Inneren liegen
  function gerade(p, d, name, farbe) {
    const b = imBild(p, d); if (!b) return null;
    const a = [p[0] + d[0] * b[0], p[1] + d[1] * b[0]], e = [p[0] + d[0] * b[1], p[1] + d[1] * b[1]];
    if (laenge([e[0] - a[0], e[1] - a[1]]) < 5) return null;
    const ende = e[0] + e[1] >= a[0] + a[1] ? e : a, innen = ende === e ? a : e;
    const r = [innen[0] - ende[0], innen[1] - ende[1]], lr = laenge(r);
    const schild = [ende[0] + (r[0] / lr) * 0.9 + (-r[1] / lr) * 0.55, ende[1] + (r[1] / lr) * 0.9 + (r[0] / lr) * 0.55];
    return { p, d, von: [a, e], name, farbe, schild };
  }
  function innenPunkt(r, rand) { return [r.int(rand, GEO.C - rand), r.int(rand, GEO.Z - rand)]; }
  // Zwei Geraden mit vorgegebener Lage; bei senkrecht und schräg schneiden sie sich gut sichtbar im Bild
  function zweiGeraden(r, k, lage) {
    const R0 = RICHTUNGEN[k.richtungen || "schraeg"];
    for (let v = 0; v < 500; v++) {
      const a = R0[Math.floor(r.f() * R0.length)];
      let b;
      if (lage === "senkrecht") b = r.f() < 0.5 ? [-a[1], a[0]] : [a[1], -a[0]];
      else if (lage === "parallel") b = a.slice();
      else { const kand = RICHTUNGEN.schraeg.filter((x) => deutlichSchraeg(a, x)); if (!kand.length) continue; b = kand[Math.floor(r.f() * kand.length)]; }
      const p = innenPunkt(r, 3);
      let q = p;
      if (lage === "parallel") { const n = [-a[1], a[0]], schritt = r.int(2, 4) * (r.f() < 0.5 ? -1 : 1); q = [p[0] + n[0] * schritt / Math.max(1, Math.abs(n[0]) + Math.abs(n[1]) - 1), p[1] + n[1] * schritt / Math.max(1, Math.abs(n[0]) + Math.abs(n[1]) - 1)]; q = [Math.round(q[0]), Math.round(q[1])]; if (kreuz(a, [q[0] - p[0], q[1] - p[1]]) === 0) continue; }
      const g = gerade(p, a, "g", "#4b3fb0"), h = gerade(q, b, "h", "#0f9c7e");
      if (!g || !h || Math.hypot(g.schild[0] - h.schild[0], g.schild[1] - h.schild[1]) < 1.6) continue;
      if (lage === "parallel" && abstandPunktGerade(q, p, a) < 1.4) continue;
      return [g, h];
    }
    return null;
  }
  function abstandPunktGerade(q, p, d) { return Math.abs(kreuz(d, [q[0] - p[0], q[1] - p[1]])) / laenge(d); }

  // ---------- Aufgaben erzeugen ----------
  function optionenMit(r, richtig, kandidaten, n) {
    const pool = [...new Set(kandidaten.filter((x) => x !== richtig && norm(x) !== norm(richtig)))];
    return r.shuffle([richtig].concat(r.sample(pool, n - 1)));
  }
  function anderBegriffe(fach, teil, feld) {
    const gleich = [], rest = [];
    for (const th of fach.themen) for (const k of th.karten) if (k.typ === "begriff" && k !== teil.karte) (th.id === teil.thema ? gleich : rest).push(k[feld]);
    return { gleich, rest };
  }
  function makeTask(fach, teilId, modus, seed) {
    const teil = typeof teilId === "string" ? teilById(fach, teilId) : teilId;
    if (!teil) return null;
    const k = teil.karte;
    if (!modus || modi(k).indexOf(modus) < 0) modus = modi(k)[0];
    const r = R(hash(teil.id + "|" + modus) ^ (seed >>> 0));
    const t = { id: teil.id + "|" + modus + "|" + (seed >>> 0), teil: teil.id, karte: k.id, thema: teil.thema, modus, seed: seed >>> 0, tipp: k.tipp || "", erklaerung: k.erklaerung || "", merk: k.merk || "", warum: k.warum || "" };
    switch (modus) {
      case "begriff-wahl": {
        const { gleich, rest } = anderBegriffe(fach, teil, "begriff");
        let opts = optionenMit(r, k.begriff, gleich.length >= 3 ? gleich : gleich.concat(rest), 4);
        if (opts.length < 3 && k.falsch) opts = optionenMit(r, k.begriff, k.falsch, 4);
        Object.assign(t, { art: "wahl", frage: "Welcher Begriff passt?", text: k.bedeutung, optionen: opts, loesung: k.begriff });
        t.erklaerung = t.erklaerung || k.begriff + ": " + k.bedeutung;
        break;
      }
      case "erklaerung-wahl": {
        const { gleich, rest } = anderBegriffe(fach, teil, "bedeutung");
        const opts = optionenMit(r, k.bedeutung, gleich.length >= 2 ? gleich : gleich.concat(rest), 3);
        Object.assign(t, { art: "wahl", frage: "Was bedeutet «" + k.begriff + "»?", optionen: opts, loesung: k.bedeutung, lang: true });
        t.erklaerung = t.erklaerung || k.begriff + ": " + k.bedeutung;
        break;
      }
      case "begriff-schreiben": {
        Object.assign(t, { art: "schreiben", frage: "Schreibe den Begriff.", text: k.bedeutung, loesung: k.begriff, auch: k.auch || [], andere: alleBegriffe(fach).filter((b) => b !== k.begriff), streng: !!k.streng, anfang: k.begriff.replace(ARTIKEL, "").charAt(0) });
        t.erklaerung = t.erklaerung || k.begriff + ": " + k.bedeutung;
        break;
      }
      case "frage-wahl":
        Object.assign(t, { art: "wahl", frage: k.frage, optionen: optionenMit(r, k.antwort, k.falsch, Math.min(4, k.falsch.length + 1)), loesung: k.antwort });
        t.erklaerung = t.erklaerung || "Richtig ist: " + k.antwort;
        break;
      case "frage-schreiben":
        Object.assign(t, { art: "schreiben", frage: k.frage, loesung: k.antwort, auch: k.auch || [], andere: alleBegriffe(fach).filter((b) => b !== k.antwort).concat(k.falsch), streng: !!k.streng, anfang: k.antwort.replace(ARTIKEL, "").charAt(0) });
        t.erklaerung = t.erklaerung || "Richtig ist: " + k.antwort;
        break;
      case "zahl":
        Object.assign(t, { art: "zahl", frage: k.frage, loesung: k.antwort, einheit: k.einheit || "", toleranz: k.toleranz || 0 });
        t.erklaerung = t.erklaerung || "Richtig ist: " + k.antwort + (k.einheit ? " " + k.einheit : "");
        break;
      case "wahr":
        Object.assign(t, { art: "wahr", frage: "Stimmt das?", text: k.satz, loesung: !!k.wahr });
        t.erklaerung = t.erklaerung || (k.wahr ? "Das stimmt." : "Das stimmt nicht." + (k.korrektur ? " " + k.korrektur : ""));
        break;
      case "paar-wahl": {
        const p = k.paare[teil.teil];
        const rechts = [...new Set(k.paare.map((x) => x[1]))];
        const andereRechts = r.shuffle(rechts.filter((x) => x !== p[1])).slice(0, Math.min(4, rechts.length - 1));
        Object.assign(t, { art: "wahl", frage: k.frageWahl || "Wohin gehört das?", text: p[0], optionen: r.shuffle([p[1]].concat(andereRechts)), loesung: p[1] });
        t.erklaerung = t.erklaerung || p[0] + " → " + p[1];
        break;
      }
      case "paare": {
        // Fokus-Paar plus bis zu 3 weitere, rechte Seiten alle verschieden (sonst wäre die Zuordnung mehrdeutig)
        const p = k.paare[teil.teil];
        const andere = r.shuffle(k.paare.filter((x, i) => i !== teil.teil));
        const wahl = [p];
        for (const x of andere) { if (wahl.length >= 4) break; if (!wahl.some((w) => w[1] === x[1] || w[0] === x[0])) wahl.push(x); }
        const links = r.shuffle(wahl.map((w) => w[0]));
        const loesung = {}; wahl.forEach((w) => (loesung[w[0]] = w[1]));
        Object.assign(t, { art: "paare", frage: k.titel || "Ordne zu.", links, rechts: mischeAnders(r, links.map((l) => loesung[l])), loesung });
        t.erklaerung = t.erklaerung || links.map((l) => l + " → " + loesung[l]).join(", ");
        break;
      }
      case "gruppe-wahl": {
        const [x, g] = gruppenListe(k)[teil.teil];
        Object.assign(t, { art: "wahl", frage: k.frageWahl || "Wozu gehört das?", text: x, optionen: r.shuffle(Object.keys(k.gruppen)), loesung: g });
        t.erklaerung = t.erklaerung || x + " → " + g;
        break;
      }
      case "gruppe-antippen": {
        const [x, g] = gruppenListe(k)[teil.teil];
        const ja = k.gruppen[g];
        const nein = gruppenListe(k).filter((e) => e[1] !== g).map((e) => e[0]);
        const anzahlJa = Math.min(ja.length, 4);
        const jaWahl = [x].concat(r.sample(ja.filter((y) => y !== x), anzahlJa - 1));
        const neinWahl = r.sample(nein, Math.max(2, Math.min(nein.length, 6 - jaWahl.length)));
        Object.assign(t, { art: "mehr", frage: (k.frageAntippen || "Tippe alles an, was passt:") + " " + g, optionen: r.shuffle(jaWahl.concat(neinWahl)), loesung: jaWahl.slice(), gruppe: g });
        t.erklaerung = t.erklaerung || g + ": " + jaWahl.join(", ");
        break;
      }
      case "reihe":
        Object.assign(t, { art: "reihe", frage: k.titel || "Bringe in die richtige Reihenfolge.", items: mischeAnders(r, k.schritte), loesung: k.schritte.slice() });
        t.erklaerung = t.erklaerung || k.schritte.map((s, i) => i + 1 + ". " + s).join(" ");
        break;
      case "luecke": {
        const teile = [], loesung = [];
        String(k.text).split(/(\{[^}]+\})/).forEach((s) => { if (/^\{.*\}$/.test(s)) { loesung.push(s.slice(1, -1)); teile.push(null); } else if (s) teile.push(s); });
        Object.assign(t, { art: "luecke", frage: k.titel || "Setze die Wörter ein.", teile, loesung, bank: r.shuffle(loesung.concat(k.extra || [])) });
        t.erklaerung = t.erklaerung || String(k.text).replace(/[{}]/g, "");
        break;
      }
      case "bild-wahl": {
        const m = k.marken.find((x) => x.nr === teil.teil);
        const andere = k.marken.filter((x) => x !== m).map((x) => x.begriff);
        Object.assign(t, { art: "wahl", frage: "Wie heißt Nummer " + m.nr + "?", fig: { karte: k.id, markiert: m.nr }, optionen: optionenMit(r, m.begriff, andere, 4), loesung: m.begriff });
        t.erklaerung = t.erklaerung || "Nummer " + m.nr + " ist " + m.begriff + ".";
        break;
      }
      case "bild-tippen": {
        const m = k.marken.find((x) => x.nr === teil.teil);
        Object.assign(t, { art: "tippen", frage: "Tippe auf: " + m.begriff, fig: { karte: k.id, markiert: null, tippen: true }, loesung: m.nr });
        t.erklaerung = t.erklaerung || m.begriff + " ist Nummer " + m.nr + ".";
        break;
      }
      case "bild-schreiben": {
        const m = k.marken.find((x) => x.nr === teil.teil);
        Object.assign(t, { art: "schreiben", frage: "Schreibe, wie Nummer " + m.nr + " heißt.", fig: { karte: k.id, markiert: m.nr }, loesung: m.begriff, auch: m.auch || [], andere: alleBegriffe(fach).filter((b) => b !== m.begriff), anfang: m.begriff.replace(ARTIKEL, "").charAt(0) });
        t.erklaerung = t.erklaerung || "Nummer " + m.nr + " ist " + m.begriff + ".";
        break;
      }
      case "en-de-wahl": case "de-en-wahl": {
        // keine Option, die dieselbe Bedeutung hat (sehen: to see / to look) oder dasselbe englische Wort
        const andere = vokabelnFach(fach).filter((x) => x !== k && !ueberlappt(x.de, k.de) && kern(x.en) !== kern(k.en));
        const gleich = andere.filter((x) => x.__thema === teil.thema);
        const pool = gleich.length >= 3 ? gleich : andere;
        const enDe = modus === "en-de-wahl";
        const opts = optionenMit(r, enDe ? k.de : k.en, pool.map((x) => (enDe ? x.de : x.en)), 4);
        Object.assign(t, { art: "wahl", frage: enDe ? "Was heißt das auf Deutsch?" : "Wie heißt das auf Englisch?", text: enDe ? k.en : k.de, optionen: opts, loesung: enDe ? k.de : k.en, textSprache: enDe ? "en" : "de", optionenSprache: enDe ? "de" : "en", englisch: k.en });
        t.erklaerung = t.erklaerung || k.en + " = " + k.de;
        break;
      }
      case "de-en-schreiben": {
        const wort = k.en.replace(/^(to|a|an|the) /i, "");
        // Auch richtig: ein anderes Wort, das alle gezeigten Bedeutungen hat (sehen: to see, aber auch to look)
        const gezeigt = teileRoh(k.de);
        const auchAndere = vokabelnFach(fach).filter((x) => x !== k && gezeigt.every((g) => teileRoh(x.de).includes(g))).map((x) => x.en);
        Object.assign(t, { art: "schreiben", frage: /\s/.test(k.en.replace(/^(to|a|an|the) /i, "")) ? "Schreib es auf Englisch." : "Schreib das englische Wort.", text: k.de, loesung: k.en, auch: (k.auchEn || []).concat(auchAndere), englisch: k.en, sprache: "en", textSprache: "de", anfang: wort.charAt(0) });
        t.erklaerung = t.erklaerung || k.en + " = " + k.de;
        break;
      }
      case "satz-wahl": {
        const gap = satzLuecke(k);
        // Falsche Wörter aus der anderen Wortart (Nomen gegen Verben), damit nur eine Lösung passt
        const pool = k.satzFalsch || vokabelnFach(fach).filter((x) => x !== k && x.satz && istVerb(x) !== istVerb(k) && satzLuecke(x) !== satzLuecke(k)).map(satzLuecke);
        Object.assign(t, { art: "wahl", frage: "Welches Wort passt in die Lücke?", text: String(k.satz).replace(/\{[^}]+\}/, "___"), optionen: optionenMit(r, gap, pool, 4), loesung: gap, textSprache: "en", optionenSprache: "en", englisch: k.en });
        t.erklaerung = t.erklaerung || String(k.satz).replace(/[{}]/g, "") + " (" + k.en + " = " + k.de + ")";
        break;
      }
      // ----- Mathe -----
      case "teilen-werkstatt": case "teilen-profi": case "teilen-ergebnis": {
        const D = erzeugeDivision(r, k);
        const nurErgebnis = modus === "teilen-ergebnis";
        Object.assign(t, {
          art: nurErgebnis ? "ergebnis" : "division", stufe: modus === "teilen-werkstatt" ? 0 : 1,
          frage: nurErgebnis ? "Rechne auf einem Zettel, wie in der Arbeit. Wie heißt das Ergebnis?" : modus === "teilen-werkstatt" ? "Rechne Schritt für Schritt." : "Profi-Modus: Rechne ohne Hilfen.",
          text: divText(D.a, D.b), div: D, ablauf: nurErgebnis ? null : divAblauf(D), anfaenge: divAnfaenge(D),
          loesung: { q: D.quotient, r: D.rest }, boss: !!k.boss,
        });
        t.erklaerung = divText(D.a, D.b) + " = " + ergebnisText(D.quotient, D.rest) + ". Probe: " + zahlText(D.quotient) + " · " + D.b + (D.rest ? " + " + D.rest : "") + " = " + zahlText(D.a) + "." + (k.erklaerung ? " " + k.erklaerung : "");
        break;
      }
      case "detektiv": {
        const X = erzeugeDetektiv(r, k) || erzeugeDetektiv(R(1), { stellen: 4, divisor: [6, 6], fehler: ["null"] });
        const zeilen = ["q"]; X.schritte.forEach((s, i) => zeilen.push("p" + i, "d" + i));
        Object.assign(t, {
          art: "detektiv", frage: "Detektiv-Fall: In dieser Rechnung steckt genau ein Fehler. Tippe auf die Zeile, in der er passiert ist.",
          layout: { ziffern: X.D.ziffern, b: X.D.b, schritte: X.schritte, quotientText: X.quotientText, rest: X.rest }, zeilen, loesung: X.zeile, fehlerArt: X.art, richtig: X.richtig,
        });
        t.erklaerung = X.text;
        break;
      }
      case "ueberschlag-wahl": {
        const U = erzeugeUeberschlag(r, k);
        const opts = [U.qn / 10, U.qn, U.qn * 10, U.qn * 100].filter((x) => x >= 1 && x === Math.floor(x));
        Object.assign(t, { art: "wahl", frage: "Überschlag: Ungefähr wie groß ist das Ergebnis?", text: divText(U.a, U.b), optionen: r.shuffle(opts.map(zahlText)), loesung: zahlText(U.qn) });
        t.erklaerung = ueberschlagText(U) + ` Genau sind es ${zahlText(U.q)}.`;
        t.tipp = t.tipp || (U.bg !== U.b ? `Runde ${U.b} auf ${U.bg} und ${zahlText(U.a)} auf eine Zahl, die gut durch ${U.bg} geht.` : `Runde ${zahlText(U.a)} auf eine Zahl, die gut durch ${U.b} geht.`);
        break;
      }
      case "plausibel": {
        const U = erzeugeUeberschlag(r, k), stimmt = r.f() < 0.5;
        let gezeigt = U.q;
        if (!stimmt) {
          const qs = String(U.q), j = qs.indexOf("0", 1);
          gezeigt = j > 0 && r.f() < 0.7 ? Number(qs.slice(0, j) + qs.slice(j + 1)) : r.f() < 0.5 ? U.q * 10 : Math.round(U.q / 10);
        }
        Object.assign(t, { art: "wahr", frage: "Kann das stimmen? Mach einen Überschlag.", text: divText(U.a, U.b) + " = " + zahlText(gezeigt), loesung: stimmt });
        t.erklaerung = "Überschlag: " + ueberschlagText(U) + " " + (stimmt ? `${zahlText(U.q)} passt dazu, das Ergebnis stimmt.` : `Das Ergebnis muss also ungefähr ${zahlText(U.qn)} sein. ${zahlText(gezeigt)} ist viel zu ${gezeigt < U.q ? "klein" : "groß"}. Richtig ist ${zahlText(U.q)}.`);
        t.tipp = t.tipp || `Runde so, dass du im Kopf teilen kannst. Wie groß ist das Ergebnis ungefähr?`;
        break;
      }
      case "umkehr": {
        const [q1, q2] = bereich(k.stellen || [2, 3]), [d1, d2] = bereich(k.divisor || [3, 9]);
        const b = r.int(d1, d2), q = r.int(Math.pow(10, q1 - 1) + 1, Math.pow(10, q2) - 1), rest = k.rest ? r.int(1, b - 1) : 0;
        Object.assign(t, { art: "zahl", frage: "Welche Zahl fehlt?", text: "☐ : " + b + " = " + ergebnisText(q, rest), loesung: q * b + rest, einheit: "", toleranz: 0 });
        t.erklaerung = `Rechne rückwärts, wie bei der Probe: ${zahlText(q)} · ${b} = ${zahlText(q * b)}` + (rest ? `, dazu kommt der Rest: ${zahlText(q * b)} + ${rest} = ${zahlText(q * b + rest)}.` : ".");
        t.tipp = t.tipp || `Teilen und Malnehmen gehören zusammen. Was ergibt ${zahlText(q)} · ${b}?`;
        break;
      }
      case "kopf": {
        const form = k.form || "einmaleins";
        let a, b, q, erkl;
        if (form === "nullen") {
          b = r.int(2, 9); const m = r.int(2, 9), e = r.int(1, 2); q = m * Math.pow(10, e); a = q * b;
          erkl = `Rechne erst ${m * b} : ${b} = ${m}. Dann hängst du ${e === 1 ? "die Null" : "die zwei Nullen"} wieder an: ${zahlText(q)}.`;
        } else if (form === "zehner") {
          b = r.int(2, 9) * 10; a = r.int(2, 9) * b * (r.f() < 0.4 ? 10 : 1); q = a / b;
          erkl = `Streiche bei beiden Zahlen eine Null: ${zahlText(a / 10)} : ${b / 10} = ${zahlText(q)}.`;
        } else {
          b = r.int(2, 9); q = r.int(2, 10); a = q * b;
          erkl = `${q} · ${b} = ${a}, also ist ${a} : ${b} = ${q}.`;
        }
        Object.assign(t, { art: "zahl", frage: "Kopfrechnen: Wie viel ist das?", text: divText(a, b) + " = ?", loesung: q, einheit: "", toleranz: 0 });
        t.erklaerung = erkl;
        t.tipp = t.tipp || (form === "einmaleins" ? `Welche Zahl mal ${b} ergibt ${a}?` : form === "nullen" ? "Lass die Nullen erst weg und häng sie am Ende wieder an." : "Bei beiden Zahlen darfst du gleich viele Nullen streichen.");
        break;
      }
      case "sach": {
        const X = erzeugeBereich(r, k, k.a, k.b, k.antwort === "q" ? k.rest : true);
        const loesung = k.antwort === "r" ? X.rest : k.antwort === "auf" ? X.q + 1 : X.q;
        const text = String(k.text).replace(/\{a\}/g, zahlText(X.a)).replace(/\{b\}/g, zahlText(X.b));
        Object.assign(t, { art: "zahl", frage: k.frage, text, loesung, einheit: k.einheit || "", toleranz: 0 });
        t.erklaerung = `${divText(X.a, X.b)} = ${ergebnisText(X.q, X.rest)}.` + (k.antwort === "r" ? ` Übrig bleiben ${X.rest}.` : k.antwort === "auf" ? ` Für den Rest brauchst du noch eins mehr: ${zahlText(X.q)} + 1 = ${zahlText(X.q + 1)}.` : X.rest ? ` Gefragt sind nur die vollen, also ${zahlText(X.q)}.` : "") + (k.erklaerung ? " " + k.erklaerung : "");
        t.tipp = t.tipp || "Welche Zahl wird geteilt, und durch welche? Schreib die Rechnung zuerst auf.";
        break;
      }
      // ----- Geometrie -----
      case "linie-wahl": {
        // Eine Linie durch A und B: Strecke (endet an A und B), Strahl (beginnt bei A, läuft über B hinaus) oder Gerade
        const typen = ["Strecke", "Strahl", "Gerade"], typ = typen[Math.floor(r.f() * 3)];
        let L0 = null, A, B, d;
        for (let v = 0; v < 300 && !L0; v++) {
          const R0 = RICHTUNGEN[k.richtungen || "schraeg"]; d = R0[Math.floor(r.f() * R0.length)].slice(); if (r.f() < 0.5) d = [-d[0], -d[1]];
          const n = r.int(2, 3); A = innenPunkt(r, 3); B = [A[0] + d[0] * n, A[1] + d[1] * n];
          if (B[0] < 2 || B[0] > GEO.C - 2 || B[1] < 2 || B[1] > GEO.Z - 2) continue;
          const g = gerade(A, d); if (!g) continue;
          const bb = imBild(A, d);
          if (typ === "Strecke") L0 = { von: [A, B] };
          else if (typ === "Strahl") { if (bb[1] < n + 1.5) continue; L0 = { von: [A, [A[0] + d[0] * bb[1], A[1] + d[1] * bb[1]]] }; }
          else { if (bb[1] < n + 1.5 || bb[0] > -1.5) continue; L0 = { von: g.von }; }
        }
        Object.assign(t, { art: "wahl", frage: "Was siehst du hier?", text: "", optionen: typen.map((x) => x + " AB"), loesung: typ + " AB", geo: { typ, A, B, von: L0.von } });
        t.bild = geoSvg([L0], [{ x: A[0], y: A[1], name: "A" }, { x: B[0], y: B[1], name: "B" }]);
        t.erklaerung = typ === "Strecke" ? "Die Linie hört bei A und bei B auf. Sie hat zwei Endpunkte, also ist es eine Strecke. Eine Strecke kann man messen." : typ === "Strahl" ? "Die Linie beginnt bei A und läuft über B hinaus bis zum Rand und darüber weiter. Ein Anfangspunkt, kein Ende: ein Strahl." : "Die Linie läuft in beide Richtungen über A und B hinaus. Kein Anfang, kein Ende: eine Gerade.";
        t.tipp = t.tipp || "Schau auf die Enden: Hört die Linie bei A oder B auf, oder läuft sie bis zum Rand weiter?";
        break;
      }
      case "linie-zaehlen": {
        // Mehrere Linien, gefragt ist eine Sorte: Wie viele Strecken (Strahlen, Geraden) siehst du?
        const typen = ["Strecke", "Strahl", "Gerade"], frageTyp = typen[Math.floor(r.f() * 3)];
        const linien = [], punkte = [], namen = "ABCDEFGHIJKL"; let ni = 0, belegt = [];
        const frei = (P) => belegt.every((Q) => Math.hypot(P[0] - Q[0], P[1] - Q[1]) > 2.2);
        const anzahl = r.int(4, 6);
        for (let v = 0; v < 600 && linien.length < anzahl; v++) {
          const typ = typen[Math.floor(r.f() * 3)];
          if (typ === "Gerade" && linien.filter((x) => x.typ === "Gerade").length >= 2) continue;
          const d = RICHTUNGEN.diagonal[Math.floor(r.f() * 4)].slice(); if (r.f() < 0.5) { d[0] = -d[0]; d[1] = -d[1]; }
          const A = innenPunkt(r, 1), n = r.int(2, 4), B = [A[0] + d[0] * n, A[1] + d[1] * n];
          if (B[0] < 1 || B[0] > GEO.C - 1 || B[1] < 1 || B[1] > GEO.Z - 1 || !frei(A) || !frei(B)) continue;
          const bb = imBild(A, d); let von;
          if (typ === "Strecke") von = [A, B];
          else if (typ === "Strahl") { if (bb[1] < n + 1) continue; von = [A, [A[0] + d[0] * bb[1], A[1] + d[1] * bb[1]]]; }
          else { if (bb[0] > -1 || bb[1] < n + 1) continue; von = [[A[0] + d[0] * bb[0], A[1] + d[1] * bb[0]], [A[0] + d[0] * bb[1], A[1] + d[1] * bb[1]]]; }
          // Linien dürfen sich nicht überdecken (gleiche Richtung auf derselben Geraden)
          if (linien.some((x) => kreuz(x.d, d) === 0 && kreuz(x.d, [A[0] - x.A[0], A[1] - x.A[1]]) === 0)) continue;
          // keine Linie läuft durch einen fremden Punkt, und keine fremde Linie durch die neuen Punkte
          const nahAnStueck = (P, von) => { const a = von[0], b = von[1], v = [b[0] - a[0], b[1] - a[1]], L2 = skalar(v, v); const t0 = Math.max(0, Math.min(1, ((P[0] - a[0]) * v[0] + (P[1] - a[1]) * v[1]) / L2)); return Math.hypot(a[0] + v[0] * t0 - P[0], a[1] + v[1] * t0 - P[1]) < 0.8; };
          if (belegt.some((P) => nahAnStueck(P, von)) || linien.some((x) => nahAnStueck(A, x.von) || nahAnStueck(B, x.von))) continue;
          linien.push({ typ, d, A, von, farbe: "#2b2550" });
          punkte.push({ x: A[0], y: A[1], name: namen[ni++] }, { x: B[0], y: B[1], name: namen[ni++] });
          belegt.push(A, B);
        }
        const zahl = linien.filter((x) => x.typ === frageTyp).length;
        const mehrzahl = { Strecke: "Strecken", Strahl: "Strahlen", Gerade: "Geraden" }[frageTyp];
        Object.assign(t, { art: "zahl", frage: `Wie viele ${mehrzahl} siehst du?`, text: "", loesung: zahl, einheit: "", toleranz: 0, geo: { frageTyp, linien: linien.map((x) => ({ typ: x.typ, von: x.von })) } });
        t.bild = geoSvg(linien, punkte);
        t.erklaerung = `Es sind ${zahl} ${zahl === 1 ? frageTyp : mehrzahl}. ` + { Strecke: "Strecken hören an beiden Punkten auf.", Strahl: "Strahlen beginnen an einem Punkt und laufen am anderen vorbei bis zum Rand.", Gerade: "Geraden laufen an beiden Enden bis zum Rand." }[frageTyp];
        t.tipp = t.tipp || "Fahr jede Linie mit dem Finger ab und schau auf ihre Enden.";
        break;
      }
      case "lage-wahl": {
        const lagen = k.lagen || ["senkrecht", "parallel", "schraeg"];
        const lage = lagen[Math.floor(r.f() * lagen.length)];
        const gh = zweiGeraden(r, k, lage) || zweiGeraden(R(3), { richtungen: "achsen" }, lage);
        const opts = { senkrecht: "g ⊥ h (senkrecht)", parallel: "g ∥ h (parallel)", schraeg: "weder noch" };
        Object.assign(t, { art: "wahl", frage: "Wie liegen die Geraden g und h zueinander?", text: "", optionen: ["senkrecht", "parallel", "schraeg"].map((x) => opts[x]), loesung: opts[lage], geo: { lage, linien: gh.map((x) => ({ p: x.p, d: x.d, name: x.name })) } });
        t.bild = geoSvg(gh);
        const [a, b] = [gh[0].d, gh[1].d];
        const treppe = (d) => `${Math.abs(d[0])} ${Math.abs(d[0]) === 1 ? "Kästchen" : "Kästchen"} zur Seite und ${Math.abs(d[1])} ${d[1] > 0 ? "nach unten" : d[1] < 0 ? "nach oben" : "hoch oder runter"}`;
        t.erklaerung = lage === "senkrecht" ? `g und h bilden einen rechten Winkel (90°). Man schreibt g ⊥ h.` + (a[0] && a[1] ? ` Mit Kästchen: g geht ${treppe(a)}, h geht ${treppe(b)}, die Zahlen sind vertauscht.` : "") : lage === "parallel" ? "g und h haben überall den gleichen Abstand und schneiden sich nie, auch nicht weit außerhalb des Bilds. Man schreibt g ∥ h." : "g und h schneiden sich, aber nicht im rechten Winkel. Sie sind weder senkrecht noch parallel.";
        t.tipp = t.tipp || "Leg in Gedanken dein Geodreieck an: Passt die Mittellinie auf g und h auf die Linie am Rand, sind sie senkrecht. Bleibt der Abstand gleich, sind sie parallel.";
        break;
      }
      case "welche-wahl": {
        // g und vier weitere Geraden a bis d: genau eine ist senkrecht (oder parallel) zu g
        const nach = k.frage === "parallel" || (k.frage !== "senkrecht" && r.f() < 0.5) ? "parallel" : "senkrecht";
        let fertig = null;
        for (let v = 0; v < 400 && !fertig; v++) {
          const R0 = RICHTUNGEN[k.richtungen || "schraeg"], dg = R0[Math.floor(r.f() * R0.length)];
          const g = gerade(innenPunkt(r, 3), dg, "g", "#4b3fb0"); if (!g) continue;
          const namen = ["a", "b", "c", "d"], richtig = Math.floor(r.f() * 4), liste = [g]; let ok = true;
          for (let i = 0; i < 4 && ok; i++) {
            let d;
            if (i === richtig) d = nach === "senkrecht" ? [-dg[1], dg[0]] : dg.slice();
            else { const kand = RICHTUNGEN.schraeg.filter((x) => lageVon(dg, x) !== nach && (lageVon(dg, x) !== "schraeg" || deutlichSchraeg(dg, x))); d = kand[Math.floor(r.f() * kand.length)]; }
            let l = null;
            for (let w = 0; w < 60 && !l; w++) {
              const kand = gerade(innenPunkt(r, 2), d, namen[i]);
              if (!kand) continue;
              if (liste.some((x) => Math.hypot(x.schild[0] - kand.schild[0], x.schild[1] - kand.schild[1]) < 1.8 || (kreuz(x.d, d) === 0 && abstandPunktGerade(kand.p, x.p, x.d) < 1.2))) continue;
              l = kand;
            }
            if (!l) ok = false; else liste.push(l);
          }
          if (ok) fertig = { liste, richtig: namen[richtig] };
        }
        const zeichen = nach === "senkrecht" ? "⊥" : "∥";
        Object.assign(t, { art: "wahl", frage: `Welche Gerade ist ${nach} zu g?`, text: "", optionen: ["a", "b", "c", "d"], loesung: fertig.richtig, geo: { nach, linien: fertig.liste.map((x) => ({ p: x.p, d: x.d, name: x.name })) } });
        t.bild = geoSvg(fertig.liste);
        t.erklaerung = `Es ist ${fertig.richtig}, man schreibt ${fertig.richtig} ${zeichen} g. ` + (nach === "senkrecht" ? "Sie bildet mit g einen rechten Winkel." : "Sie läuft in die gleiche Richtung wie g und behält überall den gleichen Abstand.");
        t.tipp = t.tipp || (nach === "senkrecht" ? "Gesucht ist ein rechter Winkel. Zähl die Kästchen: Geht g 2 rüber und 1 hoch, geht die Senkrechte 1 rüber und 2 runter." : "Gesucht ist die gleiche Richtung. Zähl bei jeder Geraden die Kästchen-Treppe.");
        break;
      }
      case "abstand-wahl": case "abstand-zahl": case "abstand-parallel": {
        // Achsenparallele Geraden, damit man den Abstand in Kästchen abzählen kann (1 Kästchen = 0,5 cm)
        const waag = r.f() < 0.5, d = waag ? [1, 0] : [0, 1];
        const lang = waag ? GEO.Z : GEO.C;
        const lage = modus === "abstand-wahl" ? (r.f() < 0.5 ? r.int(1, 2) : lang - r.int(1, 2)) : r.int(2, lang - 2);
        const p = waag ? [0, lage] : [lage, 0];
        const g = gerade(p, d, "g", "#4b3fb0");
        let kaestchen, linien = [g], punkte = [], extra = "", loesung, opts;
        if (modus === "abstand-parallel") {
          const moegl = []; for (let x = 1; x < lang; x++) if (Math.abs(x - lage) >= 2 && Math.abs(x - lage) <= 7) moegl.push(x);
          const x2 = moegl[Math.floor(r.f() * moegl.length)]; kaestchen = Math.abs(x2 - lage);
          linien.push(gerade(waag ? [0, x2] : [x2, 0], d, "h", "#0f9c7e"));
          loesung = kaestchen / 2;
        } else {
          const moegl = []; for (let x = 1; x < lang; x++) if (Math.abs(x - lage) >= (modus === "abstand-wahl" ? 4 : 2) && Math.abs(x - lage) <= 7) moegl.push(x);
          const quer = moegl[Math.floor(r.f() * moegl.length)], entlang = r.int(4, (waag ? GEO.C : GEO.Z) - 4);
          kaestchen = Math.abs(quer - lage);
          const P = waag ? [entlang, quer] : [quer, entlang], F = waag ? [entlang, lage] : [lage, entlang];
          punkte.push({ x: P[0], y: P[1], name: "P" });
          if (modus === "abstand-wahl") {
            // drei gestrichelte Wege von P zu g, nur einer steht senkrecht auf g
            const versatz = [0, r.int(3, 4), -r.int(3, 4)];
            const ziele = r.shuffle(versatz).map((v2, i) => ({ v: v2, nr: String(i + 1) }));
            for (const z of ziele) {
              const Q = waag ? [F[0] + z.v, F[1]] : [F[0], F[1] + z.v];
              linien.push({ von: [P, Q], farbe: "#e5662a", gestrichelt: true, dick: 2.5 });
              const M = [P[0] + (Q[0] - P[0]) * 0.62, P[1] + (Q[1] - P[1]) * 0.62];
              extra += `<circle cx="${px(M[0])}" cy="${px(M[1])}" r="11" fill="#fff" stroke="#e5662a" stroke-width="2"/><text x="${px(M[0])}" y="${px(M[1]) + 5}" text-anchor="middle" font-size="14" font-weight="700" fill="#e5662a" font-family="Sora, system-ui, sans-serif">${z.nr}</text>`;
            }
            loesung = ziele.find((z) => z.v === 0).nr; opts = ["1", "2", "3"];
          } else loesung = kaestchen / 2;
        }
        const cm = (x) => String(x).replace(".", ",") + " cm";
        if (modus === "abstand-wahl") {
          Object.assign(t, { art: "wahl", frage: "Welcher Weg zeigt den Abstand von P zur Geraden g?", text: "", optionen: opts, loesung, geo: { waag, lage, punkt: punkte[0], linien: linien.slice(1).map((x) => x.von) } });
          t.erklaerung = `Weg ${loesung} steht senkrecht auf g. Das ist der kürzeste Weg von P zu g, und genau den nennt man Abstand.`;
          t.tipp = t.tipp || "Der Abstand ist immer der kürzeste Weg. Welcher Weg bildet mit g einen rechten Winkel?";
        } else {
          Object.assign(t, { art: "zahl", frage: modus === "abstand-parallel" ? "Wie groß ist der Abstand der Parallelen g und h?" : "Wie groß ist der Abstand von P zur Geraden g?", text: "Ein Kästchen ist 0,5 cm breit.", loesung, einheit: "cm", toleranz: 0, geo: { waag, lage, kaestchen, punkt: punkte[0] || null, h: modus === "abstand-parallel" ? linien[1].p : null } });
          t.erklaerung = `${kaestchen} Kästchen senkrecht ${modus === "abstand-parallel" ? "von g bis h" : "von P bis g"}, das sind ${kaestchen} · 0,5 cm = ${cm(loesung)}.`;
          t.tipp = t.tipp || "Zähl die Kästchen auf dem kürzesten Weg, also senkrecht zur Geraden. Zwei Kästchen sind 1 cm.";
        }
        t.bild = geoSvg(linien, punkte, extra);
        break;
      }
      // Der knifflige Teil beim zweistelligen Divisor: Wie oft passt er hinein?
      case "passt-wahl": case "passt-zahl": {
        const [d1, d2] = bereich(k.divisor || [11, 49]);
        const b = r.int(d1, d2), z = r.int(1, 9), zahl = z * b + r.int(0, b - 1);
        const von = Math.max(0, Math.min(z - 1, 7)), opts = [von, von + 1, von + 2].map(String);
        Object.assign(t, { frage: `Wie oft passt die ${b} in ${zahl}?`, text: "", loesung: modus === "passt-wahl" ? String(z) : z });
        if (modus === "passt-wahl") Object.assign(t, { art: "wahl", optionen: opts });
        else Object.assign(t, { art: "zahl", einheit: "mal", toleranz: 0 });
        t.erklaerung = `${z} · ${b} = ${z * b} passt in ${zahl}` + (z < 9 ? `, aber ${z + 1} · ${b} = ${(z + 1) * b} ist zu viel` : "") + `. Also ${z}-mal, und ${zahl - z * b} bleiben übrig.`;
        t.tipp = t.tipp || `Runde ${b} auf ${Math.round(b / 10) * 10} und schätze. Dann prüfe mit Malnehmen.`;
        break;
      }
      default: return null;
    }
    if (!t.tipp) t.tipp = standardTipp(t);
    if (["teilen", "detektiv", "ueberschlag", "umkehr", "kopf", "sach", "passt", "linie", "lage", "welche", "abstand"].indexOf(k.typ) >= 0) t.neueZahlen = true; // jede Wiederholung mit neuen Zahlen
    return t;
  }
  function standardTipp(t) {
    switch (t.art) {
      case "schreiben": return "Es fängt mit «" + (t.sprache === "en" ? t.anfang : t.anfang.toUpperCase()) + "» an." + (t.sprache === "en" ? " Achte genau auf jeden Buchstaben." : "");
      case "wahl": return "Streiche zuerst, was sicher nicht passt.";
      case "reihe": return "Was passiert ganz am Anfang? Fang dort an.";
      case "paare": return "Beginne mit dem Paar, bei dem du ganz sicher bist.";
      case "luecke": return "Lies den ganzen Satz einmal laut. Welches Wort klingt richtig?";
      case "mehr": return "Es sind mehrere richtig. Prüfe jedes Kärtchen einzeln.";
      case "tippen": return "Schau dir das Bild in Ruhe an. Wo könnte es sein?";
      case "wahr": return "Lies den Satz noch einmal genau, Wort für Wort.";
      case "division": return "Denk an die vier Moves: Teilen, Mal, Minus, Runter. Die Einmaleins-Leiter hilft beim Teilen.";
      case "ergebnis": return "Mach zuerst einen Überschlag. Dann rechne Schritt für Schritt: Teilen, Mal, Minus, Runter.";
      case "detektiv": return "Prüfe jede Zeile von oben: Stimmt das Mal? Stimmt das Minus? Fehlt im Ergebnis eine 0?";
      default: return "Lies die Aufgabe noch einmal in Ruhe.";
    }
  }

  // ---------- Antwort prüfen ----------
  function check(t, a) {
    switch (t.art) {
      case "wahl": return { ok: a === t.loesung };
      case "wahr": return { ok: a === t.loesung };
      case "tippen": return { ok: Number(a) === t.loesung };
      case "zahl": { const n = parseZahl(a); if (isNaN(n)) return { ok: false, leer: String(a || "").trim() === "" }; return { ok: Math.abs(n - t.loesung) <= (t.toleranz || 0) }; }
      case "schreiben": return t.sprache === "en" ? pruefeEnglisch(a, t.loesung, t.auch) : pruefeWort(a, t.loesung, { auch: t.auch, andere: t.andere, streng: t.streng });
      case "mehr": {
        const s = new Set(a || []); const L = new Set(t.loesung);
        const falsch = [...s].filter((x) => !L.has(x)); const fehlt = t.loesung.filter((x) => !s.has(x));
        return { ok: !falsch.length && !fehlt.length, falsch, fehlt };
      }
      case "reihe": {
        const arr = Array.isArray(a) ? a : [];
        const richtig = t.loesung.map((x, i) => arr[i] === x);
        return { ok: arr.length === t.loesung.length && richtig.every(Boolean), richtig };
      }
      case "paare": { const m = a || {}; const falsch = t.links.filter((l) => m[l] !== t.loesung[l]); return { ok: !falsch.length, falsch }; }
      case "luecke": { const arr = Array.isArray(a) ? a : []; const richtig = t.loesung.map((w, i) => arr[i] === w); return { ok: richtig.every(Boolean), richtig }; }
      // Ergebnis einer Division: Quotient und Rest (ein leerer Rest heißt 0)
      case "division": case "ergebnis": {
        const o = a || {};
        const qs = String(o.q == null ? "" : o.q).trim(), rs = String(o.r == null ? "" : o.r).trim();
        if (!qs) return { ok: false, leer: true };
        const q = parseZahl(qs), rr = rs === "" ? 0 : parseZahl(rs);
        if (isNaN(q) || isNaN(rr)) return { ok: false };
        if (q === t.loesung.q && rr === t.loesung.r) return { ok: true };
        const L0 = String(t.loesung.q);
        let hinweis = "";
        if (q === t.loesung.q) hinweis = t.loesung.r ? "Das Ergebnis stimmt, aber schau noch mal auf den Rest." : "Das Ergebnis stimmt, aber hier bleibt kein Rest übrig.";
        else if (String(q).length < L0.length && String(q).replace(/0/g, "") === L0.replace(/0/g, "")) hinweis = "Mach einen Überschlag: Dein Ergebnis ist viel zu klein. Hast du eine 0 vergessen?";
        else if (q * 10 <= t.loesung.q || q >= t.loesung.q * 10) hinweis = "Mach einen Überschlag: Von der Größe her kann das nicht stimmen.";
        return { ok: false, hinweis };
      }
      case "detektiv": return { ok: a === t.loesung, hinweis: a !== t.loesung && a === "q" ? "Das Ergebnis ist zwar falsch, aber der Fehler passiert schon weiter oben. Geh die Zeilen von oben durch." : "" };
    }
    return { ok: false };
  }

  // ---------- Datum ----------
  const pad = (n) => String(n).padStart(2, "0");
  function heuteISO(d) { d = d || new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function tagNr(iso) { const [y, m, d] = String(iso).split("-").map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); }
  const tageBis = (von, bis) => tagNr(bis) - tagNr(von);
  function plusTage(iso, n) { const d = new Date((tagNr(iso) + n) * 864e5); return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()); }
  const gueltigesDatum = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(tagNr(s));

  // ---------- Spielstand ----------
  const STAND_V = 1;
  function defaults() {
    return {
      v: STAND_V,
      name: "",
      tier: null, // { art, name }
      hund: "", // Name des echten Hundes zu Hause, nur für die Warum-Texte
      auftraege: {}, // auftragId -> Datum, an dem er geschafft wurde
      gesehen: {}, // themaId -> Datum, an dem die Erklärung mit dem Check geschafft wurde
      freunde: {}, // freundId -> { seit, herzen (0 bis 5), tag (letzter Tag mit Herz) }
      besuch: "", // welcher Freund gerade zu Besuch ist
      muenzen: 0,
      punkte: 0, // XP
      tokens: 0, // Spiel-Tokens für die Spielhalle
      spiele: { run: { best: 0, runden: 0 }, sprung: { best: 0, runden: 0 }, kart: { best: 0, runden: 0, siege: 0 }, bloecke: { best: 0, runden: 0 } }, // bloecke: altes Spiel, bleibt für alte Stände
      theme: "nacht",
      gefuettert: 0,
      besitz: [], // gekaufte Dinge (Zubehör und Zimmer)
      traegt: [], // angezogenes Zubehör
      fortschritt: {}, // fachId -> teilId -> { box, sterne, n, ok, reihe, last }
      fehler: {}, // fachId -> [teilId]
      tage: {}, // "YYYY-MM-DD" -> { sek, aufgaben, richtig, etappen, mission }
      plan: {}, // fachId -> { start, arbeit, titel }
      proben: {}, // fachId -> [{ datum, prozent, themen }]
      einst: { etappe: 6, pauseSek: 30, pause: true, ruhig: false, vorlesen: false, toene: true, probeAnzahl: 12, spieleProTag: 5 },
      fach: null,
      lastBackup: null,
      erstellt: null,
    };
  }
  const istObj = (o) => !!o && typeof o === "object" && !Array.isArray(o);
  const zahl = (x, d, min, max) => { x = Number(x); if (!isFinite(x)) return d; if (min != null && x < min) x = min; if (max != null && x > max) x = max; return x; };
  // Alte, halbe oder kaputte Stände in einen gültigen Stand verwandeln. Nichts, was lesbar ist, geht verloren.
  function migrate(raw) {
    const d = defaults();
    if (!istObj(raw)) return d;
    const s = d;
    if (typeof raw.name === "string") s.name = raw.name.slice(0, 30);
    if (istObj(raw.tier) && typeof raw.tier.art === "string") s.tier = { art: raw.tier.art, name: typeof raw.tier.name === "string" ? raw.tier.name.slice(0, 30) : "" };
    if (typeof raw.hund === "string") s.hund = raw.hund.slice(0, 30);
    if (istObj(raw.auftraege)) for (const id of Object.keys(raw.auftraege)) if (gueltigesDatum(raw.auftraege[id])) s.auftraege[id] = raw.auftraege[id];
    if (istObj(raw.gesehen)) for (const id of Object.keys(raw.gesehen)) if (gueltigesDatum(raw.gesehen[id])) s.gesehen[id] = raw.gesehen[id];
    if (istObj(raw.freunde)) for (const id of Object.keys(raw.freunde)) { const x = raw.freunde[id]; if (freund(id) && istObj(x) && gueltigesDatum(x.seit)) s.freunde[id] = { seit: x.seit, herzen: Math.floor(zahl(x.herzen, 0, 0, 5)), tag: gueltigesDatum(x.tag) ? x.tag : "" }; }
    if (typeof raw.besuch === "string" && s.freunde[raw.besuch]) s.besuch = raw.besuch;
    s.muenzen = Math.floor(zahl(raw.muenzen, 0, 0));
    s.punkte = Math.floor(zahl(raw.punkte, 0, 0));
    s.tokens = Math.floor(zahl(raw.tokens, 0, 0, 99));
    if (istObj(raw.spiele)) for (const a of ["run", "sprung", "kart", "bloecke"]) if (istObj(raw.spiele[a])) { s.spiele[a] = { best: Math.floor(zahl(raw.spiele[a].best, 0, 0)), runden: Math.floor(zahl(raw.spiele[a].runden, 0, 0)) }; if (a === "kart") s.spiele.kart.siege = Math.floor(zahl(raw.spiele.kart.siege, 0, 0)); }
    if (typeof raw.theme === "string" && THEMES.some((t) => t.id === raw.theme)) s.theme = raw.theme;
    s.gefuettert = Math.floor(zahl(raw.gefuettert, 0, 0));
    if (Array.isArray(raw.besitz)) s.besitz = [...new Set(raw.besitz.filter((x) => typeof x === "string"))];
    if (Array.isArray(raw.traegt)) s.traegt = [...new Set(raw.traegt.filter((x) => typeof x === "string" && s.besitz.includes(x)))];
    if (istObj(raw.fortschritt)) for (const f of Object.keys(raw.fortschritt)) {
      if (!istObj(raw.fortschritt[f])) continue;
      const o = {};
      for (const id of Object.keys(raw.fortschritt[f])) {
        const p = raw.fortschritt[f][id]; if (!istObj(p)) continue;
        o[id] = { box: Math.floor(zahl(p.box, 0, 0, 5)), sterne: Math.floor(zahl(p.sterne, 0, 0, 3)), n: Math.floor(zahl(p.n, 0, 0)), ok: Math.floor(zahl(p.ok, 0, 0)), reihe: Math.floor(zahl(p.reihe, 0, 0)), last: gueltigesDatum(p.last) ? p.last : null };
      }
      s.fortschritt[f] = o;
    }
    if (istObj(raw.fehler)) for (const f of Object.keys(raw.fehler)) if (Array.isArray(raw.fehler[f])) s.fehler[f] = [...new Set(raw.fehler[f].filter((x) => typeof x === "string"))];
    if (istObj(raw.tage)) for (const t of Object.keys(raw.tage)) {
      const x = raw.tage[t]; if (!gueltigesDatum(t) || !istObj(x)) continue;
      s.tage[t] = { sek: zahl(x.sek, 0, 0), aufgaben: Math.floor(zahl(x.aufgaben, 0, 0)), richtig: Math.floor(zahl(x.richtig, 0, 0)), etappen: Math.floor(zahl(x.etappen, 0, 0)), mission: !!x.mission, spiele: Math.floor(zahl(x.spiele, 0, 0)) };
    }
    if (istObj(raw.plan)) for (const f of Object.keys(raw.plan)) {
      const p = raw.plan[f]; if (!istObj(p)) continue;
      s.plan[f] = { start: gueltigesDatum(p.start) ? p.start : null, arbeit: gueltigesDatum(p.arbeit) ? p.arbeit : null, titel: typeof p.titel === "string" ? p.titel.slice(0, 60) : "" };
    }
    if (istObj(raw.proben)) for (const f of Object.keys(raw.proben)) if (Array.isArray(raw.proben[f])) s.proben[f] = raw.proben[f].filter((x) => istObj(x) && gueltigesDatum(x.datum)).map((x) => ({ datum: x.datum, prozent: zahl(x.prozent, 0, 0, 100), themen: istObj(x.themen) ? x.themen : {} })).slice(-30);
    if (istObj(raw.einst)) {
      const e = raw.einst;
      s.einst.etappe = Math.floor(zahl(e.etappe, d.einst.etappe, 3, 12));
      s.einst.pauseSek = Math.floor(zahl(e.pauseSek, d.einst.pauseSek, 10, 120));
      s.einst.probeAnzahl = Math.floor(zahl(e.probeAnzahl, d.einst.probeAnzahl, 6, 40));
      s.einst.spieleProTag = Math.floor(zahl(e.spieleProTag, d.einst.spieleProTag, 0, 20));
      for (const b of ["pause", "ruhig", "vorlesen", "toene"]) if (typeof e[b] === "boolean") s.einst[b] = e[b];
    }
    if (typeof raw.fach === "string") s.fach = raw.fach;
    if (typeof raw.lastBackup === "number" && isFinite(raw.lastBackup)) s.lastBackup = raw.lastBackup;
    if (typeof raw.erstellt === "number" && isFinite(raw.erstellt)) s.erstellt = raw.erstellt;
    s.v = STAND_V;
    return s;
  }

  // ---------- Fortschritt ----------
  const sterneFuer = (box) => (box >= 5 ? 3 : box >= 3 ? 2 : box >= 1 ? 1 : 0);
  function teilStand(s, fachId, teilId) { const f = s.fortschritt[fachId] || {}; return f[teilId] || { box: 0, sterne: 0, n: 0, ok: 0, reihe: 0, last: null }; }
  // Ergebnis einer Aufgabe eintragen. ersterVersuch: ohne Fehler gelöst. Sterne gehen nie verloren.
  function record(s, fachId, teilId, ersterVersuch, heute) {
    const f = s.fortschritt[fachId] || (s.fortschritt[fachId] = {});
    const p = f[teilId] || (f[teilId] = { box: 0, sterne: 0, n: 0, ok: 0, reihe: 0, last: null });
    p.n++; p.last = heute || p.last;
    const kiste = s.fehler[fachId] || (s.fehler[fachId] = []);
    if (ersterVersuch) {
      p.ok++; p.reihe++; p.box = Math.min(5, p.box + 1);
      if (p.reihe >= 2) { const i = kiste.indexOf(teilId); if (i >= 0) kiste.splice(i, 1); }
    } else {
      p.reihe = 0; p.box = Math.max(0, p.box - 1);
      if (kiste.indexOf(teilId) < 0) kiste.push(teilId);
    }
    p.sterne = Math.max(p.sterne, sterneFuer(p.box));
    return p;
  }
  // Bereitschaft je Thema in Prozent (0 bis 100): Box 4 und höher zählt voll
  function bereitschaft(s, fach, themaId) {
    const teile = fachTeile(fach).filter((t) => !themaId || t.thema === themaId);
    if (!teile.length) return 0;
    let sum = 0; for (const t of teile) sum += Math.min(4, teilStand(s, fach.id, t.id).box) / 4;
    return Math.round((100 * sum) / teile.length);
  }
  function wackelt(s, fach) {
    return fachTeile(fach).filter((t) => { const p = teilStand(s, fach.id, t.id); return (s.fehler[fach.id] || []).includes(t.id) || (p.n > 0 && p.box <= 1); });
  }

  // ---------- Etappen ----------
  // art: "kiste" (nur Fehlerkiste), "neu" (Neues aus den Themen), "wdh" (Fehlerkiste und Wackliges aus allen begonnenen Themen),
  //      "mix" (alles gemischt), "fehler" (nur Fehlerkiste), "leicht" (Sicheres in leichter Form, für den Mut-Tag)
  function buildEtappe(fach, s, opt) {
    let n = opt.n || 6;
    const r = R((opt.seed >>> 0) || 1);
    const themen = opt.themen && opt.themen.length ? opt.themen : fach.themen.map((t) => t.id);
    const alle = fachTeile(fach);
    const inThema = alle.filter((t) => themen.includes(t.thema));
    const stand = (t) => teilStand(s, fach.id, t.id);
    const kiste = (s.fehler[fach.id] || []).map((id) => alle.find((t) => t.id === id)).filter(Boolean);
    const gesehen = (t) => stand(t).n > 0;
    const nachAlter = (arr) => r.shuffle(arr).sort((a, b) => (stand(a).last || "").localeCompare(stand(b).last || "") || stand(a).box - stand(b).box);
    const wahl = []; const nimm = (arr, k) => { for (const t of arr) { if (wahl.length >= n || k <= 0) break; if (!wahl.includes(t)) { wahl.push(t); k--; } } };
    const art = opt.art || "mix";
    if (art === "kiste") { nimm(r.shuffle(kiste), n); n = wahl.length; } // nur die Fehlerkiste, ohne Auffüllen
    else if (art === "fehler") nimm(r.shuffle(kiste), n);
    else if (art === "leicht") nimm(nachAlter(inThema.filter((t) => stand(t).box >= 2)), n);
    else if (art === "neu") {
      nimm(r.shuffle(kiste.filter((t) => themen.includes(t.thema))), Math.ceil(n / 3));
      nimm(inThema.filter((t) => !gesehen(t)), n); // neue in Inhaltsreihenfolge
      nimm(nachAlter(inThema), n);
    } else if (art === "wdh") {
      nimm(r.shuffle(kiste), Math.ceil(n / 2));
      nimm(nachAlter(alle.filter((t) => gesehen(t) && stand(t).box <= 2)), n);
      nimm(nachAlter(alle.filter(gesehen)), n);
    } else {
      nimm(r.shuffle(kiste.filter((t) => themen.includes(t.thema))), Math.ceil(n / 3));
      nimm(nachAlter(inThema), n);
    }
    nimm(nachAlter(inThema), n); // auffüllen
    nimm(nachAlter(alle), n);
    // gleiche Karte nicht direkt hintereinander
    const reihe = r.shuffle(wahl);
    for (let i = 1; i < reihe.length; i++) if (reihe[i].karte === reihe[i - 1].karte) { const j = reihe.findIndex((x, k) => k > i && x.karte !== reihe[i - 1].karte); if (j > 0) [reihe[i], reihe[j]] = [reihe[j], reihe[i]]; }
    return reihe.map((t) => {
      const box = art === "leicht" ? 0 : stand(t).box;
      return { teil: t.id, modus: modusFuerStufe(t.karte, box, r), seed: r.seed() };
    });
  }
  // Probe wie eine Arbeit: aus jedem Thema gleich viele, eher die schwerere Form, keine Rückmeldung
  function buildProbe(fach, s, opt) {
    const n = opt.n || 12;
    const r = R((opt.seed >>> 0) || 7);
    const themen = planThemen(fach).map((t) => t.id);
    const out = [];
    const proThema = themen.map((th) => r.shuffle(fachTeile(fach).filter((t) => t.thema === th)));
    for (let i = 0; out.length < n && i < 200; i++) {
      const liste = proThema[i % themen.length]; if (!liste.length) continue;
      const t = liste.shift(); liste.push(t);
      if (out.some((o) => o.teil === t.id) && out.length < fachTeile(fach).filter((x) => themen.includes(x.thema)).length) continue;
      const m = modi(t.karte); let modus = m[Math.min(m.length - 1, 1 + (r.f() < 0.4 ? 1 : 0))];
      if (t.karte.typ === "teilen") modus = "teilen-ergebnis"; // in der Probe wie in der Arbeit: auf Papier rechnen
      out.push({ teil: t.id, modus, seed: r.seed() });
    }
    return out;
  }

  // ---------- Plan bis zur Arbeit ----------
  // Feste Verteilung ab dem Starttag: zuerst jedes Thema der Reihe nach, dann gemischte Tage,
  // zwei Tage vorher eine Probe, am Tag davor Wiederholen, am Tag selbst nur Mut machen.
  function planListe(start, arbeit, themen) {
    if (!gueltigesDatum(start) || !gueltigesDatum(arbeit)) return [];
    const gesamt = tageBis(start, arbeit);
    if (gesamt < 0) return [];
    const out = [];
    const lernTage = Math.max(0, gesamt - 2); // Tage vor der Probe
    const T = themen.length;
    const neuTage = lernTage <= T ? lernTage : Math.max(T, Math.round(lernTage * 0.7));
    for (let i = 0; i <= gesamt; i++) {
      const datum = plusTage(start, i), rest = gesamt - i;
      let e;
      if (rest === 0) e = { art: "mut", themen: themen.slice() };
      else if (rest === 1) e = { art: "wiederholen", themen: themen.slice() };
      else if (rest === 2) e = { art: "probe", themen: themen.slice() };
      else if (i < neuTage) {
        const von = Math.floor((i * T) / neuTage), bis = Math.max(von + 1, Math.floor(((i + 1) * T) / neuTage));
        e = { art: "lernen", themen: themen.slice(von, bis) };
      } else e = { art: "mix", themen: themen.slice() };
      e.datum = datum; e.rest = rest;
      out.push(e);
    }
    return out;
  }
  function planTag(start, arbeit, themen, heute) {
    if (!gueltigesDatum(arbeit)) return { art: "mix", themen: themen.slice(), rest: null, datum: heute };
    const rest = tageBis(heute, arbeit);
    if (rest < 0) return { art: "frei", themen: themen.slice(), rest, datum: heute };
    const liste = planListe(gueltigesDatum(start) && tageBis(start, heute) >= 0 ? start : heute, arbeit, themen);
    return liste.find((e) => e.datum === heute) || { art: "mix", themen: themen.slice(), rest, datum: heute };
  }
  // Die drei Etappen eines Tages
  function etappenFuer(tag) {
    switch (tag.art) {
      case "lernen": return [{ titel: "Aufwärmen", art: "wdh", themen: null }, { titel: "Neues entdecken", art: "neu", themen: tag.themen }, { titel: "Festigen", art: "mix", themen: tag.themen }];
      case "probe": return [{ titel: "Aufwärmen", art: "wdh", themen: null }, { titel: "Schwaches stärken", art: "fehler", themen: null }, { titel: "Alles gemischt", art: "mix", themen: null }];
      case "wiederholen": return [{ titel: "Fehlerkiste", art: "fehler", themen: null }, { titel: "Wackliges", art: "wdh", themen: null }, { titel: "Alles gemischt", art: "mix", themen: null }];
      case "mut": return [{ titel: "Mutmacher", art: "leicht", themen: null }];
      default: return [{ titel: "Aufwärmen", art: "wdh", themen: null }, { titel: "Üben", art: "mix", themen: tag.themen }, { titel: "Alles gemischt", art: "mix", themen: null }];
    }
  }

  // ---------- Laden, Belohnungen ----------
  const SHOP = {
    snacks: [
      { id: "apfel", name: "Apfel", icon: "🍎", preis: 3 },
      { id: "karotte", name: "Karotte", icon: "🥕", preis: 3 },
      { id: "beeren", name: "Trauben", icon: "🍇", preis: 5 },
      { id: "keks", name: "Keks", icon: "🍪", preis: 5 },
      { id: "leckerli", name: "Leckerli", icon: "🍖", preis: 4 },
      { id: "kauknochen", name: "Kauknochen", icon: "🦴", preis: 6 },
      { id: "kaese", name: "Käse", icon: "🧀", preis: 6 },
      { id: "kuchen", name: "Kuchen", icon: "🍰", preis: 10 },
    ],
    // Outfit: «platz» sorgt dafür, dass nur ein Ding pro Stelle getragen wird (eine Mütze, ein Oberteil …).
    // «bed»: zusätzlich zu den Münzen muss etwas geschafft sein.
    zubehoer: [
      { id: "halsband", name: "Halsband", icon: "🔵", preis: 30, platz: "halsband" },
      { id: "schleife", name: "Schleife", icon: "🎀", preis: 40, platz: "schmuck" },
      { id: "blume", name: "Blume", icon: "🌼", preis: 45, platz: "schmuck" },
      { id: "halstuch", name: "Halstuch", icon: "🧣", preis: 60, platz: "hals" },
      { id: "brille", name: "Brille", icon: "👓", preis: 75, platz: "augen" },
      { id: "muetze", name: "Mütze", icon: "🧢", preis: 90, platz: "kopf" },
      { id: "fliege", name: "Fliege", icon: "🎀", preis: 100, platz: "hals" },
      { id: "partyhut", name: "Partyhut", icon: "🎉", preis: 120, platz: "kopf" },
      { id: "sonnenbrille", name: "Sonnenbrille", icon: "🕶️", preis: 140, platz: "augen" },
      { id: "weihnachtsmuetze", name: "Weihnachtsmütze", icon: "🎅", preis: 160, platz: "kopf" },
      { id: "pulli", name: "Ringelpulli", icon: "👕", preis: 180, platz: "koerper" },
      { id: "kopfhoerer", name: "Kopfhörer", icon: "🎧", preis: 220, platz: "ohren" },
      { id: "regenmantel", name: "Regenmantel", icon: "☂️", preis: 240, platz: "koerper" },
      { id: "hoodie", name: "Hoodie", icon: "🧥", preis: 280, platz: "koerper" },
      { id: "pfotenschuhe", name: "Pfotenschuhe", icon: "👟", preis: 320, platz: "pfoten" },
      { id: "krone", name: "Krone", icon: "👑", preis: 450, platz: "kopf", bed: { art: "level", wert: 8 } },
      { id: "medaille", name: "Goldmedaille", icon: "🏅", preis: 500, platz: "orden", bed: { art: "probe", wert: 100 } },
    ],
    zimmer: [
      { id: "kissen", name: "Kuschelkissen", icon: "🛏️", preis: 20 },
      { id: "teppich", name: "Teppich", icon: "🔮", preis: 110 },
      { id: "pflanze", name: "Pflanze", icon: "🌿", preis: 60 },
      { id: "lampe", name: "Stehlampe", icon: "💡", preis: 130 },
      { id: "bild", name: "Bild", icon: "🖼️", preis: 90 },
      { id: "ball", name: "Ball", icon: "⚽", preis: 25 },
      { id: "bastel", name: "Bastelecke", icon: "🎨", preis: 30 },
      { id: "regal", name: "Bücherregal", icon: "📚", preis: 35 },
      { id: "lichter", name: "Lichterkette", icon: "✨", preis: 160 },
    ],
    // Für den Hund: nur Hundefutter und Hundesachen
    hund: {
      snacks: [
        { id: "wasser", name: "Frisches Wasser", icon: "💧", preis: 1 },
        { id: "futter", name: "Hundefutter", icon: "🥣", preis: 3 },
        { id: "leckerli", name: "Leckerli", icon: "🍖", preis: 4 },
        { id: "hundekeks", name: "Hundekeks", icon: "🍪", preis: 5 },
        { id: "kauknochen", name: "Kauknochen", icon: "🦴", preis: 6 },
        { id: "kaustange", name: "Kaustange", icon: "🥢", preis: 7 },
      ],
      zimmer: [
        { id: "napf", name: "Futter- und Wassernapf", icon: "🥣", preis: 30 },
        { id: "ball", name: "Ball", icon: "⚽", preis: 25 },
        { id: "kauseil", name: "Kauseil", icon: "➰", preis: 30 },
        { id: "ente", name: "Quietsche-Ente", icon: "🐤", preis: 35 },
        { id: "leine", name: "Leine am Haken", icon: "🔗", preis: 40 },
        { id: "frisbee", name: "Frisbee", icon: "🥏", preis: 45 },
        { id: "pflanze", name: "Pflanze", icon: "🌿", preis: 60 },
        { id: "kuscheltier", name: "Kuscheltier", icon: "🧸", preis: 60 },
        { id: "decke", name: "Hundedecke", icon: "🛏️", preis: 70 },
        { id: "bild", name: "Bild", icon: "🖼️", preis: 90 },
        { id: "leckerliglas", name: "Leckerli-Glas", icon: "🍯", preis: 100 },
        { id: "teppich", name: "Teppich", icon: "🔮", preis: 110 },
        { id: "korb", name: "Hundekorb", icon: "🧺", preis: 120 },
        { id: "lampe", name: "Stehlampe", icon: "💡", preis: 130 },
        { id: "vorhang", name: "Vorhänge", icon: "🎪", preis: 140 },
        { id: "lichter", name: "Lichterkette", icon: "✨", preis: 160 },
        { id: "fotowand", name: "Fotowand mit Freunden", icon: "📸", preis: 200, bed: { art: "freunde", wert: 3 } },
        { id: "tipi", name: "Kuschel-Tipi", icon: "⛺", preis: 280 },
        { id: "sofa", name: "Hundesofa", icon: "🛋️", preis: 380 },
        { id: "pokal", name: "Pokal", icon: "🏆", preis: 500, bed: { art: "missionen", wert: 20 } },
      ],
    },
  };
  // Hundefreunde: einladen kostet Münzen und klappt erst, wenn etwas geschafft ist. Danach stehen sie im
  // Hundefreundebuch und können zu Besuch kommen. Jeder Tag mit geschaffter Mission, an dem ein Freund zu Besuch ist,
  // bringt ein Freundschaftsherz. Bei 5 Herzen: beste Freunde und ein Geschenk.
  // «fakt» ist geprüftes Wissen zur Rasse, der Rest ist ausgedacht und zum Spaß.
  const FREUNDE = [
    { id: "lotte", name: "Lotte", rasse: "Dackel", preis: 80, bed: null, look: { fell: "#8b4a24", hell: "#b8723f", dunkel: "#5e2f14", ohren: "lang", klein: 0.9, lang: true },
      spiel: "Buddeln im Sandkasten", leckerli: "Karottenstückchen", trick: "Rolle rückwärts (fast)", motto: "Klein, aber mutig!", fakt: "Dackel wurden gezüchtet, um Dachse in ihrem Bau aufzuspüren. Daher kommt auch der Name." },
    { id: "pepe", name: "Pepe", rasse: "Mops", preis: 120, bed: { art: "missionen", wert: 3 }, look: { fell: "#e8c99a", hell: "#f3dcb8", dunkel: "#3b3030", ohren: "kipp", maske: "#3b3030", klein: 0.85 },
      spiel: "Schnarch-Wettbewerb", leckerli: "Apfelscheiben", trick: "Pfote geben", motto: "Erst ein Nickerchen, dann die Welt.", fakt: "Möpse stammen ursprünglich aus China." },
    { id: "nala", name: "Nala", rasse: "Husky", preis: 150, bed: { art: "level", wert: 3 }, look: { fell: "#6f7782", hell: "#f4f4f4", dunkel: "#3e444c", ohren: "spitz", maske: "husky", augen: "#5aa9e6" },
      spiel: "Im Schnee wälzen", leckerli: "Fischhäppchen", trick: "Heulen auf Kommando", motto: "Je kälter, desto besser.", fakt: "Huskys stammen aus Sibirien. Sie ziehen Schlitten und halten große Kälte aus." },
    { id: "fiete", name: "Fiete", rasse: "Corgi", preis: 180, bed: { art: "auftraege", wert: 2 }, look: { fell: "#d9822b", hell: "#fff4e6", dunkel: "#a55a17", ohren: "spitz", klein: 0.85, bauchWeiss: true },
      spiel: "Ball hüten", leckerli: "Käsewürfel", trick: "Männchen machen", motto: "Kurze Beine, großes Herz.", fakt: "Corgis kommen aus Wales und wurden zum Hüten von Rindern eingesetzt." },
    { id: "luna", name: "Luna", rasse: "Dalmatiner", preis: 220, bed: { art: "serie", wert: 5 }, look: { fell: "#fafafa", hell: "#ffffff", dunkel: "#222222", ohren: "haengend", flecken: true },
      spiel: "Wettrennen", leckerli: "Hühnchen", trick: "Slalom durch die Beine", motto: "Jeder Punkt ist einzigartig.", fakt: "Dalmatiner-Welpen kommen fast ganz weiß auf die Welt. Die Punkte erscheinen erst in den ersten Wochen." },
    { id: "bruno", name: "Bruno", rasse: "Bernhardiner", preis: 250, bed: { art: "richtig", wert: 150 }, look: { fell: "#b5521b", hell: "#ffffff", dunkel: "#6b2d0c", ohren: "haengend", gross: 1.12, bauchWeiss: true, maske: "#6b2d0c" },
      spiel: "Kuscheln im Schnee", leckerli: "Kauknochen", trick: "Ganz still sitzen", motto: "Ich bin da, wenn du mich brauchst.", fakt: "Bernhardiner sind nach dem Hospiz am Großen Sankt Bernhard in den Schweizer Alpen benannt. Dort halfen sie, Menschen im Schnee zu finden." },
    { id: "coco", name: "Coco", rasse: "Pudel", preis: 280, bed: { art: "probe", wert: 90 }, look: { fell: "#f3e5d0", hell: "#fff8ee", dunkel: "#c9b08c", ohren: "locken", locken: true },
      spiel: "Planschen", leckerli: "Hundekekse", trick: "Tanzen auf zwei Beinen", motto: "Immer gut frisiert.", fakt: "Pudel holten früher Enten aus dem Wasser. «Pudeln» ist ein altes Wort für «im Wasser plantschen»." },
    { id: "ole", name: "Ole", rasse: "Beagle", preis: 320, bed: { art: "level", wert: 6 }, look: { fell: "#c27a3a", hell: "#ffffff", dunkel: "#3b2a20", ohren: "lang", sattel: "#3b2a20", bauchWeiss: true },
      spiel: "Spurensuche", leckerli: "Alles, was er findet", trick: "Leckerli erschnüffeln", motto: "Meine Nase weiß mehr.", fakt: "Beagles haben eine sehr feine Nase. Manche arbeiten deshalb am Flughafen und erschnüffeln verbotene Lebensmittel im Gepäck." },
    { id: "kalle", name: "Kalle", rasse: "Border Collie", preis: 360, bed: { art: "missionen", wert: 15 }, look: { fell: "#262626", hell: "#ffffff", dunkel: "#111111", ohren: "kipp", bauchWeiss: true, blesse: true },
      spiel: "Frisbee", leckerli: "Rindfleischstreifen", trick: "Zehn Spielzeuge beim Namen kennen", motto: "Gib mir eine Aufgabe!", fakt: "Border Collies hüten Schafe und gelten als besonders lernfreudig." },
    { id: "sunny", name: "Sunny", rasse: "Golden Retriever", preis: 400, bed: { art: "richtig", wert: 500 }, look: { fell: "#e3b25c", hell: "#f6d79a", dunkel: "#b8862f", ohren: "haengend" },
      spiel: "Stöckchen holen", leckerli: "Erdnussbutter-Kekse", trick: "Zeitung bringen", motto: "Jeder ist mein Freund.", fakt: "Golden Retriever stammen aus Schottland. «Retrieve» ist Englisch und heißt «zurückbringen»." },
    { id: "tiny", name: "Tiny", rasse: "Chihuahua", preis: 450, bed: { art: "serie", wert: 14 }, look: { fell: "#e2b07a", hell: "#f7dcb9", dunkel: "#9c6a3a", ohren: "riesig", klein: 0.7 },
      spiel: "In der Handtasche reisen", leckerli: "Mini-Würstchen", trick: "Drehen im Kreis", motto: "Wer braucht schon Größe?", fakt: "Der Chihuahua gilt als kleinste Hunderasse der Welt und ist nach einem Bundesstaat in Mexiko benannt." },
    { id: "berta", name: "Berta", rasse: "Berner Sennenhund", preis: 520, bed: { art: "level", wert: 10 }, look: { fell: "#1f1f1f", hell: "#ffffff", dunkel: "#111111", ohren: "haengend", gross: 1.08, bauchWeiss: true, blesse: true, backen: "#b5652b" },
      spiel: "Wanderungen in den Bergen", leckerli: "Käse", trick: "Einen Bollerwagen ziehen", motto: "Gemütlich ist schön.", fakt: "Berner Sennenhunde kommen aus der Schweiz. Früher zogen sie dort kleine Karren mit Milchkannen." },
  ];
  const freund = (id) => FREUNDE.find((f) => f.id === id) || null;
  // Längste Folge von Tagen mit Übung, irgendwann
  function besteSerie(s) {
    const tage = Object.keys(s.tage).filter((d) => s.tage[d].aufgaben > 0).sort();
    let best = 0, lauf = 0, vor = null;
    for (const d of tage) { lauf = vor && plusTage(vor, 1) === d ? lauf + 1 : 1; best = Math.max(best, lauf); vor = d; }
    return best;
  }
  // Wie weit eine Bedingung erfüllt ist: { ist, soll, ok, text }
  function bedingung(s, bed) {
    if (!bed) return { ist: 0, soll: 0, ok: true, text: "" };
    const soll = bed.wert;
    let ist = 0, text = "";
    switch (bed.art) {
      case "level": ist = level(s.punkte); text = `Level ${soll}`; break;
      case "missionen": ist = Object.keys(s.tage).filter((d) => s.tage[d].mission).length; text = `${soll} Missionen geschafft`; break;
      case "richtig": ist = Object.keys(s.tage).reduce((a, d) => a + (s.tage[d].richtig || 0), 0); text = `${soll} Aufgaben richtig gelöst`; break;
      case "serie": ist = besteSerie(s); text = `${soll} Tage in Folge geübt`; break;
      case "probe": ist = Object.keys(s.proben).reduce((a, f) => Math.max(a, ...s.proben[f].map((p) => p.prozent)), 0); text = `eine Probe-Arbeit mit ${soll} %`; break;
      case "auftraege": ist = Object.keys(s.auftraege).length; text = `${soll} Challenges geschafft`; break;
      case "freunde": ist = Object.keys(s.freunde).length; text = `${soll} Hundefreunde`; break;
    }
    return { ist: Math.min(ist, soll), soll, ok: ist >= soll, text };
  }
  function einladen(s, id, heute) {
    const f = freund(id);
    if (!f) return { ok: false, grund: "unbekannt" };
    if (s.freunde[id]) return { ok: false, grund: "schon" };
    const b = bedingung(s, f.bed);
    if (!b.ok) return { ok: false, grund: "bedingung", bed: b };
    if (s.muenzen < f.preis) return { ok: false, grund: "muenzen", fehlt: f.preis - s.muenzen };
    s.muenzen -= f.preis; s.freunde[id] = { seit: heute, herzen: 0, tag: "" }; s.besuch = id;
    return { ok: true, freund: f };
  }
  // Nach der geschafften Mission: Der Freund, der gerade zu Besuch ist, bekommt ein Herz (einmal am Tag)
  function freundschaftsTag(s, heute) {
    const f = s.besuch && s.freunde[s.besuch];
    if (!f || f.tag === heute || f.herzen >= 5) return null;
    f.herzen++; f.tag = heute;
    const geschenk = f.herzen === 5 ? LOHN.freundGeschenk : 0;
    s.muenzen += geschenk;
    return { id: s.besuch, herzen: f.herzen, geschenk };
  }
  // Outfit an- oder ausziehen; an derselben Stelle trägt der Hund immer nur ein Ding
  function anziehen(s, id) {
    const d = SHOP.zubehoer.find((x) => x.id === id);
    if (!d || !s.besitz.includes(id)) return false;
    const i = s.traegt.indexOf(id);
    if (i >= 0) { s.traegt.splice(i, 1); return true; }
    s.traegt = s.traegt.filter((x) => { const y = SHOP.zubehoer.find((z) => z.id === x); return !y || y.platz !== d.platz; });
    s.traegt.push(id);
    return true;
  }
  // Was es im Laden für dieses Tier gibt
  const laden = (art) => ({ snacks: art === "hund" ? SHOP.hund.snacks : SHOP.snacks, zubehoer: SHOP.zubehoer, zimmer: art === "hund" ? SHOP.hund.zimmer : SHOP.zimmer });
  const ALLE_SNACKS = SHOP.snacks.concat(SHOP.hund.snacks);
  const ALLE_ZIMMER = SHOP.zimmer.concat(SHOP.hund.zimmer.filter((x) => !SHOP.zimmer.some((y) => y.id === x.id)));
  const shopDing = (id) => ALLE_SNACKS.concat(SHOP.zubehoer, ALLE_ZIMMER).find((x) => x.id === id) || null;
  function kaufe(s, id) {
    const d = shopDing(id);
    if (!d) return { ok: false, grund: "unbekannt" };
    const snack = ALLE_SNACKS.includes(d);
    if (!snack && s.besitz.includes(id)) return { ok: false, grund: "schon" };
    const b = bedingung(s, d.bed);
    if (!b.ok) return { ok: false, grund: "bedingung", bed: b };
    if (s.muenzen < d.preis) return { ok: false, grund: "muenzen", fehlt: d.preis - s.muenzen };
    s.muenzen -= d.preis;
    if (snack) s.gefuettert++;
    else { s.besitz.push(id); if (SHOP.zubehoer.includes(d) && !s.traegt.includes(id)) anziehen(s, id); }
    return { ok: true, ding: d, snack };
  }
  // Level aus XP: Level n beginnt bei 50·n·(n-1) XP (100, 300, 600, 1000, 1500 …)
  const levelStart = (n) => 50 * n * (n - 1);
  function level(xp) { let n = 1; while (levelStart(n + 1) <= xp) n++; return n; }
  const RAENGE = [{ ab: 1, name: "Rookie" }, { ab: 3, name: "Explorer" }, { ab: 6, name: "Pro" }, { ab: 10, name: "Expert" }, { ab: 15, name: "Legend" }];
  const rang = (lv) => RAENGE.filter((r) => lv >= r.ab).pop().name;
  const THEMES = [
    { id: "nacht", name: "Nacht", ab: 1 }, { id: "hell", name: "Hell", ab: 1 },
    { id: "ozean", name: "Ozean", ab: 3 }, { id: "sunset", name: "Sunset", ab: 5 }, { id: "galaxy", name: "Galaxy", ab: 8 },
  ];
  // Token für eine Etappe: mindestens 80 % auf Anhieb richtig (bei 6 Aufgaben: 5)
  const tokenNoetig = (n) => Math.ceil(n * LOHN.tokenQuote);
  function spielStart(s, art, heute) {
    const t = s.tage[heute] || (s.tage[heute] = { sek: 0, aufgaben: 0, richtig: 0, etappen: 0, mission: false, spiele: 0 });
    if (s.tokens < 1) return { ok: false, grund: "tokens" };
    if ((t.spiele || 0) >= s.einst.spieleProTag) return { ok: false, grund: "limit" };
    s.tokens--; t.spiele = (t.spiele || 0) + 1; s.spiele[art].runden++;
    return { ok: true };
  }
  function spielEnde(s, art, punkte, platz) {
    if (art === "kart" && platz === 1) s.spiele.kart.siege = (s.spiele.kart.siege || 0) + 1;
    const neu = punkte > s.spiele[art].best;
    if (neu) s.spiele[art].best = Math.floor(punkte);
    return { rekord: neu };
  }
  const STUFEN = [{ ab: 0, name: "Baby" }, { ab: 300, name: "Klein" }, { ab: 1000, name: "Groß" }, { ab: 2500, name: "Held" }];
  const stufe = (punkte) => { let i = 0; STUFEN.forEach((x, j) => { if (punkte >= x.ab) i = j; }); return i; };
  // Belohnungen: Münzen nur für Richtiges auf Anhieb, Tokens nur für gute Etappen (mindestens 80 % auf Anhieb)
  const LOHN = { richtig: 1, spaeter: 0, combo: 5, comboBonus: 1, etappe: 2, mission: 3, probe: 3, auftrag: 5,
    punkteRichtig: 10, punkteSpaeter: 3, punkteEtappe: 10, punkteMission: 20, punkteAuftrag: 30, tokenQuote: 0.8,
    punkteErklaerung: 15, bossMuenzen: 2, punkteBoss: 15, freundGeschenk: 40 };
  // Mitmach-Auftrag erledigt: einmal Münzen, danach nur noch Freude
  function auftragErledigt(s, id, heute) {
    if (s.auftraege[id]) return false;
    s.auftraege[id] = heute; s.muenzen += LOHN.auftrag; s.punkte += LOHN.punkteAuftrag;
    return true;
  }

  // Erklärung bis zum Check geschafft: einmal XP je Thema
  function erklaerungGeschafft(s, id, heute) {
    if (s.gesehen[id]) return false;
    s.gesehen[id] = heute; s.punkte += LOHN.punkteErklaerung;
    return true;
  }

  const L = {
    R, hash, mischeAnders, norm, klang, lev, kern, pruefeWort, pruefeEnglisch, parseZahl, planThemen, vokabelnFach, satzLuecke, istVerb,
    TYPEN, fachTeile, teilById, auftraege, auftragErledigt, modi, modusFuerStufe, makeTask, check, alleBegriffe, gruppenListe, kategorien,
    heuteISO, tageBis, plusTage, gueltigesDatum,
    defaults, migrate, record, teilStand, bereitschaft, wackelt, sterneFuer,
    buildEtappe, buildProbe, planListe, planTag, etappenFuer,
    levelStart, level, rang, RAENGE, THEMES, tokenNoetig, spielStart, spielEnde,
    SHOP, laden, shopDing, kaufe, FREUNDE, freund, bedingung, einladen, freundschaftsTag, anziehen, besteSerie, varianten, teileVon, ueberlappt, STUFEN, stufe, LOHN, erklaerungGeschafft,
    GEO, geoSvg, gerade, geoPx: px, lageVon, imBild,
    zahlText, divSchritte, divAblauf, divAnfaenge, divPruefe, divPasst, erzeugeDivision, erzeugeDetektiv, erzeugeUeberschlag, divText, ergebnisText,
  };
  root.LN = L;
  if (typeof module !== "undefined" && module.exports) module.exports = L;
})(typeof window !== "undefined" ? window : globalThis);
