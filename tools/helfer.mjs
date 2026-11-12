// Gemeinsame Helfer für die Browser-Tests: App öffnen, Aufgaben über die Oberfläche lösen.
import { starteServer, starteBrowser } from "./server.mjs";
import fs from "node:fs";
import path from "node:path";
import { PUBLIC } from "./lade.mjs";

export const VERSION = Number((fs.readFileSync(path.join(PUBLIC, "version.js"), "utf8").match(/n:\s*(\d+)/) || [])[1]);
export const IPAD_HOCH = { width: 820, height: 1180 };
export const IPAD_QUER = { width: 1180, height: 820 };
export const HANDY = { width: 390, height: 844 };

export async function oeffne({ test = {}, viewport = IPAD_HOCH, server, browser } = {}) {
  const srv = server || (await starteServer());
  const b = browser || (await starteBrowser());
  const ctx = await b.newContext({ viewport, hasTouch: true, acceptDownloads: true });
  const t = Object.assign({ seed: 11, pauseMs: 150, keinSW: true, heute: "2026-11-12", elternMs: 200, download: true }, test);
  await ctx.addInitScript((x) => { window.__LN_TEST = x; }, t);
  const page = await ctx.newPage();
  const fehler = [];
  page.on("pageerror", (e) => fehler.push("Seitenfehler: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon/.test(m.text())) fehler.push("Konsole: " + m.text()); });
  await page.goto(srv.url);
  return { srv, b, ctx, page, fehler, zu: async () => { await ctx.close(); if (!browser) await b.close(); if (!server) await srv.stop(); } };
}

export async function einrichten(page, name = "Testkind", art = "fuchs", tiername = "Flocke") {
  await page.fill("#name", name); await page.click("[data-act=w-name]");
  await page.click(`[data-act=w-tier][data-arg=${art}]`); await page.click("[data-act=w-tier-ok]");
  await page.fill("#tiername", tiername); await page.click("[data-act=w-fertig]");
  await page.waitForSelector(".mission");
}

export const aufgabe = (page) => page.evaluate(() => window.__LN.aufgabe());
export const ansicht = (page) => page.evaluate(() => window.__LN.ui().ansicht);
export const stand = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.__LN.stand())));

// Aufgabe richtig lösen, so wie ein Kind tippen würde
export async function loese(page, { probe = false } = {}) {
  const t = await aufgabe(page);
  const pruef = probe ? "[data-act=probe-weiter]" : "[data-act=pruefen]";
  switch (t.art) {
    case "wahl": await page.click(`[data-act=waehle][data-arg="${t.optionen.indexOf(t.loesung)}"]`); if (probe) await page.click(pruef); break;
    case "wahr": await page.click(`[data-act=waehle][data-arg="${t.loesung ? 0 : 1}"]`); if (probe) await page.click(pruef); break;
    case "tippen": await page.click(`[data-act=tippen][data-arg="${t.loesung}"]`); if (probe) await page.click(pruef); break;
    case "mehr": for (const x of t.loesung) await page.click(`[data-act=mehr][data-arg="${t.optionen.indexOf(x)}"]`); await page.click(pruef); break;
    case "reihe":
      while (await page.locator("[data-act=reihe-raus]:not([disabled])").count()) await page.locator("[data-act=reihe-raus]:not([disabled])").first().click();
      for (const x of t.loesung) await page.click(`[data-act=reihe-rein][data-arg="${t.items.indexOf(x)}"]`);
      await page.click(pruef); break;
    case "paare":
      for (const l of t.links) { await page.click(`[data-act=paar-l][data-arg="${t.links.indexOf(l)}"]`); await page.click(`[data-act=paar-r][data-arg="${t.rechts.indexOf(t.loesung[l])}"]`); }
      await page.click(pruef); break;
    case "luecke":
      for (let i = 0; i < t.loesung.length; i++) {
        await page.click(`[data-act=luecke][data-arg="${i}"]`);
        const idx = await page.evaluate((w) => [...document.querySelectorAll("[data-act=wort]")].findIndex((b) => !b.disabled && b.textContent === w), t.loesung[i]);
        await page.click(`[data-act=wort][data-arg="${idx}"]`);
      }
      await page.click(pruef); break;
    case "schreiben": case "zahl": await page.fill("#eingabe", String(t.loesung)); await page.click(pruef); break;
    default: throw new Error("unbekannte Art " + t.art);
  }
  return t;
}

// Aufgabe falsch beantworten (bei Auswahl: eine falsche Option)
export async function falsch(page) {
  const t = await aufgabe(page);
  switch (t.art) {
    case "wahl": { const i = await page.evaluate((l) => [...document.querySelectorAll("[data-act=waehle]")].findIndex((b) => !b.disabled && b.textContent !== l), t.loesung); await page.click(`[data-act=waehle][data-arg="${i}"]`); break; }
    case "wahr": await page.click(`[data-act=waehle][data-arg="${t.loesung ? 1 : 0}"]`); break;
    case "tippen": { const nr = await page.evaluate((l) => [...document.querySelectorAll("[data-act=tippen]")].filter((g) => !g.classList.contains("falsch")).map((g) => Number(g.dataset.arg)).find((n) => n !== l), t.loesung); await page.click(`[data-act=tippen][data-arg="${nr}"]`); break; }
    case "mehr": { const x = t.optionen.find((o) => !t.loesung.includes(o)); await page.click(`[data-act=mehr][data-arg="${t.optionen.indexOf(x)}"]`); await page.click("[data-act=pruefen]"); break; }
    case "reihe": for (const x of t.loesung.slice().reverse()) await page.click(`[data-act=reihe-rein][data-arg="${t.items.indexOf(x)}"]`); await page.click("[data-act=pruefen]"); break;
    case "paare": {
      const r = t.links.map((l) => t.loesung[l]); r.push(r.shift());
      for (let i = 0; i < t.links.length; i++) { await page.click(`[data-act=paar-l][data-arg="${i}"]`); await page.click(`[data-act=paar-r][data-arg="${t.rechts.indexOf(r[i])}"]`); }
      await page.click("[data-act=pruefen]"); break;
    }
    case "luecke": {
      for (let i = 0; i < t.loesung.length; i++) {
        await page.click(`[data-act=luecke][data-arg="${i}"]`);
        const idx = await page.evaluate((w) => [...document.querySelectorAll("[data-act=wort]")].findIndex((b) => !b.disabled && b.textContent !== w), t.loesung[i]);
        await page.click(`[data-act=wort][data-arg="${idx}"]`);
      }
      await page.click("[data-act=pruefen]"); break;
    }
    case "schreiben": await page.fill("#eingabe", "Quatschwort"); await page.click("[data-act=pruefen]"); break;
    case "zahl": await page.fill("#eingabe", String(t.loesung + 7)); await page.click("[data-act=pruefen]"); break;
  }
  return t;
}

// Eine ganze Etappe richtig spielen (ab Etappen-Start), liefert die Anzahl Aufgaben
export async function spieleEtappe(page, { fehlerBei = [] } = {}) {
  await page.click("[data-act=etappe-los]");
  let n = 0;
  while ((await ansicht(page)) === "runde") {
    const status = await page.evaluate(() => window.__LN.ui().runde.status);
    if (status === "richtig" || status === "loesung") { await page.click("[data-act=weiter]"); continue; }
    if (fehlerBei.includes(n) && status === "offen") { await falsch(page); n++; continue; }
    await loese(page); n++;
  }
  return n;
}

export async function langDruecken(page, sel, ms) {
  await page.locator(sel).scrollIntoViewIfNeeded();
  const box = await page.locator(sel).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await page.waitForTimeout(ms); await page.mouse.up();
}

export function pruefer(name) {
  let n = 0; const fehler = [];
  const ok = (bed, text) => { n++; if (!bed) { fehler.push(text); console.log("FAIL " + text); } };
  const ende = () => { if (fehler.length) { console.log(`${name}: ${fehler.length} von ${n} Prüfungen fehlgeschlagen`); process.exit(1); } console.log(`${name}: alle ${n} Prüfungen bestanden`); };
  return { ok, ende };
}
