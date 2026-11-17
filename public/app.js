// Lernnest: Oberfläche. Logik steht in logic.js, das Tier in begleiter.js, Inhalte in inhalte-*.js.
(function () {
  "use strict";
  const L = window.LN, TIER = window.LN_TIER, VER = window.LN_VERSION || { n: 0, date: "" };
  const FAECHER = window.LN_FAECHER || [];
  const TEST = window.__LN_TEST || {}; // Testschalter, nur in den automatischen Tests gesetzt
  const KEY = "lernnest-v1", BAK = KEY + "-bak", VOR = KEY + "-vor-laden";
  const app = document.getElementById("app");

  // ================= Speicher: nie verlieren =================
  // Hauptschlüssel, zweite Kopie, IndexedDB-Spiegel und eine Sicherungsdatei zum Speichern und Laden.
  const readKey = (k) => {
    try { const t = localStorage.getItem(k); if (!t) return null; const o = JSON.parse(t); return o && typeof o === "object" && !Array.isArray(o) ? o : null; }
    catch (e) { try { localStorage.setItem(k + "-defekt", localStorage.getItem(k)); } catch (e2) { /* egal */ } return null; }
  };
  function idb(fn) {
    try {
      const q = indexedDB.open("lernnest-save", 1);
      q.onupgradeneeded = () => q.result.createObjectStore("s");
      q.onsuccess = () => { try { fn(q.result); } catch (e) { /* ohne IndexedDB weiter */ } };
      q.onerror = () => fn(null);
    } catch (e) { fn(null); }
  }
  const idbSchreiben = (text) => idb((db) => { if (db) db.transaction("s", "readwrite").objectStore("s").put(text, "stand"); });
  const idbLesen = (cb) => idb((db) => { if (!db) return cb(null); const g = db.transaction("s").objectStore("s").get("stand"); g.onsuccess = () => cb(g.result || null); g.onerror = () => cb(null); });
  let quelle = "haupt";
  function laden() {
    let roh = readKey(KEY);
    if (!roh) { roh = readKey(BAK); quelle = roh ? "kopie" : "neu"; }
    return L.migrate(roh);
  }
  let S = laden();
  let idbTimer = null;
  function speichern() {
    if (TEST.einfrieren) return; // nur in Tests: Speicher von außen verändert, nicht überschreiben
    try {
      const t = JSON.stringify(S);
      localStorage.setItem(KEY, t); localStorage.setItem(BAK, t);
      clearTimeout(idbTimer); idbTimer = setTimeout(() => idbSchreiben(t), 250);
    } catch (e) { /* voll oder privat */ }
    versionAnzeigen();
  }
  if (quelle === "kopie") speichern();
  if (quelle === "neu") idbLesen((t) => {
    if (!t || S.erstellt) return;
    try { const o = JSON.parse(t); if (o && o.erstellt) { S = L.migrate(o); speichern(); ui = startUi(); render(); toast("Dein Spielstand ist wieder da."); } } catch (e) { /* egal */ }
  });
  window.addEventListener("pagehide", () => { if (TEST.einfrieren) return; zeitBuchen(); try { const t = JSON.stringify(S); localStorage.setItem(KEY, t); localStorage.setItem(BAK, t); idbSchreiben(t); } catch (e) { /* egal */ } });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") { zeitBuchen(); speichern(); if (spielCtrl) spielCtrl.pause(true); }
    else if (spielCtrl && spielCtrl.pausiert) zeigePause();
  });
  function zeigePause() {
    const box = app.querySelector(".spiel"); if (!box || box.querySelector(".spiel-ende")) return;
    const el = document.createElement("div"); el.className = "spiel-ende";
    el.innerHTML = `<div class="dialog"><h2>Pause</h2><div class="knopfzeile" style="justify-content:center"><button class="btn haupt" data-act="spiel-weiter">Weiter</button></div></div>`;
    box.appendChild(el);
  }

  function sicherungSpeichern() {
    const daten = JSON.stringify({ app: "lernnest", version: VER.n, gespeichert: new Date().toISOString(), stand: S });
    const name = "lernnest-sicherung-" + L.heuteISO() + ".json";
    const blob = new Blob([daten], { type: "application/json" });
    const fertig = () => { S.lastBackup = Date.now(); speichern(); toast("Sicherung gespeichert."); if (ui.ansicht === "eltern") render(); };
    try {
      const file = new File([blob], name, { type: "application/json" });
      if (!TEST.download && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: "Lernnest-Sicherung" }).then(fertig, () => toast("Nicht gespeichert.")); return; }
    } catch (e) { /* dann als Download */ }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    fertig();
  }
  function sicherungAusText(text) {
    const o = JSON.parse(String(text).trim());
    const st = o && o.app === "lernnest" && o.stand && typeof o.stand === "object" ? o.stand : null;
    if (!st) throw new Error("keine Sicherung");
    try { localStorage.setItem(VOR, JSON.stringify(S)); } catch (e) { /* egal */ }
    S = L.migrate(st); speichern(); idbSchreiben(JSON.stringify(S));
    ui = startUi(); render(); toast("Sicherung geladen.");
  }
  function sicherungLaden(file) {
    const r = new FileReader();
    r.onload = () => { try { sicherungAusText(r.result); } catch (e) { toast("Diese Datei ist keine Lernnest-Sicherung."); } };
    r.readAsText(file);
  }

  // ================= Hilfen =================
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const heute = () => TEST.heute || L.heuteISO();
  let zs = TEST.seed != null ? TEST.seed >>> 0 : 0;
  const zufall = () => (TEST.seed != null ? (zs = (Math.imul(zs, 1103515245) + 12345) >>> 0) : Math.floor(Math.random() * 4294967296) >>> 0);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const tierName = () => (S.tier && S.tier.name) || "dein Tier";
  // Name des Hundes zu Hause für die Warum-Texte: aus den Eltern-Einstellungen, sonst der Name des Tiers, wenn es ein Hund ist
  const hundName = () => (S.hund || (S.tier && S.tier.art === "hund" && S.tier.name) || "").trim();
  const mitHund = (text, html) => {
    const n = html ? esc(hundName()) : hundName();
    return String(text).replace(/\{hund3\}/g, () => n || "deinem Hund").replace(/\{hund\}/g, () => n || "dein Hund");
  };
  const fach = () => FAECHER.find((f) => f.id === S.fach) || FAECHER[0];
  const fachById = (id) => FAECHER.find((f) => f.id === id) || null;
  // Fach der laufenden Runde (die gemeinsame Mission mischt Fächer), sonst das gewählte Fach
  const rf = () => (ui && ui.runde && fachById(ui.runde.fachId)) || fach();
  const tag = () => { const d = heute(); return S.tage[d] || (S.tage[d] = { sek: 0, aufgaben: 0, richtig: 0, etappen: 0, mission: false, spiele: 0 }); };
  const tagLesen = () => S.tage[heute()] || { sek: 0, aufgaben: 0, richtig: 0, etappen: 0, mission: false, spiele: 0 };

  function toast(text) {
    document.querySelectorAll(".toast").forEach((x) => x.remove()); // nie mehrere übereinander
    const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = text;
    document.body.appendChild(t); setTimeout(() => t.classList.add("weg"), 2400); setTimeout(() => t.remove(), 2900);
  }
  let ac = null;
  function ton(stufe) {
    if (!S.einst.toene) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime;
      o.type = "triangle"; o.frequency.value = 523.25 * Math.pow(2, Math.min(stufe, 12) / 12);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
      o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + 0.4);
    } catch (e) { /* ohne Ton */ }
  }
  // sprich("Text") liest deutsch; sprich([["Text", "de"], ["dog", "en"]]) liest Teile in verschiedenen Sprachen
  function sprich(teile) {
    try {
      if (!("speechSynthesis" in window) || !teile) return;
      if (!Array.isArray(teile)) teile = [[teile, "de"]];
      speechSynthesis.cancel();
      const stimmen = speechSynthesis.getVoices();
      for (const [text, lang] of teile) {
        if (!text) continue;
        const u = new SpeechSynthesisUtterance(mitHund(text));
        u.lang = lang === "en" ? "en-GB" : "de-DE"; u.rate = lang === "en" ? 0.85 : 0.95;
        const v = stimmen.find((x) => x.lang === u.lang) || stimmen.find((x) => x.lang.slice(0, 2) === u.lang.slice(0, 2)); if (v) u.voice = v;
        speechSynthesis.speak(u);
      }
    } catch (e) { /* ohne Vorlesen */ }
  }
  function konfetti() {
    if (S.einst.ruhig) return;
    const box = document.createElement("div"); box.className = "konfetti"; box.setAttribute("aria-hidden", "true");
    const farben = ["#f94144", "#f9c74f", "#90be6d", "#577590", "#f3722c", "#43aa8b", "#f8961e"];
    for (let i = 0; i < 46; i++) { const s = document.createElement("i"); s.style.left = Math.random() * 100 + "%"; s.style.background = pick(farben); s.style.animationDelay = Math.random() * 0.35 + "s"; s.style.setProperty("--dreh", Math.floor(Math.random() * 720) + "deg"); box.appendChild(s); }
    document.body.appendChild(box); setTimeout(() => box.remove(), 2600);
  }
  function plusAnzeigen(text) {
    if (S.einst.ruhig) return;
    const z = document.querySelector(".muenzen"); if (!z) return;
    const r = z.getBoundingClientRect();
    const p = document.createElement("div"); p.className = "plus"; p.textContent = text; p.style.left = r.left + "px"; p.style.top = r.bottom + "px";
    document.body.appendChild(p); setTimeout(() => p.remove(), 1200);
  }
  let letzteAktion = 0;
  function zeitBuchen() { const t = Date.now(); if (letzteAktion) tag().sek += Math.min(90, (t - letzteAktion) / 1000); letzteAktion = ui && ui.ansicht === "runde" ? t : 0; }

  const LOB = ["Richtig.", "Stark.", "Läuft.", "Sauber.", "Genau.", "Nice.", "Treffer.", "Top."];
  const LOB_SPAETER = ["Jetzt passt es.", "Gut korrigiert.", "Geschafft."];
  const FAST = ["Fast. Schau noch mal genau hin.", "Knapp daneben.", "Noch nicht ganz. Der Tipp hilft."];
  const LOESUNG = ["So ist es richtig:", "Das war knifflig. So geht es:"];
  const BEWEGUNG = [
    "Steh auf und streck dich ganz hoch, als wolltest du die Decke berühren.",
    "Hüpfe 10-mal auf der Stelle.",
    "Mach 5 Hampelmänner.",
    "Kreise deine Schultern 5-mal nach hinten und 5-mal nach vorn.",
    "Stell dich auf ein Bein und zähle bis 10. Dann das andere Bein.",
    "Schüttle deine Hände und Füße kräftig aus.",
    "Trink einen Schluck Wasser und atme dreimal tief ein und aus.",
    "Lauf einmal durch das Zimmer und wieder zurück.",
    "Mach dich ganz klein wie eine Maus und dann ganz groß wie ein Riese. Dreimal!",
  ];
  const GRUSS = ["Hey {name}", "Hi {name}", "Hey {name}, bereit?"];
  const TOKEN = `<svg class="token" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.8 21 7v10l-9 5.2L3 17V7z" fill="#5FDDBE" stroke="#2fa88a" stroke-width="1.4"/><path d="M12 6.2 16.8 9v6L12 17.8 7.2 15V9z" fill="#2fa88a"/><path d="M10.2 9.4 14.6 12l-4.4 2.6z" fill="#e9fff8"/></svg>`;
  const level = () => L.level(S.punkte);
  // Vorschau der Designs: Hintergrund, Schrift, Akzent (wie in style.css)
  const THEME_FARBEN = { nacht: ["#1E1B36", "#F3F0FF", "#F2773A"], hell: ["#F3F1FA", "#1E1B36", "#E5662A"], ozean: ["#0F2A33", "#E8FBFF", "#FFB347"], sunset: ["#2A1630", "#FFF0F5", "#FF8A5B"], galaxy: ["#0E1030", "#EEF0FF", "#FF5FA2"] };
  const fuell = (s) => s.replace("{name}", esc(S.name || "du")).replace("{tier}", esc(tierName()));

  // ================= Plan =================
  function arbeitInfo(f) {
    const p = S.plan[f.id] || {};
    return { datum: p.arbeit || (f.arbeit && f.arbeit.datum) || null, titel: p.titel || (f.arbeit && f.arbeit.titel) || "die Arbeit", start: p.start || null };
  }
  function heutigerPlan(f) {
    const a = arbeitInfo(f);
    if (a.datum && !a.start) { const p = S.plan[f.id] || (S.plan[f.id] = { start: null, arbeit: null, titel: "" }); p.start = heute(); speichern(); a.start = p.start; }
    const p = L.planTag(a.start, a.datum, L.planThemen(f).map((t) => t.id), heute());
    // Ohne Datum: ein Thema nach dem anderen, bis es halbwegs sitzt (dann das nächste)
    if (!a.datum) { const fokus = L.planThemen(f).find((t) => L.bereitschaft(S, f, t.id) < 60); if (fokus) return Object.assign({}, p, { art: "lernen", themen: [fokus.id] }); }
    return p;
  }
  function fakt(f, themen, nr) {
    const liste = f.themen.filter((t) => !themen || themen.includes(t.id)).flatMap((t) => t.fakten || []);
    return liste.length ? liste[Math.abs(nr) % liste.length] : "";
  }
  function warumBox(th) {
    if (!th || !th.warum) return "";
    return `<section class="warum-box"><h2>🐶 ${esc(th.warum.frage)}</h2><p>${esc(th.warum.text)}</p></section>`;
  }
  const themaName = (f, id) => (f.themen.find((t) => t.id === id) || { name: id }).name;
  function planText(f, p) {
    const th = (p.themen || []).map((id) => themaName(f, id)).join(", ");
    switch (p.art) {
      case "lernen": return "Heute neu: " + th;
      case "mix": return "Heute: alles gemischt üben";
      case "probe": return "Heute: Probe-Arbeit und Schwaches stärken";
      case "wiederholen": return "Heute: in Ruhe wiederholen";
      case "mut": return "Heute ist die Arbeit. Eine kurze Mutmacher-Runde!";
      case "frei": return "Die Arbeit ist vorbei. Üben macht trotzdem Spaß!";
    }
    return "";
  }

  // Gemeinsame Tagesmission über alle Fächer: Das Fach mit der nächsten Arbeit bekommt den Schwerpunkt
  // (Neues und Festigen), ein anderes Fach wird zum Aufwärmen wiederholt. Kurz vor einer Arbeit nur dieses Fach.
  function missionHeute() {
    const liste = FAECHER.map((f, i) => { const a = arbeitInfo(f); const d = a.datum ? L.tageBis(heute(), a.datum) : null; return { f, i, p: heutigerPlan(f), d: d != null && d >= 0 ? d : null }; });
    liste.sort((x, y) => (x.d == null ? 9999 : x.d) - (y.d == null ? 9999 : y.d) || x.i - y.i);
    // Gleich nahe Arbeit (zum Beispiel beide ohne Datum): Schwerpunkt wechselt jeden Tag
    const gleich = liste.filter((x) => x.d === liste[0].d);
    const h = gleich[((L.tageBis("2026-01-01", heute()) % gleich.length) + gleich.length) % gleich.length];
    const etappen = L.etappenFuer(h.p).map((e) => Object.assign({}, e, { fach: h.f.id }));
    const knapp = h.d != null && h.d <= 2;
    const n = liste.find((x) => x !== h);
    if (n && !knapp && etappen.length === 3) {
      const nt = n.p.art === "lernen" ? n.p.themen : null;
      const gesehen = L.fachTeile(n.f).some((t) => L.teilStand(S, n.f.id, t.id).n > 0);
      etappen[0] = { titel: "Aufwärmen", art: gesehen ? "wdh" : "neu", themen: gesehen ? null : (nt || [L.planThemen(n.f)[0].id]), fach: n.f.id };
    }
    return { etappen, haupt: h, neben: n, knapp };
  }
  const fachKurz = (id) => { const f = fachById(id); return f ? (f.kurz || f.name) : ""; };

  // ================= Zustand der Oberfläche =================
  let ui;
  const startUi = () => ({ ansicht: S.erstellt ? "start" : "willkommen", schritt: 1 });
  ui = startUi();
  const gehe = (ansicht, extra) => { zeitBuchen(); ui = Object.assign({ ansicht }, extra || {}); render(); window.scrollTo(0, 0); };

  // ================= Kopfzeile =================
  function kopf(titel, zurueck) {
    const tabs = FAECHER.length > 1 && ui.ansicht === "start"
      ? `<nav class="faecher">${FAECHER.map((f) => `<button class="fach-tab${f === fach() ? " aktiv" : ""}" data-act="fach" data-arg="${esc(f.id)}">${esc(f.icon)} ${esc(f.kurz || f.name)}</button>`).join("")}</nav>`
      : `<h1 class="titel">${zurueck ? `<button class="zurueck" data-act="heim" aria-label="Zurück">‹</button>` : ""}${esc(titel || "Lernnest")}</h1>`;
    return `<header class="kopf">${tabs}<div class="chips"><span class="chip level" aria-label="Level ${level()}">Lv ${level()}</span><span class="chip tokens" aria-label="${S.tokens} Tokens">${TOKEN} <b>${S.tokens}</b></span><div class="muenzen" aria-label="${S.muenzen} Münzen">${TIER.muenze()} <b>${S.muenzen}</b></div></div></header>`;
  }

  // ================= Willkommen =================
  function willkommen() {
    if (ui.schritt === 1) return `<main class="mitte willkommen">
      <div class="gross-tier">${TIER.tierSvg("katze", { mood: "jubel" })}</div>
      <h1>Hallo! Wie heißt du?</h1>
      <input id="name" class="eingabe" maxlength="20" autocomplete="off" autocapitalize="words" placeholder="Dein Vorname" value="${esc(S.name)}">
      <button class="btn haupt" data-act="w-name">Weiter</button></main>`;
    if (ui.schritt === 2) return `<main class="mitte willkommen">
      <h1>Such dir ein Tier aus, ${esc(S.name)}!</h1>
      <p class="leise">Es begleitet dich durch die App und rennt in der Spielhalle. Mit Münzen kaufst du Futter, Outfits und Sachen fürs Zimmer.</p>
      <div class="tierwahl">${Object.keys(TIER.ARTEN).map((a) => `<button class="tierkarte${ui.art === a ? " aktiv" : ""}" data-act="w-tier" data-arg="${a}">${TIER.tierSvg(a, { stufe: 1 })}<span>${TIER.ARTEN[a].name}</span></button>`).join("")}</div>
      <button class="btn haupt" data-act="w-tier-ok" ${ui.art ? "" : "disabled"}>Weiter</button></main>`;
    return `<main class="mitte willkommen">
      <div class="gross-tier">${TIER.tierSvg(ui.art, { mood: "jubel" })}</div>
      <h1>Wie soll dein${ui.art === "katze" ? "e" : ""} ${TIER.ARTEN[ui.art].name} heißen?</h1>
      <input id="tiername" class="eingabe" maxlength="20" autocomplete="off" autocapitalize="words" placeholder="Name für dein Tier">
      <button class="btn haupt" data-act="w-fertig">Fertig</button></main>`;
  }

  // ================= Startseite =================
  function start() {
    const f = fach();
    const p = heutigerPlan(f);
    const t = tagLesen();
    const m = missionHeute();
    const etappen = m.etappen;
    const fertig = t.mission;
    const kiste = (S.fehler[f.id] || []).length;
    // Countdown für jede anstehende Arbeit, die nächste zuerst
    const countdown = FAECHER.map((x) => ({ x, a: arbeitInfo(x) })).filter((o) => o.a.datum && L.tageBis(heute(), o.a.datum) >= 0)
      .sort((u, v) => L.tageBis(heute(), u.a.datum) - L.tageBis(heute(), v.a.datum)).slice(0, 2).map(({ a }) => {
        const d = L.tageBis(heute(), a.datum);
        return d > 1 ? `Noch <b>${d} Tage</b> bis «${esc(a.titel)}»` : d === 1 ? `Morgen ist «${esc(a.titel)}». Heute nur in Ruhe wiederholen.` : `Heute ist «${esc(a.titel)}». Du hast gut geübt, du schaffst das!`;
      }).join("<br>");
    const mehrere = new Set(etappen.map((e) => e.fach)).size > 1 || FAECHER.length > 1;
    const hp = m.haupt.p, hf = m.haupt.f;
    const kurzPlan = { lernen: () => `Neues zu «${(hp.themen || []).map((id) => themaName(hf, id)).join(", ")}»`, mix: () => "alles gemischt üben", probe: () => "Probe-Arbeit und Schwaches stärken", wiederholen: () => "in Ruhe wiederholen" }[hp.art];
    const missionText = !mehrere || !kurzPlan ? esc(planText(hf, hp))
      : (m.neben && etappen[0].fach !== hf.id ? `Zum Aufwärmen ${esc(fachKurz(etappen[0].fach))}, dann ` : "") + esc(fachKurz(hf.id) + ": " + kurzPlan());
    const punkte = etappen.map((e, i) => `<span class="etappe-punkt${fertig || i < t.etappen ? " fertig" : ""}" title="${esc(e.titel)}">${fertig || i < t.etappen ? "✓" : i + 1}</span>`).join("");
    const knopf = fertig ? "Bonus-Runde" : t.etappen > 0 ? `Weiter mit Etappe ${t.etappen + 1}` : "Start";
    const lv = level(), von = L.levelStart(lv), bis = L.levelStart(lv + 1);
    const serie = streak();
    const tageWoche = Object.keys(S.tage).filter((d) => L.tageBis(d, heute()) < 7 && L.tageBis(d, heute()) >= 0 && S.tage[d].aufgaben > 0).length;
    const fk = fakt(f, p.themen, L.tageBis("2026-01-01", heute()));
    const spieleHeute = (tagLesen().spiele || 0), rest = Math.max(0, S.einst.spieleProTag - spieleHeute);
    return `${kopf()}<main class="start">
      ${f.beispiel ? `<p class="hinweis">Beispielinhalt zum Ausprobieren. Die echten Aufgaben kommen bald.</p>` : ""}
      <section class="profil-kopf">
        <button class="avatar" data-act="tier" aria-label="Zu ${esc(tierName())}">${TIER.tierSvg(S.tier.art, { stufe: L.stufe(S.punkte), traegt: S.traegt })}</button>
        <div class="profil-text">
          <h1 class="hallo">${fuell(GRUSS[L.tageBis("2026-01-01", heute()) % GRUSS.length])}</h1>
          <div class="level-zeile"><b>Level ${lv}</b><span>${esc(L.rang(lv))}</span><span>${S.punkte - von} von ${bis - von} XP</span></div>
          <div class="xp-balken" aria-hidden="true"><i style="width:${Math.round((100 * (S.punkte - von)) / (bis - von))}%"></i></div>
        </div>
        ${serie > 1 ? `<div class="streak" aria-label="${serie} Tage in Folge geübt">🔥 ${serie}</div>` : ""}
      </section>
      ${countdown ? `<p class="countdown">${countdown}</p>` : ""}
      <section class="mission">
        <div><h2>${fertig ? "Mission geschafft" : "Mission"}</h2>
        <p>${fertig ? `Für heute erledigt. Bonus-Runde für mehr XP: ${missionText}` : missionText}</p>
        <div class="etappen-punkte" aria-label="Etappen">${punkte}</div></div>
        <button class="btn gross mission-knopf" data-act="mission">${knopf}</button>
      </section>
      <section class="duo">
        <article class="arcade">
          <h2>Spielhalle</h2>
          <div class="tokens-gross">${TOKEN} ${S.tokens}</div>
          <p>${!S.einst.spieleProTag ? "Die Spielhalle ist gerade ausgeschaltet." : S.tokens ? (rest ? `Ein Token ist eine Runde. Heute gehen noch ${rest}.` : "Für heute ist die Spielhalle zu.") : `Tokens gibt es für Etappen mit ${L.tokenNoetig(S.einst.etappe)} von ${S.einst.etappe} auf Anhieb richtig.`}</p>
          <div class="knopfzeile"><button class="btn" data-act="spielhalle">Zur Spielhalle</button></div>
        </article>
        <article class="hund-karte" data-act="tier" role="button" tabindex="0" aria-label="Zu ${esc(tierName())}">
          <div class="hund-name"><span class="mini-avatar">${TIER.tierSvg(S.tier.art, { stufe: L.stufe(S.punkte), traegt: S.traegt })}</span>${esc(tierName())}</div>
          <div class="sprechblase">${fk ? `<b>Fun Fact:</b> ${esc(fk)}` : "Tipp: Füttere mich mit deinen Münzen."}</div>
        </article>
      </section>
      <section class="kacheln">
        <button class="kachel" data-act="themen"><span>🎯</span>Üben</button>
        <button class="kachel" data-act="kiste" ${kiste ? "" : "disabled"}><span>🧩</span>Fehler${kiste ? ` <b class="zahl-badge">${kiste}</b>` : ""}</button>
        <button class="kachel" data-act="karten"><span>📖</span>Karten</button>
        <button class="kachel" data-act="probe-start"><span>📝</span>Probe</button>
        ${(() => { const a = L.auftraege(f); const offen = a.filter((x) => !S.auftraege[x.id]).length; return a.length ? `<button class="kachel" data-act="auftraege"><span>⚡</span>Challenges${offen ? ` <b class="zahl-badge">${offen}</b>` : ""}</button>` : ""; })()}
      </section>
      <footer class="fuss">
        <span>${tageWoche ? `Diese Woche an ${tageWoche} ${tageWoche === 1 ? "Tag" : "Tagen"} geübt` : "Neue Woche, neue XP."}</span>
        <button id="eltern-knopf" class="eltern-knopf" type="button" aria-label="Für Eltern: gedrückt halten"><span class="fuell"></span><span class="text">Für Eltern: gedrückt halten</span></button>
      </footer></main>`;
  }
  // Tage in Folge mit Übung (heute zählt, wenn schon geübt; sonst ab gestern)
  function streak() {
    let n = 0, d = heute();
    if (!(S.tage[d] && S.tage[d].aufgaben > 0)) d = L.plusTage(d, -1);
    while (S.tage[d] && S.tage[d].aufgaben > 0) { n++; d = L.plusTage(d, -1); }
    return n;
  }

  // ================= Runden =================
  // Eine Runde besteht aus Etappen; jede Etappe hat einige Aufgaben. Mission = 3 Etappen mit Bewegungspause.
  function starteRunde(typ, etappen, titel) {
    ui = { ansicht: "etappe-start", runde: { typ, titel, etappen, nr: 0, mission: typ === "mission" && !tag().mission } };
    if (ui.runde.mission) ui.runde.nr = Math.min(tag().etappen, etappen.length - 1);
    render();
  }
  function bereiteEtappe() {
    const R = ui.runde, e = R.etappen[R.nr], f = fachById(e.fach) || fach();
    R.fachId = f.id;
    const n = e.n || S.einst.etappe;
    R.specs = L.buildEtappe(f, S, { n, seed: zufall(), art: e.art, themen: e.themen });
    R.i = -1; R.richtig = 0; R.ersteRichtig = 0; R.serie = 0; R.nochmal = 0; R.muenzenStart = S.muenzen;
    R.anzahl = R.specs.length; R.xpStart = S.punkte; R.levelStart = L.level(S.punkte); R.tokensStart = S.tokens;
    if (!R.specs.length) { toast("Hier gibt es gerade nichts zu üben."); gehe("start"); return false; }
    return true;
  }
  function naechsteAufgabe() {
    const R = ui.runde; R.i++;
    if (R.i >= R.specs.length) return etappeFertig();
    const s = R.specs[R.i];
    R.task = L.makeTask(rf(), s.teil, s.modus, s.seed);
    if (!R.task) return naechsteAufgabe();
    R.versuche = 0; R.status = "offen"; R.antwort = startAntwort(R.task); R.wahl = null; R.falsch = []; R.tippOffen = false;
    ui.ansicht = "runde"; letzteAktion = Date.now();
    render();
    if (S.einst.vorlesen) vorlesen();
  }
  function startAntwort(t) {
    switch (t.art) {
      case "reihe": return t.items.map(() => null);
      case "luecke": return t.loesung.map(() => null);
      case "paare": return {};
      case "mehr": return [];
      default: return "";
    }
  }
  const maxVersuche = (t) => (t.art === "wahr" || (t.art === "wahl" && t.optionen.length <= 2) ? 1 : 2);

  function pruefe(antwort) {
    const R = ui.runde, t = R.task, f = rf();
    if (R.status !== "offen" && R.status !== "tipp") return;
    const r = L.check(t, antwort);
    if (!r.ok && r.leer) { toast("Schreib zuerst etwas hinein."); return; }
    zeitBuchen();
    const T = tag();
    if (r.ok) {
      const erster = R.versuche === 0 && !R.tippOffen;
      if (R.versuche === 0) L.record(S, f.id, t.teil, erster, heute());
      R.status = "richtig"; R.richtig++;
      R.serie = erster ? R.serie + 1 : 0;
      // Auf Anhieb zählt nur bei den Aufgaben der Etappe, nicht bei den wiederholten
      if (erster && !(R.specs[R.i] && R.specs[R.i].nochmal)) R.ersteRichtig++;
      let m = erster ? L.LOHN.richtig : L.LOHN.spaeter;
      if (erster && R.serie > 0 && R.serie % L.LOHN.combo === 0) m += L.LOHN.comboBonus;
      S.muenzen += m; S.punkte += erster ? L.LOHN.punkteRichtig : L.LOHN.punkteSpaeter;
      T.aufgaben++; T.richtig++;
      R.lob = R.versuche === 0 ? pick(LOB) : pick(LOB_SPAETER);
      R.exakt = r.exakt !== false;
      ton(R.serie);
      speichern(); render(); if (m) plusAnzeigen("+" + m);
      if (S.einst.vorlesen && t.englisch) sprich([[t.englisch, "en"]]);
      return;
    }
    R.versuche++; R.serie = 0;
    R.hinweis = r.grossKlein ? "Achte auf Groß- und Kleinschreibung: Englische Nomen schreibt man klein." : r.fast ? "Ganz knapp! Ein kleiner Schreibfehler, schau genau auf jeden Buchstaben." : "";
    if (R.versuche === 1) L.record(S, f.id, t.teil, false, heute());
    // Teilweise Richtiges bleibt stehen, Falsches wird zurückgelegt
    if (t.art === "wahl" || t.art === "tippen") R.falsch.push(antwort);
    if (t.art === "reihe") R.antwort = R.antwort.map((x, i) => (r.richtig[i] ? x : null));
    if (t.art === "luecke") R.antwort = R.antwort.map((x, i) => (r.richtig[i] ? x : null));
    if (t.art === "paare") { const neu = {}; for (const l of Object.keys(R.antwort)) if (!r.falsch.includes(l)) neu[l] = R.antwort[l]; R.antwort = neu; R.wahl = null; }
    if (t.art === "mehr") { R.falsch = r.falsch; R.antwort = R.antwort.filter((x) => !r.falsch.includes(x)); R.fehlt = r.fehlt.length > 0; }
    if (R.versuche >= maxVersuche(t)) {
      R.status = "loesung"; R.text = pick(LOESUNG);
      T.aufgaben++;
      // Gleich noch einmal üben: am Ende der Etappe mit neuem Startwert (höchstens zweimal pro Etappe)
      if (R.nochmal < 2) { R.nochmal++; R.specs.push({ teil: t.teil, modus: t.modus, seed: zufall(), nochmal: true }); }
    } else { R.status = "tipp"; R.text = pick(FAST); }
    speichern(); render();
  }
  // Belohnung nach Leistung: Token nur mit 80 % auf Anhieb, Münzen ab der Hälfte, Mission gibt einen Token extra
  function etappeFertig() {
    const R = ui.runde;
    const anzahl = R.anzahl || R.specs.length;
    const quote = anzahl ? R.ersteRichtig / anzahl : 0;
    const b = { quote, ersteRichtig: R.ersteRichtig, anzahl, muenzen: 0, xp: 0, tokens: 0, noetig: L.tokenNoetig(anzahl) };
    if (quote >= 0.5) { S.muenzen += L.LOHN.etappe; }
    if (quote >= 0.8) { S.punkte += L.LOHN.punkteEtappe; }
    if (R.ersteRichtig >= b.noetig && R.typ !== "kiste") { S.tokens += 1; b.tokens += 1; }
    const missionFertig = R.mission && R.nr + 1 >= R.etappen.length;
    if (R.mission) {
      const T = tag(); T.etappen = Math.max(T.etappen, R.nr + 1);
      if (missionFertig) { T.mission = true; S.muenzen += L.LOHN.mission; S.punkte += L.LOHN.punkteMission; S.tokens += 1; b.tokens += 1; }
    }
    b.muenzen = S.muenzen - R.muenzenStart; b.xp = S.punkte - R.xpStart;
    R.belohnung = b;
    speichern();
    ui.ansicht = missionFertig ? "mission-ende" : R.nr + 1 < R.etappen.length ? "etappe-ende" : "runde-ende";
    letzteAktion = 0;
    pruefeLevelUp(R.levelStart);
    render(); if (missionFertig || ui.levelUp) konfetti(); ton(12);
  }
  function pruefeLevelUp(vorher) {
    const jetzt = L.level(S.punkte);
    if (jetzt > vorher) ui.levelUp = { n: jetzt, rang: L.rang(jetzt), neu: L.THEMES.filter((t) => t.ab > vorher && t.ab <= jetzt).map((t) => t.name) };
  }
  function belohnungHtml(b) {
    if (!b) return "";
    return `<div class="belohnung">${b.xp ? `<span>+${b.xp} XP</span>` : ""}${b.muenzen ? `<span>+${b.muenzen} ${TIER.muenze()}</span>` : ""}${b.tokens ? `<span class="neu">+${b.tokens} ${TOKEN}</span>` : ""}</div>`;
  }

  function rundeKopf() {
    const R = ui.runde;
    const e = R.etappen[R.nr];
    const titel = (FAECHER.length > 1 ? rf().icon + " " : "") + (R.typ === "probe" ? "Probe-Arbeit" : R.etappen.length > 1 ? `Etappe ${R.nr + 1} von ${R.etappen.length}: ${e.titel}` : (R.titel || e.titel));
    const dots = R.specs.map((_, i) => `<i class="${i < R.i ? "fertig" : i === R.i ? "jetzt" : ""}"></i>`).join("");
    const mood = R.status === "richtig" ? "jubel" : "froh";
    return `<header class="kopf runde-kopf">
      <button class="zurueck" data-act="pause-runde" aria-label="Pause, zurück zur Startseite">✕</button>
      <div class="runde-info"><div class="runde-titel">${esc(titel)}</div><div class="fortschritt" aria-label="Aufgabe ${R.i + 1} von ${R.specs.length}">${dots}</div></div>
      ${R.serie >= 3 ? `<span class="combo" aria-label="${R.serie} richtig in Folge">Combo ${R.serie}</span>` : ""}
      <div class="mini-tier ${R.status === "richtig" && !S.einst.ruhig ? "huepf" : ""}">${TIER.tierSvg(S.tier.art, { mood, stufe: L.stufe(S.punkte), traegt: S.traegt })}</div>
      <div class="muenzen">${TIER.muenze()} <b>${S.muenzen}</b></div></header>`;
  }

  // ---------- Bild mit Nummern ----------
  function figHtml(t, R, probe) {
    const k = rf().themen.flatMap((th) => th.karten).find((x) => x.id === t.fig.karte);
    if (!k) return "";
    const zeigeLoesung = R.status === "loesung" || R.status === "richtig";
    const marken = k.marken.map((m) => {
      let cls = "marke";
      if (t.fig.tippen) {
        cls += " tippbar";
        if (!probe && R.falsch.includes(m.nr)) cls += " falsch";
        if (probe && R.antwort === m.nr) cls += " gewaehlt";
        if (!probe && zeigeLoesung && m.nr === t.loesung) cls += " richtig";
        const offen = !probe && (R.status === "offen" || R.status === "tipp") || probe;
        return `<g class="${cls}" ${offen ? `data-act="tippen" data-arg="${m.nr}" role="button" tabindex="0" aria-label="Stelle"` : ""}><circle class="treffer" cx="${m.x}" cy="${m.y}" r="20"/><circle class="ring" cx="${m.x}" cy="${m.y}" r="14"/><circle class="kern" cx="${m.x}" cy="${m.y}" r="5"/></g>`;
      }
      if (m.nr === t.fig.markiert) cls += " markiert";
      else cls += " leise";
      return `<g class="${cls}"><circle cx="${m.x}" cy="${m.y}" r="13"/><text x="${m.x}" y="${m.y + 5}" text-anchor="middle">${m.nr}</text></g>`;
    }).join("");
    // Beim Antippen zählt die nächstgelegene Stelle, so trifft man auch auf kleinen Bildschirmen
    const tippBild = t.fig.tippen && (probe || R.status === "offen" || R.status === "tipp");
    return `<figure class="fig"><svg viewBox="${esc(k.viewBox)}" role="img" aria-label="${esc(k.titel || "Bild")}" ${tippBild ? 'data-act="tippen-bild"' : ""}>${k.svg}${marken}</svg></figure>`;
  }

  // ---------- Aufgabe anzeigen ----------
  function aufgabeHtml(t, R, probe) {
    const fertig = !probe && (R.status === "richtig" || R.status === "loesung");
    const loes = !probe && R.status === "loesung";
    let h = `<div class="frage-zeile"><h2 class="frage">${esc(t.frage)}</h2><button class="vorlesen" data-act="vorlesen" aria-label="Vorlesen">🔊</button></div>`;
    if (t.text) h += `<p class="aufgaben-text${t.art === "wahr" ? " satz" : ""}"${t.textSprache === "en" ? ' lang="en"' : ""}>${esc(t.text)}${t.textSprache === "en" && t.modus === "en-de-wahl" ? ` <button class="vorlesen klein inline" data-act="sag-en" data-arg="${esc(t.text)}" aria-label="Englisch anhören">🔊</button>` : ""}</p>`;
    if (t.fig) h += figHtml(t, R, probe);
    switch (t.art) {
      case "wahl": case "wahr": {
        const opts = t.art === "wahr" ? [[true, "Stimmt"], [false, "Stimmt nicht"]] : t.optionen.map((o) => [o, o]);
        h += `<div class="optionen${t.lang || opts.some((o) => String(o[1]).length > 28) ? " lang" : ""}${t.art === "wahr" ? " zwei" : ""}">` + opts.map(([wert, text], i) => {
          let cls = "option";
          if (probe && R.antwort === wert) cls += " gewaehlt";
          if (!probe && R.falsch.includes(wert)) cls += " falsch";
          if (fertig && wert === t.loesung) cls += " richtig";
          const aus = !probe && (fertig || R.falsch.includes(wert));
          return `<button class="${cls}" data-act="waehle" data-arg="${i}" ${aus ? "disabled" : ""}>${esc(text)}</button>`;
        }).join("") + `</div>`;
        break;
      }
      case "mehr":
        h += `<div class="optionen mehr">` + t.optionen.map((o, i) => {
          const an = (loes ? t.loesung : R.antwort).includes(o);
          let cls = "option" + (an ? " gewaehlt" : "");
          if (!probe && R.falsch.includes(o) && !fertig) cls += " falsch";
          if (fertig && t.loesung.includes(o)) cls += " richtig";
          return `<button class="${cls}" data-act="mehr" data-arg="${i}" aria-pressed="${an}" ${fertig ? "disabled" : ""}>${an ? "☑" : "☐"} ${esc(o)}</button>`;
        }).join("") + `</div>`;
        if (!fertig) h += pruefKnopf(probe, R.antwort.length > 0);
        break;
      case "reihe": {
        const plaetze = loes ? t.loesung : R.antwort;
        const benutzt = plaetze.filter(Boolean);
        if (!fertig) h += `<p class="leise klein">Tippe die Kärtchen der Reihe nach an. Antippen oben legt eines zurück.</p>`;
        h += `<ol class="reihe-plaetze">` + plaetze.map((x, i) => `<li><button class="platz${x ? " voll" : ""}${fertig ? " richtig" : ""}" data-act="reihe-raus" data-arg="${i}" ${fertig || !x ? "disabled" : ""}>${x ? esc(x) : "…"}</button></li>`).join("") + `</ol>`;
        if (!fertig) h += `<div class="optionen lang">` + t.items.map((x, i) => (benutzt.includes(x) ? "" : `<button class="option" data-act="reihe-rein" data-arg="${i}">${esc(x)}</button>`)).join("") + `</div>` + pruefKnopf(probe, plaetze.every(Boolean));
        break;
      }
      case "paare": {
        const ant = loes ? t.loesung : R.antwort;
        const farbe = (l) => t.links.indexOf(l);
        const rechtsVon = {}; for (const l of Object.keys(ant)) rechtsVon[ant[l]] = l;
        h += `<div class="paare"><div class="spalte">` + t.links.map((l) => {
          const g = ant[l] != null; const sel = R.wahl && R.wahl.seite === "l" && R.wahl.wert === l;
          return `<button class="option paar${g ? " paar-" + farbe(l) : ""}${sel ? " gewaehlt" : ""}${fertig ? " richtig" : ""}" data-act="paar-l" data-arg="${t.links.indexOf(l)}" ${fertig ? "disabled" : ""}>${g ? `<b class="nr">${farbe(l) + 1}</b>` : ""}${esc(l)}</button>`;
        }).join("") + `</div><div class="spalte">` + t.rechts.map((r, i) => {
          const l = rechtsVon[r]; const g = l != null; const sel = R.wahl && R.wahl.seite === "r" && R.wahl.wert === r;
          return `<button class="option paar${g ? " paar-" + farbe(l) : ""}${sel ? " gewaehlt" : ""}${fertig ? " richtig" : ""}" data-act="paar-r" data-arg="${i}" ${fertig ? "disabled" : ""}>${g ? `<b class="nr">${farbe(l) + 1}</b>` : ""}${esc(r)}</button>`;
        }).join("") + `</div></div>`;
        if (!fertig) h += `<p class="leise klein">Tippe links ein Wort an und dann rechts das passende.</p>` + pruefKnopf(probe, Object.keys(R.antwort).length === t.links.length);
        break;
      }
      case "luecke": {
        const ant = loes ? t.loesung : R.antwort;
        let gi = 0;
        h += `<p class="lueckentext">` + t.teile.map((x) => {
          if (x !== null) return esc(x);
          const i = gi++; const w = ant[i];
          const sel = !fertig && R.wahl === i;
          return `<button class="luecke${w ? " voll" : ""}${sel ? " gewaehlt" : ""}${fertig ? " richtig" : ""}" data-act="luecke" data-arg="${i}" ${fertig ? "disabled" : ""}>${w ? esc(w) : "______"}</button>`;
        }).join("") + `</p>`;
        if (!fertig) {
          const rest = t.bank.slice(); for (const w of R.antwort) if (w) { const j = rest.indexOf(w); if (j >= 0) rest.splice(j, 1); }
          h += `<div class="wortbank">` + t.bank.map((w, i) => `<button class="option wort" data-act="wort" data-arg="${i}" ${rest.includes(w) ? "" : "disabled"}>${esc(w)}</button>`).join("") + `</div>` + pruefKnopf(probe, R.antwort.every(Boolean));
          // gleiche Wörter: nur so viele sperren, wie benutzt sind
        }
        break;
      }
      case "schreiben": case "zahl":
        h += `<form class="schreib" data-act-submit="1" onsubmit="return false">
          <input id="eingabe" class="eingabe${loes ? " loesung" : ""}" ${t.art === "zahl" ? 'inputmode="decimal"' : t.sprache === "en" ? 'autocapitalize="none" lang="en"' : 'autocapitalize="sentences"'} autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="done" value="${esc(loes ? t.loesung : R.antwort)}" ${fertig ? "disabled" : ""} aria-label="Deine Antwort">
          ${t.einheit ? `<span class="einheit">${esc(t.einheit)}</span>` : ""}</form>`;
        if (!fertig) h += pruefKnopf(probe, true);
        if (fertig && t.art === "schreiben" && R.status === "richtig" && !R.exakt) h += `<p class="schreibweise">Richtig! So schreibt man es: <b>${esc(t.loesung)}</b>${vergleich(R.antwort, t.loesung)}</p>`;
        break;
      case "tippen":
        if (probe) h += pruefKnopf(probe, R.antwort !== "");
        break;
    }
    return h;
  }
  // Buchstabenvergleich: Buchstaben, die anders waren, werden unterstrichen
  function vergleich(ein, ziel) {
    const a = String(ein || "").trim().replace(/^(der|die|das) /i, "");
    const z = String(ziel).replace(/^(der|die|das) /i, "");
    if (!a || a === z) return "";
    let out = ""; for (let i = 0; i < z.length; i++) out += a[i] === z[i] ? esc(z[i]) : `<u>${esc(z[i])}</u>`;
    return `<br><span class="leise">Du hast geschrieben: ${esc(a)}</span><br><span class="vergleich">${out}</span>`;
  }
  const pruefKnopf = (probe, an) => `<div class="knopfzeile"><button class="btn haupt" data-act="${probe ? "probe-weiter" : "pruefen"}" ${an ? "" : "disabled"}>${probe ? "Weiter" : "Prüfen"}</button>${probe ? `<button class="btn leise-btn" data-act="probe-skip">Überspringen</button>` : ""}</div>`;

  function loesungKasten(t) {
    let l = "";
    switch (t.art) {
      case "wahl": case "schreiben": l = `Richtig ist: <b>${esc(t.loesung)}</b>`; break;
      case "zahl": l = `Richtig ist: <b>${esc(t.loesung)}${t.einheit ? " " + esc(t.einheit) : ""}</b>`; break;
      case "wahr": l = `Richtig ist: <b>${t.loesung ? "Stimmt" : "Stimmt nicht"}</b>`; break;
      case "tippen": l = `Hier ist es, grün markiert.`; break;
      default: l = "";
    }
    return l;
  }

  function runde() {
    const R = ui.runde, t = R.task;
    const st = L.teilStand(S, rf().id, t.teil);
    const warum = t.warum && (R.versuche > 0 || st.n <= 2) ? `<p class="warum">🐶 ${esc(t.warum)}</p>` : "";
    const hoeren = t.englisch ? `<p><button class="btn" data-act="sag-en" data-arg="${esc(t.englisch)}">🔊 So spricht man «${esc(t.englisch)}»</button></p>` : "";
    let unten = "";
    if (R.status === "tipp") {
      unten = `<div class="rueck tipp" role="status"><b>${esc(R.text)}</b>${R.hinweis ? `<p>${esc(R.hinweis)}</p>` : ""}<p>💡 ${esc(t.tipp)}</p>${t.art === "mehr" && R.fehlt ? `<p>Es fehlt noch etwas.</p>` : ""}</div>`;
    } else if (R.status === "richtig") {
      unten = `<div class="rueck gut" role="status"><b>${esc(R.lob)}</b>${R.versuche > 0 && t.erklaerung ? `<p>${esc(t.erklaerung)}</p>` : ""}${hoeren}${warum}<button class="btn haupt" data-act="weiter" autofocus>Weiter</button></div>`;
    } else if (R.status === "loesung") {
      unten = `<div class="rueck loesung" role="status"><b>${esc(R.text)}</b>${loesungKasten(t) ? `<p>${loesungKasten(t)}${t.art === "schreiben" && R.antwort ? vergleich(R.antwort, t.loesung) : ""}</p>` : ""}${hoeren}${t.erklaerung ? `<p>${esc(t.erklaerung)}</p>` : ""}${t.merk ? `<p class="merk">🧠 Merkhilfe: ${esc(t.merk)}</p>` : ""}${warum}<p class="leise klein">Diese Aufgabe kommt gleich noch einmal.</p><button class="btn haupt" data-act="weiter">Verstanden, weiter</button></div>`;
    } else if (R.status === "offen" && t.tipp && t.art !== "wahr") {
      unten = `<button class="tipp-knopf" data-act="tipp-zeigen">${R.tippOffen ? "💡 " + esc(t.tipp) : "💡 Ich brauche einen Tipp"}</button>`;
    }
    return `${rundeKopf()}<main class="aufgabe art-${t.art}">${aufgabeHtml(t, R, false)}${unten}</main>`;
  }

  function etappeStart() {
    const R = ui.runde, e = R.etappen[R.nr];
    const titel = R.etappen.length > 1 ? `Etappe ${R.nr + 1} von ${R.etappen.length}` : (R.titel || "Runde");
    return `${kopf("", true)}<main class="mitte">
      ${(() => { const ef = fachById(e.fach) || fach(); return `<h1>${esc(titel)}</h1><p class="untertitel">${FAECHER.length > 1 ? esc(ef.icon + " " + (ef.kurz || ef.name)) + ": " : ""}${esc(e.titel)}${e.themen ? ": " + esc(e.themen.map((id) => themaName(ef, id)).join(", ")) : ""}</p>
      ${e.themen && e.themen.length === 1 && e.art === "neu" ? warumBox(ef.themen.find((t) => t.id === e.themen[0])) : (() => { const fk = fakt(ef, e.themen, R.nr + L.tageBis("2026-01-01", heute())); return fk ? `<p class="fakt"><b>Fun Fact:</b> ${esc(fk)}</p>` : ""; })()}`; })()}
      <p class="leise">${e.n || S.einst.etappe} Aufgaben. ${e.art !== "kiste" ? `Mit ${L.tokenNoetig(e.n || S.einst.etappe)} auf Anhieb richtig gibt es einen Token.` : ""}</p>
      <button class="btn haupt gross" data-act="etappe-los">Start</button></main>`;
  }
  function etappeEnde() {
    const R = ui.runde;
    const b = R.belohnung || {};
    const sterne = b.quote >= 0.8 ? 3 : b.quote >= 0.5 ? 2 : 1;
    return `${kopf()}<main class="mitte">
      <h1>Etappe geschafft</h1>
      <div class="sterne" aria-label="${sterne} Sterne">${"★".repeat(sterne)}<span>${"★".repeat(3 - sterne)}</span></div>
      <p>${b.ersteRichtig} von ${b.anzahl} auf Anhieb richtig.</p>
      ${belohnungHtml(b)}
      ${b.tokens ? "" : `<p class="regel">Für einen Token brauchst du ${b.noetig} von ${b.anzahl} auf Anhieb. In der nächsten Etappe klappt's.</p>`}
      ${S.einst.pause ? `<button class="btn haupt gross" data-act="bewegung">Weiter zur Pause</button>` : `<button class="btn haupt gross" data-act="naechste-etappe">Nächste Etappe</button>`}
      <button class="btn leise-btn" data-act="heim">Für heute aufhören</button></main>`;
  }
  let pauseTimer = null;
  function bewegung() {
    const sek = TEST.pauseMs != null ? TEST.pauseMs / 1000 : S.einst.pauseSek;
    return `${kopf("Pause")}<main class="mitte pause">
      <div class="pause-uhr" style="--dauer:${sek}s"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44"/><circle class="lauf" cx="50" cy="50" r="44"/></svg><span id="pause-rest">${Math.ceil(sek)}</span></div>
      <h1>Kurz bewegen</h1><p class="bewegung">${esc(ui.bewegung)}</p>
      <button id="pause-weiter" class="btn haupt gross" data-act="naechste-etappe" disabled>Weiter</button></main>`;
  }
  function starteBewegung() {
    ui.ansicht = "bewegung"; ui.bewegung = pick(BEWEGUNG); render();
    const ms = TEST.pauseMs != null ? TEST.pauseMs : S.einst.pauseSek * 1000;
    const ende = Date.now() + ms;
    clearInterval(pauseTimer);
    pauseTimer = setInterval(() => {
      const rest = Math.max(0, ende - Date.now());
      const el = document.getElementById("pause-rest"); if (el) el.textContent = Math.ceil(rest / 1000);
      if (rest <= 0) { clearInterval(pauseTimer); const b = document.getElementById("pause-weiter"); if (b) b.disabled = false; ton(7); }
    }, 200);
  }
  function rundeEnde(mission) {
    const T = tagLesen(), R = ui.runde || {}, b = R.belohnung;
    return `${kopf()}<main class="mitte">
      <h1>${mission ? "Mission geschafft" : "Runde geschafft"}</h1>
      ${b ? `<p>${b.ersteRichtig} von ${b.anzahl} auf Anhieb richtig.</p>` : ""}
      ${belohnungHtml(b)}
      ${mission ? `<p class="leise">Heute ${T.richtig} Aufgaben richtig. Die Mission bringt einen Token extra.</p>` : ""}
      ${S.tokens ? `<button class="btn haupt gross" data-act="spielhalle">Zur Spielhalle</button>` : ""}
      <button class="btn${S.tokens ? "" : " haupt gross"}" data-act="tier">Zu ${esc(tierName())}</button>
      <button class="btn leise-btn" data-act="heim">Zur Startseite</button></main>`;
  }

  // ================= Frei üben, Lernkarten =================
  function themen() {
    const f = fach();
    return `${kopf("Frei üben", true)}<main class="liste">
      ${f.themen.map((th) => {
        const b = L.bereitschaft(S, f, th.id);
        const teile = L.fachTeile(f).filter((t) => t.thema === th.id);
        const sterne = teile.reduce((a, t) => a + L.teilStand(S, f.id, t.id).sterne, 0);
        return `<button class="thema-karte" data-act="thema" data-arg="${esc(th.id)}"><span class="icon">${esc(th.icon || "📘")}</span><span class="name">${esc(th.name)}</span><span class="balken"><i style="width:${b}%"></i></span><span class="leise">★ ${sterne} von ${teile.length * 3}</span></button>`;
      }).join("")}
      <button class="btn haupt" data-act="thema" data-arg="">Alles gemischt</button></main>`;
  }
  function karten() {
    const f = fach();
    const th = f.themen.find((x) => x.id === ui.thema) || f.themen[0];
    const vok = th.karten.filter((k) => k.typ === "vokabel");
    const vokListe = vok.length ? `<div class="lernkarte"><table class="vokabeln"><thead><tr><th>Englisch</th><th>Deutsch</th></tr></thead><tbody>${vok.map((k) => `<tr><td lang="en"><b>${esc(k.en)}</b>${(k.auchEn || []).length ? ` <span class="leise">(${esc(k.auchEn.join(", "))})</span>` : ""}</td><td>${esc(k.de)}</td><td><button class="vorlesen klein" data-act="sag-en" data-arg="${esc(k.en)}" aria-label="${esc(k.en)} anhören">🔊</button></td></tr>`).join("")}</tbody></table></div>` : "";
    const inhalt = vokListe + th.karten.filter((k) => k.typ !== "auftrag" && k.typ !== "vokabel").map((k) => {
      const w = k.warum ? `<p class="warum">🐶 ${esc(k.warum)}</p>` : "";
      return lernkarte(k).replace(/<\/div>$/, w + "</div>");
    }).join("");
    function lernkarte(k) {
      switch (k.typ) {
        case "begriff": return `<div class="lernkarte"><b>${esc(k.begriff)}</b><p>${esc(k.bedeutung)}</p>${k.merk ? `<p class="merk">🧠 ${esc(k.merk)}</p>` : ""}<button class="vorlesen klein" data-act="sag" data-arg="${esc(k.begriff + ". " + k.bedeutung)}">🔊</button></div>`;
        case "frage": return `<div class="lernkarte"><p>${esc(k.frage)}</p><b>${esc(k.antwort)}</b>${k.merk ? `<p class="merk">🧠 ${esc(k.merk)}</p>` : ""}</div>`;
        case "zahl": return `<div class="lernkarte"><p>${esc(k.frage)}</p><b>${esc(k.antwort)}${k.einheit ? " " + esc(k.einheit) : ""}</b></div>`;
        case "wahr": return k.wahr ? `<div class="lernkarte"><p>✔ ${esc(k.satz)}</p></div>` : `<div class="lernkarte"><p>✔ ${esc(k.korrektur)}</p></div>`;
        case "paare": {
          const gr = {}; k.paare.forEach(([a, b]) => (gr[b] = gr[b] || []).push(a));
          return `<div class="lernkarte"><b>${esc(k.titel || "")}</b><ul>${Object.keys(gr).map((g) => `<li><b>${esc(g)}:</b> ${esc(gr[g].join(", "))}</li>`).join("")}</ul>${k.merk ? `<p class="merk">🧠 ${esc(k.merk)}</p>` : ""}</div>`;
        }
        case "gruppen": return `<div class="lernkarte"><ul>${Object.keys(k.gruppen).map((g) => `<li><b>${esc(g)}:</b> ${esc(k.gruppen[g].join(", "))}</li>`).join("")}</ul></div>`;
        case "reihe": return `<div class="lernkarte"><b>${esc(k.titel || "")}</b><ol>${k.schritte.map((s) => `<li>${esc(s)}</li>`).join("")}</ol></div>`;
        case "luecke": return `<div class="lernkarte"><p>${esc(k.text).replace(/\{([^}]+)\}/g, "<b>$1</b>")}</p></div>`;
        case "bild": return `<div class="lernkarte bildkarte"><b>${esc(k.titel || "")}</b><figure class="fig"><svg viewBox="${esc(k.viewBox)}">${k.svg}${k.marken.map((m) => `<g class="marke markiert"><circle cx="${m.x}" cy="${m.y}" r="13"/><text x="${m.x}" y="${m.y + 5}" text-anchor="middle">${m.nr}</text></g>`).join("")}</svg></figure><ol class="legende">${k.marken.slice().sort((a, b) => a.nr - b.nr).map((m) => `<li value="${m.nr}">${esc(m.begriff)}</li>`).join("")}</ol>${k.merk ? `<p class="merk">🧠 ${esc(k.merk)}</p>` : ""}</div>`;
      }
      return "";
    }
    return `${kopf("Lernkarten", true)}<main class="liste">
      <nav class="reiter">${f.themen.map((x) => `<button class="${x === th ? "aktiv" : ""}" data-act="karten-thema" data-arg="${esc(x.id)}">${esc(x.icon || "")} ${esc(x.name)}</button>`).join("")}</nav>
      ${warumBox(th)}
      ${(th.fakten || []).length ? `<div class="lernkarte fakten"><b>Wusstest du?</b><ul>${th.fakten.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
      ${inhalt}
      <button class="btn haupt" data-act="thema" data-arg="${esc(th.id)}">Dieses Thema üben</button></main>`;
  }

  // ================= Forschen & Basteln =================
  const AUFTRAG_ICON = { basteln: "🎨", forschen: "🔍", bewegen: "🏃" };
  function auftraegeSeite() {
    const f = fach();
    return `${kopf("Forschen & Basteln", true)}<main class="liste">
      <p class="leise">Echte Aufträge zum Ausprobieren, Bauen und Beobachten. Wenn du einen geschafft hast, tippe auf «Geschafft!».</p>
      ${f.themen.map((th) => {
        const a = th.karten.filter((k) => k.typ === "auftrag"); if (!a.length) return "";
        return `<h2>${esc(th.icon || "")} ${esc(th.name)}</h2>` + a.map((k) => {
          const am = S.auftraege[k.id];
          return `<article class="auftrag${am ? " erledigt" : ""}"><div class="auftrag-icon">${AUFTRAG_ICON[k.art] || "⭐"}</div><div><h3>${esc(k.titel)}</h3><p>${esc(k.text)}</p>
            ${am ? `<p class="leise">✓ Geschafft am ${new Date(am + "T12:00:00").toLocaleDateString("de-DE")}</p>` : `<button class="btn haupt" data-act="auftrag-fertig" data-arg="${esc(k.id)}">Geschafft! +${L.LOHN.auftrag} ${TIER.muenze()}</button>`}</div></article>`;
        }).join("");
      }).join("")}</main>`;
  }

  // ================= Probe-Arbeit =================
  function probeStart() {
    const n = S.einst.probeAnzahl;
    return `${kopf("Probe-Arbeit", true)}<main class="mitte">
      <div class="gross-tier">${TIER.tierSvg(S.tier.art, { stufe: L.stufe(S.punkte), traegt: S.traegt })}</div>
      <h1>Probe-Arbeit</h1>
      <p>${n} Aufgaben aus allen Themen, wie in einer echten Arbeit.<br>Du siehst erst am Ende, wie es gelaufen ist.</p>
      <p class="leise">Wenn du etwas nicht weißt, tippe auf «Überspringen». Die Aufgabe kommt am Ende noch einmal.</p>
      <button class="btn haupt gross" data-act="probe-los">Probe starten</button></main>`;
  }
  function probeNaechste() {
    const P = ui.runde;
    P.i++;
    if (P.i >= P.specs.length) return probeFertig();
    const s = P.specs[P.i];
    P.task = L.makeTask(rf(), s.teil, s.modus, s.seed);
    P.antwort = startAntwort(P.task); P.wahl = null; P.status = "offen"; P.falsch = [];
    render();
    if (S.einst.vorlesen) vorlesen();
  }
  function probeAntwort(skip) {
    const P = ui.runde, t = P.task;
    if (skip) {
      const s = P.specs[P.i];
      if (!s.nochmal) { P.specs.push(Object.assign({}, s, { nochmal: true })); P.ergebnisse[P.i] = null; }
      else P.ergebnisse[P.i] = { teil: t.teil, thema: t.thema, ok: false };
      return probeNaechste();
    }
    let a = P.antwort;
    if (t.art === "schreiben" || t.art === "zahl") { const el = document.getElementById("eingabe"); a = el ? el.value : ""; }
    const r = L.check(t, a);
    P.ergebnisse[P.i] = { teil: t.teil, thema: t.thema, ok: !!r.ok };
    probeNaechste();
  }
  function probeFertig() {
    const P = ui.runde, f = fach();
    const zaehl = {};
    const gezaehlt = new Set();
    P.ergebnisse.forEach((e) => { if (!e) return; zaehl[e.thema] = zaehl[e.thema] || { ok: 0, n: 0 }; zaehl[e.thema].n++; if (e.ok) zaehl[e.thema].ok++; if (!gezaehlt.has(e.teil)) { gezaehlt.add(e.teil); L.record(S, f.id, e.teil, e.ok, heute()); } });
    const ges = P.ergebnisse.filter(Boolean);
    const prozent = ges.length ? Math.round((100 * ges.filter((e) => e.ok).length) / ges.length) : 0;
    const themenP = {}; for (const th of Object.keys(zaehl)) themenP[th] = Math.round((100 * zaehl[th].ok) / zaehl[th].n);
    (S.proben[f.id] = S.proben[f.id] || []).push({ datum: heute(), prozent, themen: themenP });
    const lvVorher = L.level(S.punkte);
    const token = prozent >= 80 ? 1 : 0;
    S.muenzen += L.LOHN.probe; S.tokens += token; S.punkte += Math.round(prozent / 5);
    tag().aufgaben += ges.length; tag().richtig += ges.filter((e) => e.ok).length;
    speichern();
    ui = { ansicht: "probe-ende", prozent, themenP, falsch: ges.filter((e) => !e.ok).length, belohnung: { muenzen: L.LOHN.probe, tokens: token, xp: Math.round(prozent / 5) } };
    pruefeLevelUp(lvVorher);
    render(); if (prozent >= 80 || ui.levelUp) konfetti();
  }
  function probe() {
    const P = ui.runde, t = P.task;
    const dots = P.specs.map((_, i) => `<i class="${i < P.i ? "fertig" : i === P.i ? "jetzt" : ""}"></i>`).join("");
    return `<header class="kopf runde-kopf"><button class="zurueck" data-act="heim" aria-label="Probe abbrechen">✕</button>
      <div class="runde-info"><div class="runde-titel">Probe-Arbeit: Aufgabe ${Math.min(P.i + 1, P.specs.length)} von ${P.specs.length}</div><div class="fortschritt">${dots}</div></div>
      <div class="mini-tier">${TIER.tierSvg(S.tier.art, { stufe: L.stufe(S.punkte), traegt: S.traegt })}</div></header>
      <main class="aufgabe art-${t.art}">${aufgabeHtml(t, P, true)}${t.art === "wahl" || t.art === "wahr" ? pruefKnopf(true, P.antwort !== "") : ""}</main>`;
  }
  function probeEnde() {
    const f = fach();
    const text = ui.prozent >= 80 ? "Wow, das sitzt schon richtig gut!" : ui.prozent >= 50 ? "Schon eine Menge geschafft! Mit etwas Üben wird es noch sicherer." : "Gut, dass du geübt hast! Jetzt weißt du, was du noch üben kannst.";
    return `${kopf("Probe-Arbeit")}<main class="mitte">
      <div class="gross-tier">${TIER.tierSvg(S.tier.art, { mood: "jubel", stufe: L.stufe(S.punkte), traegt: S.traegt })}</div>
      <h1>Probe geschafft!</h1><p>${text}</p>
      <div class="ergebnis-liste">${f.themen.filter((th) => ui.themenP[th.id] != null).map((th) => `<div class="ergebnis"><span>${esc(th.icon || "")} ${esc(th.name)}</span><span class="balken"><i style="width:${ui.themenP[th.id]}%"></i></span><b>${ui.themenP[th.id]} %</b></div>`).join("")}</div>
      ${belohnungHtml(ui.belohnung)}
      ${ui.belohnung && !ui.belohnung.tokens ? `<p class="regel">Ab 80 % gibt es einen Token.</p>` : ""}
      ${ui.falsch ? `<button class="btn haupt" data-act="kiste">Fehler üben (${(S.fehler[f.id] || []).length})</button>` : ""}
      <button class="btn leise-btn" data-act="heim">Zur Startseite</button></main>`;
  }

  // ================= Tier =================
  function tierSeite() {
    const reiter = ui.reiter || "futter";
    const angebot = L.laden(S.tier.art);
    let liste = reiter === "futter" ? angebot.snacks : reiter === "zubehoer" ? angebot.zubehoer : reiter === "zimmer" ? angebot.zimmer : [];
    // schon gekaufte Dinge aus früheren Versionen bleiben sichtbar
    if (reiter === "zimmer") liste = liste.concat(S.besitz.map(L.shopDing).filter((d) => d && !liste.some((x) => x.id === d.id) && !L.SHOP.zubehoer.some((x) => x.id === d.id)));
    const st = L.stufe(S.punkte), naechste = L.STUFEN[st + 1];
    return `${kopf(tierName(), true)}<main class="tier-seite">
      <section class="zimmer-box gross${ui.mood ? " " + ui.mood : ""}" data-act="streicheln" aria-label="${esc(tierName())} streicheln">
        ${TIER.zimmerSvg(S.tier.art, { besitz: S.besitz, traegt: S.traegt, stufe: st, mood: ui.mood || "froh" })}
        ${ui.sagt ? `<div class="sprechblase">${esc(ui.sagt)}</div>` : ""}
        ${ui.mood === "jubel" ? `<div class="herzen" aria-hidden="true"><i>❤</i><i>❤</i><i>❤</i></div>` : ""}
      </section>
      <p class="leise mitte-text">${naechste ? `Noch ${naechste.ab - S.punkte} XP, dann wächst ${esc(tierName())}.` : `${esc(tierName())} ist ausgewachsen.`}</p>
      <nav class="reiter">
        <button class="${reiter === "futter" ? "aktiv" : ""}" data-act="tier-reiter" data-arg="futter">Futter</button>
        <button class="${reiter === "zubehoer" ? "aktiv" : ""}" data-act="tier-reiter" data-arg="zubehoer">Outfit</button>
        <button class="${reiter === "zimmer" ? "aktiv" : ""}" data-act="tier-reiter" data-arg="zimmer">Zimmer</button>
        <button class="${reiter === "design" ? "aktiv" : ""}" data-act="tier-reiter" data-arg="design">App-Design</button>
      </nav>
      ${reiter === "design" ? `<p class="leise">Neue Designs schaltest du mit Level frei.</p><div class="themen-wahl">${L.THEMES.map((t) => { const frei = level() >= t.ab; return `<button class="theme-knopf${S.theme === t.id ? " aktiv" : ""}" style="background:${THEME_FARBEN[t.id][0]};color:${THEME_FARBEN[t.id][1]}" data-act="theme" data-arg="${t.id}" ${frei ? "" : "disabled"}>${esc(t.name)}<i style="background:${THEME_FARBEN[t.id][2]}"></i><small>${S.theme === t.id ? "aktiv" : frei ? "wählen" : "ab Level " + t.ab}</small></button>`; }).join("")}</div>` : ""}
      <div class="laden">${liste.map((d) => {
        const hat = S.besitz.includes(d.id), an = S.traegt.includes(d.id);
        const preis = `<span class="preis">${d.preis} ${TIER.muenze()}</span>`;
        const unter = reiter === "futter" ? preis : hat ? (reiter === "zubehoer" ? (an ? "trägt es" : "ablegen") : "im Zimmer") : preis;
        return `<button class="laden-ding${hat ? " hat" : ""}${an ? " an" : ""}${!hat && S.muenzen < d.preis ? " teuer" : ""}" data-act="kaufen" data-arg="${d.id}" ${reiter === "zimmer" && hat ? "disabled" : ""}><span class="icon">${TIER.ladenIcon(d.id) || d.icon}</span><span>${esc(d.name)}</span><small>${unter}</small></button>`;
      }).join("")}</div></main>`;
  }
  let moodTimer = null;
  function tierReagiert(mood, sagt, ms) {
    ui.mood = mood; ui.sagt = sagt; render();
    clearTimeout(moodTimer); moodTimer = setTimeout(() => { if (ui.ansicht === "tier") { ui.mood = null; ui.sagt = null; render(); } }, ms || 2200);
  }

  // ================= Spielhalle =================
  const SPIELE = { run: { name: () => `${tierName()} Run`, text: "Springen, Doppelsprung, Knochen sammeln. Wie weit kommst du?" }, bloecke: { name: () => "Blöcke", text: "Blöcke drehen und stapeln. Volle Reihen verschwinden." } };
  function spielhalle() {
    const rest = Math.max(0, S.einst.spieleProTag - (tagLesen().spiele || 0));
    const sperre = !S.einst.spieleProTag ? "Die Spielhalle ist gerade ausgeschaltet." : !S.tokens ? `Keine Tokens. Hol dir welche in der Mission: ${L.tokenNoetig(S.einst.etappe)} von ${S.einst.etappe} auf Anhieb richtig.` : !rest ? "Für heute ist die Spielhalle zu. Morgen geht es weiter." : "";
    return `${kopf("Spielhalle", true)}<main class="liste spielhalle">
      <div class="tokens-gross">${TOKEN} ${S.tokens}</div>
      <p class="leise">Eine Runde kostet einen Token. ${S.einst.spieleProTag ? `Heute noch ${rest} ${rest === 1 ? "Runde" : "Runden"}.` : ""}</p>
      ${sperre ? `<p class="hinweis">${sperre}</p>` : ""}
      ${Object.keys(SPIELE).map((art) => `<article class="spiel-karte"><div><h2>${esc(SPIELE[art].name())}</h2><p>${SPIELE[art].text}</p><p>Rekord: <b>${S.spiele[art].best}</b></p></div><button class="btn haupt gross" data-act="spiel-start" data-arg="${art}" ${sperre ? "disabled" : ""}>Spielen</button></article>`).join("")}
      <p class="regel">Tokens gibt es für jede Etappe mit ${L.tokenNoetig(S.einst.etappe)} von ${S.einst.etappe} auf Anhieb richtig, für jede geschaffte Mission und für Probe-Arbeiten ab 80 %.</p>
    </main>`;
  }
  let spielCtrl = null;
  function spielSeite() {
    const art = ui.spielArt;
    const kopfzeile = `<header class="kopf runde-kopf"><button class="zurueck" data-act="spiel-abbrechen" aria-label="Spiel beenden">✕</button><div class="runde-info"><div class="runde-titel">${esc(SPIELE[art].name())}</div></div><div class="hud"><span>Punkte <b id="hud-punkte">0</b></span><span>Rekord <b>${S.spiele[art].best}</b></span></div></header>`;
    if (art === "bloecke") return `${kopfzeile}<main class="spiel spiel-bloecke"><div class="bloecke-layout"><div class="spiel-feld-platz"><canvas class="spielfeld" aria-label="Spielfeld"></canvas></div>
      <aside class="bloecke-info"><div>Als Nächstes<canvas class="vorschau"></canvas></div><div>Reihen<b id="hud-linien">0</b></div><div>Level<b id="hud-level">1</b></div><div>Zeit<b id="hud-zeit">4:00</b></div></aside></div>
      <div class="steuerung"><button data-spiel="links" aria-label="Nach links">◀</button><button data-spiel="drehen" aria-label="Drehen">⟳</button><button data-spiel="rechts" aria-label="Nach rechts">▶</button><button data-spiel="runter" aria-label="Schneller">▼</button><button data-spiel="fallen" aria-label="Ganz fallen lassen">⤓</button></div></main>`;
    return `${kopfzeile}<main class="spiel spiel-run"><div class="run-platz"><canvas class="spielfeld" aria-label="Spielfeld"></canvas></div>
      <p class="leise">Tippen: springen. Länger drücken: höher. In der Luft noch mal tippen: Doppelsprung.</p></main>`;
  }
  function spielStarten(art) {
    const r = L.spielStart(S, art, heute());
    if (!r.ok) { toast(r.grund === "tokens" ? "Keine Tokens mehr. Die gibt es in der Mission." : "Für heute ist die Spielhalle zu."); gehe("spielhalle"); return; }
    speichern();
    gehe("spiel", { spielArt: art, spielNeu: true });
  }
  function spielStartenNachRender() {
    const box = app.querySelector(".spiel"); if (!box || spielCtrl) return;
    ui.spielNeu = false;
    const art = ui.spielArt, A = TIER.ARTEN[S.tier.art] || {};
    spielCtrl = window.LN_SPIELE.starte(box, {
      art, seed: zufall(), manuell: !!TEST.spielManuell,
      tier: { fell: A.farbe, dunkel: A.dunkel, hell: A.hell || A.bauch, halsband: S.traegt.includes("halsband") },
      onPunkte: (z) => {
        const set = (id, v) => { const el = document.getElementById(id); if (el && el.textContent !== String(v)) el.textContent = v; };
        set("hud-punkte", z.punkte);
        if (art === "bloecke") { set("hud-linien", z.linien); set("hud-level", z.level); const rest = Math.max(0, window.LN_SPIELE.BLOECKE.ZEITLIMIT - z.zeit) / 1000; set("hud-zeit", Math.floor(rest / 60) + ":" + String(Math.floor(rest % 60)).padStart(2, "0")); }
      },
      onEnde: (erg) => spielVorbei(art, erg),
    });
  }
  function spielVorbei(art, erg) {
    const r = L.spielEnde(S, art, erg.punkte);
    speichern();
    const box = app.querySelector(".spiel"); if (!box) return;
    const rest = Math.max(0, S.einst.spieleProTag - (tagLesen().spiele || 0));
    const geht = S.tokens > 0 && rest > 0;
    const grund = ui.spielAbbruch ? "Spiel beendet." : art === "bloecke" ? (erg.zeitUm ? "Zeit um." : "Kein Platz mehr.") : erg.grund === "grube" ? "In die Grube gefallen." : "Zusammengestoßen.";
    const el = document.createElement("div"); el.className = "spiel-ende";
    el.innerHTML = `<div class="dialog" role="dialog" aria-label="Ergebnis"><p class="leise">${grund}</p><div class="zahl">${erg.punkte}</div><p>${r.rekord ? "Neuer Rekord!" : `Rekord: ${S.spiele[art].best}`}</p>${art === "run" ? `<p class="leise">${erg.knochen} Knochen gesammelt</p>` : `<p class="leise">${erg.linien} Reihen</p>`}
      <div class="knopfzeile" style="justify-content:center">${geht ? `<button class="btn haupt" data-act="spiel-start" data-arg="${art}">Noch mal (1 Token)</button>` : ""}<button class="btn" data-act="spielhalle">Spielhalle</button></div></div>`;
    box.appendChild(el);
    spielCtrl = null;
    const hk = app.querySelector(".chips .tokens b"); if (hk) hk.textContent = S.tokens;
  }

  // ================= Eltern-Übersicht =================
  function eltern() {
    const f = fach();
    const reiter = ui.reiter || "fortschritt";
    let inhalt = "";
    if (reiter === "fortschritt") {
      const wack = L.wackelt(S, f).slice(0, 20);
      const tage = []; for (let i = 6; i >= 0; i--) { const d = L.plusTage(heute(), -i); tage.push([d, Math.round(((S.tage[d] || {}).sek || 0) / 60)]); }
      const maxMin = Math.max(15, ...tage.map((x) => x[1]));
      const proben = (S.proben[f.id] || []).slice(-5).reverse();
      const missionen = Object.values(S.tage).filter((x) => x.mission).length;
      inhalt = `<h2>Bereitschaft je Thema</h2>
        ${f.themen.map((th) => { const b = L.bereitschaft(S, f, th.id); return `<div class="ergebnis"><span>${esc(th.name)}</span><span class="balken"><i style="width:${b}%"></i></span><b>${b} %</b></div>`; }).join("")}
        <p class="leise klein">100 % heißt: jeder Lernteil wurde mehrmals hintereinander auf Anhieb richtig gelöst.</p>
        <h2>Was noch wackelt</h2>
        ${wack.length ? `<ul class="wackel">${wack.map((t) => `<li>${esc(t.name)} <span class="leise">(${esc(themaName(f, t.thema))})</span></li>`).join("")}</ul>` : `<p class="leise">Gerade nichts. Prima!</p>`}
        <h2>Übungszeit der letzten 7 Tage</h2>
        <div class="tage-balken">${tage.map(([d, m]) => `<div><span style="height:${Math.round((100 * m) / maxMin)}%"></span><b>${m}</b><small>${["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][new Date(d + "T12:00:00").getDay()]}</small></div>`).join("")}</div>
        <p class="leise klein">Minuten mit aktivem Üben. Tagesmissionen bisher: ${missionen}.</p>
        <h2>Forschen &amp; Basteln</h2>
        ${(() => { const a = L.auftraege(f).filter((x) => S.auftraege[x.id]); return a.length ? `<ul>${a.map((x) => `<li>${esc(x.titel)} <span class="leise">(${esc(S.auftraege[x.id])})</span></li>`).join("")}</ul>` : `<p class="leise">Noch keine Aufträge erledigt.</p>`; })()}
        <h2>Probe-Arbeiten</h2>
        ${proben.length ? `<ul>${proben.map((p) => `<li>${esc(p.datum)}: ${p.prozent} %</li>`).join("")}</ul>` : `<p class="leise">Noch keine.</p>`}`;
    } else if (reiter === "plan") {
      const a = arbeitInfo(f);
      const liste = a.datum ? L.planListe(a.start && L.tageBis(a.start, heute()) >= 0 ? a.start : heute(), a.datum, L.planThemen(f).map((t) => t.id)) : [];
      const artName = { lernen: "Neu lernen", mix: "Gemischt üben", probe: "Probe-Arbeit", wiederholen: "Wiederholen", mut: "Tag der Arbeit" };
      inhalt = `<h2>Nächste Arbeit</h2>
        <label>Titel <input id="arbeit-titel" class="eingabe klein" value="${esc((S.plan[f.id] || {}).titel || (f.arbeit && f.arbeit.titel) || "")}" placeholder="z. B. Biologie: Wirbeltiere"></label>
        <label>Datum <input id="arbeit-datum" type="date" class="eingabe klein" value="${esc(a.datum || "")}"></label>
        <button class="btn haupt" data-act="plan-speichern">Plan ab heute neu berechnen</button>
        ${liste.length ? `<h2>Plan bis zur Arbeit</h2><table class="plan"><tbody>${liste.map((e) => `<tr class="${e.datum === heute() ? "heute" : ""}"><td>${new Date(e.datum + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" })}</td><td>${artName[e.art] || e.art}</td><td>${e.art === "lernen" ? esc(e.themen.map((id) => themaName(f, id)).join(", ")) : ""}</td></tr>`).join("")}</tbody></table>
        <p class="leise klein">Jeder Tag hat drei kurze Etappen (Aufwärmen, Neues, Festigen) mit Bewegungspause. Fehler kommen automatisch wieder.</p>` : `<p class="leise">Ohne Datum wird jeden Tag gemischt geübt.</p>`}`;
    } else if (reiter === "einst") {
      const e = S.einst;
      const sel = (id, werte, akt, fmt) => `<select id="${id}" class="eingabe klein" data-change="einst">${werte.map((w) => `<option value="${w}" ${w === akt ? "selected" : ""}>${fmt ? fmt(w) : w}</option>`).join("")}</select>`;
      const schalter = (id, an, text) => `<label class="schalter"><input type="checkbox" id="${id}" data-change="einst" ${an ? "checked" : ""}> ${text}</label>`;
      inhalt = `<h2>Üben</h2>
        <label>Aufgaben pro Etappe ${sel("e-etappe", [4, 5, 6, 8, 10], e.etappe)}</label>
        <p class="leise klein">Bei 6 Aufgaben dauert eine Etappe etwa 4 bis 5 Minuten, die Tagesmission mit Pausen rund 15 Minuten.</p>
        ${schalter("e-pause", e.pause, "Bewegungspause zwischen den Etappen")}
        <label>Dauer der Pause ${sel("e-pauseSek", [20, 30, 45, 60], e.pauseSek, (w) => w + " Sekunden")}</label>
        <label>Aufgaben in der Probe-Arbeit ${sel("e-probe", [8, 12, 16, 20], e.probeAnzahl)}</label>
        <label>Spielrunden pro Tag in der Spielhalle ${sel("e-spiele", [0, 2, 3, 5, 8, 12], e.spieleProTag, (w) => (w ? w + " Runden" : "Spielhalle aus"))}</label>
        <h2>Darstellung</h2>
        ${schalter("e-toene", e.toene, "Töne")}
        ${schalter("e-ruhig", e.ruhig, "Ruhiger Modus (kein Konfetti, keine hüpfenden Tiere)")}
        ${schalter("e-vorlesen", e.vorlesen, "Aufgaben automatisch vorlesen")}
        <h2>Namen</h2>
        <label>Name des Kindes <input id="e-name" class="eingabe klein" value="${esc(S.name)}" maxlength="20"></label>
        <label>Name des Tiers in der App <input id="e-tiername" class="eingabe klein" value="${esc(tierName())}" maxlength="20"></label>
        <label>Name eures Hundes zu Hause (für die Warum-Texte) <input id="e-hund" class="eingabe klein" value="${esc(S.hund)}" maxlength="20" placeholder="leer lassen: Name des App-Tiers, wenn es ein Hund ist"></label>
        <label>Tierart <select id="e-art" class="eingabe klein">${Object.keys(TIER.ARTEN).map((a) => `<option value="${a}" ${S.tier.art === a ? "selected" : ""}>${TIER.ARTEN[a].name}</option>`).join("")}</select></label>
        <button class="btn" data-act="namen-speichern">Namen speichern</button>
        ${FAECHER.length > 1 ? `<h2>Fach</h2>${FAECHER.map((x) => `<button class="btn${x === f ? " haupt" : ""}" data-act="fach" data-arg="${esc(x.id)}">${esc(x.icon)} ${esc(x.name)}</button>`).join(" ")}` : ""}`;
    } else {
      const lb = S.lastBackup ? new Date(S.lastBackup).toLocaleString("de-DE") : "noch keine";
      inhalt = `<h2>Sicherung</h2>
        <p>Der Spielstand liegt auf diesem iPad und wird dort doppelt gespeichert (zwei Kopien im Browser und eine in der Datenbank des Browsers). Speichern Sie trotzdem ab und zu eine Sicherungsdatei, am besten in «Dateien» oder iCloud. Mit «Sicherung laden» kommt alles zurück, auch auf einem anderen Gerät.</p>
        <p class="leise">Letzte Sicherungsdatei: ${esc(lb)}</p>
        <div class="knopfzeile"><button class="btn haupt" data-act="sicherung">Sicherung speichern</button><label class="btn" for="sicherung-datei" role="button" tabindex="0">Sicherung laden</label><input type="file" id="sicherung-datei" accept=".json,application/json" hidden></div>
        <h2>Sicherung als Text</h2>
        <p class="leise">Auf älteren iPads klappt das Speichern als Datei manchmal nicht. Dann den Spielstand als Text kopieren und zum Beispiel in einer Notiz einfügen. Zum Zurückholen den Text unten einfügen und «Aus Text laden» antippen.</p>
        <div class="knopfzeile"><button class="btn" data-act="text-kopieren">Als Text kopieren</button></div>
        ${ui.sicherText ? `<textarea id="sicher-text" class="eingabe text" readonly>${esc(ui.sicherText)}</textarea>` : ""}
        <textarea id="lade-text" class="eingabe text" placeholder="Hier den kopierten Text einfügen"></textarea>
        <div class="knopfzeile"><button class="btn" data-act="text-laden">Aus Text laden</button></div>
        <h2>Version</h2><p class="leise">Lernnest Version ${VER.n} vom ${esc(VER.date)}</p>
        <h2>Zurücksetzen</h2>
        ${ui.reset ? `<p><b>Wirklich alles löschen?</b> Münzen, Tier und Fortschritt sind dann weg. Vorher eine Sicherung speichern!</p><div class="knopfzeile"><button class="btn gefahr" data-act="reset-ja">Ja, alles löschen</button><button class="btn" data-act="reset-nein">Abbrechen</button></div>` : `<button class="btn" data-act="reset">Alles zurücksetzen …</button>`}`;
    }
    return `<header class="kopf"><h1 class="titel">Für Eltern</h1><button class="btn" data-act="heim">Zurück zur App</button></header>
      <main class="eltern">
      <nav class="reiter">${[["fortschritt", "Fortschritt"], ["plan", "Plan"], ["einst", "Einstellungen"], ["sicherung", "Sicherung"]].map(([id, n]) => `<button class="${reiter === id ? "aktiv" : ""}" data-act="eltern-reiter" data-arg="${id}">${n}</button>`).join("")}</nav>
      <section class="karte">${inhalt}</section></main>`;
  }

  // ================= Version oben =================
  function versionAnzeigen() {
    let el = document.getElementById("version");
    if (!el) { el = document.createElement("button"); el.id = "version"; el.type = "button"; document.body.insertBefore(el, app); el.onclick = () => { ui.sicherFrage = true; render(); }; }
    const alter = S.lastBackup ? (Date.now() - S.lastBackup) / 864e5 : null;
    el.textContent = `Version ${VER.n}` + (alter == null ? ", noch keine Sicherung" : alter > 7 ? `, Sicherung vor ${Math.floor(alter)} Tagen` : ", gesichert ✓");
    el.className = alter == null || alter > 7 ? "alt" : "";
    el.setAttribute("aria-label", el.textContent + ". Antippen: Sicherung speichern");
  }

  // ================= Zeichnen =================
  function render() {
    if (ui.ansicht !== "bewegung") clearInterval(pauseTimer);
    if (spielCtrl) { spielCtrl.stopp(); spielCtrl = null; }
    if (!FAECHER.length) { app.innerHTML = `<main class="mitte"><h1>Keine Inhalte gefunden.</h1></main>`; return; }
    if (!S.erstellt && ui.ansicht !== "willkommen") ui = startUi();
    let h = "";
    switch (ui.ansicht) {
      case "willkommen": h = willkommen(); break;
      case "start": h = start(); break;
      case "etappe-start": h = etappeStart(); break;
      case "runde": h = runde(); break;
      case "etappe-ende": h = etappeEnde(); break;
      case "bewegung": h = bewegung(); break;
      case "mission-ende": h = rundeEnde(true); break;
      case "runde-ende": h = rundeEnde(false); break;
      case "themen": h = themen(); break;
      case "karten": h = karten(); break;
      case "probe-start": h = probeStart(); break;
      case "probe": h = probe(); break;
      case "probe-ende": h = probeEnde(); break;
      case "auftraege": h = auftraegeSeite(); break;
      case "spielhalle": h = spielhalle(); break;
      // Ein Spiel startet nur nach dem Bezahlen mit einem Token, nie durch erneutes Zeichnen
      case "spiel": if (ui.spielNeu) h = spielSeite(); else { ui = { ansicht: "spielhalle" }; h = spielhalle(); } break;
      case "tier": h = tierSeite(); break;
      case "eltern": h = eltern(); break;
      default: h = start();
    }
    if (ui.levelUp) h += `<div class="dialog-hinter"><div class="dialog levelup" role="dialog" aria-label="Level-Up"><p class="leise">Level-Up</p><div class="zahl">Level ${ui.levelUp.n}</div><p>Rang: <b>${esc(ui.levelUp.rang)}</b></p>${ui.levelUp.neu.length ? `<p>Neu freigeschaltet: ${esc(ui.levelUp.neu.join(", "))} (App-Design)</p>` : ""}<div class="knopfzeile" style="justify-content:center"><button class="btn haupt" data-act="levelup-zu">Weiter</button></div></div></div>`;
    if (ui.tor) h += `<div class="dialog-hinter"><div class="dialog" role="dialog" aria-label="Für Eltern"><h2>Für Eltern</h2><p>Halte den Knopf etwa zwei Sekunden gedrückt, bis er ganz gefüllt ist. Oder rechne:</p><p class="tor-aufgabe"><b>${ui.tor.a} × ${ui.tor.b} =</b> <input id="tor-eingabe" class="eingabe klein" inputmode="numeric" autocomplete="off" aria-label="Ergebnis"></p><div class="knopfzeile"><button class="btn haupt" data-act="tor-ok">Öffnen</button><button class="btn" data-act="tor-zu">Abbrechen</button></div></div></div>`;
    if (ui.sicherFrage) h += `<div class="dialog-hinter"><div class="dialog" role="dialog" aria-label="Sicherung"><h2>Spielstand sichern?</h2><p>Die Sicherungsdatei kannst du in «Dateien» ablegen. Damit geht nichts verloren.</p><div class="knopfzeile"><button class="btn haupt" data-act="sicherung">Sicherung speichern</button><button class="btn" data-act="dialog-zu">Abbrechen</button></div></div></div>`;
    document.body.classList.toggle("ruhig", !!S.einst.ruhig);
    document.documentElement.setAttribute("data-theme", S.theme || "nacht");
    app.innerHTML = mitHund(h, true);
    if (ui.ansicht === "spiel") spielStartenNachRender();
    versionAnzeigen();
    const inp = document.getElementById("eingabe"); if (inp && !inp.disabled && !("ontouchstart" in window)) inp.focus();
    const sd = document.getElementById("sicherung-datei"); if (sd) sd.onchange = () => { if (sd.files && sd.files[0]) sicherungLaden(sd.files[0]); };
    elternKnopf();
  }
  function vorlesen() {
    const R = ui.runde; if (!R || !R.task) return;
    const t = R.task;
    const teile = [[t.frage, "de"]];
    if (t.text) teile.push([t.text.replace(/___/g, "…"), t.textSprache || "de"]);
    if (t.art === "wahl" || t.art === "mehr") for (const o of t.optionen) teile.push([o, t.optionenSprache || "de"]);
    sprich(teile);
  }

  // Langer Druck öffnet die Eltern-Übersicht (Kinder tippen nur kurz)
  // Langer Druck öffnet die Eltern-Übersicht. Mit Touch-Ereignissen statt Pointer-Ereignissen, weil ältere iPads
  // diese nicht kennen und neuere einen langen Druck sonst als Textauswahl abbrechen. Die Füllung läuft per JavaScript.
  // Kurz getippt: kleine Rechenaufgabe für Erwachsene als zweiter Weg.
  function elternKnopf() {
    const b = document.getElementById("eltern-knopf"); if (!b) return;
    const fuell = b.querySelector(".fuell");
    const DAUER = TEST.elternMs || 1500;
    let start = 0, tmr = null, letzterTouch = 0, offen = false;
    const stopp = () => { clearInterval(tmr); tmr = null; b.classList.remove("drueckt"); if (fuell) fuell.style.width = "0"; };
    const schritt = () => {
      const p = Math.min(1, (Date.now() - start) / DAUER);
      if (fuell) fuell.style.width = Math.round(p * 100) + "%";
      if (p >= 1 && !offen) { offen = true; stopp(); gehe("eltern", { reiter: "fortschritt" }); }
    };
    const los = () => { if (tmr) return; start = Date.now(); offen = false; b.classList.add("drueckt"); tmr = setInterval(schritt, 40); };
    const loslassen = () => { const lief = tmr !== null; stopp(); if (lief && !offen) elternTor(); };
    b.addEventListener("touchstart", (e) => { e.preventDefault(); letzterTouch = Date.now(); los(); }, { passive: false });
    b.addEventListener("touchend", (e) => { e.preventDefault(); loslassen(); }, { passive: false });
    b.addEventListener("touchcancel", stopp);
    b.addEventListener("mousedown", (e) => { if (Date.now() - letzterTouch < 1500) return; e.preventDefault(); los(); });
    b.addEventListener("mouseup", () => { if (Date.now() - letzterTouch < 1500) return; loslassen(); });
    b.addEventListener("mouseleave", stopp);
    b.addEventListener("contextmenu", (e) => e.preventDefault());
    b.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); elternTor(); } });
  }
  function elternTor() {
    ui.tor = { a: 12 + (zufall() % 18), b: 12 + (zufall() % 18) };
    render();
    const i = document.getElementById("tor-eingabe"); if (i && !("ontouchstart" in window)) i.focus();
  }

  // ================= Aktionen =================
  function act(name, arg, el) {
    const R = ui.runde;
    switch (name) {
      // Willkommen
      case "w-name": { const v = (document.getElementById("name").value || "").trim(); if (!v) { toast("Schreib deinen Namen hinein."); return; } S.name = v.slice(0, 20); ui.schritt = 2; render(); return; }
      case "w-tier": ui.art = arg; render(); return;
      case "w-tier-ok": if (ui.art) { ui.schritt = 3; render(); } return;
      case "w-fertig": {
        const v = (document.getElementById("tiername").value || "").trim();
        S.tier = { art: ui.art, name: (v || TIER.ARTEN[ui.art].name).slice(0, 20) };
        S.erstellt = Date.now(); S.muenzen += 10; speichern();
        try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* egal */ }
        gehe("start"); toast("10 Münzen zum Start."); return;
      }
      case "heim": clearInterval(pauseTimer); gehe("start"); return;
      case "fach": S.fach = arg; speichern(); gehe(ui.ansicht === "eltern" ? "eltern" : "start", ui.ansicht === "eltern" ? { reiter: "einst" } : null); return;
      // Mission und Runden
      case "mission": {
        const m = missionHeute();
        if (tag().mission) return starteRunde("bonus", [{ titel: "Bonus-Runde", art: "mix", themen: null, fach: m.haupt.f.id }], "Bonus-Runde");
        return starteRunde("mission", m.etappen);
      }
      case "etappe-los": if (bereiteEtappe()) naechsteAufgabe(); return;
      case "naechste-etappe": clearInterval(pauseTimer); R.nr++; ui = { ansicht: "etappe-start", runde: R }; render(); return;
      case "bewegung": starteBewegung(); return;
      case "pause-runde": zeitBuchen(); speichern(); gehe("start"); return;
      case "themen": gehe("themen"); return;
      case "thema": return starteRunde("ueben", [{ titel: arg ? themaName(fach(), arg) : "Alles gemischt", art: arg && L.fachTeile(fach()).some((t) => t.thema === arg && L.teilStand(S, fach().id, t.id).n === 0) ? "neu" : "mix", themen: arg ? [arg] : null, fach: fach().id }], arg ? themaName(fach(), arg) : "Alles gemischt");
      case "kiste": { const n = (S.fehler[fach().id] || []).length; if (!n) return; return starteRunde("kiste", [{ titel: "Fehlerkiste", art: "kiste", themen: null, n: Math.min(10, n), fach: fach().id }], "Fehlerkiste"); }
      case "karten": gehe("karten", { thema: null }); return;
      case "auftraege": gehe("auftraege"); return;
      case "auftrag-fertig": { const lv = level(); if (L.auftragErledigt(S, arg, heute())) { speichern(); pruefeLevelUp(lv); render(); ton(12); plusAnzeigen("+" + L.LOHN.auftrag); toast(`Challenge geschafft: +${L.LOHN.auftrag} Münzen und ${L.LOHN.punkteAuftrag} XP.`); } return; }
      case "karten-thema": ui.thema = arg; render(); return;
      case "sag": sprich(arg); return;
      case "sag-en": sprich([[arg, "en"]]); return;
      case "vorlesen": vorlesen(); return;
      case "tipp-zeigen": if (R) { R.tippOffen = true; render(); } return;
      case "weiter": naechsteAufgabe(); return;
      // Antworten
      case "waehle": {
        const t = R.task; const wert = t.art === "wahr" ? [true, false][Number(arg)] : t.optionen[Number(arg)];
        if (ui.ansicht === "probe") { R.antwort = wert; render(); return; }
        return pruefe(wert);
      }
      case "tippen-bild": {
        const ev = window.__letzterKlick; if (!ev || !el.getScreenCTM) return;
        let best = null;
        for (const g of el.querySelectorAll("[data-act=tippen]")) {
          const c = g.querySelector("circle"); const b = c.getBoundingClientRect();
          const d = Math.hypot(ev.clientX - (b.left + b.width / 2), ev.clientY - (b.top + b.height / 2));
          if (!best || d < best.d) best = { d, nr: g.getAttribute("data-arg") };
        }
        if (best && best.d <= 56) act("tippen", best.nr);
        return;
      }
      case "tippen": if (ui.ansicht === "probe") { R.antwort = Number(arg); render(); return; } return pruefe(Number(arg));
      case "mehr": { const o = R.task.optionen[Number(arg)]; const i = R.antwort.indexOf(o); if (i >= 0) R.antwort.splice(i, 1); else R.antwort.push(o); R.falsch = R.falsch.filter((x) => x !== o); render(); return; }
      case "reihe-rein": { const x = R.task.items[Number(arg)]; const i = R.antwort.indexOf(null); if (i >= 0) R.antwort[i] = x; render(); return; }
      case "reihe-raus": R.antwort[Number(arg)] = null; render(); return;
      case "paar-l": case "paar-r": {
        const t = R.task, seite = name === "paar-l" ? "l" : "r";
        const wert = seite === "l" ? t.links[Number(arg)] : t.rechts[Number(arg)];
        const verbinde = (l, r) => { for (const k of Object.keys(R.antwort)) if (R.antwort[k] === r) delete R.antwort[k]; R.antwort[l] = r; R.wahl = null; };
        if (R.wahl && R.wahl.seite !== seite) { if (seite === "l") verbinde(wert, R.wahl.wert); else verbinde(R.wahl.wert, wert); }
        else {
          // schon verbunden? Dann lösen und neu wählen
          if (seite === "l" && R.antwort[wert] != null) delete R.antwort[wert];
          if (seite === "r") for (const k of Object.keys(R.antwort)) if (R.antwort[k] === wert) delete R.antwort[k];
          R.wahl = R.wahl && R.wahl.seite === seite && R.wahl.wert === wert ? null : { seite, wert };
        }
        render(); return;
      }
      case "luecke": { const i = Number(arg); if (R.antwort[i]) R.antwort[i] = null; R.wahl = i; render(); return; }
      case "wort": {
        const w = R.task.bank[Number(arg)];
        let i = R.wahl != null && !R.antwort[R.wahl] ? R.wahl : R.antwort.indexOf(null);
        if (i < 0) return;
        R.antwort[i] = w; R.wahl = R.antwort.indexOf(null) >= 0 ? R.antwort.indexOf(null) : null; render(); return;
      }
      case "pruefen": {
        const t = R.task;
        if (t.art === "schreiben" || t.art === "zahl") { const el2 = document.getElementById("eingabe"); R.antwort = el2 ? el2.value : ""; }
        return pruefe(t.art === "reihe" || t.art === "luecke" ? R.antwort.slice() : t.art === "paare" ? Object.assign({}, R.antwort) : R.antwort);
      }
      // Probe
      case "probe-start": gehe("probe-start"); return;
      case "probe-los": {
        const specs = L.buildProbe(fach(), S, { n: S.einst.probeAnzahl, seed: zufall() });
        ui = { ansicht: "probe", runde: { typ: "probe", specs, i: -1, ergebnisse: [], etappen: [{ titel: "Probe" }], nr: 0, fachId: fach().id } };
        probeNaechste(); return;
      }
      case "probe-weiter": probeAntwort(false); return;
      case "probe-skip": probeAntwort(true); return;
      // Tier
      case "tier": gehe("tier", { reiter: "futter" }); return;
      case "tier-reiter": ui.reiter = arg; render(); return;
      case "theme": { const t = L.THEMES.find((x) => x.id === arg); if (t && level() >= t.ab) { S.theme = t.id; speichern(); render(); } return; }
      case "streicheln": if (ui.ansicht === "start") { gehe("tier", { reiter: "futter" }); return; } tierReagiert("jubel", pick(["Wuff.", "Noch mal.", "Kraulen ist gut."]), 1500); return;
      case "kaufen": {
        const d = L.shopDing(arg); if (!d) return;
        if (L.SHOP.zubehoer.includes(d) && S.besitz.includes(d.id)) {
          const i = S.traegt.indexOf(d.id); if (i >= 0) S.traegt.splice(i, 1); else S.traegt.push(d.id);
          speichern(); render(); return;
        }
        const r = L.kaufe(S, arg);
        if (!r.ok) { if (r.grund === "muenzen") tierReagiert(null, `Dafür fehlen noch ${r.fehlt} Münzen. Die bekommst du beim Üben!`, 2600); return; }
        speichern();
        if (r.snack) tierReagiert(d.id === "wasser" ? "jubel" : "mampf", d.id === "wasser" ? "Schlabber." : pick(["Mmh.", "Lecker.", "Mehr davon."]), 2000);
        else tierReagiert("jubel", L.SHOP.zubehoer.includes(d) ? "Neuer Look." : "Neu im Zimmer.", 1800);
        return;
      }
      // Eltern
      case "eltern-reiter": ui.reiter = arg; ui.reset = false; render(); return;
      case "plan-speichern": {
        const f = fach();
        const d = document.getElementById("arbeit-datum").value, ti = document.getElementById("arbeit-titel").value.trim();
        S.plan[f.id] = { start: heute(), arbeit: L.gueltigesDatum(d) ? d : null, titel: ti.slice(0, 60) };
        speichern(); render(); toast("Plan gespeichert."); return;
      }
      case "namen-speichern": {
        const n = document.getElementById("e-name").value.trim(), tn = document.getElementById("e-tiername").value.trim(), art = document.getElementById("e-art").value;
        if (n) S.name = n.slice(0, 20);
        if (TIER.ARTEN[art]) S.tier.art = art;
        if (tn) S.tier.name = tn.slice(0, 20);
        S.hund = document.getElementById("e-hund").value.trim().slice(0, 20);
        speichern(); render(); toast("Gespeichert."); return;
      }
      case "sicherung": ui.sicherFrage = false; sicherungSpeichern(); render(); return;
      case "text-kopieren": {
        ui.sicherText = JSON.stringify({ app: "lernnest", version: VER.n, gespeichert: new Date().toISOString(), stand: S });
        render();
        const ta = document.getElementById("sicher-text");
        let kopiert = false;
        try { ta.removeAttribute("readonly"); ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length); kopiert = document.execCommand("copy"); ta.setAttribute("readonly", ""); ta.blur(); } catch (e) { /* dann von Hand kopieren */ }
        if (kopiert) { S.lastBackup = Date.now(); speichern(); }
        toast(kopiert ? "Kopiert. Jetzt in einer Notiz einfügen." : "Bitte den Text lange antippen und kopieren.");
        return;
      }
      case "text-laden": {
        const t = (document.getElementById("lade-text") || {}).value || "";
        try { sicherungAusText(t); } catch (e) { toast("Dieser Text ist keine Lernnest-Sicherung."); }
        return;
      }
      case "dialog-zu": ui.sicherFrage = false; render(); return;
      case "tor-zu": ui.tor = null; render(); return;
      case "levelup-zu": ui.levelUp = null; render(); return;
      case "spiel-weiter": { const o = app.querySelector(".spiel .spiel-ende"); if (o) o.remove(); if (spielCtrl) spielCtrl.pause(false); return; }
      case "spielhalle": gehe("spielhalle"); return;
      case "spiel-start": spielStarten(arg); return;
      case "spiel-abbrechen": if (spielCtrl) { ui.spielAbbruch = true; spielCtrl.ende(); } else gehe("spielhalle"); return;
      case "tor-ok": {
        const v = Number((document.getElementById("tor-eingabe") || {}).value);
        if (ui.tor && v === ui.tor.a * ui.tor.b) { ui.tor = null; gehe("eltern", { reiter: "fortschritt" }); }
        else { toast("Das stimmt leider nicht."); elternTor(); }
        return;
      }
      case "reset": ui.reset = true; render(); return;
      case "reset-nein": ui.reset = false; render(); return;
      case "reset-ja": {
        try { localStorage.setItem(VOR, JSON.stringify(S)); } catch (e) { /* egal */ }
        S = L.defaults(); speichern(); idbSchreiben(JSON.stringify(S)); ui = startUi(); render(); return;
      }
    }
  }
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el || el.disabled) return;
    if (el.id === "eltern-knopf") return;
    e.preventDefault();
    window.__letzterKlick = { clientX: e.clientX, clientY: e.clientY };
    act(el.getAttribute("data-act"), el.getAttribute("data-arg"), el);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const t = e.target;
    if (t && t.id === "eingabe") { e.preventDefault(); act(ui.ansicht === "probe" ? "probe-weiter" : "pruefen"); }
    if (t && (t.id === "name")) { e.preventDefault(); act("w-name"); }
    if (t && (t.id === "tiername")) { e.preventDefault(); act("w-fertig"); }
    if (t && (t.id === "tor-eingabe")) { e.preventDefault(); act("tor-ok"); }
  });
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (!t || t.getAttribute("data-change") !== "einst") return;
    const e2 = S.einst;
    if (t.id === "e-etappe") e2.etappe = Number(t.value);
    if (t.id === "e-pauseSek") e2.pauseSek = Number(t.value);
    if (t.id === "e-probe") e2.probeAnzahl = Number(t.value);
    if (t.id === "e-spiele") e2.spieleProTag = Number(t.value);
    if (t.id === "e-pause") e2.pause = t.checked;
    if (t.id === "e-toene") e2.toene = t.checked;
    if (t.id === "e-ruhig") e2.ruhig = t.checked;
    if (t.id === "e-vorlesen") e2.vorlesen = t.checked;
    S = L.migrate(S); speichern(); render();
  });
  // Eingabe in Schreibfeldern merken (für Neuzeichnen)
  document.addEventListener("input", (e) => { if (e.target && e.target.id === "eingabe" && ui.runde) ui.runde.antwort = e.target.value; });

  // ================= Offline =================
  if ("serviceWorker" in navigator && location.protocol !== "file:" && !TEST.keinSW) navigator.serviceWorker.register("sw.js").catch(() => { /* ohne Offline weiter */ });

  // Für die Tests: lesender Zugriff
  window.__LN = { stand: () => S, ui: () => ui, aufgabe: () => (ui.runde ? ui.runde.task : null), version: VER, speichern, spiel: () => spielCtrl };
  render();
})();
