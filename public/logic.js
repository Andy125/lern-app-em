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
    const t = String(s == null ? "" : s).trim().replace(/[\s  .']/g, "").replace(",", ".");
    if (!/^-?\d+(\.\d+)?$/.test(t)) return NaN;
    return Number(t);
  }

  // ---------- Inhalte ----------
  // Ein Fach hat Themen, ein Thema hat Karten. Aus jeder Karte entstehen ein oder mehrere Lernteile
  // (bei Bild, Paaren und Gruppen einer je Eintrag), jeder Lernteil hat einen eigenen Fortschritt.
  const TYPEN = ["begriff", "frage", "zahl", "wahr", "paare", "gruppen", "reihe", "luecke", "bild", "vokabel", "teilen", "detektiv", "ueberschlag", "umkehr", "kopf", "sach", "passt"];
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
    if (["teilen", "detektiv", "ueberschlag", "umkehr", "kopf", "sach", "passt"].indexOf(k.typ) >= 0) t.neueZahlen = true; // jede Wiederholung mit neuen Zahlen
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
      muenzen: 0,
      punkte: 0, // XP
      tokens: 0, // Spiel-Tokens für die Spielhalle
      spiele: { run: { best: 0, runden: 0 }, sprung: { best: 0, runden: 0 }, bloecke: { best: 0, runden: 0 } }, // bloecke: altes Spiel, bleibt für alte Stände
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
    s.muenzen = Math.floor(zahl(raw.muenzen, 0, 0));
    s.punkte = Math.floor(zahl(raw.punkte, 0, 0));
    s.tokens = Math.floor(zahl(raw.tokens, 0, 0, 99));
    if (istObj(raw.spiele)) for (const a of ["run", "sprung", "bloecke"]) if (istObj(raw.spiele[a])) s.spiele[a] = { best: Math.floor(zahl(raw.spiele[a].best, 0, 0)), runden: Math.floor(zahl(raw.spiele[a].runden, 0, 0)) };
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
    zubehoer: [
      { id: "schleife", name: "Schleife", icon: "🎀", preis: 15 },
      { id: "halstuch", name: "Halstuch", icon: "🧣", preis: 20 },
      { id: "brille", name: "Brille", icon: "👓", preis: 25 },
      { id: "muetze", name: "Mütze", icon: "🧢", preis: 30 },
      { id: "blume", name: "Blume", icon: "🌼", preis: 20 },
      { id: "krone", name: "Krone", icon: "👑", preis: 60 },
      { id: "halsband", name: "Halsband", icon: "🔵", preis: 15 },
    ],
    zimmer: [
      { id: "kissen", name: "Kuschelkissen", icon: "🛏️", preis: 20 },
      { id: "teppich", name: "Teppich", icon: "🔮", preis: 25 },
      { id: "pflanze", name: "Pflanze", icon: "🌿", preis: 15 },
      { id: "lampe", name: "Lampe", icon: "💡", preis: 30 },
      { id: "bild", name: "Bild", icon: "🖼️", preis: 20 },
      { id: "ball", name: "Ball", icon: "⚽", preis: 10 },
      { id: "bastel", name: "Bastelecke", icon: "🎨", preis: 30 },
      { id: "regal", name: "Bücherregal", icon: "📚", preis: 35 },
      { id: "lichter", name: "Lichterkette", icon: "✨", preis: 40 },
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
        { id: "napf", name: "Futter- und Wassernapf", icon: "🥣", preis: 15 },
        { id: "decke", name: "Hundedecke", icon: "🛏️", preis: 20 },
        { id: "korb", name: "Hundekorb", icon: "🧺", preis: 30 },
        { id: "ball", name: "Ball", icon: "⚽", preis: 10 },
        { id: "kauseil", name: "Kauseil", icon: "➰", preis: 12 },
        { id: "ente", name: "Quietsche-Ente", icon: "🐤", preis: 12 },
        { id: "frisbee", name: "Frisbee", icon: "🥏", preis: 15 },
        { id: "kuscheltier", name: "Kuscheltier", icon: "🧸", preis: 18 },
        { id: "leine", name: "Leine am Haken", icon: "🔗", preis: 10 },
      ],
    },
  };
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
    if (s.muenzen < d.preis) return { ok: false, grund: "muenzen", fehlt: d.preis - s.muenzen };
    s.muenzen -= d.preis;
    if (snack) s.gefuettert++;
    else { s.besitz.push(id); if (SHOP.zubehoer.includes(d) && !s.traegt.includes(id)) s.traegt.push(id); }
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
  function spielEnde(s, art, punkte) {
    const neu = punkte > s.spiele[art].best;
    if (neu) s.spiele[art].best = Math.floor(punkte);
    return { rekord: neu };
  }
  const STUFEN = [{ ab: 0, name: "Baby" }, { ab: 300, name: "Klein" }, { ab: 1000, name: "Groß" }, { ab: 2500, name: "Held" }];
  const stufe = (punkte) => { let i = 0; STUFEN.forEach((x, j) => { if (punkte >= x.ab) i = j; }); return i; };
  // Belohnungen: Münzen nur für Richtiges auf Anhieb, Tokens nur für gute Etappen (mindestens 80 % auf Anhieb)
  const LOHN = { richtig: 1, spaeter: 0, combo: 5, comboBonus: 1, etappe: 2, mission: 3, probe: 3, auftrag: 5,
    punkteRichtig: 10, punkteSpaeter: 3, punkteEtappe: 10, punkteMission: 20, punkteAuftrag: 30, tokenQuote: 0.8,
    punkteErklaerung: 15, bossMuenzen: 2, punkteBoss: 15 };
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
    SHOP, laden, shopDing, kaufe, varianten, teileVon, ueberlappt, STUFEN, stufe, LOHN, erklaerungGeschafft,
    zahlText, divSchritte, divAblauf, divAnfaenge, divPruefe, divPasst, erzeugeDivision, erzeugeDetektiv, erzeugeUeberschlag, divText, ergebnisText,
  };
  root.LN = L;
  if (typeof module !== "undefined" && module.exports) module.exports = L;
})(typeof window !== "undefined" ? window : globalThis);
