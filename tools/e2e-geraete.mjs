// iPad hochkant und quer, Handy: nichts ragt seitlich heraus, Tippflächen groß genug, Eingabeschrift mindestens 16 px
// (sonst zoomt Safari beim Tippen). Jede Aufgabenart wird einmal angezeigt.
// Aufruf: node tools/e2e-geraete.mjs [ordner-für-screenshots]
import fs from "node:fs";
import { oeffne, einrichten, ansicht, loese, pruefer, IPAD_HOCH, IPAD_QUER, HANDY, langDruecken } from "./helfer.mjs";
import { starteServer, starteBrowser } from "./server.mjs";

const bilder = process.argv[2];
if (bilder) fs.mkdirSync(bilder, { recursive: true });
const { ok, ende } = pruefer("Geräte");
const server = await starteServer();
const browser = await starteBrowser();

async function messe(page, wo) {
  const r = await page.evaluate(() => {
    const breit = document.documentElement.scrollWidth - window.innerWidth;
    const klein = [...document.querySelectorAll("input:not([type=checkbox]):not([type=file]), select")].filter((e) => e.offsetParent && parseFloat(getComputedStyle(e).fontSize) < 16).map((e) => e.id || e.tagName);
    const ziele = [...document.querySelectorAll("#app button:not([disabled])")].filter((e) => e.offsetParent !== null || e.tagName === "g").map((e) => { const b = e.getBoundingClientRect(); return { t: (e.textContent || e.className.baseVal || "").trim().slice(0, 30), h: b.height, w: b.width, c: e.className.baseVal || e.className }; });
    const zuKlein = ziele.filter((z) => !/eltern-knopf|tipp-knopf|leise-btn/.test(z.c) && (z.h < 40 || z.w < 40));
    return { breit, klein, zuKlein };
  });
  ok(r.breit <= 1, `${wo}: nichts ragt seitlich heraus (${r.breit} px)`);
  ok(!r.klein.length, `${wo}: Eingabeschrift mind. 16 px (${r.klein.join(",")})`);
  ok(!r.zuKlein.length, `${wo}: Tippflächen mind. 40 px (${JSON.stringify(r.zuKlein.slice(0, 3))})`);
}

for (const [name, vp] of [["iPad hochkant", IPAD_HOCH], ["iPad quer", IPAD_QUER], ["Handy", HANDY]]) {
  const { page, fehler, zu } = await oeffne({ viewport: vp, server, browser });
  const foto = async (n) => { if (bilder) await page.screenshot({ path: `${bilder}/${name.replace(/ /g, "-")}-${n}.png`, fullPage: true }); };
  await messe(page, name + " Willkommen");
  await einrichten(page);
  await messe(page, name + " Start");
  await foto("start");
  // Jede Aufgabenart einmal: Aufgaben direkt erzeugen lassen
  const arten = new Set();
  await page.click("[data-act=mission]");
  await page.click("[data-act=etappe-los]");
  const teile = await page.evaluate(() => { const f = window.LN_FAECHER[0]; return window.LN.fachTeile(f).map((t) => ({ id: t.id, modi: [...new Set(window.LN.modi(t.karte))] })); });
  for (const t of teile) for (const m of t.modi) {
    const art = await page.evaluate(([id, modus]) => { const f = window.LN_FAECHER[0]; const R = window.__LN.ui().runde; R.specs.splice(R.i + 1, 0, { teil: id, modus, seed: 5 }); return window.LN.makeTask(f, id, modus, 5).art; }, [t.id, m]);
    if (arten.has(art + m)) { await page.evaluate(() => { const R = window.__LN.ui().runde; R.specs.splice(R.i + 1, 1); }); continue; }
    arten.add(art + m);
    // zur eingefügten Aufgabe springen
    const st = await page.evaluate(() => window.__LN.ui().runde.status);
    if (st === "offen" || st === "tipp") await loese(page);
    await page.click("[data-act=weiter]");
    if ((await ansicht(page)) !== "runde") break;
    await messe(page, `${name} ${m}`);
    await foto("aufgabe-" + m);
    if (m === "bild-tippen") {
      // Daneben tippen (16 px schräg neben die richtige Stelle) zählt trotzdem für die nächste Stelle
      const t = await page.evaluate(() => window.__LN.aufgabe());
      const b = await page.locator(`[data-act=tippen][data-arg="${t.loesung}"] circle.ring`).boundingBox();
      await page.mouse.click(b.x + b.width / 2 + 11, b.y + b.height / 2 + 11);
      ok((await page.evaluate(() => window.__LN.ui().runde.status)) === "richtig", `${name}: knapp daneben getippt zählt für die nächste Stelle`);
    }
  }
  ok(arten.size >= 9, `${name}: alle Aufgabenarten angezeigt (${arten.size})`);
  await page.click("[data-act=pause-runde]");
  await page.click(".kachel[data-act=tier]");
  await messe(page, name + " Tier");
  await foto("tier");
  await page.click("[data-act=heim]");
  await langDruecken(page, "#eltern-knopf", 450);
  for (const r of ["fortschritt", "plan", "einst", "sicherung"]) { await page.click(`[data-act=eltern-reiter][data-arg=${r}]`); await messe(page, `${name} Eltern ${r}`); }
  ok(fehler.length === 0, `${name}: keine Fehler in der Konsole ` + fehler.join(" | "));
  await zu();
}
await browser.close(); await server.stop();
ende();
