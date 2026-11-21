// Browser-Test: spielt die App wie ein Kind durch (Willkommen, Tagesmission mit Fehlern und Bewegungspause,
// Tier, Fehlerkiste, Frei üben, Lernkarten, Probe) und prüft die Eltern-Übersicht.
// Aufruf: node tools/e2e.mjs [ordner-für-screenshots]
import fs from "node:fs";
import { oeffne, einrichten, aufgabe, ansicht, stand, loese, falsch, spieleEtappe, langDruecken, levelUpZu, pruefer, VERSION } from "./helfer.mjs";

const bilder = process.argv[2];
if (bilder) fs.mkdirSync(bilder, { recursive: true });
const { ok, ende } = pruefer("Ablauf");
const H = "2026-11-12";
const { page, fehler, zu } = await oeffne();
const FID = await page.evaluate(() => window.LN_FAECHER[0].id);
const keinPlatzhalter = async (wo) => ok(!(await page.textContent("body")).includes("{hund"), `${wo}: kein {hund}-Platzhalter sichtbar`);
const foto = async (n) => { if (bilder) await page.screenshot({ path: `${bilder}/${n}.png`, fullPage: true }); };
const heim = async () => { await levelUpZu(page); await page.click("[data-act=heim]"); };

// ---------- Willkommen ----------
ok((await page.textContent("#version")).includes(`Version ${VERSION}`), "Versionsnummer oben sichtbar");
await foto("01-willkommen");
await page.click("[data-act=w-name]");
ok((await ansicht(page)) === "willkommen", "ohne Namen geht es nicht weiter");
await einrichten(page, "Testkind", "hund", "Flocke");
let s = await stand(page);
ok(s.name === "Testkind" && s.tier.art === "hund" && s.tier.name === "Flocke" && s.muenzen === 10, "Name, Tier und Willkommensgeschenk gespeichert");
ok((await page.textContent(".hund-karte .sprechblase")).includes("Fun Fact"), "Hund erzählt einen Fakt zum Thema");
ok((await page.textContent(".profil-kopf")).includes("Hey Testkind") && (await page.textContent(".level-zeile")).includes("Level 1"), "Begrüßung mit Name und Level 1");
ok(s.tokens === 0 && (await page.locator(".chips .tokens").textContent()).includes("0"), "zu Beginn keine Tokens");
ok(!(await page.textContent("body")).includes(" · "), "keine Mittelpunkte als Trenner");
await keinPlatzhalter("Start");
ok((await page.textContent(".hund-karte")).includes("Flocke"), "Tiername auf der Startseite");
ok(await page.locator("[data-act=kiste]").isDisabled(), "leere Fehlerkiste ist aus");
await foto("02-start");

// ---------- Tagesmission ----------
await page.click("[data-act=mission]");
ok((await ansicht(page)) === "etappe-start" && (await page.textContent("main")).includes("Etappe 1 von 3"), "Etappe 1 von 3 startet");
const etappenFach = await page.evaluate(() => window.__LN.ui().runde.etappen.map((e) => e.fach));
ok(etappenFach[0] !== etappenFach[1] && etappenFach[1] === etappenFach[2], `gemeinsame Mission: Aufwärmen im einen Fach, Schwerpunkt im anderen (${etappenFach.join(", ")})`);
await keinPlatzhalter("Etappe 1");
await page.click("[data-act=etappe-los]");
await foto("03-aufgabe");
// erste Aufgabe: einmal falsch, dann richtig
let t = await falsch(page);
let R = await page.evaluate(() => window.__LN.ui().runde);
if (t.art === "wahr" || (t.art === "wahl" && t.optionen.length <= 2)) ok(R.status === "loesung", "bei Stimmt/Stimmt nicht gleich die Lösung");
else {
  ok(R.status === "tipp" && (await page.locator(".rueck.tipp").count()) === 1, "nach dem ersten Fehler: Tipp");
  await foto("04-tipp");
  await loese(page);
  ok((await page.evaluate(() => window.__LN.ui().runde.status)) === "richtig", "danach richtig gelöst");
}
s = await stand(page);
ok(Object.values(s.fehler).some((l) => l.includes(t.teil)), "Fehler liegt in der Fehlerkiste");
await page.click("[data-act=weiter]");
// zweite Aufgabe: zweimal falsch, dann kommt die Lösung und die Aufgabe kommt wieder
t = await aufgabe(page);
const specsVorher = await page.evaluate(() => window.__LN.ui().runde.specs.length);
await falsch(page);
if ((await page.evaluate(() => window.__LN.ui().runde.status)) === "tipp") await falsch(page);
ok((await page.evaluate(() => window.__LN.ui().runde.status)) === "loesung", "nach zwei Fehlern: Lösung mit Erklärung");
ok((await page.locator(".rueck.loesung").textContent()).length > 20, "Lösungskasten hat Text");
await foto("05-loesung");
ok((await page.evaluate(() => window.__LN.ui().runde.specs.length)) === specsVorher + 1, "Aufgabe kommt in der Etappe noch einmal");
await page.click("[data-act=weiter]");
while ((await ansicht(page)) === "runde") {
  const st = await page.evaluate(() => window.__LN.ui().runde.status);
  if (st === "richtig" || st === "loesung") await page.click("[data-act=weiter]"); else await loese(page);
}
ok((await ansicht(page)) === "etappe-ende", "Etappe 1 geschafft");
await foto("06-etappe-ende");
s = await stand(page);
{
  const b = await page.evaluate(() => window.__LN.ui().runde.belohnung);
  const n = await page.evaluate(() => window.__LN.ui().runde.anzahl);
  ok(b.anzahl === n && b.ersteRichtig <= n - 2, `wiederholte Aufgaben zählen nicht als «auf Anhieb» (${b.ersteRichtig} von ${n})`);
  ok(s.tokens === (b.ersteRichtig >= Math.ceil(n * 0.8) ? 1 : 0), `Token nur mit ${Math.ceil(n * 0.8)} von ${n} auf Anhieb (bekommen: ${s.tokens})`);
  ok((await page.textContent("main")).includes(`${b.ersteRichtig} von ${n} auf Anhieb`), "Ergebnis der Etappe sichtbar");
}
await levelUpZu(page);
ok(s.tage[H].etappen === 1 && !s.tage[H].mission, "eine Etappe gezählt");
await page.click("[data-act=bewegung]");
ok((await ansicht(page)) === "bewegung" && (await page.locator("#pause-weiter").isDisabled()), "Bewegungspause, Weiter erst nach der Zeit");
await foto("07-bewegung");
await page.waitForFunction(() => !document.getElementById("pause-weiter").disabled, null, { timeout: 5000 });
await page.click("#pause-weiter");
ok((await page.textContent("main")).includes("Etappe 2 von 3"), "Etappe 2 startet nach der Pause");
ok((await page.locator(".warum-box").count()) === 1, "Neues Thema beginnt mit der Warum-Frage");
if (etappenFach[1] === "bio") ok((await page.textContent(".warum-box")).includes("Flocke"), "Warum-Frage nennt den Hund");
await foto("07b-warum");
await spieleEtappe(page);
await page.click("[data-act=bewegung]");
await page.waitForFunction(() => !document.getElementById("pause-weiter").disabled, null, { timeout: 5000 });
await page.click("#pause-weiter");
await spieleEtappe(page);
ok((await ansicht(page)) === "mission-ende", "Tagesmission geschafft");
await foto("08-mission-ende");
s = await stand(page);
ok(s.tage[H].mission === true && s.tage[H].etappen === 3, "Mission im Tag eingetragen");
ok(s.muenzen > 20 && s.muenzen < 60, `Münzen verdient, aber nicht zu viele (${s.muenzen})`);
ok(s.tokens >= 3, `Tokens: zwei fehlerfreie Etappen und die Mission (${s.tokens})`);
ok(s.punkte >= 200, `XP gesammelt (${s.punkte})`);
ok(s.tage[H].aufgaben >= 18 && s.tage[H].sek >= 0, "Aufgaben gezählt");
ok((await page.locator("[data-act=levelup-zu]").count()) === 1 || (await page.evaluate(() => window.LN.level(window.__LN.stand().punkte))) >= 2, "Level-Up nach der Mission");
await foto("08b-levelup");
await heim();
ok((await page.textContent("[data-act=mission]")).includes("Bonus"), "danach: Bonus-Runde");
ok((await page.textContent(".level-zeile")).match(/Level [2-9]/), "Level gestiegen");
ok((await page.locator(".etappe-punkt.fertig").count()) === 3, "drei Haken bei den Etappen");

// ---------- Tier ----------
// ---------- Spielhalle ----------
{
  const tk = (await stand(page)).tokens;
  await page.click(".arcade [data-act=spielhalle]");
  ok((await ansicht(page)) === "spielhalle" && (await page.locator("[data-act=spiel-start]").count()) === 2, "Spielhalle mit zwei Spielen");
  await foto("08c-spielhalle");
  await page.click("[data-act=spiel-start][data-arg=run]");
  ok((await ansicht(page)) === "spiel" && (await stand(page)).tokens === tk - 1, "Spielen kostet einen Token");
  ok((await stand(page)).tage[H].spiele === 1 && (await stand(page)).spiele.run.runden === 1, "Spielrunde gezählt");
  await page.waitForTimeout(900);
  ok((await page.evaluate(() => window.__LN.spiel().zustand().strecke)) > 50, "der Hund läuft");
  const vorSprung = await page.evaluate(() => window.__LN.spiel().zustand().fuss);
  await page.click("canvas.spielfeld");
  await page.waitForTimeout(150);
  ok((await page.evaluate(() => window.__LN.spiel().zustand().fuss)) < vorSprung, "Tippen lässt den Hund springen");
  await foto("08d-run");
  // Spiel durch Zusammenstoß beenden lassen
  await page.evaluate(() => { const z = window.__LN.spiel().zustand(); z.vorbei = true; z.grund = "hindernis"; z.punkte = 321; });
  await page.waitForSelector(".spiel-ende");
  ok((await page.textContent(".spiel-ende")).includes("321") && (await stand(page)).spiele.run.best === 321, "Ergebnis und Rekord gespeichert");
  await foto("08e-run-ende");
  // erneutes Zeichnen startet kein Gratisspiel
  await page.evaluate(() => window.__LN.speichern());
  await page.click(".spiel-ende [data-act=spielhalle]");
  ok((await ansicht(page)) === "spielhalle" && (await stand(page)).tokens === tk - 1, "zurück in der Spielhalle, kein Token verloren");
  // Sky Jump
  await page.click("[data-act=spiel-start][data-arg=sprung]");
  await page.waitForTimeout(700);
  ok((await page.evaluate(() => window.__LN.spiel().zustand().maxY)) > 40, "Sky Jump: der Hund springt von allein nach oben");
  await page.dispatchEvent("[data-spiel=links]", "mousedown");
  await page.waitForTimeout(250);
  ok((await page.evaluate(() => window.__LN.spiel().zustand().vx)) < -100, "Knopf gedrückt halten lenkt nach links");
  await page.dispatchEvent("[data-spiel=links]", "mouseup");
  await page.waitForTimeout(250);
  ok(Math.abs(await page.evaluate(() => window.__LN.spiel().zustand().vx)) < 100, "loslassen bremst");
  ok((await page.textContent("#hud-hoehe")).includes(" m"), "Höhe wird angezeigt");
  await foto("08f-sprung");
  await page.click("[data-act=spiel-abbrechen]");
  ok((await page.textContent(".spiel-ende")).includes("Spiel beendet") && (await page.textContent(".spiel-ende")).includes("m hoch"), "Abbrechen zeigt das Ergebnis mit Höhe");
  ok((await stand(page)).spiele.sprung.runden === 1, "Sky-Jump-Runde gezählt");
  await page.click(".spiel-ende [data-act=spielhalle]");
  // Tageslimit
  await page.evaluate(() => { const s = window.__LN.stand(); s.tokens = 5; s.einst.spieleProTag = 2; window.__LN.speichern(); });
  await heim(); await page.click(".arcade [data-act=spielhalle]");
  ok(await page.locator("[data-act=spiel-start][data-arg=run]").isDisabled(), "nach zwei Runden ist die Spielhalle für heute zu");
  ok((await page.textContent("main")).includes("Für heute ist die Spielhalle zu"), "Hinweis aufs Tageslimit");
  await page.evaluate(() => { const s = window.__LN.stand(); s.einst.spieleProTag = 5; s.tokens = 0; window.__LN.speichern(); });
  await heim(); await page.click(".arcade [data-act=spielhalle]");
  ok(await page.locator("[data-act=spiel-start][data-arg=run]").isDisabled(), "ohne Tokens kein Spiel");
  await heim();
}

// ---------- Tier ----------
await page.click(".hund-karte");
const m0 = (await stand(page)).muenzen;
ok((await page.locator("[data-act=kaufen][data-arg=kuchen]").count()) === 0 && (await page.locator("[data-act=kaufen][data-arg=kauknochen]").count()) === 1, "Hund bekommt nur Hundefutter, keinen Kuchen");
ok((await page.locator(".laden-ding svg.laden-bild").count()) >= 5 && (await page.locator(".muenzen svg.muenze").count()) === 1, "gezeichnete Bilder im Laden und goldene Münze oben");
// App-Design: freigeschaltet nach Level
await page.click("[data-act=tier-reiter][data-arg=design]");
ok(!(await page.locator("[data-act=theme][data-arg=hell]").isDisabled()) && (await page.locator("[data-act=theme][data-arg=galaxy]").isDisabled()), "helles Design frei, Galaxy erst ab Level 8");
await page.click("[data-act=theme][data-arg=hell]");
ok((await stand(page)).theme === "hell" && (await page.getAttribute("html", "data-theme")) === "hell", "Design gewechselt");
await foto("09a-design-hell");
await page.click("[data-act=theme][data-arg=nacht]");
await page.click("[data-act=tier-reiter][data-arg=futter]");
await page.click("[data-act=kaufen][data-arg=leckerli]");
s = await stand(page);
ok(s.muenzen === m0 - 4 && s.gefuettert === 1, "Leckerli gefüttert");
ok((await page.locator(".kau").count()) === 1, "Tier mampft");
await page.click("[data-act=tier-reiter][data-arg=zubehoer]");
await page.click("[data-act=kaufen][data-arg=schleife]");
s = await stand(page);
ok(s.besitz.includes("schleife") && s.traegt.includes("schleife"), "Schleife gekauft und angezogen");
await page.click("[data-act=kaufen][data-arg=schleife]");
ok(!(await stand(page)).traegt.includes("schleife"), "Schleife wieder abgelegt");
await page.evaluate(() => { window.__LN.stand().muenzen = 2; });
await page.click("[data-act=kaufen][data-arg=krone]");
ok((await page.textContent(".sprechblase")).includes("fehlen noch"), "zu wenig Münzen: freundlicher Hinweis");
ok(!(await stand(page)).besitz.includes("krone"), "nichts gekauft ohne Münzen");
await page.evaluate(() => { window.__LN.stand().muenzen = 200; window.__LN.speichern(); });
await page.click("[data-act=tier-reiter][data-arg=zimmer]");
ok((await page.locator("[data-act=kaufen][data-arg=korb]").count()) === 1 && (await page.locator("[data-act=kaufen][data-arg=napf]").count()) === 1, "Zimmer: Hundekorb und Napf im Laden");
for (const id of ["korb", "decke", "napf", "ente"]) await page.click(`[data-act=kaufen][data-arg=${id}]`);
ok((await stand(page)).besitz.includes("korb") && (await stand(page)).besitz.includes("napf"), "Hundekorb und Napf gekauft");
await page.evaluate(() => { window.__LN.stand().besitz.push("pflanze", "ball"); window.__LN.speichern(); });
await page.click("[data-act=tier-reiter][data-arg=futter]"); await page.click("[data-act=tier-reiter][data-arg=zimmer]");
ok((await page.locator("[data-act=kaufen][data-arg=pflanze]").count()) === 1 && (await page.locator("[data-act=kaufen][data-arg=ball]").count()) === 1, "früher gekaufte Sachen bleiben sichtbar, nichts doppelt");
await foto("09-tier");
await page.click("[data-act=streicheln]");
ok((await page.locator(".herzen").count()) === 1, "Streicheln zeigt Herzen");

// ---------- Fehlerkiste ----------
// Die Fehler aus der Mission sind nach zweimal richtig schon wieder raus. Für den Test drei Fehler hineinlegen.
ok(((await stand(page)).fehler[FID] || []).length <= 2, "Fehler aus der Mission sind geübt und weitgehend raus");
await page.evaluate((fid) => { const s = window.__LN.stand(); const f = window.LN_FAECHER[0]; s.fehler[fid] = window.LN.fachTeile(f).filter((t, i) => i % 9 === 0).slice(0, 3).map((t) => t.id); window.__LN.speichern(); }, FID);
await heim();
const kiste = (await stand(page)).fehler[FID].length;
ok(kiste >= 1 && !(await page.locator("[data-act=kiste]").isDisabled()), "Fehlerkiste hat Einträge");
await page.click("[data-act=kiste]");
const nKiste = await spieleEtappe(page);
ok(nKiste === Math.min(10, kiste), `Fehlerkiste übt genau die Fehler (${nKiste})`);
ok((await ansicht(page)) === "runde-ende", "Fehlerkiste-Runde fertig");

// ---------- Frei üben ----------
await heim();
await page.click("[data-act=themen]");
ok((await page.locator(".thema-karte").count()) >= 2, "Themen zur Auswahl");
await foto("10-themen");
await page.click(".thema-karte >> nth=1");
await spieleEtappe(page);
ok((await ansicht(page)) === "runde-ende", "Thema geübt");

// ---------- Lernkarten ----------
await heim();
await page.click("[data-act=karten]");
ok((await page.locator(".lernkarte").count()) >= 3, "Lernkarten sichtbar");
await page.click("[data-act=karten-thema] >> nth=1");
ok((await page.locator(".lernkarte .fig svg").count()) >= 1 || (await page.locator(".lernkarte").count()) >= 1, "zweites Thema");
await foto("11-lernkarten");

// ---------- Forschen & Basteln ----------
await heim();
await page.click("[data-act=auftraege]");
ok((await page.locator(".auftrag").count()) >= 4, "Mitmach-Aufträge sichtbar");
await keinPlatzhalter("Aufträge");
await foto("11b-auftraege");
const mA = (await stand(page)).muenzen;
const aid = await page.getAttribute("[data-act=auftrag-fertig] >> nth=0", "data-arg");
await page.click("[data-act=auftrag-fertig] >> nth=0");
s = await stand(page);
ok(s.auftraege[aid] === H && s.muenzen === mA + 5, "Challenge geschafft: +5 Münzen, Datum gespeichert");
ok((await page.locator(".auftrag.erledigt").count()) === 1, "Auftrag als geschafft markiert");
ok((await page.locator(`[data-act=auftrag-fertig][data-arg="${aid}"]`).count()) === 0, "kein zweites Mal Münzen");

// ---------- Probe ----------
await heim();
await page.click("[data-act=probe-start]");
await page.click("[data-act=probe-los]");
await foto("12-probe");
await page.click("[data-act=probe-skip]");
let probeN = 0;
while ((await ansicht(page)) === "probe" && probeN < 40) { await loese(page, { probe: true }); probeN++; }
ok((await ansicht(page)) === "probe-ende", "Probe fertig");
ok((await page.textContent("main")).includes("100 %"), "alles richtig: 100 %");
s = await stand(page);
ok(s.proben[FID].length === 1 && s.proben[FID][0].prozent === 100, "Probe gespeichert");
ok((await page.locator(".belohnung .neu").count()) === 1, "Probe ab 80 %: ein Token");
await foto("13-probe-ende");
await heim();

// ---------- Eltern ----------
await page.click("#eltern-knopf");
ok((await ansicht(page)) === "start" && (await page.locator(".dialog").textContent()).includes("Für Eltern"), "kurzes Tippen: Hinweis mit Rechenaufgabe statt Eltern-Übersicht");
const tor = await page.evaluate(() => window.__LN.ui().tor);
await page.fill("#tor-eingabe", String(tor.a * tor.b + 1)); await page.click("[data-act=tor-ok]");
ok((await ansicht(page)) === "start", "falsche Rechnung öffnet nicht");
const tor2 = await page.evaluate(() => window.__LN.ui().tor);
await page.fill("#tor-eingabe", String(tor2.a * tor2.b)); await page.click("[data-act=tor-ok]");
ok((await ansicht(page)) === "eltern", "richtige Rechnung öffnet die Eltern-Übersicht");
await heim();
// Langer Druck mit dem Finger (Touch-Ereignisse wie auf dem iPad)
{
  await page.locator("#eltern-knopf").scrollIntoViewIfNeeded();
  const bx = await page.locator("#eltern-knopf").boundingBox();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: bx.x + bx.width / 2, y: bx.y + bx.height / 2 }] });
  await page.waitForTimeout(100);
  const breite = await page.evaluate(() => parseFloat(document.querySelector("#eltern-knopf .fuell").style.width) || 0);
  ok(breite > 0, `beim Drücken füllt sich der Knopf (${breite} %)`);
  await page.waitForTimeout(350);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  ok((await ansicht(page)) === "eltern", "langer Druck mit dem Finger öffnet die Eltern-Übersicht");
  await heim();
}
await langDruecken(page, "#eltern-knopf", 450);
ok((await ansicht(page)) === "eltern", "langer Druck mit der Maus öffnet die Eltern-Übersicht");
ok((await page.locator(".tage-balken > div").count()) === 7, "Übungszeit für 7 Tage");
await foto("14-eltern");
await page.click("[data-act=eltern-reiter][data-arg=plan]");
await page.fill("#arbeit-titel", "Bio-Arbeit");
await page.fill("#arbeit-datum", "2026-11-26");
await page.click("[data-act=plan-speichern]");
s = await stand(page);
ok(s.plan[FID].arbeit === "2026-11-26" && s.plan[FID].start === H && s.plan[FID].titel === "Bio-Arbeit", "Arbeit eingetragen");
ok((await page.locator("table.plan tr").count()) === 15 && (await page.locator("table.plan tr.heute").count()) === 1, "Plan mit 15 Tagen, heute markiert");
await foto("15-plan");
await page.click("[data-act=eltern-reiter][data-arg=einst]");
await page.selectOption("#e-etappe", "4");
await page.uncheck("#e-pause");
await page.check("#e-ruhig");
await page.selectOption("#e-spiele", "3");
s = await stand(page);
ok(s.einst.etappe === 4 && s.einst.pause === false && s.einst.ruhig === true && s.einst.spieleProTag === 3, "Einstellungen gespeichert");
ok(await page.evaluate(() => document.body.classList.contains("ruhig")), "ruhiger Modus aktiv");
await page.fill("#e-tiername", "Fuchsi");
await page.fill("#e-hund", "Testhund");
await page.click("[data-act=namen-speichern]");
ok((await stand(page)).tier.name === "Fuchsi" && (await stand(page)).hund === "Testhund", "Tier umbenannt, Hundename gespeichert");
await heim();
await page.click("[data-act=karten]");
ok((await page.textContent("main")).includes("Testhund") && !(await page.textContent("main")).includes("Fuchsi fällt"), "Warum-Texte nennen den Hund zu Hause");
await keinPlatzhalter("Lernkarten mit Hundename");
await heim();
ok((await page.textContent(".countdown")).includes("14 Tage") && (await page.textContent(".countdown")).includes("Bio-Arbeit"), "Countdown zur Arbeit");
ok((await page.textContent(".mission")).includes("Bio: Neues zu «Das Skelett»") && /Aufwärmen (Englisch|Mathe)/.test(await page.textContent(".mission")), "Mission zeigt Schwerpunkt Bio (Arbeit zuerst) und ein anderes Fach zum Aufwärmen");

// ---------- Englisch: Fach wählen, Vokabeln, strenge Rechtschreibung ----------
ok((await page.locator(".fach-tab").count()) === 3, "drei Fächer als Reiter");
await page.click("[data-act=fach][data-arg=englisch]");
ok((await stand(page)).fach === "englisch" && (await page.locator(".fach-tab.aktiv").textContent()).includes("Englisch"), "Englisch gewählt");
await page.click("[data-act=karten]");
ok((await page.locator("table.vokabeln tbody tr").count()) >= 15, "Vokabelliste in den Lernkarten");
ok((await page.locator("[data-act=sag-en]").count()) >= 15, "jede Vokabel zum Anhören");
await heim();
await page.click("[data-act=themen]");
await page.click("[data-act=thema][data-arg=hunde-englisch]");
await page.click("[data-act=etappe-los]");
await page.evaluate(() => { const R = window.__LN.ui().runde; R.specs.splice(R.i + 1, 0, { teil: "w2-dog", modus: "de-en-schreiben", seed: 1 }); });
await loese(page); await page.click("[data-act=weiter]");
t = await aufgabe(page);
ok(t.modus === "de-en-schreiben" && t.loesung === "dog", "Schreibaufgabe Deutsch → Englisch");
ok((await page.getAttribute("#eingabe", "autocapitalize")) === "none", "iPad schreibt den ersten Buchstaben nicht automatisch groß");
await page.fill("#eingabe", "Dog"); await page.click("[data-act=pruefen]");
ok((await page.evaluate(() => window.__LN.ui().runde.status)) === "tipp" && (await page.textContent(".rueck.tipp")).includes("Kleinschreibung"), "«Dog» statt «dog»: freundlicher Hinweis auf Kleinschreibung");
await page.fill("#eingabe", "dog"); await page.click("[data-act=pruefen]");
ok((await page.evaluate(() => window.__LN.ui().runde.status)) === "richtig", "«dog» ist richtig");
ok((await page.locator(".rueck.gut [data-act=sag-en]").count()) === 1, "Aussprache zum Anhören");
await foto("16-englisch");
await page.click("[data-act=weiter]");
while ((await ansicht(page)) === "runde") { const st = await page.evaluate(() => window.__LN.ui().runde.status); if (st === "richtig" || st === "loesung") await page.click("[data-act=weiter]"); else await loese(page); }
ok((await stand(page)).fortschritt.englisch && Object.keys((await stand(page)).fortschritt.englisch).length >= 5, "Fortschritt im Fach Englisch");
await heim();
await keinPlatzhalter("Englisch");

// ---------- Mathe: Erklärung mit Check, Rechen-Werkstatt, Detektiv, Ergebnis, Probe ----------
await page.click("[data-act=fach][data-arg=mathe]");
ok((await page.locator("[data-act=erklaerungen] .zahl-badge").textContent()) === "6", "So geht's: sechs Erklärungen offen");
await page.click("[data-act=erklaerungen]");
ok((await page.locator(".thema-karte").count()) === 6, "eine Erklärung je Thema");
const erklaere = async (thema, richtigZuerst) => {
  await page.click(`[data-act=erkl][data-arg="mathe:${thema}"]`);
  while (await page.locator("[data-act=erkl-weiter]").count()) await page.click("[data-act=erkl-weiter]");
  const fo = await page.evaluate((th) => window.LN_FAECHER.find((f) => f.id === "mathe").themen.find((t) => t.id === th).erklaerung.slice(-1)[0].check, thema);
  const texte = await page.$$eval("[data-act=erkl-check]", (b) => b.map((x) => x.textContent));
  if (!richtigZuerst) { await page.click(`[data-act=erkl-check][data-arg="${texte.findIndex((t) => t !== fo.antwort)}"]`); ok((await page.locator(".erkl-check .rueck.tipp").count()) === 1, "falsche Check-Antwort: freundlicher Hinweis"); }
  await page.click(`[data-act=erkl-check][data-arg="${texte.indexOf(fo.antwort)}"]`);
};
let xp = (await stand(page)).punkte;
await erklaere("verstehen", false);
ok((await stand(page)).punkte === xp && !(await stand(page)).gesehen["mathe/verstehen"], "Check erst im zweiten Versuch: noch keine XP");
await foto("17-erklaerung-check");
await page.click("[data-act=erkl-fertig]");
ok((await ansicht(page)) === "erklaerungen", "Fertig führt zurück zur Liste");
await erklaere("verstehen", true);
await levelUpZu(page);
ok((await stand(page)).punkte === xp + 15 && (await stand(page)).gesehen["mathe/verstehen"] === H, "Check auf Anhieb: +15 XP, gemerkt");
await page.click("[data-act=erkl-fertig]");
await levelUpZu(page);
ok((await page.locator(".thema-karte.geschafft").count()) === 1, "geschaffte Erklärung ist markiert");
await heim();
// Werkstatt
await page.click("[data-act=themen]");
await page.click("[data-act=thema][data-arg=combo]");
ok((await page.locator("[data-act=erkl].haupt").count()) === 1, "neues Thema: Erklärung wird zuerst angeboten");
await page.click("[data-act=etappe-los]");
const setzeAufgabe = (teil, modus, seed) => page.evaluate(([teil, modus, seed]) => { const R = window.__LN.ui().runde; R.specs.splice(R.i + 1, 0, { teil, modus, seed }); }, [teil, modus, seed]);
const naechste = async () => { const st = await page.evaluate(() => window.__LN.ui().runde.status); if (st === "offen" || st === "tipp") await loese(page); await page.click("[data-act=weiter]"); };
await setzeAufgabe("m-d4", "teilen-werkstatt", 21);
await naechste();
let mm = (await stand(page)).muenzen;
t = await aufgabe(page);
ok(t.art === "division" && (await page.locator(".leiter").count()) === 1 && (await page.locator(".moves .move").count()) === 4, "Werkstatt mit Moves-Leiste und Einmaleins-Leiter");
{
  const { divSchritt, tippeDivision } = await import("./helfer.mjs");
  let z = await divSchritt(page);
  await tippeDivision(page, z.start, "start", z.anfaenge);
  z = await divSchritt(page);
  ok(z.typ === "ziffer" && (await page.textContent(".prompt")).includes("Wie oft passt"), "geführt: Frage zum Teilen");
  await tippeDivision(page, z.wert + 1 > 9 ? z.wert - 1 : z.wert + 1, "ziffer");
  const hinweis = await page.textContent(".prompt");
  ok(/Zu viel|noch mehr/.test(hinweis), `falsche Ziffer: Hinweis erklärt den Fehler («${hinweis}»)`);
  await foto("18-werkstatt-hinweis");
  ok((await stand(page)).fehler.mathe.includes(t.teil), "Fehler kommt in die Fehlerkiste");
  await loese(page);
  ok((await page.evaluate(() => window.__LN.ui().runde.status)) === "richtig" && (await stand(page)).muenzen === mm, "mit einem Fehler geschafft: keine Münze");
}
await page.click("[data-act=weiter]");
await setzeAufgabe("m-d3", "teilen-werkstatt", 22);
await naechste();
mm = (await stand(page)).muenzen;
// fehlerfrei mit der Tastatur
for (let i = 0; i < 60; i++) {
  const { divSchritt } = await import("./helfer.mjs"); const z = await divSchritt(page);
  if (z.status !== "offen") break;
  if (z.typ === "start") await page.click(`[data-act=div-start][data-arg="${z.anfaenge.indexOf(z.start)}"]`);
  else if (z.typ === "runter") await page.keyboard.press("Enter");
  else { await page.keyboard.type(String(z.wert)); if (z.typ !== "ziffer") await page.keyboard.press("Enter"); }
}
ok((await page.evaluate(() => window.__LN.ui().runde.status)) === "richtig" && (await page.locator(".stempel").count()) === 1 && (await stand(page)).muenzen === mm + 1, "fehlerfrei mit der Tastatur: Perfekt-Stempel und Münze");
await foto("19-werkstatt-perfekt");
await page.click("[data-act=weiter]");
await setzeAufgabe("m-d3", "teilen-profi", 23);
await naechste();
{
  const { divSchritt, tippeDivision } = await import("./helfer.mjs");
  ok((await page.locator(".leiter").count()) === 0, "Profi-Modus: ohne Leiter");
  const z = await divSchritt(page);
  const vorher = await page.evaluate(() => window.__LN.ui().runde.specs.length);
  await tippeDivision(page, z.anfaenge.find((a) => a !== z.start), "start", z.anfaenge);
  await tippeDivision(page, z.anfaenge.find((a) => a !== z.start), "start", z.anfaenge);
  ok((await page.textContent(".prompt")).includes("Ich trage es für dich ein"), "zweimal falsch: die App hilft und trägt ein");
  await loese(page);
  ok((await page.evaluate(() => window.__LN.ui().runde.status)) === "loesung" && (await page.evaluate(() => window.__LN.ui().runde.specs.length)) === vorher + 1, "mit Hilfe geschafft: kommt mit neuen Zahlen noch einmal");
}
await page.click("[data-act=weiter]");
await setzeAufgabe("m-det-null", "detektiv", 24);
await naechste();
t = await aufgabe(page);
await falsch(page);
ok((await page.locator(".zeile.falsch").count()) === 1 && (await page.evaluate(() => window.__LN.ui().runde.status)) === "tipp", "Detektiv: falsche Zeile rot, Tipp");
await loese(page);
ok((await page.locator(".zeile.richtig").count()) === 1 && (await page.textContent(".rueck.gut")).length > 10, "Detektiv: Fehlerzeile gefunden");
await foto("20-detektiv");
await page.click("[data-act=weiter]");
await setzeAufgabe("m-rest4", "teilen-ergebnis", 25);
await naechste();
t = await aufgabe(page);
await page.fill("#eingabe", String(t.loesung.q)); await page.click("[data-act=pruefen]");
ok((await page.textContent(".rueck.tipp")).includes("Rest"), "Ergebnis ohne Rest: Hinweis auf den Rest");
await page.fill("#eingabe-rest", String(t.loesung.r)); await page.click("[data-act=pruefen]");
ok((await page.evaluate(() => window.__LN.ui().runde.status)) === "richtig", "mit Rest richtig");
await page.click("[data-act=pause-runde]");
// Lernkarten mit Beispielrechnung
await page.click("[data-act=karten]");
await page.click("[data-act=karten-thema][data-arg=combo]");
ok((await page.locator(".karten-rechnung .rechnung").count()) >= 3, "Lernkarten zeigen durchgerechnete Beispiele");
await heim();
// Probe: auf Papier rechnen, Ergebnis eingeben
await page.click("[data-act=probe-start]");
await page.click("[data-act=probe-los]");
let mp = 0;
while ((await ansicht(page)) === "probe" && mp < 40) { await loese(page, { probe: true }); mp++; }
ok((await ansicht(page)) === "probe-ende" && (await stand(page)).proben.mathe[0].prozent === 100, "Mathe-Probe mit 100 %");
await heim();
await keinPlatzhalter("Mathe");
await page.click("[data-act=fach][data-arg=bio]");

// ---------- Sicherung ----------
await langDruecken(page, "#eltern-knopf", 450);
await page.click("[data-act=eltern-reiter][data-arg=sicherung]");
const [dl] = await Promise.all([page.waitForEvent("download"), page.click("[data-act=sicherung]")]);
const datei = await dl.path();
const inhalt = JSON.parse(fs.readFileSync(datei, "utf8"));
ok(inhalt.app === "lernnest" && inhalt.stand.name === "Testkind" && inhalt.version === VERSION, "Sicherungsdatei enthält den Stand");
ok((await page.textContent("#version")).includes("gesichert"), "Version zeigt: gesichert");
const vorher = await stand(page);
await page.click("[data-act=reset]");
await page.click("[data-act=reset-ja]");
ok((await ansicht(page)) === "willkommen" && (await stand(page)).muenzen === 0, "zurückgesetzt");
await einrichten(page, "Test", "panda", "Pan");
await langDruecken(page, "#eltern-knopf", 450);
await page.click("[data-act=eltern-reiter][data-arg=sicherung]");
await page.setInputFiles("#sicherung-datei", datei);
await page.waitForFunction(() => window.__LN.stand().name === "Testkind", null, { timeout: 5000 });
s = await stand(page);
ok(s.muenzen === vorher.muenzen && s.tier.name === "Fuchsi" && s.proben[FID].length === 1, "Sicherung geladen, alles wieder da");
ok((await ansicht(page)) === "start", "nach dem Laden: Startseite");
await langDruecken(page, "#eltern-knopf", 450);
await page.click("[data-act=eltern-reiter][data-arg=sicherung]");
// Sicherung als Text (für ältere iPads)
await page.click("[data-act=text-kopieren]");
const text = await page.inputValue("#sicher-text");
ok(JSON.parse(text).app === "lernnest" && JSON.parse(text).stand.name === "Testkind", "Sicherung als Text enthält den Stand");
await page.evaluate(() => { const s = window.__LN.stand(); s.muenzen = 1; window.__LN.speichern(); });
await page.fill("#lade-text", text); await page.click("[data-act=text-laden]");
ok((await stand(page)).muenzen === JSON.parse(text).stand.muenzen, "Sicherung aus Text geladen");
await langDruecken(page, "#eltern-knopf", 450);
await page.click("[data-act=eltern-reiter][data-arg=sicherung]");
await page.setInputFiles("#sicherung-datei", { name: "x.json", mimeType: "application/json", buffer: Buffer.from('{"hallo":1}') });
await page.waitForTimeout(300);
ok((await stand(page)).name === "Testkind", "falsche Datei ändert nichts");

ok(fehler.length === 0, "keine Fehler in der Konsole: " + fehler.join(" | "));
await zu();
ende();
