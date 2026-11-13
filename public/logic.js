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
  function pruefeEnglisch(eingabe, ziel, auch) {
    const sauber = (x) => String(x == null ? "" : x).trim().replace(/[’‘`´]/g, "'").replace(/\s+/g, " ").replace(/[!?.]+$/, "").trim();
    const kurz = (x) => x.replace(/^(to|a|an|the) /i, "");
    const e = sauber(eingabe);
    if (!e) return { ok: false, exakt: false, leer: true };
    const ziele = [ziel].concat(auch || []).map(sauber);
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
  const TYPEN = ["begriff", "frage", "zahl", "wahr", "paare", "gruppen", "reihe", "luecke", "bild", "vokabel"];
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
        const andere = vokabelnFach(fach).filter((x) => x !== k);
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
        Object.assign(t, { art: "schreiben", frage: "Schreib das englische Wort.", text: k.de, loesung: k.en, auch: k.auchEn || [], englisch: k.en, sprache: "en", textSprache: "de", anfang: wort.charAt(0) });
        t.erklaerung = t.erklaerung || k.en + " = " + k.de;
        break;
      }
      case "satz-wahl": {
        const gap = satzLuecke(k);
        // Falsche Wörter aus der anderen Wortart (Nomen gegen Verben), damit nur eine Lösung passt
        const pool = k.satzFalsch || vokabelnFach(fach).filter((x) => x !== k && x.satz && istVerb(x) !== istVerb(k)).map(satzLuecke);
        Object.assign(t, { art: "wahl", frage: "Welches Wort passt in die Lücke?", text: String(k.satz).replace(/\{[^}]+\}/, "___"), optionen: optionenMit(r, gap, pool, 4), loesung: gap, textSprache: "en", optionenSprache: "en", englisch: k.en });
        t.erklaerung = t.erklaerung || String(k.satz).replace(/[{}]/g, "") + " (" + k.en + " = " + k.de + ")";
        break;
      }
      default: return null;
    }
    if (!t.tipp) t.tipp = standardTipp(t);
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
      muenzen: 0,
      punkte: 0,
      gefuettert: 0,
      besitz: [], // gekaufte Dinge (Zubehör und Zimmer)
      traegt: [], // angezogenes Zubehör
      fortschritt: {}, // fachId -> teilId -> { box, sterne, n, ok, reihe, last }
      fehler: {}, // fachId -> [teilId]
      tage: {}, // "YYYY-MM-DD" -> { sek, aufgaben, richtig, etappen, mission }
      plan: {}, // fachId -> { start, arbeit, titel }
      proben: {}, // fachId -> [{ datum, prozent, themen }]
      einst: { etappe: 6, pauseSek: 30, pause: true, ruhig: false, vorlesen: false, toene: true, probeAnzahl: 12 },
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
    s.muenzen = Math.floor(zahl(raw.muenzen, 0, 0));
    s.punkte = Math.floor(zahl(raw.punkte, 0, 0));
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
      s.tage[t] = { sek: zahl(x.sek, 0, 0), aufgaben: Math.floor(zahl(x.aufgaben, 0, 0)), richtig: Math.floor(zahl(x.richtig, 0, 0)), etappen: Math.floor(zahl(x.etappen, 0, 0)), mission: !!x.mission };
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
      const m = modi(t.karte); const modus = m[Math.min(m.length - 1, 1 + (r.f() < 0.4 ? 1 : 0))];
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
      { id: "beeren", name: "Beeren", icon: "🫐", preis: 5 },
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
    ],
    zimmer: [
      { id: "kissen", name: "Kuschelkissen", icon: "🛏️", preis: 20 },
      { id: "teppich", name: "Teppich", icon: "🟪", preis: 25 },
      { id: "pflanze", name: "Pflanze", icon: "🪴", preis: 15 },
      { id: "lampe", name: "Lampe", icon: "💡", preis: 30 },
      { id: "bild", name: "Bild", icon: "🖼️", preis: 20 },
      { id: "ball", name: "Ball", icon: "⚽", preis: 10 },
      { id: "bastel", name: "Bastelecke", icon: "🎨", preis: 30 },
      { id: "regal", name: "Bücherregal", icon: "📚", preis: 35 },
      { id: "lichter", name: "Lichterkette", icon: "✨", preis: 40 },
    ],
  };
  const shopDing = (id) => SHOP.snacks.concat(SHOP.zubehoer, SHOP.zimmer).find((x) => x.id === id) || null;
  function kaufe(s, id) {
    const d = shopDing(id);
    if (!d) return { ok: false, grund: "unbekannt" };
    const snack = SHOP.snacks.includes(d);
    if (!snack && s.besitz.includes(id)) return { ok: false, grund: "schon" };
    if (s.muenzen < d.preis) return { ok: false, grund: "muenzen", fehlt: d.preis - s.muenzen };
    s.muenzen -= d.preis;
    if (snack) s.gefuettert++;
    else { s.besitz.push(id); if (SHOP.zubehoer.includes(d) && !s.traegt.includes(id)) s.traegt.push(id); }
    return { ok: true, ding: d, snack };
  }
  const STUFEN = [{ ab: 0, name: "Baby" }, { ab: 300, name: "Klein" }, { ab: 1000, name: "Groß" }, { ab: 2500, name: "Held" }];
  const stufe = (punkte) => { let i = 0; STUFEN.forEach((x, j) => { if (punkte >= x.ab) i = j; }); return i; };
  const LOHN = { richtig: 2, spaeter: 1, etappe: 5, mission: 10, probe: 10, auftrag: 8, punkteRichtig: 10, punkteSpaeter: 5, punkteAuftrag: 30 };
  // Mitmach-Auftrag erledigt: einmal Münzen, danach nur noch Freude
  function auftragErledigt(s, id, heute) {
    if (s.auftraege[id]) return false;
    s.auftraege[id] = heute; s.muenzen += LOHN.auftrag; s.punkte += LOHN.punkteAuftrag;
    return true;
  }

  const L = {
    R, hash, mischeAnders, norm, klang, lev, kern, pruefeWort, pruefeEnglisch, parseZahl, planThemen, vokabelnFach, satzLuecke, istVerb,
    TYPEN, fachTeile, teilById, auftraege, auftragErledigt, modi, modusFuerStufe, makeTask, check, alleBegriffe, gruppenListe, kategorien,
    heuteISO, tageBis, plusTage, gueltigesDatum,
    defaults, migrate, record, teilStand, bereitschaft, wackelt, sterneFuer,
    buildEtappe, buildProbe, planListe, planTag, etappenFuer,
    SHOP, shopDing, kaufe, STUFEN, stufe, LOHN,
  };
  root.LN = L;
  if (typeof module !== "undefined" && module.exports) module.exports = L;
})(typeof window !== "undefined" ? window : globalThis);
